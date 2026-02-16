import { createHash } from "node:crypto";
import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { FORM_TEMPLATE_LIMITS } from "~/config/form-templates";
import type { CreateFormTemplateInput, UpdateFormTemplateInput } from "~/lib/schemas/form-template";

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── List ────────────────────────────────────────────────

export async function listFormTemplates(
  tenantId: string,
  filters: {
    eventId?: string;
    participantTypeId?: string;
    isActive?: boolean;
    search?: string;
  } = {},
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.eventId) where.eventId = filters.eventId;
  if (filters.participantTypeId) where.participantTypeId = filters.participantTypeId;
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  } else {
    where.isActive = true;
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.formTemplate.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      event: { select: { id: true, name: true } },
      participantType: { select: { id: true, name: true, code: true } },
    },
  });
}

// ─── Get ─────────────────────────────────────────────────

export async function getFormTemplate(id: string, tenantId: string) {
  const template = await prisma.formTemplate.findFirst({
    where: { id, tenantId },
    include: {
      event: { select: { id: true, name: true } },
      participantType: { select: { id: true, name: true, code: true } },
      versions: { orderBy: { version: "desc" }, take: 10 },
    },
  });
  if (!template) {
    throw new FormTemplateError("Form template not found", 404);
  }
  return template;
}

// ─── Create ──────────────────────────────────────────────

export async function createFormTemplate(input: CreateFormTemplateInput, ctx: ServiceContext) {
  // Verify event belongs to tenant
  const event = await prisma.event.findFirst({
    where: { id: input.eventId, tenantId: ctx.tenantId },
  });
  if (!event) {
    throw new FormTemplateError("Event not found or does not belong to your organization", 404);
  }

  // Verify participantType belongs to event (if provided)
  if (input.participantTypeId) {
    const pt = await prisma.participantType.findFirst({
      where: { id: input.participantTypeId, eventId: input.eventId, tenantId: ctx.tenantId },
    });
    if (!pt) {
      throw new FormTemplateError(
        "Participant type not found or does not belong to this event",
        404,
      );
    }
  }

  // Enforce per-event limit
  const eventCount = await prisma.formTemplate.count({
    where: { tenantId: ctx.tenantId, eventId: input.eventId, isActive: true },
  });
  if (eventCount >= FORM_TEMPLATE_LIMITS.maxPerEvent) {
    throw new FormTemplateError(
      `Event limit reached: maximum ${FORM_TEMPLATE_LIMITS.maxPerEvent} form templates per event`,
      422,
    );
  }

  try {
    const template = await prisma.formTemplate.create({
      data: {
        tenantId: ctx.tenantId,
        eventId: input.eventId,
        participantTypeId: input.participantTypeId ?? null,
        createdBy: ctx.userId,
        name: input.name,
        description: input.description ?? null,
        definition: (input.definition as object) ?? {},
      },
    });

    logger.info({ formTemplateId: template.id, tenantId: ctx.tenantId }, "Form template created");

    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "CREATE",
        entityType: "FormTemplate",
        entityId: template.id,
        description: `Created form template "${input.name}"`,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { name: input.name, eventId: input.eventId },
      },
    });

    return template;
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new FormTemplateError(
        `A form template with name "${input.name}" already exists for this event`,
        409,
      );
    }
    throw error;
  }
}

// ─── Update ──────────────────────────────────────────────

export async function updateFormTemplate(
  id: string,
  input: UpdateFormTemplateInput,
  ctx: ServiceContext,
) {
  const existing = await prisma.formTemplate.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new FormTemplateError("Form template not found", 404);
  }

  // Verify participantType if being changed
  if (input.participantTypeId) {
    const pt = await prisma.participantType.findFirst({
      where: { id: input.participantTypeId, eventId: existing.eventId, tenantId: ctx.tenantId },
    });
    if (!pt) {
      throw new FormTemplateError(
        "Participant type not found or does not belong to this event",
        404,
      );
    }
  }

  try {
    const template = await prisma.formTemplate.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description ?? null }),
        ...(input.participantTypeId !== undefined && {
          participantTypeId: input.participantTypeId ?? null,
        }),
        ...(input.definition !== undefined && { definition: input.definition as object }),
      },
    });

    logger.info({ formTemplateId: id, tenantId: ctx.tenantId }, "Form template updated");

    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "UPDATE",
        entityType: "FormTemplate",
        entityId: id,
        description: `Updated form template "${template.name}"`,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          before: { name: existing.name },
          after: { name: template.name },
        },
      },
    });

    return template;
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new FormTemplateError(
        `A form template with name "${input.name}" already exists for this event`,
        409,
      );
    }
    throw error;
  }
}

// ─── Delete (soft) ───────────────────────────────────────

export async function deleteFormTemplate(id: string, ctx: ServiceContext) {
  const existing = await prisma.formTemplate.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new FormTemplateError("Form template not found", 404);
  }

  await prisma.formTemplate.update({
    where: { id },
    data: { isActive: false },
  });

  logger.info({ formTemplateId: id, tenantId: ctx.tenantId }, "Form template soft-deleted");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "FormTemplate",
      entityId: id,
      description: `Deleted form template "${existing.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { name: existing.name },
    },
  });

  return { success: true };
}

// ─── Publish ─────────────────────────────────────────────

export async function publishFormTemplate(id: string, ctx: ServiceContext) {
  const existing = await prisma.formTemplate.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new FormTemplateError("Form template not found", 404);
  }

  const nextVersion = existing.version + 1;
  const definitionJson = JSON.stringify(existing.definition);
  const changeHash = createHash("sha256").update(definitionJson).digest("hex");

  const [template] = await prisma.$transaction([
    prisma.formTemplate.update({
      where: { id },
      data: {
        version: nextVersion,
        publishedAt: new Date(),
      },
    }),
    prisma.formVersion.create({
      data: {
        formTemplateId: id,
        version: nextVersion,
        definition: existing.definition as object,
        changeHash,
        publishedBy: ctx.userId,
        publishedAt: new Date(),
      },
    }),
  ]);

  logger.info(
    { formTemplateId: id, version: nextVersion, tenantId: ctx.tenantId },
    "Form template published",
  );

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "FormTemplate",
      entityId: id,
      description: `Published form template "${existing.name}" as v${nextVersion}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { version: nextVersion, changeHash },
    },
  });

  return template;
}

// ─── Clone ───────────────────────────────────────────────

export async function cloneFormTemplate(id: string, newName: string, ctx: ServiceContext) {
  const existing = await prisma.formTemplate.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new FormTemplateError("Form template not found", 404);
  }

  // Enforce per-event limit
  const eventCount = await prisma.formTemplate.count({
    where: { tenantId: ctx.tenantId, eventId: existing.eventId, isActive: true },
  });
  if (eventCount >= FORM_TEMPLATE_LIMITS.maxPerEvent) {
    throw new FormTemplateError(
      `Event limit reached: maximum ${FORM_TEMPLATE_LIMITS.maxPerEvent} form templates per event`,
      422,
    );
  }

  try {
    const clone = await prisma.formTemplate.create({
      data: {
        tenantId: ctx.tenantId,
        eventId: existing.eventId,
        participantTypeId: existing.participantTypeId,
        createdBy: ctx.userId,
        name: newName,
        description: existing.description,
        definition: existing.definition as object,
      },
    });

    logger.info(
      { formTemplateId: clone.id, sourceId: id, tenantId: ctx.tenantId },
      "Form template cloned",
    );

    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "CREATE",
        entityType: "FormTemplate",
        entityId: clone.id,
        description: `Cloned form template "${existing.name}" as "${newName}"`,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { sourceId: id, sourceName: existing.name, newName },
      },
    });

    return clone;
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new FormTemplateError(
        `A form template with name "${newName}" already exists for this event`,
        409,
      );
    }
    throw error;
  }
}

// ─── Error Class ─────────────────────────────────────────

export class FormTemplateError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "FormTemplateError";
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
