import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockAssignmentUpsert = vi.fn();
const mockAssignmentFindUniqueOrThrow = vi.fn();
const mockAssignmentUpdate = vi.fn();
const mockAssignmentFindMany = vi.fn();
const mockStepFindUniqueOrThrow = vi.fn();
const mockStepUpdate = vi.fn();
const mockApprovalCount = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    stepAssignment: {
      upsert: (...args: unknown[]) => mockAssignmentUpsert(...args),
      findUniqueOrThrow: (...args: unknown[]) => mockAssignmentFindUniqueOrThrow(...args),
      update: (...args: unknown[]) => mockAssignmentUpdate(...args),
      findMany: (...args: unknown[]) => mockAssignmentFindMany(...args),
    },
    step: {
      findUniqueOrThrow: (...args: unknown[]) => mockStepFindUniqueOrThrow(...args),
      update: (...args: unknown[]) => mockStepUpdate(...args),
    },
    approval: {
      count: (...args: unknown[]) => mockApprovalCount(...args),
    },
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("~/services/notifications.server", () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}));

// ─── Tests ───────────────────────────────────────────────

describe("step-assignment.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("assignStep", () => {
    it("creates an assignment via upsert", async () => {
      const { assignStep } = await import("../step-assignment.server");

      mockAssignmentUpsert.mockResolvedValue({
        id: "asgn-1",
        stepId: "step-1",
        userId: "user-1",
        strategy: "MANUAL",
        isActive: true,
        step: { name: "Review" },
        user: { id: "user-1", name: "Alice" },
      });

      const result = await assignStep({
        stepId: "step-1",
        userId: "user-1",
        assignedBy: "admin-1",
      });

      expect(result.id).toBe("asgn-1");
      expect(mockAssignmentUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stepId_userId: { stepId: "step-1", userId: "user-1" } },
          create: expect.objectContaining({
            stepId: "step-1",
            userId: "user-1",
            strategy: "MANUAL",
            assignedBy: "admin-1",
          }),
        }),
      );
    });

    it("sends notification when tenantId is provided", async () => {
      const { assignStep } = await import("../step-assignment.server");
      const { createNotification } = await import("~/services/notifications.server");

      mockAssignmentUpsert.mockResolvedValue({
        id: "asgn-1",
        stepId: "step-1",
        userId: "user-1",
        strategy: "MANUAL",
        isActive: true,
        step: { name: "Review" },
        user: { id: "user-1", name: "Alice" },
      });

      await assignStep({
        stepId: "step-1",
        userId: "user-1",
        assignedBy: "admin-1",
        tenantId: "tenant-1",
      });

      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          tenantId: "tenant-1",
          type: "step_assignment",
        }),
      );
    });

    it("uses specified strategy", async () => {
      const { assignStep } = await import("../step-assignment.server");

      mockAssignmentUpsert.mockResolvedValue({
        id: "asgn-1",
        stepId: "step-1",
        userId: "user-1",
        strategy: "ROUND_ROBIN",
        isActive: true,
        step: { name: "Review" },
        user: { id: "user-1" },
      });

      await assignStep({
        stepId: "step-1",
        userId: "user-1",
        strategy: "ROUND_ROBIN",
        assignedBy: "admin-1",
      });

      expect(mockAssignmentUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ strategy: "ROUND_ROBIN" }),
        }),
      );
    });
  });

  describe("reassignStep", () => {
    it("deactivates old assignment and creates new one", async () => {
      const { reassignStep } = await import("../step-assignment.server");

      mockAssignmentFindUniqueOrThrow.mockResolvedValue({
        id: "asgn-old",
        stepId: "step-1",
        userId: "user-1",
        strategy: "MANUAL",
      });

      mockAssignmentUpdate.mockResolvedValue({});

      mockAssignmentUpsert.mockResolvedValue({
        id: "asgn-new",
        stepId: "step-1",
        userId: "user-2",
        strategy: "MANUAL",
        isActive: true,
        step: { name: "Review" },
        user: { id: "user-2" },
      });

      const result = await reassignStep({
        assignmentId: "asgn-old",
        newUserId: "user-2",
        reassignedBy: "admin-1",
      });

      expect(result.id).toBe("asgn-new");
      expect(mockAssignmentUpdate).toHaveBeenCalledWith({
        where: { id: "asgn-old" },
        data: { isActive: false },
      });
    });
  });

  describe("unassignStep", () => {
    it("sets isActive to false", async () => {
      const { unassignStep } = await import("../step-assignment.server");
      mockAssignmentUpdate.mockResolvedValue({});

      await unassignStep("asgn-1");

      expect(mockAssignmentUpdate).toHaveBeenCalledWith({
        where: { id: "asgn-1" },
        data: { isActive: false },
      });
    });
  });

  describe("getStepAssignments", () => {
    it("returns active assignments for a step", async () => {
      const { getStepAssignments } = await import("../step-assignment.server");

      mockAssignmentFindMany.mockResolvedValue([
        { id: "asgn-1", stepId: "step-1", userId: "user-1", isActive: true },
        { id: "asgn-2", stepId: "step-1", userId: "user-2", isActive: true },
      ]);

      const result = await getStepAssignments("step-1");

      expect(result).toHaveLength(2);
      expect(mockAssignmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stepId: "step-1", isActive: true },
        }),
      );
    });
  });

  describe("getUserAssignments", () => {
    it("returns active assignments for a user", async () => {
      const { getUserAssignments } = await import("../step-assignment.server");

      mockAssignmentFindMany.mockResolvedValue([
        { id: "asgn-1", stepId: "step-1", userId: "user-1" },
      ]);

      const result = await getUserAssignments("user-1");

      expect(result).toHaveLength(1);
      expect(mockAssignmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1", isActive: true },
        }),
      );
    });
  });

  describe("getNextAssignee", () => {
    it("returns null when no assignments exist", async () => {
      const { getNextAssignee } = await import("../step-assignment.server");

      mockAssignmentFindMany.mockResolvedValue([]);

      const result = await getNextAssignee("step-1");
      expect(result).toBeNull();
    });

    it("returns null for MANUAL strategy", async () => {
      const { getNextAssignee } = await import("../step-assignment.server");

      mockAssignmentFindMany.mockResolvedValue([{ userId: "user-1", strategy: "MANUAL" }]);

      const result = await getNextAssignee("step-1");
      expect(result).toBeNull();
    });

    describe("ROUND_ROBIN", () => {
      it("cycles through assignees starting from index 0", async () => {
        const { getNextAssignee } = await import("../step-assignment.server");

        mockAssignmentFindMany.mockResolvedValue([
          { userId: "user-1", strategy: "ROUND_ROBIN" },
          { userId: "user-2", strategy: "ROUND_ROBIN" },
          { userId: "user-3", strategy: "ROUND_ROBIN" },
        ]);

        mockStepFindUniqueOrThrow.mockResolvedValue({
          config: { roundRobinIndex: -1 },
        });
        mockStepUpdate.mockResolvedValue({});

        const result = await getNextAssignee("step-1");

        expect(result).toBe("user-1");
        expect(mockStepUpdate).toHaveBeenCalledWith({
          where: { id: "step-1" },
          data: { config: expect.objectContaining({ roundRobinIndex: 0 }) },
        });
      });

      it("wraps around when reaching end of list", async () => {
        const { getNextAssignee } = await import("../step-assignment.server");

        mockAssignmentFindMany.mockResolvedValue([
          { userId: "user-1", strategy: "ROUND_ROBIN" },
          { userId: "user-2", strategy: "ROUND_ROBIN" },
        ]);

        mockStepFindUniqueOrThrow.mockResolvedValue({
          config: { roundRobinIndex: 1 },
        });
        mockStepUpdate.mockResolvedValue({});

        const result = await getNextAssignee("step-1");

        expect(result).toBe("user-1");
        expect(mockStepUpdate).toHaveBeenCalledWith({
          where: { id: "step-1" },
          data: { config: expect.objectContaining({ roundRobinIndex: 0 }) },
        });
      });

      it("advances to next user in sequence", async () => {
        const { getNextAssignee } = await import("../step-assignment.server");

        mockAssignmentFindMany.mockResolvedValue([
          { userId: "user-1", strategy: "ROUND_ROBIN" },
          { userId: "user-2", strategy: "ROUND_ROBIN" },
          { userId: "user-3", strategy: "ROUND_ROBIN" },
        ]);

        mockStepFindUniqueOrThrow.mockResolvedValue({
          config: { roundRobinIndex: 0 },
        });
        mockStepUpdate.mockResolvedValue({});

        const result = await getNextAssignee("step-1");

        expect(result).toBe("user-2");
      });
    });

    describe("LEAST_LOADED", () => {
      it("returns user with fewest in-progress participants", async () => {
        const { getNextAssignee } = await import("../step-assignment.server");

        mockAssignmentFindMany.mockResolvedValue([
          { userId: "user-1", strategy: "LEAST_LOADED" },
          { userId: "user-2", strategy: "LEAST_LOADED" },
          { userId: "user-3", strategy: "LEAST_LOADED" },
        ]);

        // user-1: 5, user-2: 2, user-3: 8
        mockApprovalCount
          .mockResolvedValueOnce(5)
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(8);

        const result = await getNextAssignee("step-1");

        expect(result).toBe("user-2");
      });

      it("returns first user when all have equal load", async () => {
        const { getNextAssignee } = await import("../step-assignment.server");

        mockAssignmentFindMany.mockResolvedValue([
          { userId: "user-1", strategy: "LEAST_LOADED" },
          { userId: "user-2", strategy: "LEAST_LOADED" },
        ]);

        mockApprovalCount.mockResolvedValueOnce(3).mockResolvedValueOnce(3);

        const result = await getNextAssignee("step-1");

        expect(result).toBe("user-1");
      });

      it("picks user with zero load", async () => {
        const { getNextAssignee } = await import("../step-assignment.server");

        mockAssignmentFindMany.mockResolvedValue([
          { userId: "user-1", strategy: "LEAST_LOADED" },
          { userId: "user-2", strategy: "LEAST_LOADED" },
        ]);

        mockApprovalCount.mockResolvedValueOnce(10).mockResolvedValueOnce(0);

        const result = await getNextAssignee("step-1");

        expect(result).toBe("user-2");
      });
    });
  });
});
