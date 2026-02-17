import { describe, it, expect, vi } from "vitest";

vi.mock("~/lib/db.server", () => ({
  prisma: {
    event: { count: vi.fn() },
    participant: { count: vi.fn(), groupBy: vi.fn() },
    workflow: { count: vi.fn() },
    analyticsSnapshot: { findMany: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  },
}));

describe("Integration: Analytics Dashboard", () => {
  describe("Service exports", () => {
    it("should export dashboard metrics function", async () => {
      const mod = await import("~/services/analytics.server");
      expect(mod.getDashboardMetrics).toBeDefined();
    });

    it("should export snapshot CRUD functions", async () => {
      const mod = await import("~/services/analytics.server");
      expect(mod.recordSnapshot).toBeDefined();
      expect(mod.querySnapshots).toBeDefined();
      expect(mod.deleteSnapshots).toBeDefined();
    });

    it("should export CSV generation function", async () => {
      const mod = await import("~/services/analytics.server");
      expect(mod.metricsToCSV).toBeDefined();
    });
  });

  describe("CSV generation", () => {
    it("should generate valid CSV from metrics", async () => {
      const { metricsToCSV } = await import("~/services/analytics.server");
      const metrics = {
        totalEvents: 5,
        totalParticipants: 100,
        totalWorkflows: 3,
        pendingApprovals: 12,
        registrationsByStatus: [
          { status: "APPROVED", count: 60 },
          { status: "PENDING", count: 30 },
          { status: "REJECTED", count: 10 },
        ],
        participantsByEvent: [
          { eventName: "Summit", count: 50 },
          { eventName: "Workshop", count: 50 },
        ],
        recentActivity: [],
      };

      const csv = metricsToCSV(metrics);
      expect(csv).toContain("Total Events");
      expect(csv).toContain("5");
      expect(csv).toContain("APPROVED");
      expect(csv).toContain("60");
    });
  });

  describe("Empty data handling", () => {
    it("should handle zero counts gracefully", async () => {
      const { metricsToCSV } = await import("~/services/analytics.server");
      const emptyMetrics = {
        totalEvents: 0,
        totalParticipants: 0,
        totalWorkflows: 0,
        pendingApprovals: 0,
        registrationsByStatus: [],
        participantsByEvent: [],
        recentActivity: [],
      };

      const csv = metricsToCSV(emptyMetrics);
      expect(csv).toContain("0");
      expect(csv.length).toBeGreaterThan(0);
    });
  });

  describe("Recent activity format", () => {
    it("should include date, registrations, and approvals in CSV", async () => {
      const { metricsToCSV } = await import("~/services/analytics.server");
      const metrics = {
        totalEvents: 1,
        totalParticipants: 10,
        totalWorkflows: 1,
        pendingApprovals: 0,
        registrationsByStatus: [],
        participantsByEvent: [],
        recentActivity: [{ date: "2026-02-17", registrations: 5, approvals: 3 }],
      };

      const csv = metricsToCSV(metrics);
      expect(csv).toContain("Date,Registrations,Approvals");
      expect(csv).toContain("2026-02-17,5,3");
    });
  });
});
