import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockRouteCreate = vi.fn();
const mockRouteFindFirst = vi.fn();
const mockRouteFindMany = vi.fn();
const mockVehicleCreate = vi.fn();
const mockVehicleFindFirst = vi.fn();
const mockVehicleFindMany = vi.fn();
const mockTransferCreate = vi.fn();
const mockTransferFindFirst = vi.fn();
const mockTransferFindMany = vi.fn();
const mockTransferCount = vi.fn();
const mockTransferUpdate = vi.fn();
const mockPassengerFindMany = vi.fn();
const mockVehicleCount = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    transportRoute: {
      create: (...args: unknown[]) => mockRouteCreate(...args),
      findFirst: (...args: unknown[]) => mockRouteFindFirst(...args),
      findMany: (...args: unknown[]) => mockRouteFindMany(...args),
    },
    vehicle: {
      create: (...args: unknown[]) => mockVehicleCreate(...args),
      findFirst: (...args: unknown[]) => mockVehicleFindFirst(...args),
      findMany: (...args: unknown[]) => mockVehicleFindMany(...args),
      count: (...args: unknown[]) => mockVehicleCount(...args),
    },
    transfer: {
      create: (...args: unknown[]) => mockTransferCreate(...args),
      findFirst: (...args: unknown[]) => mockTransferFindFirst(...args),
      findMany: (...args: unknown[]) => mockTransferFindMany(...args),
      count: (...args: unknown[]) => mockTransferCount(...args),
      update: (...args: unknown[]) => mockTransferUpdate(...args),
    },
    transferPassenger: {
      findMany: (...args: unknown[]) => mockPassengerFindMany(...args),
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

describe("transportation.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createRoute", () => {
    it("creates route and audit log", async () => {
      const { createRoute } = await import("../transportation.server");

      mockRouteCreate.mockImplementation(async ({ data }: any) => ({
        id: "route-1",
        ...data,
      }));

      const result = await createRoute(
        { eventId: "event-1", name: "Airport Shuttle", stops: [] },
        CTX,
      );

      expect(result.id).toBe("route-1");
      expect(result.name).toBe("Airport Shuttle");
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "CREATE",
            entityType: "TransportRoute",
          }),
        }),
      );
    });
  });

  describe("listRoutes", () => {
    it("returns routes with transfer counts", async () => {
      const { listRoutes } = await import("../transportation.server");

      mockRouteFindMany.mockResolvedValue([
        { id: "route-1", name: "Airport Shuttle", _count: { transfers: 5 } },
      ]);

      const result = await listRoutes("event-1", "tenant-1");
      expect(result).toHaveLength(1);
      expect(result[0]._count.transfers).toBe(5);
    });
  });

  describe("registerVehicle", () => {
    it("creates vehicle and audit log", async () => {
      const { registerVehicle } = await import("../transportation.server");

      mockVehicleCreate.mockImplementation(async ({ data }: any) => ({
        id: "vehicle-1",
        ...data,
      }));

      const result = await registerVehicle(
        { eventId: "event-1", plateNumber: "ABC-123", type: "BUS", capacity: 40 },
        CTX,
      );

      expect(result.id).toBe("vehicle-1");
      expect(result.plateNumber).toBe("ABC-123");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("scheduleTransfer", () => {
    it("creates transfer with passengers", async () => {
      const { scheduleTransfer } = await import("../transportation.server");

      mockTransferCreate.mockImplementation(async ({ data }: any) => ({
        id: "transfer-1",
        ...data,
        passengers: [
          { id: "tp-1", participantId: "p-1", participant: { firstName: "John", lastName: "Doe" } },
        ],
      }));

      const result = await scheduleTransfer(
        {
          eventId: "event-1",
          type: "AIRPORT_ARRIVAL",
          origin: "Airport",
          destination: "Hotel",
          scheduledAt: "2026-03-01T10:00:00",
          participantIds: ["p-1"],
        },
        CTX,
      );

      expect(result.id).toBe("transfer-1");
      expect(mockTransferCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "AIRPORT_ARRIVAL",
            passengers: { create: [{ participantId: "p-1" }] },
          }),
        }),
      );
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("bulkScheduleTransfers", () => {
    it("creates transfer from route with multiple participants", async () => {
      const { bulkScheduleTransfers } = await import("../transportation.server");

      mockRouteFindFirst.mockResolvedValue({
        id: "route-1",
        tenantId: "tenant-1",
        name: "Airport Shuttle",
        stops: [
          { name: "Airport", order: 0 },
          { name: "Hotel", order: 1 },
        ],
      });
      mockTransferCreate.mockImplementation(async ({ data }: any) => ({
        id: "transfer-1",
        ...data,
        passengers: [],
      }));

      const result = await bulkScheduleTransfers("event-1", ["p-1", "p-2", "p-3"], "route-1", CTX);

      expect(result.id).toBe("transfer-1");
      expect(mockTransferCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            origin: "Airport",
            destination: "Hotel",
            passengers: {
              create: [
                { participantId: "p-1" },
                { participantId: "p-2" },
                { participantId: "p-3" },
              ],
            },
          }),
        }),
      );
    });

    it("throws 404 when route not found", async () => {
      const { bulkScheduleTransfers } = await import("../transportation.server");

      mockRouteFindFirst.mockResolvedValue(null);

      await expect(bulkScheduleTransfers("event-1", ["p-1"], "nonexistent", CTX)).rejects.toThrow(
        "Route not found",
      );
    });
  });

  describe("assignVehicle", () => {
    it("assigns vehicle to transfer", async () => {
      const { assignVehicle } = await import("../transportation.server");

      mockTransferFindFirst.mockResolvedValue({ id: "transfer-1", tenantId: "tenant-1" });
      mockVehicleFindFirst.mockResolvedValue({
        id: "vehicle-1",
        tenantId: "tenant-1",
        plateNumber: "ABC-123",
      });
      mockTransferUpdate.mockResolvedValue({
        id: "transfer-1",
        vehicleId: "vehicle-1",
        vehicle: { plateNumber: "ABC-123" },
      });

      const result = await assignVehicle("transfer-1", "vehicle-1", CTX);
      expect(result.vehicleId).toBe("vehicle-1");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws 404 when transfer not found", async () => {
      const { assignVehicle } = await import("../transportation.server");

      mockTransferFindFirst.mockResolvedValue(null);

      await expect(assignVehicle("bad-id", "vehicle-1", CTX)).rejects.toThrow("Transfer not found");
    });
  });

  describe("markEnRoute", () => {
    it("transitions SCHEDULED to EN_ROUTE", async () => {
      const { markEnRoute } = await import("../transportation.server");

      mockTransferFindFirst.mockResolvedValue({
        id: "transfer-1",
        tenantId: "tenant-1",
        status: "SCHEDULED",
      });
      mockTransferUpdate.mockResolvedValue({ id: "transfer-1", status: "EN_ROUTE" });

      const result = await markEnRoute("transfer-1", CTX);
      expect(result.status).toBe("EN_ROUTE");
    });

    it("throws on invalid status transition", async () => {
      const { markEnRoute } = await import("../transportation.server");

      mockTransferFindFirst.mockResolvedValue({
        id: "transfer-1",
        tenantId: "tenant-1",
        status: "COMPLETED",
      });

      await expect(markEnRoute("transfer-1", CTX)).rejects.toThrow(
        'Cannot mark as en route from status "COMPLETED"',
      );
    });
  });

  describe("markCompleted", () => {
    it("transitions EN_ROUTE to COMPLETED", async () => {
      const { markCompleted } = await import("../transportation.server");

      mockTransferFindFirst.mockResolvedValue({
        id: "transfer-1",
        tenantId: "tenant-1",
        status: "EN_ROUTE",
      });
      mockTransferUpdate.mockResolvedValue({ id: "transfer-1", status: "COMPLETED" });

      const result = await markCompleted("transfer-1", CTX);
      expect(result.status).toBe("COMPLETED");
    });

    it("throws on invalid status transition", async () => {
      const { markCompleted } = await import("../transportation.server");

      mockTransferFindFirst.mockResolvedValue({
        id: "transfer-1",
        tenantId: "tenant-1",
        status: "SCHEDULED",
      });

      await expect(markCompleted("transfer-1", CTX)).rejects.toThrow(
        'Cannot mark as completed from status "SCHEDULED"',
      );
    });
  });

  describe("markNoShow", () => {
    it("transitions SCHEDULED to NO_SHOW", async () => {
      const { markNoShow } = await import("../transportation.server");

      mockTransferFindFirst.mockResolvedValue({
        id: "transfer-1",
        tenantId: "tenant-1",
        status: "SCHEDULED",
      });
      mockTransferUpdate.mockResolvedValue({ id: "transfer-1", status: "NO_SHOW" });

      const result = await markNoShow("transfer-1", CTX);
      expect(result.status).toBe("NO_SHOW");
    });

    it("throws on completed transfer", async () => {
      const { markNoShow } = await import("../transportation.server");

      mockTransferFindFirst.mockResolvedValue({
        id: "transfer-1",
        tenantId: "tenant-1",
        status: "COMPLETED",
      });

      await expect(markNoShow("transfer-1", CTX)).rejects.toThrow(
        'Cannot mark as no-show from status "COMPLETED"',
      );
    });
  });

  describe("cancelTransfer", () => {
    it("cancels a scheduled transfer", async () => {
      const { cancelTransfer } = await import("../transportation.server");

      mockTransferFindFirst.mockResolvedValue({
        id: "transfer-1",
        tenantId: "tenant-1",
        status: "SCHEDULED",
      });
      mockTransferUpdate.mockResolvedValue({ id: "transfer-1", status: "CANCELLED" });

      const result = await cancelTransfer("transfer-1", CTX);
      expect(result.status).toBe("CANCELLED");
    });

    it("throws when already completed", async () => {
      const { cancelTransfer } = await import("../transportation.server");

      mockTransferFindFirst.mockResolvedValue({
        id: "transfer-1",
        tenantId: "tenant-1",
        status: "COMPLETED",
      });

      await expect(cancelTransfer("transfer-1", CTX)).rejects.toThrow(
        'Cannot cancel transfer with status "COMPLETED"',
      );
    });
  });

  describe("getTransportDashboard", () => {
    it("returns correct counts", async () => {
      const { getTransportDashboard } = await import("../transportation.server");

      mockTransferCount
        .mockResolvedValueOnce(10) // SCHEDULED
        .mockResolvedValueOnce(2) // EN_ROUTE
        .mockResolvedValueOnce(15) // COMPLETED
        .mockResolvedValueOnce(3) // NO_SHOW
        .mockResolvedValueOnce(1) // CANCELLED
        .mockResolvedValueOnce(5); // today's transfers
      mockVehicleCount.mockResolvedValue(3);

      const result = await getTransportDashboard("event-1", "tenant-1");
      expect(result.scheduled).toBe(10);
      expect(result.enRoute).toBe(2);
      expect(result.completed).toBe(15);
      expect(result.noShow).toBe(3);
      expect(result.cancelled).toBe(1);
      expect(result.total).toBe(31);
      expect(result.todaysTransfers).toBe(5);
      expect(result.activeVehicles).toBe(3);
    });
  });

  describe("getParticipantTransfers", () => {
    it("returns transfers for participant", async () => {
      const { getParticipantTransfers } = await import("../transportation.server");

      mockPassengerFindMany.mockResolvedValue([
        {
          id: "tp-1",
          transfer: {
            id: "transfer-1",
            type: "AIRPORT_ARRIVAL",
            route: { name: "Shuttle" },
            vehicle: null,
          },
        },
      ]);

      const result = await getParticipantTransfers("p-1", "tenant-1");
      expect(result).toHaveLength(1);
      expect(result[0].transfer.type).toBe("AIRPORT_ARRIVAL");
    });
  });
});
