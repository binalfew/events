import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockTemplateCreate = vi.fn();
const mockTemplateFindMany = vi.fn();
const mockTemplateFindFirst = vi.fn();
const mockTemplateUpdate = vi.fn();
const mockTemplateDelete = vi.fn();
const mockTemplateCount = vi.fn();

const mockBroadcastCreate = vi.fn();
const mockBroadcastFindMany = vi.fn();
const mockBroadcastFindFirst = vi.fn();
const mockBroadcastUpdate = vi.fn();
const mockBroadcastCount = vi.fn();

const mockDeliveryCreate = vi.fn();
const mockDeliveryCreateMany = vi.fn();
const mockDeliveryFindMany = vi.fn();
const mockDeliveryUpdate = vi.fn();
const mockDeliveryUpdateMany = vi.fn();
const mockDeliveryCount = vi.fn();
const mockDeliveryGroupBy = vi.fn();

const mockParticipantFindMany = vi.fn();
const mockParticipantCount = vi.fn();

const mockUserFindFirst = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    messageTemplate: {
      create: (...args: unknown[]) => mockTemplateCreate(...args),
      findMany: (...args: unknown[]) => mockTemplateFindMany(...args),
      findFirst: (...args: unknown[]) => mockTemplateFindFirst(...args),
      update: (...args: unknown[]) => mockTemplateUpdate(...args),
      delete: (...args: unknown[]) => mockTemplateDelete(...args),
      count: (...args: unknown[]) => mockTemplateCount(...args),
    },
    broadcastMessage: {
      create: (...args: unknown[]) => mockBroadcastCreate(...args),
      findMany: (...args: unknown[]) => mockBroadcastFindMany(...args),
      findFirst: (...args: unknown[]) => mockBroadcastFindFirst(...args),
      update: (...args: unknown[]) => mockBroadcastUpdate(...args),
      count: (...args: unknown[]) => mockBroadcastCount(...args),
    },
    messageDelivery: {
      create: (...args: unknown[]) => mockDeliveryCreate(...args),
      createMany: (...args: unknown[]) => mockDeliveryCreateMany(...args),
      findMany: (...args: unknown[]) => mockDeliveryFindMany(...args),
      update: (...args: unknown[]) => mockDeliveryUpdate(...args),
      updateMany: (...args: unknown[]) => mockDeliveryUpdateMany(...args),
      count: (...args: unknown[]) => mockDeliveryCount(...args),
      groupBy: (...args: unknown[]) => mockDeliveryGroupBy(...args),
    },
    participant: {
      findMany: (...args: unknown[]) => mockParticipantFindMany(...args),
      count: (...args: unknown[]) => mockParticipantCount(...args),
    },
    user: {
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
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
  FEATURE_FLAG_KEYS: { COMMUNICATION_HUB: "FF_COMMUNICATION_HUB" },
}));

vi.mock("~/lib/event-bus.server", () => ({
  eventBus: { publish: vi.fn() },
}));

vi.mock("~/lib/env.server", () => ({
  env: {
    SMTP_HOST: "",
    SMTP_PORT: 587,
    SMTP_USER: "",
    SMTP_PASS: "",
    SMTP_FROM: "noreply@test.local",
  },
}));

vi.mock("~/services/notifications.server", () => ({
  createNotification: vi.fn().mockResolvedValue({ id: "notif-1" }),
}));

// ─── Helpers ─────────────────────────────────────────────

const CTX = {
  userId: "user-1",
  tenantId: "tenant-1",
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
};

function makeTemplate(overrides = {}) {
  return {
    id: "tmpl-1",
    tenantId: "tenant-1",
    name: "Welcome Email",
    subject: "Welcome {{firstName}}!",
    body: "Hello {{firstName}} {{lastName}}, welcome to {{eventName}}!",
    channel: "EMAIL",
    isSystem: false,
    variables: ["firstName", "lastName", "eventName"],
    createdBy: "user-1",
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeBroadcast(overrides = {}) {
  return {
    id: "bc-1",
    tenantId: "tenant-1",
    eventId: "event-1",
    templateId: null,
    subject: "Test Broadcast",
    body: "Hello everyone!",
    channel: "EMAIL",
    status: "DRAFT",
    filters: {},
    recipientCount: 0,
    sentCount: 0,
    failedCount: 0,
    deliveredCount: 0,
    bouncedCount: 0,
    isEmergency: false,
    priority: 5,
    scheduledAt: null,
    sentAt: null,
    completedAt: null,
    createdBy: "user-1",
    cancelledBy: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────

describe("communications.server", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({ id: "audit-1" });
    // Re-mock feature flag after resetAllMocks clears it
    const { isFeatureEnabled } = await import("~/lib/feature-flags.server");
    vi.mocked(isFeatureEnabled).mockResolvedValue(true);
  });

  // ─── Template CRUD ─────────────────────────────────────

  describe("Message Templates", () => {
    it("creates a template with audit log", async () => {
      const template = makeTemplate();
      mockTemplateCreate.mockResolvedValue(template);

      const { createTemplate } = await import("../message-templates.server");
      const result = await createTemplate(
        {
          name: "Welcome Email",
          body: "Hello {{firstName}}!",
          channel: "EMAIL",
          variables: ["firstName"],
        },
        CTX,
      );

      expect(result.id).toBe("tmpl-1");
      expect(mockTemplateCreate).toHaveBeenCalledTimes(1);
      expect(mockAuditLogCreate).toHaveBeenCalledTimes(1);
    });

    it("lists templates with pagination", async () => {
      const templates = [makeTemplate()];
      mockTemplateFindMany.mockResolvedValue(templates);
      mockTemplateCount.mockResolvedValue(1);

      const { listTemplates } = await import("../message-templates.server");
      const result = await listTemplates("tenant-1", { page: 1, perPage: 10 });

      expect(result.templates).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it("gets a template by ID", async () => {
      mockTemplateFindFirst.mockResolvedValue(makeTemplate());

      const { getTemplate } = await import("../message-templates.server");
      const result = await getTemplate("tmpl-1", "tenant-1");

      expect(result.name).toBe("Welcome Email");
    });

    it("updates a template", async () => {
      mockTemplateFindFirst.mockResolvedValue(makeTemplate());
      mockTemplateUpdate.mockResolvedValue(makeTemplate({ name: "Updated" }));

      const { updateTemplate } = await import("../message-templates.server");
      const result = await updateTemplate("tmpl-1", { name: "Updated" }, CTX);

      expect(result.name).toBe("Updated");
    });

    it("rejects updates to system templates", async () => {
      mockTemplateFindFirst.mockResolvedValue(makeTemplate({ isSystem: true }));

      const { updateTemplate } = await import("../message-templates.server");
      await expect(updateTemplate("tmpl-1", { name: "Updated" }, CTX)).rejects.toThrow(
        "System templates cannot be modified",
      );
    });

    it("deletes a template with audit log", async () => {
      mockTemplateFindFirst.mockResolvedValue(makeTemplate());
      mockTemplateDelete.mockResolvedValue(makeTemplate());

      const { deleteTemplate } = await import("../message-templates.server");
      await deleteTemplate("tmpl-1", CTX);

      expect(mockTemplateDelete).toHaveBeenCalledTimes(1);
      expect(mockAuditLogCreate).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Template Rendering ────────────────────────────────

  describe("Template Rendering", () => {
    it("replaces {{variables}} with provided values", async () => {
      const { renderTemplate } = await import("../message-templates.server");
      const result = renderTemplate("Hello {{firstName}} {{lastName}}!", {
        firstName: "John",
        lastName: "Doe",
      });
      expect(result).toBe("Hello John Doe!");
    });

    it("leaves unmatched {{variables}} as-is", async () => {
      const { renderTemplate } = await import("../message-templates.server");
      const result = renderTemplate("Hello {{firstName}} {{unknownVar}}!", {
        firstName: "John",
      });
      expect(result).toBe("Hello John {{unknownVar}}!");
    });

    it("handles templates with no variables", async () => {
      const { renderTemplate } = await import("../message-templates.server");
      const result = renderTemplate("No variables here!", {});
      expect(result).toBe("No variables here!");
    });
  });

  // ─── Audience Filter ───────────────────────────────────

  describe("Audience Filter", () => {
    it("counts audience with filters", async () => {
      mockParticipantCount.mockResolvedValue(42);

      const { countAudience } = await import("../audience-filter.server");
      const count = await countAudience("event-1", "tenant-1", {
        participantTypes: ["type-1"],
        statuses: ["APPROVED"] as any,
      });

      expect(count).toBe(42);
      expect(mockParticipantCount).toHaveBeenCalledTimes(1);
    });

    it("resolves audience contacts in batches", async () => {
      const contacts = [
        { id: "p-1", email: "a@test.com", firstName: "Alice", lastName: "A" },
        { id: "p-2", email: "b@test.com", firstName: "Bob", lastName: "B" },
      ];
      mockParticipantFindMany.mockResolvedValueOnce(contacts).mockResolvedValueOnce([]);

      const { resolveAudience } = await import("../audience-filter.server");
      const result = await resolveAudience("event-1", "tenant-1", {});

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe("a@test.com");
    });
  });

  // ─── Broadcast Pipeline ────────────────────────────────

  describe("Broadcasts", () => {
    it("creates a draft broadcast", async () => {
      const broadcast = makeBroadcast();
      mockBroadcastCreate.mockResolvedValue(broadcast);

      const { createBroadcast } = await import("../broadcasts.server");
      const result = await createBroadcast(
        {
          eventId: "event-1",
          body: "Hello everyone!",
          channel: "EMAIL",
          filters: {},
          isEmergency: false,
          priority: 5,
        },
        CTX,
      );

      expect(result.status).toBe("DRAFT");
      expect(mockBroadcastCreate).toHaveBeenCalledTimes(1);
    });

    it("sends a broadcast and creates deliveries", async () => {
      const broadcast = makeBroadcast();
      mockBroadcastFindFirst
        .mockResolvedValueOnce(broadcast) // from sendBroadcast lookup
        .mockResolvedValueOnce(broadcast); // final return
      mockBroadcastUpdate.mockResolvedValue(broadcast);
      mockDeliveryCreateMany.mockResolvedValue({ count: 2 });

      // Audience resolution
      mockParticipantFindMany
        .mockResolvedValueOnce([
          { id: "p-1", email: "a@test.com", firstName: "Alice", lastName: "A" },
          { id: "p-2", email: "b@test.com", firstName: "Bob", lastName: "B" },
        ])
        .mockResolvedValueOnce([]);

      const { sendBroadcast } = await import("../broadcasts.server");
      await sendBroadcast("bc-1", CTX);

      expect(mockBroadcastUpdate).toHaveBeenCalled();
      expect(mockDeliveryCreateMany).toHaveBeenCalledTimes(1);
    });

    it("cancels a broadcast and marks deliveries as failed", async () => {
      const broadcast = makeBroadcast({ status: "SENDING" });
      mockBroadcastFindFirst.mockResolvedValue(broadcast);
      mockDeliveryUpdateMany.mockResolvedValue({ count: 5 });
      mockBroadcastUpdate.mockResolvedValue({ ...broadcast, status: "CANCELLED" });

      const { cancelBroadcast } = await import("../broadcasts.server");
      const result = await cancelBroadcast("bc-1", "Test cancel", CTX);

      expect(result.status).toBe("CANCELLED");
      expect(mockDeliveryUpdateMany).toHaveBeenCalledTimes(1);
    });

    it("creates and sends emergency broadcast", async () => {
      const broadcast = makeBroadcast({ isEmergency: true, priority: 1 });
      mockBroadcastCreate.mockResolvedValue(broadcast);
      mockBroadcastFindFirst.mockResolvedValueOnce(broadcast).mockResolvedValueOnce(broadcast);
      mockBroadcastUpdate.mockResolvedValue(broadcast);
      mockParticipantFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const { sendEmergencyBroadcast } = await import("../broadcasts.server");
      await sendEmergencyBroadcast(
        {
          eventId: "event-1",
          body: "Emergency!",
          channel: "IN_APP",
          filters: {},
          isEmergency: true,
          priority: 1,
        },
        CTX,
      );

      expect(mockBroadcastCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isEmergency: true, priority: 1 }),
        }),
      );
    });
  });

  // ─── Delivery Job ──────────────────────────────────────

  describe("Delivery Job", () => {
    it("processes QUEUED deliveries", async () => {
      const delivery = {
        id: "del-1",
        broadcastId: "bc-1",
        channel: "EMAIL",
        recipient: "test@test.com",
        status: "QUEUED",
        retryCount: 0,
        nextRetryAt: null,
        broadcast: { tenantId: "tenant-1", subject: "Test", body: "Hello" },
        participant: { id: "p-1", firstName: "Alice", lastName: "A", email: "test@test.com" },
      };

      // Scheduled broadcasts
      mockBroadcastFindMany.mockResolvedValue([]);
      // QUEUED deliveries
      mockDeliveryFindMany.mockResolvedValue([delivery]);
      mockDeliveryUpdate.mockResolvedValue({ ...delivery, status: "SENT" });
      mockBroadcastUpdate.mockResolvedValue(makeBroadcast());
      mockDeliveryCount.mockResolvedValue(0); // no remaining
      mockBroadcastFindFirst.mockResolvedValue(makeBroadcast());

      const { processQueuedDeliveries } = await import("../jobs/broadcast-delivery-job.server");
      const result = await processQueuedDeliveries();

      expect(result.processed).toBe(1);
      expect(result.sent).toBe(1);
    });

    it("retries failed deliveries with exponential backoff", async () => {
      const delivery = {
        id: "del-1",
        broadcastId: "bc-1",
        channel: "EMAIL",
        recipient: "", // empty = will fail
        status: "QUEUED",
        retryCount: 0,
        nextRetryAt: null,
        broadcast: { tenantId: "tenant-1", subject: "Test", body: "Hello" },
        participant: { id: "p-1", firstName: "Alice", lastName: "A", email: null },
      };

      mockBroadcastFindMany.mockResolvedValue([]);
      mockDeliveryFindMany.mockResolvedValue([delivery]);
      mockDeliveryUpdate.mockResolvedValue(delivery);

      const { processQueuedDeliveries } = await import("../jobs/broadcast-delivery-job.server");
      const result = await processQueuedDeliveries();

      // Should set status back to QUEUED with retryCount=1 and nextRetryAt
      expect(mockDeliveryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "QUEUED",
            retryCount: 1,
            nextRetryAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  // ─── Feature Flag Gate ─────────────────────────────────

  describe("Feature Flag Gate", () => {
    it("throws when feature flag is disabled", async () => {
      const { isFeatureEnabled } = await import("~/lib/feature-flags.server");
      vi.mocked(isFeatureEnabled).mockResolvedValue(false);

      const { createBroadcast } = await import("../broadcasts.server");
      await expect(
        createBroadcast(
          {
            eventId: "event-1",
            body: "Hello",
            channel: "EMAIL",
            filters: {},
            isEmergency: false,
            priority: 5,
          },
          CTX,
        ),
      ).rejects.toThrow("Communication Hub is not enabled");
    });
  });
});
