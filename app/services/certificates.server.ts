import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type {
  CreateTemplateInput,
  GenerateCertificateInput,
  BulkGenerateInput,
} from "~/lib/schemas/certificate";

// ─── Types ────────────────────────────────────────────────

export class CertificateError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "CertificateError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Helpers ────────────────────────────────────────────

function generateVerificationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CERT-";
  for (let i = 0; i < 12; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Template Functions ─────────────────────────────────

export async function createTemplate(input: CreateTemplateInput, ctx: ServiceContext) {
  let layout: any = {};
  if (input.layout) {
    try {
      layout = JSON.parse(input.layout);
    } catch {
      layout = { html: input.layout };
    }
  }

  const template = await prisma.certificateTemplate.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId ?? null,
      name: input.name,
      description: input.description ?? null,
      layout,
    },
  });

  logger.info({ templateId: template.id }, "Certificate template created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "CertificateTemplate",
      entityId: template.id,
      description: `Created certificate template "${input.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return template;
}

export async function listTemplates(eventId: string, tenantId: string) {
  return prisma.certificateTemplate.findMany({
    where: {
      tenantId,
      OR: [{ eventId }, { eventId: null }],
    },
    include: {
      _count: { select: { certificates: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Certificate Generation ─────────────────────────────

export async function generateCertificate(input: GenerateCertificateInput, ctx: ServiceContext) {
  const [template, participant] = await Promise.all([
    prisma.certificateTemplate.findFirst({
      where: { id: input.templateId, tenantId: ctx.tenantId },
    }),
    prisma.participant.findFirst({
      where: { id: input.participantId, tenantId: ctx.tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        eventId: true,
        registrationCode: true,
        participantType: { select: { id: true, name: true } },
      },
    }),
  ]);

  if (!template) throw new CertificateError("Template not found", 404);
  if (!participant) throw new CertificateError("Participant not found", 404);

  // Check for existing certificate
  const existing = await prisma.certificate.findFirst({
    where: { templateId: input.templateId, participantId: input.participantId },
  });
  if (existing) {
    throw new CertificateError("Certificate already exists for this participant and template", 409);
  }

  const qrCode = generateVerificationCode();

  const certificate = await prisma.certificate.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: participant.eventId,
      templateId: input.templateId,
      participantId: input.participantId,
      status: "GENERATED",
      qrCode,
      issuedAt: new Date(),
      fileUrl: `/certificates/${qrCode}.pdf`,
    },
    include: {
      participant: { select: { id: true, firstName: true, lastName: true, email: true } },
      template: { select: { id: true, name: true } },
    },
  });

  logger.info({ certificateId: certificate.id, qrCode }, "Certificate generated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Certificate",
      entityId: certificate.id,
      description: `Generated certificate for ${participant.firstName} ${participant.lastName}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { templateId: input.templateId, qrCode },
    },
  });

  return certificate;
}

export async function bulkGenerateCertificates(
  input: BulkGenerateInput,
  eventId: string,
  ctx: ServiceContext,
) {
  const template = await prisma.certificateTemplate.findFirst({
    where: { id: input.templateId, tenantId: ctx.tenantId },
  });
  if (!template) throw new CertificateError("Template not found", 404);

  // Find eligible participants
  const where: any = { eventId, tenantId: ctx.tenantId, deletedAt: null };
  if (input.status) where.status = input.status;
  if (input.participantTypeId) where.participantTypeId = input.participantTypeId;

  const participants = await prisma.participant.findMany({
    where,
    select: { id: true, firstName: true, lastName: true, eventId: true },
  });

  // Get already-generated certificate participant IDs for this template
  const existingCerts = await prisma.certificate.findMany({
    where: { templateId: input.templateId, tenantId: ctx.tenantId },
    select: { participantId: true },
  });
  const existingSet = new Set(existingCerts.map((c) => c.participantId));

  // Filter to participants without certificates
  const eligible = participants.filter((p) => !existingSet.has(p.id));

  let generated = 0;
  for (const participant of eligible) {
    const qrCode = generateVerificationCode();
    await prisma.certificate.create({
      data: {
        tenantId: ctx.tenantId,
        eventId: participant.eventId,
        templateId: input.templateId,
        participantId: participant.id,
        status: "GENERATED",
        qrCode,
        issuedAt: new Date(),
        fileUrl: `/certificates/${qrCode}.pdf`,
      },
    });
    generated++;
  }

  logger.info({ templateId: input.templateId, generated }, "Bulk certificate generation completed");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Certificate",
      entityId: input.templateId,
      description: `Bulk generated ${generated} certificates`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { templateId: input.templateId, generated, total: participants.length },
    },
  });

  return { generated, skipped: existingSet.size, total: participants.length };
}

// ─── Certificate Queries ────────────────────────────────

export async function getCertificate(certificateId: string, tenantId: string) {
  const certificate = await prisma.certificate.findFirst({
    where: { id: certificateId, tenantId },
    include: {
      participant: {
        select: { id: true, firstName: true, lastName: true, email: true, registrationCode: true },
      },
      template: { select: { id: true, name: true, layout: true } },
    },
  });
  if (!certificate) {
    throw new CertificateError("Certificate not found", 404);
  }
  return certificate;
}

export async function listCertificates(
  eventId: string,
  tenantId: string,
  filters?: { status?: string; templateId?: string },
) {
  const where: any = { eventId, tenantId };
  if (filters?.status) where.status = filters.status;
  if (filters?.templateId) where.templateId = filters.templateId;

  return prisma.certificate.findMany({
    where,
    include: {
      participant: { select: { id: true, firstName: true, lastName: true, email: true } },
      template: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function verifyCertificate(verificationCode: string) {
  const certificate = await prisma.certificate.findFirst({
    where: { qrCode: verificationCode },
    include: {
      participant: {
        select: { id: true, firstName: true, lastName: true, registrationCode: true },
      },
      template: { select: { id: true, name: true } },
      event: { select: { id: true, name: true } },
    },
  });

  if (!certificate) {
    return { valid: false, message: "Certificate not found" };
  }
  if (certificate.status === "REVOKED") {
    return { valid: false, message: "Certificate has been revoked", certificate };
  }

  return { valid: true, message: "Certificate is valid", certificate };
}

// ─── Certificate Actions ────────────────────────────────

export async function revokeCertificate(
  certificateId: string,
  reason: string,
  ctx: ServiceContext,
) {
  const certificate = await prisma.certificate.findFirst({
    where: { id: certificateId, tenantId: ctx.tenantId },
  });
  if (!certificate) {
    throw new CertificateError("Certificate not found", 404);
  }
  if (certificate.status === "REVOKED") {
    throw new CertificateError("Certificate is already revoked", 400);
  }

  const updated = await prisma.certificate.update({
    where: { id: certificateId },
    data: { status: "REVOKED" },
  });

  logger.info({ certificateId, reason }, "Certificate revoked");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Certificate",
      entityId: certificateId,
      description: `Revoked certificate: ${reason}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { reason },
    },
  });

  return updated;
}

export async function sendCertificate(certificateId: string, ctx: ServiceContext) {
  const certificate = await prisma.certificate.findFirst({
    where: { id: certificateId, tenantId: ctx.tenantId },
    include: {
      participant: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!certificate) {
    throw new CertificateError("Certificate not found", 404);
  }
  if (certificate.status === "REVOKED") {
    throw new CertificateError("Cannot send a revoked certificate", 400);
  }
  if (!certificate.participant?.email) {
    throw new CertificateError("Participant has no email address", 400);
  }

  const updated = await prisma.certificate.update({
    where: { id: certificateId },
    data: { status: "SENT", sentAt: new Date() },
  });

  logger.info({ certificateId }, "Certificate sent");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Certificate",
      entityId: certificateId,
      description: `Sent certificate to ${certificate.participant.email}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

// ─── Stats ──────────────────────────────────────────────

export async function getCertificateStats(eventId: string, tenantId: string) {
  const certificates = await prisma.certificate.findMany({
    where: { eventId, tenantId },
    select: { status: true },
  });

  const byStatus: Record<string, number> = {};
  for (const c of certificates) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
  }

  return {
    total: certificates.length,
    generated: byStatus["GENERATED"] || 0,
    sent: byStatus["SENT"] || 0,
    downloaded: byStatus["DOWNLOADED"] || 0,
    revoked: byStatus["REVOKED"] || 0,
    draft: byStatus["DRAFT"] || 0,
  };
}
