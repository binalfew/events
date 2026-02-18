import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Prisma Mocks ────────────────────────────────────────

const mockParticipantFindFirst = vi.fn();
const mockParticipantUpdate = vi.fn();
const mockApprovalCreate = vi.fn();
const mockAuditCreate = vi.fn();
const mockParallelBranchCreateMany = vi.fn();
const mockParallelBranchFindFirst = vi.fn();
const mockParallelBranchFindMany = vi.fn();
const mockParallelBranchUpdate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    participant: {
      findFirst: mockParticipantFindFirst,
      update: mockParticipantUpdate,
    },
    approval: {
      create: mockApprovalCreate,
    },
    auditLog: {
      create: mockAuditCreate,
    },
    parallelBranch: {
      createMany: mockParallelBranchCreateMany,
      findFirst: mockParallelBranchFindFirst,
      findMany: mockParallelBranchFindMany,
      update: mockParallelBranchUpdate,
    },
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("~/lib/event-bus.server", () => ({
  eventBus: {
    publish: vi.fn(),
  },
}));

vi.mock("~/lib/webhook-emitter.server", () => ({
  emitWebhookEvent: vi.fn(),
}));

vi.mock("~/lib/feature-flags.server", () => ({
  isFeatureEnabled: vi.fn().mockResolvedValue(true),
  FEATURE_FLAG_KEYS: {
    PARALLEL_WORKFLOWS: "FF_PARALLEL_WORKFLOWS",
  },
}));

// ─── Helpers ─────────────────────────────────────────────

function makeForkStep(overrides = {}) {
  return {
    id: "fork-step-1",
    name: "Parallel Review",
    description: null,
    sortOrder: 2,
    stepType: "FORK",
    isEntryPoint: false,
    isFinalStep: false,
    nextStepId: null,
    rejectionTargetId: null,
    bypassTargetId: null,
    escalationTargetId: null,
    slaDurationMinutes: null,
    slaAction: null,
    conditions: {},
    slaWarningMinutes: null,
    assignedRoleId: null,
    forkConfig: {
      branches: [
        { branchStepId: "branch-step-a", label: "Protocol Review" },
        { branchStepId: "branch-step-b", label: "Security Review" },
      ],
      joinStepId: "join-step-1",
    },
    ...overrides,
  };
}

function makeJoinStep(overrides = {}) {
  return {
    id: "join-step-1",
    name: "Parallel Join",
    description: null,
    sortOrder: 5,
    stepType: "JOIN",
    isEntryPoint: false,
    isFinalStep: false,
    nextStepId: "final-step",
    rejectionTargetId: "rejected-step",
    bypassTargetId: null,
    escalationTargetId: null,
    slaDurationMinutes: null,
    slaAction: null,
    conditions: {},
    slaWarningMinutes: null,
    assignedRoleId: null,
    joinConfig: {
      strategy: "ALL",
      timeoutMinutes: 60,
      timeoutAction: "REJECT",
    },
    ...overrides,
  };
}

function makeParticipantWithFork() {
  return {
    id: "p-1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    tenantId: "tenant-1",
    currentStepId: "fork-step-1",
    status: "IN_PROGRESS",
    deletedAt: null,
    workflowVersion: {
      id: "v-1",
      snapshot: {
        id: "wf-1",
        name: "Test Workflow",
        steps: [
          {
            id: "step-1",
            name: "Initial Review",
            description: null,
            sortOrder: 1,
            stepType: "REVIEW",
            isEntryPoint: true,
            isFinalStep: false,
            nextStepId: "fork-step-1",
            rejectionTargetId: null,
            bypassTargetId: null,
            escalationTargetId: null,
            slaDurationMinutes: null,
            slaAction: null,
            conditions: {},
            slaWarningMinutes: null,
            assignedRoleId: null,
          },
          makeForkStep(),
          {
            id: "branch-step-a",
            name: "Protocol Review",
            description: null,
            sortOrder: 3,
            stepType: "REVIEW",
            isEntryPoint: false,
            isFinalStep: false,
            nextStepId: null,
            rejectionTargetId: null,
            bypassTargetId: null,
            escalationTargetId: null,
            slaDurationMinutes: null,
            slaAction: null,
            conditions: {},
            slaWarningMinutes: null,
            assignedRoleId: null,
          },
          {
            id: "branch-step-b",
            name: "Security Review",
            description: null,
            sortOrder: 4,
            stepType: "REVIEW",
            isEntryPoint: false,
            isFinalStep: false,
            nextStepId: null,
            rejectionTargetId: null,
            bypassTargetId: null,
            escalationTargetId: null,
            slaDurationMinutes: null,
            slaAction: null,
            conditions: {},
            slaWarningMinutes: null,
            assignedRoleId: null,
          },
          makeJoinStep(),
          {
            id: "final-step",
            name: "Final Step",
            description: null,
            sortOrder: 6,
            stepType: "APPROVAL",
            isEntryPoint: false,
            isFinalStep: true,
            nextStepId: null,
            rejectionTargetId: null,
            bypassTargetId: null,
            escalationTargetId: null,
            slaDurationMinutes: null,
            slaAction: null,
            conditions: {},
            slaWarningMinutes: null,
            assignedRoleId: null,
          },
        ],
      },
    },
  };
}

// ─── Tests ───────────────────────────────────────────────

describe("parallel-workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParticipantUpdate.mockResolvedValue({});
    mockApprovalCreate.mockResolvedValue({});
    mockAuditCreate.mockResolvedValue({});
    mockParallelBranchCreateMany.mockResolvedValue({ count: 2 });
    mockParallelBranchUpdate.mockResolvedValue({});
  });

  describe("parseForkConfig", () => {
    it("validates branches and joinStepId", async () => {
      const { parseForkConfig } = await import("../fork-executor.server");
      const step = makeForkStep();

      const config = parseForkConfig(step);

      expect(config.branches).toHaveLength(2);
      expect(config.branches[0].branchStepId).toBe("branch-step-a");
      expect(config.joinStepId).toBe("join-step-1");
    });

    it("throws when no branches configured", async () => {
      const { parseForkConfig } = await import("../fork-executor.server");
      const { WorkflowError } = await import("../serializer.server");
      const step = makeForkStep({
        forkConfig: { branches: [], joinStepId: "join-step-1" },
      });

      expect(() => parseForkConfig(step)).toThrow(WorkflowError);
    });
  });

  describe("executeFork", () => {
    it("creates correct number of ParallelBranch records", async () => {
      const { executeFork } = await import("../fork-executor.server");
      const step = makeForkStep();
      mockParticipantFindFirst.mockResolvedValue({
        firstName: "John",
        lastName: "Doe",
      });

      await executeFork("p-1", step, "tenant-1", "user-1");

      expect(mockParallelBranchCreateMany).toHaveBeenCalledWith({
        data: [
          {
            participantId: "p-1",
            forkStepId: "fork-step-1",
            branchStepId: "branch-step-a",
            status: "PENDING",
          },
          {
            participantId: "p-1",
            forkStepId: "fork-step-1",
            branchStepId: "branch-step-b",
            status: "PENDING",
          },
        ],
      });
    });

    it("sets participant status to IN_PROGRESS at FORK step", async () => {
      const { executeFork } = await import("../fork-executor.server");
      const step = makeForkStep();
      mockParticipantFindFirst.mockResolvedValue({
        firstName: "John",
        lastName: "Doe",
      });

      await executeFork("p-1", step, "tenant-1", "user-1");

      expect(mockParticipantUpdate).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: {
          status: "IN_PROGRESS",
          currentStepId: "fork-step-1",
        },
      });
    });
  });

  describe("evaluateStrategy", () => {
    it("ALL: satisfied when all branches APPROVED", async () => {
      const { evaluateStrategy } = await import("../join-evaluator.server");

      const result = evaluateStrategy("ALL", {
        totalBranches: 3,
        completedBranches: 3,
        approvedBranches: 3,
        rejectedBranches: 0,
        pendingBranches: 0,
      });

      expect(result.satisfied).toBe(true);
      expect(result.failed).toBe(false);
      expect(result.action).toBe("APPROVE");
    });

    it("ALL: failed (fail-fast) when any REJECTED", async () => {
      const { evaluateStrategy } = await import("../join-evaluator.server");

      const result = evaluateStrategy("ALL", {
        totalBranches: 3,
        completedBranches: 1,
        approvedBranches: 0,
        rejectedBranches: 1,
        pendingBranches: 2,
      });

      expect(result.satisfied).toBe(false);
      expect(result.failed).toBe(true);
      expect(result.action).toBe("REJECT");
    });

    it("ALL: waiting when some PENDING", async () => {
      const { evaluateStrategy } = await import("../join-evaluator.server");

      const result = evaluateStrategy("ALL", {
        totalBranches: 3,
        completedBranches: 2,
        approvedBranches: 2,
        rejectedBranches: 0,
        pendingBranches: 1,
      });

      expect(result.satisfied).toBe(false);
      expect(result.failed).toBe(false);
      expect(result.action).toBeNull();
    });

    it("ANY: satisfied on first APPROVE", async () => {
      const { evaluateStrategy } = await import("../join-evaluator.server");

      const result = evaluateStrategy("ANY", {
        totalBranches: 3,
        completedBranches: 1,
        approvedBranches: 1,
        rejectedBranches: 0,
        pendingBranches: 2,
      });

      expect(result.satisfied).toBe(true);
      expect(result.failed).toBe(false);
      expect(result.action).toBe("APPROVE");
    });

    it("ANY: failed when all REJECTED", async () => {
      const { evaluateStrategy } = await import("../join-evaluator.server");

      const result = evaluateStrategy("ANY", {
        totalBranches: 3,
        completedBranches: 3,
        approvedBranches: 0,
        rejectedBranches: 3,
        pendingBranches: 0,
      });

      expect(result.satisfied).toBe(false);
      expect(result.failed).toBe(true);
      expect(result.action).toBe("REJECT");
    });

    it("MAJORITY: satisfied when >50% APPROVED", async () => {
      const { evaluateStrategy } = await import("../join-evaluator.server");

      const result = evaluateStrategy("MAJORITY", {
        totalBranches: 4,
        completedBranches: 3,
        approvedBranches: 3,
        rejectedBranches: 0,
        pendingBranches: 1,
      });

      expect(result.satisfied).toBe(true);
      expect(result.failed).toBe(false);
      expect(result.action).toBe("APPROVE");
    });

    it("MAJORITY: failed when majority is impossible", async () => {
      const { evaluateStrategy } = await import("../join-evaluator.server");

      // 4 total, 3 rejected, 0 approved, 1 pending — even if pending approves, only 1/4
      const result = evaluateStrategy("MAJORITY", {
        totalBranches: 4,
        completedBranches: 3,
        approvedBranches: 0,
        rejectedBranches: 3,
        pendingBranches: 1,
      });

      expect(result.satisfied).toBe(false);
      expect(result.failed).toBe(true);
      expect(result.action).toBe("REJECT");
    });
  });

  describe("processBranchAction", () => {
    it("updates branch and creates Approval", async () => {
      const { processBranchAction } = await import("../branch-action.server");

      mockParallelBranchFindFirst.mockResolvedValue({
        id: "branch-1",
        participantId: "p-1",
        forkStepId: "fork-step-1",
        branchStepId: "branch-step-a",
        status: "PENDING",
      });
      mockParticipantFindFirst.mockResolvedValue(makeParticipantWithFork());
      // Return branches showing one still pending → join not yet satisfied
      mockParallelBranchFindMany.mockResolvedValue([
        { id: "branch-1", status: "APPROVED", participantId: "p-1", forkStepId: "fork-step-1" },
        { id: "branch-2", status: "PENDING", participantId: "p-1", forkStepId: "fork-step-1" },
      ]);

      const result = await processBranchAction(
        "p-1",
        "fork-step-1",
        "branch-step-a",
        "user-1",
        "APPROVE",
        "Looks good",
      );

      expect(result.branchStatus).toBe("APPROVED");
      expect(result.participantAdvanced).toBe(false);

      expect(mockParallelBranchUpdate).toHaveBeenCalledWith({
        where: { id: "branch-1" },
        data: expect.objectContaining({
          status: "APPROVED",
          action: "APPROVE",
          remarks: "Looks good",
        }),
      });

      expect(mockApprovalCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          participantId: "p-1",
          stepId: "branch-step-a",
          action: "APPROVE",
          metadata: { forkStepId: "fork-step-1", branchAction: true },
        }),
      });
    });

    it("triggers join and advances participant when ALL satisfied", async () => {
      // Mock processBranchAction's dynamic import of navigation.server
      const mockProcessWorkflowAction = vi.fn().mockResolvedValue({
        previousStepId: "join-step-1",
        nextStepId: "final-step",
        isComplete: false,
      });
      vi.doMock("../navigation.server", () => ({
        processWorkflowAction: mockProcessWorkflowAction,
      }));

      // Re-import to get fresh module with mock
      const { processBranchAction } = await import("../branch-action.server");

      mockParallelBranchFindFirst.mockResolvedValue({
        id: "branch-2",
        participantId: "p-1",
        forkStepId: "fork-step-1",
        branchStepId: "branch-step-b",
        status: "PENDING",
      });
      mockParticipantFindFirst.mockResolvedValue(makeParticipantWithFork());
      // All branches approved
      mockParallelBranchFindMany.mockResolvedValue([
        { id: "branch-1", status: "APPROVED", participantId: "p-1", forkStepId: "fork-step-1" },
        { id: "branch-2", status: "APPROVED", participantId: "p-1", forkStepId: "fork-step-1" },
      ]);

      const result = await processBranchAction(
        "p-1",
        "fork-step-1",
        "branch-step-b",
        "user-1",
        "APPROVE",
      );

      expect(result.joinEvaluation.satisfied).toBe(true);
      expect(result.participantAdvanced).toBe(true);

      // Should have moved participant to join step
      expect(mockParticipantUpdate).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: { currentStepId: "join-step-1" },
      });
    });
  });

  describe("processTimedOutBranches", () => {
    it("applies timeout action to overdue branches", async () => {
      const mockProcessBranchAction = vi.fn().mockResolvedValue({
        branchId: "branch-1",
        branchStatus: "REJECTED",
        joinEvaluation: {
          satisfied: false,
          failed: false,
          action: null,
          summary: {
            totalBranches: 2,
            completedBranches: 1,
            approvedBranches: 0,
            rejectedBranches: 1,
            pendingBranches: 1,
          },
        },
        participantAdvanced: false,
      });

      vi.doMock("../branch-action.server", () => ({
        processBranchAction: mockProcessBranchAction,
      }));

      const { processTimedOutBranches } = await import("../branch-timeout.server");

      // Create a branch that's 120 minutes old (exceeds 60-minute timeout)
      const oldDate = new Date(Date.now() - 120 * 60 * 1000);
      mockParallelBranchFindMany.mockResolvedValue([
        {
          id: "branch-1",
          participantId: "p-1",
          forkStepId: "fork-step-1",
          branchStepId: "branch-step-a",
          status: "PENDING",
          createdAt: oldDate,
          participant: makeParticipantWithFork(),
        },
      ]);

      const result = await processTimedOutBranches();

      expect(result.checked).toBe(1);
      expect(result.timedOut).toBe(1);
      expect(result.errors).toBe(0);
    });
  });
});
