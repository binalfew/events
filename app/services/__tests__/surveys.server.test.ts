import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockSurveyCreate = vi.fn();
const mockSurveyFindFirst = vi.fn();
const mockSurveyFindMany = vi.fn();
const mockSurveyUpdate = vi.fn();
const mockResponseCreate = vi.fn();
const mockResponseFindFirst = vi.fn();
const mockResponseFindMany = vi.fn();
const mockResponseCount = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    survey: {
      create: (...args: unknown[]) => mockSurveyCreate(...args),
      findFirst: (...args: unknown[]) => mockSurveyFindFirst(...args),
      findMany: (...args: unknown[]) => mockSurveyFindMany(...args),
      update: (...args: unknown[]) => mockSurveyUpdate(...args),
    },
    surveyResponse: {
      create: (...args: unknown[]) => mockResponseCreate(...args),
      findFirst: (...args: unknown[]) => mockResponseFindFirst(...args),
      findMany: (...args: unknown[]) => mockResponseFindMany(...args),
      count: (...args: unknown[]) => mockResponseCount(...args),
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

describe("surveys.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createSurvey", () => {
    it("creates survey and audit log", async () => {
      const { createSurvey } = await import("../surveys.server");

      mockSurveyCreate.mockImplementation(async ({ data }: any) => ({
        id: "survey-1",
        ...data,
      }));

      const result = await createSurvey(
        {
          eventId: "event-1",
          title: "Post-Event Feedback",
          description: "How was the event?",
          isAnonymous: false,
        },
        CTX,
      );

      expect(result.id).toBe("survey-1");
      expect(result.title).toBe("Post-Event Feedback");
      expect(result.status).toBe("DRAFT");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("publishSurvey", () => {
    it("transitions DRAFT to PUBLISHED", async () => {
      const { publishSurvey } = await import("../surveys.server");

      mockSurveyFindFirst.mockResolvedValue({
        id: "survey-1",
        tenantId: "tenant-1",
        status: "DRAFT",
      });
      mockSurveyUpdate.mockImplementation(async ({ data }: any) => ({
        id: "survey-1",
        ...data,
      }));

      const result = await publishSurvey("survey-1", CTX);
      expect(result.status).toBe("PUBLISHED");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when survey is not in DRAFT status", async () => {
      const { publishSurvey } = await import("../surveys.server");

      mockSurveyFindFirst.mockResolvedValue({
        id: "survey-1",
        tenantId: "tenant-1",
        status: "PUBLISHED",
      });

      await expect(publishSurvey("survey-1", CTX)).rejects.toThrow("Cannot publish");
    });
  });

  describe("closeSurvey", () => {
    it("transitions PUBLISHED to CLOSED", async () => {
      const { closeSurvey } = await import("../surveys.server");

      mockSurveyFindFirst.mockResolvedValue({
        id: "survey-1",
        tenantId: "tenant-1",
        status: "PUBLISHED",
      });
      mockSurveyUpdate.mockImplementation(async ({ data }: any) => ({
        id: "survey-1",
        ...data,
      }));

      const result = await closeSurvey("survey-1", CTX);
      expect(result.status).toBe("CLOSED");
    });

    it("throws when survey is not PUBLISHED", async () => {
      const { closeSurvey } = await import("../surveys.server");

      mockSurveyFindFirst.mockResolvedValue({
        id: "survey-1",
        tenantId: "tenant-1",
        status: "DRAFT",
      });

      await expect(closeSurvey("survey-1", CTX)).rejects.toThrow("Cannot close");
    });
  });

  describe("submitResponse", () => {
    it("submits response for published survey", async () => {
      const { submitResponse } = await import("../surveys.server");

      mockSurveyFindFirst.mockResolvedValue({
        id: "survey-1",
        tenantId: "tenant-1",
        status: "PUBLISHED",
        title: "Feedback",
        opensAt: null,
        closesAt: null,
      });
      mockResponseFindFirst.mockResolvedValue(null);
      mockResponseCreate.mockImplementation(async ({ data }: any) => ({
        id: "resp-1",
        ...data,
        participant: { id: "part-1", firstName: "Jane", lastName: "Smith" },
      }));

      const result = await submitResponse(
        {
          surveyId: "survey-1",
          participantId: "part-1",
          answers: JSON.stringify({ rating: 5, feedback: "Great!" }),
        },
        CTX,
      );

      expect(result.id).toBe("resp-1");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when survey is not published", async () => {
      const { submitResponse } = await import("../surveys.server");

      mockSurveyFindFirst.mockResolvedValue({
        id: "survey-1",
        tenantId: "tenant-1",
        status: "DRAFT",
        opensAt: null,
        closesAt: null,
      });

      await expect(
        submitResponse({ surveyId: "survey-1", participantId: "part-1", answers: "{}" }, CTX),
      ).rejects.toThrow("not accepting responses");
    });

    it("throws on duplicate participant response", async () => {
      const { submitResponse } = await import("../surveys.server");

      mockSurveyFindFirst.mockResolvedValue({
        id: "survey-1",
        tenantId: "tenant-1",
        status: "PUBLISHED",
        opensAt: null,
        closesAt: null,
      });
      mockResponseFindFirst.mockResolvedValue({ id: "existing-resp" });

      await expect(
        submitResponse({ surveyId: "survey-1", participantId: "part-1", answers: "{}" }, CTX),
      ).rejects.toThrow("already submitted");
    });
  });

  describe("getSurveyAnalytics", () => {
    it("computes numeric averages and categorical distributions", async () => {
      const { getSurveyAnalytics } = await import("../surveys.server");

      mockSurveyFindFirst.mockResolvedValue({
        id: "survey-1",
        tenantId: "tenant-1",
        title: "Feedback",
        formTemplate: null,
        _count: { responses: 3 },
      });
      mockResponseFindMany.mockResolvedValue([
        { answers: { rating: 5, venue: "Good" } },
        { answers: { rating: 4, venue: "Good" } },
        { answers: { rating: 3, venue: "Average" } },
      ]);

      const result = await getSurveyAnalytics("survey-1", "tenant-1");

      expect(result.totalResponses).toBe(3);
      expect(result.breakdown.rating.type).toBe("numeric");
      expect(result.breakdown.rating.average).toBe(4);
      expect(result.breakdown.venue.type).toBe("categorical");
      expect(result.breakdown.venue.distribution["Good"]).toBe(2);
      expect(result.breakdown.venue.distribution["Average"]).toBe(1);
    });
  });

  describe("exportSurveyResults", () => {
    it("generates CSV with all answer columns", async () => {
      const { exportSurveyResults } = await import("../surveys.server");

      mockSurveyFindFirst.mockResolvedValue({ id: "survey-1", tenantId: "tenant-1" });
      mockResponseFindMany.mockResolvedValue([
        {
          id: "resp-1",
          answers: { rating: 5, comment: "Great" },
          participant: { id: "p1", firstName: "Jane", lastName: "Smith", email: "j@test.com" },
          submittedAt: new Date("2026-03-01T10:00:00Z"),
        },
      ]);

      const result = await exportSurveyResults("survey-1", "tenant-1");

      expect(result.totalRows).toBe(1);
      expect(result.csv).toContain("rating");
      expect(result.csv).toContain("comment");
      expect(result.csv).toContain("Jane Smith");
    });
  });

  describe("archiveSurvey", () => {
    it("transitions CLOSED to ARCHIVED", async () => {
      const { archiveSurvey } = await import("../surveys.server");

      mockSurveyFindFirst.mockResolvedValue({
        id: "survey-1",
        tenantId: "tenant-1",
        status: "CLOSED",
      });
      mockSurveyUpdate.mockImplementation(async ({ data }: any) => ({
        id: "survey-1",
        ...data,
      }));

      const result = await archiveSurvey("survey-1", CTX);
      expect(result.status).toBe("ARCHIVED");
    });

    it("throws when survey is not CLOSED", async () => {
      const { archiveSurvey } = await import("../surveys.server");

      mockSurveyFindFirst.mockResolvedValue({
        id: "survey-1",
        tenantId: "tenant-1",
        status: "PUBLISHED",
      });

      await expect(archiveSurvey("survey-1", CTX)).rejects.toThrow("Cannot archive");
    });
  });
});
