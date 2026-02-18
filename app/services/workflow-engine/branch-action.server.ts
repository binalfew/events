import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { eventBus } from "~/lib/event-bus.server";
import { WorkflowError, deserializeWorkflow } from "./serializer.server";
import { parseForkConfig } from "./fork-executor.server";
import { parseJoinConfig, evaluateJoin } from "./join-evaluator.server";
import type { BranchActionResult } from "./parallel-types";

/**
 * Process an action (APPROVE/REJECT) on a single parallel branch.
 * After updating the branch, evaluates the join condition. If satisfied or failed,
 * advances the participant to the JOIN step via processWorkflowAction().
 */
export async function processBranchAction(
  participantId: string,
  forkStepId: string,
  branchStepId: string,
  userId: string,
  action: "APPROVE" | "REJECT",
  remarks?: string,
): Promise<BranchActionResult> {
  // Find the PENDING branch record
  const branch = await prisma.parallelBranch.findFirst({
    where: {
      participantId,
      forkStepId,
      branchStepId,
      status: "PENDING",
    },
  });

  if (!branch) {
    throw new WorkflowError(
      `No pending branch found for participant ${participantId} at fork ${forkStepId}, branch ${branchStepId}`,
      404,
    );
  }

  const branchStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  // Update branch record
  await prisma.parallelBranch.update({
    where: { id: branch.id },
    data: {
      status: branchStatus,
      completedAt: new Date(),
      completedBy: userId,
      action,
      remarks: remarks ?? null,
    },
  });

  // Create Approval record for this branch action
  await prisma.approval.create({
    data: {
      participantId,
      stepId: branchStepId,
      userId,
      action,
      remarks: remarks ?? null,
      metadata: {
        forkStepId,
        branchAction: true,
      },
    },
  });

  // Get participant info for audit log
  const participant = await prisma.participant.findFirst({
    where: { id: participantId },
    include: { workflowVersion: true },
  });

  if (!participant) {
    throw new WorkflowError("Participant not found", 404);
  }

  // Create AuditLog with branch context
  await prisma.auditLog.create({
    data: {
      tenantId: participant.tenantId,
      userId,
      action: action === "APPROVE" ? "APPROVE" : "REJECT",
      entityType: "Participant",
      entityId: participantId,
      description: `${action} on parallel branch (step ${branchStepId}) at fork ${forkStepId}`,
      metadata: {
        forkStepId,
        branchStepId,
        branchAction: true,
        remarks,
      },
    },
  });

  // Evaluate join condition
  if (!participant.workflowVersion) {
    throw new WorkflowError("Participant has no workflow version assigned", 400);
  }

  const snapshot = deserializeWorkflow(participant.workflowVersion.snapshot);
  const forkStep = snapshot.steps.find((s) => s.id === forkStepId);

  if (!forkStep) {
    throw new WorkflowError(`Fork step ${forkStepId} not found in workflow snapshot`, 400);
  }

  const forkConfig = parseForkConfig(forkStep);
  const joinStep = snapshot.steps.find((s) => s.id === forkConfig.joinStepId);

  if (!joinStep) {
    throw new WorkflowError(
      `Join step ${forkConfig.joinStepId} not found in workflow snapshot`,
      400,
    );
  }

  const joinConfig = parseJoinConfig(joinStep);
  const joinEvaluation = await evaluateJoin(participantId, forkStepId, joinConfig);

  let participantAdvanced = false;

  // If join conditions are met (satisfied or failed), advance to JOIN step
  if (joinEvaluation.satisfied || joinEvaluation.failed) {
    const joinAction = joinEvaluation.action;

    if (joinAction) {
      // Move participant to JOIN step
      await prisma.participant.update({
        where: { id: participantId },
        data: { currentStepId: joinStep.id },
      });

      // Use dynamic import to avoid circular dependency
      const { processWorkflowAction } = await import("./navigation.server");
      await processWorkflowAction(participantId, userId, joinAction);

      participantAdvanced = true;

      // Fire-and-forget SSE event
      try {
        eventBus.publish("validation", participant.tenantId, "parallel:joined", {
          participantId,
          participantName: `${participant.firstName} ${participant.lastName}`,
          joinStepName: joinStep.name,
          action: joinAction,
        });
      } catch {
        // SSE failures must never break core workflow
      }

      // Fire-and-forget webhook event
      try {
        const { emitWebhookEvent } = await import("~/lib/webhook-emitter.server");
        emitWebhookEvent(participant.tenantId, "parallel.joined", {
          participantId,
          participantName: `${participant.firstName} ${participant.lastName}`,
          forkStepId,
          joinStepId: joinStep.id,
          joinStepName: joinStep.name,
          action: joinAction,
          summary: joinEvaluation.summary,
        });
      } catch {
        // Webhook failures must never break core workflow
      }

      logger.info(
        {
          participantId,
          forkStepId,
          joinStepId: joinStep.id,
          action: joinAction,
          summary: joinEvaluation.summary,
        },
        "Parallel join completed",
      );
    }
  }

  logger.info(
    {
      participantId,
      forkStepId,
      branchStepId,
      action,
      branchStatus,
      joinSatisfied: joinEvaluation.satisfied,
      joinFailed: joinEvaluation.failed,
    },
    "Processed branch action",
  );

  return {
    branchId: branch.id,
    branchStatus,
    joinEvaluation,
    participantAdvanced,
  };
}
