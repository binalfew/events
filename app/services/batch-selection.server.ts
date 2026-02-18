import { prisma } from "~/lib/db.server";
import { resolveAudience } from "~/services/audience-filter.server";
import { deserializeWorkflow } from "~/services/workflow-engine/serializer.server";
import type { AudienceFilter } from "~/lib/schemas/broadcast";
import type { ApprovalAction } from "../generated/prisma/client.js";

// ─── Types ───────────────────────────────────────────────

export interface EligibilityResult {
  eligible: string[];
  ineligible: { id: string; name: string; reason: string }[];
}

// ─── Select by IDs ──────────────────────────────────────

export async function selectByIds(
  ids: string[],
  eventId: string,
  tenantId: string,
): Promise<string[]> {
  if (ids.length === 0) return [];

  const participants = await prisma.participant.findMany({
    where: {
      id: { in: ids },
      eventId,
      tenantId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return participants.map((p) => p.id);
}

// ─── Select by Filter ───────────────────────────────────

export async function selectByFilter(
  eventId: string,
  tenantId: string,
  filter: AudienceFilter,
): Promise<string[]> {
  const contacts = await resolveAudience(eventId, tenantId, filter);
  return contacts.map((c) => c.id);
}

// ─── Validate Eligibility ───────────────────────────────

export async function validateBatchEligibility(
  participantIds: string[],
  action: ApprovalAction,
  tenantId: string,
): Promise<EligibilityResult> {
  if (participantIds.length === 0) {
    return { eligible: [], ineligible: [] };
  }

  const participants = await prisma.participant.findMany({
    where: {
      id: { in: participantIds },
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      currentStepId: true,
      workflowVersion: {
        select: { snapshot: true },
      },
    },
  });

  const eligible: string[] = [];
  const ineligible: EligibilityResult["ineligible"] = [];

  for (const participant of participants) {
    const name = `${participant.firstName} ${participant.lastName}`;

    if (!participant.workflowVersion) {
      ineligible.push({ id: participant.id, name, reason: "No workflow version assigned" });
      continue;
    }

    if (!participant.currentStepId) {
      ineligible.push({ id: participant.id, name, reason: "No current step" });
      continue;
    }

    const snapshot = deserializeWorkflow(participant.workflowVersion.snapshot);
    const currentStep = snapshot.steps.find((s) => s.id === participant.currentStepId);

    if (!currentStep) {
      ineligible.push({ id: participant.id, name, reason: "Current step not found in workflow" });
      continue;
    }

    switch (action) {
      case "APPROVE": {
        if (currentStep.nextStepId !== null || currentStep.isFinalStep) {
          eligible.push(participant.id);
        } else {
          ineligible.push({
            id: participant.id,
            name,
            reason: "No next step configured for approval",
          });
        }
        break;
      }
      case "REJECT": {
        if (currentStep.rejectionTargetId !== null) {
          eligible.push(participant.id);
        } else {
          ineligible.push({
            id: participant.id,
            name,
            reason: "No rejection target configured",
          });
        }
        break;
      }
      case "BYPASS": {
        if (currentStep.bypassTargetId !== null) {
          eligible.push(participant.id);
        } else {
          ineligible.push({
            id: participant.id,
            name,
            reason: "No bypass target configured",
          });
        }
        break;
      }
      default: {
        ineligible.push({ id: participant.id, name, reason: `Unsupported action: ${action}` });
      }
    }
  }

  return { eligible, ineligible };
}
