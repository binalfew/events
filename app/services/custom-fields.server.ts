import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { CUSTOM_FIELD_LIMITS } from "~/config/custom-fields";
import type {
  CreateCustomFieldInput,
  UpdateCustomFieldInput,
  ReorderFieldsInput,
} from "~/lib/schemas/custom-field";

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function listCustomFields(
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

export async function createCustomField(input: CreateCustomFieldInput, ctx: ServiceContext) {
  // Verify event belongs to tenant
  const event = await prisma.event.findFirst({
    where: { id: input.eventId, tenantId: ctx.tenantId },
  });
  if (!event) {
    throw new CustomFieldError("Event not found or does not belong to your organization", 404);
  }

  // Verify participantType belongs to event (if provided)
  if (input.participantTypeId) {
    const pt = await prisma.participantType.findFirst({
      where: { id: input.participantTypeId, eventId: input.eventId, tenantId: ctx.tenantId },
    });
    if (!pt) {
      throw new CustomFieldError(
        "Participant type not found or does not belong to this event",
        404,
      );
    }
  }

  // Enforce tenant-wide limit
  const tenantCount = await prisma.fieldDefinition.count({
    where: { tenantId: ctx.tenantId },
  });
  if (tenantCount >= CUSTOM_FIELD_LIMITS.maxPerTenant) {
    throw new CustomFieldError(
      `Tenant limit reached: maximum ${CUSTOM_FIELD_LIMITS.maxPerTenant} custom fields per organization`,
      422,
    );
  }

  // Enforce per-event limit
  const eventCount = await prisma.fieldDefinition.count({
    where: { tenantId: ctx.tenantId, eventId: input.eventId },
  });
  if (eventCount >= CUSTOM_FIELD_LIMITS.maxPerEvent) {
    throw new CustomFieldError(
      `Event limit reached: maximum ${CUSTOM_FIELD_LIMITS.maxPerEvent} custom fields per event`,
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

    logger.info({ fieldId: field.id, tenantId: ctx.tenantId }, "Custom field created");

    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "CREATE",
        entityType: "FieldDefinition",
        entityId: field.id,
        description: `Created custom field "${input.label}" (${input.name})`,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { name: input.name, dataType: input.dataType, entityType: input.entityType },
      },
    });

    return field;
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new CustomFieldError(
        `A field with name "${input.name}" already exists for this event and entity type`,
        409,
      );
    }
    throw error;
  }
}

export async function updateCustomField(
  id: string,
  input: UpdateCustomFieldInput,
  ctx: ServiceContext,
) {
  const existing = await prisma.fieldDefinition.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new CustomFieldError("Custom field not found", 404);
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

    logger.info({ fieldId: id, tenantId: ctx.tenantId }, "Custom field updated");

    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "UPDATE",
        entityType: "FieldDefinition",
        entityId: id,
        description: `Updated custom field "${field.label}" (${field.name})`,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          before: { name: existing.name, label: existing.label, dataType: existing.dataType },
          after: { name: field.name, label: field.label, dataType: field.dataType },
        },
      },
    });

    return field;
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new CustomFieldError(
        `A field with name "${input.name}" already exists for this event and entity type`,
        409,
      );
    }
    throw error;
  }
}

export async function deleteCustomField(
  id: string,
  ctx: ServiceContext,
  options: { force?: boolean } = {},
) {
  const existing = await prisma.fieldDefinition.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new CustomFieldError("Custom field not found", 404);
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
      throw new CustomFieldError(
        `Cannot delete: ${Number(hasData[0].count)} record(s) have data for this field. Use force=true to delete anyway.`,
        422,
      );
    }
  }

  await prisma.fieldDefinition.delete({ where: { id } });

  logger.info({ fieldId: id, tenantId: ctx.tenantId }, "Custom field deleted");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "FieldDefinition",
      entityId: id,
      description: `Deleted custom field "${existing.label}" (${existing.name})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { name: existing.name, dataType: existing.dataType },
    },
  });

  return { success: true };
}

export async function reorderCustomFields(input: ReorderFieldsInput, ctx: ServiceContext) {
  // Verify all fields belong to this tenant
  const fields = await prisma.fieldDefinition.findMany({
    where: { id: { in: input.fieldIds }, tenantId: ctx.tenantId },
    select: { id: true },
  });

  const foundIds = new Set(fields.map((f) => f.id));
  const missing = input.fieldIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new CustomFieldError(`Fields not found or not accessible: ${missing.join(", ")}`, 404);
  }

  await prisma.$transaction(
    input.fieldIds.map((fieldId, index) =>
      prisma.fieldDefinition.update({
        where: { id: fieldId },
        data: { sortOrder: index },
      }),
    ),
  );

  logger.info({ tenantId: ctx.tenantId, count: input.fieldIds.length }, "Custom fields reordered");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "FieldDefinition",
      description: `Reordered ${input.fieldIds.length} custom fields`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { fieldIds: input.fieldIds },
    },
  });

  return { success: true };
}

// Error class for service-layer errors with HTTP status codes
export class CustomFieldError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "CustomFieldError";
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
