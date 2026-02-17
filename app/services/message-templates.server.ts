import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { CreateTemplateInput, UpdateTemplateInput } from "~/lib/schemas/message-template";

// ─── Types ────────────────────────────────────────────────

export class TemplateError extends Error {
  constructor(
    message: string,
    public code: string = "TEMPLATE_ERROR",
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "TemplateError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ListTemplatesOptions {
  channel?: string;
  page?: number;
  perPage?: number;
  search?: string;
}

// ─── Template CRUD ───────────────────────────────────────

export async function createTemplate(input: CreateTemplateInput, ctx: ServiceContext) {
  const template = await prisma.messageTemplate.create({
    data: {
      tenantId: ctx.tenantId,
      name: input.name,
      subject: input.subject,
      body: input.body,
      channel: input.channel,
      variables: input.variables ?? [],
      createdBy: ctx.userId,
    },
  });

  logger.info({ templateId: template.id, name: template.name }, "Message template created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "MessageTemplate",
      entityId: template.id,
      description: `Created message template "${template.name}" (${template.channel})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return template;
}

export async function listTemplates(tenantId: string, options: ListTemplatesOptions = {}) {
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 20;
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = { tenantId };
  if (options.channel) where.channel = options.channel;
  if (options.search) {
    where.name = { contains: options.search, mode: "insensitive" };
  }

  const [templates, total] = await Promise.all([
    prisma.messageTemplate.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    prisma.messageTemplate.count({ where: where as any }),
  ]);

  return {
    templates,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getTemplate(id: string, tenantId: string) {
  const template = await prisma.messageTemplate.findFirst({
    where: { id, tenantId },
  });

  if (!template) {
    throw new TemplateError("Template not found", "NOT_FOUND", 404);
  }

  return template;
}

export async function updateTemplate(id: string, input: UpdateTemplateInput, ctx: ServiceContext) {
  const existing = await prisma.messageTemplate.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });

  if (!existing) {
    throw new TemplateError("Template not found", "NOT_FOUND", 404);
  }

  if (existing.isSystem) {
    throw new TemplateError("System templates cannot be modified", "SYSTEM_TEMPLATE", 403);
  }

  const template = await prisma.messageTemplate.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.subject !== undefined && { subject: input.subject }),
      ...(input.body !== undefined && { body: input.body }),
      ...(input.channel !== undefined && { channel: input.channel }),
      ...(input.variables !== undefined && { variables: input.variables }),
      updatedBy: ctx.userId,
    },
  });

  logger.info({ templateId: template.id }, "Message template updated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "MessageTemplate",
      entityId: template.id,
      description: `Updated message template "${template.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return template;
}

export async function deleteTemplate(id: string, ctx: ServiceContext) {
  const existing = await prisma.messageTemplate.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });

  if (!existing) {
    throw new TemplateError("Template not found", "NOT_FOUND", 404);
  }

  if (existing.isSystem) {
    throw new TemplateError("System templates cannot be deleted", "SYSTEM_TEMPLATE", 403);
  }

  await prisma.messageTemplate.delete({ where: { id } });

  logger.info({ templateId: id, name: existing.name }, "Message template deleted");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "MessageTemplate",
      entityId: id,
      description: `Deleted message template "${existing.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });
}

export async function cloneTemplate(id: string, newName: string, ctx: ServiceContext) {
  const existing = await prisma.messageTemplate.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });

  if (!existing) {
    throw new TemplateError("Template not found", "NOT_FOUND", 404);
  }

  const template = await prisma.messageTemplate.create({
    data: {
      tenantId: ctx.tenantId,
      name: newName,
      subject: existing.subject,
      body: existing.body,
      channel: existing.channel,
      variables: existing.variables,
      isSystem: false,
      createdBy: ctx.userId,
    },
  });

  logger.info({ templateId: template.id, clonedFrom: id }, "Message template cloned");

  return template;
}

// ─── Template Rendering ──────────────────────────────────

/**
 * Replace `{{varName}}` placeholders with values from the data map.
 * Unmatched variables are left as-is.
 */
export function renderTemplate(body: string, variables: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] !== undefined ? variables[varName] : match;
  });
}

export async function previewTemplate(
  templateId: string,
  tenantId: string,
  sampleData: Record<string, string>,
) {
  const template = await getTemplate(templateId, tenantId);

  return {
    subject: template.subject ? renderTemplate(template.subject, sampleData) : null,
    body: renderTemplate(template.body, sampleData),
    variables: template.variables,
  };
}
