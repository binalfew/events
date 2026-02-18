import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockIncidentCreate = vi.fn();
const mockIncidentFindFirst = vi.fn();
const mockIncidentFindMany = vi.fn();
const mockIncidentUpdate = vi.fn();
const mockUpdateCreate = vi.fn();
const mockEscalationCreate = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    incident: {
      create: (...args: unknown[]) => mockIncidentCreate(...args),
      findFirst: (...args: unknown[]) => mockIncidentFindFirst(...args),
      findMany: (...args: unknown[]) => mockIncidentFindMany(...args),
      update: (...args: unknown[]) => mockIncidentUpdate(...args),
    },
    incidentUpdate: {
      create: (...args: unknown[]) => mockUpdateCreate(...args),
    },
    incidentEscalation: {
      create: (...args: unknown[]) => mockEscalationCreate(...args),
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

describe("incidents.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
    mockUpdateCreate.mockResolvedValue({});
  });

  describe("reportIncident", () => {
    it("creates incident and audit log", async () => {
      const { reportIncident } = await import("../incidents.server");

      mockIncidentCreate.mockImplementation(async ({ data }: any) => ({
        id: "inc-1",
        ...data,
        reportedByUser: { id: "user-1", name: "John Doe" },
      }));

      const result = await reportIncident(
        {
          eventId: "event-1",
          title: "Medical Emergency",
          description: "Participant fainted in Hall A",
          severity: "HIGH",
          category: "Medical",
          location: "Hall A",
        },
        CTX,
      );

      expect(result.id).toBe("inc-1");
      expect(result.title).toBe("Medical Emergency");
      expect(result.severity).toBe("HIGH");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("assignIncident", () => {
    it("assigns and transitions REPORTED to INVESTIGATING", async () => {
      const { assignIncident } = await import("../incidents.server");

      mockIncidentFindFirst.mockResolvedValue({
        id: "inc-1",
        tenantId: "tenant-1",
        status: "REPORTED",
      });
      mockIncidentUpdate.mockImplementation(async ({ data }: any) => ({
        id: "inc-1",
        ...data,
      }));

      const result = await assignIncident("inc-1", "responder-1", CTX);
      expect(result.status).toBe("INVESTIGATING");
      expect(result.assignedTo).toBe("responder-1");
    });

    it("throws when assigning a closed incident", async () => {
      const { assignIncident } = await import("../incidents.server");

      mockIncidentFindFirst.mockResolvedValue({
        id: "inc-1",
        tenantId: "tenant-1",
        status: "CLOSED",
      });

      await expect(assignIncident("inc-1", "responder-1", CTX)).rejects.toThrow(
        "Cannot assign a closed incident",
      );
    });
  });

  describe("addUpdate", () => {
    it("adds update to incident timeline", async () => {
      const { addUpdate } = await import("../incidents.server");

      mockIncidentFindFirst.mockResolvedValue({
        id: "inc-1",
        tenantId: "tenant-1",
        status: "INVESTIGATING",
        title: "Test Incident",
      });
      mockUpdateCreate.mockImplementation(async ({ data }: any) => ({
        id: "upd-1",
        ...data,
        updatedByUser: { id: "user-1", name: "John Doe" },
      }));

      const result = await addUpdate(
        { incidentId: "inc-1", message: "First responder on site" },
        CTX,
      );
      expect(result.id).toBe("upd-1");
      expect(result.message).toBe("First responder on site");
    });

    it("throws when adding update to closed incident", async () => {
      const { addUpdate } = await import("../incidents.server");

      mockIncidentFindFirst.mockResolvedValue({
        id: "inc-1",
        tenantId: "tenant-1",
        status: "CLOSED",
      });

      await expect(addUpdate({ incidentId: "inc-1", message: "test" }, CTX)).rejects.toThrow(
        "Cannot add updates to a closed incident",
      );
    });
  });

  describe("escalateIncident", () => {
    it("escalates and updates incident status", async () => {
      const { escalateIncident } = await import("../incidents.server");

      mockIncidentFindFirst.mockResolvedValue({
        id: "inc-1",
        tenantId: "tenant-1",
        status: "INVESTIGATING",
      });
      mockEscalationCreate.mockImplementation(async ({ data }: any) => ({
        id: "esc-1",
        ...data,
        escalatedToUser: { id: "manager-1", name: "Jane Smith" },
      }));
      mockIncidentUpdate.mockResolvedValue({});

      const result = await escalateIncident(
        {
          incidentId: "inc-1",
          escalatedTo: "manager-1",
          reason: "Unresolved after 30 minutes",
        },
        CTX,
      );

      expect(result.id).toBe("esc-1");
      expect(result.reason).toBe("Unresolved after 30 minutes");
    });

    it("throws when escalating resolved incident", async () => {
      const { escalateIncident } = await import("../incidents.server");

      mockIncidentFindFirst.mockResolvedValue({
        id: "inc-1",
        tenantId: "tenant-1",
        status: "RESOLVED",
      });

      await expect(
        escalateIncident({ incidentId: "inc-1", escalatedTo: "m-1", reason: "test" }, CTX),
      ).rejects.toThrow("Cannot escalate a resolved or closed incident");
    });
  });

  describe("resolveIncident", () => {
    it("marks incident as resolved with timestamp", async () => {
      const { resolveIncident } = await import("../incidents.server");

      mockIncidentFindFirst.mockResolvedValue({
        id: "inc-1",
        tenantId: "tenant-1",
        status: "INVESTIGATING",
      });
      mockIncidentUpdate.mockImplementation(async ({ data }: any) => ({
        id: "inc-1",
        ...data,
      }));

      const result = await resolveIncident("inc-1", "Participant treated and released", CTX);
      expect(result.status).toBe("RESOLVED");
      expect(result.resolvedBy).toBe("user-1");
      expect(result.resolvedAt).toBeInstanceOf(Date);
    });

    it("throws when resolving already resolved incident", async () => {
      const { resolveIncident } = await import("../incidents.server");

      mockIncidentFindFirst.mockResolvedValue({
        id: "inc-1",
        tenantId: "tenant-1",
        status: "RESOLVED",
      });

      await expect(resolveIncident("inc-1", "duplicate", CTX)).rejects.toThrow(
        "Incident is already resolved",
      );
    });
  });

  describe("closeIncident", () => {
    it("closes a resolved incident", async () => {
      const { closeIncident } = await import("../incidents.server");

      mockIncidentFindFirst.mockResolvedValue({
        id: "inc-1",
        tenantId: "tenant-1",
        status: "RESOLVED",
      });
      mockIncidentUpdate.mockImplementation(async ({ data }: any) => ({
        id: "inc-1",
        ...data,
      }));

      const result = await closeIncident("inc-1", CTX);
      expect(result.status).toBe("CLOSED");
    });

    it("throws when closing non-resolved incident", async () => {
      const { closeIncident } = await import("../incidents.server");

      mockIncidentFindFirst.mockResolvedValue({
        id: "inc-1",
        tenantId: "tenant-1",
        status: "INVESTIGATING",
      });

      await expect(closeIncident("inc-1", CTX)).rejects.toThrow(
        "Can only close a resolved incident",
      );
    });
  });

  describe("reopenIncident", () => {
    it("reopens a closed incident", async () => {
      const { reopenIncident } = await import("../incidents.server");

      mockIncidentFindFirst.mockResolvedValue({
        id: "inc-1",
        tenantId: "tenant-1",
        status: "CLOSED",
      });
      mockIncidentUpdate.mockImplementation(async ({ data }: any) => ({
        id: "inc-1",
        ...data,
      }));

      const result = await reopenIncident("inc-1", "Issue recurred", CTX);
      expect(result.status).toBe("INVESTIGATING");
      expect(result.resolvedAt).toBeNull();
    });

    it("throws when reopening an open incident", async () => {
      const { reopenIncident } = await import("../incidents.server");

      mockIncidentFindFirst.mockResolvedValue({
        id: "inc-1",
        tenantId: "tenant-1",
        status: "INVESTIGATING",
      });

      await expect(reopenIncident("inc-1", "test", CTX)).rejects.toThrow(
        "Can only reopen a resolved or closed incident",
      );
    });
  });

  describe("getIncidentStats", () => {
    it("returns correct counts and avg resolution time", async () => {
      const { getIncidentStats } = await import("../incidents.server");

      const now = new Date();
      const thirtyMinsAgo = new Date(now.getTime() - 30 * 60000);

      mockIncidentFindMany.mockResolvedValue([
        { severity: "CRITICAL", status: "REPORTED", createdAt: now, resolvedAt: null },
        { severity: "HIGH", status: "INVESTIGATING", createdAt: now, resolvedAt: null },
        {
          severity: "MEDIUM",
          status: "RESOLVED",
          createdAt: thirtyMinsAgo,
          resolvedAt: now,
        },
        { severity: "LOW", status: "CLOSED", createdAt: thirtyMinsAgo, resolvedAt: now },
      ]);

      const result = await getIncidentStats("event-1", "tenant-1");
      expect(result.total).toBe(4);
      expect(result.open).toBe(2);
      expect(result.reported).toBe(1);
      expect(result.investigating).toBe(1);
      expect(result.resolved).toBe(1);
      expect(result.closed).toBe(1);
      expect(result.avgResolutionMinutes).toBe(30);
      expect(result.bySeverity["CRITICAL"]).toBe(1);
    });
  });

  describe("checkOverdueIncidents", () => {
    it("finds incidents exceeding SLA thresholds", async () => {
      const { checkOverdueIncidents } = await import("../incidents.server");

      const twoHoursAgo = new Date(Date.now() - 120 * 60000);
      const fiveMinsAgo = new Date(Date.now() - 5 * 60000);

      mockIncidentFindMany.mockResolvedValue([
        {
          id: "inc-1",
          severity: "CRITICAL",
          status: "REPORTED",
          createdAt: twoHoursAgo,
          reportedByUser: { id: "u-1", name: "A B" },
          assignedToUser: null,
        },
        {
          id: "inc-2",
          severity: "LOW",
          status: "INVESTIGATING",
          createdAt: fiveMinsAgo,
          reportedByUser: { id: "u-2", name: "C D" },
          assignedToUser: null,
        },
      ]);

      const result = await checkOverdueIncidents("event-1", "tenant-1");
      // CRITICAL with 2h elapsed > 15min SLA = overdue
      // LOW with 5min elapsed < 24h SLA = not overdue
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("inc-1");
    });
  });
});
