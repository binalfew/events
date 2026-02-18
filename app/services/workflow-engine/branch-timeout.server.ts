import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { deserializeWorkflow } from "./serializer.server";
import { parseForkConfig } from "./fork-executor.server";
import { parseJoinConfig } from "./join-evaluator.server";

export interface BranchTimeoutResult {
  checked: number;
  timedOut: number;
  errors: number;
}

/**
 * Check for timed-out parallel branches and apply the configured timeout action.
 * Called periodically by the background job.
 */
export async function processTimedOutBranches(): Promise<BranchTimeoutResult> {
  const result: BranchTimeoutResult = { checked: 0, timedOut: 0, errors: 0 };

  // Find all PENDING branches where the participant is at a FORK step
  const pendingBranches = await prisma.parallelBranch.findMany({
    where: { status: "PENDING" },
    include: {
      participant: {
        include: { workflowVersion: true },
      },
    },
  });

  const now = new Date();

  for (const branch of pendingBranches) {
    result.checked++;

    if (!branch.participant.workflowVersion) continue;

    let snapshot;
    try {
      snapshot = deserializeWorkflow(branch.participant.workflowVersion.snapshot);
    } catch {
      logger.error(
        { branchId: branch.id, participantId: branch.participantId },
        "Failed to deserialize workflow snapshot for branch timeout check",
      );
      result.errors++;
      continue;
    }

    const forkStep = snapshot.steps.find((s) => s.id === branch.forkStepId);
    if (!forkStep) continue;

    let forkConfig;
    try {
      forkConfig = parseForkConfig(forkStep);
    } catch {
      continue;
    }

    const joinStep = snapshot.steps.find((s) => s.id === forkConfig.joinStepId);
    if (!joinStep) continue;

    let joinConfig;
    try {
      joinConfig = parseJoinConfig(joinStep);
    } catch {
      continue;
    }

    if (!joinConfig.timeoutMinutes) continue;

    const branchAgeMs = now.getTime() - branch.createdAt.getTime();
    const timeoutMs = joinConfig.timeoutMinutes * 60 * 1000;

    if (branchAgeMs > timeoutMs) {
      try {
        // Determine action from timeout config
        const timeoutAction = joinConfig.timeoutAction ?? "REJECT";
        // ESCALATE maps to REJECT with special remarks
        const branchAction: "APPROVE" | "REJECT" =
          timeoutAction === "APPROVE" ? "APPROVE" : "REJECT";
        const remarks =
          timeoutAction === "ESCALATE"
            ? "Branch timed out (escalated)"
            : `Branch timed out after ${joinConfig.timeoutMinutes} minutes`;

        const { processBranchAction } = await import("./branch-action.server");
        await processBranchAction(
          branch.participantId,
          branch.forkStepId,
          branch.branchStepId,
          "SYSTEM",
          branchAction,
          remarks,
        );

        result.timedOut++;
        logger.info(
          {
            branchId: branch.id,
            participantId: branch.participantId,
            timeoutAction,
            branchAction,
          },
          "Branch timed out, action applied",
        );
      } catch (error) {
        result.errors++;
        logger.error(
          {
            branchId: branch.id,
            participantId: branch.participantId,
            error: error instanceof Error ? error.message : String(error),
          },
          "Failed to process branch timeout",
        );
      }
    }
  }

  return result;
}
