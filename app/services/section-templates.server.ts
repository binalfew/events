import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── List ────────────────────────────────────────────────

export async function listSectionTemplates(
  tenantId: string,
  filters: {
    isActive?: boolean;
    search?: string;
  } = {},
) {
  const where: Record<string, unknown> = { tenantId };

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

  return prisma.sectionTemplate.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });
}

// ─── Get ─────────────────────────────────────────────────

export async function getSectionTemplate(id: string, tenantId: string) {
  const template = await prisma.sectionTemplate.findFirst({
    where: { id, tenantId },
  });
  if (!template) {
    throw new SectionTemplateError("Section template not found", 404);
  }
  return template;
}

// ─── Create ──────────────────────────────────────────────

export async function createSectionTemplate(
  input: { name: string; description?: string; definition: object },
  ctx: ServiceContext,
) {
  try {
    const template = await prisma.sectionTemplate.create({
      data: {
        tenantId: ctx.tenantId,
        createdBy: ctx.userId,
        name: input.name,
        description: input.description ?? null,
        definition: input.definition,
      },
    });

    logger.info(
      { sectionTemplateId: template.id, tenantId: ctx.tenantId },
      "Section template created",
    );

    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "CREATE",
        entityType: "SectionTemplate",
        entityId: template.id,
        description: `Created section template "${input.name}"`,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { name: input.name },
      },
    });

    return template;
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new SectionTemplateError(
        `A section template with name "${input.name}" already exists`,
        409,
      );
    }
    throw error;
  }
}

// ─── Update ──────────────────────────────────────────────

export async function updateSectionTemplate(
  id: string,
  input: { name?: string; description?: string; definition?: object },
  ctx: ServiceContext,
) {
  const existing = await prisma.sectionTemplate.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new SectionTemplateError("Section template not found", 404);
  }

  try {
    const template = await prisma.sectionTemplate.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description ?? null }),
        ...(input.definition !== undefined && { definition: input.definition }),
      },
    });

    logger.info({ sectionTemplateId: id, tenantId: ctx.tenantId }, "Section template updated");

    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "UPDATE",
        entityType: "SectionTemplate",
        entityId: id,
        description: `Updated section template "${template.name}"`,
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
      throw new SectionTemplateError(
        `A section template with name "${input.name}" already exists`,
        409,
      );
    }
    throw error;
  }
}

// ─── Delete (soft) ───────────────────────────────────────

export async function deleteSectionTemplate(id: string, ctx: ServiceContext) {
  const existing = await prisma.sectionTemplate.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new SectionTemplateError("Section template not found", 404);
  }

  await prisma.sectionTemplate.update({
    where: { id },
    data: { isActive: false },
  });

  logger.info({ sectionTemplateId: id, tenantId: ctx.tenantId }, "Section template soft-deleted");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "SectionTemplate",
      entityId: id,
      description: `Deleted section template "${existing.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { name: existing.name },
    },
  });

  return { success: true };
}

// ─── Error Class ─────────────────────────────────────────

export class SectionTemplateError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "SectionTemplateError";
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
