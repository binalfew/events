// ─── Parallel Workflow Types ─────────────────────────────

export interface ForkConfig {
  branches: { branchStepId: string; label?: string }[];
  joinStepId: string;
}

export type JoinStrategy = "ALL" | "ANY" | "MAJORITY";

export interface JoinConfig {
  strategy: JoinStrategy;
  timeoutMinutes?: number;
  timeoutAction?: "APPROVE" | "REJECT" | "ESCALATE";
}

export interface JoinSummary {
  totalBranches: number;
  completedBranches: number;
  approvedBranches: number;
  rejectedBranches: number;
  pendingBranches: number;
}

export interface JoinEvaluationResult {
  satisfied: boolean;
  failed: boolean;
  action: "APPROVE" | "REJECT" | null;
  summary: JoinSummary;
}

export interface BranchActionResult {
  branchId: string;
  branchStatus: string;
  joinEvaluation: JoinEvaluationResult;
  participantAdvanced: boolean;
}
