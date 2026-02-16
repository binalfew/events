import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { eventBus } from "~/lib/event-bus.server";
import { ConflictError, isPrismaNotFoundError } from "~/services/optimistic-lock.server";
import { deserializeWorkflow, WorkflowError } from "./serializer.server";
import type { ApprovalAction } from "../../generated/prisma/client.js";

export async function processWorkflowAction(
  participantId: string,
  userId: string,
  action: ApprovalAction,
  comment?: string,
  expectedVersion?: string,
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

  const previousStepId = participant.currentStepId!;
  let nextStepId: string | null = null;

  switch (action) {
    case "APPROVE":
    case "PRINT":
      nextStepId = currentStep.nextStepId;
      break;
    case "REJECT":
      nextStepId = currentStep.rejectionTargetId;
      break;
    case "BYPASS":
      nextStepId = currentStep.bypassTargetId;
      break;
    case "RETURN": {
      const lastApproval = await prisma.approval.findFirst({
        where: { participantId },
        orderBy: { createdAt: "desc" },
      });
      nextStepId = lastApproval?.stepId ?? null;
      break;
    }
    case "ESCALATE":
      nextStepId = currentStep.escalationTargetId;
      break;
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

  logger.info(
    { participantId, action, previousStepId, nextStepId, isComplete },
    "Processed workflow action",
  );

  return { previousStepId, nextStepId, isComplete };
}
