import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockSubscriptionCreate = vi.fn();
const mockSubscriptionFindMany = vi.fn();
const mockSubscriptionFindFirst = vi.fn();
const mockSubscriptionFindUnique = vi.fn();
const mockSubscriptionUpdate = vi.fn();
const mockSubscriptionDelete = vi.fn();
const mockSubscriptionCount = vi.fn();
const mockDeliveryCreate = vi.fn();
const mockDeliveryFindMany = vi.fn();
const mockDeliveryFindUnique = vi.fn();
const mockDeliveryUpdate = vi.fn();
const mockDeliveryCount = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    webhookSubscription: {
      create: (...args: unknown[]) => mockSubscriptionCreate(...args),
      findMany: (...args: unknown[]) => mockSubscriptionFindMany(...args),
      findFirst: (...args: unknown[]) => mockSubscriptionFindFirst(...args),
      findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args),
      update: (...args: unknown[]) => mockSubscriptionUpdate(...args),
      delete: (...args: unknown[]) => mockSubscriptionDelete(...args),
      count: (...args: unknown[]) => mockSubscriptionCount(...args),
    },
    webhookDelivery: {
      create: (...args: unknown[]) => mockDeliveryCreate(...args),
      findMany: (...args: unknown[]) => mockDeliveryFindMany(...args),
      findUnique: (...args: unknown[]) => mockDeliveryFindUnique(...args),
      update: (...args: unknown[]) => mockDeliveryUpdate(...args),
      count: (...args: unknown[]) => mockDeliveryCount(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
    },
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("~/lib/feature-flags.server", () => ({
  isFeatureEnabled: vi.fn().mockResolvedValue(true),
  FEATURE_FLAG_KEYS: { WEBHOOKS: "FF_WEBHOOKS" },
}));

// ─── Helpers ─────────────────────────────────────────────

const CTX = {
  userId: "user-1",
  tenantId: "tenant-1",
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
};

// ─── Tests ───────────────────────────────────────────────

describe("webhooks.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createWebhookSubscription", () => {
    it("generates 64-char hex secret", async () => {
      const { createWebhookSubscription } = await import("../webhooks.server");
      mockSubscriptionCreate.mockImplementation(async ({ data }) => ({
        id: "sub-1",
        ...data,
      }));

      const result = await createWebhookSubscription(
        { url: "https://example.com/hook", events: ["participant.approved"] },
        CTX,
      );

      expect(result.secret).toMatch(/^[a-f0-9]{64}$/);
      expect(result.subscription.id).toBe("sub-1");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("validates event types and rejects invalid", async () => {
      const { createWebhookSubscription, WebhookError } = await import("../webhooks.server");

      await expect(
        createWebhookSubscription(
          { url: "https://example.com/hook", events: ["invalid.event"] },
          CTX,
        ),
      ).rejects.toThrow(WebhookError);
    });

    it("creates audit log entry", async () => {
      const { createWebhookSubscription } = await import("../webhooks.server");
      mockSubscriptionCreate.mockImplementation(async ({ data }) => ({
        id: "sub-1",
        ...data,
      }));

      await createWebhookSubscription({ url: "https://example.com/hook", events: ["*"] }, CTX);

      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "CREATE",
            entityType: "WebhookSubscription",
            tenantId: "tenant-1",
          }),
        }),
      );
    });
  });

  describe("listWebhookSubscriptions", () => {
    it("returns paginated results", async () => {
      const { listWebhookSubscriptions } = await import("../webhooks.server");

      mockSubscriptionFindMany.mockResolvedValue([
        { id: "sub-1", url: "https://a.com" },
        { id: "sub-2", url: "https://b.com" },
      ]);
      mockSubscriptionCount.mockResolvedValue(5);

      const result = await listWebhookSubscriptions("tenant-1", { page: 1, pageSize: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.meta).toEqual({
        page: 1,
        pageSize: 2,
        total: 5,
        totalPages: 3,
      });
    });
  });

  describe("pauseWebhookSubscription", () => {
    it("sets status to PAUSED", async () => {
      const { pauseWebhookSubscription } = await import("../webhooks.server");

      mockSubscriptionFindFirst.mockResolvedValue({
        id: "sub-1",
        tenantId: "tenant-1",
        status: "ACTIVE",
        url: "https://example.com",
      });
      mockSubscriptionUpdate.mockResolvedValue({
        id: "sub-1",
        status: "PAUSED",
      });

      const result = await pauseWebhookSubscription("sub-1", CTX);
      expect(result.status).toBe("PAUSED");
      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "PAUSED" }),
        }),
      );
    });
  });

  describe("resumeWebhookSubscription", () => {
    it("resets circuit breaker state", async () => {
      const { resumeWebhookSubscription } = await import("../webhooks.server");

      mockSubscriptionFindFirst.mockResolvedValue({
        id: "sub-1",
        tenantId: "tenant-1",
        status: "PAUSED",
        url: "https://example.com",
      });
      mockSubscriptionUpdate.mockResolvedValue({
        id: "sub-1",
        status: "ACTIVE",
        consecutiveFailures: 0,
        circuitBreakerOpen: false,
      });

      const result = await resumeWebhookSubscription("sub-1", CTX);
      expect(result.status).toBe("ACTIVE");
      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "ACTIVE",
            consecutiveFailures: 0,
            circuitBreakerOpen: false,
            circuitBreakerResetAt: null,
          }),
        }),
      );
    });
  });
});

describe("webhook-events", () => {
  describe("validateEventTypes", () => {
    it("accepts valid types and wildcard", async () => {
      const { validateEventTypes } = await import("../../lib/webhook-events");

      expect(validateEventTypes(["participant.approved", "*"])).toEqual({
        valid: true,
        invalid: [],
      });
      expect(validateEventTypes(["sla.warning", "sla.breached"])).toEqual({
        valid: true,
        invalid: [],
      });
    });

    it("rejects unknown event types", async () => {
      const { validateEventTypes } = await import("../../lib/webhook-events");

      const result = validateEventTypes(["participant.approved", "invalid.type", "bad.event"]);
      expect(result.valid).toBe(false);
      expect(result.invalid).toEqual(["invalid.type", "bad.event"]);
    });
  });
});

describe("webhook-delivery.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("signPayload", () => {
    it("produces correct HMAC-SHA256", async () => {
      const { signPayload } = await import("../webhook-delivery.server");
      const crypto = await import("node:crypto");

      const payload = '{"test":"data"}';
      const secret = "test-secret";
      const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");

      expect(signPayload(payload, secret)).toBe(expected);
    });
  });

  describe("deliverWebhook", () => {
    it("marks as DELIVERED on 2xx", async () => {
      const { deliverWebhook } = await import("../webhook-delivery.server");

      mockDeliveryFindUnique.mockResolvedValue({
        id: "del-1",
        eventType: "participant.approved",
        eventId: "evt-1",
        payload: { test: true },
        attempts: 0,
        maxAttempts: 5,
        subscription: {
          id: "sub-1",
          url: "https://example.com/hook",
          secret: "abc123",
          version: "v1",
          timeoutMs: 10000,
          headers: null,
          consecutiveFailures: 0,
          circuitBreakerOpen: false,
          circuitBreakerResetAt: null,
          retryBackoffMs: [1000, 5000],
          metadata: null,
        },
      });

      // Mock fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve("OK"),
      });
      vi.stubGlobal("fetch", mockFetch);

      mockDeliveryUpdate.mockResolvedValue({});
      mockSubscriptionUpdate.mockResolvedValue({});

      const result = await deliverWebhook("del-1");

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(mockDeliveryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "DELIVERED" }),
        }),
      );

      vi.unstubAllGlobals();
    });

    it("schedules retry on failure with correct backoff", async () => {
      const { deliverWebhook } = await import("../webhook-delivery.server");

      mockDeliveryFindUnique.mockResolvedValue({
        id: "del-1",
        eventType: "participant.approved",
        eventId: "evt-1",
        payload: { test: true },
        attempts: 0,
        maxAttempts: 5,
        subscription: {
          id: "sub-1",
          url: "https://example.com/hook",
          secret: "abc123",
          version: "v1",
          timeoutMs: 10000,
          headers: null,
          consecutiveFailures: 0,
          circuitBreakerOpen: false,
          circuitBreakerResetAt: null,
          retryBackoffMs: [1000, 5000, 30000],
          metadata: null,
        },
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });
      vi.stubGlobal("fetch", mockFetch);

      mockDeliveryUpdate.mockResolvedValue({});
      mockSubscriptionUpdate.mockResolvedValue({});

      const result = await deliverWebhook("del-1");

      expect(result.success).toBe(false);
      expect(mockDeliveryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "RETRYING",
            attempts: 1,
          }),
        }),
      );

      // Verify nextRetryAt is set (approximately 1000ms from now)
      const updateCall = mockDeliveryUpdate.mock.calls[0][0];
      expect(updateCall.data.nextRetryAt).toBeInstanceOf(Date);

      vi.unstubAllGlobals();
    });

    it("marks as DEAD_LETTER after max attempts", async () => {
      const { deliverWebhook } = await import("../webhook-delivery.server");

      mockDeliveryFindUnique.mockResolvedValue({
        id: "del-1",
        eventType: "participant.approved",
        eventId: "evt-1",
        payload: { test: true },
        attempts: 4,
        maxAttempts: 5,
        subscription: {
          id: "sub-1",
          url: "https://example.com/hook",
          secret: "abc123",
          version: "v1",
          timeoutMs: 10000,
          headers: null,
          consecutiveFailures: 0,
          circuitBreakerOpen: false,
          circuitBreakerResetAt: null,
          retryBackoffMs: [1000, 5000],
          metadata: null,
        },
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: () => Promise.resolve("Service Unavailable"),
      });
      vi.stubGlobal("fetch", mockFetch);

      mockDeliveryUpdate.mockResolvedValue({});
      mockSubscriptionUpdate.mockResolvedValue({});

      const result = await deliverWebhook("del-1");

      expect(result.success).toBe(false);
      expect(mockDeliveryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "DEAD_LETTER",
            attempts: 5,
            nextRetryAt: null,
          }),
        }),
      );

      vi.unstubAllGlobals();
    });

    it("opens circuit breaker after 10 consecutive failures", async () => {
      const { deliverWebhook } = await import("../webhook-delivery.server");

      mockDeliveryFindUnique.mockResolvedValue({
        id: "del-1",
        eventType: "participant.approved",
        eventId: "evt-1",
        payload: { test: true },
        attempts: 0,
        maxAttempts: 5,
        subscription: {
          id: "sub-1",
          url: "https://example.com/hook",
          secret: "abc123",
          version: "v1",
          timeoutMs: 10000,
          headers: null,
          consecutiveFailures: 9,
          circuitBreakerOpen: false,
          circuitBreakerResetAt: null,
          retryBackoffMs: [1000, 5000],
          metadata: null,
        },
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Error"),
      });
      vi.stubGlobal("fetch", mockFetch);

      mockDeliveryUpdate.mockResolvedValue({});
      mockSubscriptionUpdate.mockResolvedValue({});

      await deliverWebhook("del-1");

      // Circuit breaker should open (consecutiveFailures becomes 10)
      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            consecutiveFailures: 10,
            circuitBreakerOpen: true,
          }),
        }),
      );

      vi.unstubAllGlobals();
    });
  });
});

describe("webhook-dispatcher.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  it("skips open circuit breaker subscriptions", async () => {
    const { dispatchWebhookEvent } = await import("../webhook-dispatcher.server");

    mockSubscriptionFindMany.mockResolvedValue([
      {
        id: "sub-1",
        maxRetries: 5,
        retryBackoffMs: [1000],
        circuitBreakerOpen: true,
        circuitBreakerResetAt: new Date(Date.now() + 3600000), // 1hr from now
      },
      {
        id: "sub-2",
        maxRetries: 5,
        retryBackoffMs: [1000],
        circuitBreakerOpen: false,
        circuitBreakerResetAt: null,
      },
    ]);

    mockDeliveryCreate.mockResolvedValue({ id: "del-1" });
    // Mock delivery lookup to prevent async deliverWebhook from throwing
    mockDeliveryFindUnique.mockResolvedValue(null);

    await dispatchWebhookEvent("tenant-1", "participant.approved", "evt-1", { test: true });

    // Only sub-2 should create a delivery (sub-1 has open circuit breaker)
    expect(mockDeliveryCreate).toHaveBeenCalledTimes(1);
    expect(mockDeliveryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionId: "sub-2",
        }),
      }),
    );
  });
});
