import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockCompanionCreate = vi.fn();
const mockCompanionFindFirst = vi.fn();
const mockCompanionFindMany = vi.fn();
const mockCompanionUpdate = vi.fn();
const mockCompanionDelete = vi.fn();
const mockActivityCreate = vi.fn();
const mockActivityFindFirst = vi.fn();
const mockActivityFindMany = vi.fn();
const mockActivityUpdate = vi.fn();
const mockActivityDelete = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    companion: {
      create: (...args: unknown[]) => mockCompanionCreate(...args),
      findFirst: (...args: unknown[]) => mockCompanionFindFirst(...args),
      findMany: (...args: unknown[]) => mockCompanionFindMany(...args),
      update: (...args: unknown[]) => mockCompanionUpdate(...args),
      delete: (...args: unknown[]) => mockCompanionDelete(...args),
    },
    companionActivity: {
      create: (...args: unknown[]) => mockActivityCreate(...args),
      findFirst: (...args: unknown[]) => mockActivityFindFirst(...args),
      findMany: (...args: unknown[]) => mockActivityFindMany(...args),
      update: (...args: unknown[]) => mockActivityUpdate(...args),
      delete: (...args: unknown[]) => mockActivityDelete(...args),
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

describe("companion.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("registerCompanion", () => {
    it("creates companion with registration code and audit log", async () => {
      const { registerCompanion } = await import("../companion.server");

      mockCompanionCreate.mockImplementation(async ({ data }: any) => ({
        id: "comp-1",
        ...data,
        primaryParticipant: { id: "p-1", firstName: "John", lastName: "Doe" },
      }));

      const result = await registerCompanion(
        {
          eventId: "event-1",
          primaryParticipantId: "p-1",
          firstName: "Jane",
          lastName: "Doe",
          type: "SPOUSE",
        },
        CTX,
      );

      expect(result.id).toBe("comp-1");
      expect(result.firstName).toBe("Jane");
      expect(result.type).toBe("SPOUSE");
      expect(result.registrationCode).toMatch(/^CMP-/);
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("listCompanions", () => {
    it("returns companions with participant info", async () => {
      const { listCompanions } = await import("../companion.server");

      mockCompanionFindMany.mockResolvedValue([
        {
          id: "comp-1",
          firstName: "Jane",
          lastName: "Doe",
          type: "SPOUSE",
          primaryParticipant: { id: "p-1", firstName: "John", lastName: "Doe" },
          activities: [],
        },
      ]);

      const result = await listCompanions("event-1", "tenant-1");
      expect(result).toHaveLength(1);
      expect(result[0].primaryParticipant.firstName).toBe("John");
    });

    it("filters by type", async () => {
      const { listCompanions } = await import("../companion.server");

      mockCompanionFindMany.mockResolvedValue([]);

      await listCompanions("event-1", "tenant-1", "AIDE");
      expect(mockCompanionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: "event-1", tenantId: "tenant-1", type: "AIDE" },
        }),
      );
    });
  });

  describe("updateCompanion", () => {
    it("updates companion fields", async () => {
      const { updateCompanion } = await import("../companion.server");

      mockCompanionFindFirst.mockResolvedValue({
        id: "comp-1",
        tenantId: "tenant-1",
        firstName: "Jane",
        lastName: "Doe",
        type: "SPOUSE",
        email: null,
        phone: null,
        passportNumber: null,
        nationality: null,
      });
      mockCompanionUpdate.mockImplementation(async ({ data }: any) => ({
        id: "comp-1",
        ...data,
      }));

      const result = await updateCompanion("comp-1", { firstName: "Janet" }, CTX);
      expect(result.firstName).toBe("Janet");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when not found", async () => {
      const { updateCompanion } = await import("../companion.server");

      mockCompanionFindFirst.mockResolvedValue(null);

      await expect(updateCompanion("comp-x", {}, CTX)).rejects.toThrow("not found");
    });
  });

  describe("removeCompanion", () => {
    it("deletes companion and creates audit log", async () => {
      const { removeCompanion } = await import("../companion.server");

      mockCompanionFindFirst.mockResolvedValue({
        id: "comp-1",
        tenantId: "tenant-1",
        firstName: "Jane",
        lastName: "Doe",
      });
      mockCompanionDelete.mockResolvedValue({});

      const result = await removeCompanion("comp-1", CTX);
      expect(result.success).toBe(true);
      expect(mockCompanionDelete).toHaveBeenCalled();
    });
  });

  describe("createActivity", () => {
    it("creates activity and audit log", async () => {
      const { createActivity } = await import("../companion.server");

      mockActivityCreate.mockImplementation(async ({ data }: any) => ({
        id: "act-1",
        ...data,
      }));

      const result = await createActivity(
        {
          eventId: "event-1",
          name: "City Tour",
          date: "2026-03-01",
          startTime: "2026-03-01T09:00:00Z",
          endTime: "2026-03-01T12:00:00Z",
          location: "City Center",
          capacity: 30,
          transportIncluded: true,
          cost: 0,
        },
        CTX,
      );

      expect(result.id).toBe("act-1");
      expect(result.name).toBe("City Tour");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("signUpForActivity", () => {
    it("signs up companion and increments counter", async () => {
      const { signUpForActivity } = await import("../companion.server");

      mockCompanionFindFirst.mockResolvedValue({
        id: "comp-1",
        tenantId: "tenant-1",
        firstName: "Jane",
        lastName: "Doe",
      });
      mockActivityFindFirst
        .mockResolvedValueOnce({
          id: "act-1",
          tenantId: "tenant-1",
          eventId: "event-1",
          name: "City Tour",
          description: null,
          date: new Date("2026-03-01"),
          startTime: new Date("2026-03-01T09:00:00Z"),
          endTime: new Date("2026-03-01T12:00:00Z"),
          location: "City Center",
          capacity: 30,
          currentSignups: 5,
          transportIncluded: true,
          cost: 0,
        })
        .mockResolvedValueOnce(null); // no existing sign-up
      mockActivityCreate.mockImplementation(async ({ data }: any) => ({
        id: "signup-1",
        ...data,
      }));
      mockActivityUpdate.mockResolvedValue({});

      const result = await signUpForActivity("comp-1", "act-1", CTX);
      expect(result.id).toBe("signup-1");
      expect(mockActivityUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { currentSignups: { increment: 1 } },
        }),
      );
    });

    it("throws when at full capacity", async () => {
      const { signUpForActivity } = await import("../companion.server");

      mockCompanionFindFirst.mockResolvedValue({ id: "comp-1", tenantId: "tenant-1" });
      mockActivityFindFirst.mockResolvedValueOnce({
        id: "act-1",
        tenantId: "tenant-1",
        capacity: 10,
        currentSignups: 10,
      });

      await expect(signUpForActivity("comp-1", "act-1", CTX)).rejects.toThrow("full capacity");
    });

    it("throws when already signed up", async () => {
      const { signUpForActivity } = await import("../companion.server");

      mockCompanionFindFirst.mockResolvedValue({ id: "comp-1", tenantId: "tenant-1" });
      mockActivityFindFirst
        .mockResolvedValueOnce({
          id: "act-1",
          tenantId: "tenant-1",
          eventId: "event-1",
          name: "Tour",
          date: new Date("2026-03-01"),
          capacity: 30,
          currentSignups: 5,
        })
        .mockResolvedValueOnce({ id: "existing-signup" }); // already signed up

      await expect(signUpForActivity("comp-1", "act-1", CTX)).rejects.toThrow("already signed up");
    });
  });

  describe("cancelActivitySignUp", () => {
    it("removes sign-up and decrements counter", async () => {
      const { cancelActivitySignUp } = await import("../companion.server");

      mockActivityFindFirst
        .mockResolvedValueOnce({
          id: "act-1",
          tenantId: "tenant-1",
          name: "City Tour",
          date: new Date("2026-03-01"),
          companionId: null,
        })
        .mockResolvedValueOnce({ id: "signup-1" }); // existing sign-up
      mockActivityDelete.mockResolvedValue({});
      mockActivityUpdate.mockResolvedValue({});

      const result = await cancelActivitySignUp("comp-1", "act-1", CTX);
      expect(result.success).toBe(true);
      expect(mockActivityDelete).toHaveBeenCalled();
      expect(mockActivityUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { currentSignups: { decrement: 1 } },
        }),
      );
    });
  });

  describe("getCompanionStats", () => {
    it("returns correct stats", async () => {
      const { getCompanionStats } = await import("../companion.server");

      mockCompanionFindMany.mockResolvedValue([
        { type: "SPOUSE" },
        { type: "SPOUSE" },
        { type: "AIDE" },
      ]);
      mockActivityFindMany.mockResolvedValue([
        { capacity: 30, currentSignups: 20 },
        { capacity: 20, currentSignups: 10 },
      ]);

      const result = await getCompanionStats("event-1", "tenant-1");
      expect(result.totalCompanions).toBe(3);
      expect(result.byType.SPOUSE).toBe(2);
      expect(result.byType.AIDE).toBe(1);
      expect(result.totalActivities).toBe(2);
      expect(result.totalCapacity).toBe(50);
      expect(result.totalSignups).toBe(30);
      expect(result.fillRate).toBe(60);
    });
  });
});
