import { describe, it, expect, vi, beforeEach } from "vitest";

const mockParticipantFindMany = vi.fn();
const mockParticipantFindFirst = vi.fn();
const mockParticipantUpdate = vi.fn();
const mockApprovalCreate = vi.fn();
const mockApprovalFindFirst = vi.fn();
const mockAuditCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    participant: {
      findMany: mockParticipantFindMany,
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

function makeSnapshot(stepOverrides: Record<string, unknown> = {}) {
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
        rejectionTargetId: null,
        bypassTargetId: null,
        escalationTargetId: "step-esc",
        slaDurationMinutes: 60,
        slaAction: "NOTIFY",
        conditions: {},
        slaWarningMinutes: 15,
        assignedRoleId: null,
        ...stepOverrides,
      },
    ],
  };
}

function makeParticipant(
  overrides: Record<string, unknown> = {},
  stepOverrides: Record<string, unknown> = {},
) {
  return {
    id: "p-1",
    firstName: "John",
    lastName: "Doe",
    registrationCode: "REG-001",
    tenantId: "tenant-1",
    status: "PENDING",
    currentStepId: "step-1",
    workflowVersionId: "v-1",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    deletedAt: null,
    workflowVersion: {
      id: "v-1",
      snapshot: makeSnapshot(stepOverrides),
    },
    approvals: [{ createdAt: new Date("2026-01-01T10:00:00Z") }],
    ...overrides,
  };
}

describe("sla-checker.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditCreate.mockResolvedValue({});
    mockParticipantUpdate.mockResolvedValue({});
    mockApprovalCreate.mockResolvedValue({});
  });

  describe("checkOverdueSLAs", () => {
    it("does not flag participants within SLA", async () => {
      const { checkOverdueSLAs } = await import("../sla-checker.server");

      // Step entered 30 minutes ago, SLA is 60 minutes → within SLA
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      mockParticipantFindMany.mockResolvedValue([
        makeParticipant({}, { slaDurationMinutes: 60, slaWarningMinutes: null }),
      ]);
      // Override the approval time to be recent
      mockParticipantFindMany.mockResolvedValue([
        makeParticipant(
          { approvals: [{ createdAt: thirtyMinutesAgo }] },
          { slaDurationMinutes: 60, slaWarningMinutes: null },
        ),
      ]);

      const result = await checkOverdueSLAs();

      expect(result.checked).toBe(1);
      expect(result.warnings).toBe(0);
      expect(result.breached).toBe(0);
      expect(result.actions).toHaveLength(0);
    });

    it("triggers warning for participants in warning zone", async () => {
      const { checkOverdueSLAs } = await import("../sla-checker.server");

      // Step entered 50 minutes ago, SLA = 60 min, warning = 15 min → in warning zone
      const now = new Date();
      const fiftyMinutesAgo = new Date(now.getTime() - 50 * 60 * 1000);
      mockParticipantFindMany.mockResolvedValue([
        makeParticipant(
          { approvals: [{ createdAt: fiftyMinutesAgo }] },
          { slaDurationMinutes: 60, slaWarningMinutes: 15 },
        ),
      ]);

      const result = await checkOverdueSLAs();

      expect(result.checked).toBe(1);
      expect(result.warnings).toBe(1);
      expect(result.breached).toBe(0);
    });

    it("triggers breach for participants past SLA deadline", async () => {
      const { checkOverdueSLAs } = await import("../sla-checker.server");

      // Step entered 90 minutes ago, SLA = 60 min → breached
      const now = new Date();
      const ninetyMinutesAgo = new Date(now.getTime() - 90 * 60 * 1000);
      mockParticipantFindMany.mockResolvedValue([
        makeParticipant(
          { approvals: [{ createdAt: ninetyMinutesAgo }] },
          { slaDurationMinutes: 60, slaAction: "NOTIFY" },
        ),
      ]);

      const result = await checkOverdueSLAs();

      expect(result.checked).toBe(1);
      expect(result.breached).toBe(1);
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].success).toBe(true);
    });

    it("NOTIFY action sends notification but does not change participant state", async () => {
      const { checkOverdueSLAs } = await import("../sla-checker.server");

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);
      mockParticipantFindMany.mockResolvedValue([
        makeParticipant(
          { approvals: [{ createdAt: twoHoursAgo }] },
          { slaDurationMinutes: 60, slaAction: "NOTIFY" },
        ),
      ]);

      const result = await checkOverdueSLAs();

      expect(result.actions[0].action).toBe("NOTIFY");
      expect(result.actions[0].success).toBe(true);
      // NOTIFY does not call processWorkflowAction → no participant update
      expect(mockParticipantUpdate).not.toHaveBeenCalled();
    });

    it("ESCALATE action moves participant to escalation target", async () => {
      const { checkOverdueSLAs } = await import("../sla-checker.server");

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);
      const participant = makeParticipant(
        { approvals: [{ createdAt: twoHoursAgo }] },
        { slaDurationMinutes: 60, slaAction: "ESCALATE", escalationTargetId: "step-esc" },
      );
      mockParticipantFindMany.mockResolvedValue([participant]);
      // processWorkflowAction will call findFirst
      mockParticipantFindFirst.mockResolvedValue({
        ...participant,
        workflowVersion: participant.workflowVersion,
      });

      const result = await checkOverdueSLAs();

      expect(result.actions[0].action).toBe("ESCALATE");
      expect(result.actions[0].success).toBe(true);
      expect(mockParticipantUpdate).toHaveBeenCalled();
    });

    it("AUTO_APPROVE action approves and moves to next step", async () => {
      const { checkOverdueSLAs } = await import("../sla-checker.server");

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);
      const participant = makeParticipant(
        { approvals: [{ createdAt: twoHoursAgo }] },
        { slaDurationMinutes: 60, slaAction: "AUTO_APPROVE", nextStepId: "step-2" },
      );
      mockParticipantFindMany.mockResolvedValue([participant]);
      mockParticipantFindFirst.mockResolvedValue({
        ...participant,
        workflowVersion: participant.workflowVersion,
      });

      const result = await checkOverdueSLAs();

      expect(result.actions[0].action).toBe("AUTO_APPROVE");
      expect(result.actions[0].success).toBe(true);
    });

    it("AUTO_REJECT action rejects and moves to rejection target", async () => {
      const { checkOverdueSLAs } = await import("../sla-checker.server");

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);
      const participant = makeParticipant(
        { approvals: [{ createdAt: twoHoursAgo }] },
        { slaDurationMinutes: 60, slaAction: "AUTO_REJECT", rejectionTargetId: "step-rej" },
      );
      mockParticipantFindMany.mockResolvedValue([participant]);
      mockParticipantFindFirst.mockResolvedValue({
        ...participant,
        workflowVersion: participant.workflowVersion,
      });

      const result = await checkOverdueSLAs();

      expect(result.actions[0].action).toBe("AUTO_REJECT");
      expect(result.actions[0].success).toBe(true);
    });

    it("all breach actions create Approval records with SYSTEM user", async () => {
      const { checkOverdueSLAs } = await import("../sla-checker.server");

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);
      const participant = makeParticipant(
        { approvals: [{ createdAt: twoHoursAgo }] },
        { slaDurationMinutes: 60, slaAction: "AUTO_APPROVE", nextStepId: "step-2" },
      );
      mockParticipantFindMany.mockResolvedValue([participant]);
      mockParticipantFindFirst.mockResolvedValue({
        ...participant,
        workflowVersion: participant.workflowVersion,
      });

      await checkOverdueSLAs();

      // processWorkflowAction creates approval with userId = "SYSTEM"
      expect(mockApprovalCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "SYSTEM",
          participantId: "p-1",
        }),
      });
    });

    it("handles errors gracefully — one failure does not block others", async () => {
      const { checkOverdueSLAs } = await import("../sla-checker.server");

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);
      const failParticipant = makeParticipant(
        { id: "p-fail", approvals: [{ createdAt: twoHoursAgo }] },
        {
          slaDurationMinutes: 60,
          slaAction: "ESCALATE",
          escalationTargetId: null, // Will cause processWorkflowAction to throw
        },
      );
      const successParticipant = makeParticipant(
        { id: "p-success", approvals: [{ createdAt: twoHoursAgo }] },
        { slaDurationMinutes: 60, slaAction: "NOTIFY" },
      );
      mockParticipantFindMany.mockResolvedValue([failParticipant, successParticipant]);
      mockParticipantFindFirst.mockResolvedValue({
        ...failParticipant,
        workflowVersion: failParticipant.workflowVersion,
      });

      const result = await checkOverdueSLAs();

      expect(result.breached).toBe(2);
      // First one failed, second one succeeded
      expect(result.actions).toHaveLength(2);
      const failAction = result.actions.find((a) => a.participantId === "p-fail");
      const successAction = result.actions.find((a) => a.participantId === "p-success");
      expect(failAction?.success).toBe(false);
      expect(successAction?.success).toBe(true);
    });

    it("skips participants without SLA configuration", async () => {
      const { checkOverdueSLAs } = await import("../sla-checker.server");

      mockParticipantFindMany.mockResolvedValue([
        makeParticipant({}, { slaDurationMinutes: null }),
      ]);

      const result = await checkOverdueSLAs();

      expect(result.checked).toBe(0);
      expect(result.breached).toBe(0);
      expect(result.warnings).toBe(0);
    });

    it("uses participant createdAt when no approvals exist", async () => {
      const { checkOverdueSLAs } = await import("../sla-checker.server");

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);
      mockParticipantFindMany.mockResolvedValue([
        makeParticipant(
          { approvals: [], createdAt: twoHoursAgo },
          { slaDurationMinutes: 60, slaAction: "NOTIFY" },
        ),
      ]);

      const result = await checkOverdueSLAs();

      expect(result.breached).toBe(1);
    });
  });
});
