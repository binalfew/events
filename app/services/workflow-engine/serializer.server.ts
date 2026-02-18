import { createHash } from "node:crypto";
import type { VisibilityCondition } from "~/types/form-designer";

// ─── Conditional Route Types ──────────────────────────────

export interface ConditionalRoute {
  id: string;
  condition: VisibilityCondition;
  targetStepId: string;
  priority: number;
  label?: string;
}

export interface StepSnapshot {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  stepType: string;
  isEntryPoint: boolean;
  isFinalStep: boolean;
  nextStepId: string | null;
  rejectionTargetId: string | null;
  bypassTargetId: string | null;
  escalationTargetId: string | null;
  slaDurationMinutes: number | null;
  slaAction: string | null;
  conditions: unknown;
  conditionalRoutes?: ConditionalRoute[];
  rejectionConditionalRoutes?: ConditionalRoute[];
  slaWarningMinutes: number | null;
  assignedRoleId: string | null;
  forkConfig?: { branches: { branchStepId: string; label?: string }[]; joinStepId: string };
  joinConfig?: { strategy: string; timeoutMinutes?: number; timeoutAction?: string };
}

export interface WorkflowSnapshot {
  id: string;
  name: string;
  steps: StepSnapshot[];
}

export class WorkflowError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "WorkflowError";
  }
}

interface StepInput {
  id: string;
  name: string;
  description: string | null;
  order: number;
  stepType: string;
  isEntryPoint: boolean;
  isTerminal: boolean;
  nextStepId: string | null;
  rejectionTargetId: string | null;
  bypassTargetId: string | null;
  escalationTargetId: string | null;
  slaDurationMinutes: number | null;
  slaAction: string | null;
  config: unknown;
}

interface WorkflowInput {
  id: string;
  name: string;
  steps: StepInput[];
}

export function serializeWorkflow(workflow: WorkflowInput): WorkflowSnapshot {
  const steps = [...workflow.steps]
    .sort((a, b) => a.order - b.order)
    .map((step): StepSnapshot => {
      const config = (step.config ?? {}) as Record<string, unknown>;
      return {
        id: step.id,
        name: step.name,
        description: step.description,
        sortOrder: step.order,
        stepType: step.stepType,
        isEntryPoint: step.isEntryPoint,
        isFinalStep: step.isTerminal,
        nextStepId: step.nextStepId,
        rejectionTargetId: step.rejectionTargetId,
        bypassTargetId: step.bypassTargetId,
        escalationTargetId: step.escalationTargetId,
        slaDurationMinutes: step.slaDurationMinutes,
        slaAction: step.slaAction,
        conditions: step.config,
        conditionalRoutes: Array.isArray(config.conditionalRoutes)
          ? (config.conditionalRoutes as ConditionalRoute[])
          : undefined,
        rejectionConditionalRoutes: Array.isArray(config.rejectionConditionalRoutes)
          ? (config.rejectionConditionalRoutes as ConditionalRoute[])
          : undefined,
        slaWarningMinutes: null,
        assignedRoleId: null,
        ...(step.stepType === "FORK" && config.branches
          ? {
              forkConfig: {
                branches: config.branches as { branchStepId: string; label?: string }[],
                joinStepId: config.joinStepId as string,
              },
            }
          : {}),
        ...(step.stepType === "JOIN" && config.strategy
          ? {
              joinConfig: {
                strategy: config.strategy as string,
                ...(config.timeoutMinutes != null
                  ? { timeoutMinutes: config.timeoutMinutes as number }
                  : {}),
                ...(config.timeoutAction != null
                  ? { timeoutAction: config.timeoutAction as string }
                  : {}),
              },
            }
          : {}),
      };
    });

  return {
    id: workflow.id,
    name: workflow.name,
    steps,
  };
}

export function deserializeWorkflow(snapshot: unknown): WorkflowSnapshot {
  const data = typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot;

  if (!data || typeof data !== "object" || !data.id || !data.name || !Array.isArray(data.steps)) {
    throw new WorkflowError("Invalid workflow snapshot structure", 400);
  }

  return data as WorkflowSnapshot;
}

function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map(stableStringify).join(",") + "]";
  }
  const sorted = Object.keys(obj as Record<string, unknown>).sort();
  const parts = sorted.map(
    (key) => JSON.stringify(key) + ":" + stableStringify((obj as Record<string, unknown>)[key]),
  );
  return "{" + parts.join(",") + "}";
}

export function computeWorkflowHash(workflow: WorkflowInput): string {
  const snapshot = serializeWorkflow(workflow);
  const canonical = stableStringify(snapshot);
  return createHash("sha256").update(canonical).digest("hex");
}
