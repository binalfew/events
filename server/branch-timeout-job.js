// @ts-nocheck
import { logger } from "./logger.js";

/** @type {ReturnType<typeof setInterval> | null} */
let intervalId = null;

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Start the branch timeout check background job.
 * @param {() => Promise<{ processTimedOutBranches: () => Promise<unknown> }>} loader
 */
export function startBranchTimeoutJob(loader) {
  if (process.env.NODE_ENV === "test") {
    logger.info("Branch timeout job skipped in test environment");
    return;
  }

  if (intervalId) {
    logger.warn("Branch timeout job is already running");
    return;
  }

  const intervalMs = process.env.BRANCH_TIMEOUT_CHECK_INTERVAL_MS
    ? Number(process.env.BRANCH_TIMEOUT_CHECK_INTERVAL_MS)
    : DEFAULT_INTERVAL_MS;

  logger.info({ intervalMs }, "Starting branch timeout check background job");

  intervalId = setInterval(async () => {
    try {
      const mod = await loader();
      const result = await mod.processTimedOutBranches();
      logger.info(
        {
          checked: result.checked,
          timedOut: result.timedOut,
          errors: result.errors,
        },
        "Branch timeout check completed",
      );
    } catch (error) {
      logger.error({ error }, "Branch timeout check job failed");
    }
  }, intervalMs);
}

export function stopBranchTimeoutJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info("Branch timeout check background job stopped");
  }
}
