import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockSnapshotCreate = vi.fn();
const mockSnapshotFindMany = vi.fn();
const mockSnapshotDeleteMany = vi.fn();
const mockEventCount = vi.fn();
const mockParticipantCount = vi.fn();
const mockWorkflowCount = vi.fn();
const mockParticipantGroupBy = vi.fn();
const mockEventFindMany = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    analyticsSnapshot: {
      create: (...args: unknown[]) => mockSnapshotCreate(...args),
      findMany: (...args: unknown[]) => mockSnapshotFindMany(...args),
      deleteMany: (...args: unknown[]) => mockSnapshotDeleteMany(...args),
    },
    event: {
      count: (...args: unknown[]) => mockEventCount(...args),
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
    },
    participant: {
      count: (...args: unknown[]) => mockParticipantCount(...args),
      groupBy: (...args: unknown[]) => mockParticipantGroupBy(...args),
    },
    workflow: {
      count: (...args: unknown[]) => mockWorkflowCount(...args),
    },
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ─── Tests ───────────────────────────────────────────────

describe("analytics.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("recordSnapshot", () => {
    it("creates a snapshot", async () => {
      const { recordSnapshot } = await import("../analytics.server");
      const now = new Date();
      mockSnapshotCreate.mockResolvedValue({
        id: "snap-1",
        metric: "registrations",
        value: 42,
      });

      const result = await recordSnapshot({
        tenantId: "t-1",
        metric: "registrations",
        value: 42,
        period: "daily",
        timestamp: now,
      });

      expect(result.id).toBe("snap-1");
      expect(mockSnapshotCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: "t-1",
          metric: "registrations",
          value: 42,
          period: "daily",
          timestamp: now,
        }),
      });
    });

    it("creates a snapshot with event and dimensions", async () => {
      const { recordSnapshot } = await import("../analytics.server");
      mockSnapshotCreate.mockResolvedValue({ id: "snap-2" });

      await recordSnapshot({
        tenantId: "t-1",
        eventId: "e-1",
        metric: "throughput",
        value: 100,
        dimensions: { stepId: "step-1" },
        period: "hourly",
        timestamp: new Date(),
      });

      expect(mockSnapshotCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: "e-1",
          dimensions: { stepId: "step-1" },
        }),
      });
    });
  });

  describe("querySnapshots", () => {
    it("queries by metric and tenant", async () => {
      const { querySnapshots } = await import("../analytics.server");
      mockSnapshotFindMany.mockResolvedValue([
        { id: "snap-1", value: 10 },
        { id: "snap-2", value: 20 },
      ]);

      const result = await querySnapshots({
        tenantId: "t-1",
        metric: "registrations",
      });

      expect(result).toHaveLength(2);
      expect(mockSnapshotFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "t-1", metric: "registrations" },
          orderBy: { timestamp: "asc" },
        }),
      );
    });

    it("filters by date range", async () => {
      const { querySnapshots } = await import("../analytics.server");
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");
      mockSnapshotFindMany.mockResolvedValue([]);

      await querySnapshots({
        tenantId: "t-1",
        metric: "registrations",
        from,
        to,
      });

      expect(mockSnapshotFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: { gte: from, lte: to },
          }),
        }),
      );
    });

    it("respects limit", async () => {
      const { querySnapshots } = await import("../analytics.server");
      mockSnapshotFindMany.mockResolvedValue([]);

      await querySnapshots({
        tenantId: "t-1",
        metric: "registrations",
        limit: 10,
      });

      expect(mockSnapshotFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
    });
  });

  describe("deleteSnapshots", () => {
    it("deletes all snapshots for a tenant", async () => {
      const { deleteSnapshots } = await import("../analytics.server");
      mockSnapshotDeleteMany.mockResolvedValue({ count: 5 });

      const count = await deleteSnapshots("t-1");

      expect(count).toBe(5);
      expect(mockSnapshotDeleteMany).toHaveBeenCalledWith({
        where: { tenantId: "t-1" },
      });
    });

    it("deletes snapshots for a specific metric", async () => {
      const { deleteSnapshots } = await import("../analytics.server");
      mockSnapshotDeleteMany.mockResolvedValue({ count: 3 });

      const count = await deleteSnapshots("t-1", "registrations");

      expect(count).toBe(3);
      expect(mockSnapshotDeleteMany).toHaveBeenCalledWith({
        where: { tenantId: "t-1", metric: "registrations" },
      });
    });
  });

  describe("getDashboardMetrics", () => {
    it("returns aggregated metrics", async () => {
      const { getDashboardMetrics } = await import("../analytics.server");

      mockEventCount.mockResolvedValue(3);
      mockParticipantCount
        .mockResolvedValueOnce(150) // total
        .mockResolvedValueOnce(25); // pending
      mockWorkflowCount.mockResolvedValue(5);
      mockParticipantGroupBy
        .mockResolvedValueOnce([
          // by status
          { status: "APPROVED", _count: 100 },
          { status: "PENDING", _count: 25 },
          { status: "REJECTED", _count: 25 },
        ])
        .mockResolvedValueOnce([
          // by event
          { eventId: "e-1", _count: 80 },
          { eventId: "e-2", _count: 70 },
        ]);
      mockEventFindMany.mockResolvedValue([
        { id: "e-1", name: "Conference 2026" },
        { id: "e-2", name: "Summit 2026" },
      ]);
      mockSnapshotFindMany.mockResolvedValue([]);

      const result = await getDashboardMetrics("t-1");

      expect(result.totalEvents).toBe(3);
      expect(result.totalParticipants).toBe(150);
      expect(result.totalWorkflows).toBe(5);
      expect(result.pendingApprovals).toBe(25);
      expect(result.registrationsByStatus).toHaveLength(3);
      expect(result.participantsByEvent).toHaveLength(2);
      expect(result.participantsByEvent[0].eventName).toBe("Conference 2026");
    });
  });

  describe("metricsToCSV", () => {
    it("generates CSV from metrics", async () => {
      const { metricsToCSV } = await import("../analytics.server");

      const csv = metricsToCSV({
        totalEvents: 2,
        totalParticipants: 100,
        totalWorkflows: 3,
        pendingApprovals: 10,
        registrationsByStatus: [
          { status: "APPROVED", count: 80 },
          { status: "REJECTED", count: 20 },
        ],
        participantsByEvent: [
          { eventName: "Conf 2026", count: 60 },
          { eventName: "Summit", count: 40 },
        ],
        recentActivity: [{ date: "2026-02-15", registrations: 5, approvals: 3 }],
      });

      expect(csv).toContain("Total Events,2");
      expect(csv).toContain("Total Participants,100");
      expect(csv).toContain("APPROVED,80");
      expect(csv).toContain('"Conf 2026",60');
      expect(csv).toContain("2026-02-15,5,3");
    });
  });
});
