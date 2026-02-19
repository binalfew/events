import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockTemplateCreate = vi.fn();
const mockTemplateFindFirst = vi.fn();
const mockTemplateFindMany = vi.fn();
const mockCertCreate = vi.fn();
const mockCertFindFirst = vi.fn();
const mockCertFindMany = vi.fn();
const mockCertUpdate = vi.fn();
const mockParticipantFindFirst = vi.fn();
const mockParticipantFindMany = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    certificateTemplate: {
      create: (...args: unknown[]) => mockTemplateCreate(...args),
      findFirst: (...args: unknown[]) => mockTemplateFindFirst(...args),
      findMany: (...args: unknown[]) => mockTemplateFindMany(...args),
    },
    certificate: {
      create: (...args: unknown[]) => mockCertCreate(...args),
      findFirst: (...args: unknown[]) => mockCertFindFirst(...args),
      findMany: (...args: unknown[]) => mockCertFindMany(...args),
      update: (...args: unknown[]) => mockCertUpdate(...args),
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

describe("certificates.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuditLogCreate.mockResolvedValue({});
  });

  describe("createTemplate", () => {
    it("creates template and audit log", async () => {
      const { createTemplate } = await import("../certificates.server");

      mockTemplateCreate.mockImplementation(async ({ data }: any) => ({
        id: "tmpl-1",
        ...data,
      }));

      const result = await createTemplate(
        { name: "Attendance Certificate", description: "For all attendees" },
        CTX,
      );

      expect(result.id).toBe("tmpl-1");
      expect(result.name).toBe("Attendance Certificate");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });
  });

  describe("generateCertificate", () => {
    it("generates certificate with QR code", async () => {
      const { generateCertificate } = await import("../certificates.server");

      mockTemplateFindFirst.mockResolvedValue({ id: "tmpl-1", tenantId: "tenant-1" });
      mockParticipantFindFirst.mockResolvedValue({
        id: "part-1",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@test.com",
        eventId: "event-1",
        registrationCode: "REG-001",
        participantType: { id: "type-1", name: "Delegate" },
      });
      mockCertFindFirst.mockResolvedValue(null); // No existing certificate
      mockCertCreate.mockImplementation(async ({ data }: any) => ({
        id: "cert-1",
        ...data,
        participant: { id: "part-1", firstName: "Jane", lastName: "Smith", email: "jane@test.com" },
        template: { id: "tmpl-1", name: "Attendance" },
      }));

      const result = await generateCertificate(
        { templateId: "tmpl-1", participantId: "part-1" },
        CTX,
      );

      expect(result.id).toBe("cert-1");
      expect(result.status).toBe("GENERATED");
      expect(result.qrCode).toMatch(/^CERT-/);
      expect(result.issuedAt).toBeInstanceOf(Date);
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when certificate already exists", async () => {
      const { generateCertificate } = await import("../certificates.server");

      mockTemplateFindFirst.mockResolvedValue({ id: "tmpl-1", tenantId: "tenant-1" });
      mockParticipantFindFirst.mockResolvedValue({
        id: "part-1",
        firstName: "Jane",
        lastName: "Smith",
        eventId: "event-1",
        participantType: { id: "type-1", name: "Delegate" },
      });
      mockCertFindFirst.mockResolvedValue({ id: "existing-cert" });

      await expect(
        generateCertificate({ templateId: "tmpl-1", participantId: "part-1" }, CTX),
      ).rejects.toThrow("already exists");
    });

    it("throws when template not found", async () => {
      const { generateCertificate } = await import("../certificates.server");

      mockTemplateFindFirst.mockResolvedValue(null);

      await expect(
        generateCertificate({ templateId: "missing", participantId: "part-1" }, CTX),
      ).rejects.toThrow("Template not found");
    });
  });

  describe("bulkGenerateCertificates", () => {
    it("generates certificates for eligible participants", async () => {
      const { bulkGenerateCertificates } = await import("../certificates.server");

      mockTemplateFindFirst.mockResolvedValue({ id: "tmpl-1", tenantId: "tenant-1" });
      mockParticipantFindMany.mockResolvedValue([
        { id: "part-1", firstName: "Jane", lastName: "Smith", eventId: "event-1" },
        { id: "part-2", firstName: "John", lastName: "Doe", eventId: "event-1" },
        { id: "part-3", firstName: "Bob", lastName: "Lee", eventId: "event-1" },
      ]);
      mockCertFindMany.mockResolvedValue([{ participantId: "part-2" }]); // part-2 already has cert
      mockCertCreate.mockResolvedValue({});

      const result = await bulkGenerateCertificates({ templateId: "tmpl-1" }, "event-1", CTX);

      expect(result.generated).toBe(2); // part-1 and part-3
      expect(result.skipped).toBe(1); // part-2
      expect(mockCertCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe("verifyCertificate", () => {
    it("returns valid for active certificate", async () => {
      const { verifyCertificate } = await import("../certificates.server");

      mockCertFindFirst.mockResolvedValue({
        id: "cert-1",
        status: "GENERATED",
        qrCode: "CERT-ABC123",
        participant: {
          id: "part-1",
          firstName: "Jane",
          lastName: "Smith",
          registrationCode: "REG-001",
        },
        template: { id: "tmpl-1", name: "Attendance" },
        event: { id: "event-1", name: "Annual Conference" },
      });

      const result = await verifyCertificate("CERT-ABC123");

      expect(result.valid).toBe(true);
      expect(result.certificate).toBeDefined();
    });

    it("returns invalid for revoked certificate", async () => {
      const { verifyCertificate } = await import("../certificates.server");

      mockCertFindFirst.mockResolvedValue({
        id: "cert-1",
        status: "REVOKED",
        qrCode: "CERT-ABC123",
        participant: {
          id: "part-1",
          firstName: "Jane",
          lastName: "Smith",
          registrationCode: "REG-001",
        },
        template: { id: "tmpl-1", name: "Attendance" },
        event: { id: "event-1", name: "Annual Conference" },
      });

      const result = await verifyCertificate("CERT-ABC123");

      expect(result.valid).toBe(false);
      expect(result.message).toContain("revoked");
    });

    it("returns invalid for unknown code", async () => {
      const { verifyCertificate } = await import("../certificates.server");

      mockCertFindFirst.mockResolvedValue(null);

      const result = await verifyCertificate("CERT-UNKNOWN");

      expect(result.valid).toBe(false);
      expect(result.message).toContain("not found");
    });
  });

  describe("revokeCertificate", () => {
    it("revokes certificate with reason", async () => {
      const { revokeCertificate } = await import("../certificates.server");

      mockCertFindFirst.mockResolvedValue({
        id: "cert-1",
        tenantId: "tenant-1",
        status: "GENERATED",
      });
      mockCertUpdate.mockImplementation(async ({ data }: any) => ({
        id: "cert-1",
        ...data,
      }));

      const result = await revokeCertificate("cert-1", "Issued in error", CTX);

      expect(result.status).toBe("REVOKED");
      expect(mockAuditLogCreate).toHaveBeenCalled();
    });

    it("throws when already revoked", async () => {
      const { revokeCertificate } = await import("../certificates.server");

      mockCertFindFirst.mockResolvedValue({
        id: "cert-1",
        tenantId: "tenant-1",
        status: "REVOKED",
      });

      await expect(revokeCertificate("cert-1", "Reason", CTX)).rejects.toThrow("already revoked");
    });
  });

  describe("sendCertificate", () => {
    it("sends certificate and updates status", async () => {
      const { sendCertificate } = await import("../certificates.server");

      mockCertFindFirst.mockResolvedValue({
        id: "cert-1",
        tenantId: "tenant-1",
        status: "GENERATED",
        participant: { id: "part-1", firstName: "Jane", lastName: "Smith", email: "jane@test.com" },
      });
      mockCertUpdate.mockImplementation(async ({ data }: any) => ({
        id: "cert-1",
        ...data,
      }));

      const result = await sendCertificate("cert-1", CTX);

      expect(result.status).toBe("SENT");
      expect(result.sentAt).toBeInstanceOf(Date);
    });

    it("throws when participant has no email", async () => {
      const { sendCertificate } = await import("../certificates.server");

      mockCertFindFirst.mockResolvedValue({
        id: "cert-1",
        tenantId: "tenant-1",
        status: "GENERATED",
        participant: { id: "part-1", firstName: "Jane", lastName: "Smith", email: null },
      });

      await expect(sendCertificate("cert-1", CTX)).rejects.toThrow("no email");
    });
  });

  describe("getCertificateStats", () => {
    it("returns correct counts by status", async () => {
      const { getCertificateStats } = await import("../certificates.server");

      mockCertFindMany.mockResolvedValue([
        { status: "GENERATED" },
        { status: "GENERATED" },
        { status: "SENT" },
        { status: "DOWNLOADED" },
        { status: "REVOKED" },
      ]);

      const result = await getCertificateStats("event-1", "tenant-1");

      expect(result.total).toBe(5);
      expect(result.generated).toBe(2);
      expect(result.sent).toBe(1);
      expect(result.downloaded).toBe(1);
      expect(result.revoked).toBe(1);
    });
  });
});
