import { randomBytes } from "node:crypto";
import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { createNotification } from "~/services/notifications.server";

// ─── Constants ────────────────────────────────────────────

const DEFAULT_EXPIRY_DAYS = 14;
const QUOTA_WARNING_THRESHOLD = 0.8; // 80%

// ─── Types ────────────────────────────────────────────────

interface SendInviteInput {
  quotaId: string;
  email: string;
  invitedBy: string;
  expiresInDays?: number;
}

export class DelegationError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "DelegationError";
  }
}

// ─── Quota Management (Admin) ─────────────────────────────

export async function upsertQuota(
  tenantId: string,
  eventId: string,
  organizationId: string,
  maxParticipants: number,
) {
  const quota = await prisma.delegationQuota.upsert({
    where: {
      tenantId_eventId_organizationId: { tenantId, eventId, organizationId },
    },
    update: { maxParticipants },
    create: { tenantId, eventId, organizationId, maxParticipants },
  });

  logger.info({ quotaId: quota.id, organizationId, maxParticipants }, "Delegation quota upserted");
  return quota;
}

export async function listQuotas(tenantId: string, eventId: string) {
  return prisma.delegationQuota.findMany({
    where: { tenantId, eventId },
    include: {
      _count: { select: { invites: true } },
    },
    orderBy: { organizationId: "asc" },
  });
}

export async function getQuota(quotaId: string) {
  return prisma.delegationQuota.findUniqueOrThrow({
    where: { id: quotaId },
    include: {
      invites: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function deleteQuota(quotaId: string) {
  const quota = await prisma.delegationQuota.findUniqueOrThrow({
    where: { id: quotaId },
    include: {
      invites: { where: { status: "ACCEPTED" } },
    },
  });

  if (quota.invites.length > 0) {
    throw new DelegationError("Cannot delete quota with accepted invitations", 400);
  }

  await prisma.delegationQuota.delete({ where: { id: quotaId } });
  logger.info({ quotaId }, "Delegation quota deleted");
}

// ─── Invite Management (Focal Point) ─────────────────────

export async function sendInvite(input: SendInviteInput) {
  const quota = await prisma.delegationQuota.findUniqueOrThrow({
    where: { id: input.quotaId },
  });

  if (quota.usedCount >= quota.maxParticipants) {
    throw new DelegationError("Quota exhausted: cannot send more invitations", 400);
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? DEFAULT_EXPIRY_DAYS));

  const invite = await prisma.delegationInvite.create({
    data: {
      quotaId: input.quotaId,
      email: input.email,
      token,
      invitedBy: input.invitedBy,
      expiresAt,
      status: "PENDING",
    },
  });

  logger.info(
    { inviteId: invite.id, quotaId: input.quotaId, email: input.email },
    "Delegation invite sent",
  );

  return invite;
}

export async function cancelInvite(inviteId: string) {
  const invite = await prisma.delegationInvite.findUniqueOrThrow({
    where: { id: inviteId },
    include: { quota: true },
  });

  if (invite.status === "CANCELLED") {
    throw new DelegationError("Invite is already cancelled", 400);
  }

  const wasAccepted = invite.status === "ACCEPTED";

  await prisma.$transaction(async (tx) => {
    await tx.delegationInvite.update({
      where: { id: inviteId },
      data: { status: "CANCELLED" },
    });

    // Decrement usedCount only if the invite was already accepted
    if (wasAccepted) {
      await tx.delegationQuota.update({
        where: { id: invite.quotaId },
        data: { usedCount: { decrement: 1 } },
      });
    }
  });

  logger.info({ inviteId, wasAccepted }, "Delegation invite cancelled");
}

export async function acceptInvite(token: string) {
  const invite = await prisma.delegationInvite.findUnique({
    where: { token },
    include: { quota: true },
  });

  if (!invite) {
    throw new DelegationError("Invalid invitation token", 404);
  }

  if (invite.status === "ACCEPTED") {
    return { invite, quota: invite.quota, alreadyAccepted: true };
  }

  if (invite.status === "CANCELLED") {
    throw new DelegationError("This invitation has been cancelled", 400);
  }

  if (invite.expiresAt < new Date()) {
    // Mark as expired
    await prisma.delegationInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    throw new DelegationError("This invitation has expired", 400);
  }

  if (invite.quota.usedCount >= invite.quota.maxParticipants) {
    throw new DelegationError("The delegation quota has been exhausted", 400);
  }

  // Atomically accept invite and increment quota
  const [updatedInvite, updatedQuota] = await prisma.$transaction([
    prisma.delegationInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    }),
    prisma.delegationQuota.update({
      where: { id: invite.quotaId },
      data: { usedCount: { increment: 1 } },
    }),
  ]);

  logger.info({ inviteId: invite.id, email: invite.email }, "Delegation invite accepted");

  // Notify focal point
  try {
    await createNotification({
      userId: invite.invitedBy,
      tenantId: updatedQuota.tenantId,
      type: "delegation_accepted",
      title: "Delegate accepted invitation",
      message: `${invite.email} has accepted the delegation invitation`,
      data: {
        inviteId: invite.id,
        quotaId: invite.quotaId,
        email: invite.email,
      },
    });
  } catch {
    // Notification failure should not break acceptance
  }

  // Check quota thresholds
  const usageRatio = updatedQuota.usedCount / updatedQuota.maxParticipants;
  if (usageRatio >= 1) {
    logger.info({ quotaId: updatedQuota.id }, "Delegation quota fully used");
  } else if (usageRatio >= QUOTA_WARNING_THRESHOLD) {
    logger.info({ quotaId: updatedQuota.id, usageRatio }, "Delegation quota nearing limit");
  }

  return { invite: updatedInvite, quota: updatedQuota, alreadyAccepted: false };
}

export async function resendInvite(inviteId: string) {
  const invite = await prisma.delegationInvite.findUniqueOrThrow({
    where: { id: inviteId },
  });

  if (invite.status !== "PENDING") {
    throw new DelegationError(`Cannot resend invite with status "${invite.status}"`, 400);
  }

  // Extend expiry
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + DEFAULT_EXPIRY_DAYS);

  await prisma.delegationInvite.update({
    where: { id: inviteId },
    data: { expiresAt: newExpiry },
  });

  logger.info({ inviteId }, "Delegation invite resent");
}

export async function listInvites(quotaId: string) {
  return prisma.delegationInvite.findMany({
    where: { quotaId },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Exports ──────────────────────────────────────────────

export { DEFAULT_EXPIRY_DAYS, QUOTA_WARNING_THRESHOLD };
