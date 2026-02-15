import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { deserializeWorkflow, WorkflowError } from "./serializer.server";
import { ensureCurrentVersion } from "./versioning.server";

export async function enterWorkflow(participantId: string, workflowId: string, userId: string) {
  const version = await ensureCurrentVersion(workflowId, userId);
  const snapshot = deserializeWorkflow(version.snapshot);

  const entryStep = snapshot.steps.find((s) => s.isEntryPoint);
  if (!entryStep) {
    throw new WorkflowError("No entry point found in workflow", 400);
  }

  await prisma.participant.update({
    where: { id: participantId },
    data: {
      currentStepId: entryStep.id,
      workflowVersionId: version.id,
      status: "PENDING",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "CREATE",
      entityType: "WorkflowEntry",
      entityId: participantId,
      description: `Participant entered workflow "${snapshot.name}" at step "${entryStep.name}"`,
      metadata: {
        workflowId,
        versionId: version.id,
        stepId: entryStep.id,
      },
    },
  });

  logger.info(
    { participantId, workflowId, versionId: version.id, stepId: entryStep.id },
    "Participant entered workflow",
  );

  return { versionId: version.id, stepId: entryStep.id };
}
