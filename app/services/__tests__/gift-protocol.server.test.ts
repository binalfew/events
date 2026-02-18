import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockGiftItemCreate = vi.fn();
const mockGiftItemFindFirst = vi.fn();
const mockGiftItemFindMany = vi.fn();
const mockGiftItemUpdate = vi.fn();
const mockPackageCreate = vi.fn();
const mockPackageFindMany = vi.fn();
const mockPackageCount = vi.fn();
const mockDeliveryCreate = vi.fn();
const mockDeliveryFindFirst = vi.fn();
const mockDeliveryFindMany = vi.fn();
const mockDeliveryUpdate = vi.fn();
const mockParticipantFindMany = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    giftItem: {
      create: (...args: unknown[]) => mockGiftItemCreate(...args),
      findFirst: (...args: unknown[]) => mockGiftItemFindFirst(...args),
      findMany: (...args: unknown[]) => mockGiftItemFindMany(...args),
      update: (...args: unknown[]) => mockGiftItemUpdate(...args),
    },
    welcomePackage: {
      create: (...args: unknown[]) => mockPackageCreate(...args),
      findMany: (...args: unknown[]) => mockPackageFindMany(...args),
      count: (...args: unknown[]) => mockPackageCount(...args),
    },
    giftDelivery: {
      create: (...args: unknown[]) => mockDeliveryCreate(...args),
      findFirst: (...args: unknown[]) => mockDeliveryFindFirst(...args),
      findMany: (...args: unknown[]) => mockDeliveryFindMany(...args),
      update: (...args: unknown[]) => mockDeliveryUpdate(...args),
    },
    participant: {
      findMany: (...args: unknown[]) => mockParticipantFindMany(...args),
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

describe("gift-protocol.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createGiftItem", () => {
    it("creates gift item and audit log", async () => {
      const { createGiftItem } = await import("../gift-protocol.server");

      mockGiftItemCreate.mockImplementation(async ({ data }: any) => ({
        id: "item-1",
        ...data,
      }));

      const result = await createGiftItem(
        {
          eventId: "event-1",
          name: "Crystal Vase",
          category: "Premium",
          quantity: 50,
          currency: "USD",
        },
        CTX,
      );

      expect(result.id).toBe("item-1");
      expect(result.name).toBe("Crystal Vase");
      expect(result.quantity).toBe(50);
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("updateStock", () => {
    it("adjusts stock quantity", async () => {
      const { updateStock } = await import("../gift-protocol.server");

      mockGiftItemFindFirst.mockResolvedValue({
        id: "item-1",
        tenantId: "tenant-1",
        quantity: 50,
      });
      mockGiftItemUpdate.mockImplementation(async ({ data }: any) => ({
        id: "item-1",
        quantity: data.quantity,
      }));

      const result = await updateStock("item-1", 10, CTX);
      expect(result.quantity).toBe(60);
    });

    it("throws when reducing below zero", async () => {
      const { updateStock } = await import("../gift-protocol.server");

      mockGiftItemFindFirst.mockResolvedValue({
        id: "item-1",
        tenantId: "tenant-1",
        quantity: 5,
      });

      await expect(updateStock("item-1", -10, CTX)).rejects.toThrow("below zero");
    });
  });

  describe("createWelcomePackage", () => {
    it("creates package with parsed contents", async () => {
      const { createWelcomePackage } = await import("../gift-protocol.server");

      mockPackageCreate.mockImplementation(async ({ data }: any) => ({
        id: "pkg-1",
        ...data,
      }));

      const result = await createWelcomePackage(
        {
          eventId: "event-1",
          name: "VIP Package",
          contents: '["Crystal Vase","Pen Set"]',
          forParticipantType: "HEAD_OF_STATE",
        },
        CTX,
      );

      expect(result.id).toBe("pkg-1");
      expect(result.name).toBe("VIP Package");
      expect(result.contents).toEqual(["Crystal Vase", "Pen Set"]);
    });
  });

  describe("assignPackage", () => {
    it("creates delivery and increments allocated on gift item", async () => {
      const { assignPackage } = await import("../gift-protocol.server");

      mockDeliveryCreate.mockImplementation(async ({ data }: any) => ({
        id: "del-1",
        ...data,
        participant: { id: "p-1", firstName: "John", lastName: "Doe" },
        welcomePackage: { id: "pkg-1", name: "VIP Package" },
        giftItem: null,
      }));
      mockGiftItemUpdate.mockResolvedValue({});

      const result = await assignPackage(
        {
          participantId: "p-1",
          welcomePackageId: "pkg-1",
          recipientName: "John Doe",
        },
        "event-1",
        CTX,
      );

      expect(result.id).toBe("del-1");
      expect(result.recipientName).toBe("John Doe");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("increments allocated when giftItemId provided", async () => {
      const { assignPackage } = await import("../gift-protocol.server");

      mockDeliveryCreate.mockResolvedValue({
        id: "del-1",
        participant: null,
        welcomePackage: null,
        giftItem: { id: "item-1", name: "Vase" },
      });
      mockGiftItemUpdate.mockResolvedValue({});

      await assignPackage(
        {
          participantId: "p-1",
          giftItemId: "item-1",
          recipientName: "Jane Doe",
        },
        "event-1",
        CTX,
      );

      expect(mockGiftItemUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "item-1" },
          data: { allocated: { increment: 1 } },
        }),
      );
    });
  });

  describe("markAssembled", () => {
    it("transitions PENDING to ASSEMBLED", async () => {
      const { markAssembled } = await import("../gift-protocol.server");

      mockDeliveryFindFirst.mockResolvedValue({
        id: "del-1",
        tenantId: "tenant-1",
        status: "PENDING",
      });
      mockDeliveryUpdate.mockImplementation(async ({ data }: any) => ({
        id: "del-1",
        ...data,
      }));

      const result = await markAssembled("del-1", CTX);
      expect(result.status).toBe("ASSEMBLED");
    });

    it("throws on invalid status transition", async () => {
      const { markAssembled } = await import("../gift-protocol.server");

      mockDeliveryFindFirst.mockResolvedValue({
        id: "del-1",
        tenantId: "tenant-1",
        status: "DELIVERED",
      });

      await expect(markAssembled("del-1", CTX)).rejects.toThrow("Cannot mark as assembled");
    });
  });

  describe("markDelivered", () => {
    it("transitions ASSEMBLED to DELIVERED with timestamp", async () => {
      const { markDelivered } = await import("../gift-protocol.server");

      mockDeliveryFindFirst.mockResolvedValue({
        id: "del-1",
        tenantId: "tenant-1",
        status: "ASSEMBLED",
      });
      mockDeliveryUpdate.mockImplementation(async ({ data }: any) => ({
        id: "del-1",
        ...data,
      }));

      const result = await markDelivered("del-1", CTX);
      expect(result.status).toBe("DELIVERED");
      expect(result.deliveredBy).toBe("user-1");
      expect(result.deliveredAt).toBeInstanceOf(Date);
    });

    it("throws when not ASSEMBLED", async () => {
      const { markDelivered } = await import("../gift-protocol.server");

      mockDeliveryFindFirst.mockResolvedValue({
        id: "del-1",
        tenantId: "tenant-1",
        status: "PENDING",
      });

      await expect(markDelivered("del-1", CTX)).rejects.toThrow("Cannot mark as delivered");
    });
  });

  describe("getDeliveryDashboard", () => {
    it("returns correct counts and rates", async () => {
      const { getDeliveryDashboard } = await import("../gift-protocol.server");

      mockDeliveryFindMany.mockResolvedValue([
        { status: "PENDING" },
        { status: "ASSEMBLED" },
        { status: "DELIVERED" },
        { status: "DELIVERED" },
      ]);
      mockGiftItemFindMany.mockResolvedValue([
        { quantity: 50, allocated: 10 },
        { quantity: 30, allocated: 5 },
      ]);
      mockPackageCount.mockResolvedValue(3);

      const result = await getDeliveryDashboard("event-1", "tenant-1");
      expect(result.totalDeliveries).toBe(4);
      expect(result.pending).toBe(1);
      expect(result.assembled).toBe(1);
      expect(result.delivered).toBe(2);
      expect(result.completionRate).toBe(50);
      expect(result.totalStock).toBe(80);
      expect(result.totalAllocated).toBe(15);
      expect(result.packages).toBe(3);
    });
  });

  describe("bulkAssignPackages", () => {
    it("assigns packages to unassigned participants", async () => {
      const { bulkAssignPackages } = await import("../gift-protocol.server");

      mockPackageFindMany.mockResolvedValue([
        { id: "pkg-1", name: "Default", forParticipantType: null },
      ]);
      mockDeliveryFindMany.mockResolvedValue([]);
      mockParticipantFindMany.mockResolvedValue([
        {
          id: "p-1",
          firstName: "John",
          lastName: "Doe",
          participantType: { id: "pt-1", name: "Delegate" },
        },
        {
          id: "p-2",
          firstName: "Jane",
          lastName: "Smith",
          participantType: null,
        },
      ]);
      mockDeliveryCreate.mockResolvedValue({});

      const result = await bulkAssignPackages("event-1", "tenant-1", CTX);
      expect(result.assigned).toBe(2);
      expect(mockDeliveryCreate).toHaveBeenCalledTimes(2);
    });
  });
});
