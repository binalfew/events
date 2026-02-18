import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockWaitlistEntryCreate = vi.fn();
const mockWaitlistEntryFindFirst = vi.fn();
const mockWaitlistEntryFindMany = vi.fn();
const mockWaitlistEntryCount = vi.fn();
const mockWaitlistEntryUpdate = vi.fn();
const mockWaitlistPromotionCreate = vi.fn();
const mockWaitlistPromotionFindFirst = vi.fn();
const mockWaitlistPromotionFindMany = vi.fn();
const mockWaitlistPromotionUpdate = vi.fn();
const mockAuditLogCreate = vi.fn();
const mockParticipantFindFirst = vi.fn();
const mockNotificationCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    waitlistEntry: {
      create: (...args: unknown[]) => mockWaitlistEntryCreate(...args),
      findFirst: (...args: unknown[]) => mockWaitlistEntryFindFirst(...args),
      findMany: (...args: unknown[]) => mockWaitlistEntryFindMany(...args),
      count: (...args: unknown[]) => mockWaitlistEntryCount(...args),
      update: (...args: unknown[]) => mockWaitlistEntryUpdate(...args),
    },
    waitlistPromotion: {
      create: (...args: unknown[]) => mockWaitlistPromotionCreate(...args),
      findFirst: (...args: unknown[]) => mockWaitlistPromotionFindFirst(...args),
      findMany: (...args: unknown[]) => mockWaitlistPromotionFindMany(...args),
      update: (...args: unknown[]) => mockWaitlistPromotionUpdate(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
    },
    participant: {
      findFirst: (...args: unknown[]) => mockParticipantFindFirst(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockNotificationCreate(...args),
    },
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("~/services/notifications.server", () => ({
  createNotification: (...args: unknown[]) => mockNotificationCreate(...args),
}));

vi.mock("~/lib/event-bus.server", () => ({
  eventBus: { publish: vi.fn() },
}));

// ─── Helpers ─────────────────────────────────────────────

const CTX = {
  userId: "user-1",
  tenantId: "tenant-1",
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
};

const MOCK_PARTICIPANT = {
  id: "participant-1",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
};

// ─── Tests ───────────────────────────────────────────────

describe("waitlist.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
    mockNotificationCreate.mockResolvedValue({ id: "notif-1" });
  });

  describe("addToWaitlist", () => {
    it("creates an entry with auto-calculated position", async () => {
      const { addToWaitlist } = await import("../waitlist.server");

      mockWaitlistEntryFindFirst.mockResolvedValue(null); // no existing
      mockWaitlistEntryCount.mockResolvedValue(5); // 5 active entries
      mockWaitlistEntryCreate.mockImplementation(async ({ data }: any) => ({
        id: "entry-1",
        ...data,
        participant: MOCK_PARTICIPANT,
      }));

      const result = await addToWaitlist(
        {
          eventId: "event-1",
          participantId: "participant-1",
          participantType: "DELEGATE",
          priority: "STANDARD",
          registrationData: {},
        },
        CTX,
      );

      expect(result.id).toBe("entry-1");
      expect(mockWaitlistEntryCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: "tenant-1",
            eventId: "event-1",
            position: 6,
            priority: "STANDARD",
          }),
        }),
      );
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("rejects duplicate active entries", async () => {
      const { addToWaitlist } = await import("../waitlist.server");

      mockWaitlistEntryFindFirst.mockResolvedValue({ id: "existing-1", status: "ACTIVE" });

      await expect(
        addToWaitlist(
          {
            eventId: "event-1",
            participantId: "participant-1",
            participantType: "DELEGATE",
            priority: "STANDARD",
            registrationData: {},
          },
          CTX,
        ),
      ).rejects.toThrow("Participant is already on the waitlist");
    });
  });

  describe("getWaitlistEntry", () => {
    it("returns entry with participant and promotions", async () => {
      const { getWaitlistEntry } = await import("../waitlist.server");

      mockWaitlistEntryFindFirst.mockResolvedValue({
        id: "entry-1",
        tenantId: "tenant-1",
        participant: MOCK_PARTICIPANT,
        promotions: [],
      });

      const result = await getWaitlistEntry("entry-1", "tenant-1");
      expect(result.id).toBe("entry-1");
      expect(result.participant).toEqual(MOCK_PARTICIPANT);
    });

    it("throws 404 when not found", async () => {
      const { getWaitlistEntry } = await import("../waitlist.server");

      mockWaitlistEntryFindFirst.mockResolvedValue(null);

      await expect(getWaitlistEntry("nonexistent", "tenant-1")).rejects.toThrow(
        "Waitlist entry not found",
      );
    });
  });

  describe("withdrawFromWaitlist", () => {
    it("sets status to WITHDRAWN with timestamp", async () => {
      const { withdrawFromWaitlist } = await import("../waitlist.server");

      mockWaitlistEntryFindFirst.mockResolvedValue({
        id: "entry-1",
        tenantId: "tenant-1",
        status: "ACTIVE",
      });
      mockWaitlistEntryUpdate.mockResolvedValue({
        id: "entry-1",
        status: "WITHDRAWN",
      });

      const result = await withdrawFromWaitlist("entry-1", CTX);
      expect(result.status).toBe("WITHDRAWN");
      expect(mockWaitlistEntryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "WITHDRAWN",
          }),
        }),
      );
    });

    it("rejects withdrawal of non-active entries", async () => {
      const { withdrawFromWaitlist } = await import("../waitlist.server");

      mockWaitlistEntryFindFirst.mockResolvedValue({
        id: "entry-1",
        tenantId: "tenant-1",
        status: "PROMOTED",
      });

      await expect(withdrawFromWaitlist("entry-1", CTX)).rejects.toThrow(
        "Only active entries can be withdrawn",
      );
    });
  });

  describe("updatePriority", () => {
    it("updates priority and creates audit log", async () => {
      const { updatePriority } = await import("../waitlist.server");

      mockWaitlistEntryFindFirst.mockResolvedValue({
        id: "entry-1",
        tenantId: "tenant-1",
        priority: "STANDARD",
      });
      mockWaitlistEntryUpdate.mockResolvedValue({
        id: "entry-1",
        priority: "VIP",
      });

      const result = await updatePriority("entry-1", "VIP", CTX);
      expect(result.priority).toBe("VIP");
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: expect.stringContaining("STANDARD to VIP"),
          }),
        }),
      );
    });
  });

  describe("getWaitlistPosition", () => {
    it("computes position based on priority and FIFO", async () => {
      const { getWaitlistPosition } = await import("../waitlist.server");

      mockWaitlistEntryFindFirst.mockResolvedValue({
        id: "entry-1",
        eventId: "event-1",
        participantType: "DELEGATE",
        priority: "HIGH",
        status: "ACTIVE",
        createdAt: new Date("2026-01-15"),
      });
      mockWaitlistEntryCount.mockResolvedValue(2); // 2 ahead

      const position = await getWaitlistPosition("entry-1");
      expect(position).toBe(3);
    });

    it("returns null for non-active entries", async () => {
      const { getWaitlistPosition } = await import("../waitlist.server");

      mockWaitlistEntryFindFirst.mockResolvedValue({
        id: "entry-1",
        status: "PROMOTED",
      });

      const position = await getWaitlistPosition("entry-1");
      expect(position).toBeNull();
    });
  });

  describe("removeFromWaitlist", () => {
    it("sets status to CANCELLED", async () => {
      const { removeFromWaitlist } = await import("../waitlist.server");

      mockWaitlistEntryFindFirst.mockResolvedValue({
        id: "entry-1",
        tenantId: "tenant-1",
        status: "ACTIVE",
      });
      mockWaitlistEntryUpdate.mockResolvedValue({
        id: "entry-1",
        status: "CANCELLED",
      });

      const result = await removeFromWaitlist("entry-1", CTX);
      expect(result.status).toBe("CANCELLED");
    });
  });

  describe("checkAndPromote", () => {
    it("promotes next eligible entries and creates promotions", async () => {
      const { checkAndPromote } = await import("../waitlist.server");

      mockWaitlistEntryFindMany.mockResolvedValue([
        {
          id: "entry-1",
          participant: MOCK_PARTICIPANT,
          participantId: "participant-1",
        },
      ]);
      mockWaitlistPromotionCreate.mockResolvedValue({ id: "promo-1" });
      mockWaitlistEntryUpdate.mockResolvedValue({});

      const result = await checkAndPromote("event-1", "tenant-1", "DELEGATE", 1, "user-1");

      expect(result).toHaveLength(1);
      expect(mockWaitlistPromotionCreate).toHaveBeenCalled();
      expect(mockWaitlistEntryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notificationsSent: { increment: 1 },
          }),
        }),
      );
    });

    it("returns empty array when no slots available", async () => {
      const { checkAndPromote } = await import("../waitlist.server");

      const result = await checkAndPromote("event-1", "tenant-1", "DELEGATE", 0, "user-1");
      expect(result).toEqual([]);
    });
  });

  describe("confirmPromotion", () => {
    it("confirms promotion and sets entry to PROMOTED", async () => {
      const { confirmPromotion } = await import("../waitlist.server");

      mockWaitlistPromotionFindFirst.mockResolvedValue({
        id: "promo-1",
        waitlistEntryId: "entry-1",
        confirmedAt: null,
        declinedAt: null,
        waitlistEntry: { tenantId: "tenant-1", participantId: "participant-1" },
      });
      mockWaitlistPromotionUpdate.mockResolvedValue({});
      mockWaitlistEntryUpdate.mockResolvedValue({
        id: "entry-1",
        status: "PROMOTED",
        participantId: "participant-1",
      });

      const result = await confirmPromotion("promo-1", CTX);
      expect(result.status).toBe("PROMOTED");
      expect(mockWaitlistPromotionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            promotedBy: "user-1",
          }),
        }),
      );
    });

    it("rejects already confirmed promotion", async () => {
      const { confirmPromotion } = await import("../waitlist.server");

      mockWaitlistPromotionFindFirst.mockResolvedValue({
        id: "promo-1",
        confirmedAt: new Date(),
        declinedAt: null,
        waitlistEntry: { tenantId: "tenant-1" },
      });

      await expect(confirmPromotion("promo-1", CTX)).rejects.toThrow("Promotion already confirmed");
    });
  });

  describe("expireStalePromotions", () => {
    it("expires entries past deadline and cascades", async () => {
      const { expireStalePromotions } = await import("../waitlist.server");

      mockWaitlistEntryFindMany
        .mockResolvedValueOnce([
          {
            id: "entry-1",
            eventId: "event-1",
            tenantId: "tenant-1",
            participantType: "DELEGATE",
          },
        ])
        // cascade call to checkAndPromote
        .mockResolvedValueOnce([]);
      mockWaitlistEntryUpdate.mockResolvedValue({});

      const result = await expireStalePromotions();
      expect(result.expired).toBe(1);
      expect(mockWaitlistEntryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "EXPIRED" }),
        }),
      );
    });

    it("returns 0 when nothing to expire", async () => {
      const { expireStalePromotions } = await import("../waitlist.server");

      mockWaitlistEntryFindMany.mockResolvedValue([]);

      const result = await expireStalePromotions();
      expect(result.expired).toBe(0);
    });
  });
});
