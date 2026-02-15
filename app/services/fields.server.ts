import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { FIELD_LIMITS } from "~/config/fields";
import { ensureFieldIndex, dropFieldIndex } from "~/services/field-query.server";
import type { CreateFieldInput, UpdateFieldInput, ReorderFieldsInput } from "~/lib/schemas/field";

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function listFields(
  tenantId: string,
  filters: {
    eventId?: string;
    participantTypeId?: string;
    entityType?: string;
    dataType?: string;
    search?: string;
  } = {},
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.eventId) where.eventId = filters.eventId;
  if (filters.participantTypeId) where.participantTypeId = filters.participantTypeId;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.dataType) where.dataType = filters.dataType;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { label: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const fields = await prisma.fieldDefinition.findMany({
    where,
    orderBy: { sortOrder: "asc" },
  });

  return fields;
}

export async function createField(input: CreateFieldInput, ctx: ServiceContext) {
  // Verify event belongs to tenant
  const event = await prisma.event.findFirst({
    where: { id: input.eventId, tenantId: ctx.tenantId },
  });
  if (!event) {
    throw new FieldError("Event not found or does not belong to your organization", 404);
  }

  // Verify participantType belongs to event (if provided)
  if (input.participantTypeId) {
    const pt = await prisma.participantType.findFirst({
      where: { id: input.participantTypeId, eventId: input.eventId, tenantId: ctx.tenantId },
    });
    if (!pt) {
      throw new FieldError("Participant type not found or does not belong to this event", 404);
    }
  }

  // Enforce tenant-wide limit
  const tenantCount = await prisma.fieldDefinition.count({
    where: { tenantId: ctx.tenantId },
  });
  if (tenantCount >= FIELD_LIMITS.maxPerTenant) {
    throw new FieldError(
      `Tenant limit reached: maximum ${FIELD_LIMITS.maxPerTenant} fields per organization`,
      422,
    );
  }

  // Enforce per-event limit
  const eventCount = await prisma.fieldDefinition.count({
    where: { tenantId: ctx.tenantId, eventId: input.eventId },
  });
  if (eventCount >= FIELD_LIMITS.maxPerEvent) {
    throw new FieldError(
      `Event limit reached: maximum ${FIELD_LIMITS.maxPerEvent} fields per event`,
      422,
    );
  }

  // Auto-calculate sortOrder
  const maxSort = await prisma.fieldDefinition.findFirst({
    where: { tenantId: ctx.tenantId, eventId: input.eventId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const nextSortOrder = (maxSort?.sortOrder ?? -1) + 1;

  try {
    const field = await prisma.fieldDefinition.create({
      data: {
        tenantId: ctx.tenantId,
        eventId: input.eventId,
        participantTypeId: input.participantTypeId ?? null,
        entityType: input.entityType,
        name: input.name,
        label: input.label,
        description: input.description ?? null,
        dataType: input.dataType,
        sortOrder: nextSortOrder,
        isRequired: input.isRequired,
        isUnique: input.isUnique,
        isSearchable: input.isSearchable,
        isFilterable: input.isFilterable,
        defaultValue: input.defaultValue ?? null,
        config: input.config as object,
        validation: input.validation as object[],
      },
    });

    logger.info({ fieldId: field.id, tenantId: ctx.tenantId }, "Field created");

    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "CREATE",
        entityType: "FieldDefinition",
        entityId: field.id,
        description: `Created field "${input.label}" (${input.name})`,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { name: input.name, dataType: input.dataType, entityType: input.entityType },
      },
    });

    if (field.isSearchable || field.isFilterable) {
      ensureFieldIndex(field, ctx).catch((err) =>
        logger.error({ err, fieldId: field.id }, "Index creation failed after field create"),
      );
    }

    return field;
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new FieldError(
        `A field with name "${input.name}" already exists for this event and entity type`,
        409,
      );
    }
    throw error;
  }
}

export async function updateField(id: string, input: UpdateFieldInput, ctx: ServiceContext) {
  const existing = await prisma.fieldDefinition.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new FieldError("Field not found", 404);
  }

  try {
    const field = await prisma.fieldDefinition.update({
      where: { id },
      data: {
        ...(input.participantTypeId !== undefined && {
          participantTypeId: input.participantTypeId ?? null,
        }),
        ...(input.entityType !== undefined && { entityType: input.entityType }),
        ...(input.name !== undefined && { name: input.name }),
        ...(input.label !== undefined && { label: input.label }),
        ...(input.description !== undefined && { description: input.description ?? null }),
        ...(input.dataType !== undefined && { dataType: input.dataType }),
        ...(input.isRequired !== undefined && { isRequired: input.isRequired }),
        ...(input.isUnique !== undefined && { isUnique: input.isUnique }),
        ...(input.isSearchable !== undefined && { isSearchable: input.isSearchable }),
        ...(input.isFilterable !== undefined && { isFilterable: input.isFilterable }),
        ...(input.defaultValue !== undefined && { defaultValue: input.defaultValue ?? null }),
        ...(input.config !== undefined && { config: input.config as object }),
        ...(input.validation !== undefined && { validation: input.validation as object[] }),
      },
    });

    logger.info({ fieldId: id, tenantId: ctx.tenantId }, "Field updated");

    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "UPDATE",
        entityType: "FieldDefinition",
        entityId: id,
        description: `Updated field "${field.label}" (${field.name})`,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          before: { name: existing.name, label: existing.label, dataType: existing.dataType },
          after: { name: field.name, label: field.label, dataType: field.dataType },
        },
      },
    });

    const searchabilityChanged =
      existing.isSearchable !== field.isSearchable || existing.isFilterable !== field.isFilterable;
    if (searchabilityChanged) {
      const indexFn = field.isSearchable || field.isFilterable ? ensureFieldIndex : dropFieldIndex;
      indexFn(field, ctx).catch((err) =>
        logger.error({ err, fieldId: field.id }, "Index update failed after field update"),
      );
    }

    return field;
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new FieldError(
        `A field with name "${input.name}" already exists for this event and entity type`,
        409,
      );
    }
    throw error;
  }
}

export async function deleteField(
  id: string,
  ctx: ServiceContext,
  options: { force?: boolean } = {},
) {
  const existing = await prisma.fieldDefinition.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new FieldError("Field not found", 404);
  }

  // Check if any participant has data for this field (unless force)
  if (!options.force) {
    const entityTable = existing.entityType === "Event" ? "Event" : "Participant";
    const hasData = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "${entityTable}" WHERE "tenantId" = $1 AND extras ? $2`,
      ctx.tenantId,
      existing.name,
    );
    if (hasData[0] && Number(hasData[0].count) > 0) {
      throw new FieldError(
        `Cannot delete: ${Number(hasData[0].count)} record(s) have data for this field. Use force=true to delete anyway.`,
        422,
      );
    }
  }

  await prisma.fieldDefinition.delete({ where: { id } });

  logger.info({ fieldId: id, tenantId: ctx.tenantId }, "Field deleted");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "FieldDefinition",
      entityId: id,
      description: `Deleted field "${existing.label}" (${existing.name})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { name: existing.name, dataType: existing.dataType },
    },
  });

  if (existing.isSearchable || existing.isFilterable) {
    dropFieldIndex(existing, ctx).catch((err) =>
      logger.error({ err, fieldId: id }, "Index drop failed after field delete"),
    );
  }

  return { success: true };
}

export async function reorderFields(input: ReorderFieldsInput, ctx: ServiceContext) {
  // Verify all fields belong to this tenant
  const fields = await prisma.fieldDefinition.findMany({
    where: { id: { in: input.fieldIds }, tenantId: ctx.tenantId },
    select: { id: true },
  });

  const foundIds = new Set(fields.map((f) => f.id));
  const missing = input.fieldIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new FieldError(`Fields not found or not accessible: ${missing.join(", ")}`, 404);
  }

  await prisma.$transaction(
    input.fieldIds.map((fieldId, index) =>
      prisma.fieldDefinition.update({
        where: { id: fieldId },
        data: { sortOrder: index },
      }),
    ),
  );

  logger.info({ tenantId: ctx.tenantId, count: input.fieldIds.length }, "Fields reordered");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "FieldDefinition",
      description: `Reordered ${input.fieldIds.length} fields`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { fieldIds: input.fieldIds },
    },
  });

  return { success: true };
}

export async function getFieldDataCount(fieldId: string, tenantId: string): Promise<number> {
  const field = await prisma.fieldDefinition.findFirst({
    where: { id: fieldId, tenantId },
    select: { name: true, entityType: true },
  });
  if (!field) return 0;

  const entityTable = field.entityType === "Event" ? "Event" : "Participant";
  const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*) as count FROM "${entityTable}" WHERE "tenantId" = $1 AND extras ? $2`,
    tenantId,
    field.name,
  );
  return result[0] ? Number(result[0].count) : 0;
}

// Error class for service-layer errors with HTTP status codes
export class FieldError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "FieldError";
  }
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
