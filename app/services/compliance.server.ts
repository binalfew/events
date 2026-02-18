import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type {
  CreateDocumentRequirementInput,
  SubmitDocumentInput,
  VerifyDocumentInput,
  CreateRetentionPolicyInput,
} from "~/lib/schemas/compliance";

// ─── Types ────────────────────────────────────────────────

export class ComplianceError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ComplianceError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Document Requirement Functions ─────────────────────

export async function createDocumentRequirement(
  input: CreateDocumentRequirementInput,
  ctx: ServiceContext,
) {
  const requirement = await prisma.documentRequirement.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      description: input.description ?? null,
      documentType: input.documentType,
      isRequired: input.isRequired ?? true,
      participantTypes: input.participantTypes,
      validityDays: input.validityDays ?? null,
    },
  });

  logger.info({ requirementId: requirement.id }, "Document requirement created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "DocumentRequirement",
      entityId: requirement.id,
      description: `Created document requirement "${input.name}" (${input.documentType})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { documentType: input.documentType, participantTypes: input.participantTypes },
    },
  });

  return requirement;
}

export async function listDocumentRequirements(eventId: string, tenantId: string) {
  return prisma.documentRequirement.findMany({
    where: { eventId, tenantId },
    include: {
      documents: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Document Submission & Verification ─────────────────

export async function submitDocument(input: SubmitDocumentInput, ctx: ServiceContext) {
  const requirement = await prisma.documentRequirement.findFirst({
    where: { id: input.requirementId, tenantId: ctx.tenantId },
  });
  if (!requirement) {
    throw new ComplianceError("Document requirement not found", 404);
  }

  const existing = await prisma.participantDocument.findFirst({
    where: { requirementId: input.requirementId, participantId: input.participantId },
  });
  if (existing) {
    throw new ComplianceError("Document already submitted for this requirement", 409);
  }

  const document = await prisma.participantDocument.create({
    data: {
      tenantId: ctx.tenantId,
      requirementId: input.requirementId,
      participantId: input.participantId,
      fileName: input.documentNumber ?? "document",
      fileSize: 0,
      mimeType: "application/octet-stream",
      storageUrl: "",
      status: "VALID",
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      metadata: { documentNumber: input.documentNumber, notes: input.notes },
    },
    include: {
      requirement: { select: { id: true, name: true } },
      participant: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  logger.info({ documentId: document.id }, "Document submitted");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "ParticipantDocument",
      entityId: document.id,
      description: `Submitted document for requirement "${requirement.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return document;
}

export async function verifyDocument(
  documentId: string,
  input: VerifyDocumentInput,
  ctx: ServiceContext,
) {
  const document = await prisma.participantDocument.findFirst({
    where: { id: documentId, tenantId: ctx.tenantId },
  });
  if (!document) {
    throw new ComplianceError("Document not found", 404);
  }

  const updated = await prisma.participantDocument.update({
    where: { id: documentId },
    data: {
      status: input.status as any,
      verifiedAt: new Date(),
      verifiedBy: ctx.userId,
      metadata: {
        ...(document.metadata as any),
        verificationNotes: input.notes,
      },
    },
    include: {
      requirement: { select: { id: true, name: true } },
      participant: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  logger.info({ documentId, status: input.status }, "Document verified");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "ParticipantDocument",
      entityId: documentId,
      description: `Verified document as ${input.status}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { status: input.status, notes: input.notes },
    },
  });

  return updated;
}

// ─── Compliance Queries ─────────────────────────────────

export async function getParticipantCompliance(participantId: string, tenantId: string) {
  const participant = await prisma.participant.findFirst({
    where: { id: participantId, tenantId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      eventId: true,
      participantTypeId: true,
      participantType: { select: { id: true, name: true, code: true } },
    },
  });
  if (!participant) {
    throw new ComplianceError("Participant not found", 404);
  }

  const requirements = await prisma.documentRequirement.findMany({
    where: {
      eventId: participant.eventId,
      tenantId,
    },
    include: {
      documents: {
        where: { participantId },
      },
    },
  });

  // Filter to requirements that apply to this participant's type
  const typeCode = participant.participantType?.code;
  const applicable = requirements.filter(
    (r) => r.participantTypes.length === 0 || (typeCode && r.participantTypes.includes(typeCode)),
  );

  return {
    participant,
    requirements: applicable.map((r) => ({
      id: r.id,
      name: r.name,
      documentType: r.documentType,
      isRequired: r.isRequired,
      document: r.documents[0] ?? null,
      status: r.documents[0]?.status ?? "NOT_PROVIDED",
    })),
  };
}

export async function getComplianceDashboard(eventId: string, tenantId: string) {
  const [requirements, documents, participants] = await Promise.all([
    prisma.documentRequirement.findMany({
      where: { eventId, tenantId },
      select: { id: true, name: true, isRequired: true, participantTypes: true },
    }),
    prisma.participantDocument.findMany({
      where: { requirement: { eventId, tenantId } },
      select: { status: true, requirementId: true, expiresAt: true },
    }),
    prisma.participant.findMany({
      where: { eventId, tenantId, deletedAt: null },
      select: { id: true },
    }),
  ]);

  const totalParticipants = participants.length;
  const byStatus: Record<string, number> = {};
  for (const d of documents) {
    byStatus[d.status] = (byStatus[d.status] || 0) + 1;
  }

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringCount = documents.filter(
    (d) => d.expiresAt && d.expiresAt > now && d.expiresAt <= thirtyDays && d.status === "VALID",
  ).length;

  const totalRequired = requirements.filter((r) => r.isRequired).length;
  const totalDocuments = documents.length;
  const validDocuments = byStatus["VALID"] || 0;
  const complianceRate =
    totalParticipants > 0 && totalRequired > 0
      ? Math.round((validDocuments / (totalParticipants * totalRequired)) * 100)
      : 0;

  return {
    totalParticipants,
    totalRequirements: requirements.length,
    totalDocuments,
    byStatus,
    valid: byStatus["VALID"] || 0,
    expiringSoon: byStatus["EXPIRING_SOON"] || 0,
    expired: byStatus["EXPIRED"] || 0,
    notProvided: byStatus["NOT_PROVIDED"] || 0,
    expiringWithin30Days: expiringCount,
    complianceRate,
  };
}

export async function getExpiringDocuments(
  eventId: string,
  tenantId: string,
  daysAhead: number = 30,
) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return prisma.participantDocument.findMany({
    where: {
      tenantId,
      requirement: { eventId },
      status: "VALID",
      expiresAt: { gte: now, lte: cutoff },
    },
    include: {
      requirement: { select: { id: true, name: true, documentType: true } },
      participant: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { expiresAt: "asc" },
  });
}

// ─── Data Retention Functions ───────────────────────────

export async function createRetentionPolicy(
  input: CreateRetentionPolicyInput,
  ctx: ServiceContext,
) {
  const policy = await prisma.dataRetentionPolicy.create({
    data: {
      tenantId: ctx.tenantId,
      entityType: input.entityType,
      retentionDays: input.retentionDays,
      action: input.action as any,
    },
  });

  logger.info({ policyId: policy.id }, "Retention policy created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "DataRetentionPolicy",
      entityId: policy.id,
      description: `Created retention policy for ${input.entityType} (${input.retentionDays} days, ${input.action})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        entityType: input.entityType,
        retentionDays: input.retentionDays,
        action: input.action,
      },
    },
  });

  return policy;
}

export async function listRetentionPolicies(tenantId: string) {
  return prisma.dataRetentionPolicy.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function executeRetentionPolicy(policyId: string, ctx: ServiceContext) {
  const policy = await prisma.dataRetentionPolicy.findFirst({
    where: { id: policyId, tenantId: ctx.tenantId },
  });
  if (!policy) {
    throw new ComplianceError("Retention policy not found", 404);
  }
  if (!policy.isActive) {
    throw new ComplianceError("Retention policy is inactive", 400);
  }

  const cutoff = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
  let affected = 0;

  if (policy.entityType === "ParticipantDocument") {
    if (policy.action === "DELETE") {
      const result = await prisma.participantDocument.deleteMany({
        where: { tenantId: ctx.tenantId, uploadedAt: { lt: cutoff } },
      });
      affected = result.count;
    } else if (policy.action === "ANONYMIZE") {
      const docs = await prisma.participantDocument.findMany({
        where: { tenantId: ctx.tenantId, uploadedAt: { lt: cutoff } },
        select: { id: true },
      });
      for (const doc of docs) {
        await prisma.participantDocument.update({
          where: { id: doc.id },
          data: {
            fileName: "REDACTED",
            storageUrl: "",
            metadata: { anonymized: true, anonymizedAt: new Date().toISOString() },
          },
        });
      }
      affected = docs.length;
    }
  }

  await prisma.dataRetentionPolicy.update({
    where: { id: policyId },
    data: { lastRunAt: new Date() },
  });

  logger.info({ policyId, affected, action: policy.action }, "Retention policy executed");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "DataRetentionPolicy",
      entityId: policyId,
      description: `Executed retention policy: ${policy.action} ${affected} records`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { affected, action: policy.action },
    },
  });

  return { affected, action: policy.action };
}

export async function getRetentionReport(tenantId: string) {
  const policies = await prisma.dataRetentionPolicy.findMany({
    where: { tenantId, isActive: true },
  });

  const report: Array<{
    policyId: string;
    entityType: string;
    retentionDays: number;
    action: string;
    lastRunAt: Date | null;
    recordsAffected: number;
  }> = [];

  for (const policy of policies) {
    const cutoff = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
    let count = 0;

    if (policy.entityType === "ParticipantDocument") {
      count = await prisma.participantDocument.count({
        where: { tenantId, uploadedAt: { lt: cutoff } },
      });
    }

    report.push({
      policyId: policy.id,
      entityType: policy.entityType,
      retentionDays: policy.retentionDays,
      action: policy.action,
      lastRunAt: policy.lastRunAt,
      recordsAffected: count,
    });
  }

  return report;
}
