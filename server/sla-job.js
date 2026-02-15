// @ts-nocheck
import { logger } from "./logger.js";

/** @type {ReturnType<typeof setInterval> | null} */
let intervalId = null;

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Start the SLA check background job.
 * @param {() => Promise<{ checkOverdueSLAs: () => Promise<unknown> }>} loader
 */
export function startSLACheckJob(loader) {
  if (process.env.NODE_ENV === "test") {
    logger.info("SLA check job skipped in test environment");
    return;
  }

  if (intervalId) {
    logger.warn("SLA check job is already running");
    return;
  }

  const intervalMs = process.env.SLA_CHECK_INTERVAL_MS
    ? Number(process.env.SLA_CHECK_INTERVAL_MS)
    : DEFAULT_INTERVAL_MS;

  logger.info({ intervalMs }, "Starting SLA check background job");

  intervalId = setInterval(async () => {
    try {
      const mod = await loader();
      const result = await mod.checkOverdueSLAs();
      logger.info(
        {
          checked: result.checked,
          warnings: result.warnings,
          breached: result.breached,
          actionsExecuted: result.actions.length,
        },
        "SLA check completed",
      );
    } catch (error) {
      logger.error({ error }, "SLA check job failed");
    }
  }, intervalMs);
}

export function stopSLACheckJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info("SLA check background job stopped");
  }
}
