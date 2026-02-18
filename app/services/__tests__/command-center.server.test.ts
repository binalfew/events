import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockParticipantGroupBy = vi.fn();
const mockAccessLogFindMany = vi.fn();
const mockIncidentGroupBy = vi.fn();
const mockTransferGroupBy = vi.fn();
const mockQueueTicketFindMany = vi.fn();
const mockAccommodationGroupBy = vi.fn();
const mockWidgetCreate = vi.fn();
const mockWidgetFindMany = vi.fn();
const mockWidgetFindFirst = vi.fn();
const mockWidgetDelete = vi.fn();
const mockAlertRuleCreate = vi.fn();
const mockAlertRuleFindMany = vi.fn();
const mockAlertRuleFindFirst = vi.fn();
const mockAlertRuleUpdate = vi.fn();
const mockAlertRuleDelete = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    participant: {
      groupBy: (...args: unknown[]) => mockParticipantGroupBy(...args),
    },
    accessLog: {
      findMany: (...args: unknown[]) => mockAccessLogFindMany(...args),
    },
    incident: {
      groupBy: (...args: unknown[]) => mockIncidentGroupBy(...args),
    },
    transfer: {
      groupBy: (...args: unknown[]) => mockTransferGroupBy(...args),
    },
    queueTicket: {
      findMany: (...args: unknown[]) => mockQueueTicketFindMany(...args),
    },
    accommodationAssignment: {
      groupBy: (...args: unknown[]) => mockAccommodationGroupBy(...args),
    },
    commandCenterWidget: {
      create: (...args: unknown[]) => mockWidgetCreate(...args),
      findMany: (...args: unknown[]) => mockWidgetFindMany(...args),
      findFirst: (...args: unknown[]) => mockWidgetFindFirst(...args),
      delete: (...args: unknown[]) => mockWidgetDelete(...args),
    },
    alertRule: {
      create: (...args: unknown[]) => mockAlertRuleCreate(...args),
      findMany: (...args: unknown[]) => mockAlertRuleFindMany(...args),
      findFirst: (...args: unknown[]) => mockAlertRuleFindFirst(...args),
      update: (...args: unknown[]) => mockAlertRuleUpdate(...args),
      delete: (...args: unknown[]) => mockAlertRuleDelete(...args),
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

function setupDashboardMocks() {
  mockParticipantGroupBy.mockResolvedValue([
    { status: "APPROVED", _count: 50 },
    { status: "PENDING", _count: 10 },
  ]);
  mockAccessLogFindMany.mockResolvedValue([
    { scanResult: "GRANTED" },
    { scanResult: "GRANTED" },
    { scanResult: "DENIED" },
  ]);
  mockIncidentGroupBy.mockResolvedValue([
    { severity: "CRITICAL", status: "REPORTED", _count: 2 },
    { severity: "HIGH", status: "INVESTIGATING", _count: 3 },
    { severity: "LOW", status: "RESOLVED", _count: 5 },
  ]);
  mockTransferGroupBy.mockResolvedValue([
    { status: "SCHEDULED", _count: 8 },
    { status: "EN_ROUTE", _count: 3 },
    { status: "COMPLETED", _count: 12 },
  ]);
  mockQueueTicketFindMany.mockResolvedValue([
    { joinedAt: new Date(Date.now() - 10 * 60000) },
    { joinedAt: new Date(Date.now() - 20 * 60000) },
  ]);
  mockAccommodationGroupBy.mockResolvedValue([
    { status: "CHECKED_IN", _count: 30 },
    { status: "CONFIRMED", _count: 15 },
    { status: "PENDING", _count: 5 },
  ]);
}

// ─── Tests ───────────────────────────────────────────────

describe("command-center.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("getCommandCenterData", () => {
    it("aggregates data from all operational modules", async () => {
      const { getCommandCenterData } = await import("../command-center.server");
      setupDashboardMocks();

      const result = await getCommandCenterData("event-1", "tenant-1");

      expect(result.registration.approved).toBe(50);
      expect(result.registration.pending).toBe(10);
      expect(result.checkIn.scannedToday).toBe(2);
      expect(result.checkIn.deniedToday).toBe(1);
      expect(result.incidents.totalOpen).toBe(5);
      expect(result.incidents.openBySeverity["CRITICAL"]).toBe(2);
      expect(result.transport.scheduled).toBe(8);
      expect(result.transport.enRoute).toBe(3);
      expect(result.queue.waiting).toBe(2);
      expect(result.queue.avgWaitMinutes).toBeGreaterThan(0);
      expect(result.accommodation.checkedIn).toBe(30);
    });
  });

  describe("createWidget", () => {
    it("creates widget and audit log", async () => {
      const { createWidget } = await import("../command-center.server");

      mockWidgetCreate.mockImplementation(async ({ data }: any) => ({
        id: "widget-1",
        ...data,
      }));

      const result = await createWidget(
        {
          eventId: "event-1",
          widgetType: "STAT_CARD",
          title: "Registration Stats",
          config: "{}",
          gridX: 0,
          gridY: 0,
          gridW: 3,
          gridH: 2,
          refreshRate: 5,
        },
        CTX,
      );

      expect(result.id).toBe("widget-1");
      expect(result.title).toBe("Registration Stats");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("deleteWidget", () => {
    it("deletes existing widget", async () => {
      const { deleteWidget } = await import("../command-center.server");

      mockWidgetFindFirst.mockResolvedValue({
        id: "widget-1",
        tenantId: "tenant-1",
        title: "Test Widget",
      });
      mockWidgetDelete.mockResolvedValue({});

      const result = await deleteWidget("widget-1", CTX);
      expect(result.success).toBe(true);
    });

    it("throws when widget not found", async () => {
      const { deleteWidget } = await import("../command-center.server");
      mockWidgetFindFirst.mockResolvedValue(null);

      await expect(deleteWidget("missing", CTX)).rejects.toThrow("Widget not found");
    });
  });

  describe("createAlertRule", () => {
    it("creates alert rule and audit log", async () => {
      const { createAlertRule } = await import("../command-center.server");

      mockAlertRuleCreate.mockImplementation(async ({ data }: any) => ({
        id: "rule-1",
        ...data,
      }));

      const result = await createAlertRule(
        {
          eventId: "event-1",
          name: "High Incident Count",
          metric: "open_incidents",
          condition: "gt",
          threshold: 10,
          severity: "HIGH",
          cooldownMinutes: 15,
        },
        CTX,
      );

      expect(result.id).toBe("rule-1");
      expect(result.name).toBe("High Incident Count");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("toggleAlertRule", () => {
    it("toggles active state", async () => {
      const { toggleAlertRule } = await import("../command-center.server");

      mockAlertRuleFindFirst.mockResolvedValue({
        id: "rule-1",
        tenantId: "tenant-1",
        isActive: true,
      });
      mockAlertRuleUpdate.mockImplementation(async ({ data }: any) => ({
        id: "rule-1",
        ...data,
      }));

      const result = await toggleAlertRule("rule-1", CTX);
      expect(result.isActive).toBe(false);
    });

    it("throws when rule not found", async () => {
      const { toggleAlertRule } = await import("../command-center.server");
      mockAlertRuleFindFirst.mockResolvedValue(null);

      await expect(toggleAlertRule("missing", CTX)).rejects.toThrow("Alert rule not found");
    });
  });

  describe("evaluateAlerts", () => {
    it("triggers alerts that exceed thresholds", async () => {
      const { evaluateAlerts } = await import("../command-center.server");

      setupDashboardMocks();
      mockAlertRuleFindMany.mockResolvedValue([
        {
          id: "rule-1",
          name: "Too Many Open Incidents",
          metric: "open_incidents",
          condition: "gt",
          threshold: 3,
          severity: "HIGH",
          cooldownMinutes: 15,
          lastTriggered: null,
          isActive: true,
        },
        {
          id: "rule-2",
          name: "Low Check-in",
          metric: "checkin_rate",
          condition: "lt",
          threshold: 1,
          severity: "LOW",
          cooldownMinutes: 30,
          lastTriggered: null,
          isActive: true,
        },
      ]);
      mockAlertRuleUpdate.mockResolvedValue({});

      const result = await evaluateAlerts("event-1", "tenant-1");

      // open_incidents = 5 > 3 → triggered
      // checkin_rate = 2, not < 1 → not triggered
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Too Many Open Incidents");
      expect(result[0].value).toBe(5);
    });

    it("respects cooldown period", async () => {
      const { evaluateAlerts } = await import("../command-center.server");

      setupDashboardMocks();
      mockAlertRuleFindMany.mockResolvedValue([
        {
          id: "rule-1",
          name: "Test Rule",
          metric: "open_incidents",
          condition: "gt",
          threshold: 1,
          severity: "LOW",
          cooldownMinutes: 60,
          lastTriggered: new Date(), // Just triggered
          isActive: true,
        },
      ]);

      const result = await evaluateAlerts("event-1", "tenant-1");
      expect(result).toHaveLength(0);
    });
  });

  describe("getRecentAlerts", () => {
    it("returns recently triggered rules", async () => {
      const { getRecentAlerts } = await import("../command-center.server");

      const triggered = new Date();
      mockAlertRuleFindMany.mockResolvedValue([
        {
          id: "rule-1",
          name: "Test Alert",
          metric: "open_incidents",
          condition: "gt",
          threshold: 5,
          severity: "HIGH",
          lastTriggered: triggered,
        },
      ]);

      const result = await getRecentAlerts("event-1", "tenant-1");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Test Alert");
      expect(result[0].lastTriggered).toEqual(triggered);
    });
  });
});
