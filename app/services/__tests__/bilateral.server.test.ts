import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockMeetingCreate = vi.fn();
const mockMeetingFindFirst = vi.fn();
const mockMeetingFindMany = vi.fn();
const mockMeetingUpdate = vi.fn();
const mockMeetingCount = vi.fn();
const mockSlotCreate = vi.fn();
const mockSlotFindMany = vi.fn();
const mockSlotUpdate = vi.fn();
const mockSlotUpdateMany = vi.fn();
const mockSlotCount = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    bilateralMeeting: {
      create: (...args: unknown[]) => mockMeetingCreate(...args),
      findFirst: (...args: unknown[]) => mockMeetingFindFirst(...args),
      findMany: (...args: unknown[]) => mockMeetingFindMany(...args),
      update: (...args: unknown[]) => mockMeetingUpdate(...args),
      count: (...args: unknown[]) => mockMeetingCount(...args),
    },
    meetingSlot: {
      create: (...args: unknown[]) => mockSlotCreate(...args),
      findMany: (...args: unknown[]) => mockSlotFindMany(...args),
      update: (...args: unknown[]) => mockSlotUpdate(...args),
      updateMany: (...args: unknown[]) => mockSlotUpdateMany(...args),
      count: (...args: unknown[]) => mockSlotCount(...args),
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

describe("bilateral.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("requestMeeting", () => {
    it("creates meeting request and audit log", async () => {
      const { requestMeeting } = await import("../bilateral.server");

      mockMeetingCreate.mockImplementation(async ({ data }: any) => ({
        id: "meeting-1",
        ...data,
        requester: { id: "p-1", firstName: "Alice", lastName: "Smith" },
        requestee: { id: "p-2", firstName: "Bob", lastName: "Jones" },
      }));

      const result = await requestMeeting(
        {
          eventId: "event-1",
          requesterId: "p-1",
          requesteeId: "p-2",
          priority: 1,
          duration: 30,
        },
        CTX,
      );

      expect(result.id).toBe("meeting-1");
      expect(result.requesterId).toBe("p-1");
      expect(result.requesteeId).toBe("p-2");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when requester equals requestee", async () => {
      const { requestMeeting } = await import("../bilateral.server");

      await expect(
        requestMeeting(
          {
            eventId: "event-1",
            requesterId: "p-1",
            requesteeId: "p-1",
            priority: 0,
            duration: 30,
          },
          CTX,
        ),
      ).rejects.toThrow("same participant");
    });
  });

  describe("confirmMeeting", () => {
    it("confirms meeting with scheduled time", async () => {
      const { confirmMeeting } = await import("../bilateral.server");

      mockMeetingFindFirst.mockResolvedValue({
        id: "meeting-1",
        tenantId: "tenant-1",
        status: "REQUESTED",
      });
      mockMeetingUpdate.mockImplementation(async ({ data }: any) => ({
        id: "meeting-1",
        ...data,
        requester: { id: "p-1", firstName: "Alice", lastName: "Smith" },
        requestee: { id: "p-2", firstName: "Bob", lastName: "Jones" },
      }));

      const result = await confirmMeeting(
        {
          meetingId: "meeting-1",
          scheduledAt: "2026-03-01T10:00:00Z",
          roomId: "room-1",
        },
        CTX,
      );

      expect(result.status).toBe("CONFIRMED");
      expect(result.roomId).toBe("room-1");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when meeting is not in REQUESTED status", async () => {
      const { confirmMeeting } = await import("../bilateral.server");

      mockMeetingFindFirst.mockResolvedValue({
        id: "meeting-1",
        tenantId: "tenant-1",
        status: "CONFIRMED",
      });

      await expect(
        confirmMeeting({ meetingId: "meeting-1", scheduledAt: "2026-03-01T10:00:00Z" }, CTX),
      ).rejects.toThrow("Cannot confirm");
    });

    it("marks slot as booked when slotId provided", async () => {
      const { confirmMeeting } = await import("../bilateral.server");

      mockMeetingFindFirst.mockResolvedValue({
        id: "meeting-1",
        tenantId: "tenant-1",
        status: "REQUESTED",
      });
      mockMeetingUpdate.mockResolvedValue({
        id: "meeting-1",
        status: "CONFIRMED",
        requester: { id: "p-1", firstName: "A", lastName: "B" },
        requestee: { id: "p-2", firstName: "C", lastName: "D" },
      });
      mockSlotUpdate.mockResolvedValue({});

      await confirmMeeting(
        {
          meetingId: "meeting-1",
          slotId: "slot-1",
          scheduledAt: "2026-03-01T10:00:00Z",
        },
        CTX,
      );

      expect(mockSlotUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "slot-1" },
          data: { isBooked: true, meetingId: "meeting-1" },
        }),
      );
    });
  });

  describe("declineMeeting", () => {
    it("declines a requested meeting", async () => {
      const { declineMeeting } = await import("../bilateral.server");

      mockMeetingFindFirst.mockResolvedValue({
        id: "meeting-1",
        tenantId: "tenant-1",
        status: "REQUESTED",
        notes: null,
      });
      mockMeetingUpdate.mockImplementation(async ({ data }: any) => ({
        id: "meeting-1",
        ...data,
      }));

      const result = await declineMeeting("meeting-1", "Schedule conflict", CTX);
      expect(result.status).toBe("DECLINED");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when not in REQUESTED status", async () => {
      const { declineMeeting } = await import("../bilateral.server");

      mockMeetingFindFirst.mockResolvedValue({
        id: "meeting-1",
        tenantId: "tenant-1",
        status: "CONFIRMED",
      });

      await expect(declineMeeting("meeting-1", null, CTX)).rejects.toThrow("Cannot decline");
    });
  });

  describe("cancelMeeting", () => {
    it("cancels meeting and releases slots", async () => {
      const { cancelMeeting } = await import("../bilateral.server");

      mockMeetingFindFirst.mockResolvedValue({
        id: "meeting-1",
        tenantId: "tenant-1",
        status: "CONFIRMED",
        notes: null,
      });
      mockMeetingUpdate.mockImplementation(async ({ data }: any) => ({
        id: "meeting-1",
        ...data,
      }));
      mockSlotUpdateMany.mockResolvedValue({ count: 1 });

      const result = await cancelMeeting("meeting-1", "No longer needed", CTX);
      expect(result.status).toBe("CANCELLED");
      expect(mockSlotUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { meetingId: "meeting-1" },
        }),
      );
    });

    it("throws when already completed", async () => {
      const { cancelMeeting } = await import("../bilateral.server");

      mockMeetingFindFirst.mockResolvedValue({
        id: "meeting-1",
        tenantId: "tenant-1",
        status: "COMPLETED",
      });

      await expect(cancelMeeting("meeting-1", null, CTX)).rejects.toThrow("Cannot cancel");
    });
  });

  describe("completeMeeting", () => {
    it("completes a confirmed meeting", async () => {
      const { completeMeeting } = await import("../bilateral.server");

      mockMeetingFindFirst.mockResolvedValue({
        id: "meeting-1",
        tenantId: "tenant-1",
        status: "CONFIRMED",
        notes: null,
      });
      mockMeetingUpdate.mockImplementation(async ({ data }: any) => ({
        id: "meeting-1",
        ...data,
      }));

      const result = await completeMeeting("meeting-1", "Productive discussion", CTX);
      expect(result.status).toBe("COMPLETED");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when not confirmed", async () => {
      const { completeMeeting } = await import("../bilateral.server");

      mockMeetingFindFirst.mockResolvedValue({
        id: "meeting-1",
        tenantId: "tenant-1",
        status: "REQUESTED",
      });

      await expect(completeMeeting("meeting-1", null, CTX)).rejects.toThrow(
        "Only confirmed meetings",
      );
    });
  });

  describe("getAvailableSlots", () => {
    it("filters out slots overlapping with busy meetings", async () => {
      const { getAvailableSlots } = await import("../bilateral.server");

      const slot1Start = new Date("2026-03-01T09:00:00Z");
      const slot1End = new Date("2026-03-01T09:30:00Z");
      const slot2Start = new Date("2026-03-01T10:00:00Z");
      const slot2End = new Date("2026-03-01T10:30:00Z");

      mockSlotFindMany.mockResolvedValue([
        { id: "slot-1", startTime: slot1Start, endTime: slot1End, isBooked: false },
        { id: "slot-2", startTime: slot2Start, endTime: slot2End, isBooked: false },
      ]);
      mockMeetingFindMany.mockResolvedValue([
        { scheduledAt: new Date("2026-03-01T09:00:00Z"), duration: 30 },
      ]);

      const result = await getAvailableSlots("event-1", "tenant-1", "2026-03-01", ["p-1", "p-2"]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("slot-2");
    });
  });

  describe("getBilateralStats", () => {
    it("returns correct status counts", async () => {
      const { getBilateralStats } = await import("../bilateral.server");

      mockMeetingFindMany.mockResolvedValue([
        { status: "REQUESTED" },
        { status: "REQUESTED" },
        { status: "CONFIRMED" },
        { status: "COMPLETED" },
      ]);
      mockSlotCount.mockResolvedValueOnce(10).mockResolvedValueOnce(6);

      const result = await getBilateralStats("event-1", "tenant-1");
      expect(result.total).toBe(4);
      expect(result.requested).toBe(2);
      expect(result.confirmed).toBe(1);
      expect(result.completed).toBe(1);
      expect(result.totalSlots).toBe(10);
      expect(result.availableSlots).toBe(6);
    });
  });

  describe("getDailyBriefing", () => {
    it("returns daily schedule summary", async () => {
      const { getDailyBriefing } = await import("../bilateral.server");

      mockMeetingFindMany.mockResolvedValue([
        {
          id: "m-1",
          scheduledAt: new Date("2026-03-01T10:00:00Z"),
          requester: { id: "p-1", firstName: "Alice", lastName: "Smith" },
          requestee: { id: "p-2", firstName: "Bob", lastName: "Jones" },
        },
      ]);
      mockMeetingCount.mockResolvedValue(3);
      mockSlotFindMany.mockResolvedValue([{ id: "s-1" }, { id: "s-2" }]);

      const result = await getDailyBriefing("event-1", "tenant-1", "2026-03-01");
      expect(result.totalScheduled).toBe(1);
      expect(result.pendingRequests).toBe(3);
      expect(result.availableSlots).toBe(2);
    });
  });
});
