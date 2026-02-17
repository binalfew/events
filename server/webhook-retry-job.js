// @ts-nocheck
import { logger } from "./logger.js";

/** @type {ReturnType<typeof setInterval> | null} */
let intervalId = null;

const DEFAULT_INTERVAL_MS = 60 * 1000; // 60 seconds

/**
 * Start the webhook retry background job.
 * @param {() => Promise<{ retryFailedDeliveries: () => Promise<unknown> }>} loader
 */
export function startWebhookRetryJob(loader) {
  if (process.env.NODE_ENV === "test") {
    logger.info("Webhook retry job skipped in test environment");
    return;
  }

  if (intervalId) {
    logger.warn("Webhook retry job is already running");
    return;
  }

  const intervalMs = process.env.WEBHOOK_RETRY_INTERVAL_MS
    ? Number(process.env.WEBHOOK_RETRY_INTERVAL_MS)
    : DEFAULT_INTERVAL_MS;

  logger.info({ intervalMs }, "Starting webhook retry background job");

  intervalId = setInterval(async () => {
    try {
      const mod = await loader();
      const result = await mod.retryFailedDeliveries();
      if (result.processed > 0) {
        logger.info(
          {
            processed: result.processed,
            succeeded: result.succeeded,
            failed: result.failed,
          },
          "Webhook retry job completed",
        );
      }
    } catch (error) {
      logger.error({ error }, "Webhook retry job failed");
    }
  }, intervalMs);
}

export function stopWebhookRetryJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info("Webhook retry background job stopped");
  }
}
