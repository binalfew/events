// @ts-nocheck
import { logger } from "./logger.js";

/** @type {ReturnType<typeof setInterval> | null} */
let intervalId = null;

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Start the waitlist expiry background job.
 * @param {() => Promise<{ expireStalePromotions: () => Promise<unknown> }>} loader
 */
export function startWaitlistExpiryJob(loader) {
  if (process.env.NODE_ENV === "test") {
    logger.info("Waitlist expiry job skipped in test environment");
    return;
  }

  if (intervalId) {
    logger.warn("Waitlist expiry job is already running");
    return;
  }

  const intervalMs = process.env.WAITLIST_EXPIRY_INTERVAL_MS
    ? Number(process.env.WAITLIST_EXPIRY_INTERVAL_MS)
    : DEFAULT_INTERVAL_MS;

  logger.info({ intervalMs }, "Starting waitlist expiry background job");

  intervalId = setInterval(async () => {
    try {
      const mod = await loader();
      const result = await mod.expireStalePromotions();
      if (result.expired > 0) {
        logger.info(
          { expired: result.expired },
          "Waitlist expiry job completed",
        );
      }
    } catch (error) {
      logger.error({ error }, "Waitlist expiry job failed");
    }
  }, intervalMs);
}

export function stopWaitlistExpiryJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info("Waitlist expiry background job stopped");
  }
}
