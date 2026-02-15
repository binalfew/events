import { logger } from "~/lib/logger.server";
import { checkOverdueSLAs } from "~/services/workflow-engine/sla-checker.server";

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startSLACheckJob(): void {
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
      const result = await checkOverdueSLAs();
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

export function stopSLACheckJob(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info("SLA check background job stopped");
  }
}
