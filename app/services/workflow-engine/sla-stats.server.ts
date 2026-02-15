import { prisma } from "~/lib/db.server";
import { deserializeWorkflow } from "./serializer.server";

export async function getSLAStats(workflowId: string) {
  const participants = await prisma.participant.findMany({
    where: {
      workflowId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      currentStepId: { not: null },
      workflowVersionId: { not: null },
      deletedAt: null,
    },
    include: {
      workflowVersion: true,
      approvals: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  let totalWithSLA = 0;
  let withinSLA = 0;
  let warningZone = 0;
  let breached = 0;
  const stepTimes: Record<string, number[]> = {};

  const now = new Date();

  for (const participant of participants) {
    if (!participant.workflowVersion) continue;

    let snapshot;
    try {
      snapshot = deserializeWorkflow(participant.workflowVersion.snapshot);
    } catch {
      continue;
    }

    const currentStep = snapshot.steps.find((s) => s.id === participant.currentStepId);
    if (!currentStep) continue;

    const stepEnteredAt =
      participant.approvals.length > 0 ? participant.approvals[0].createdAt : participant.createdAt;

    const timeAtStepMinutes = Math.floor((now.getTime() - stepEnteredAt.getTime()) / 60000);

    if (!stepTimes[currentStep.id]) {
      stepTimes[currentStep.id] = [];
    }
    stepTimes[currentStep.id].push(timeAtStepMinutes);

    if (!currentStep.slaDurationMinutes) continue;

    totalWithSLA++;

    const deadlineMs = stepEnteredAt.getTime() + currentStep.slaDurationMinutes * 60 * 1000;

    if (now.getTime() > deadlineMs) {
      breached++;
    } else if (
      currentStep.slaWarningMinutes &&
      now.getTime() >= deadlineMs - currentStep.slaWarningMinutes * 60 * 1000
    ) {
      warningZone++;
    } else {
      withinSLA++;
    }
  }

  const averageTimeAtStep: Record<string, number> = {};
  for (const [stepId, times] of Object.entries(stepTimes)) {
    averageTimeAtStep[stepId] = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
  }

  return { totalWithSLA, withinSLA, warningZone, breached, averageTimeAtStep };
}

export async function getOverdueParticipants(
  workflowId: string,
  options?: { stepId?: string; onlyBreached?: boolean },
) {
  const where: Record<string, unknown> = {
    workflowId,
    status: { in: ["PENDING", "IN_PROGRESS"] },
    currentStepId: { not: null },
    workflowVersionId: { not: null },
    deletedAt: null,
  };
  if (options?.stepId) {
    where.currentStepId = options.stepId;
  }

  const participants = await prisma.participant.findMany({
    where,
    include: {
      workflowVersion: true,
      approvals: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const now = new Date();
  const results: Array<{
    participant: (typeof participants)[number];
    step: { id: string; name: string };
    enteredAt: Date;
    deadline: Date;
    overdueMinutes: number;
    status: "warning" | "breached";
  }> = [];

  for (const participant of participants) {
    if (!participant.workflowVersion) continue;

    let snapshot;
    try {
      snapshot = deserializeWorkflow(participant.workflowVersion.snapshot);
    } catch {
      continue;
    }

    const currentStep = snapshot.steps.find((s) => s.id === participant.currentStepId);
    if (!currentStep || !currentStep.slaDurationMinutes) continue;

    const stepEnteredAt =
      participant.approvals.length > 0 ? participant.approvals[0].createdAt : participant.createdAt;

    const deadlineMs = stepEnteredAt.getTime() + currentStep.slaDurationMinutes * 60 * 1000;
    const deadline = new Date(deadlineMs);

    if (now.getTime() > deadlineMs) {
      const overdueMinutes = Math.floor((now.getTime() - deadlineMs) / 60000);
      results.push({
        participant,
        step: { id: currentStep.id, name: currentStep.name },
        enteredAt: stepEnteredAt,
        deadline,
        overdueMinutes,
        status: "breached",
      });
    } else if (!options?.onlyBreached && currentStep.slaWarningMinutes) {
      const warningMs = deadlineMs - currentStep.slaWarningMinutes * 60 * 1000;
      if (now.getTime() >= warningMs) {
        const overdueMinutes = Math.floor((now.getTime() - deadlineMs) / 60000);
        results.push({
          participant,
          step: { id: currentStep.id, name: currentStep.name },
          enteredAt: stepEnteredAt,
          deadline,
          overdueMinutes,
          status: "warning",
        });
      }
    }
  }

  // Sort by urgency: breached first (most overdue first), then warnings
  results.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "breached" ? -1 : 1;
    }
    return b.overdueMinutes - a.overdueMinutes;
  });

  return results;
}
