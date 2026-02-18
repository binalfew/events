import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockHotelCreate = vi.fn();
const mockHotelFindFirst = vi.fn();
const mockHotelFindMany = vi.fn();
const mockRoomBlockCreate = vi.fn();
const mockRoomBlockFindFirst = vi.fn();
const mockRoomBlockFindMany = vi.fn();
const mockAssignmentCreate = vi.fn();
const mockAssignmentFindFirst = vi.fn();
const mockAssignmentFindUnique = vi.fn();
const mockAssignmentFindMany = vi.fn();
const mockAssignmentCount = vi.fn();
const mockAssignmentUpdate = vi.fn();
const mockAuditLogCreate = vi.fn();
const mockParticipantFindMany = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    hotel: {
      create: (...args: unknown[]) => mockHotelCreate(...args),
      findFirst: (...args: unknown[]) => mockHotelFindFirst(...args),
      findMany: (...args: unknown[]) => mockHotelFindMany(...args),
    },
    roomBlock: {
      create: (...args: unknown[]) => mockRoomBlockCreate(...args),
      findFirst: (...args: unknown[]) => mockRoomBlockFindFirst(...args),
      findMany: (...args: unknown[]) => mockRoomBlockFindMany(...args),
    },
    accommodationAssignment: {
      create: (...args: unknown[]) => mockAssignmentCreate(...args),
      findFirst: (...args: unknown[]) => mockAssignmentFindFirst(...args),
      findUnique: (...args: unknown[]) => mockAssignmentFindUnique(...args),
      findMany: (...args: unknown[]) => mockAssignmentFindMany(...args),
      count: (...args: unknown[]) => mockAssignmentCount(...args),
      update: (...args: unknown[]) => mockAssignmentUpdate(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
    },
    participant: {
      findMany: (...args: unknown[]) => mockParticipantFindMany(...args),
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

describe("accommodation.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createHotel", () => {
    it("creates hotel and audit log", async () => {
      const { createHotel } = await import("../accommodation.server");

      mockHotelCreate.mockImplementation(async ({ data }: any) => ({
        id: "hotel-1",
        ...data,
      }));

      const result = await createHotel(
        {
          eventId: "event-1",
          name: "Grand Hotel",
          address: "123 Main St",
          totalRooms: 100,
        },
        CTX,
      );

      expect(result.id).toBe("hotel-1");
      expect(result.name).toBe("Grand Hotel");
      expect(mockHotelCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: "tenant-1",
            eventId: "event-1",
            name: "Grand Hotel",
            totalRooms: 100,
          }),
        }),
      );
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "CREATE",
            entityType: "Hotel",
          }),
        }),
      );
    });

    it("rejects duplicate hotel name via unique constraint", async () => {
      const { createHotel } = await import("../accommodation.server");

      mockHotelCreate.mockRejectedValue(
        Object.assign(new Error("Unique constraint failed"), { code: "P2002" }),
      );

      await expect(
        createHotel(
          { eventId: "event-1", name: "Grand Hotel", address: "123 Main St", totalRooms: 50 },
          CTX,
        ),
      ).rejects.toThrow("Unique constraint failed");
    });
  });

  describe("listHotels", () => {
    it("returns hotels with room blocks", async () => {
      const { listHotels } = await import("../accommodation.server");

      const mockHotels = [
        {
          id: "hotel-1",
          name: "Grand Hotel",
          roomBlocks: [
            { id: "rb-1", roomType: "Standard", quantity: 20, _count: { assignments: 5 } },
          ],
        },
      ];
      mockHotelFindMany.mockResolvedValue(mockHotels);

      const result = await listHotels("event-1", "tenant-1");
      expect(result).toHaveLength(1);
      expect(result[0].roomBlocks[0]._count.assignments).toBe(5);
    });
  });

  describe("createRoomBlock", () => {
    it("creates room block under hotel", async () => {
      const { createRoomBlock } = await import("../accommodation.server");

      mockHotelFindFirst.mockResolvedValue({
        id: "hotel-1",
        tenantId: "tenant-1",
        name: "Grand Hotel",
      });
      mockRoomBlockCreate.mockImplementation(async ({ data }: any) => ({
        id: "rb-1",
        ...data,
      }));

      const result = await createRoomBlock(
        {
          hotelId: "hotel-1",
          roomType: "Deluxe",
          quantity: 10,
          checkInDate: "2026-03-01",
          checkOutDate: "2026-03-05",
        },
        CTX,
      );

      expect(result.id).toBe("rb-1");
      expect(result.roomType).toBe("Deluxe");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws 404 when hotel not found", async () => {
      const { createRoomBlock } = await import("../accommodation.server");

      mockHotelFindFirst.mockResolvedValue(null);

      await expect(
        createRoomBlock(
          {
            hotelId: "nonexistent",
            roomType: "Standard",
            quantity: 5,
            checkInDate: "2026-03-01",
            checkOutDate: "2026-03-05",
          },
          CTX,
        ),
      ).rejects.toThrow("Hotel not found");
    });
  });

  describe("assignRoom", () => {
    it("assigns participant to room and creates assignment", async () => {
      const { assignRoom } = await import("../accommodation.server");

      mockRoomBlockFindFirst.mockResolvedValue({
        id: "rb-1",
        quantity: 10,
        hotel: { tenantId: "tenant-1", eventId: "event-1" },
        _count: { assignments: 3 },
        checkInDate: new Date("2026-03-01"),
        checkOutDate: new Date("2026-03-05"),
      });
      mockAssignmentFindUnique.mockResolvedValue(null);
      mockAssignmentCreate.mockImplementation(async ({ data }: any) => ({
        id: "assign-1",
        ...data,
        participant: { firstName: "Jane", lastName: "Doe" },
      }));

      const result = await assignRoom({ roomBlockId: "rb-1", participantId: "participant-1" }, CTX);

      expect(result.id).toBe("assign-1");
      expect(mockAssignmentCreate).toHaveBeenCalled();
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when room block is full", async () => {
      const { assignRoom } = await import("../accommodation.server");

      mockRoomBlockFindFirst.mockResolvedValue({
        id: "rb-1",
        quantity: 5,
        hotel: { tenantId: "tenant-1", eventId: "event-1" },
        _count: { assignments: 5 },
        checkInDate: new Date("2026-03-01"),
        checkOutDate: new Date("2026-03-05"),
      });

      await expect(
        assignRoom({ roomBlockId: "rb-1", participantId: "participant-1" }, CTX),
      ).rejects.toThrow("Room block is full");
    });

    it("throws when participant already has assignment", async () => {
      const { assignRoom } = await import("../accommodation.server");

      mockRoomBlockFindFirst.mockResolvedValue({
        id: "rb-1",
        quantity: 10,
        hotel: { tenantId: "tenant-1", eventId: "event-1" },
        _count: { assignments: 2 },
        checkInDate: new Date("2026-03-01"),
        checkOutDate: new Date("2026-03-05"),
      });
      mockAssignmentFindUnique.mockResolvedValue({ id: "existing-1" });

      await expect(
        assignRoom({ roomBlockId: "rb-1", participantId: "participant-1" }, CTX),
      ).rejects.toThrow("Participant already has an accommodation assignment");
    });
  });

  describe("releaseRoom", () => {
    it("sets assignment status to CANCELLED", async () => {
      const { releaseRoom } = await import("../accommodation.server");

      mockAssignmentFindFirst.mockResolvedValue({
        id: "assign-1",
        tenantId: "tenant-1",
        status: "PENDING",
      });
      mockAssignmentUpdate.mockResolvedValue({
        id: "assign-1",
        status: "CANCELLED",
      });

      const result = await releaseRoom("assign-1", CTX);
      expect(result.status).toBe("CANCELLED");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws 404 when assignment not found", async () => {
      const { releaseRoom } = await import("../accommodation.server");

      mockAssignmentFindFirst.mockResolvedValue(null);

      await expect(releaseRoom("nonexistent", CTX)).rejects.toThrow("Assignment not found");
    });
  });

  describe("checkIn", () => {
    it("transitions PENDING to CHECKED_IN", async () => {
      const { checkIn } = await import("../accommodation.server");

      mockAssignmentFindFirst.mockResolvedValue({
        id: "assign-1",
        tenantId: "tenant-1",
        status: "PENDING",
      });
      mockAssignmentUpdate.mockResolvedValue({
        id: "assign-1",
        status: "CHECKED_IN",
      });

      const result = await checkIn("assign-1", CTX);
      expect(result.status).toBe("CHECKED_IN");
    });

    it("transitions CONFIRMED to CHECKED_IN", async () => {
      const { checkIn } = await import("../accommodation.server");

      mockAssignmentFindFirst.mockResolvedValue({
        id: "assign-1",
        tenantId: "tenant-1",
        status: "CONFIRMED",
      });
      mockAssignmentUpdate.mockResolvedValue({
        id: "assign-1",
        status: "CHECKED_IN",
      });

      const result = await checkIn("assign-1", CTX);
      expect(result.status).toBe("CHECKED_IN");
    });

    it("throws on invalid status transition", async () => {
      const { checkIn } = await import("../accommodation.server");

      mockAssignmentFindFirst.mockResolvedValue({
        id: "assign-1",
        tenantId: "tenant-1",
        status: "CHECKED_OUT",
      });

      await expect(checkIn("assign-1", CTX)).rejects.toThrow(
        'Cannot check in from status "CHECKED_OUT"',
      );
    });
  });

  describe("checkOut", () => {
    it("transitions CHECKED_IN to CHECKED_OUT", async () => {
      const { checkOut } = await import("../accommodation.server");

      mockAssignmentFindFirst.mockResolvedValue({
        id: "assign-1",
        tenantId: "tenant-1",
        status: "CHECKED_IN",
      });
      mockAssignmentUpdate.mockResolvedValue({
        id: "assign-1",
        status: "CHECKED_OUT",
      });

      const result = await checkOut("assign-1", CTX);
      expect(result.status).toBe("CHECKED_OUT");
    });

    it("throws on invalid status transition", async () => {
      const { checkOut } = await import("../accommodation.server");

      mockAssignmentFindFirst.mockResolvedValue({
        id: "assign-1",
        tenantId: "tenant-1",
        status: "PENDING",
      });

      await expect(checkOut("assign-1", CTX)).rejects.toThrow(
        'Cannot check out from status "PENDING"',
      );
    });
  });

  describe("getAccommodationStats", () => {
    it("returns correct counts and occupancy rate", async () => {
      const { getAccommodationStats } = await import("../accommodation.server");

      mockAssignmentCount
        .mockResolvedValueOnce(5) // PENDING
        .mockResolvedValueOnce(3) // CONFIRMED
        .mockResolvedValueOnce(10) // CHECKED_IN
        .mockResolvedValueOnce(2) // CHECKED_OUT
        .mockResolvedValueOnce(1); // CANCELLED
      mockHotelFindMany.mockResolvedValue([
        {
          id: "hotel-1",
          roomBlocks: [
            { quantity: 20, _count: { assignments: 15 } },
            { quantity: 10, _count: { assignments: 6 } },
          ],
        },
      ]);

      const result = await getAccommodationStats("event-1", "tenant-1");
      expect(result.pending).toBe(5);
      expect(result.confirmed).toBe(3);
      expect(result.checkedIn).toBe(10);
      expect(result.checkedOut).toBe(2);
      expect(result.cancelled).toBe(1);
      expect(result.totalHotels).toBe(1);
      expect(result.totalRooms).toBe(30);
      expect(result.totalAssigned).toBe(21);
      expect(result.totalAvailable).toBe(9);
      // occupancyRate = (21 - 1) / 30 * 100 = 67
      expect(result.occupancyRate).toBe(67);
    });
  });

  describe("autoAssignRooms", () => {
    it("bulk assigns unassigned participants to available room blocks", async () => {
      const { autoAssignRooms } = await import("../accommodation.server");

      mockParticipantFindMany.mockResolvedValue([
        { id: "p-1", participantTypeId: "type-1", firstName: "A", lastName: "B" },
        { id: "p-2", participantTypeId: "type-1", firstName: "C", lastName: "D" },
      ]);
      mockRoomBlockFindMany.mockResolvedValue([
        {
          id: "rb-1",
          quantity: 5,
          participantTypeId: "type-1",
          status: "AVAILABLE",
          hotel: { eventId: "event-1", tenantId: "tenant-1" },
          _count: { assignments: 2 },
          checkInDate: new Date("2026-03-01"),
          checkOutDate: new Date("2026-03-05"),
        },
      ]);
      mockAssignmentCreate.mockResolvedValue({ id: "assign-new" });

      const result = await autoAssignRooms("event-1", "tenant-1", "by_participant_type", CTX);

      expect(result.assignedCount).toBe(2);
      expect(mockAssignmentCreate).toHaveBeenCalledTimes(2);
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("skips participants when no room blocks available", async () => {
      const { autoAssignRooms } = await import("../accommodation.server");

      mockParticipantFindMany.mockResolvedValue([{ id: "p-1", participantTypeId: "type-1" }]);
      mockRoomBlockFindMany.mockResolvedValue([
        {
          id: "rb-1",
          quantity: 2,
          participantTypeId: "type-2",
          status: "AVAILABLE",
          hotel: { eventId: "event-1", tenantId: "tenant-1" },
          _count: { assignments: 2 },
          checkInDate: new Date("2026-03-01"),
          checkOutDate: new Date("2026-03-05"),
        },
      ]);

      const result = await autoAssignRooms("event-1", "tenant-1", "by_participant_type", CTX);
      expect(result.assignedCount).toBe(0);
      expect(mockAssignmentCreate).not.toHaveBeenCalled();
    });
  });
});
