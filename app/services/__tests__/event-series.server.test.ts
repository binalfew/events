import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockSeriesCreate = vi.fn();
const mockSeriesFindFirst = vi.fn();
const mockSeriesFindMany = vi.fn();
const mockEditionCreate = vi.fn();
const mockEditionFindFirst = vi.fn();
const mockEditionDelete = vi.fn();
const mockParticipantFindFirst = vi.fn();
const mockParticipantFindMany = vi.fn();
const mockAccessLogFindMany = vi.fn();
const mockAccommFindMany = vi.fn();
const mockSurveyResponseFindMany = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    eventSeries: {
      create: (...args: unknown[]) => mockSeriesCreate(...args),
      findFirst: (...args: unknown[]) => mockSeriesFindFirst(...args),
      findMany: (...args: unknown[]) => mockSeriesFindMany(...args),
    },
    eventEdition: {
      create: (...args: unknown[]) => mockEditionCreate(...args),
      findFirst: (...args: unknown[]) => mockEditionFindFirst(...args),
      delete: (...args: unknown[]) => mockEditionDelete(...args),
    },
    participant: {
      findFirst: (...args: unknown[]) => mockParticipantFindFirst(...args),
      findMany: (...args: unknown[]) => mockParticipantFindMany(...args),
    },
    accessLog: {
      findMany: (...args: unknown[]) => mockAccessLogFindMany(...args),
    },
    accommodationAssignment: {
      findMany: (...args: unknown[]) => mockAccommFindMany(...args),
    },
    surveyResponse: {
      findMany: (...args: unknown[]) => mockSurveyResponseFindMany(...args),
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

describe("event-series.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createSeries", () => {
    it("creates series and audit log", async () => {
      const { createSeries } = await import("../event-series.server");

      mockSeriesCreate.mockImplementation(async ({ data }: any) => ({
        id: "series-1",
        ...data,
      }));

      const result = await createSeries({ name: "AU Summit", description: "Annual summit" }, CTX);

      expect(result.id).toBe("series-1");
      expect(result.name).toBe("AU Summit");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("addEdition", () => {
    it("adds edition to series", async () => {
      const { addEdition } = await import("../event-series.server");

      mockSeriesFindFirst.mockResolvedValue({
        id: "series-1",
        tenantId: "tenant-1",
        name: "AU Summit",
      });
      mockEditionCreate.mockImplementation(async ({ data }: any) => ({
        id: "edition-1",
        ...data,
        event: { id: "event-1", name: "AU Summit 2025" },
      }));

      const result = await addEdition(
        {
          seriesId: "series-1",
          eventId: "event-1",
          editionNumber: 1,
          year: 2025,
          hostCountry: "Ethiopia",
          hostCity: "Addis Ababa",
        },
        CTX,
      );

      expect(result.id).toBe("edition-1");
      expect(result.editionNumber).toBe(1);
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when series not found", async () => {
      const { addEdition } = await import("../event-series.server");

      mockSeriesFindFirst.mockResolvedValue(null);

      await expect(
        addEdition({ seriesId: "missing", eventId: "event-1", editionNumber: 1, year: 2025 }, CTX),
      ).rejects.toThrow("Series not found");
    });
  });

  describe("removeEdition", () => {
    it("removes edition from series", async () => {
      const { removeEdition } = await import("../event-series.server");

      mockEditionFindFirst.mockResolvedValue({
        id: "edition-1",
        series: { tenantId: "tenant-1" },
      });
      mockEditionDelete.mockResolvedValue({});

      const result = await removeEdition("edition-1", CTX);

      expect(result.success).toBe(true);
      expect(mockEditionDelete).toHaveBeenCalled();
    });

    it("throws when edition not found", async () => {
      const { removeEdition } = await import("../event-series.server");

      mockEditionFindFirst.mockResolvedValue(null);

      await expect(removeEdition("missing", CTX)).rejects.toThrow("Edition not found");
    });
  });

  describe("getYoYComparison", () => {
    it("returns metrics for each edition", async () => {
      const { getYoYComparison } = await import("../event-series.server");

      mockSeriesFindFirst.mockResolvedValue({
        id: "series-1",
        tenantId: "tenant-1",
        name: "AU Summit",
        editions: [
          {
            id: "ed-1",
            editionNumber: 1,
            year: 2024,
            eventId: "event-1",
            event: { id: "event-1", name: "Summit 2024" },
          },
          {
            id: "ed-2",
            editionNumber: 2,
            year: 2025,
            eventId: "event-2",
            event: { id: "event-2", name: "Summit 2025" },
          },
        ],
      });

      // Edition 1 data
      mockParticipantFindMany
        .mockResolvedValueOnce([
          {
            status: "APPROVED",
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-03"),
          },
          {
            status: "APPROVED",
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-02"),
          },
          {
            status: "REJECTED",
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          },
        ])
        // Edition 2 data
        .mockResolvedValueOnce([
          {
            status: "APPROVED",
            createdAt: new Date("2025-01-01"),
            updatedAt: new Date("2025-01-02"),
          },
          {
            status: "APPROVED",
            createdAt: new Date("2025-01-01"),
            updatedAt: new Date("2025-01-02"),
          },
          {
            status: "PENDING",
            createdAt: new Date("2025-01-01"),
            updatedAt: new Date("2025-01-01"),
          },
          {
            status: "APPROVED",
            createdAt: new Date("2025-01-01"),
            updatedAt: new Date("2025-01-03"),
          },
        ]);

      mockAccessLogFindMany.mockResolvedValue([{ scanResult: "VALID" }]);
      mockAccommFindMany.mockResolvedValue([{ status: "CHECKED_IN" }]);
      mockSurveyResponseFindMany.mockResolvedValue([{ answers: { rating: 4 } }]);

      const result = await getYoYComparison("series-1", "tenant-1");

      expect(result.editions).toHaveLength(2);
      expect(result.editions[0].year).toBe(2024);
      expect(result.editions[0].registration.total).toBe(3);
      expect(result.editions[0].registration.approved).toBe(2);
      expect(result.editions[1].year).toBe(2025);
      expect(result.editions[1].registration.total).toBe(4);
      expect(result.editions[1].registration.approved).toBe(3);
    });
  });

  describe("identifyReturningParticipants", () => {
    it("matches participants by email across editions", async () => {
      const { identifyReturningParticipants } = await import("../event-series.server");

      mockEditionFindFirst
        .mockResolvedValueOnce({ eventId: "event-1" })
        .mockResolvedValueOnce({ eventId: "event-2" });

      mockParticipantFindMany
        .mockResolvedValueOnce([
          {
            id: "p1",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@test.com",
            organization: "Org A",
          },
          {
            id: "p2",
            firstName: "John",
            lastName: "Doe",
            email: "john@test.com",
            organization: "Org B",
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "p3",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@test.com",
            organization: "Org A",
          },
          {
            id: "p4",
            firstName: "Bob",
            lastName: "Lee",
            email: "bob@test.com",
            organization: "Org C",
          },
        ]);

      const result = await identifyReturningParticipants("ed-1", "ed-2");

      expect(result.returningCount).toBe(1);
      expect(result.returning[0].email).toBe("jane@test.com");
      expect(result.newCount).toBe(1); // Bob is new
    });
  });

  describe("generateCarryForwardData", () => {
    it("extracts participant data for pre-fill", async () => {
      const { generateCarryForwardData } = await import("../event-series.server");

      mockParticipantFindFirst.mockResolvedValue({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@test.com",
        organization: "AU",
        jobTitle: "Director",
        nationality: "Ethiopian",
        extras: { passportNumber: "AB123456" },
        participantType: { id: "type-1", name: "Delegate", code: "DELEGATE" },
      });

      const result = await generateCarryForwardData("part-1", "tenant-1");

      expect(result.firstName).toBe("Jane");
      expect(result.lastName).toBe("Smith");
      expect(result.email).toBe("jane@test.com");
      expect(result.organization).toBe("AU");
      expect(result.participantTypeCode).toBe("DELEGATE");
      expect(result.extras).toEqual({ passportNumber: "AB123456" });
    });
  });

  describe("getEditionTrends", () => {
    it("returns trend arrays from YoY data", async () => {
      const { getEditionTrends } = await import("../event-series.server");

      mockSeriesFindFirst.mockResolvedValue({
        id: "series-1",
        tenantId: "tenant-1",
        name: "Summit",
        editions: [
          {
            id: "ed-1",
            editionNumber: 1,
            year: 2023,
            eventId: "e1",
            event: { id: "e1", name: "S2023" },
          },
        ],
      });

      mockParticipantFindMany.mockResolvedValue([
        { status: "APPROVED", createdAt: new Date(), updatedAt: new Date() },
      ]);
      mockAccessLogFindMany.mockResolvedValue([]);
      mockAccommFindMany.mockResolvedValue([]);
      mockSurveyResponseFindMany.mockResolvedValue([]);

      const result = await getEditionTrends("series-1", "tenant-1");

      expect(result.trends.years).toEqual([2023]);
      expect(result.trends.registrations).toEqual([1]);
    });
  });
});
