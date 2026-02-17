import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockAccessLogCreate = vi.fn();
const mockCheckpointFindFirst = vi.fn();
const mockParticipantFindFirst = vi.fn();
const mockAccessLogFindFirst = vi.fn();
const mockAccessLogFindMany = vi.fn();
const mockAccessLogCount = vi.fn();
const mockVenueOccupancyFindUnique = vi.fn();
const mockVenueOccupancyUpdate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    accessLog: {
      create: (...args: unknown[]) => mockAccessLogCreate(...args),
      findFirst: (...args: unknown[]) => mockAccessLogFindFirst(...args),
      findMany: (...args: unknown[]) => mockAccessLogFindMany(...args),
      count: (...args: unknown[]) => mockAccessLogCount(...args),
    },
    checkpoint: {
      findFirst: (...args: unknown[]) => mockCheckpointFindFirst(...args),
    },
    participant: {
      findFirst: (...args: unknown[]) => mockParticipantFindFirst(...args),
    },
    venueOccupancy: {
      findUnique: (...args: unknown[]) => mockVenueOccupancyFindUnique(...args),
      update: (...args: unknown[]) => mockVenueOccupancyUpdate(...args),
    },
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("~/lib/env.server", () => ({
  env: {
    QR_ENCRYPTION_KEY: "a".repeat(64),
  },
}));

// ─── Helpers ─────────────────────────────────────────────

const CTX = {
  userId: "user-1",
  tenantId: "tenant-1",
  checkpointId: "cp-1",
};

function makeParticipant(overrides = {}) {
  return {
    id: "part-1",
    firstName: "John",
    lastName: "Doe",
    registrationCode: "REG-001",
    status: "APPROVED",
    eventId: "event-1",
    event: { id: "event-1", endDate: new Date(Date.now() + 86400000) }, // tomorrow
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────

describe("check-in.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAccessLogCreate.mockResolvedValue({ id: "log-1" });
    mockVenueOccupancyFindUnique.mockResolvedValue(null);
  });

  describe("processScan", () => {
    it("returns VALID for a good QR payload", async () => {
      const { generateQRPayload } = await import("../qr-code.server");
      const { processScan } = await import("../check-in.server");

      const payload = generateQRPayload("part-1", "tenant-1", "event-1");

      mockParticipantFindFirst.mockResolvedValue(makeParticipant());
      mockCheckpointFindFirst.mockResolvedValue({
        id: "cp-1",
        tenantId: "tenant-1",
        isActive: true,
        direction: "entry",
      });
      mockAccessLogFindFirst.mockResolvedValue(null); // no duplicate

      const result = await processScan(payload, CTX);

      expect(result.result).toBe("VALID");
      expect(result.participantName).toBe("John Doe");
      expect(result.accessLogId).toBe("log-1");
    });

    it("returns INVALID for garbled QR data", async () => {
      const { processScan } = await import("../check-in.server");

      const result = await processScan("garbled-data", CTX);

      expect(result.result).toBe("INVALID");
      expect(result.message).toContain("Invalid");
    });

    it("returns INVALID when tenant does not match", async () => {
      const { generateQRPayload } = await import("../qr-code.server");
      const { processScan } = await import("../check-in.server");

      const payload = generateQRPayload("part-1", "other-tenant", "event-1");

      const result = await processScan(payload, CTX);

      expect(result.result).toBe("INVALID");
      expect(result.message).toContain("different organization");
    });

    it("returns REVOKED for cancelled participant", async () => {
      const { generateQRPayload } = await import("../qr-code.server");
      const { processScan } = await import("../check-in.server");

      const payload = generateQRPayload("part-1", "tenant-1", "event-1");
      mockParticipantFindFirst.mockResolvedValue(makeParticipant({ status: "CANCELLED" }));

      const result = await processScan(payload, CTX);

      expect(result.result).toBe("REVOKED");
    });

    it("returns EXPIRED when event has ended", async () => {
      const { generateQRPayload } = await import("../qr-code.server");
      const { processScan } = await import("../check-in.server");

      const payload = generateQRPayload("part-1", "tenant-1", "event-1");
      mockParticipantFindFirst.mockResolvedValue(
        makeParticipant({
          event: { id: "event-1", endDate: new Date("2020-01-01") },
        }),
      );

      const result = await processScan(payload, CTX);

      expect(result.result).toBe("EXPIRED");
    });

    it("returns ALREADY_SCANNED for duplicate scan", async () => {
      const { generateQRPayload } = await import("../qr-code.server");
      const { processScan } = await import("../check-in.server");

      const payload = generateQRPayload("part-1", "tenant-1", "event-1");
      mockParticipantFindFirst.mockResolvedValue(makeParticipant());
      mockCheckpointFindFirst.mockResolvedValue({
        id: "cp-1",
        tenantId: "tenant-1",
        isActive: true,
        direction: "entry",
      });
      mockAccessLogFindFirst.mockResolvedValue({ id: "existing-log" });

      const result = await processScan(payload, CTX);

      expect(result.result).toBe("ALREADY_SCANNED");
    });

    it("returns MANUAL_OVERRIDE when override reason provided for duplicate", async () => {
      const { generateQRPayload } = await import("../qr-code.server");
      const { processScan } = await import("../check-in.server");

      const payload = generateQRPayload("part-1", "tenant-1", "event-1");
      mockParticipantFindFirst.mockResolvedValue(makeParticipant());
      mockCheckpointFindFirst.mockResolvedValue({
        id: "cp-1",
        tenantId: "tenant-1",
        isActive: true,
        direction: "entry",
      });
      mockAccessLogFindFirst.mockResolvedValue({ id: "existing-log" });

      const result = await processScan(payload, CTX, "VIP re-entry");

      expect(result.result).toBe("MANUAL_OVERRIDE");
    });
  });

  describe("processManualEntry", () => {
    it("returns VALID for a matching registration code", async () => {
      const { processManualEntry } = await import("../check-in.server");

      mockParticipantFindFirst.mockResolvedValue(makeParticipant());
      mockCheckpointFindFirst.mockResolvedValue({
        id: "cp-1",
        direction: "entry",
      });

      const result = await processManualEntry("REG-001", CTX);

      expect(result.result).toBe("VALID");
      expect(result.participantName).toBe("John Doe");
    });

    it("returns INVALID for unknown registration code", async () => {
      const { processManualEntry } = await import("../check-in.server");

      mockParticipantFindFirst.mockResolvedValue(null);

      const result = await processManualEntry("UNKNOWN-CODE", CTX);

      expect(result.result).toBe("INVALID");
      expect(result.message).toContain("not found");
    });
  });
});
