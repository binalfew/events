import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockCheckpointCreate = vi.fn();
const mockCheckpointFindMany = vi.fn();
const mockCheckpointFindFirst = vi.fn();
const mockCheckpointUpdate = vi.fn();
const mockCheckpointDelete = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    checkpoint: {
      create: (...args: unknown[]) => mockCheckpointCreate(...args),
      findMany: (...args: unknown[]) => mockCheckpointFindMany(...args),
      findFirst: (...args: unknown[]) => mockCheckpointFindFirst(...args),
      update: (...args: unknown[]) => mockCheckpointUpdate(...args),
      delete: (...args: unknown[]) => mockCheckpointDelete(...args),
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

describe("checkpoints.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createCheckpoint", () => {
    it("creates a checkpoint with correct data and audit log", async () => {
      const { createCheckpoint } = await import("../checkpoints.server");
      mockCheckpointCreate.mockImplementation(async ({ data }) => ({
        id: "cp-1",
        ...data,
      }));

      const result = await createCheckpoint(
        {
          eventId: "event-1",
          name: "Main Gate",
          type: "gate",
          direction: "entry",
        },
        CTX,
      );

      expect(result.name).toBe("Main Gate");
      expect(result.tenantId).toBe("tenant-1");
      expect(mockCheckpointCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: "tenant-1",
            eventId: "event-1",
            name: "Main Gate",
            type: "gate",
            direction: "entry",
          }),
        }),
      );
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("toggleCheckpoint", () => {
    it("toggles active state and creates audit log", async () => {
      const { toggleCheckpoint } = await import("../checkpoints.server");

      mockCheckpointFindFirst.mockResolvedValue({
        id: "cp-1",
        tenantId: "tenant-1",
        name: "Main Gate",
        isActive: true,
      });
      mockCheckpointUpdate.mockResolvedValue({
        id: "cp-1",
        name: "Main Gate",
        isActive: false,
      });

      const result = await toggleCheckpoint("cp-1", CTX);

      expect(result.isActive).toBe(false);
      expect(mockCheckpointUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "cp-1" },
          data: { isActive: false },
        }),
      );
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "CONFIGURE",
            description: expect.stringContaining("Deactivated"),
          }),
        }),
      );
    });
  });
});
