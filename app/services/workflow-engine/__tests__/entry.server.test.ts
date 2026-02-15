import { describe, it, expect, vi, beforeEach } from "vitest";

const mockParticipantUpdate = vi.fn();
const mockAuditCreate = vi.fn();
const mockWorkflowFindFirst = vi.fn();
const mockVersionFindFirst = vi.fn();
const mockVersionCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    participant: {
      update: mockParticipantUpdate,
    },
    auditLog: {
      create: mockAuditCreate,
    },
    workflow: {
      findFirst: mockWorkflowFindFirst,
    },
    workflowVersion: {
      findFirst: mockVersionFindFirst,
      create: mockVersionCreate,
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

const baseWorkflow = {
  id: "wf-1",
  name: "Accreditation",
  deletedAt: null,
  steps: [
    {
      id: "step-1",
      name: "Review",
      description: null,
      order: 1,
      stepType: "REVIEW",
      isEntryPoint: true,
      isTerminal: false,
      nextStepId: "step-2",
      rejectionTargetId: null,
      bypassTargetId: null,
      escalationTargetId: null,
      slaDurationMinutes: null,
      slaAction: null,
      config: {},
    },
    {
      id: "step-2",
      name: "Approval",
      description: null,
      order: 2,
      stepType: "APPROVAL",
      isEntryPoint: false,
      isTerminal: true,
      nextStepId: null,
      rejectionTargetId: null,
      bypassTargetId: null,
      escalationTargetId: null,
      slaDurationMinutes: null,
      slaAction: null,
      config: {},
    },
  ],
};

describe("entry.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditCreate.mockResolvedValue({});
    mockParticipantUpdate.mockResolvedValue({});
  });

  describe("enterWorkflow", () => {
    it("assigns correct version and entry step", async () => {
      const { enterWorkflow } = await import("../entry.server");
      const { serializeWorkflow } = await import("../../workflow-engine/serializer.server");
      const snapshot = serializeWorkflow(baseWorkflow);

      mockWorkflowFindFirst.mockResolvedValue(baseWorkflow);
      mockVersionFindFirst.mockResolvedValue(null);
      const version = { id: "v-1", version: 1, snapshot };
      mockVersionCreate.mockResolvedValue(version);

      const result = await enterWorkflow("p-1", "wf-1", "user-1");

      expect(result).toEqual({ versionId: "v-1", stepId: "step-1" });
      expect(mockParticipantUpdate).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: {
          currentStepId: "step-1",
          workflowVersionId: "v-1",
          status: "PENDING",
        },
      });
    });

    it("throws if no entry point found", async () => {
      const { enterWorkflow } = await import("../entry.server");
      const { WorkflowError, serializeWorkflow } =
        await import("../../workflow-engine/serializer.server");

      const noEntryWorkflow = {
        ...baseWorkflow,
        steps: baseWorkflow.steps.map((s) => ({ ...s, isEntryPoint: false })),
      };
      const snapshot = serializeWorkflow(noEntryWorkflow);

      mockWorkflowFindFirst.mockResolvedValue(noEntryWorkflow);
      mockVersionFindFirst.mockResolvedValue(null);
      mockVersionCreate.mockResolvedValue({ id: "v-1", version: 1, snapshot });

      await expect(enterWorkflow("p-1", "wf-1", "user-1")).rejects.toThrow(WorkflowError);
      await expect(enterWorkflow("p-1", "wf-1", "user-1")).rejects.toMatchObject({ status: 400 });
    });

    it("creates audit log entry", async () => {
      const { enterWorkflow } = await import("../entry.server");
      const { serializeWorkflow } = await import("../../workflow-engine/serializer.server");
      const snapshot = serializeWorkflow(baseWorkflow);

      mockWorkflowFindFirst.mockResolvedValue(baseWorkflow);
      mockVersionFindFirst.mockResolvedValue(null);
      mockVersionCreate.mockResolvedValue({ id: "v-1", version: 1, snapshot });

      await enterWorkflow("p-1", "wf-1", "user-1");

      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          action: "CREATE",
          entityType: "WorkflowEntry",
          entityId: "p-1",
        }),
      });
    });
  });
});
