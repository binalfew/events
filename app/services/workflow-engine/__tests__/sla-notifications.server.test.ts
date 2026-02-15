import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuditCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    auditLog: {
      create: mockAuditCreate,
    },
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const participant = {
  id: "p-1",
  firstName: "John",
  lastName: "Doe",
  registrationCode: "REG-001",
  tenantId: "tenant-1",
};

const step = { id: "step-1", name: "Review" };

describe("sla-notifications.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditCreate.mockResolvedValue({});
  });

  describe("sendSLAWarningNotification", () => {
    it("creates audit log entry with UPDATE action", async () => {
      const { sendSLAWarningNotification } = await import("../sla-notifications.server");

      await sendSLAWarningNotification(participant, step, 10);

      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: "tenant-1",
          userId: "SYSTEM",
          action: "UPDATE",
          entityType: "SLAWarning",
          entityId: "p-1",
        }),
      });
    });

    it("includes remaining minutes in metadata", async () => {
      const { sendSLAWarningNotification } = await import("../sla-notifications.server");

      await sendSLAWarningNotification(participant, step, 15);

      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            remainingMinutes: 15,
            stepId: "step-1",
          }),
        }),
      });
    });
  });

  describe("sendSLABreachNotification", () => {
    it("creates audit log entry with SLA_BREACH action", async () => {
      const { sendSLABreachNotification } = await import("../sla-notifications.server");

      await sendSLABreachNotification(participant, step, 30);

      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: "tenant-1",
          userId: "SYSTEM",
          action: "SLA_BREACH",
          entityType: "Participant",
          entityId: "p-1",
        }),
      });
    });

    it("includes overdue minutes in metadata", async () => {
      const { sendSLABreachNotification } = await import("../sla-notifications.server");

      await sendSLABreachNotification(participant, step, 45);

      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            overdueMinutes: 45,
            stepId: "step-1",
          }),
        }),
      });
    });
  });
});
