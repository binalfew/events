import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockVenueCreate = vi.fn();
const mockVenueFindFirst = vi.fn();
const mockVenueFindMany = vi.fn();
const mockVenueCount = vi.fn();
const mockRoomCreate = vi.fn();
const mockRoomFindFirst = vi.fn();
const mockRoomFindMany = vi.fn();
const mockRoomCount = vi.fn();
const mockRoomAggregate = vi.fn();
const mockBookingCreate = vi.fn();
const mockBookingFindFirst = vi.fn();
const mockBookingFindMany = vi.fn();
const mockBookingUpdate = vi.fn();
const mockBookingCount = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    venueMap: {
      create: (...args: unknown[]) => mockVenueCreate(...args),
      findFirst: (...args: unknown[]) => mockVenueFindFirst(...args),
      findMany: (...args: unknown[]) => mockVenueFindMany(...args),
      count: (...args: unknown[]) => mockVenueCount(...args),
    },
    venueRoom: {
      create: (...args: unknown[]) => mockRoomCreate(...args),
      findFirst: (...args: unknown[]) => mockRoomFindFirst(...args),
      findMany: (...args: unknown[]) => mockRoomFindMany(...args),
      count: (...args: unknown[]) => mockRoomCount(...args),
      aggregate: (...args: unknown[]) => mockRoomAggregate(...args),
    },
    roomBooking: {
      create: (...args: unknown[]) => mockBookingCreate(...args),
      findFirst: (...args: unknown[]) => mockBookingFindFirst(...args),
      findMany: (...args: unknown[]) => mockBookingFindMany(...args),
      update: (...args: unknown[]) => mockBookingUpdate(...args),
      count: (...args: unknown[]) => mockBookingCount(...args),
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

describe("venue.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createVenueMap", () => {
    it("creates venue and audit log", async () => {
      const { createVenueMap } = await import("../venue.server");

      mockVenueCreate.mockImplementation(async ({ data }: any) => ({
        id: "venue-1",
        ...data,
      }));

      const result = await createVenueMap(
        { eventId: "event-1", name: "Main Conference Center" },
        CTX,
      );

      expect(result.id).toBe("venue-1");
      expect(result.name).toBe("Main Conference Center");
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "CREATE",
            entityType: "VenueMap",
          }),
        }),
      );
    });
  });

  describe("listVenueMaps", () => {
    it("returns venues with rooms", async () => {
      const { listVenueMaps } = await import("../venue.server");

      mockVenueFindMany.mockResolvedValue([
        {
          id: "venue-1",
          name: "Main Center",
          rooms: [
            { id: "room-1", name: "Hall A", bookings: [{ id: "b1" }, { id: "b2" }, { id: "b3" }] },
          ],
        },
      ]);

      const result = await listVenueMaps("event-1", "tenant-1");
      expect(result).toHaveLength(1);
      expect(result[0].rooms).toHaveLength(1);
    });
  });

  describe("createRoom", () => {
    it("creates room with equipment array", async () => {
      const { createRoom } = await import("../venue.server");

      mockVenueFindFirst.mockResolvedValue({
        id: "venue-1",
        tenantId: "tenant-1",
        name: "Main Center",
      });
      mockRoomCreate.mockImplementation(async ({ data }: any) => ({
        id: "room-1",
        ...data,
      }));

      const result = await createRoom(
        {
          venueMapId: "venue-1",
          name: "Hall A",
          capacity: 200,
          equipment: "Projector, Microphone, Whiteboard",
        },
        CTX,
      );

      expect(result.id).toBe("room-1");
      expect(result.equipment).toEqual(["Projector", "Microphone", "Whiteboard"]);
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws 404 when venue not found", async () => {
      const { createRoom } = await import("../venue.server");

      mockVenueFindFirst.mockResolvedValue(null);

      await expect(createRoom({ venueMapId: "bad-id", name: "Hall A" }, CTX)).rejects.toThrow(
        "Venue not found",
      );
    });
  });

  describe("bookRoom", () => {
    it("creates booking when no conflicts", async () => {
      const { bookRoom } = await import("../venue.server");

      mockRoomFindFirst.mockResolvedValue({
        id: "room-1",
        isActive: true,
        name: "Hall A",
        venueMap: { name: "Main Center" },
      });
      mockBookingFindFirst.mockResolvedValue(null); // no conflict
      mockBookingCreate.mockImplementation(async ({ data }: any) => ({
        id: "booking-1",
        ...data,
        room: { name: "Hall A", venueMap: { name: "Main Center" } },
      }));

      const result = await bookRoom(
        {
          eventId: "event-1",
          roomId: "room-1",
          title: "Opening Ceremony",
          startTime: "2026-03-01T09:00:00",
          endTime: "2026-03-01T11:00:00",
        },
        CTX,
      );

      expect(result.id).toBe("booking-1");
      expect(result.title).toBe("Opening Ceremony");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws 409 when time slot conflicts", async () => {
      const { bookRoom } = await import("../venue.server");

      mockRoomFindFirst.mockResolvedValue({
        id: "room-1",
        isActive: true,
        name: "Hall A",
        venueMap: {},
      });
      mockBookingFindFirst.mockResolvedValue({ id: "existing-booking" }); // conflict

      await expect(
        bookRoom(
          {
            eventId: "event-1",
            roomId: "room-1",
            title: "Conflict",
            startTime: "2026-03-01T09:00:00",
            endTime: "2026-03-01T11:00:00",
          },
          CTX,
        ),
      ).rejects.toThrow("Room is already booked for this time slot");
    });

    it("throws when end time is before start time", async () => {
      const { bookRoom } = await import("../venue.server");

      mockRoomFindFirst.mockResolvedValue({
        id: "room-1",
        isActive: true,
        name: "Hall A",
        venueMap: {},
      });

      await expect(
        bookRoom(
          {
            eventId: "event-1",
            roomId: "room-1",
            title: "Bad Time",
            startTime: "2026-03-01T11:00:00",
            endTime: "2026-03-01T09:00:00",
          },
          CTX,
        ),
      ).rejects.toThrow("End time must be after start time");
    });
  });

  describe("confirmBooking", () => {
    it("confirms tentative booking", async () => {
      const { confirmBooking } = await import("../venue.server");

      mockBookingFindFirst.mockResolvedValue({
        id: "booking-1",
        tenantId: "tenant-1",
        status: "TENTATIVE",
        title: "Opening Ceremony",
      });
      mockBookingUpdate.mockResolvedValue({ id: "booking-1", status: "CONFIRMED" });

      const result = await confirmBooking("booking-1", CTX);
      expect(result.status).toBe("CONFIRMED");
    });

    it("throws when booking is not tentative", async () => {
      const { confirmBooking } = await import("../venue.server");

      mockBookingFindFirst.mockResolvedValue({
        id: "booking-1",
        tenantId: "tenant-1",
        status: "CANCELLED",
        title: "Test",
      });

      await expect(confirmBooking("booking-1", CTX)).rejects.toThrow(
        "Cannot confirm booking with status CANCELLED",
      );
    });
  });

  describe("cancelBooking", () => {
    it("cancels booking with reason", async () => {
      const { cancelBooking } = await import("../venue.server");

      mockBookingFindFirst.mockResolvedValue({
        id: "booking-1",
        tenantId: "tenant-1",
        status: "CONFIRMED",
        title: "Opening Ceremony",
      });
      mockBookingUpdate.mockResolvedValue({ id: "booking-1", status: "CANCELLED" });

      const result = await cancelBooking("booking-1", "Schedule change", CTX);
      expect(result.status).toBe("CANCELLED");
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: expect.stringContaining("Schedule change"),
          }),
        }),
      );
    });

    it("throws when already cancelled", async () => {
      const { cancelBooking } = await import("../venue.server");

      mockBookingFindFirst.mockResolvedValue({
        id: "booking-1",
        tenantId: "tenant-1",
        status: "CANCELLED",
      });

      await expect(cancelBooking("booking-1", "reason", CTX)).rejects.toThrow(
        "Booking is already cancelled",
      );
    });
  });

  describe("getRoomAvailability", () => {
    it("returns bookings for a room on a date", async () => {
      const { getRoomAvailability } = await import("../venue.server");

      mockRoomFindFirst.mockResolvedValue({ id: "room-1", name: "Hall A" });
      mockBookingFindMany.mockResolvedValue([
        {
          id: "b-1",
          title: "Session 1",
          startTime: new Date("2026-03-01T09:00:00"),
          endTime: new Date("2026-03-01T11:00:00"),
          status: "CONFIRMED",
        },
      ]);

      const result = await getRoomAvailability("room-1", "2026-03-01", "tenant-1");
      expect(result.bookings).toHaveLength(1);
      expect(result.date).toBe("2026-03-01");
    });
  });

  describe("getVenueOverview", () => {
    it("returns correct stats", async () => {
      const { getVenueOverview } = await import("../venue.server");

      mockVenueFindMany.mockResolvedValue([
        {
          id: "v-1",
          rooms: [{ capacity: 200 }, { capacity: 100 }],
        },
        {
          id: "v-2",
          rooms: [{ capacity: 50 }, { capacity: null }],
        },
      ]);
      mockBookingCount
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(12) // confirmed
        .mockResolvedValueOnce(5) // tentative
        .mockResolvedValueOnce(3); // cancelled

      const result = await getVenueOverview("event-1", "tenant-1");
      expect(result.venues).toBe(2);
      expect(result.rooms).toBe(4);
      expect(result.totalCapacity).toBe(350); // 200 + 100 + 50 + 0
      expect(result.totalBookings).toBe(20);
      expect(result.confirmedBookings).toBe(12);
      expect(result.activeBookings).toBe(17); // 12 + 5
    });
  });
});
