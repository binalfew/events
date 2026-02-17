import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { eventBus } from "~/lib/event-bus.server";

interface SLAParticipantInfo {
  id: string;
  firstName: string;
  lastName: string;
  registrationCode: string;
  tenantId: string;
}

interface SLAStepInfo {
  id: string;
  name: string;
}

export async function sendSLAWarningNotification(
  participant: SLAParticipantInfo,
  step: SLAStepInfo,
  remainingMinutes: number,
): Promise<void> {
  logger.warn(
    {
      participantId: participant.id,
      stepId: step.id,
      stepName: step.name,
      remainingMinutes,
      registrationCode: participant.registrationCode,
    },
    `SLA warning: ${participant.firstName} ${participant.lastName} has ${remainingMinutes} minutes remaining at step "${step.name}"`,
  );

  await prisma.auditLog.create({
    data: {
      tenantId: participant.tenantId,
      userId: "SYSTEM",
      action: "UPDATE",
      entityType: "SLAWarning",
      entityId: participant.id,
      description: `SLA warning: ${remainingMinutes} minutes remaining at step "${step.name}"`,
      metadata: {
        stepId: step.id,
        remainingMinutes,
        participantName: `${participant.firstName} ${participant.lastName}`,
      },
    },
  });

  // Fire-and-forget SSE event
  try {
    eventBus.publish("dashboard", participant.tenantId, "sla:warning", {
      participantId: participant.id,
      participantName: `${participant.firstName} ${participant.lastName}`,
      stepName: step.name,
      remainingMinutes,
    });
  } catch {
    // SSE failures must never break SLA notifications
  }

  // Fire-and-forget webhook event
  try {
    const { emitWebhookEvent } = await import("~/lib/webhook-emitter.server");
    emitWebhookEvent(participant.tenantId, "sla.warning", {
      participantId: participant.id,
      participantName: `${participant.firstName} ${participant.lastName}`,
      registrationCode: participant.registrationCode,
      stepId: step.id,
      stepName: step.name,
      remainingMinutes,
    });
  } catch {
    // Webhook failures must never break SLA notifications
  }
}

export async function sendSLABreachNotification(
  participant: SLAParticipantInfo,
  step: SLAStepInfo,
  overdueMinutes: number,
): Promise<void> {
  logger.error(
    {
      participantId: participant.id,
      stepId: step.id,
      stepName: step.name,
      overdueMinutes,
      registrationCode: participant.registrationCode,
    },
    `SLA breached: ${participant.firstName} ${participant.lastName} is ${overdueMinutes} minutes overdue at step "${step.name}"`,
  );

  await prisma.auditLog.create({
    data: {
      tenantId: participant.tenantId,
      userId: "SYSTEM",
      action: "SLA_BREACH",
      entityType: "Participant",
      entityId: participant.id,
      description: `SLA breached: ${overdueMinutes} minutes overdue at step "${step.name}"`,
      metadata: {
        stepId: step.id,
        overdueMinutes,
        participantName: `${participant.firstName} ${participant.lastName}`,
      },
    },
  });

  // Fire-and-forget SSE event
  try {
    eventBus.publish("dashboard", participant.tenantId, "sla:breached", {
      participantId: participant.id,
      participantName: `${participant.firstName} ${participant.lastName}`,
      stepName: step.name,
      overdueMinutes,
    });
  } catch {
    // SSE failures must never break SLA notifications
  }

  // Fire-and-forget webhook event
  try {
    const { emitWebhookEvent } = await import("~/lib/webhook-emitter.server");
    emitWebhookEvent(participant.tenantId, "sla.breached", {
      participantId: participant.id,
      participantName: `${participant.firstName} ${participant.lastName}`,
      registrationCode: participant.registrationCode,
      stepId: step.id,
      stepName: step.name,
      overdueMinutes,
    });
  } catch {
    // Webhook failures must never break SLA notifications
  }
}
