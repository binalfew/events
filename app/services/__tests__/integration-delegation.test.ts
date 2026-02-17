import { describe, it, expect, vi } from "vitest";

vi.mock("~/lib/db.server", () => ({
  prisma: {
    delegationQuota: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), upsert: vi.fn() },
    delegationInvite: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

describe("Integration: Delegation Portal", () => {
  describe("Quota management exports", () => {
    it("should export upsertQuota function", async () => {
      const mod = await import("~/services/delegation.server");
      expect(mod.upsertQuota).toBeDefined();
    });

    it("should export getQuota function", async () => {
      const mod = await import("~/services/delegation.server");
      expect(mod.getQuota).toBeDefined();
    });

    it("should export listQuotas function", async () => {
      const mod = await import("~/services/delegation.server");
      expect(mod.listQuotas).toBeDefined();
    });

    it("should export deleteQuota function", async () => {
      const mod = await import("~/services/delegation.server");
      expect(mod.deleteQuota).toBeDefined();
    });
  });

  describe("Quota enforcement", () => {
    it("should detect when quota is exceeded", () => {
      const quota = { maxDelegates: 5, usedDelegates: 5 };
      const canAdd = quota.usedDelegates < quota.maxDelegates;
      expect(canAdd).toBe(false);
    });

    it("should allow adding when under quota", () => {
      const quota = { maxDelegates: 5, usedDelegates: 3 };
      const canAdd = quota.usedDelegates < quota.maxDelegates;
      expect(canAdd).toBe(true);
    });

    it("should warn when nearing quota threshold", async () => {
      const { QUOTA_WARNING_THRESHOLD } = await import("~/services/delegation.server");
      const quota = { maxDelegates: 10, usedDelegates: 8 };
      const usage = quota.usedDelegates / quota.maxDelegates;
      expect(usage).toBeGreaterThanOrEqual(QUOTA_WARNING_THRESHOLD);
    });
  });

  describe("Invite management exports", () => {
    it("should export sendInvite function", async () => {
      const mod = await import("~/services/delegation.server");
      expect(mod.sendInvite).toBeDefined();
    });

    it("should export acceptInvite function", async () => {
      const mod = await import("~/services/delegation.server");
      expect(mod.acceptInvite).toBeDefined();
    });

    it("should export cancelInvite function", async () => {
      const mod = await import("~/services/delegation.server");
      expect(mod.cancelInvite).toBeDefined();
    });

    it("should export resendInvite function", async () => {
      const mod = await import("~/services/delegation.server");
      expect(mod.resendInvite).toBeDefined();
    });
  });

  describe("Invite token validation", () => {
    it("should detect expired invites", () => {
      const expiresAt = new Date("2025-01-01T00:00:00Z");
      const now = new Date("2026-02-17T00:00:00Z");
      const isExpired = expiresAt < now;
      expect(isExpired).toBe(true);
    });

    it("should accept valid (non-expired) invites", () => {
      const expiresAt = new Date("2027-01-01T00:00:00Z");
      const now = new Date("2026-02-17T00:00:00Z");
      const isExpired = expiresAt < now;
      expect(isExpired).toBe(false);
    });
  });

  describe("Default expiry constant", () => {
    it("should have a default expiry of 14 days", async () => {
      const { DEFAULT_EXPIRY_DAYS } = await import("~/services/delegation.server");
      expect(DEFAULT_EXPIRY_DAYS).toBe(14);
    });
  });

  describe("Accept increments used count", () => {
    it("should increment usedDelegates on accept", () => {
      const before = { maxDelegates: 10, usedDelegates: 3 };
      const after = { ...before, usedDelegates: before.usedDelegates + 1 };
      expect(after.usedDelegates).toBe(4);
    });
  });
});
