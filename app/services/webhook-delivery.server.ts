import crypto from "node:crypto";
import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";

// ─── HMAC Signing ─────────────────────────────────────────

export function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// ─── Circuit Breaker Constants ────────────────────────────

const CIRCUIT_BREAKER_THRESHOLD = 10;
const CIRCUIT_BREAKER_RESET_MS = 60 * 60 * 1000; // 1 hour
const MAX_BREAKER_TRIPS = 3;
const RESPONSE_BODY_MAX_LENGTH = 1024;

// ─── Delivery Engine ──────────────────────────────────────

export async function deliverWebhook(deliveryId: string): Promise<{
  success: boolean;
  statusCode?: number;
  error?: string;
  latencyMs?: number;
}> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { subscription: true },
  });

  if (!delivery) {
    logger.warn({ deliveryId }, "Webhook delivery not found");
    return { success: false, error: "Delivery not found" };
  }

  const { subscription } = delivery;

  // Circuit breaker check
  if (subscription.circuitBreakerOpen) {
    const resetAt = subscription.circuitBreakerResetAt;
    if (resetAt && resetAt > new Date()) {
      // Circuit is open and not past reset time — skip
      logger.info(
        { deliveryId, subscriptionId: subscription.id },
        "Skipping delivery: circuit breaker open",
      );
      return { success: false, error: "Circuit breaker open" };
    }
    // Past reset time — allow as probe
    logger.info({ deliveryId, subscriptionId: subscription.id }, "Circuit breaker probe attempt");
  }

  // Build envelope
  const envelope = {
    id: delivery.eventId,
    event: delivery.eventType,
    timestamp: new Date().toISOString(),
    version: subscription.version,
    data: delivery.payload,
  };

  const body = JSON.stringify(envelope);
  const signature = signPayload(body, subscription.secret);

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Webhook-Signature": `sha256=${signature}`,
    "X-Webhook-Event": delivery.eventType,
    "X-Webhook-Delivery": delivery.id,
  };

  // Merge custom headers
  if (subscription.headers && typeof subscription.headers === "object") {
    Object.assign(headers, subscription.headers);
  }

  const startTime = Date.now();

  try {
    const response = await fetch(subscription.url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(subscription.timeoutMs),
    });

    const latencyMs = Date.now() - startTime;
    const responseBody = await response.text().catch(() => "");
    const truncatedBody = responseBody.slice(0, RESPONSE_BODY_MAX_LENGTH);

    if (response.ok) {
      // Success — mark as delivered
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "DELIVERED",
          attempts: delivery.attempts + 1,
          responseCode: response.status,
          responseBody: truncatedBody,
          latencyMs,
          deliveredAt: new Date(),
          nextRetryAt: null,
        },
      });

      // Reset circuit breaker on success
      if (subscription.consecutiveFailures > 0 || subscription.circuitBreakerOpen) {
        await prisma.webhookSubscription.update({
          where: { id: subscription.id },
          data: {
            consecutiveFailures: 0,
            circuitBreakerOpen: false,
            circuitBreakerResetAt: null,
          },
        });
      }

      logger.info({ deliveryId, statusCode: response.status, latencyMs }, "Webhook delivered");
      return { success: true, statusCode: response.status, latencyMs };
    }

    // Non-2xx — handle failure
    return await handleDeliveryFailure(
      delivery,
      subscription,
      response.status,
      truncatedBody,
      latencyMs,
      `HTTP ${response.status}`,
    );
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    const errorMessage =
      error?.name === "TimeoutError"
        ? `Request timed out after ${subscription.timeoutMs}ms`
        : (error?.message ?? "Unknown error");

    return await handleDeliveryFailure(delivery, subscription, null, null, latencyMs, errorMessage);
  }
}

async function handleDeliveryFailure(
  delivery: { id: string; attempts: number; maxAttempts: number },
  subscription: {
    id: string;
    consecutiveFailures: number;
    circuitBreakerOpen: boolean;
    retryBackoffMs: number[];
    metadata: any;
  },
  responseCode: number | null,
  responseBody: string | null,
  latencyMs: number,
  errorMessage: string,
): Promise<{ success: boolean; statusCode?: number; error: string; latencyMs: number }> {
  const newAttempts = delivery.attempts + 1;
  const newConsecutiveFailures = subscription.consecutiveFailures + 1;

  // Schedule retry or dead letter
  let newStatus: "RETRYING" | "DEAD_LETTER";
  let nextRetryAt: Date | null = null;

  if (newAttempts >= delivery.maxAttempts) {
    newStatus = "DEAD_LETTER";
  } else {
    newStatus = "RETRYING";
    const backoffIndex = Math.min(newAttempts - 1, subscription.retryBackoffMs.length - 1);
    const backoffMs = subscription.retryBackoffMs[backoffIndex];
    nextRetryAt = new Date(Date.now() + backoffMs);
  }

  await prisma.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      status: newStatus,
      attempts: newAttempts,
      responseCode: responseCode,
      responseBody: responseBody,
      latencyMs,
      errorMessage,
      errorType: responseCode ? "HTTP_ERROR" : "NETWORK_ERROR",
      nextRetryAt,
    },
  });

  // Update circuit breaker state on subscription
  const breakerTrips = ((subscription.metadata as any)?.breakerTrips as number) ?? 0;

  if (newConsecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD && !subscription.circuitBreakerOpen) {
    const newBreakerTrips = breakerTrips + 1;

    if (newBreakerTrips >= MAX_BREAKER_TRIPS) {
      // Suspend after too many breaker trips
      await prisma.webhookSubscription.update({
        where: { id: subscription.id },
        data: {
          consecutiveFailures: newConsecutiveFailures,
          circuitBreakerOpen: true,
          circuitBreakerResetAt: new Date(Date.now() + CIRCUIT_BREAKER_RESET_MS),
          status: "SUSPENDED",
          metadata: { ...((subscription.metadata as any) ?? {}), breakerTrips: newBreakerTrips },
        },
      });
      logger.warn(
        { subscriptionId: subscription.id, trips: newBreakerTrips },
        "Webhook subscription suspended after repeated circuit breaker trips",
      );
    } else {
      // Open circuit breaker
      await prisma.webhookSubscription.update({
        where: { id: subscription.id },
        data: {
          consecutiveFailures: newConsecutiveFailures,
          circuitBreakerOpen: true,
          circuitBreakerResetAt: new Date(Date.now() + CIRCUIT_BREAKER_RESET_MS),
          metadata: { ...((subscription.metadata as any) ?? {}), breakerTrips: newBreakerTrips },
        },
      });
      logger.warn(
        { subscriptionId: subscription.id, failures: newConsecutiveFailures },
        "Circuit breaker opened",
      );
    }
  } else {
    await prisma.webhookSubscription.update({
      where: { id: subscription.id },
      data: { consecutiveFailures: newConsecutiveFailures },
    });
  }

  logger.warn(
    { deliveryId: delivery.id, attempts: newAttempts, status: newStatus, errorMessage },
    "Webhook delivery failed",
  );

  return {
    success: false,
    statusCode: responseCode ?? undefined,
    error: errorMessage,
    latencyMs,
  };
}

// ─── Retry Job Entry Point ────────────────────────────────

export async function retryFailedDeliveries(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const deliveries = await prisma.webhookDelivery.findMany({
    where: {
      status: "RETRYING",
      nextRetryAt: { lte: new Date() },
    },
    take: 50,
    orderBy: { nextRetryAt: "asc" },
  });

  let succeeded = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    const result = await deliverWebhook(delivery.id);
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
  }

  return { processed: deliveries.length, succeeded, failed };
}
