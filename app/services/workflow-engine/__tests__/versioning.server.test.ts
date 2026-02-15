import { describe, it, expect, vi, beforeEach } from "vitest";

const mockWorkflowFindFirst = vi.fn();
const mockVersionFindFirst = vi.fn();
const mockVersionFindMany = vi.fn();
const mockVersionCreate = vi.fn();
const mockParticipantFindFirst = vi.fn();
const mockParticipantUpdate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    workflow: {
      findFirst: mockWorkflowFindFirst,
    },
    workflowVersion: {
      findFirst: mockVersionFindFirst,
      findMany: mockVersionFindMany,
      create: mockVersionCreate,
    },
    participant: {
      findFirst: mockParticipantFindFirst,
      update: mockParticipantUpdate,
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
      rejectionTargetId: "step-1",
      bypassTargetId: null,
      escalationTargetId: null,
      slaDurationMinutes: null,
      slaAction: null,
      config: {},
    },
  ],
};

describe("versioning.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ensureCurrentVersion", () => {
    it("creates version when none exists", async () => {
      const { ensureCurrentVersion } = await import("../versioning.server");
      mockWorkflowFindFirst.mockResolvedValue(baseWorkflow);
      mockVersionFindFirst.mockResolvedValue(null);
      const createdVersion = { id: "v-1", workflowId: "wf-1", version: 1, snapshot: {} };
      mockVersionCreate.mockResolvedValue(createdVersion);

      const result = await ensureCurrentVersion("wf-1", "user-1");

      expect(result).toEqual(createdVersion);
      expect(mockVersionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workflowId: "wf-1",
          version: 1,
          createdBy: "user-1",
        }),
      });
    });

    it("returns existing when hash matches", async () => {
      const { ensureCurrentVersion } = await import("../versioning.server");
      const { computeWorkflowHash } = await import("../serializer.server");
      const hash = computeWorkflowHash(baseWorkflow);

      mockWorkflowFindFirst.mockResolvedValue(baseWorkflow);
      const existingVersion = {
        id: "v-1",
        workflowId: "wf-1",
        version: 1,
        changeDescription: hash,
      };
      mockVersionFindFirst.mockResolvedValue(existingVersion);

      const result = await ensureCurrentVersion("wf-1", "user-1");

      expect(result).toEqual(existingVersion);
      expect(mockVersionCreate).not.toHaveBeenCalled();
    });

    it("creates new version when hash differs", async () => {
      const { ensureCurrentVersion } = await import("../versioning.server");
      mockWorkflowFindFirst.mockResolvedValue(baseWorkflow);
      const existingVersion = {
        id: "v-1",
        workflowId: "wf-1",
        version: 1,
        changeDescription: "old-hash",
      };
      mockVersionFindFirst.mockResolvedValue(existingVersion);
      const newVersion = { id: "v-2", workflowId: "wf-1", version: 2 };
      mockVersionCreate.mockResolvedValue(newVersion);

      const result = await ensureCurrentVersion("wf-1", "user-1");

      expect(result).toEqual(newVersion);
      expect(mockVersionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workflowId: "wf-1",
          version: 2,
        }),
      });
    });

    it("throws when workflow not found", async () => {
      const { ensureCurrentVersion } = await import("../versioning.server");
      const { WorkflowError } = await import("../serializer.server");
      mockWorkflowFindFirst.mockResolvedValue(null);

      await expect(ensureCurrentVersion("wf-missing", "user-1")).rejects.toThrow(WorkflowError);
    });
  });

  describe("publishWorkflowVersion", () => {
    it("always creates new version regardless of hash", async () => {
      const { publishWorkflowVersion } = await import("../versioning.server");
      mockWorkflowFindFirst.mockResolvedValue(baseWorkflow);
      const existingVersion = { id: "v-1", version: 1 };
      mockVersionFindFirst.mockResolvedValue(existingVersion);
      const newVersion = { id: "v-2", version: 2 };
      mockVersionCreate.mockResolvedValue(newVersion);

      const result = await publishWorkflowVersion("wf-1", "user-1", "Manual publish");

      expect(result).toEqual(newVersion);
      expect(mockVersionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: 2,
          changeDescription: "Manual publish",
        }),
      });
    });
  });

  describe("listWorkflowVersions", () => {
    it("includes participant counts", async () => {
      const { listWorkflowVersions } = await import("../versioning.server");
      mockVersionFindMany.mockResolvedValue([
        { id: "v-2", version: 2, createdAt: new Date("2026-01-02"), _count: { participants: 5 } },
        { id: "v-1", version: 1, createdAt: new Date("2026-01-01"), _count: { participants: 10 } },
      ]);

      const result = await listWorkflowVersions("wf-1");

      expect(result).toEqual([
        { id: "v-2", version: 2, createdAt: expect.any(Date), participantCount: 5 },
        { id: "v-1", version: 1, createdAt: expect.any(Date), participantCount: 10 },
      ]);
    });
  });

  describe("compareVersions", () => {
    it("detects added, removed, and modified steps", async () => {
      const { compareVersions } = await import("../versioning.server");
      const { serializeWorkflow } = await import("../serializer.server");

      const snapshotV1 = serializeWorkflow({
        ...baseWorkflow,
        steps: [baseWorkflow.steps[0], baseWorkflow.steps[1]],
      });
      const snapshotV2 = serializeWorkflow({
        ...baseWorkflow,
        steps: [
          { ...baseWorkflow.steps[0], name: "Updated Review" },
          {
            id: "step-3",
            name: "Print",
            description: null,
            order: 3,
            stepType: "PRINT",
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
      });

      mockVersionFindFirst
        .mockResolvedValueOnce({ id: "v-1", snapshot: snapshotV1 })
        .mockResolvedValueOnce({ id: "v-2", snapshot: snapshotV2 });

      const result = await compareVersions("v-1", "v-2");

      expect(result.addedSteps).toHaveLength(1);
      expect(result.addedSteps[0].id).toBe("step-3");
      expect(result.removedSteps).toHaveLength(1);
      expect(result.removedSteps[0].id).toBe("step-2");
      expect(result.modifiedSteps).toHaveLength(1);
      expect(result.modifiedSteps[0].id).toBe("step-1");
    });
  });

  describe("getParticipantVersion", () => {
    it("returns assigned version snapshot", async () => {
      const { getParticipantVersion } = await import("../versioning.server");
      const { serializeWorkflow } = await import("../serializer.server");
      const snapshot = serializeWorkflow(baseWorkflow);

      mockParticipantFindFirst.mockResolvedValue({
        id: "p-1",
        workflowId: "wf-1",
        workflowVersionId: "v-1",
        workflowVersion: { id: "v-1", snapshot },
      });

      const result = await getParticipantVersion("p-1");

      expect(result.id).toBe("wf-1");
      expect(result.steps).toHaveLength(2);
    });

    it("assigns current version when participant has none", async () => {
      const { getParticipantVersion } = await import("../versioning.server");
      const { serializeWorkflow } = await import("../serializer.server");
      const snapshot = serializeWorkflow(baseWorkflow);

      mockParticipantFindFirst.mockResolvedValue({
        id: "p-1",
        workflowId: "wf-1",
        workflowVersionId: null,
        workflowVersion: null,
      });
      mockWorkflowFindFirst.mockResolvedValue(baseWorkflow);
      mockVersionFindFirst.mockResolvedValue(null);
      const newVersion = { id: "v-1", version: 1, snapshot };
      mockVersionCreate.mockResolvedValue(newVersion);
      mockParticipantUpdate.mockResolvedValue({});

      const result = await getParticipantVersion("p-1");

      expect(mockParticipantUpdate).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: { workflowVersionId: "v-1" },
      });
      expect(result.id).toBe("wf-1");
    });
  });
});
