import { describe, it, expect, vi, beforeEach } from "vitest";

const mockParticipantFindFirst = vi.fn();
const mockParticipantUpdate = vi.fn();
const mockApprovalCreate = vi.fn();
const mockApprovalFindFirst = vi.fn();
const mockAuditCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    participant: {
      findFirst: mockParticipantFindFirst,
      update: mockParticipantUpdate,
    },
    approval: {
      create: mockApprovalCreate,
      findFirst: mockApprovalFindFirst,
    },
    auditLog: {
      create: mockAuditCreate,
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

function makeSnapshot() {
  return {
    id: "wf-1",
    name: "Accreditation",
    steps: [
      {
        id: "step-1",
        name: "Review",
        description: null,
        sortOrder: 1,
        stepType: "REVIEW",
        isEntryPoint: true,
        isFinalStep: false,
        nextStepId: "step-2",
        rejectionTargetId: "step-0",
        bypassTargetId: "step-3",
        escalationTargetId: "step-esc",
        slaDurationMinutes: null,
        slaAction: null,
        conditions: {},
        slaWarningMinutes: null,
        assignedRoleId: null,
      },
      {
        id: "step-2",
        name: "Final Approval",
        description: null,
        sortOrder: 2,
        stepType: "APPROVAL",
        isEntryPoint: false,
        isFinalStep: true,
        nextStepId: null,
        rejectionTargetId: "step-1",
        bypassTargetId: null,
        escalationTargetId: null,
        slaDurationMinutes: null,
        slaAction: null,
        conditions: {},
        slaWarningMinutes: null,
        assignedRoleId: null,
      },
    ],
  };
}

function makeParticipant(currentStepId: string) {
  return {
    id: "p-1",
    currentStepId,
    status: "PENDING",
    updatedAt: new Date("2026-02-15T10:00:00.000Z"),
    deletedAt: null,
    workflowVersion: {
      id: "v-1",
      snapshot: makeSnapshot(),
    },
  };
}

describe("navigation.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParticipantUpdate.mockResolvedValue({});
    mockApprovalCreate.mockResolvedValue({});
    mockAuditCreate.mockResolvedValue({});
  });

  describe("processWorkflowAction", () => {
    it("APPROVE routes to nextStepId", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      mockParticipantFindFirst.mockResolvedValue(makeParticipant("step-1"));

      const result = await processWorkflowAction("p-1", "user-1", "APPROVE");

      expect(result).toEqual({
        previousStepId: "step-1",
        nextStepId: "step-2",
        isComplete: false,
      });
      expect(mockParticipantUpdate).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: { currentStepId: "step-2", status: "IN_PROGRESS" },
      });
    });

    it("REJECT routes to rejectionTargetId", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      mockParticipantFindFirst.mockResolvedValue(makeParticipant("step-1"));

      const result = await processWorkflowAction("p-1", "user-1", "REJECT");

      expect(result.nextStepId).toBe("step-0");
      expect(result.isComplete).toBe(false);
    });

    it("BYPASS routes to bypassTargetId", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      mockParticipantFindFirst.mockResolvedValue(makeParticipant("step-1"));

      const result = await processWorkflowAction("p-1", "user-1", "BYPASS");

      expect(result.nextStepId).toBe("step-3");
      expect(result.isComplete).toBe(false);
    });

    it("RETURN routes to previous step from approval history", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      mockParticipantFindFirst.mockResolvedValue(makeParticipant("step-1"));
      mockApprovalFindFirst.mockResolvedValue({ stepId: "step-0" });

      const result = await processWorkflowAction("p-1", "user-1", "RETURN");

      expect(result.nextStepId).toBe("step-0");
      expect(mockApprovalFindFirst).toHaveBeenCalledWith({
        where: { participantId: "p-1" },
        orderBy: { createdAt: "desc" },
      });
    });

    it("ESCALATE routes to escalationTargetId", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      mockParticipantFindFirst.mockResolvedValue(makeParticipant("step-1"));

      const result = await processWorkflowAction("p-1", "user-1", "ESCALATE");

      expect(result.nextStepId).toBe("step-esc");
      expect(result.isComplete).toBe(false);
    });

    it("PRINT routes same as APPROVE (nextStepId)", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      mockParticipantFindFirst.mockResolvedValue(makeParticipant("step-1"));

      const result = await processWorkflowAction("p-1", "user-1", "PRINT");

      expect(result.nextStepId).toBe("step-2");
    });

    it("final step completion sets status to APPROVED", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      mockParticipantFindFirst.mockResolvedValue(makeParticipant("step-2"));

      const result = await processWorkflowAction("p-1", "user-1", "APPROVE");

      expect(result.isComplete).toBe(true);
      expect(result.nextStepId).toBeNull();
      expect(mockParticipantUpdate).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: { currentStepId: "step-2", status: "APPROVED" },
      });
    });

    it("throws when no target configured for action", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      const { WorkflowError } = await import("../serializer.server");

      // Use a snapshot where step-1 (non-final) has no escalationTargetId
      const snapshot = makeSnapshot();
      snapshot.steps[0].escalationTargetId = null;
      mockParticipantFindFirst.mockResolvedValue({
        id: "p-1",
        currentStepId: "step-1",
        deletedAt: null,
        workflowVersion: { id: "v-1", snapshot },
      });

      await expect(processWorkflowAction("p-1", "user-1", "ESCALATE")).rejects.toThrow(
        WorkflowError,
      );
    });

    it("creates Approval and AuditLog records", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      mockParticipantFindFirst.mockResolvedValue(makeParticipant("step-1"));

      await processWorkflowAction("p-1", "user-1", "APPROVE", "Looks good");

      expect(mockApprovalCreate).toHaveBeenCalledWith({
        data: {
          participantId: "p-1",
          stepId: "step-1",
          userId: "user-1",
          action: "APPROVE",
          remarks: "Looks good",
        },
      });
      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          action: "APPROVE",
          entityType: "Participant",
          entityId: "p-1",
        }),
      });
    });

    it("throws when participant has no workflow version", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      const { WorkflowError } = await import("../serializer.server");

      mockParticipantFindFirst.mockResolvedValue({
        id: "p-1",
        currentStepId: "step-1",
        deletedAt: null,
        workflowVersion: null,
      });

      await expect(processWorkflowAction("p-1", "user-1", "APPROVE")).rejects.toThrow(
        WorkflowError,
      );
    });

    it("throws when participant not found", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      const { WorkflowError } = await import("../serializer.server");

      mockParticipantFindFirst.mockResolvedValue(null);

      await expect(processWorkflowAction("p-missing", "user-1", "APPROVE")).rejects.toThrow(
        WorkflowError,
      );
    });

    it("succeeds when expectedVersion matches", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      mockParticipantFindFirst.mockResolvedValue(makeParticipant("step-1"));

      const result = await processWorkflowAction(
        "p-1",
        "user-1",
        "APPROVE",
        undefined,
        "2026-02-15T10:00:00.000Z",
      );

      expect(result.nextStepId).toBe("step-2");
      expect(mockParticipantUpdate).toHaveBeenCalledWith({
        where: { id: "p-1", updatedAt: new Date("2026-02-15T10:00:00.000Z") },
        data: expect.any(Object),
      });
    });

    it("throws ConflictError when expectedVersion does not match", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      const { ConflictError } = await import("~/services/optimistic-lock.server");
      mockParticipantFindFirst.mockResolvedValue(makeParticipant("step-1"));

      await expect(
        processWorkflowAction("p-1", "user-1", "APPROVE", undefined, "2026-02-15T09:00:00.000Z"),
      ).rejects.toThrow(ConflictError);
    });

    it("converts Prisma P2025 to ConflictError during versioned update", async () => {
      const { processWorkflowAction } = await import("../navigation.server");
      const { ConflictError } = await import("~/services/optimistic-lock.server");

      mockParticipantFindFirst.mockResolvedValue(makeParticipant("step-1"));
      mockParticipantUpdate.mockRejectedValue({ code: "P2025" });

      await expect(
        processWorkflowAction("p-1", "user-1", "APPROVE", undefined, "2026-02-15T10:00:00.000Z"),
      ).rejects.toThrow(ConflictError);
    });
  });
});
