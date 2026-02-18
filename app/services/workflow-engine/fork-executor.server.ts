import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { eventBus } from "~/lib/event-bus.server";
import { WorkflowError } from "./serializer.server";
import type { StepSnapshot } from "./serializer.server";
import type { ForkConfig } from "./parallel-types";

/**
 * Parse and validate a ForkConfig from a FORK step's snapshot.
 */
export function parseForkConfig(step: StepSnapshot): ForkConfig {
  const config = step.forkConfig;

  if (!config) {
    throw new WorkflowError(`FORK step "${step.name}" has no forkConfig`, 400);
  }

  if (!Array.isArray(config.branches) || config.branches.length === 0) {
    throw new WorkflowError(`FORK step "${step.name}" has no branches configured`, 400);
  }

  if (!config.joinStepId) {
    throw new WorkflowError(`FORK step "${step.name}" has no joinStepId configured`, 400);
  }

  return {
    branches: config.branches,
    joinStepId: config.joinStepId,
  };
}

/**
 * Execute a fork: create ParallelBranch records for each branch,
 * update participant to the FORK step, and emit events.
 */
export async function executeFork(
  participantId: string,
  forkStep: StepSnapshot,
  tenantId: string,
  userId: string,
): Promise<void> {
  const forkConfig = parseForkConfig(forkStep);

  // Create ParallelBranch records for each branch
  await prisma.parallelBranch.createMany({
    data: forkConfig.branches.map((branch) => ({
      participantId,
      forkStepId: forkStep.id,
      branchStepId: branch.branchStepId,
      status: "PENDING",
    })),
  });

  // Update participant: status IN_PROGRESS, currentStepId = FORK step
  await prisma.participant.update({
    where: { id: participantId },
    data: {
      status: "IN_PROGRESS",
      currentStepId: forkStep.id,
    },
  });

  // Create AuditLog for the fork
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action: "UPDATE",
      entityType: "Participant",
      entityId: participantId,
      description: `Forked into ${forkConfig.branches.length} parallel branches at step "${forkStep.name}"`,
      metadata: {
        fork: true,
        forkStepId: forkStep.id,
        branchCount: forkConfig.branches.length,
        joinStepId: forkConfig.joinStepId,
      },
    },
  });

  // Fetch participant name for events
  const participant = await prisma.participant.findFirst({
    where: { id: participantId },
    select: { firstName: true, lastName: true },
  });
  const participantName = participant
    ? `${participant.firstName} ${participant.lastName}`
    : participantId;

  // Fire-and-forget SSE event
  try {
    eventBus.publish("validation", tenantId, "parallel:forked", {
      participantId,
      participantName,
      forkStepName: forkStep.name,
      branchCount: forkConfig.branches.length,
    });
  } catch {
    // SSE failures must never break core workflow
  }

  // Fire-and-forget webhook event
  try {
    const { emitWebhookEvent } = await import("~/lib/webhook-emitter.server");
    emitWebhookEvent(tenantId, "parallel.forked", {
      participantId,
      participantName,
      forkStepId: forkStep.id,
      forkStepName: forkStep.name,
      branchCount: forkConfig.branches.length,
      branches: forkConfig.branches,
      joinStepId: forkConfig.joinStepId,
    });
  } catch {
    // Webhook failures must never break core workflow
  }

  logger.info(
    { participantId, forkStepId: forkStep.id, branchCount: forkConfig.branches.length },
    "Executed parallel fork",
  );
}
