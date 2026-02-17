import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { resolveAudience } from "./audience-filter.server";
import type { CreateBroadcastInput, AudienceFilter } from "~/lib/schemas/broadcast";

// ─── Types ────────────────────────────────────────────────

export class BroadcastError extends Error {
  constructor(
    message: string,
    public code: string = "BROADCAST_ERROR",
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "BroadcastError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ListBroadcastsOptions {
  status?: string;
  channel?: string;
  page?: number;
  perPage?: number;
}

// ─── Feature Flag Gate ───────────────────────────────────

async function requireCommunicationHub(tenantId: string) {
  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.COMMUNICATION_HUB, { tenantId });
  if (!enabled) {
    throw new BroadcastError(
      "Communication Hub is not enabled for this tenant",
      "FEATURE_DISABLED",
      404,
    );
  }
}

// ─── Broadcast CRUD ──────────────────────────────────────

export async function createBroadcast(input: CreateBroadcastInput, ctx: ServiceContext) {
  await requireCommunicationHub(ctx.tenantId);

  const broadcast = await prisma.broadcastMessage.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      templateId: input.templateId,
      subject: input.subject,
      body: input.body,
      channel: input.channel,
      status: "DRAFT",
      filters: input.filters as any,
      isEmergency: input.isEmergency,
      priority: input.priority,
      createdBy: ctx.userId,
    },
  });

  logger.info({ broadcastId: broadcast.id, channel: broadcast.channel }, "Broadcast created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "BroadcastMessage",
      entityId: broadcast.id,
      description: `Created broadcast "${broadcast.subject ?? "(no subject)"}" (${broadcast.channel})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return broadcast;
}

export async function listBroadcasts(
  eventId: string,
  tenantId: string,
  options: ListBroadcastsOptions = {},
) {
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 20;
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = { eventId, tenantId };
  if (options.status) where.status = options.status;
  if (options.channel) where.channel = options.channel;

  const [broadcasts, total] = await Promise.all([
    prisma.broadcastMessage.findMany({
      where: where as any,
      include: { template: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    prisma.broadcastMessage.count({ where: where as any }),
  ]);

  return {
    broadcasts,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getBroadcast(id: string, tenantId: string) {
  const broadcast = await prisma.broadcastMessage.findFirst({
    where: { id, tenantId },
    include: {
      template: { select: { name: true } },
    },
  });

  if (!broadcast) {
    throw new BroadcastError("Broadcast not found", "NOT_FOUND", 404);
  }

  // Get delivery stats
  const stats = await prisma.messageDelivery.groupBy({
    by: ["status"],
    where: { broadcastId: id },
    _count: true,
  });

  const deliveryStats: Record<string, number> = {};
  for (const s of stats) {
    deliveryStats[s.status] = s._count;
  }

  return { ...broadcast, deliveryStats };
}

export async function getBroadcastDeliveries(
  broadcastId: string,
  tenantId: string,
  page = 1,
  perPage = 20,
) {
  // Verify ownership
  const broadcast = await prisma.broadcastMessage.findFirst({
    where: { id: broadcastId, tenantId },
    select: { id: true },
  });
  if (!broadcast) {
    throw new BroadcastError("Broadcast not found", "NOT_FOUND", 404);
  }

  const skip = (page - 1) * perPage;

  const [deliveries, total] = await Promise.all([
    prisma.messageDelivery.findMany({
      where: { broadcastId },
      include: {
        participant: {
          select: { firstName: true, lastName: true, registrationCode: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    prisma.messageDelivery.count({ where: { broadcastId } }),
  ]);

  return {
    deliveries,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

// ─── Broadcast Actions ───────────────────────────────────

export async function scheduleBroadcast(id: string, scheduledAt: Date, ctx: ServiceContext) {
  await requireCommunicationHub(ctx.tenantId);

  const broadcast = await prisma.broadcastMessage.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });

  if (!broadcast) {
    throw new BroadcastError("Broadcast not found", "NOT_FOUND", 404);
  }

  if (broadcast.status !== "DRAFT") {
    throw new BroadcastError(
      `Cannot schedule a broadcast with status ${broadcast.status}`,
      "INVALID_STATUS",
    );
  }

  const updated = await prisma.broadcastMessage.update({
    where: { id },
    data: { status: "SCHEDULED", scheduledAt },
  });

  logger.info({ broadcastId: id, scheduledAt }, "Broadcast scheduled");
  return updated;
}

export async function sendBroadcast(id: string, ctx: ServiceContext) {
  await requireCommunicationHub(ctx.tenantId);

  const broadcast = await prisma.broadcastMessage.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });

  if (!broadcast) {
    throw new BroadcastError("Broadcast not found", "NOT_FOUND", 404);
  }

  if (broadcast.status !== "DRAFT" && broadcast.status !== "SCHEDULED") {
    throw new BroadcastError(
      `Cannot send a broadcast with status ${broadcast.status}`,
      "INVALID_STATUS",
    );
  }

  if (!broadcast.eventId) {
    throw new BroadcastError("Broadcast has no event assigned", "NO_EVENT");
  }

  // 1. Set status to SENDING
  await prisma.broadcastMessage.update({
    where: { id },
    data: { status: "SENDING", sentAt: new Date() },
  });

  // 2. Resolve audience
  const filters = (broadcast.filters as unknown as AudienceFilter) ?? {};
  const contacts = await resolveAudience(broadcast.eventId, ctx.tenantId, filters);

  // 3. Set recipientCount
  await prisma.broadcastMessage.update({
    where: { id },
    data: { recipientCount: contacts.length },
  });

  // 4. Create MessageDelivery records in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);
    await prisma.messageDelivery.createMany({
      data: batch.map((contact) => ({
        broadcastId: id,
        participantId: contact.id,
        channel: broadcast.channel,
        recipient: getRecipient(contact, broadcast.channel),
        status: "QUEUED" as const,
      })),
    });
  }

  logger.info({ broadcastId: id, recipientCount: contacts.length }, "Broadcast deliveries queued");

  return prisma.broadcastMessage.findFirst({ where: { id } });
}

export async function cancelBroadcast(id: string, reason: string | undefined, ctx: ServiceContext) {
  await requireCommunicationHub(ctx.tenantId);

  const broadcast = await prisma.broadcastMessage.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });

  if (!broadcast) {
    throw new BroadcastError("Broadcast not found", "NOT_FOUND", 404);
  }

  if (broadcast.status !== "SENDING" && broadcast.status !== "SCHEDULED") {
    throw new BroadcastError(
      `Cannot cancel a broadcast with status ${broadcast.status}`,
      "INVALID_STATUS",
    );
  }

  // Cancel remaining QUEUED deliveries
  await prisma.messageDelivery.updateMany({
    where: { broadcastId: id, status: "QUEUED" },
    data: { status: "FAILED", errorMessage: "Broadcast cancelled" },
  });

  const updated = await prisma.broadcastMessage.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledBy: ctx.userId,
      cancelledAt: new Date(),
      cancelReason: reason ?? "Cancelled by user",
    },
  });

  logger.info({ broadcastId: id, reason }, "Broadcast cancelled");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "BroadcastMessage",
      entityId: id,
      description: `Cancelled broadcast "${broadcast.subject ?? id}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

export async function sendEmergencyBroadcast(input: CreateBroadcastInput, ctx: ServiceContext) {
  const broadcast = await createBroadcast({ ...input, isEmergency: true, priority: 1 }, ctx);
  return sendBroadcast(broadcast.id, ctx);
}

// ─── Helpers ─────────────────────────────────────────────

function getRecipient(
  contact: { email: string | null; firstName: string; lastName: string },
  channel: string,
): string {
  switch (channel) {
    case "EMAIL":
      return contact.email ?? "";
    case "IN_APP":
      return contact.email ?? "";
    case "SMS":
      return ""; // SMS stub — no phone field yet
    case "PUSH":
      return ""; // Push stub — no device token yet
    default:
      return contact.email ?? "";
  }
}
