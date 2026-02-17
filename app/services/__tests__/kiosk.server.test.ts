import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockKioskDeviceCreate = vi.fn();
const mockKioskDeviceFindMany = vi.fn();
const mockKioskDeviceFindUnique = vi.fn();
const mockKioskDeviceFindFirst = vi.fn();
const mockKioskDeviceUpdate = vi.fn();
const mockKioskDeviceUpdateMany = vi.fn();
const mockKioskDeviceDelete = vi.fn();
const mockKioskSessionCreate = vi.fn();
const mockKioskSessionUpdate = vi.fn();
const mockKioskSessionFindFirst = vi.fn();
const mockKioskSessionFindMany = vi.fn();
const mockQueueTicketCreate = vi.fn();
const mockQueueTicketCount = vi.fn();
const mockQueueTicketFindFirst = vi.fn();
const mockQueueTicketFindMany = vi.fn();
const mockQueueTicketUpdate = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    kioskDevice: {
      create: (...args: unknown[]) => mockKioskDeviceCreate(...args),
      findMany: (...args: unknown[]) => mockKioskDeviceFindMany(...args),
      findUnique: (...args: unknown[]) => mockKioskDeviceFindUnique(...args),
      findFirst: (...args: unknown[]) => mockKioskDeviceFindFirst(...args),
      update: (...args: unknown[]) => mockKioskDeviceUpdate(...args),
      updateMany: (...args: unknown[]) => mockKioskDeviceUpdateMany(...args),
      delete: (...args: unknown[]) => mockKioskDeviceDelete(...args),
    },
    kioskSession: {
      create: (...args: unknown[]) => mockKioskSessionCreate(...args),
      update: (...args: unknown[]) => mockKioskSessionUpdate(...args),
      findFirst: (...args: unknown[]) => mockKioskSessionFindFirst(...args),
      findMany: (...args: unknown[]) => mockKioskSessionFindMany(...args),
    },
    queueTicket: {
      create: (...args: unknown[]) => mockQueueTicketCreate(...args),
      count: (...args: unknown[]) => mockQueueTicketCount(...args),
      findFirst: (...args: unknown[]) => mockQueueTicketFindFirst(...args),
      findMany: (...args: unknown[]) => mockQueueTicketFindMany(...args),
      update: (...args: unknown[]) => mockQueueTicketUpdate(...args),
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

describe("kiosk-devices.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("registerDevice", () => {
    it("creates a device with correct data and audit log", async () => {
      const { registerDevice } = await import("../kiosk-devices.server");
      mockKioskDeviceCreate.mockImplementation(async ({ data }) => ({
        id: "device-1",
        ...data,
      }));

      const result = await registerDevice(
        {
          eventId: "event-1",
          name: "Lobby Kiosk",
          location: "Main Lobby",
          mode: "self-service" as const,
          language: "en" as const,
        },
        CTX,
      );

      expect(result.name).toBe("Lobby Kiosk");
      expect(result.tenantId).toBe("tenant-1");
      expect(mockKioskDeviceCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: "tenant-1",
            eventId: "event-1",
            name: "Lobby Kiosk",
            mode: "self-service",
          }),
        }),
      );
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("listDevices", () => {
    it("returns devices for the given event and tenant", async () => {
      const { listDevices } = await import("../kiosk-devices.server");
      const devices = [{ id: "d1" }, { id: "d2" }];
      mockKioskDeviceFindMany.mockResolvedValue(devices);

      const result = await listDevices("event-1", "tenant-1");

      expect(result).toHaveLength(2);
      expect(mockKioskDeviceFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: "event-1", tenantId: "tenant-1" },
        }),
      );
    });
  });

  describe("getDevice", () => {
    it("returns device with event info", async () => {
      const { getDevice } = await import("../kiosk-devices.server");
      mockKioskDeviceFindUnique.mockResolvedValue({
        id: "device-1",
        name: "Kiosk",
        event: { id: "event-1", name: "Test Event", tenantId: "t-1" },
      });

      const result = await getDevice("device-1");

      expect(result.id).toBe("device-1");
      expect(result.event.name).toBe("Test Event");
    });

    it("throws 404 for unknown device", async () => {
      const { getDevice, KioskDeviceError } = await import("../kiosk-devices.server");
      mockKioskDeviceFindUnique.mockResolvedValue(null);

      await expect(getDevice("missing")).rejects.toThrow(KioskDeviceError);
    });
  });

  describe("decommissionDevice", () => {
    it("deletes device and creates audit log", async () => {
      const { decommissionDevice } = await import("../kiosk-devices.server");
      mockKioskDeviceFindFirst.mockResolvedValue({
        id: "device-1",
        name: "Old Kiosk",
        tenantId: "tenant-1",
      });
      mockKioskDeviceDelete.mockResolvedValue({});

      await decommissionDevice("device-1", CTX);

      expect(mockKioskDeviceDelete).toHaveBeenCalledWith({ where: { id: "device-1" } });
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "DELETE",
            description: expect.stringContaining("Decommissioned"),
          }),
        }),
      );
    });
  });

  describe("recordHeartbeat", () => {
    it("updates device heartbeat and sets online", async () => {
      const { recordHeartbeat } = await import("../kiosk-devices.server");
      mockKioskDeviceUpdate.mockResolvedValue({});

      await recordHeartbeat("device-1");

      expect(mockKioskDeviceUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "device-1" },
          data: expect.objectContaining({ isOnline: true }),
        }),
      );
    });
  });

  describe("markStaleDevicesOffline", () => {
    it("marks devices with old heartbeat as offline", async () => {
      const { markStaleDevicesOffline } = await import("../kiosk-devices.server");
      mockKioskDeviceUpdateMany.mockResolvedValue({ count: 3 });

      const count = await markStaleDevicesOffline();

      expect(count).toBe(3);
      expect(mockKioskDeviceUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isOnline: true,
          }),
          data: { isOnline: false },
        }),
      );
    });
  });
});

describe("kiosk-sessions.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("startSession / endSession", () => {
    it("creates and ends a session", async () => {
      const { startSession, endSession } = await import("../kiosk-sessions.server");
      mockKioskSessionCreate.mockImplementation(async ({ data }) => ({
        id: "session-1",
        ...data,
      }));

      const session = await startSession("device-1", "self-service", "en");
      expect(session.kioskDeviceId).toBe("device-1");
      expect(session.sessionType).toBe("self-service");

      mockKioskSessionUpdate.mockResolvedValue({
        id: "session-1",
        endedAt: new Date(),
        timedOut: true,
      });

      const ended = await endSession("session-1", true);
      expect(ended.timedOut).toBe(true);
      expect(ended.endedAt).toBeTruthy();
    });
  });

  describe("getDeviceStats", () => {
    it("calculates session statistics", async () => {
      const { getDeviceStats } = await import("../kiosk-sessions.server");
      const now = Date.now();
      mockKioskSessionFindMany.mockResolvedValue([
        {
          sessionType: "self-service",
          startedAt: new Date(now - 120_000),
          endedAt: new Date(now - 60_000),
          timedOut: false,
        },
        {
          sessionType: "self-service",
          startedAt: new Date(now - 60_000),
          endedAt: new Date(now),
          timedOut: true,
        },
        {
          sessionType: "queue-lookup",
          startedAt: new Date(now - 30_000),
          endedAt: new Date(now),
          timedOut: false,
        },
      ]);

      const stats = await getDeviceStats("device-1");

      expect(stats.totalSessions).toBe(3);
      expect(stats.timedOutCount).toBe(1);
      expect(stats.sessionsByType["self-service"]).toBe(2);
      expect(stats.sessionsByType["queue-lookup"]).toBe(1);
      expect(stats.avgDurationSeconds).toBeGreaterThan(0);
    });
  });
});

describe("queue-tickets.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("joinQueue", () => {
    it("assigns sequential ticket number", async () => {
      const { joinQueue } = await import("../queue-tickets.server");
      mockQueueTicketCount
        .mockResolvedValueOnce(0) // for ticket numbering
        .mockResolvedValueOnce(0); // for estimateWaitTime
      mockQueueTicketFindMany.mockResolvedValue([]); // for estimateWaitTime avg
      mockQueueTicketCreate.mockImplementation(async ({ data }) => ({
        id: "ticket-1",
        ...data,
      }));

      const ticket = await joinQueue(
        {
          eventId: "event-1",
          participantId: "p-1",
          serviceType: "badge-pickup",
          priority: 0,
        },
        { tenantId: "tenant-1" },
      );

      expect(ticket.ticketNumber).toBe("A001");
      expect(ticket.status).toBe("WAITING");
    });

    it("increments ticket number based on existing tickets", async () => {
      const { joinQueue } = await import("../queue-tickets.server");
      mockQueueTicketCount
        .mockResolvedValueOnce(5) // 5 tickets already today
        .mockResolvedValueOnce(0); // for estimateWaitTime
      mockQueueTicketFindMany.mockResolvedValue([]);
      mockQueueTicketCreate.mockImplementation(async ({ data }) => ({
        id: "ticket-6",
        ...data,
      }));

      const ticket = await joinQueue(
        {
          eventId: "event-1",
          participantId: "p-2",
          serviceType: "information",
          priority: 0,
        },
        { tenantId: "tenant-1" },
      );

      expect(ticket.ticketNumber).toBe("A006");
    });
  });

  describe("callNextTicket", () => {
    it("calls the highest-priority waiting ticket", async () => {
      const { callNextTicket } = await import("../queue-tickets.server");
      const waitingTicket = {
        id: "ticket-3",
        ticketNumber: "A003",
        status: "WAITING",
        priority: 1,
        participant: { id: "p-1", firstName: "John", lastName: "Doe", registrationCode: "RC001" },
      };

      mockQueueTicketFindFirst.mockResolvedValue(waitingTicket);
      mockQueueTicketUpdate.mockImplementation(async ({ data }) => ({
        ...waitingTicket,
        ...data,
        status: "CALLED",
      }));

      const ticket = await callNextTicket("event-1", 2, { tenantId: "tenant-1" });

      expect(ticket).toBeTruthy();
      expect(mockQueueTicketUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "CALLED",
            counterNumber: 2,
          }),
        }),
      );
    });

    it("returns null when queue is empty", async () => {
      const { callNextTicket } = await import("../queue-tickets.server");
      mockQueueTicketFindFirst.mockResolvedValue(null);

      const result = await callNextTicket("event-1", 1, { tenantId: "tenant-1" });
      expect(result).toBeNull();
    });
  });

  describe("completeService / cancelTicket", () => {
    it("completes a ticket", async () => {
      const { completeService } = await import("../queue-tickets.server");
      mockQueueTicketFindFirst.mockResolvedValue({ id: "ticket-1", tenantId: "tenant-1" });
      mockQueueTicketUpdate.mockResolvedValue({
        id: "ticket-1",
        status: "COMPLETED",
        completedAt: new Date(),
      });

      const result = await completeService("ticket-1", { tenantId: "tenant-1" });
      expect(result.status).toBe("COMPLETED");
    });

    it("cancels a ticket", async () => {
      const { cancelTicket } = await import("../queue-tickets.server");
      mockQueueTicketFindFirst.mockResolvedValue({ id: "ticket-2", tenantId: "tenant-1" });
      mockQueueTicketUpdate.mockResolvedValue({
        id: "ticket-2",
        status: "CANCELLED",
        completedAt: new Date(),
      });

      const result = await cancelTicket("ticket-2", { tenantId: "tenant-1" });
      expect(result.status).toBe("CANCELLED");
    });
  });

  describe("getQueueStatus", () => {
    it("returns queue status with now serving and next up", async () => {
      const { getQueueStatus } = await import("../queue-tickets.server");
      mockQueueTicketFindMany
        .mockResolvedValueOnce([
          // nowServing
          {
            ticketNumber: "A001",
            counterNumber: 1,
            status: "SERVING",
            participant: { firstName: "Alice", lastName: "Smith" },
          },
        ])
        .mockResolvedValueOnce([
          // nextUp
          { ticketNumber: "A002", priority: 0 },
          { ticketNumber: "A003", priority: 0 },
        ])
        .mockResolvedValueOnce([]); // completedToday (for avg wait)
      mockQueueTicketCount.mockResolvedValue(5); // waitingCount

      const status = await getQueueStatus("event-1");

      expect(status.nowServing).toHaveLength(1);
      expect(status.nowServing[0].ticketNumber).toBe("A001");
      expect(status.nextUp).toHaveLength(2);
      expect(status.waitingCount).toBe(5);
      expect(status.averageWaitMinutes).toBe(0);
    });
  });
});
