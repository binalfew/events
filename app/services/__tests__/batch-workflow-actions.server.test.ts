import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockOperationCreate = vi.fn();
const mockOperationUpdate = vi.fn();
const mockOperationFindFirst = vi.fn();
const mockOperationFindUnique = vi.fn();

const mockItemCreate = vi.fn();
const mockItemFindFirst = vi.fn();
const mockItemFindMany = vi.fn();
const mockItemUpdate = vi.fn();

const mockParticipantFindMany = vi.fn();
const mockParticipantFindFirst = vi.fn();
const mockParticipantUpdate = vi.fn();

const mockApprovalCreate = vi.fn();
const mockApprovalFindFirst = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    bulkOperation: {
      create: (...args: unknown[]) => mockOperationCreate(...args),
      update: (...args: unknown[]) => mockOperationUpdate(...args),
      findFirst: (...args: unknown[]) => mockOperationFindFirst(...args),
      findUnique: (...args: unknown[]) => mockOperationFindUnique(...args),
    },
    bulkOperationItem: {
      create: (...args: unknown[]) => mockItemCreate(...args),
      findFirst: (...args: unknown[]) => mockItemFindFirst(...args),
      findMany: (...args: unknown[]) => mockItemFindMany(...args),
      update: (...args: unknown[]) => mockItemUpdate(...args),
    },
    participant: {
      findMany: (...args: unknown[]) => mockParticipantFindMany(...args),
      findFirst: (...args: unknown[]) => mockParticipantFindFirst(...args),
      update: (...args: unknown[]) => mockParticipantUpdate(...args),
    },
    approval: {
      create: (...args: unknown[]) => mockApprovalCreate(...args),
      findFirst: (...args: unknown[]) => mockApprovalFindFirst(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
    },
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const mockIsFeatureEnabled = vi.fn().mockResolvedValue(true);
vi.mock("~/lib/feature-flags.server", () => ({
  isFeatureEnabled: (...args: unknown[]) => mockIsFeatureEnabled(...args),
  FEATURE_FLAG_KEYS: { BULK_OPERATIONS: "FF_BULK_OPERATIONS" },
}));

vi.mock("~/lib/event-bus.server", () => ({
  eventBus: { publish: vi.fn() },
}));

vi.mock("~/lib/condition-evaluator", () => ({
  evaluateCondition: vi.fn().mockReturnValue(false),
}));

// Mock captureSnapshot
const mockCaptureSnapshot = vi.fn().mockResolvedValue(undefined);
vi.mock("~/services/bulk-import/undo.server", () => ({
  captureSnapshot: (...args: unknown[]) => mockCaptureSnapshot(...args),
  restoreFromSnapshot: vi.fn().mockResolvedValue({ restoredCount: 1, failedCount: 0 }),
}));

// Mock resolveAudience
vi.mock("~/services/audience-filter.server", () => ({
  resolveAudience: vi
    .fn()
    .mockResolvedValue([{ id: "p1", email: "a@b.com", firstName: "A", lastName: "B" }]),
}));

// ─── Imports (after mocks) ───────────────────────────────

import { executeBatchAction, dryRunBatchAction } from "~/services/batch-workflow-actions.server";
import {
  validateBatchEligibility,
  selectByIds,
  selectByFilter,
} from "~/services/batch-selection.server";

// ─── Helpers ─────────────────────────────────────────────

function makeWorkflowSnapshot(opts?: {
  nextStepId?: string | null;
  rejectionTargetId?: string | null;
  bypassTargetId?: string | null;
  isFinalStep?: boolean;
}) {
  return {
    id: "wv1",
    name: "Test Workflow",
    steps: [
      {
        id: "step1",
        name: "Review",
        description: null,
        sortOrder: 0,
        stepType: "REVIEW",
        isEntryPoint: true,
        isFinalStep: opts?.isFinalStep ?? false,
        nextStepId: opts?.nextStepId !== undefined ? opts.nextStepId : "step2",
        rejectionTargetId:
          opts?.rejectionTargetId !== undefined ? opts.rejectionTargetId : "step-reject",
        bypassTargetId: opts?.bypassTargetId !== undefined ? opts.bypassTargetId : "step-bypass",
        escalationTargetId: null,
        slaDurationMinutes: null,
        slaAction: null,
        conditions: null,
        slaWarningMinutes: null,
        assignedRoleId: null,
      },
      {
        id: "step2",
        name: "Final",
        description: null,
        sortOrder: 1,
        stepType: "REVIEW",
        isEntryPoint: false,
        isFinalStep: true,
        nextStepId: null,
        rejectionTargetId: null,
        bypassTargetId: null,
        escalationTargetId: null,
        slaDurationMinutes: null,
        slaAction: null,
        conditions: null,
        slaWarningMinutes: null,
        assignedRoleId: null,
      },
    ],
  };
}

const CTX = { userId: "user1", tenantId: "tenant1" };

// ─── Tests ───────────────────────────────────────────────

describe("batch-workflow-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFeatureEnabled.mockResolvedValue(true);
  });

  // ─── 1. executeBatchAction succeeds for all participants ────

  it("executeBatchAction succeeds for all participants", async () => {
    const snapshot = makeWorkflowSnapshot();

    // createBulkOperation
    mockOperationCreate.mockResolvedValue({ id: "op1" });
    mockAuditLogCreate.mockResolvedValue({});

    // PROCESSING update
    mockOperationUpdate.mockResolvedValue({});

    // Batch: findMany participants
    mockParticipantFindMany.mockResolvedValueOnce([
      {
        id: "p1",
        firstName: "Alice",
        lastName: "Smith",
        status: "PENDING",
        currentStepId: "step1",
      },
      { id: "p2", firstName: "Bob", lastName: "Jones", status: "PENDING", currentStepId: "step1" },
    ]);

    // BulkOperationItem creates
    mockItemCreate.mockResolvedValue({ id: "item1" });

    // processWorkflowAction: participant.findFirst
    mockParticipantFindFirst
      .mockResolvedValueOnce({
        id: "p1",
        tenantId: "tenant1",
        firstName: "Alice",
        lastName: "Smith",
        email: null,
        status: "PENDING",
        extras: {},
        currentStepId: "step1",
        workflowVersion: { id: "wv1", snapshot },
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: "p2",
        tenantId: "tenant1",
        firstName: "Bob",
        lastName: "Jones",
        email: null,
        status: "PENDING",
        extras: {},
        currentStepId: "step1",
        workflowVersion: { id: "wv1", snapshot },
        updatedAt: new Date(),
      });

    // participant.update (workflow engine)
    mockParticipantUpdate.mockResolvedValue({});
    mockApprovalCreate.mockResolvedValue({});

    const result = await executeBatchAction(
      { eventId: "e1", action: "APPROVE", participantIds: ["p1", "p2"], dryRun: false },
      CTX,
    );

    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);
    expect(result.status).toBe("COMPLETED");
  });

  // ─── 2. executeBatchAction handles partial failures ────

  it("executeBatchAction handles partial failures gracefully", async () => {
    const snapshot = makeWorkflowSnapshot();

    mockOperationCreate.mockResolvedValue({ id: "op2" });
    mockAuditLogCreate.mockResolvedValue({});
    mockOperationUpdate.mockResolvedValue({});

    // Batch: only p1 found
    mockParticipantFindMany.mockResolvedValueOnce([
      {
        id: "p1",
        firstName: "Alice",
        lastName: "Smith",
        status: "PENDING",
        currentStepId: "step1",
      },
    ]);

    mockItemCreate.mockResolvedValue({ id: "item1" });
    mockItemFindFirst.mockResolvedValue(null);

    // p1 succeeds
    mockParticipantFindFirst.mockResolvedValueOnce({
      id: "p1",
      tenantId: "tenant1",
      firstName: "Alice",
      lastName: "Smith",
      email: null,
      status: "PENDING",
      extras: {},
      currentStepId: "step1",
      workflowVersion: { id: "wv1", snapshot },
      updatedAt: new Date(),
    });
    mockParticipantUpdate.mockResolvedValue({});
    mockApprovalCreate.mockResolvedValue({});

    const result = await executeBatchAction(
      { eventId: "e1", action: "APPROVE", participantIds: ["p1", "p-missing"], dryRun: false },
      CTX,
    );

    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    // Not all failed, so COMPLETED not FAILED
    expect(result.status).toBe("COMPLETED");
  });

  // ─── 3. executeBatchAction captures undo snapshot ────

  it("executeBatchAction captures undo snapshot", async () => {
    const snapshot = makeWorkflowSnapshot();

    mockOperationCreate.mockResolvedValue({ id: "op3" });
    mockAuditLogCreate.mockResolvedValue({});
    mockOperationUpdate.mockResolvedValue({});

    mockParticipantFindMany.mockResolvedValueOnce([
      {
        id: "p1",
        firstName: "Alice",
        lastName: "Smith",
        status: "PENDING",
        currentStepId: "step1",
      },
    ]);

    mockItemCreate.mockResolvedValue({ id: "item1" });

    mockParticipantFindFirst.mockResolvedValueOnce({
      id: "p1",
      tenantId: "tenant1",
      firstName: "Alice",
      lastName: "Smith",
      email: null,
      status: "PENDING",
      extras: {},
      currentStepId: "step1",
      workflowVersion: { id: "wv1", snapshot },
      updatedAt: new Date(),
    });
    mockParticipantUpdate.mockResolvedValue({});
    mockApprovalCreate.mockResolvedValue({});

    await executeBatchAction(
      { eventId: "e1", action: "APPROVE", participantIds: ["p1"], dryRun: false },
      CTX,
    );

    expect(mockCaptureSnapshot).toHaveBeenCalledWith("op3", ["p1"]);
  });

  // ─── 4. dryRunBatchAction returns eligibility without persisting ────

  it("dryRunBatchAction returns eligibility without persisting", async () => {
    const snapshot = makeWorkflowSnapshot();

    // For validateBatchEligibility
    mockParticipantFindMany.mockResolvedValueOnce([
      {
        id: "p1",
        firstName: "Alice",
        lastName: "Smith",
        currentStepId: "step1",
        workflowVersion: { snapshot },
      },
    ]);

    const result = await dryRunBatchAction(
      { eventId: "e1", action: "APPROVE", participantIds: ["p1"], dryRun: true },
      CTX,
    );

    expect(result.eligibleCount).toBe(1);
    expect(result.ineligibleCount).toBe(0);
    // Should NOT have created any BulkOperation
    expect(mockOperationCreate).not.toHaveBeenCalled();
  });

  // ─── 5. validateBatchEligibility rejects APPROVE without nextStepId ────

  it("validateBatchEligibility rejects APPROVE for step without nextStepId", async () => {
    const snapshot = makeWorkflowSnapshot({ nextStepId: null, isFinalStep: false });

    mockParticipantFindMany.mockResolvedValueOnce([
      {
        id: "p1",
        firstName: "Alice",
        lastName: "Smith",
        currentStepId: "step1",
        workflowVersion: { snapshot },
      },
    ]);

    const result = await validateBatchEligibility(["p1"], "APPROVE", "tenant1");

    expect(result.eligible).toHaveLength(0);
    expect(result.ineligible).toHaveLength(1);
    expect(result.ineligible[0].reason).toContain("No next step");
  });

  // ─── 6. validateBatchEligibility rejects REJECT without rejectionTargetId ────

  it("validateBatchEligibility rejects REJECT for step without rejectionTargetId", async () => {
    const snapshot = makeWorkflowSnapshot({ rejectionTargetId: null });

    mockParticipantFindMany.mockResolvedValueOnce([
      {
        id: "p1",
        firstName: "Alice",
        lastName: "Smith",
        currentStepId: "step1",
        workflowVersion: { snapshot },
      },
    ]);

    const result = await validateBatchEligibility(["p1"], "REJECT", "tenant1");

    expect(result.eligible).toHaveLength(0);
    expect(result.ineligible).toHaveLength(1);
    expect(result.ineligible[0].reason).toContain("No rejection target");
  });

  // ─── 7. selectByIds excludes soft-deleted and wrong-tenant ────

  it("selectByIds excludes soft-deleted and wrong-tenant participants", async () => {
    mockParticipantFindMany.mockResolvedValueOnce([
      { id: "p1" }, // only p1 matches
    ]);

    const result = await selectByIds(["p1", "p-deleted", "p-other-tenant"], "e1", "tenant1");

    expect(result).toEqual(["p1"]);
    // Verify the where clause filters correctly
    const call = mockParticipantFindMany.mock.calls[0][0];
    expect(call.where.deletedAt).toBeNull();
    expect(call.where.tenantId).toBe("tenant1");
    expect(call.where.eventId).toBe("e1");
  });

  // ─── 8. selectByFilter delegates to resolveAudience ────

  it("selectByFilter delegates to resolveAudience", async () => {
    const { resolveAudience } = await import("~/services/audience-filter.server");

    const result = await selectByFilter("e1", "tenant1", { statuses: ["PENDING"] });

    expect(resolveAudience).toHaveBeenCalledWith("e1", "tenant1", { statuses: ["PENDING"] });
    expect(result).toEqual(["p1"]);
  });

  // ─── 9. executeBatchAction processes in batches of 20 ────

  it("executeBatchAction processes in batches of 20", async () => {
    const snapshot = makeWorkflowSnapshot();

    // Generate 25 participant IDs
    const ids = Array.from({ length: 25 }, (_, i) => `p${i}`);

    mockOperationCreate.mockResolvedValue({ id: "op-batch" });
    mockAuditLogCreate.mockResolvedValue({});
    mockOperationUpdate.mockResolvedValue({});
    mockItemCreate.mockResolvedValue({ id: "item" });

    // First batch of 20
    const batch1 = ids.slice(0, 20).map((id) => ({
      id,
      firstName: "F",
      lastName: "L",
      status: "PENDING",
      currentStepId: "step1",
    }));
    // Second batch of 5
    const batch2 = ids.slice(20).map((id) => ({
      id,
      firstName: "F",
      lastName: "L",
      status: "PENDING",
      currentStepId: "step1",
    }));

    mockParticipantFindMany.mockResolvedValueOnce(batch1).mockResolvedValueOnce(batch2);

    // processWorkflowAction calls for each participant
    for (let i = 0; i < 25; i++) {
      mockParticipantFindFirst.mockResolvedValueOnce({
        id: ids[i],
        tenantId: "tenant1",
        firstName: "F",
        lastName: "L",
        email: null,
        status: "PENDING",
        extras: {},
        currentStepId: "step1",
        workflowVersion: { id: "wv1", snapshot },
        updatedAt: new Date(),
      });
    }
    mockParticipantUpdate.mockResolvedValue({});
    mockApprovalCreate.mockResolvedValue({});

    const result = await executeBatchAction(
      { eventId: "e1", action: "APPROVE", participantIds: ids, dryRun: false },
      CTX,
    );

    expect(result.successCount).toBe(25);
    // participant.findMany called twice (batch of 20, then batch of 5)
    expect(mockParticipantFindMany).toHaveBeenCalledTimes(2);
  });

  // ─── 10. executeBatchAction gated by FF_BULK_OPERATIONS ────

  it("executeBatchAction gated by FF_BULK_OPERATIONS feature flag", async () => {
    mockIsFeatureEnabled.mockResolvedValue(false);

    await expect(
      executeBatchAction(
        { eventId: "e1", action: "APPROVE", participantIds: ["p1"], dryRun: false },
        CTX,
      ),
    ).rejects.toThrow("Bulk operations feature is not enabled");
  });
});
