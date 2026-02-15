import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { deserializeWorkflow, WorkflowError } from "./serializer.server";
import type { ApprovalAction } from "../../generated/prisma/client.js";

export async function processWorkflowAction(
  participantId: string,
  userId: string,
  action: ApprovalAction,
  comment?: string,
) {
  const participant = await prisma.participant.findFirst({
    where: { id: participantId, deletedAt: null },
    include: { workflowVersion: true },
  });

  if (!participant) {
    throw new WorkflowError("Participant not found", 404);
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

  await prisma.participant.update({
    where: { id: participantId },
    data: {
      currentStepId: isComplete ? previousStepId : nextStepId,
      status,
    },
  });

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

  logger.info(
    { participantId, action, previousStepId, nextStepId, isComplete },
    "Processed workflow action",
  );

  return { previousStepId, nextStepId, isComplete };
}
