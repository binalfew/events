import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { deserializeWorkflow } from "./serializer.server";
import { processWorkflowAction } from "./navigation.server";
import { sendSLAWarningNotification, sendSLABreachNotification } from "./sla-notifications.server";
import type { SLAAction } from "../../generated/prisma/client.js";

export interface SLACheckResult {
  checked: number;
  warnings: number;
  breached: number;
  actions: SLAActionResult[];
}

export interface SLAActionResult {
  participantId: string;
  stepId: string;
  action: SLAAction;
  success: boolean;
  error?: string;
}

export async function checkOverdueSLAs(): Promise<SLACheckResult> {
  const result: SLACheckResult = {
    checked: 0,
    warnings: 0,
    breached: 0,
    actions: [],
  };

  const participants = await prisma.participant.findMany({
    where: {
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

  const now = new Date();

  for (const participant of participants) {
    if (!participant.workflowVersion) continue;

    let snapshot;
    try {
      snapshot = deserializeWorkflow(participant.workflowVersion.snapshot);
    } catch {
      logger.error(
        { participantId: participant.id },
        "Failed to deserialize workflow snapshot for SLA check",
      );
      continue;
    }

    const currentStep = snapshot.steps.find((s) => s.id === participant.currentStepId);
    if (!currentStep || !currentStep.slaDurationMinutes) continue;

    result.checked++;

    const stepEnteredAt =
      participant.approvals.length > 0 ? participant.approvals[0].createdAt : participant.createdAt;

    const deadlineMs = stepEnteredAt.getTime() + currentStep.slaDurationMinutes * 60 * 1000;
    const overdueMs = now.getTime() - deadlineMs;
    const overdueMinutes = Math.floor(overdueMs / 60000);

    if (overdueMs > 0) {
      // SLA breached
      result.breached++;

      try {
        const actionResult = await executeSLAAction(participant, currentStep, overdueMinutes);
        result.actions.push(actionResult);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(
          { participantId: participant.id, stepId: currentStep.id, error: errorMessage },
          "Failed to execute SLA action",
        );
        result.actions.push({
          participantId: participant.id,
          stepId: currentStep.id,
          action: (currentStep.slaAction as SLAAction) ?? "NOTIFY",
          success: false,
          error: errorMessage,
        });
      }
    } else if (currentStep.slaWarningMinutes) {
      // Check warning threshold
      const warningMs = deadlineMs - currentStep.slaWarningMinutes * 60 * 1000;
      if (now.getTime() >= warningMs) {
        result.warnings++;
        const remainingMinutes = Math.floor((deadlineMs - now.getTime()) / 60000);
        try {
          await sendSLAWarningNotification(
            participant,
            { id: currentStep.id, name: currentStep.name },
            remainingMinutes,
          );
        } catch (error) {
          logger.error(
            { participantId: participant.id, error },
            "Failed to send SLA warning notification",
          );
        }
      }
    }
  }

  return result;
}

interface ParticipantForSLA {
  id: string;
  firstName: string;
  lastName: string;
  registrationCode: string;
  tenantId: string;
}

interface StepForSLA {
  id: string;
  name: string;
  slaAction: string | null;
  nextStepId: string | null;
  rejectionTargetId: string | null;
  escalationTargetId: string | null;
}

async function executeSLAAction(
  participant: ParticipantForSLA,
  step: StepForSLA,
  overdueMinutes: number,
): Promise<SLAActionResult> {
  const slaAction = (step.slaAction as SLAAction) ?? "NOTIFY";
  const comment = `SLA breached: ${overdueMinutes} minutes overdue at step "${step.name}"`;

  await sendSLABreachNotification(participant, { id: step.id, name: step.name }, overdueMinutes);

  switch (slaAction) {
    case "NOTIFY":
      return {
        participantId: participant.id,
        stepId: step.id,
        action: slaAction,
        success: true,
      };

    case "ESCALATE":
      await processWorkflowAction(participant.id, "SYSTEM", "ESCALATE", comment);
      return {
        participantId: participant.id,
        stepId: step.id,
        action: slaAction,
        success: true,
      };

    case "AUTO_APPROVE":
      await processWorkflowAction(participant.id, "SYSTEM", "APPROVE", comment);
      return {
        participantId: participant.id,
        stepId: step.id,
        action: slaAction,
        success: true,
      };

    case "AUTO_REJECT":
      await processWorkflowAction(participant.id, "SYSTEM", "REJECT", comment);
      return {
        participantId: participant.id,
        stepId: step.id,
        action: slaAction,
        success: true,
      };

    case "REASSIGN":
      // Phase 1: Log reassignment intent. Full role-based reassignment in Phase 2.
      logger.info(
        { participantId: participant.id, stepId: step.id },
        "SLA REASSIGN action triggered (reassignment deferred to Phase 2)",
      );
      await prisma.auditLog.create({
        data: {
          tenantId: participant.tenantId,
          userId: "SYSTEM",
          action: "SLA_BREACH",
          entityType: "Participant",
          entityId: participant.id,
          description: `SLA REASSIGN triggered: ${overdueMinutes} minutes overdue at step "${step.name}" (reassignment deferred)`,
          metadata: { stepId: step.id, overdueMinutes, action: "REASSIGN" },
        },
      });
      return {
        participantId: participant.id,
        stepId: step.id,
        action: slaAction,
        success: true,
      };

    default:
      return {
        participantId: participant.id,
        stepId: step.id,
        action: slaAction,
        success: false,
        error: `Unknown SLA action: ${slaAction}`,
      };
  }
}
