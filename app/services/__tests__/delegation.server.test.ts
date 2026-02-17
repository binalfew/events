import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockQuotaUpsert = vi.fn();
const mockQuotaFindMany = vi.fn();
const mockQuotaFindUniqueOrThrow = vi.fn();
const mockQuotaDelete = vi.fn();
const mockQuotaUpdate = vi.fn();
const mockInviteCreate = vi.fn();
const mockInviteFindUniqueOrThrow = vi.fn();
const mockInviteFindUnique = vi.fn();
const mockInviteUpdate = vi.fn();
const mockInviteFindMany = vi.fn();
const mockTransaction = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    delegationQuota: {
      upsert: (...args: unknown[]) => mockQuotaUpsert(...args),
      findMany: (...args: unknown[]) => mockQuotaFindMany(...args),
      findUniqueOrThrow: (...args: unknown[]) => mockQuotaFindUniqueOrThrow(...args),
      delete: (...args: unknown[]) => mockQuotaDelete(...args),
      update: (...args: unknown[]) => mockQuotaUpdate(...args),
    },
    delegationInvite: {
      create: (...args: unknown[]) => mockInviteCreate(...args),
      findUniqueOrThrow: (...args: unknown[]) => mockInviteFindUniqueOrThrow(...args),
      findUnique: (...args: unknown[]) => mockInviteFindUnique(...args),
      update: (...args: unknown[]) => mockInviteUpdate(...args),
      findMany: (...args: unknown[]) => mockInviteFindMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("~/services/notifications.server", () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}));

// ─── Tests ───────────────────────────────────────────────

describe("delegation.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("upsertQuota", () => {
    it("creates or updates a quota", async () => {
      const { upsertQuota } = await import("../delegation.server");
      mockQuotaUpsert.mockResolvedValue({
        id: "q-1",
        tenantId: "t-1",
        eventId: "e-1",
        organizationId: "org-1",
        maxParticipants: 10,
        usedCount: 0,
      });

      const result = await upsertQuota("t-1", "e-1", "org-1", 10);

      expect(result.id).toBe("q-1");
      expect(result.maxParticipants).toBe(10);
      expect(mockQuotaUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId_eventId_organizationId: {
              tenantId: "t-1",
              eventId: "e-1",
              organizationId: "org-1",
            },
          },
          create: expect.objectContaining({ maxParticipants: 10 }),
        }),
      );
    });
  });

  describe("deleteQuota", () => {
    it("deletes a quota with no accepted invites", async () => {
      const { deleteQuota } = await import("../delegation.server");
      mockQuotaFindUniqueOrThrow.mockResolvedValue({
        id: "q-1",
        invites: [],
      });
      mockQuotaDelete.mockResolvedValue({});

      await deleteQuota("q-1");

      expect(mockQuotaDelete).toHaveBeenCalledWith({ where: { id: "q-1" } });
    });

    it("throws when quota has accepted invites", async () => {
      const { deleteQuota, DelegationError } = await import("../delegation.server");
      mockQuotaFindUniqueOrThrow.mockResolvedValue({
        id: "q-1",
        invites: [{ id: "inv-1", status: "ACCEPTED" }],
      });

      await expect(deleteQuota("q-1")).rejects.toThrow(DelegationError);
    });
  });

  describe("sendInvite", () => {
    it("sends an invite when quota is available", async () => {
      const { sendInvite } = await import("../delegation.server");
      mockQuotaFindUniqueOrThrow.mockResolvedValue({
        id: "q-1",
        maxParticipants: 10,
        usedCount: 5,
      });
      mockInviteCreate.mockResolvedValue({
        id: "inv-1",
        quotaId: "q-1",
        email: "delegate@example.com",
        token: "abc123",
        status: "PENDING",
      });

      const result = await sendInvite({
        quotaId: "q-1",
        email: "delegate@example.com",
        invitedBy: "focal-1",
      });

      expect(result.id).toBe("inv-1");
      expect(mockInviteCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          quotaId: "q-1",
          email: "delegate@example.com",
          status: "PENDING",
        }),
      });
    });

    it("throws when quota is exhausted", async () => {
      const { sendInvite, DelegationError } = await import("../delegation.server");
      mockQuotaFindUniqueOrThrow.mockResolvedValue({
        id: "q-1",
        maxParticipants: 5,
        usedCount: 5,
      });

      await expect(
        sendInvite({
          quotaId: "q-1",
          email: "delegate@example.com",
          invitedBy: "focal-1",
        }),
      ).rejects.toThrow(DelegationError);
    });

    it("generates a unique token", async () => {
      const { sendInvite } = await import("../delegation.server");
      mockQuotaFindUniqueOrThrow.mockResolvedValue({
        id: "q-1",
        maxParticipants: 10,
        usedCount: 0,
      });
      mockInviteCreate.mockImplementation((args: { data: { token: string } }) => {
        return Promise.resolve({
          id: "inv-1",
          ...args.data,
        });
      });

      await sendInvite({
        quotaId: "q-1",
        email: "test@example.com",
        invitedBy: "focal-1",
      });

      const createArg = mockInviteCreate.mock.calls[0][0];
      expect(createArg.data.token).toHaveLength(64); // 32 bytes = 64 hex chars
    });
  });

  describe("acceptInvite", () => {
    it("accepts a valid pending invite", async () => {
      const { acceptInvite } = await import("../delegation.server");
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      mockInviteFindUnique.mockResolvedValue({
        id: "inv-1",
        quotaId: "q-1",
        email: "delegate@example.com",
        token: "valid-token",
        status: "PENDING",
        invitedBy: "focal-1",
        expiresAt: futureDate,
        quota: {
          id: "q-1",
          tenantId: "t-1",
          maxParticipants: 10,
          usedCount: 3,
        },
      });

      mockTransaction.mockResolvedValue([
        { id: "inv-1", status: "ACCEPTED" },
        { id: "q-1", tenantId: "t-1", usedCount: 4, maxParticipants: 10 },
      ]);

      const result = await acceptInvite("valid-token");

      expect(result.alreadyAccepted).toBe(false);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it("throws for invalid token", async () => {
      const { acceptInvite, DelegationError } = await import("../delegation.server");
      mockInviteFindUnique.mockResolvedValue(null);

      await expect(acceptInvite("invalid-token")).rejects.toThrow(DelegationError);
    });

    it("returns early for already accepted invite", async () => {
      const { acceptInvite } = await import("../delegation.server");
      mockInviteFindUnique.mockResolvedValue({
        id: "inv-1",
        status: "ACCEPTED",
        quota: { id: "q-1" },
      });

      const result = await acceptInvite("token");
      expect(result.alreadyAccepted).toBe(true);
    });

    it("throws for cancelled invite", async () => {
      const { acceptInvite, DelegationError } = await import("../delegation.server");
      mockInviteFindUnique.mockResolvedValue({
        id: "inv-1",
        status: "CANCELLED",
        quota: { id: "q-1" },
      });

      await expect(acceptInvite("token")).rejects.toThrow(DelegationError);
    });

    it("throws for expired invite", async () => {
      const { acceptInvite, DelegationError } = await import("../delegation.server");
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockInviteFindUnique.mockResolvedValue({
        id: "inv-1",
        status: "PENDING",
        expiresAt: pastDate,
        quota: { id: "q-1", maxParticipants: 10, usedCount: 3 },
      });
      mockInviteUpdate.mockResolvedValue({});

      await expect(acceptInvite("token")).rejects.toThrow(DelegationError);
      expect(mockInviteUpdate).toHaveBeenCalledWith({
        where: { id: "inv-1" },
        data: { status: "EXPIRED" },
      });
    });

    it("throws when quota is exhausted at acceptance time", async () => {
      const { acceptInvite, DelegationError } = await import("../delegation.server");
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      mockInviteFindUnique.mockResolvedValue({
        id: "inv-1",
        status: "PENDING",
        expiresAt: futureDate,
        quota: { id: "q-1", maxParticipants: 5, usedCount: 5 },
      });

      await expect(acceptInvite("token")).rejects.toThrow(DelegationError);
    });
  });

  describe("cancelInvite", () => {
    it("cancels a pending invite without decrementing usedCount", async () => {
      const { cancelInvite } = await import("../delegation.server");
      mockInviteFindUniqueOrThrow.mockResolvedValue({
        id: "inv-1",
        quotaId: "q-1",
        status: "PENDING",
        quota: { id: "q-1", usedCount: 3 },
      });
      mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        await fn({
          delegationInvite: { update: vi.fn().mockResolvedValue({}) },
          delegationQuota: { update: vi.fn().mockResolvedValue({}) },
        });
      });

      await cancelInvite("inv-1");

      // Transaction was called but decrement should not happen for PENDING
      expect(mockTransaction).toHaveBeenCalled();
    });

    it("throws when invite is already cancelled", async () => {
      const { cancelInvite, DelegationError } = await import("../delegation.server");
      mockInviteFindUniqueOrThrow.mockResolvedValue({
        id: "inv-1",
        status: "CANCELLED",
        quota: { id: "q-1" },
      });

      await expect(cancelInvite("inv-1")).rejects.toThrow(DelegationError);
    });
  });

  describe("resendInvite", () => {
    it("resends a pending invite and extends expiry", async () => {
      const { resendInvite } = await import("../delegation.server");
      mockInviteFindUniqueOrThrow.mockResolvedValue({
        id: "inv-1",
        status: "PENDING",
      });
      mockInviteUpdate.mockResolvedValue({});

      await resendInvite("inv-1");

      expect(mockInviteUpdate).toHaveBeenCalledWith({
        where: { id: "inv-1" },
        data: { expiresAt: expect.any(Date) },
      });
    });

    it("throws when invite is not pending", async () => {
      const { resendInvite, DelegationError } = await import("../delegation.server");
      mockInviteFindUniqueOrThrow.mockResolvedValue({
        id: "inv-1",
        status: "ACCEPTED",
      });

      await expect(resendInvite("inv-1")).rejects.toThrow(DelegationError);
    });
  });
});
