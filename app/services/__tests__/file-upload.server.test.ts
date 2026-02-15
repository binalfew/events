import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "node:fs/promises";

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

const mockEnv = {
  CLAMAV_HOST: "localhost",
  CLAMAV_PORT: 3310,
  CLAMAV_ENABLED: true,
  CLAMAV_REQUIRED: false,
  FILE_UPLOAD_MAX_SIZE_MB: 10,
  FILE_UPLOAD_DIR: "/tmp/test-uploads",
};

vi.mock("~/lib/env.server", () => ({
  env: mockEnv,
}));

const mockValidateMagicBytes = vi.fn().mockReturnValue(true);
const mockScanBuffer = vi.fn().mockResolvedValue({ safe: true, scanTimeMs: 5 });
const mockIsClamAVAvailable = vi.fn().mockResolvedValue(true);

vi.mock("../file-scanning.server", () => ({
  validateMagicBytes: (...args: unknown[]) => mockValidateMagicBytes(...args),
  scanBuffer: (...args: unknown[]) => mockScanBuffer(...args),
  isClamAVAvailable: (...args: unknown[]) => mockIsClamAVAvailable(...args),
}));

vi.mock("node:fs/promises", async () => {
  const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  return {
    ...actual,
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn(),
    readdir: vi.fn().mockResolvedValue([]),
    access: vi.fn().mockResolvedValue(undefined),
  };
});

function createMockFile(name: string, type: string, content: string): File {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

// Helper for JPEG bytes
function createMockFileWithBytes(name: string, type: string, bytes: number[]): File {
  const buffer = new Uint8Array(bytes);
  const blob = new Blob([buffer], { type });
  return new File([blob], name, { type });
}

const defaultOptions = {
  tenantId: "tenant-1",
  uploadedBy: "user-1",
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
};

describe("file-upload.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditCreate.mockResolvedValue({});
    mockValidateMagicBytes.mockReturnValue(true);
    mockScanBuffer.mockResolvedValue({ safe: true, scanTimeMs: 5 });
    mockIsClamAVAvailable.mockResolvedValue(true);
    mockEnv.CLAMAV_ENABLED = true;
    mockEnv.CLAMAV_REQUIRED = false;
    mockEnv.FILE_UPLOAD_MAX_SIZE_MB = 10;
  });

  describe("processFileUpload", () => {
    it("clean file passes pipeline and returns fileId/url", async () => {
      const { processFileUpload } = await import("../file-upload.server");
      const file = createMockFile("photo.jpg", "image/jpeg", "fake-jpeg-content");

      const result = await processFileUpload(file, defaultOptions);

      expect(result.allowed).toBe(true);
      expect(result.fileId).toBeDefined();
      expect(result.url).toMatch(/^\/api\/v1\/files\//);
    });

    it("rejects disallowed MIME type", async () => {
      const { processFileUpload } = await import("../file-upload.server");
      const file = createMockFile("script.exe", "application/x-executable", "MZ...");

      const result = await processFileUpload(file, defaultOptions);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("File type not allowed");
    });

    it("rejects magic bytes mismatch", async () => {
      const { processFileUpload } = await import("../file-upload.server");
      mockValidateMagicBytes.mockReturnValue(false);
      const file = createMockFile("fake.jpg", "image/jpeg", "not-a-real-jpeg");

      const result = await processFileUpload(file, defaultOptions);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("File content does not match declared type");
    });

    it("rejects file exceeding size limit", async () => {
      const { processFileUpload } = await import("../file-upload.server");
      mockEnv.FILE_UPLOAD_MAX_SIZE_MB = 0; // 0 MB = reject everything
      const file = createMockFile("big.jpg", "image/jpeg", "some content");

      const result = await processFileUpload(file, defaultOptions);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("File exceeds size limit");
    });

    it("rejects upload when ClamAV unavailable and CLAMAV_REQUIRED=true", async () => {
      const { processFileUpload } = await import("../file-upload.server");
      mockIsClamAVAvailable.mockResolvedValue(false);
      mockEnv.CLAMAV_REQUIRED = true;
      const file = createMockFile("photo.jpg", "image/jpeg", "content");

      const result = await processFileUpload(file, defaultOptions);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("File scanning unavailable");
    });

    it("allows upload when ClamAV unavailable and CLAMAV_REQUIRED=false", async () => {
      const { processFileUpload } = await import("../file-upload.server");
      const { logger } = await import("~/lib/logger.server");
      mockIsClamAVAvailable.mockResolvedValue(false);
      mockEnv.CLAMAV_REQUIRED = false;
      const file = createMockFile("photo.jpg", "image/jpeg", "content");

      const result = await processFileUpload(file, defaultOptions);

      expect(result.allowed).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: "tenant-1" }),
        expect.stringContaining("ClamAV unavailable"),
      );
    });

    it("rejects infected file with FILE_UPLOAD_BLOCKED audit log", async () => {
      const { processFileUpload } = await import("../file-upload.server");
      mockScanBuffer.mockResolvedValue({
        safe: false,
        threats: ["Eicar-Signature"],
        scanTimeMs: 10,
      });
      const file = createMockFile("virus.jpg", "image/jpeg", "eicar content");

      const result = await processFileUpload(file, defaultOptions);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Malware detected");
      expect(result.reason).toContain("Eicar-Signature");

      // Audit log should be called with FILE_UPLOAD_BLOCKED
      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "FILE_UPLOAD_BLOCKED",
          entityType: "File",
          metadata: expect.objectContaining({
            reason: expect.stringContaining("Malware detected"),
          }),
        }),
      });
    });

    it("creates FILE_UPLOAD audit log on successful upload", async () => {
      const { processFileUpload } = await import("../file-upload.server");
      const file = createMockFile("doc.pdf", "application/pdf", "pdf content");

      await processFileUpload(file, defaultOptions);

      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "FILE_UPLOAD",
          tenantId: "tenant-1",
          userId: "user-1",
          entityType: "File",
          description: expect.stringContaining("doc.pdf"),
        }),
      });
    });

    it("stores files in correct tenant/year/month directory", async () => {
      const { processFileUpload } = await import("../file-upload.server");
      const file = createMockFile("report.pdf", "application/pdf", "pdf content");

      await processFileUpload(file, defaultOptions);

      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, "0");

      expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining(`tenant-1/${year}/${month}`), {
        recursive: true,
      });
    });

    it("writes .meta.json sidecar file", async () => {
      const { processFileUpload } = await import("../file-upload.server");
      const file = createMockFile("photo.png", "image/png", "png content");

      await processFileUpload(file, defaultOptions);

      // Second writeFile call is the .meta.json
      const writeFileCalls = (fs.writeFile as ReturnType<typeof vi.fn>).mock.calls;
      const metaCall = writeFileCalls.find(
        (call: unknown[]) =>
          typeof call[0] === "string" && (call[0] as string).endsWith(".meta.json"),
      );
      expect(metaCall).toBeDefined();

      const metaContent = JSON.parse(metaCall![1] as string);
      expect(metaContent.originalName).toBe("photo.png");
      expect(metaContent.mimeType).toBe("image/png");
      expect(metaContent.tenantId).toBe("tenant-1");
      expect(metaContent.uploadedBy).toBe("user-1");
    });
  });
});
