import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { eventBus } from "~/lib/event-bus.server";
import { evaluateCondition } from "~/lib/condition-evaluator";
import { ConflictError, isPrismaNotFoundError } from "~/services/optimistic-lock.server";
import { deserializeWorkflow, WorkflowError } from "./serializer.server";
import { executeFork } from "./fork-executor.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import type { StepSnapshot, ConditionalRoute } from "./serializer.server";
import type { ApprovalAction } from "../../generated/prisma/client.js";

/**
 * Evaluate conditional routes against participant data.
 * Routes are sorted by priority (ascending). First matching condition wins.
 * Returns the target step ID if a match is found, null otherwise.
 */
export function evaluateConditionalRoutes(
  routes: ConditionalRoute[] | undefined,
  participantData: Record<string, unknown>,
): string | null {
  if (!routes || routes.length === 0) return null;

  const sorted = [...routes].sort((a, b) => a.priority - b.priority);

  for (const route of sorted) {
    if (evaluateCondition(route.condition, participantData)) {
      return route.targetStepId;
    }
  }

  return null;
}

/**
 * Resolve the next step for a given action, considering conditional routes.
 * For APPROVE/PRINT: check conditionalRoutes first, fall back to nextStepId.
 * For REJECT: check rejectionConditionalRoutes first, fall back to rejectionTargetId.
 * For BYPASS/ESCALATE/RETURN: no conditional routing (explicit overrides).
 */
export function resolveNextStep(
  step: StepSnapshot,
  action: ApprovalAction,
  participantData: Record<string, unknown>,
  conditionalRoutingEnabled: boolean,
): string | null {
  if (conditionalRoutingEnabled) {
    switch (action) {
      case "APPROVE":
      case "PRINT": {
        const conditionalTarget = evaluateConditionalRoutes(
          step.conditionalRoutes,
          participantData,
        );
        if (conditionalTarget) return conditionalTarget;
        break;
      }
      case "REJECT": {
        const conditionalTarget = evaluateConditionalRoutes(
          step.rejectionConditionalRoutes,
          participantData,
        );
        if (conditionalTarget) return conditionalTarget;
        break;
      }
    }
  }

  // Default routing (no conditional match or feature disabled)
  switch (action) {
    case "APPROVE":
    case "PRINT":
      return step.nextStepId;
    case "REJECT":
      return step.rejectionTargetId;
    case "BYPASS":
      return step.bypassTargetId;
    case "ESCALATE":
      return step.escalationTargetId;
    default:
      return null;
  }
}

/**
 * Build participant data object for condition evaluation.
 * Merges fixed fields with extras JSONB data.
 */
function buildParticipantData(participant: {
  firstName: string;
  lastName: string;
  email: string | null;
  status: string;
  extras: unknown;
}): Record<string, unknown> {
  const data: Record<string, unknown> = {
    firstName: participant.firstName,
    lastName: participant.lastName,
    email: participant.email,
    status: participant.status,
  };

  // Merge extras (dynamic fields) into flat namespace
  if (participant.extras && typeof participant.extras === "object") {
    Object.assign(data, participant.extras);
  }

  return data;
}

export async function processWorkflowAction(
  participantId: string,
  userId: string,
  action: ApprovalAction,
  comment?: string,
  expectedVersion?: string,
  conditionalRoutingEnabled = false,
) {
  const participant = await prisma.participant.findFirst({
    where: { id: participantId, deletedAt: null },
    include: { workflowVersion: true },
  });

  if (!participant) {
    throw new WorkflowError("Participant not found", 404);
  }

  if (expectedVersion) {
    const currentVersion = participant.updatedAt.toISOString();
    if (currentVersion !== expectedVersion) {
      throw new ConflictError("Participant was modified by another user", {
        id: participant.id,
        status: participant.status,
        currentStepId: participant.currentStepId,
        updatedAt: participant.updatedAt,
      });
    }
  }

  if (!participant.workflowVersion) {
    throw new WorkflowError("Participant has no workflow version assigned", 400);
  }

  const snapshot = deserializeWorkflow(participant.workflowVersion.snapshot);
  const currentStep = snapshot.steps.find((s) => s.id === participant.currentStepId);

  if (!currentStep) {
    throw new WorkflowError("Current step not found in workflow version snapshot", 400);
  }

  // FORK guard: standard actions cannot be processed on a FORK step
  if (currentStep.stepType === "FORK") {
    throw new WorkflowError(
      "Cannot process standard action on FORK step. Use processBranchAction.",
      400,
    );
  }

  const previousStepId = participant.currentStepId!;
  let nextStepId: string | null = null;

  if (action === "RETURN") {
    const lastApproval = await prisma.approval.findFirst({
      where: { participantId },
      orderBy: { createdAt: "desc" },
    });
    nextStepId = lastApproval?.stepId ?? null;
  } else {
    const participantData = buildParticipantData(participant);
    nextStepId = resolveNextStep(currentStep, action, participantData, conditionalRoutingEnabled);
  }

  // FORK detection: if next step is a FORK, execute fork instead of normal transition
  if (nextStepId) {
    const nextStep = snapshot.steps.find((s) => s.id === nextStepId);
    if (nextStep?.stepType === "FORK") {
      const parallelEnabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.PARALLEL_WORKFLOWS, {
        tenantId: participant.tenantId,
      });
      if (parallelEnabled) {
        // Create approval for current step (pre-fork)
        await prisma.approval.create({
          data: {
            participantId,
            stepId: previousStepId,
            userId,
            action,
            remarks: comment ?? null,
          },
        });
        await prisma.auditLog.create({
          data: {
            userId,
            action:
              action === "APPROVE" || action === "BYPASS"
                ? "APPROVE"
                : action === "REJECT"
                  ? "REJECT"
                  : "UPDATE",
            entityType: "Participant",
            entityId: participantId,
            description: `${action} on step "${currentStep.name}" (pre-fork)`,
            metadata: {
              previousStepId,
              nextStepId,
              preFork: true,
              workflowVersionId: participant.workflowVersion.id,
            },
          },
        });
        // Execute fork
        await executeFork(participantId, nextStep, participant.tenantId, userId);
        return { previousStepId, nextStepId, isComplete: false };
      }
    }
  }

  let isComplete = false;
  let status: "IN_PROGRESS" | "APPROVED" | "PENDING";

  if (nextStepId === null && currentStep.isFinalStep) {
    isComplete = true;
    status = "APPROVED";
  } else if (nextStepId !== null) {
    isComplete = false;
    status = "IN_PROGRESS";
  } else {
    throw new WorkflowError(
      `No target step configured for action "${action}" on step "${currentStep.name}"`,
      400,
    );
  }

  const updateWhere: Record<string, unknown> = { id: participantId };
  if (expectedVersion) {
    updateWhere.updatedAt = new Date(expectedVersion);
  }

  try {
    await prisma.participant.update({
      where: updateWhere as { id: string; updatedAt?: Date },
      data: {
        currentStepId: isComplete ? previousStepId : nextStepId,
        status,
      },
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      // Re-fetch to get current state for conflict response
      const current = await prisma.participant.findFirst({
        where: { id: participantId },
      });
      throw new ConflictError("Participant was modified by another user", {
        id: current?.id,
        status: current?.status,
        currentStepId: current?.currentStepId,
        updatedAt: current?.updatedAt,
      });
    }
    throw error;
  }

  await prisma.approval.create({
    data: {
      participantId,
      stepId: previousStepId,
      userId,
      action,
      remarks: comment ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action:
        action === "APPROVE" || action === "BYPASS"
          ? "APPROVE"
          : action === "REJECT"
            ? "REJECT"
            : action === "PRINT"
              ? "PRINT"
              : "UPDATE",
      entityType: "Participant",
      entityId: participantId,
      description: `${action} on step "${currentStep.name}"`,
      metadata: {
        previousStepId,
        nextStepId,
        isComplete,
        workflowVersionId: participant.workflowVersion.id,
      },
    },
  });

  // Fire-and-forget SSE event publishing
  try {
    if (action === "APPROVE" || action === "BYPASS") {
      eventBus.publish("validation", participant.tenantId, "participant:approved", {
        participantId,
        participantName: `${participant.firstName} ${participant.lastName}`,
        stepName: currentStep.name,
      });
    } else if (action === "REJECT") {
      eventBus.publish("validation", participant.tenantId, "participant:rejected", {
        participantId,
        participantName: `${participant.firstName} ${participant.lastName}`,
        stepName: currentStep.name,
      });
    }
  } catch {
    // SSE failures must never break core workflow
  }

  // Fire-and-forget webhook event emission
  try {
    const { emitWebhookEvent } = await import("~/lib/webhook-emitter.server");
    const webhookPayload = {
      participantId,
      participantName: `${participant.firstName} ${participant.lastName}`,
      stepName: currentStep.name,
      previousStepId,
      nextStepId,
      isComplete,
      action,
    };

    if (action === "APPROVE") {
      emitWebhookEvent(participant.tenantId, "participant.approved", webhookPayload);
    } else if (action === "BYPASS") {
      emitWebhookEvent(participant.tenantId, "participant.bypassed", webhookPayload);
    } else if (action === "REJECT") {
      emitWebhookEvent(participant.tenantId, "participant.rejected", webhookPayload);
    }

    // Always emit status_changed for any workflow action
    emitWebhookEvent(participant.tenantId, "participant.status_changed", webhookPayload);
  } catch {
    // Webhook failures must never break core workflow
  }

  logger.info(
    { participantId, action, previousStepId, nextStepId, isComplete },
    "Processed workflow action",
  );

  return { previousStepId, nextStepId, isComplete };
}
