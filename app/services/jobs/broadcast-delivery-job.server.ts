import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { eventBus } from "~/lib/event-bus.server";
import { sendEmail } from "~/services/channels/email.server";
import { sendInApp, sendSMS, sendPush } from "~/services/channels/in-app.server";
import type { ChannelResult } from "~/services/channels/email.server";

// ─── Constants ───────────────────────────────────────────

const DELIVERY_BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000]; // 1min, 5min, 15min

// ─── Process Queued Deliveries ───────────────────────────

export async function processQueuedDeliveries(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  let processed = 0;
  let sent = 0;
  let failed = 0;

  // 1. Process scheduled broadcasts that are due
  const dueBroadcasts = await prisma.broadcastMessage.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
    },
  });

  for (const broadcast of dueBroadcasts) {
    try {
      // Dynamically import to avoid circular deps
      const { sendBroadcast } = await import("~/services/broadcasts.server");
      await sendBroadcast(broadcast.id, {
        userId: broadcast.createdBy ?? "system",
        tenantId: broadcast.tenantId,
      });
      logger.info({ broadcastId: broadcast.id }, "Scheduled broadcast triggered");
    } catch (error: any) {
      logger.error(
        { broadcastId: broadcast.id, error: error.message },
        "Failed to trigger scheduled broadcast",
      );
    }
  }

  // 2. Process QUEUED deliveries
  const deliveries = await prisma.messageDelivery.findMany({
    where: {
      status: "QUEUED",
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    include: {
      broadcast: { select: { tenantId: true, subject: true, body: true } },
      participant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    take: DELIVERY_BATCH_SIZE,
    orderBy: [{ createdAt: "asc" }],
  });

  const broadcastUpdates = new Map<
    string,
    { sentCount: number; failedCount: number; deliveredCount: number }
  >();

  for (const delivery of deliveries) {
    processed++;

    // Mark as SENDING
    await prisma.messageDelivery.update({
      where: { id: delivery.id },
      data: { status: "SENDING" },
    });

    let result: ChannelResult;

    try {
      result = await deliverToChannel(delivery);
    } catch (error: any) {
      result = { externalId: null, status: "FAILED", error: error.message };
    }

    if (result.status === "SENT") {
      await prisma.messageDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          externalId: result.externalId,
        },
      });
      sent++;

      // Track per-broadcast
      const counts = broadcastUpdates.get(delivery.broadcastId) ?? {
        sentCount: 0,
        failedCount: 0,
        deliveredCount: 0,
      };
      counts.sentCount++;
      broadcastUpdates.set(delivery.broadcastId, counts);
    } else {
      // Failure — retry or give up
      const retryCount = delivery.retryCount + 1;
      if (retryCount < MAX_RETRIES) {
        const delayMs =
          RETRY_DELAYS_MS[retryCount - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
        await prisma.messageDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "QUEUED",
            retryCount,
            nextRetryAt: new Date(Date.now() + delayMs),
            errorMessage: result.error,
          },
        });
      } else {
        await prisma.messageDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "FAILED",
            retryCount,
            errorMessage: result.error,
          },
        });
        failed++;

        const counts = broadcastUpdates.get(delivery.broadcastId) ?? {
          sentCount: 0,
          failedCount: 0,
          deliveredCount: 0,
        };
        counts.failedCount++;
        broadcastUpdates.set(delivery.broadcastId, counts);
      }
    }
  }

  // 3. Update broadcast aggregate counts and check for completion
  for (const [broadcastId, counts] of broadcastUpdates) {
    await prisma.broadcastMessage.update({
      where: { id: broadcastId },
      data: {
        sentCount: { increment: counts.sentCount },
        failedCount: { increment: counts.failedCount },
        deliveredCount: { increment: counts.deliveredCount },
      },
    });

    // Check if all deliveries are processed
    const remaining = await prisma.messageDelivery.count({
      where: {
        broadcastId,
        status: { in: ["QUEUED", "SENDING"] },
      },
    });

    if (remaining === 0) {
      const broadcast = await prisma.broadcastMessage.update({
        where: { id: broadcastId },
        data: { status: "SENT", completedAt: new Date() },
      });

      logger.info({ broadcastId }, "Broadcast delivery completed");

      // Emit SSE progress event
      try {
        eventBus.publish("communications", broadcast.tenantId, "broadcast:progress", {
          broadcastId,
          sentCount: broadcast.sentCount,
          failedCount: broadcast.failedCount,
          deliveredCount: broadcast.deliveredCount,
          total: broadcast.recipientCount,
          status: "SENT",
        });
      } catch {
        // SSE failure should never break delivery
      }
    } else {
      // Emit progress event for partial completion
      const broadcast = await prisma.broadcastMessage.findFirst({
        where: { id: broadcastId },
      });
      if (broadcast) {
        try {
          eventBus.publish("communications", broadcast.tenantId, "broadcast:progress", {
            broadcastId,
            sentCount: broadcast.sentCount,
            failedCount: broadcast.failedCount,
            deliveredCount: broadcast.deliveredCount,
            total: broadcast.recipientCount,
            status: broadcast.status,
          });
        } catch {
          // Ignore SSE errors
        }
      }
    }
  }

  return { processed, sent, failed };
}

// ─── Channel Dispatch ────────────────────────────────────

async function deliverToChannel(delivery: {
  channel: string;
  recipient: string;
  broadcast: { tenantId: string; subject: string | null; body: string };
  participant: { id: string; firstName: string; lastName: string; email: string | null };
}): Promise<ChannelResult> {
  const { channel, recipient, broadcast, participant } = delivery;
  const subject = broadcast.subject ?? "Notification";
  const body = broadcast.body;

  switch (channel) {
    case "EMAIL":
      if (!recipient) {
        return { externalId: null, status: "FAILED", error: "No email address" };
      }
      return sendEmail(recipient, subject, body);

    case "IN_APP":
      // Look up userId from participant — for now use email-based lookup
      const user = participant.email
        ? await prisma.user.findFirst({
            where: { email: participant.email },
            select: { id: true },
          })
        : null;
      return sendInApp(user?.id ?? null, broadcast.tenantId, subject, body);

    case "SMS":
      return sendSMS(recipient, body);

    case "PUSH":
      return sendPush(recipient, subject, body);

    default:
      return { externalId: null, status: "FAILED", error: `Unknown channel: ${channel}` };
  }
}
