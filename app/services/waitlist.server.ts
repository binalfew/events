import type { Prisma } from "~/generated/prisma/client.js";
import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { createNotification } from "~/services/notifications.server";
import type { AddToWaitlistInput, WaitlistFilters } from "~/lib/schemas/waitlist";

// ─── Types ────────────────────────────────────────────────

export class WaitlistError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "WaitlistError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

const PROMOTION_DEADLINE_HOURS = 48;

const PRIORITY_ORDER = { VIP: 3, HIGH: 2, STANDARD: 1 } as const;

// ─── Entry Functions ─────────────────────────────────────

export async function addToWaitlist(input: AddToWaitlistInput, ctx: ServiceContext) {
  // Check for existing active entry
  const existing = await prisma.waitlistEntry.findFirst({
    where: {
      eventId: input.eventId,
      participantId: input.participantId,
      status: "ACTIVE",
    },
  });
  if (existing) {
    throw new WaitlistError("Participant is already on the waitlist", 409);
  }

  // Calculate position: count of ACTIVE entries for same event+participantType + 1
  const activeCount = await prisma.waitlistEntry.count({
    where: {
      eventId: input.eventId,
      participantType: input.participantType,
      status: "ACTIVE",
    },
  });

  const entry = await prisma.waitlistEntry.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      participantId: input.participantId,
      participantType: input.participantType,
      priority: input.priority,
      position: activeCount + 1,
      registrationData: input.registrationData as Prisma.InputJsonObject,
    },
    include: { participant: true },
  });

  logger.info({ waitlistEntryId: entry.id, eventId: input.eventId }, "Added to waitlist");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "WaitlistEntry",
      entityId: entry.id,
      description: `Added participant to waitlist for event`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        eventId: input.eventId,
        participantType: input.participantType,
        priority: input.priority,
      },
    },
  });

  return entry;
}

export async function getWaitlist(eventId: string, tenantId: string, filters?: WaitlistFilters) {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { eventId, tenantId };
  if (filters?.status) where.status = filters.status;
  if (filters?.participantType) where.participantType = filters.participantType;
  if (filters?.priority) where.priority = filters.priority;

  const [entries, total] = await Promise.all([
    prisma.waitlistEntry.findMany({
      where,
      include: { participant: true, promotions: true },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      skip,
      take: pageSize,
    }),
    prisma.waitlistEntry.count({ where }),
  ]);

  return {
    entries,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getWaitlistEntry(id: string, tenantId: string) {
  const entry = await prisma.waitlistEntry.findFirst({
    where: { id, tenantId },
    include: { participant: true, promotions: true },
  });
  if (!entry) {
    throw new WaitlistError("Waitlist entry not found", 404);
  }
  return entry;
}

export async function withdrawFromWaitlist(entryId: string, ctx: ServiceContext) {
  const entry = await prisma.waitlistEntry.findFirst({
    where: { id: entryId, tenantId: ctx.tenantId },
  });
  if (!entry) {
    throw new WaitlistError("Waitlist entry not found", 404);
  }
  if (entry.status !== "ACTIVE") {
    throw new WaitlistError("Only active entries can be withdrawn", 400);
  }

  const updated = await prisma.waitlistEntry.update({
    where: { id: entryId },
    data: { status: "WITHDRAWN", withdrawnAt: new Date() },
  });

  logger.info({ waitlistEntryId: entryId }, "Withdrawn from waitlist");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "WaitlistEntry",
      entityId: entryId,
      description: "Participant withdrawn from waitlist",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { previousStatus: entry.status },
    },
  });

  return updated;
}

export async function updatePriority(
  entryId: string,
  priority: "STANDARD" | "HIGH" | "VIP",
  ctx: ServiceContext,
) {
  const entry = await prisma.waitlistEntry.findFirst({
    where: { id: entryId, tenantId: ctx.tenantId },
  });
  if (!entry) {
    throw new WaitlistError("Waitlist entry not found", 404);
  }

  const updated = await prisma.waitlistEntry.update({
    where: { id: entryId },
    data: { priority },
  });

  logger.info({ waitlistEntryId: entryId, priority }, "Waitlist priority updated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "WaitlistEntry",
      entityId: entryId,
      description: `Updated waitlist priority from ${entry.priority} to ${priority}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { previousPriority: entry.priority, newPriority: priority },
    },
  });

  return updated;
}

export async function getWaitlistPosition(entryId: string) {
  const entry = await prisma.waitlistEntry.findFirst({
    where: { id: entryId },
  });
  if (!entry) {
    throw new WaitlistError("Waitlist entry not found", 404);
  }
  if (entry.status !== "ACTIVE") {
    return null;
  }

  // Count entries with higher priority OR same priority but earlier createdAt
  const ahead = await prisma.waitlistEntry.count({
    where: {
      eventId: entry.eventId,
      participantType: entry.participantType,
      status: "ACTIVE",
      OR: [
        {
          priority: {
            in: Object.entries(PRIORITY_ORDER)
              .filter(([, v]) => v > PRIORITY_ORDER[entry.priority])
              .map(([k]) => k) as Array<"STANDARD" | "HIGH" | "VIP">,
          },
        },
        {
          priority: entry.priority,
          createdAt: { lt: entry.createdAt },
        },
      ],
    },
  });

  return ahead + 1;
}

export async function getWaitlistStats(eventId: string, tenantId: string) {
  const [active, promoted, expired, withdrawn, cancelled, promotions] = await Promise.all([
    prisma.waitlistEntry.count({ where: { eventId, tenantId, status: "ACTIVE" } }),
    prisma.waitlistEntry.count({ where: { eventId, tenantId, status: "PROMOTED" } }),
    prisma.waitlistEntry.count({ where: { eventId, tenantId, status: "EXPIRED" } }),
    prisma.waitlistEntry.count({ where: { eventId, tenantId, status: "WITHDRAWN" } }),
    prisma.waitlistEntry.count({ where: { eventId, tenantId, status: "CANCELLED" } }),
    prisma.waitlistPromotion.findMany({
      where: {
        waitlistEntry: { eventId, tenantId },
        confirmedAt: { not: null },
      },
      select: { promotedAt: true, confirmedAt: true },
    }),
  ]);

  // Calculate average wait time for promoted entries (promotion to confirmation)
  let avgWaitHours = 0;
  if (promotions.length > 0) {
    const totalMs = promotions.reduce((sum, p) => {
      return sum + (p.confirmedAt!.getTime() - p.promotedAt.getTime());
    }, 0);
    avgWaitHours = Math.round((totalMs / promotions.length / (1000 * 60 * 60)) * 10) / 10;
  }

  const total = active + promoted + expired + withdrawn + cancelled;
  const promotionSuccessRate = total > 0 ? Math.round((promoted / total) * 100) : 0;

  return {
    active,
    promoted,
    expired,
    withdrawn,
    cancelled,
    total,
    avgWaitHours,
    promotionSuccessRate,
  };
}

export async function removeFromWaitlist(entryId: string, ctx: ServiceContext) {
  const entry = await prisma.waitlistEntry.findFirst({
    where: { id: entryId, tenantId: ctx.tenantId },
  });
  if (!entry) {
    throw new WaitlistError("Waitlist entry not found", 404);
  }
  if (entry.status !== "ACTIVE") {
    throw new WaitlistError("Only active entries can be removed", 400);
  }

  const updated = await prisma.waitlistEntry.update({
    where: { id: entryId },
    data: { status: "CANCELLED" },
  });

  logger.info({ waitlistEntryId: entryId }, "Removed from waitlist by admin");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "WaitlistEntry",
      entityId: entryId,
      description: "Admin removed participant from waitlist",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { previousStatus: entry.status },
    },
  });

  return updated;
}

// ─── Promotion Functions ─────────────────────────────────

export async function checkAndPromote(
  eventId: string,
  tenantId: string,
  participantType: string,
  slotsAvailable: number,
  triggeredBy: string,
  triggerEntityId?: string,
) {
  if (slotsAvailable <= 0) return [];

  // Find next N eligible ACTIVE entries (ordered by priority desc, createdAt asc)
  const eligible = await prisma.waitlistEntry.findMany({
    where: {
      eventId,
      tenantId,
      participantType,
      status: "ACTIVE",
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: slotsAvailable,
    include: { participant: true },
  });

  const promotions = [];
  const deadline = new Date(Date.now() + PROMOTION_DEADLINE_HOURS * 60 * 60 * 1000);

  for (const entry of eligible) {
    const promotion = await prisma.waitlistPromotion.create({
      data: {
        waitlistEntryId: entry.id,
        triggeredBy,
        triggerEntityId: triggerEntityId ?? null,
        slotAvailableAt: new Date(),
      },
    });

    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        promotionDeadline: deadline,
        notificationsSent: { increment: 1 },
        lastNotifiedAt: new Date(),
      },
    });

    // Send notification (logged as system action)
    try {
      await createNotification({
        userId: triggeredBy,
        tenantId,
        type: "waitlist:promoted",
        title: "Waitlist promotion created",
        message: `${entry.participant.firstName} ${entry.participant.lastName} has been promoted from the waitlist. Deadline: ${deadline.toLocaleString()}.`,
        data: {
          waitlistEntryId: entry.id,
          promotionId: promotion.id,
          deadline: deadline.toISOString(),
        },
      });
    } catch {
      // Notification failure should not break promotion
    }

    promotions.push({ entry, promotion });
  }

  logger.info(
    { eventId, participantType, promoted: promotions.length },
    "Waitlist promotions created",
  );

  return promotions;
}

export async function confirmPromotion(promotionId: string, ctx: ServiceContext) {
  const promotion = await prisma.waitlistPromotion.findFirst({
    where: { id: promotionId },
    include: { waitlistEntry: true },
  });
  if (!promotion) {
    throw new WaitlistError("Promotion not found", 404);
  }
  if (promotion.waitlistEntry.tenantId !== ctx.tenantId) {
    throw new WaitlistError("Promotion not found", 404);
  }
  if (promotion.confirmedAt) {
    throw new WaitlistError("Promotion already confirmed", 400);
  }
  if (promotion.declinedAt) {
    throw new WaitlistError("Promotion was declined", 400);
  }

  const now = new Date();

  await prisma.waitlistPromotion.update({
    where: { id: promotionId },
    data: { confirmedAt: now, promotedBy: ctx.userId },
  });

  const entry = await prisma.waitlistEntry.update({
    where: { id: promotion.waitlistEntryId },
    data: { status: "PROMOTED", promotedAt: now },
  });

  logger.info(
    { promotionId, waitlistEntryId: promotion.waitlistEntryId },
    "Waitlist promotion confirmed",
  );

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "WaitlistPromotion",
      entityId: promotionId,
      description: "Waitlist promotion confirmed",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { waitlistEntryId: promotion.waitlistEntryId },
    },
  });

  // Notify admin who confirmed
  try {
    await createNotification({
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      type: "waitlist:confirmed",
      title: "Waitlist promotion confirmed",
      message: "The waitlist promotion has been confirmed successfully.",
      data: { waitlistEntryId: entry.id },
    });
  } catch {
    // Notification failure should not break confirmation
  }

  return entry;
}

export async function declinePromotion(promotionId: string, ctx: ServiceContext) {
  const promotion = await prisma.waitlistPromotion.findFirst({
    where: { id: promotionId },
    include: { waitlistEntry: true },
  });
  if (!promotion) {
    throw new WaitlistError("Promotion not found", 404);
  }
  if (promotion.waitlistEntry.tenantId !== ctx.tenantId) {
    throw new WaitlistError("Promotion not found", 404);
  }
  if (promotion.confirmedAt) {
    throw new WaitlistError("Promotion already confirmed", 400);
  }
  if (promotion.declinedAt) {
    throw new WaitlistError("Promotion already declined", 400);
  }

  await prisma.waitlistPromotion.update({
    where: { id: promotionId },
    data: { declinedAt: new Date() },
  });

  const entry = await prisma.waitlistEntry.update({
    where: { id: promotion.waitlistEntryId },
    data: { status: "WITHDRAWN", withdrawnAt: new Date() },
  });

  logger.info(
    { promotionId, waitlistEntryId: promotion.waitlistEntryId },
    "Waitlist promotion declined",
  );

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "WaitlistPromotion",
      entityId: promotionId,
      description: "Waitlist promotion declined",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { waitlistEntryId: promotion.waitlistEntryId },
    },
  });

  // Trigger next promotion for the freed slot
  try {
    await checkAndPromote(
      entry.eventId,
      entry.tenantId,
      entry.participantType,
      1,
      "decline_cascade",
      promotionId,
    );
  } catch (error) {
    logger.error({ error, promotionId }, "Failed to cascade promotion after decline");
  }

  return entry;
}

export async function expireStalePromotions() {
  const now = new Date();

  // Find entries with expired promotion deadlines that are still ACTIVE
  const expiredEntries = await prisma.waitlistEntry.findMany({
    where: {
      status: "ACTIVE",
      promotionDeadline: { not: null, lte: now },
    },
  });

  let expiredCount = 0;

  for (const entry of expiredEntries) {
    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: { status: "EXPIRED", expiredAt: now },
    });

    expiredCount++;

    // Trigger next promotion for the freed slot
    try {
      await checkAndPromote(
        entry.eventId,
        entry.tenantId,
        entry.participantType,
        1,
        "expiry_cascade",
        entry.id,
      );
    } catch (error) {
      logger.error(
        { error, waitlistEntryId: entry.id },
        "Failed to cascade promotion after expiry",
      );
    }
  }

  if (expiredCount > 0) {
    logger.info({ expiredCount }, "Expired stale waitlist promotions");
  }

  return { expired: expiredCount };
}
