import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { evaluateCondition } from "~/lib/condition-evaluator";
import type { VisibilityCondition } from "~/types/form-designer";
import type { AutoActionType, ApprovalAction } from "~/generated/prisma/client.js";

// ─── Constants ────────────────────────────────────────────

const SYSTEM_USER_ID = "system";
const MAX_CHAIN_DEPTH = 10;

const ACTION_TYPE_MAP: Record<AutoActionType, ApprovalAction> = {
  AUTO_APPROVE: "APPROVE",
  AUTO_REJECT: "REJECT",
  AUTO_BYPASS: "BYPASS",
  AUTO_ESCALATE: "ESCALATE",
};

// ─── Types ────────────────────────────────────────────────

interface AutoActionResult {
  ruleId: string;
  ruleName: string;
  actionType: AutoActionType;
  approvalAction: ApprovalAction;
}

interface ChainedActionResult {
  previousStepId: string;
  nextStepId: string | null;
  isComplete: boolean;
  actionsExecuted: AutoActionResult[];
  chainDepth: number;
}

interface CreateRuleInput {
  name: string;
  description?: string;
  conditionExpression: VisibilityCondition;
  actionType: AutoActionType;
  priority?: number;
  isActive?: boolean;
  createdBy?: string;
}

interface UpdateRuleInput {
  name?: string;
  description?: string;
  conditionExpression?: VisibilityCondition;
  actionType?: AutoActionType;
  priority?: number;
  isActive?: boolean;
}

// ─── Rule Evaluation ──────────────────────────────────────

/**
 * Evaluate all active rules for a step against participant data.
 * Returns the first matching rule (by priority), or null if no match.
 */
export async function evaluateAutoActions(
  stepId: string,
  participantData: Record<string, unknown>,
): Promise<AutoActionResult | null> {
  const rules = await prisma.autoActionRule.findMany({
    where: { stepId, isActive: true },
    orderBy: { priority: "asc" },
  });

  for (const rule of rules) {
    const condition = rule.conditionExpression as unknown as VisibilityCondition;
    if (evaluateCondition(condition, participantData)) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        actionType: rule.actionType,
        approvalAction: ACTION_TYPE_MAP[rule.actionType],
      };
    }
  }

  return null;
}

/**
 * Execute auto-actions for a participant at a given step, with chaining.
 *
 * After a participant arrives at a step, this checks for auto-action rules.
 * If a rule matches, executes the action and checks the next step's rules too.
 * Chains up to MAX_CHAIN_DEPTH to prevent infinite loops.
 *
 * Uses processWorkflowAction lazily to avoid circular imports.
 */
export async function executeAutoActionsChain(
  participantId: string,
  currentStepId: string,
  participantData: Record<string, unknown>,
  conditionalRoutingEnabled: boolean,
  depth = 0,
): Promise<ChainedActionResult | null> {
  if (depth >= MAX_CHAIN_DEPTH) {
    logger.warn({ participantId, currentStepId, depth }, "Auto-action chain depth limit reached");
    return null;
  }

  const match = await evaluateAutoActions(currentStepId, participantData);
  if (!match) return null;

  // Lazy import to avoid circular dependency with navigation.server
  const { processWorkflowAction } = await import("~/services/workflow-engine/navigation.server");

  const result = await processWorkflowAction(
    participantId,
    SYSTEM_USER_ID,
    match.approvalAction,
    `Auto-action: ${match.ruleName}`,
    undefined,
    conditionalRoutingEnabled,
  );

  // Audit log for auto-action
  await prisma.auditLog.create({
    data: {
      userId: SYSTEM_USER_ID,
      action:
        match.approvalAction === "APPROVE" || match.approvalAction === "BYPASS"
          ? "APPROVE"
          : match.approvalAction === "REJECT"
            ? "REJECT"
            : "UPDATE",
      entityType: "Participant",
      entityId: participantId,
      description: `Auto-action "${match.ruleName}" executed: ${match.actionType}`,
      metadata: {
        ruleId: match.ruleId,
        ruleName: match.ruleName,
        actionType: match.actionType,
        conditionExpression: "matched",
        autoAction: true,
      },
    },
  });

  const actionsExecuted: AutoActionResult[] = [match];

  // If the action moved to a new step (not complete), check that step's rules too
  if (!result.isComplete && result.nextStepId) {
    const chainResult = await executeAutoActionsChain(
      participantId,
      result.nextStepId,
      participantData,
      conditionalRoutingEnabled,
      depth + 1,
    );

    if (chainResult) {
      return {
        previousStepId: result.previousStepId,
        nextStepId: chainResult.nextStepId,
        isComplete: chainResult.isComplete,
        actionsExecuted: [...actionsExecuted, ...chainResult.actionsExecuted],
        chainDepth: chainResult.chainDepth,
      };
    }
  }

  return {
    previousStepId: result.previousStepId,
    nextStepId: result.nextStepId,
    isComplete: result.isComplete,
    actionsExecuted,
    chainDepth: depth + 1,
  };
}

// ─── CRUD ─────────────────────────────────────────────────

export async function createRule(stepId: string, input: CreateRuleInput) {
  const rule = await prisma.autoActionRule.create({
    data: {
      stepId,
      name: input.name,
      description: input.description,
      conditionExpression: input.conditionExpression as object,
      actionType: input.actionType,
      priority: input.priority ?? 0,
      isActive: input.isActive ?? true,
      createdBy: input.createdBy,
    },
  });

  logger.info({ ruleId: rule.id, stepId, actionType: rule.actionType }, "Auto-action rule created");
  return rule;
}

export async function updateRule(ruleId: string, input: UpdateRuleInput) {
  const rule = await prisma.autoActionRule.update({
    where: { id: ruleId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.conditionExpression !== undefined && {
        conditionExpression: input.conditionExpression as object,
      }),
      ...(input.actionType !== undefined && { actionType: input.actionType }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });

  logger.info({ ruleId: rule.id, actionType: rule.actionType }, "Auto-action rule updated");
  return rule;
}

export async function deleteRule(ruleId: string) {
  await prisma.autoActionRule.delete({ where: { id: ruleId } });
  logger.info({ ruleId }, "Auto-action rule deleted");
}

export async function listRules(stepId: string) {
  return prisma.autoActionRule.findMany({
    where: { stepId },
    orderBy: { priority: "asc" },
  });
}

export async function reorderRules(stepId: string, ruleIds: string[]) {
  await prisma.$transaction(
    ruleIds.map((id, index) =>
      prisma.autoActionRule.update({
        where: { id },
        data: { priority: index },
      }),
    ),
  );

  logger.info({ stepId, count: ruleIds.length }, "Auto-action rules reordered");
}

// ─── Exports ──────────────────────────────────────────────

export { SYSTEM_USER_ID, MAX_CHAIN_DEPTH, ACTION_TYPE_MAP };
export type { AutoActionResult, ChainedActionResult, CreateRuleInput, UpdateRuleInput };
