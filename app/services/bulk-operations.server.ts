import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { getEffectiveFields } from "./fields.server";
import { parseImportFile } from "~/services/bulk-import/parser.server";
import {
  suggestColumnMappings,
  applyMappings,
  FIXED_PARTICIPANT_FIELDS,
} from "~/services/bulk-import/column-mapper.server";
import { validateImportRows } from "~/services/bulk-import/validator.server";
import { captureSnapshot, restoreFromSnapshot } from "~/services/bulk-import/undo.server";
import type { ColumnMapping } from "~/lib/schemas/bulk-operation";
import type { FieldInfo } from "~/services/bulk-import/column-mapper.server";

// ─── Constants ───────────────────────────────────────────

const BATCH_SIZE = 50;
const UNDO_WINDOW_HOURS = 24;

// ─── Types ───────────────────────────────────────────────

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Errors ──────────────────────────────────────────────

export class BulkOperationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "BulkOperationError";
  }
}

// ─── Feature flag guard ──────────────────────────────────

async function ensureEnabled() {
  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.BULK_OPERATIONS);
  if (!enabled) {
    throw new BulkOperationError("Bulk operations feature is not enabled", 404);
  }
}

// ─── Create operation ────────────────────────────────────

export async function createBulkOperation(
  input: {
    eventId: string;
    type: string;
    description: string;
    fileBuffer?: Buffer;
    fileMimeType?: string;
    initialStatus?: string;
  },
  ctx: ServiceContext,
) {
  await ensureEnabled();

  const operation = await prisma.bulkOperation.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      type: input.type as any,
      status: (input.initialStatus ?? "VALIDATING") as any,
      description: input.description,
      createdBy: ctx.userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "BulkOperation",
      entityId: operation.id,
      description: `Created bulk operation: ${input.type} — ${input.description}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  logger.info({ operationId: operation.id, type: input.type }, "Bulk operation created");
  return operation;
}

// ─── Validate operation (parse file + validate rows) ─────

export async function validateOperation(
  operationId: string,
  fileBuffer: Buffer,
  fileMimeType: string,
  tenantId: string,
  columnMappings?: ColumnMapping[],
) {
  await ensureEnabled();

  const operation = await prisma.bulkOperation.findFirst({
    where: { id: operationId, tenantId },
  });
  if (!operation) throw new BulkOperationError("Operation not found", 404);
  if (operation.status !== "VALIDATING") {
    throw new BulkOperationError(`Cannot validate operation in ${operation.status} status`);
  }

  // Parse file
  const parseResult = await parseImportFile(fileBuffer, fileMimeType);
  if (parseResult.rows.length === 0) {
    throw new BulkOperationError("File contains no data rows");
  }

  // Get target fields (fixed + dynamic, includes global + event-specific)
  const dynamicFields = await getEffectiveFields(tenantId, operation.eventId, "Participant");
  const targetFields: FieldInfo[] = [
    ...FIXED_PARTICIPANT_FIELDS,
    ...dynamicFields.map((f) => ({
      name: f.name,
      label: f.label,
      isRequired: f.isRequired,
    })),
  ];

  // Auto-suggest or use provided mappings
  const mappings = columnMappings ?? suggestColumnMappings(parseResult.headers, targetFields);

  // Apply mappings
  const mappedRows = applyMappings(parseResult.rows, mappings);

  // Validate rows
  const validationResults = await validateImportRows(mappedRows, operation.eventId, tenantId);

  // Create BulkOperationItem per row
  const items = validationResults.map((result, i) => ({
    operationId,
    rowNumber: result.rowNumber,
    status: result.status,
    inputData: mappedRows[i] as any,
    errorMessage:
      result.errors.length > 0
        ? result.errors.map((e) => `${e.field}: ${e.message}`).join("; ")
        : result.warnings.length > 0
          ? result.warnings.map((w) => `${w.field}: ${w.message}`).join("; ")
          : null,
  }));

  // Batch create items
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    await prisma.bulkOperationItem.createMany({ data: batch });
  }

  // Update operation status to PREVIEW
  const validCount = validationResults.filter((r) => r.status === "valid").length;
  const warningCount = validationResults.filter((r) => r.status === "warning").length;
  const errorCount = validationResults.filter((r) => r.status === "error").length;

  const updated = await prisma.bulkOperation.update({
    where: { id: operationId },
    data: {
      status: "PREVIEW",
      totalItems: parseResult.rows.length,
      filters: {
        mappings,
        headers: parseResult.headers,
        delimiter: parseResult.delimiter,
        validCount,
        warningCount,
        errorCount,
      },
    },
  });

  logger.info(
    { operationId, totalRows: parseResult.rows.length, validCount, warningCount, errorCount },
    "Bulk operation validated",
  );

  return {
    operation: updated,
    headers: parseResult.headers,
    mappings,
    validCount,
    warningCount,
    errorCount,
    preview: validationResults.slice(0, 20),
  };
}

// ─── Confirm operation ───────────────────────────────────

export async function confirmOperation(
  operationId: string,
  ctx: ServiceContext,
  skipErrors = false,
) {
  await ensureEnabled();

  const operation = await prisma.bulkOperation.findFirst({
    where: { id: operationId, tenantId: ctx.tenantId },
  });
  if (!operation) throw new BulkOperationError("Operation not found", 404);
  if (operation.status !== "PREVIEW") {
    throw new BulkOperationError(`Cannot confirm operation in ${operation.status} status`);
  }

  await prisma.bulkOperation.update({
    where: { id: operationId },
    data: { status: "CONFIRMED" },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CONFIGURE",
      entityType: "BulkOperation",
      entityId: operationId,
      description: `Confirmed bulk operation (skipErrors: ${skipErrors})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  // Start execution
  const result = await executeOperation(operationId, ctx, skipErrors);
  return result;
}

// ─── Execute operation ───────────────────────────────────

export async function executeOperation(
  operationId: string,
  ctx: ServiceContext,
  skipErrors = false,
) {
  const operation = await prisma.bulkOperation.findUnique({
    where: { id: operationId },
  });
  if (!operation) throw new BulkOperationError("Operation not found", 404);

  await prisma.bulkOperation.update({
    where: { id: operationId },
    data: { status: "PROCESSING", startedAt: new Date() },
  });

  // Get items to process
  const statusFilter = skipErrors ? ["valid", "warning"] : ["valid", "warning"];
  const items = await prisma.bulkOperationItem.findMany({
    where: { operationId, status: { in: statusFilter } },
    orderBy: { rowNumber: "asc" },
  });

  let successCount = 0;
  let failureCount = 0;
  const createdParticipantIds: string[] = [];

  // Get default participantType and workflow for the event
  const [defaultPType, defaultWorkflow] = await Promise.all([
    prisma.participantType.findFirst({
      where: { tenantId: operation.tenantId, eventId: operation.eventId },
      select: { id: true },
    }),
    prisma.workflow.findFirst({
      where: { tenantId: operation.tenantId, eventId: operation.eventId },
      select: { id: true },
    }),
  ]);

  if (!defaultPType || !defaultWorkflow) {
    await prisma.bulkOperation.update({
      where: { id: operationId },
      data: {
        status: "FAILED",
        errorLog: { message: "Event missing participant type or workflow configuration" },
        completedAt: new Date(),
      },
    });
    throw new BulkOperationError(
      "Event must have at least one participant type and workflow configured",
    );
  }

  // Process in batches
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    for (const item of batch) {
      try {
        const inputData = item.inputData as Record<string, unknown>;
        const firstName = String(inputData.firstName ?? "").trim();
        const lastName = String(inputData.lastName ?? "").trim();

        if (!firstName || !lastName) {
          await prisma.bulkOperationItem.update({
            where: { id: item.id },
            data: {
              status: "error",
              errorMessage: "Missing required fields",
              processedAt: new Date(),
            },
          });
          failureCount++;
          continue;
        }

        // Build participant data
        const regCode =
          String(inputData.registrationCode ?? "").trim() ||
          `BULK-${operationId.slice(-6)}-${String(item.rowNumber).padStart(4, "0")}`;

        // Collect extras (non-fixed fields)
        const fixedFieldNames = new Set([
          "firstName",
          "lastName",
          "email",
          "organization",
          "jobTitle",
          "nationality",
          "registrationCode",
        ]);
        const extras: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(inputData)) {
          if (!fixedFieldNames.has(key) && value !== "") {
            extras[key] = value;
          }
        }

        const participant = await (prisma.participant.create as any)({
          data: {
            tenantId: operation.tenantId,
            eventId: operation.eventId,
            participantTypeId: defaultPType.id,
            workflowId: defaultWorkflow.id,
            registrationCode: regCode,
            firstName,
            lastName,
            email: String(inputData.email ?? "").trim() || null,
            organization: String(inputData.organization ?? "").trim() || null,
            jobTitle: String(inputData.jobTitle ?? "").trim() || null,
            nationality: String(inputData.nationality ?? "").trim() || null,
            status: "PENDING",
            extras: Object.keys(extras).length > 0 ? extras : {},
          },
        });

        createdParticipantIds.push(participant.id);

        await prisma.bulkOperationItem.update({
          where: { id: item.id },
          data: {
            status: "success",
            participantId: participant.id,
            processedAt: new Date(),
          },
        });

        successCount++;
      } catch (error: any) {
        logger.error({ error, itemId: item.id }, "Failed to process bulk operation item");
        await prisma.bulkOperationItem.update({
          where: { id: item.id },
          data: {
            status: "error",
            errorMessage: error.message ?? "Unknown error",
            processedAt: new Date(),
          },
        });
        failureCount++;
      }
    }

    // Update progress after each batch
    await prisma.bulkOperation.update({
      where: { id: operationId },
      data: {
        processedItems: successCount + failureCount,
        successCount,
        failureCount,
      },
    });
  }

  // Capture snapshot for undo
  if (createdParticipantIds.length > 0) {
    try {
      await captureSnapshot(operationId, createdParticipantIds);
    } catch (error) {
      logger.error({ error, operationId }, "Failed to capture snapshot");
    }
  }

  // Finalize
  const undoDeadline = new Date();
  undoDeadline.setHours(undoDeadline.getHours() + UNDO_WINDOW_HOURS);

  const finalOperation = await prisma.bulkOperation.update({
    where: { id: operationId },
    data: {
      status: failureCount > 0 && successCount === 0 ? "FAILED" : "COMPLETED",
      processedItems: successCount + failureCount,
      successCount,
      failureCount,
      completedAt: new Date(),
      undoDeadline,
    },
  });

  logger.info({ operationId, successCount, failureCount }, "Bulk operation execution complete");

  return finalOperation;
}

// ─── Undo operation ──────────────────────────────────────

export async function undoOperation(operationId: string, ctx: ServiceContext) {
  await ensureEnabled();

  const operation = await prisma.bulkOperation.findFirst({
    where: { id: operationId, tenantId: ctx.tenantId },
  });
  if (!operation) throw new BulkOperationError("Operation not found", 404);
  if (operation.status !== "COMPLETED") {
    throw new BulkOperationError("Only completed operations can be undone");
  }
  if (!operation.undoDeadline || new Date() > operation.undoDeadline) {
    throw new BulkOperationError("Undo deadline has passed (24-hour window)");
  }

  const { restoredCount, failedCount } = await restoreFromSnapshot(operationId);

  await prisma.bulkOperation.update({
    where: { id: operationId },
    data: {
      status: "ROLLED_BACK",
      rolledBackAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CONFIGURE",
      entityType: "BulkOperation",
      entityId: operationId,
      description: `Undid bulk operation (restored: ${restoredCount}, failed: ${failedCount})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  logger.info({ operationId, restoredCount, failedCount }, "Bulk operation undone");
  return { restoredCount, failedCount };
}

// ─── Get operation ───────────────────────────────────────

export async function getOperation(operationId: string, tenantId: string, page = 1, pageSize = 50) {
  const operation = await prisma.bulkOperation.findFirst({
    where: { id: operationId, tenantId },
  });
  if (!operation) throw new BulkOperationError("Operation not found", 404);

  const [items, totalItems] = await Promise.all([
    prisma.bulkOperationItem.findMany({
      where: { operationId },
      orderBy: { rowNumber: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bulkOperationItem.count({ where: { operationId } }),
  ]);

  return {
    operation,
    items,
    meta: {
      page,
      pageSize,
      total: totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
}

// ─── List operations ─────────────────────────────────────

export async function listOperations(
  eventId: string,
  tenantId: string,
  filters?: { type?: string; status?: string },
  page = 1,
  pageSize = 20,
) {
  const where: Record<string, unknown> = { tenantId, eventId };
  if (filters?.type) where.type = filters.type;
  if (filters?.status) where.status = filters.status;

  const [operations, total] = await Promise.all([
    prisma.bulkOperation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bulkOperation.count({ where }),
  ]);

  return {
    operations,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ─── Cancel operation ────────────────────────────────────

export async function cancelOperation(operationId: string, ctx: ServiceContext) {
  await ensureEnabled();

  const operation = await prisma.bulkOperation.findFirst({
    where: { id: operationId, tenantId: ctx.tenantId },
  });
  if (!operation) throw new BulkOperationError("Operation not found", 404);
  if (!["VALIDATING", "PREVIEW"].includes(operation.status)) {
    throw new BulkOperationError(`Cannot cancel operation in ${operation.status} status`);
  }

  // Delete items and operation
  await prisma.bulkOperationItem.deleteMany({ where: { operationId } });
  await prisma.bulkOperation.delete({ where: { id: operationId } });

  logger.info({ operationId }, "Bulk operation cancelled");
}
