import type { Prisma } from "~/generated/prisma/client.js";
import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { deliverWebhook } from "~/services/webhook-delivery.server";

/**
 * Dispatch a webhook event to all matching active subscriptions.
 * Creates delivery records and fires off delivery attempts.
 */
export async function dispatchWebhookEvent(
  tenantId: string,
  eventType: string,
  eventId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  // Find ACTIVE subscriptions matching event type (exact or wildcard)
  const subscriptions = await prisma.webhookSubscription.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      OR: [{ events: { has: eventType } }, { events: { has: "*" } }],
    },
    select: {
      id: true,
      maxRetries: true,
      retryBackoffMs: true,
      circuitBreakerOpen: true,
      circuitBreakerResetAt: true,
    },
  });

  if (subscriptions.length === 0) return;

  logger.info(
    { tenantId, eventType, eventId, matchedSubscriptions: subscriptions.length },
    "Dispatching webhook event",
  );

  for (const sub of subscriptions) {
    // Skip subscriptions with open circuit breaker not past reset
    if (sub.circuitBreakerOpen) {
      const resetAt = sub.circuitBreakerResetAt;
      if (resetAt && resetAt > new Date()) {
        logger.debug({ subscriptionId: sub.id }, "Skipping: circuit breaker open");
        continue;
      }
    }

    try {
      const delivery = await prisma.webhookDelivery.create({
        data: {
          tenantId,
          subscriptionId: sub.id,
          eventType,
          eventId,
          payload: payload as Prisma.InputJsonObject,
          maxAttempts: sub.maxRetries,
        },
      });

      // Fire-and-forget delivery
      deliverWebhook(delivery.id).catch((err) => {
        logger.warn({ deliveryId: delivery.id, error: err }, "Webhook delivery failed (async)");
      });
    } catch (err) {
      logger.error(
        { subscriptionId: sub.id, eventType, error: err },
        "Failed to create webhook delivery",
      );
    }
  }
}
