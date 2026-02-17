import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockApiKeyCreate = vi.fn();
const mockApiKeyFindMany = vi.fn();
const mockApiKeyFindFirst = vi.fn();
const mockApiKeyFindUnique = vi.fn();
const mockApiKeyUpdate = vi.fn();
const mockApiKeyCount = vi.fn();
const mockAuditLogCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    apiKey: {
      create: (...args: unknown[]) => mockApiKeyCreate(...args),
      findMany: (...args: unknown[]) => mockApiKeyFindMany(...args),
      findFirst: (...args: unknown[]) => mockApiKeyFindFirst(...args),
      findUnique: (...args: unknown[]) => mockApiKeyFindUnique(...args),
      update: (...args: unknown[]) => mockApiKeyUpdate(...args),
      count: (...args: unknown[]) => mockApiKeyCount(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("~/lib/env.server", () => ({
  env: { BCRYPT_ROUNDS: 4 },
}));

// ─── Helpers ─────────────────────────────────────────────

const CTX = {
  userId: "user-1",
  tenantId: "tenant-1",
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
};

// ─── Tests ───────────────────────────────────────────────

describe("api-keys.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createApiKey", () => {
    it("creates a key with correct format and returns raw key", async () => {
      const { createApiKey } = await import("../api-keys.server");
      mockApiKeyCreate.mockImplementation(async ({ data }) => ({
        id: "key-1",
        ...data,
      }));

      const result = await createApiKey({ name: "Test Key", permissions: ["events:read"] }, CTX);

      expect(result.rawKey).toMatch(/^ak_tena_[a-f0-9]{64}$/);
      expect(result.apiKey.name).toBe("Test Key");
      expect(result.apiKey.keyPrefix).toBe(result.rawKey.slice(0, 8));
      expect(mockApiKeyCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: "tenant-1",
            name: "Test Key",
            permissions: ["events:read"],
          }),
        }),
      );
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("stores bcrypt hash, not raw key", async () => {
      const { createApiKey } = await import("../api-keys.server");
      mockApiKeyCreate.mockImplementation(async ({ data }) => ({
        id: "key-1",
        ...data,
      }));

      const result = await createApiKey({ name: "Test", permissions: ["events:read"] }, CTX);

      const createCall = mockApiKeyCreate.mock.calls[0][0];
      expect(createCall.data.keyHash).not.toBe(result.rawKey);
      expect(createCall.data.keyHash).toMatch(/^\$2[aby]?\$/);
    });
  });

  describe("validateApiKey", () => {
    it("returns context for valid active key", async () => {
      const bcryptjs = await import("bcryptjs");
      const rawKey = "ak_test_" + "a".repeat(64);
      const keyHash = await bcryptjs.hash(rawKey, 4);

      mockApiKeyFindMany.mockResolvedValue([
        {
          id: "key-1",
          tenantId: "tenant-1",
          keyHash,
          keyPrefix: "ak_test_",
          permissions: ["events:read"],
          status: "ACTIVE",
          rateLimitTier: "STANDARD",
          rateLimitCustom: null,
          expiresAt: null,
          rotationGraceEnd: null,
        },
      ]);

      const { validateApiKey } = await import("../api-keys.server");
      const result = await validateApiKey(rawKey);

      expect(result).toEqual({
        tenantId: "tenant-1",
        permissions: ["events:read"],
        apiKeyId: "key-1",
        rateLimitTier: "STANDARD",
        rateLimitCustom: null,
      });
    });

    it("returns null for invalid key", async () => {
      mockApiKeyFindMany.mockResolvedValue([]);

      const { validateApiKey } = await import("../api-keys.server");
      const result = await validateApiKey("ak_test_invalid");

      expect(result).toBeNull();
    });

    it("returns null for expired key", async () => {
      const bcryptjs = await import("bcryptjs");
      const rawKey = "ak_test_" + "b".repeat(64);
      const keyHash = await bcryptjs.hash(rawKey, 4);

      mockApiKeyFindMany.mockResolvedValue([
        {
          id: "key-2",
          tenantId: "tenant-1",
          keyHash,
          keyPrefix: "ak_test_",
          permissions: ["events:read"],
          status: "ACTIVE",
          rateLimitTier: "STANDARD",
          rateLimitCustom: null,
          expiresAt: new Date("2020-01-01"),
          rotationGraceEnd: null,
        },
      ]);

      const { validateApiKey } = await import("../api-keys.server");
      const result = await validateApiKey(rawKey);

      expect(result).toBeNull();
    });

    it("returns null for key without ak_ prefix", async () => {
      const { validateApiKey } = await import("../api-keys.server");
      const result = await validateApiKey("invalid_key_format");

      expect(result).toBeNull();
    });

    it("allows rotated key within grace period", async () => {
      const bcryptjs = await import("bcryptjs");
      const rawKey = "ak_test_" + "c".repeat(64);
      const keyHash = await bcryptjs.hash(rawKey, 4);

      mockApiKeyFindMany.mockResolvedValue([
        {
          id: "key-3",
          tenantId: "tenant-1",
          keyHash,
          keyPrefix: "ak_test_",
          permissions: ["events:read"],
          status: "ROTATED",
          rateLimitTier: "ELEVATED",
          rateLimitCustom: null,
          expiresAt: null,
          rotationGraceEnd: new Date(Date.now() + 3600000), // 1hr from now
        },
      ]);

      const { validateApiKey } = await import("../api-keys.server");
      const result = await validateApiKey(rawKey);

      expect(result).not.toBeNull();
      expect(result!.apiKeyId).toBe("key-3");
    });

    it("rejects rotated key past grace period", async () => {
      const bcryptjs = await import("bcryptjs");
      const rawKey = "ak_test_" + "d".repeat(64);
      const keyHash = await bcryptjs.hash(rawKey, 4);

      mockApiKeyFindMany.mockResolvedValue([
        {
          id: "key-4",
          tenantId: "tenant-1",
          keyHash,
          keyPrefix: "ak_test_",
          permissions: ["events:read"],
          status: "ROTATED",
          rateLimitTier: "STANDARD",
          rateLimitCustom: null,
          expiresAt: null,
          rotationGraceEnd: new Date("2020-01-01"), // past
        },
      ]);

      const { validateApiKey } = await import("../api-keys.server");
      const result = await validateApiKey(rawKey);

      expect(result).toBeNull();
    });
  });

  describe("revokeApiKey", () => {
    it("revokes an active key", async () => {
      const { revokeApiKey } = await import("../api-keys.server");

      mockApiKeyFindFirst.mockResolvedValue({
        id: "key-1",
        tenantId: "tenant-1",
        status: "ACTIVE",
        name: "Test Key",
      });
      mockApiKeyUpdate.mockResolvedValue({
        id: "key-1",
        status: "REVOKED",
        name: "Test Key",
      });

      const result = await revokeApiKey("key-1", CTX);

      expect(result.status).toBe("REVOKED");
      expect(mockApiKeyUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "key-1" },
          data: expect.objectContaining({ status: "REVOKED" }),
        }),
      );
    });

    it("throws for already revoked key", async () => {
      const { revokeApiKey, ApiKeyError } = await import("../api-keys.server");

      mockApiKeyFindFirst.mockResolvedValue({
        id: "key-1",
        tenantId: "tenant-1",
        status: "REVOKED",
      });

      await expect(revokeApiKey("key-1", CTX)).rejects.toThrow(ApiKeyError);
    });
  });

  describe("listApiKeys", () => {
    it("returns paginated results", async () => {
      const { listApiKeys } = await import("../api-keys.server");

      mockApiKeyFindMany.mockResolvedValue([
        { id: "key-1", name: "Key 1" },
        { id: "key-2", name: "Key 2" },
      ]);
      mockApiKeyCount.mockResolvedValue(5);

      const result = await listApiKeys("tenant-1", { page: 1, pageSize: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.meta).toEqual({
        page: 1,
        pageSize: 2,
        total: 5,
        totalPages: 3,
      });
    });

    it("caps pageSize at 100", async () => {
      const { listApiKeys } = await import("../api-keys.server");

      mockApiKeyFindMany.mockResolvedValue([]);
      mockApiKeyCount.mockResolvedValue(0);

      await listApiKeys("tenant-1", { pageSize: 500 });

      expect(mockApiKeyFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
    });
  });
});

describe("api-permission.server", () => {
  it("allows exact permission match", async () => {
    const { checkApiPermission } = await import("../api-permission.server");
    expect(checkApiPermission(["events:read"], "events:read")).toBe(true);
  });

  it("rejects non-matching permission", async () => {
    const { checkApiPermission } = await import("../api-permission.server");
    expect(checkApiPermission(["events:read"], "events:write")).toBe(false);
  });

  it("allows wildcard permission", async () => {
    const { checkApiPermission } = await import("../api-permission.server");
    expect(checkApiPermission(["events:*"], "events:read")).toBe(true);
    expect(checkApiPermission(["events:*"], "events:delete")).toBe(true);
  });

  it("wildcard does not match different resource", async () => {
    const { checkApiPermission } = await import("../api-permission.server");
    expect(checkApiPermission(["events:*"], "participants:read")).toBe(false);
  });

  it("full wildcard matches everything", async () => {
    const { checkApiPermission } = await import("../api-permission.server");
    expect(checkApiPermission(["*"], "anything:here")).toBe(true);
  });

  it("maps HTTP methods to actions", async () => {
    const { methodToAction } = await import("../api-permission.server");
    expect(methodToAction("GET")).toBe("read");
    expect(methodToAction("POST")).toBe("create");
    expect(methodToAction("PUT")).toBe("update");
    expect(methodToAction("PATCH")).toBe("update");
    expect(methodToAction("DELETE")).toBe("delete");
  });
});
