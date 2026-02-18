import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockZoneCreate = vi.fn();
const mockZoneFindFirst = vi.fn();
const mockZoneFindMany = vi.fn();
const mockPermitCreate = vi.fn();
const mockPermitFindFirst = vi.fn();
const mockPermitCount = vi.fn();
const mockPermitUpdate = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    parkingZone: {
      create: (...args: unknown[]) => mockZoneCreate(...args),
      findFirst: (...args: unknown[]) => mockZoneFindFirst(...args),
      findMany: (...args: unknown[]) => mockZoneFindMany(...args),
    },
    parkingPermit: {
      create: (...args: unknown[]) => mockPermitCreate(...args),
      findFirst: (...args: unknown[]) => mockPermitFindFirst(...args),
      count: (...args: unknown[]) => mockPermitCount(...args),
      update: (...args: unknown[]) => mockPermitUpdate(...args),
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

describe("parking.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createParkingZone", () => {
    it("creates zone and audit log", async () => {
      const { createParkingZone } = await import("../parking.server");

      mockZoneCreate.mockImplementation(async ({ data }: any) => ({
        id: "zone-1",
        ...data,
      }));

      const result = await createParkingZone(
        { eventId: "event-1", name: "VIP Parking", code: "VIP-A", capacity: 50 },
        CTX,
      );

      expect(result.id).toBe("zone-1");
      expect(result.name).toBe("VIP Parking");
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "CREATE",
            entityType: "ParkingZone",
          }),
        }),
      );
    });
  });

  describe("listParkingZones", () => {
    it("returns zones with permit counts", async () => {
      const { listParkingZones } = await import("../parking.server");

      mockZoneFindMany.mockResolvedValue([
        { id: "zone-1", name: "VIP", code: "VIP-A", capacity: 50, _count: { permits: 10 } },
      ]);

      const result = await listParkingZones("event-1", "tenant-1");
      expect(result).toHaveLength(1);
      expect(result[0]._count.permits).toBe(10);
    });
  });

  describe("issuePermit", () => {
    it("creates permit with unique number", async () => {
      const { issuePermit } = await import("../parking.server");

      mockZoneFindFirst.mockResolvedValue({
        id: "zone-1",
        tenantId: "tenant-1",
        name: "VIP",
        capacity: 50,
      });
      mockPermitCount.mockResolvedValue(10); // 10 active, under capacity
      mockPermitCreate.mockImplementation(async ({ data }: any) => ({
        id: "permit-1",
        ...data,
        zone: { name: "VIP" },
        participant: null,
      }));

      const result = await issuePermit(
        {
          eventId: "event-1",
          zoneId: "zone-1",
          validFrom: "2026-03-01T08:00:00",
          validUntil: "2026-03-05T18:00:00",
          vehiclePlate: "AB-1234",
        },
        CTX,
      );

      expect(result.id).toBe("permit-1");
      expect(result.permitNumber).toMatch(/^PK-/);
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when zone is at full capacity", async () => {
      const { issuePermit } = await import("../parking.server");

      mockZoneFindFirst.mockResolvedValue({
        id: "zone-1",
        tenantId: "tenant-1",
        capacity: 5,
      });
      mockPermitCount.mockResolvedValue(5); // at capacity

      await expect(
        issuePermit(
          {
            eventId: "event-1",
            zoneId: "zone-1",
            validFrom: "2026-03-01T08:00:00",
            validUntil: "2026-03-05T18:00:00",
          },
          CTX,
        ),
      ).rejects.toThrow("Parking zone is at full capacity");
    });

    it("throws 404 when zone not found", async () => {
      const { issuePermit } = await import("../parking.server");

      mockZoneFindFirst.mockResolvedValue(null);

      await expect(
        issuePermit(
          {
            eventId: "event-1",
            zoneId: "bad-id",
            validFrom: "2026-03-01T08:00:00",
            validUntil: "2026-03-05T18:00:00",
          },
          CTX,
        ),
      ).rejects.toThrow("Parking zone not found");
    });
  });

  describe("revokePermit", () => {
    it("revokes active permit with reason", async () => {
      const { revokePermit } = await import("../parking.server");

      mockPermitFindFirst.mockResolvedValue({
        id: "permit-1",
        tenantId: "tenant-1",
        status: "ACTIVE",
      });
      mockPermitUpdate.mockResolvedValue({ id: "permit-1", status: "REVOKED" });

      const result = await revokePermit("permit-1", "Vehicle violation", CTX);
      expect(result.status).toBe("REVOKED");
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: "Revoked parking permit: Vehicle violation",
          }),
        }),
      );
    });

    it("throws when already revoked", async () => {
      const { revokePermit } = await import("../parking.server");

      mockPermitFindFirst.mockResolvedValue({
        id: "permit-1",
        tenantId: "tenant-1",
        status: "REVOKED",
      });

      await expect(revokePermit("permit-1", "reason", CTX)).rejects.toThrow(
        "Permit is already revoked",
      );
    });
  });

  describe("scanPermit", () => {
    it("grants access for valid active permit", async () => {
      const { scanPermit } = await import("../parking.server");

      const now = new Date();
      mockPermitFindFirst.mockResolvedValue({
        id: "permit-1",
        tenantId: "tenant-1",
        status: "ACTIVE",
        validFrom: new Date(now.getTime() - 60000),
        validUntil: new Date(now.getTime() + 60000),
        zoneId: "zone-1",
        zone: { name: "VIP", code: "VIP-A" },
      });

      const result = await scanPermit("permit-1", CTX);
      expect(result.granted).toBe(true);
      expect(result.zone.name).toBe("VIP");
    });

    it("denies access for revoked permit", async () => {
      const { scanPermit } = await import("../parking.server");

      mockPermitFindFirst.mockResolvedValue({
        id: "permit-1",
        tenantId: "tenant-1",
        status: "REVOKED",
        zone: { name: "VIP" },
      });

      await expect(scanPermit("permit-1", CTX)).rejects.toThrow("access denied");
    });

    it("denies access for expired validity period", async () => {
      const { scanPermit } = await import("../parking.server");

      mockPermitFindFirst.mockResolvedValue({
        id: "permit-1",
        tenantId: "tenant-1",
        status: "ACTIVE",
        validFrom: new Date("2025-01-01"),
        validUntil: new Date("2025-01-02"),
        zone: { name: "VIP" },
      });

      await expect(scanPermit("permit-1", CTX)).rejects.toThrow("validity period");
    });
  });

  describe("getParkingStats", () => {
    it("returns correct stats with zone occupancy", async () => {
      const { getParkingStats } = await import("../parking.server");

      mockPermitCount
        .mockResolvedValueOnce(20) // ACTIVE
        .mockResolvedValueOnce(5) // EXPIRED
        .mockResolvedValueOnce(2) // REVOKED
        .mockResolvedValueOnce(1); // SUSPENDED
      mockZoneFindMany.mockResolvedValue([
        { id: "z-1", name: "VIP", code: "VIP-A", capacity: 30, _count: { permits: 15 } },
        { id: "z-2", name: "General", code: "GEN", capacity: 100, _count: { permits: 5 } },
      ]);

      const result = await getParkingStats("event-1", "tenant-1");
      expect(result.active).toBe(20);
      expect(result.total).toBe(28);
      expect(result.totalCapacity).toBe(130);
      expect(result.occupancyRate).toBe(15); // 20/130 ≈ 15%
      expect(result.zones).toHaveLength(2);
      expect(result.zones[0].occupancyRate).toBe(50); // 15/30
    });
  });
});
