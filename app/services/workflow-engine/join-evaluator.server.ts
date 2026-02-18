import { prisma } from "~/lib/db.server";
import { WorkflowError } from "./serializer.server";
import type { StepSnapshot } from "./serializer.server";
import type { JoinConfig, JoinStrategy, JoinSummary, JoinEvaluationResult } from "./parallel-types";

/**
 * Parse and validate a JoinConfig from a JOIN step's snapshot.
 */
export function parseJoinConfig(step: StepSnapshot): JoinConfig {
  const config = step.joinConfig;

  if (!config) {
    throw new WorkflowError(`JOIN step "${step.name}" has no joinConfig`, 400);
  }

  const strategy = config.strategy as JoinStrategy;
  if (!["ALL", "ANY", "MAJORITY"].includes(strategy)) {
    throw new WorkflowError(
      `JOIN step "${step.name}" has invalid strategy: ${config.strategy}`,
      400,
    );
  }

  return {
    strategy,
    ...(config.timeoutMinutes != null ? { timeoutMinutes: config.timeoutMinutes } : {}),
    ...(config.timeoutAction != null
      ? { timeoutAction: config.timeoutAction as "APPROVE" | "REJECT" | "ESCALATE" }
      : {}),
  };
}

/**
 * Pure function: evaluate whether join conditions are met based on strategy.
 */
export function evaluateStrategy(
  strategy: JoinStrategy,
  summary: JoinSummary,
): { satisfied: boolean; failed: boolean; action: "APPROVE" | "REJECT" | null } {
  switch (strategy) {
    case "ALL":
      // All branches must approve. Any rejection is a fail-fast.
      if (summary.rejectedBranches > 0) {
        return { satisfied: false, failed: true, action: "REJECT" };
      }
      if (summary.approvedBranches === summary.totalBranches) {
        return { satisfied: true, failed: false, action: "APPROVE" };
      }
      return { satisfied: false, failed: false, action: null };

    case "ANY":
      // Any single approval is enough. Only fail if all rejected.
      if (summary.approvedBranches > 0) {
        return { satisfied: true, failed: false, action: "APPROVE" };
      }
      if (summary.rejectedBranches === summary.totalBranches) {
        return { satisfied: false, failed: true, action: "REJECT" };
      }
      return { satisfied: false, failed: false, action: null };

    case "MAJORITY":
      // More than half must approve. More than half rejected = failed.
      if (summary.approvedBranches > summary.totalBranches / 2) {
        return { satisfied: true, failed: false, action: "APPROVE" };
      }
      if (summary.rejectedBranches > summary.totalBranches / 2) {
        return { satisfied: false, failed: true, action: "REJECT" };
      }
      // Check if majority is still possible
      const remainingBranches = summary.pendingBranches;
      if (summary.approvedBranches + remainingBranches <= summary.totalBranches / 2) {
        // Even if all pending approve, can't reach majority
        return { satisfied: false, failed: true, action: "REJECT" };
      }
      return { satisfied: false, failed: false, action: null };

    default:
      return { satisfied: false, failed: false, action: null };
  }
}

/**
 * Evaluate join conditions by querying branch records and applying strategy.
 */
export async function evaluateJoin(
  participantId: string,
  forkStepId: string,
  joinConfig: JoinConfig,
): Promise<JoinEvaluationResult> {
  const branches = await prisma.parallelBranch.findMany({
    where: { participantId, forkStepId },
  });

  const summary: JoinSummary = {
    totalBranches: branches.length,
    completedBranches: branches.filter((b) => b.status !== "PENDING").length,
    approvedBranches: branches.filter((b) => b.status === "APPROVED").length,
    rejectedBranches: branches.filter((b) => b.status === "REJECTED").length,
    pendingBranches: branches.filter((b) => b.status === "PENDING").length,
  };

  const { satisfied, failed, action } = evaluateStrategy(joinConfig.strategy, summary);

  return { satisfied, failed, action, summary };
}
