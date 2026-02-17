// @ts-nocheck
import { logger } from "./logger.js";

/** @type {ReturnType<typeof setInterval> | null} */
let intervalId = null;

const DEFAULT_INTERVAL_MS = 10 * 1000; // 10 seconds

/**
 * Start the broadcast delivery background job.
 * @param {() => Promise<{ processQueuedDeliveries: () => Promise<unknown> }>} loader
 */
export function startBroadcastDeliveryJob(loader) {
  if (process.env.NODE_ENV === "test") {
    logger.info("Broadcast delivery job skipped in test environment");
    return;
  }

  if (intervalId) {
    logger.warn("Broadcast delivery job is already running");
    return;
  }

  const intervalMs = process.env.BROADCAST_DELIVERY_INTERVAL_MS
    ? Number(process.env.BROADCAST_DELIVERY_INTERVAL_MS)
    : DEFAULT_INTERVAL_MS;

  logger.info({ intervalMs }, "Starting broadcast delivery background job");

  intervalId = setInterval(async () => {
    try {
      const mod = await loader();
      const result = await mod.processQueuedDeliveries();
      if (result.processed > 0) {
        logger.info(
          {
            processed: result.processed,
            sent: result.sent,
            failed: result.failed,
          },
          "Broadcast delivery job completed",
        );
      }
    } catch (error) {
      logger.error({ error }, "Broadcast delivery job failed");
    }
  }, intervalMs);
}

export function stopBroadcastDeliveryJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info("Broadcast delivery background job stopped");
  }
}
