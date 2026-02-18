import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockPlanCreate = vi.fn();
const mockPlanFindFirst = vi.fn();
const mockPlanFindMany = vi.fn();
const mockPlanUpdate = vi.fn();
const mockPlanDelete = vi.fn();
const mockAssignmentCreate = vi.fn();
const mockAssignmentFindFirst = vi.fn();
const mockAssignmentCount = vi.fn();
const mockAssignmentDelete = vi.fn();
const mockConflictCreate = vi.fn();
const mockConflictFindFirst = vi.fn();
const mockConflictFindMany = vi.fn();
const mockConflictUpdate = vi.fn();
const mockConflictCount = vi.fn();
const mockParticipantFindMany = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    seatingPlan: {
      create: (...args: unknown[]) => mockPlanCreate(...args),
      findFirst: (...args: unknown[]) => mockPlanFindFirst(...args),
      findMany: (...args: unknown[]) => mockPlanFindMany(...args),
      update: (...args: unknown[]) => mockPlanUpdate(...args),
      delete: (...args: unknown[]) => mockPlanDelete(...args),
    },
    seatingAssignment: {
      create: (...args: unknown[]) => mockAssignmentCreate(...args),
      findFirst: (...args: unknown[]) => mockAssignmentFindFirst(...args),
      count: (...args: unknown[]) => mockAssignmentCount(...args),
      delete: (...args: unknown[]) => mockAssignmentDelete(...args),
    },
    seatingConflict: {
      create: (...args: unknown[]) => mockConflictCreate(...args),
      findFirst: (...args: unknown[]) => mockConflictFindFirst(...args),
      findMany: (...args: unknown[]) => mockConflictFindMany(...args),
      update: (...args: unknown[]) => mockConflictUpdate(...args),
      count: (...args: unknown[]) => mockConflictCount(...args),
    },
    participant: {
      findMany: (...args: unknown[]) => mockParticipantFindMany(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
    },
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ─── Helpers ─────────────────────────────────────────────

const CTX = {
  userId: "user-1",
  tenantId: "tenant-1",
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
};

// ─── Tests ───────────────────────────────────────────────

describe("seating.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createSeatingPlan", () => {
    it("creates plan and audit log", async () => {
      const { createSeatingPlan } = await import("../seating.server");

      mockPlanCreate.mockImplementation(async ({ data }: any) => ({
        id: "plan-1",
        ...data,
      }));

      const result = await createSeatingPlan(
        { eventId: "event-1", name: "Main Hall", layoutType: "theater", totalSeats: 200 },
        CTX,
      );

      expect(result.id).toBe("plan-1");
      expect(result.name).toBe("Main Hall");
      expect(result.layoutType).toBe("theater");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("listSeatingPlans", () => {
    it("returns plans with assignment counts", async () => {
      const { listSeatingPlans } = await import("../seating.server");

      mockPlanFindMany.mockResolvedValue([
        { id: "plan-1", name: "Main Hall", totalSeats: 200, _count: { assignments: 50 } },
      ]);

      const result = await listSeatingPlans("event-1", "tenant-1");
      expect(result).toHaveLength(1);
      expect(result[0]._count.assignments).toBe(50);
    });
  });

  describe("deleteSeatingPlan", () => {
    it("deletes plan and creates audit log", async () => {
      const { deleteSeatingPlan } = await import("../seating.server");

      mockPlanFindFirst.mockResolvedValue({
        id: "plan-1",
        tenantId: "tenant-1",
        name: "Test Plan",
        isFinalized: false,
      });
      mockPlanDelete.mockResolvedValue({});

      const result = await deleteSeatingPlan("plan-1", CTX);
      expect(result.success).toBe(true);
      expect(mockPlanDelete).toHaveBeenCalledWith({ where: { id: "plan-1" } });
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("assignSeat", () => {
    it("assigns seat and increments count", async () => {
      const { assignSeat } = await import("../seating.server");

      mockPlanFindFirst.mockResolvedValue({
        id: "plan-1",
        tenantId: "tenant-1",
        totalSeats: 200,
        assignedSeats: 10,
        isFinalized: false,
      });
      mockAssignmentCreate.mockImplementation(async ({ data }: any) => ({
        id: "assign-1",
        ...data,
        participant: { id: "p-1", firstName: "John", lastName: "Doe" },
      }));
      mockPlanUpdate.mockResolvedValue({});

      const result = await assignSeat(
        {
          seatingPlanId: "plan-1",
          participantId: "p-1",
          seatLabel: "A1",
          priority: "MINISTER",
        },
        CTX,
      );

      expect(result.id).toBe("assign-1");
      expect(result.seatLabel).toBe("A1");
      expect(mockPlanUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { assignedSeats: { increment: 1 } },
        }),
      );
    });

    it("throws when plan is finalized", async () => {
      const { assignSeat } = await import("../seating.server");

      mockPlanFindFirst.mockResolvedValue({
        id: "plan-1",
        tenantId: "tenant-1",
        totalSeats: 200,
        assignedSeats: 10,
        isFinalized: true,
      });

      await expect(
        assignSeat(
          { seatingPlanId: "plan-1", participantId: "p-1", seatLabel: "A1", priority: "DELEGATE" },
          CTX,
        ),
      ).rejects.toThrow("finalized");
    });

    it("throws when all seats assigned", async () => {
      const { assignSeat } = await import("../seating.server");

      mockPlanFindFirst.mockResolvedValue({
        id: "plan-1",
        tenantId: "tenant-1",
        totalSeats: 10,
        assignedSeats: 10,
        isFinalized: false,
      });

      await expect(
        assignSeat(
          { seatingPlanId: "plan-1", participantId: "p-1", seatLabel: "A1", priority: "DELEGATE" },
          CTX,
        ),
      ).rejects.toThrow("All seats are assigned");
    });
  });

  describe("unassignSeat", () => {
    it("removes assignment and decrements count", async () => {
      const { unassignSeat } = await import("../seating.server");

      mockAssignmentFindFirst.mockResolvedValue({
        id: "assign-1",
        seatingPlanId: "plan-1",
        seatLabel: "A1",
        seatingPlan: { tenantId: "tenant-1", isFinalized: false },
      });
      mockAssignmentDelete.mockResolvedValue({});
      mockPlanUpdate.mockResolvedValue({});

      const result = await unassignSeat("assign-1", CTX);
      expect(result.success).toBe(true);
      expect(mockAssignmentDelete).toHaveBeenCalled();
      expect(mockPlanUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { assignedSeats: { decrement: 1 } },
        }),
      );
    });
  });

  describe("autoAssignSeating", () => {
    it("assigns unassigned participants to available seats", async () => {
      const { autoAssignSeating } = await import("../seating.server");

      mockPlanFindFirst.mockResolvedValue({
        id: "plan-1",
        eventId: "event-1",
        tenantId: "tenant-1",
        totalSeats: 100,
        assignedSeats: 2,
        isFinalized: false,
        assignments: [{ participantId: "p-1" }, { participantId: "p-2" }],
      });
      mockParticipantFindMany.mockResolvedValue([
        { id: "p-3", firstName: "Alice", lastName: "Smith" },
        { id: "p-4", firstName: "Bob", lastName: "Jones" },
      ]);
      mockConflictFindMany.mockResolvedValue([]);
      mockAssignmentCreate.mockResolvedValue({});
      mockPlanUpdate.mockResolvedValue({});

      const result = await autoAssignSeating("plan-1", CTX);
      expect(result.assigned).toBe(2);
      expect(mockAssignmentCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe("addConflict", () => {
    it("creates conflict with normalized participant order", async () => {
      const { addConflict } = await import("../seating.server");

      mockConflictCreate.mockImplementation(async ({ data }: any) => ({
        id: "conflict-1",
        ...data,
      }));

      const result = await addConflict(
        {
          eventId: "event-1",
          participantAId: "zzz",
          participantBId: "aaa",
          conflictType: "Diplomatic",
        },
        CTX,
      );

      // Should normalize order: aaa < zzz
      expect(result.participantAId).toBe("aaa");
      expect(result.participantBId).toBe("zzz");
    });

    it("throws when same participant", async () => {
      const { addConflict } = await import("../seating.server");

      await expect(
        addConflict(
          { eventId: "event-1", participantAId: "p-1", participantBId: "p-1", conflictType: "X" },
          CTX,
        ),
      ).rejects.toThrow("themselves");
    });
  });

  describe("resolveConflict", () => {
    it("marks conflict as resolved", async () => {
      const { resolveConflict } = await import("../seating.server");

      mockConflictFindFirst.mockResolvedValue({
        id: "conflict-1",
        tenantId: "tenant-1",
        isResolved: false,
      });
      mockConflictUpdate.mockResolvedValue({
        id: "conflict-1",
        isResolved: true,
        resolvedBy: "user-1",
      });

      const result = await resolveConflict("conflict-1", CTX);
      expect(result.isResolved).toBe(true);
    });

    it("throws when already resolved", async () => {
      const { resolveConflict } = await import("../seating.server");

      mockConflictFindFirst.mockResolvedValue({
        id: "conflict-1",
        tenantId: "tenant-1",
        isResolved: true,
      });

      await expect(resolveConflict("conflict-1", CTX)).rejects.toThrow("already resolved");
    });
  });

  describe("validateSeating", () => {
    it("returns valid when no issues", async () => {
      const { validateSeating } = await import("../seating.server");

      mockPlanFindFirst.mockResolvedValue({
        id: "plan-1",
        eventId: "event-1",
        tenantId: "tenant-1",
        totalSeats: 10,
        assignedSeats: 2,
        assignments: [
          {
            seatLabel: "A1",
            priority: "HEAD_OF_STATE",
            participantId: "p-1",
            participant: { id: "p-1", firstName: "John", lastName: "Alpha" },
          },
          {
            seatLabel: "A2",
            priority: "MINISTER",
            participantId: "p-2",
            participant: { id: "p-2", firstName: "Jane", lastName: "Beta" },
          },
        ],
      });
      mockConflictFindMany.mockResolvedValue([]);

      const result = await validateSeating("plan-1", "tenant-1");
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it("detects conflict adjacency", async () => {
      const { validateSeating } = await import("../seating.server");

      mockPlanFindFirst.mockResolvedValue({
        id: "plan-1",
        eventId: "event-1",
        tenantId: "tenant-1",
        totalSeats: 10,
        assignedSeats: 2,
        assignments: [
          {
            seatLabel: "A1",
            priority: "DELEGATE",
            participantId: "p-1",
            participant: { id: "p-1", firstName: "John", lastName: "Alpha" },
          },
          {
            seatLabel: "A2",
            priority: "DELEGATE",
            participantId: "p-2",
            participant: { id: "p-2", firstName: "Jane", lastName: "Beta" },
          },
        ],
      });
      mockConflictFindMany.mockResolvedValue([
        { participantAId: "p-1", participantBId: "p-2", conflictType: "Diplomatic" },
      ]);

      const result = await validateSeating("plan-1", "tenant-1");
      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe("conflict_adjacency");
    });
  });

  describe("getSeatingStats", () => {
    it("returns correct stats", async () => {
      const { getSeatingStats } = await import("../seating.server");

      mockPlanFindMany.mockResolvedValue([
        { totalSeats: 100, assignedSeats: 80, isFinalized: true },
        { totalSeats: 50, assignedSeats: 20, isFinalized: false },
      ]);
      mockAssignmentCount.mockResolvedValue(100);
      mockConflictCount.mockResolvedValue(3);

      const result = await getSeatingStats("event-1", "tenant-1");
      expect(result.plans).toBe(2);
      expect(result.totalSeats).toBe(150);
      expect(result.totalAssignments).toBe(100);
      expect(result.fillRate).toBe(67); // 100/150
      expect(result.finalized).toBe(1);
      expect(result.unresolvedConflicts).toBe(3);
    });
  });
});
