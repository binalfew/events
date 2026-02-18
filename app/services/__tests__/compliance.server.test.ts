import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockRequirementCreate = vi.fn();
const mockRequirementFindFirst = vi.fn();
const mockRequirementFindMany = vi.fn();
const mockDocumentCreate = vi.fn();
const mockDocumentFindFirst = vi.fn();
const mockDocumentFindMany = vi.fn();
const mockDocumentUpdate = vi.fn();
const mockDocumentDeleteMany = vi.fn();
const mockDocumentCount = vi.fn();
const mockPolicyCreate = vi.fn();
const mockPolicyFindFirst = vi.fn();
const mockPolicyFindMany = vi.fn();
const mockPolicyUpdate = vi.fn();
const mockParticipantFindFirst = vi.fn();
const mockParticipantFindMany = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    documentRequirement: {
      create: (...args: unknown[]) => mockRequirementCreate(...args),
      findFirst: (...args: unknown[]) => mockRequirementFindFirst(...args),
      findMany: (...args: unknown[]) => mockRequirementFindMany(...args),
    },
    participantDocument: {
      create: (...args: unknown[]) => mockDocumentCreate(...args),
      findFirst: (...args: unknown[]) => mockDocumentFindFirst(...args),
      findMany: (...args: unknown[]) => mockDocumentFindMany(...args),
      update: (...args: unknown[]) => mockDocumentUpdate(...args),
      deleteMany: (...args: unknown[]) => mockDocumentDeleteMany(...args),
      count: (...args: unknown[]) => mockDocumentCount(...args),
    },
    dataRetentionPolicy: {
      create: (...args: unknown[]) => mockPolicyCreate(...args),
      findFirst: (...args: unknown[]) => mockPolicyFindFirst(...args),
      findMany: (...args: unknown[]) => mockPolicyFindMany(...args),
      update: (...args: unknown[]) => mockPolicyUpdate(...args),
    },
    participant: {
      findFirst: (...args: unknown[]) => mockParticipantFindFirst(...args),
      findMany: (...args: unknown[]) => mockParticipantFindMany(...args),
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

describe("compliance.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createDocumentRequirement", () => {
    it("creates requirement and audit log", async () => {
      const { createDocumentRequirement } = await import("../compliance.server");

      mockRequirementCreate.mockImplementation(async ({ data }: any) => ({
        id: "req-1",
        ...data,
      }));

      const result = await createDocumentRequirement(
        {
          eventId: "event-1",
          name: "Passport",
          documentType: "PASSPORT",
          participantTypes: ["DELEGATE", "VIP"],
          isRequired: true,
        },
        CTX,
      );

      expect(result.id).toBe("req-1");
      expect(result.name).toBe("Passport");
      expect(result.documentType).toBe("PASSPORT");
      expect(result.participantTypes).toEqual(["DELEGATE", "VIP"]);
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("submitDocument", () => {
    it("creates document submission", async () => {
      const { submitDocument } = await import("../compliance.server");

      mockRequirementFindFirst.mockResolvedValue({ id: "req-1", tenantId: "tenant-1" });
      mockDocumentFindFirst.mockResolvedValue(null);
      mockDocumentCreate.mockImplementation(async ({ data }: any) => ({
        id: "doc-1",
        ...data,
        requirement: { id: "req-1", name: "Passport" },
        participant: { id: "part-1", firstName: "Jane", lastName: "Smith" },
      }));

      const result = await submitDocument(
        {
          requirementId: "req-1",
          participantId: "part-1",
          documentNumber: "AB123456",
          expiresAt: "2027-06-01",
        },
        CTX,
      );

      expect(result.id).toBe("doc-1");
      expect(result.status).toBe("VALID");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when document already submitted", async () => {
      const { submitDocument } = await import("../compliance.server");

      mockRequirementFindFirst.mockResolvedValue({ id: "req-1", tenantId: "tenant-1" });
      mockDocumentFindFirst.mockResolvedValue({ id: "doc-existing" });

      await expect(
        submitDocument({ requirementId: "req-1", participantId: "part-1" }, CTX),
      ).rejects.toThrow("already submitted");
    });

    it("throws when requirement not found", async () => {
      const { submitDocument } = await import("../compliance.server");

      mockRequirementFindFirst.mockResolvedValue(null);

      await expect(
        submitDocument({ requirementId: "missing", participantId: "part-1" }, CTX),
      ).rejects.toThrow("requirement not found");
    });
  });

  describe("verifyDocument", () => {
    it("verifies document as VALID", async () => {
      const { verifyDocument } = await import("../compliance.server");

      mockDocumentFindFirst.mockResolvedValue({
        id: "doc-1",
        tenantId: "tenant-1",
        metadata: {},
      });
      mockDocumentUpdate.mockImplementation(async ({ data }: any) => ({
        id: "doc-1",
        ...data,
        requirement: { id: "req-1", name: "Passport" },
        participant: { id: "part-1", firstName: "Jane", lastName: "Smith" },
      }));

      const result = await verifyDocument("doc-1", { status: "VALID", notes: "Looks good" }, CTX);

      expect(result.status).toBe("VALID");
      expect(result.verifiedAt).toBeInstanceOf(Date);
      expect(result.verifiedBy).toBe("user-1");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when document not found", async () => {
      const { verifyDocument } = await import("../compliance.server");

      mockDocumentFindFirst.mockResolvedValue(null);

      await expect(verifyDocument("missing", { status: "VALID" }, CTX)).rejects.toThrow(
        "Document not found",
      );
    });
  });

  describe("getParticipantCompliance", () => {
    it("returns applicable requirements with statuses", async () => {
      const { getParticipantCompliance } = await import("../compliance.server");

      mockParticipantFindFirst.mockResolvedValue({
        id: "part-1",
        firstName: "Jane",
        lastName: "Smith",
        eventId: "event-1",
        participantTypeId: "type-1",
        participantType: { id: "type-1", name: "Delegate", code: "DELEGATE" },
      });
      mockRequirementFindMany.mockResolvedValue([
        {
          id: "req-1",
          name: "Passport",
          documentType: "PASSPORT",
          isRequired: true,
          participantTypes: ["DELEGATE"],
          documents: [{ id: "doc-1", status: "VALID" }],
        },
        {
          id: "req-2",
          name: "Medical",
          documentType: "MEDICAL_CERT",
          isRequired: true,
          participantTypes: ["VIP"],
          documents: [],
        },
      ]);

      const result = await getParticipantCompliance("part-1", "tenant-1");

      expect(result.requirements).toHaveLength(1); // Only DELEGATE requirement
      expect(result.requirements[0].status).toBe("VALID");
    });
  });

  describe("getComplianceDashboard", () => {
    it("returns correct counts and compliance rate", async () => {
      const { getComplianceDashboard } = await import("../compliance.server");

      mockRequirementFindMany.mockResolvedValue([
        { id: "req-1", name: "Passport", isRequired: true, participantTypes: [] },
      ]);
      mockDocumentFindMany.mockResolvedValue([
        { status: "VALID", requirementId: "req-1", expiresAt: null },
        { status: "VALID", requirementId: "req-1", expiresAt: null },
        { status: "EXPIRED", requirementId: "req-1", expiresAt: null },
        { status: "NOT_PROVIDED", requirementId: "req-1", expiresAt: null },
      ]);
      mockParticipantFindMany.mockResolvedValue([
        { id: "p1" },
        { id: "p2" },
        { id: "p3" },
        { id: "p4" },
      ]);

      const result = await getComplianceDashboard("event-1", "tenant-1");

      expect(result.totalDocuments).toBe(4);
      expect(result.valid).toBe(2);
      expect(result.expired).toBe(1);
      expect(result.notProvided).toBe(1);
      expect(result.complianceRate).toBe(50); // 2 valid / (4 participants * 1 required) = 50%
    });
  });

  describe("getExpiringDocuments", () => {
    it("returns documents expiring within daysAhead", async () => {
      const { getExpiringDocuments } = await import("../compliance.server");

      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      mockDocumentFindMany.mockResolvedValue([
        {
          id: "doc-1",
          expiresAt: futureDate,
          requirement: { id: "req-1", name: "Passport", documentType: "PASSPORT" },
          participant: { id: "p1", firstName: "Jane", lastName: "Smith", email: "j@test.com" },
        },
      ]);

      const result = await getExpiringDocuments("event-1", "tenant-1", 30);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("doc-1");
    });
  });

  describe("createRetentionPolicy", () => {
    it("creates retention policy and audit log", async () => {
      const { createRetentionPolicy } = await import("../compliance.server");

      mockPolicyCreate.mockImplementation(async ({ data }: any) => ({
        id: "policy-1",
        ...data,
      }));

      const result = await createRetentionPolicy(
        { entityType: "ParticipantDocument", retentionDays: 365, action: "ANONYMIZE" },
        CTX,
      );

      expect(result.id).toBe("policy-1");
      expect(result.retentionDays).toBe(365);
      expect(result.action).toBe("ANONYMIZE");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("executeRetentionPolicy", () => {
    it("deletes records older than retention period", async () => {
      const { executeRetentionPolicy } = await import("../compliance.server");

      mockPolicyFindFirst.mockResolvedValue({
        id: "policy-1",
        tenantId: "tenant-1",
        entityType: "ParticipantDocument",
        retentionDays: 30,
        action: "DELETE",
        isActive: true,
      });
      mockDocumentDeleteMany.mockResolvedValue({ count: 5 });
      mockPolicyUpdate.mockResolvedValue({});

      const result = await executeRetentionPolicy("policy-1", CTX);

      expect(result.affected).toBe(5);
      expect(result.action).toBe("DELETE");
      expect(mockDocumentDeleteMany).toHaveBeenCalled();
    });

    it("throws when policy is inactive", async () => {
      const { executeRetentionPolicy } = await import("../compliance.server");

      mockPolicyFindFirst.mockResolvedValue({
        id: "policy-1",
        tenantId: "tenant-1",
        isActive: false,
      });

      await expect(executeRetentionPolicy("policy-1", CTX)).rejects.toThrow("inactive");
    });

    it("throws when policy not found", async () => {
      const { executeRetentionPolicy } = await import("../compliance.server");

      mockPolicyFindFirst.mockResolvedValue(null);

      await expect(executeRetentionPolicy("missing", CTX)).rejects.toThrow("not found");
    });
  });

  describe("getRetentionReport", () => {
    it("returns report with affected record counts", async () => {
      const { getRetentionReport } = await import("../compliance.server");

      mockPolicyFindMany.mockResolvedValue([
        {
          id: "policy-1",
          entityType: "ParticipantDocument",
          retentionDays: 365,
          action: "ANONYMIZE",
          lastRunAt: null,
        },
      ]);
      mockDocumentCount.mockResolvedValue(10);

      const result = await getRetentionReport("tenant-1");

      expect(result).toHaveLength(1);
      expect(result[0].recordsAffected).toBe(10);
      expect(result[0].entityType).toBe("ParticipantDocument");
    });
  });
});
