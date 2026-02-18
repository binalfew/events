import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockMealPlanCreate = vi.fn();
const mockMealPlanFindFirst = vi.fn();
const mockMealPlanFindMany = vi.fn();
const mockMealPlanCount = vi.fn();
const mockMealSessionCreate = vi.fn();
const mockMealSessionFindFirst = vi.fn();
const mockMealVoucherCreate = vi.fn();
const mockMealVoucherFindFirst = vi.fn();
const mockMealVoucherCount = vi.fn();
const mockMealVoucherUpdate = vi.fn();
const mockMealVoucherGroupBy = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    mealPlan: {
      create: (...args: unknown[]) => mockMealPlanCreate(...args),
      findFirst: (...args: unknown[]) => mockMealPlanFindFirst(...args),
      findMany: (...args: unknown[]) => mockMealPlanFindMany(...args),
      count: (...args: unknown[]) => mockMealPlanCount(...args),
    },
    mealSession: {
      create: (...args: unknown[]) => mockMealSessionCreate(...args),
      findFirst: (...args: unknown[]) => mockMealSessionFindFirst(...args),
    },
    mealVoucher: {
      create: (...args: unknown[]) => mockMealVoucherCreate(...args),
      findFirst: (...args: unknown[]) => mockMealVoucherFindFirst(...args),
      count: (...args: unknown[]) => mockMealVoucherCount(...args),
      update: (...args: unknown[]) => mockMealVoucherUpdate(...args),
      groupBy: (...args: unknown[]) => mockMealVoucherGroupBy(...args),
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

describe("catering.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createMealPlan", () => {
    it("creates meal plan and audit log", async () => {
      const { createMealPlan } = await import("../catering.server");

      mockMealPlanCreate.mockImplementation(async ({ data }: any) => ({
        id: "mp-1",
        ...data,
      }));

      const result = await createMealPlan(
        { eventId: "event-1", name: "Day 1 Meals", date: "2026-03-01" },
        CTX,
      );

      expect(result.id).toBe("mp-1");
      expect(result.name).toBe("Day 1 Meals");
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "CREATE",
            entityType: "MealPlan",
          }),
        }),
      );
    });
  });

  describe("listMealPlans", () => {
    it("returns meal plans with sessions", async () => {
      const { listMealPlans } = await import("../catering.server");

      mockMealPlanFindMany.mockResolvedValue([
        {
          id: "mp-1",
          name: "Day 1",
          sessions: [{ id: "s-1", mealType: "BREAKFAST", _count: { vouchers: 10 } }],
        },
      ]);

      const result = await listMealPlans("event-1", "tenant-1");
      expect(result).toHaveLength(1);
      expect(result[0].sessions[0]._count.vouchers).toBe(10);
    });
  });

  describe("createMealSession", () => {
    it("creates meal session under plan", async () => {
      const { createMealSession } = await import("../catering.server");

      mockMealPlanFindFirst.mockResolvedValue({ id: "mp-1", tenantId: "tenant-1" });
      mockMealSessionCreate.mockImplementation(async ({ data }: any) => ({
        id: "s-1",
        ...data,
      }));

      const result = await createMealSession(
        {
          mealPlanId: "mp-1",
          mealType: "LUNCH",
          venue: "Grand Ballroom",
          startTime: "2026-03-01T12:00:00",
          endTime: "2026-03-01T14:00:00",
        },
        CTX,
      );

      expect(result.id).toBe("s-1");
      expect(result.mealType).toBe("LUNCH");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws 404 when meal plan not found", async () => {
      const { createMealSession } = await import("../catering.server");

      mockMealPlanFindFirst.mockResolvedValue(null);

      await expect(
        createMealSession(
          {
            mealPlanId: "bad-id",
            mealType: "LUNCH",
            venue: "Room A",
            startTime: "2026-03-01T12:00:00",
            endTime: "2026-03-01T14:00:00",
          },
          CTX,
        ),
      ).rejects.toThrow("Meal plan not found");
    });
  });

  describe("getDietaryAggregation", () => {
    it("returns counts by dietary category", async () => {
      const { getDietaryAggregation } = await import("../catering.server");

      mockMealVoucherGroupBy.mockResolvedValue([
        { dietaryCategory: "REGULAR", _count: { id: 50 } },
        { dietaryCategory: "HALAL", _count: { id: 15 } },
        { dietaryCategory: "VEGETARIAN", _count: { id: 10 } },
      ]);

      const result = await getDietaryAggregation("event-1", "tenant-1");
      expect(result.REGULAR).toBe(50);
      expect(result.HALAL).toBe(15);
      expect(result.VEGETARIAN).toBe(10);
    });
  });

  describe("issueMealVoucher", () => {
    it("creates voucher with QR code", async () => {
      const { issueMealVoucher } = await import("../catering.server");

      mockMealSessionFindFirst.mockResolvedValue({
        id: "s-1",
        mealPlan: { tenantId: "tenant-1", eventId: "event-1" },
      });
      mockMealVoucherCreate.mockImplementation(async ({ data }: any) => ({
        id: "v-1",
        ...data,
        participant: { firstName: "Jane", lastName: "Doe" },
      }));

      const result = await issueMealVoucher(
        { mealSessionId: "s-1", participantId: "p-1", dietaryCategory: "HALAL" },
        CTX,
      );

      expect(result.id).toBe("v-1");
      expect(result.qrCode).toMatch(/^MV-/);
      expect(result.dietaryCategory).toBe("HALAL");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws 404 when session not found", async () => {
      const { issueMealVoucher } = await import("../catering.server");

      mockMealSessionFindFirst.mockResolvedValue(null);

      await expect(
        issueMealVoucher(
          { mealSessionId: "bad-id", participantId: "p-1", dietaryCategory: "REGULAR" },
          CTX,
        ),
      ).rejects.toThrow("Meal session not found");
    });
  });

  describe("redeemMealVoucher", () => {
    it("marks voucher as redeemed", async () => {
      const { redeemMealVoucher } = await import("../catering.server");

      mockMealVoucherFindFirst.mockResolvedValue({
        id: "v-1",
        tenantId: "tenant-1",
        isRedeemed: false,
        mealSessionId: "s-1",
      });
      mockMealVoucherUpdate.mockResolvedValue({
        id: "v-1",
        isRedeemed: true,
        redeemedBy: "user-1",
      });

      const result = await redeemMealVoucher("v-1", CTX);
      expect(result.isRedeemed).toBe(true);
      expect(mockMealVoucherUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isRedeemed: true,
            redeemedBy: "user-1",
          }),
        }),
      );
    });

    it("throws when already redeemed", async () => {
      const { redeemMealVoucher } = await import("../catering.server");

      mockMealVoucherFindFirst.mockResolvedValue({
        id: "v-1",
        tenantId: "tenant-1",
        isRedeemed: true,
      });

      await expect(redeemMealVoucher("v-1", CTX)).rejects.toThrow(
        "Voucher has already been redeemed",
      );
    });

    it("throws 404 when voucher not found", async () => {
      const { redeemMealVoucher } = await import("../catering.server");

      mockMealVoucherFindFirst.mockResolvedValue(null);

      await expect(redeemMealVoucher("bad-id", CTX)).rejects.toThrow("Meal voucher not found");
    });
  });

  describe("getMealDashboard", () => {
    it("returns correct stats", async () => {
      const { getMealDashboard } = await import("../catering.server");

      mockMealVoucherCount
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60); // redeemed
      mockMealPlanCount.mockResolvedValue(3);
      mockMealVoucherGroupBy.mockResolvedValue([
        { dietaryCategory: "REGULAR", _count: { id: 70 } },
        { dietaryCategory: "HALAL", _count: { id: 30 } },
      ]);

      const result = await getMealDashboard("event-1", "tenant-1");
      expect(result.totalVouchers).toBe(100);
      expect(result.redeemed).toBe(60);
      expect(result.unredeemed).toBe(40);
      expect(result.redemptionRate).toBe(60);
      expect(result.mealPlans).toBe(3);
      expect(result.dietaryBreakdown.REGULAR).toBe(70);
    });
  });

  describe("exportCateringSheet", () => {
    it("returns formatted export data", async () => {
      const { exportCateringSheet } = await import("../catering.server");

      mockMealPlanFindMany.mockResolvedValue([
        {
          name: "Day 1",
          date: new Date("2026-03-01"),
          sessions: [
            {
              mealType: "LUNCH",
              venue: "Hall A",
              startTime: new Date("2026-03-01T12:00:00"),
              endTime: new Date("2026-03-01T14:00:00"),
              capacity: 200,
              vouchers: [
                { dietaryCategory: "REGULAR", isRedeemed: true },
                { dietaryCategory: "REGULAR", isRedeemed: false },
                { dietaryCategory: "HALAL", isRedeemed: true },
              ],
            },
          ],
        },
      ]);

      const result = await exportCateringSheet("event-1", "tenant-1");
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe("2026-03-01");
      expect(result[0].sessions[0].totalGuests).toBe(3);
      expect(result[0].sessions[0].redeemed).toBe(2);
      expect(result[0].sessions[0].dietaryCounts.REGULAR).toBe(2);
      expect(result[0].sessions[0].dietaryCounts.HALAL).toBe(1);
    });
  });
});
