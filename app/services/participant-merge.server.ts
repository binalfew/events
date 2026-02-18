import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { MergeParticipantsInput } from "~/lib/schemas/duplicate-merge";

// ─── Types ────────────────────────────────────────────────

export class MergeError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "MergeError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Merge participants ───────────────────────────────────

export async function mergeParticipants(input: MergeParticipantsInput, ctx: ServiceContext) {
  return prisma.$transaction(async (tx) => {
    // 1. Load both participants
    const surviving = await tx.participant.findFirst({
      where: { id: input.survivingId, tenantId: ctx.tenantId, deletedAt: null },
    });
    if (!surviving) {
      throw new MergeError("Surviving participant not found", 404);
    }

    const merged = await tx.participant.findFirst({
      where: { id: input.mergedId, tenantId: ctx.tenantId, deletedAt: null },
    });
    if (!merged) {
      throw new MergeError("Merged participant not found", 404);
    }

    // 2. Apply field resolution
    const fixedFields = [
      "firstName",
      "lastName",
      "email",
      "organization",
      "jobTitle",
      "nationality",
    ] as const;
    const updateData: Record<string, unknown> = {};
    const survivingExtras = (surviving.extras as Record<string, unknown>) ?? {};
    const mergedExtras = (merged.extras as Record<string, unknown>) ?? {};
    const resolvedExtras = { ...survivingExtras };

    for (const [field, source] of Object.entries(input.fieldResolution)) {
      if (source === "merged") {
        if (fixedFields.includes(field as any)) {
          updateData[field] = (merged as any)[field];
        } else {
          resolvedExtras[field] = mergedExtras[field];
        }
      }
    }

    // 3. Update surviving participant
    updateData.extras = resolvedExtras;
    await tx.participant.update({
      where: { id: input.survivingId },
      data: updateData as any,
    });

    // 4. Migrate relations
    const [approvalsMigrated, accessLogsMigrated, queueTicketsMigrated, deliveriesMigrated] =
      await Promise.all([
        tx.approval.updateMany({
          where: { participantId: input.mergedId },
          data: { participantId: input.survivingId },
        }),
        tx.accessLog.updateMany({
          where: { participantId: input.mergedId },
          data: { participantId: input.survivingId },
        }),
        tx.queueTicket.updateMany({
          where: { participantId: input.mergedId },
          data: { participantId: input.survivingId },
        }),
        tx.messageDelivery.updateMany({
          where: { participantId: input.mergedId },
          data: { participantId: input.survivingId },
        }),
      ]);

    const totalMigrated =
      approvalsMigrated.count +
      accessLogsMigrated.count +
      queueTicketsMigrated.count +
      deliveriesMigrated.count;

    // 5. Update DuplicateCandidate records to MERGED
    await tx.duplicateCandidate.updateMany({
      where: {
        OR: [{ participantAId: input.mergedId }, { participantBId: input.mergedId }],
        status: { in: ["PENDING_REVIEW", "CONFIRMED_DUPLICATE"] },
      },
      data: { status: "MERGED" },
    });

    // 6. Soft-delete merged participant
    await tx.participant.update({
      where: { id: input.mergedId },
      data: { deletedAt: new Date() },
    });

    // 7. Create MergeHistory record
    const mergeHistory = await tx.mergeHistory.create({
      data: {
        tenantId: ctx.tenantId,
        survivingId: input.survivingId,
        mergedId: input.mergedId,
        fieldResolution: input.fieldResolution as any,
        approvalsMigrated: totalMigrated,
        mergedBy: ctx.userId,
      },
    });

    // 8. Audit log
    await tx.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "CONFIGURE",
        entityType: "Participant",
        entityId: input.survivingId,
        description: `Merged participant ${input.mergedId} into ${input.survivingId}`,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          mergedId: input.mergedId,
          survivingId: input.survivingId,
          approvalsMigrated: totalMigrated,
          mergeHistoryId: mergeHistory.id,
        },
      },
    });

    logger.info(
      { mergeHistoryId: mergeHistory.id, survivingId: input.survivingId, mergedId: input.mergedId },
      "Participants merged",
    );

    return mergeHistory;
  });
}

// ─── Review duplicate candidates ──────────────────────────

export async function reviewDuplicateCandidate(
  id: string,
  status: "CONFIRMED_DUPLICATE" | "NOT_DUPLICATE",
  reviewNotes: string | undefined,
  ctx: ServiceContext,
) {
  const candidate = await prisma.duplicateCandidate.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!candidate) {
    throw new MergeError("Duplicate candidate not found", 404);
  }

  const updated = await prisma.duplicateCandidate.update({
    where: { id },
    data: {
      status,
      reviewedBy: ctx.userId,
      reviewedAt: new Date(),
      reviewNotes,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CONFIGURE",
      entityType: "DuplicateCandidate",
      entityId: id,
      description: `Reviewed duplicate candidate as ${status}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { status, reviewNotes },
    },
  });

  return updated;
}

// ─── List duplicate candidates ────────────────────────────

export async function listDuplicateCandidates(
  tenantId: string,
  filters: {
    eventId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;

  const where = {
    tenantId,
    ...(filters.eventId ? { eventId: filters.eventId } : {}),
    ...(filters.status ? { status: filters.status as any } : {}),
  };

  const [candidates, total] = await Promise.all([
    prisma.duplicateCandidate.findMany({
      where: where as any,
      orderBy: { confidenceScore: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.duplicateCandidate.count({ where: where as any }),
  ]);

  return { candidates, total, page, pageSize };
}

// ─── List merge history ───────────────────────────────────

export async function listMergeHistory(
  tenantId: string,
  eventId: string | undefined,
  page: number = 1,
  pageSize: number = 25,
) {
  // MergeHistory doesn't have eventId, so we filter by participants in the event
  let participantIds: string[] | undefined;
  if (eventId) {
    const participants = await prisma.participant.findMany({
      where: { tenantId, eventId },
      select: { id: true },
    });
    participantIds = participants.map((p) => p.id);
  }

  const where = {
    tenantId,
    ...(participantIds
      ? { OR: [{ survivingId: { in: participantIds } }, { mergedId: { in: participantIds } }] }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.mergeHistory.findMany({
      where,
      orderBy: { mergedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.mergeHistory.count({ where }),
  ]);

  return { entries, total, page, pageSize };
}
