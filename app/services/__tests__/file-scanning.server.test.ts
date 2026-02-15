import { describe, it, expect, vi, beforeEach } from "vitest";
import * as net from "node:net";
import { EventEmitter } from "node:events";

vi.mock("~/lib/env.server", () => ({
  env: {
    CLAMAV_HOST: "localhost",
    CLAMAV_PORT: 3310,
    CLAMAV_ENABLED: true,
    CLAMAV_REQUIRED: false,
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock net.createConnection
const mockSocket = new EventEmitter() as EventEmitter & {
  write: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  setTimeout: ReturnType<typeof vi.fn>;
};
mockSocket.write = vi.fn();
mockSocket.destroy = vi.fn();
mockSocket.setTimeout = vi.fn();

vi.mock("node:net", () => ({
  createConnection: vi.fn(() => mockSocket),
}));

describe("file-scanning.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.removeAllListeners();
    mockSocket.write = vi.fn();
    mockSocket.destroy = vi.fn();
    mockSocket.setTimeout = vi.fn();
    (net.createConnection as ReturnType<typeof vi.fn>).mockReturnValue(mockSocket);
  });

  describe("validateMagicBytes", () => {
    it("correctly identifies JPEG files", async () => {
      const { validateMagicBytes } = await import("../file-scanning.server");
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(validateMagicBytes(jpegBuffer, "image/jpeg")).toBe(true);
    });

    it("correctly identifies PNG files", async () => {
      const { validateMagicBytes } = await import("../file-scanning.server");
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      expect(validateMagicBytes(pngBuffer, "image/png")).toBe(true);
    });

    it("correctly identifies GIF files", async () => {
      const { validateMagicBytes } = await import("../file-scanning.server");
      const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      expect(validateMagicBytes(gifBuffer, "image/gif")).toBe(true);
    });

    it("correctly identifies PDF files", async () => {
      const { validateMagicBytes } = await import("../file-scanning.server");
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
      expect(validateMagicBytes(pdfBuffer, "application/pdf")).toBe(true);
    });

    it("rejects mismatched types (EXE bytes with image/jpeg claim)", async () => {
      const { validateMagicBytes } = await import("../file-scanning.server");
      // MZ header (EXE/PE)
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
      expect(validateMagicBytes(exeBuffer, "image/jpeg")).toBe(false);
    });

    it("returns true for types not in the magic bytes map", async () => {
      const { validateMagicBytes } = await import("../file-scanning.server");
      const buffer = Buffer.from([0x00, 0x01, 0x02]);
      expect(validateMagicBytes(buffer, "text/plain")).toBe(true);
    });

    it("rejects empty buffer for known types", async () => {
      const { validateMagicBytes } = await import("../file-scanning.server");
      const emptyBuffer = Buffer.alloc(0);
      expect(validateMagicBytes(emptyBuffer, "image/jpeg")).toBe(false);
    });
  });

  describe("scanBuffer", () => {
    it("returns safe:true for clean data", async () => {
      const { scanBuffer } = await import("../file-scanning.server");
      const buffer = Buffer.from("clean file content");

      const scanPromise = scanBuffer(buffer);

      // Simulate socket connection and ClamAV response
      setTimeout(() => {
        mockSocket.emit("connect");
        setTimeout(() => {
          mockSocket.emit("data", Buffer.from("stream: OK\0"));
          mockSocket.emit("end");
        }, 10);
      }, 10);

      const result = await scanPromise;
      expect(result.safe).toBe(true);
      expect(result.threats).toBeUndefined();
      expect(result.scanTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("returns safe:false with threat name for infected data", async () => {
      const { scanBuffer } = await import("../file-scanning.server");
      const buffer = Buffer.from("infected content");

      const scanPromise = scanBuffer(buffer);

      setTimeout(() => {
        mockSocket.emit("connect");
        setTimeout(() => {
          mockSocket.emit("data", Buffer.from("stream: Eicar-Signature FOUND\0"));
          mockSocket.emit("end");
        }, 10);
      }, 10);

      const result = await scanPromise;
      expect(result.safe).toBe(false);
      expect(result.threats).toEqual(["Eicar-Signature"]);
    });

    it("sends INSTREAM command on connect", async () => {
      const { scanBuffer } = await import("../file-scanning.server");
      const buffer = Buffer.from("test");

      const scanPromise = scanBuffer(buffer);

      setTimeout(() => {
        mockSocket.emit("connect");
        setTimeout(() => {
          mockSocket.emit("data", Buffer.from("stream: OK\0"));
          mockSocket.emit("end");
        }, 10);
      }, 10);

      await scanPromise;
      expect(mockSocket.write).toHaveBeenCalledWith("zINSTREAM\0");
    });
  });

  describe("isClamAVAvailable", () => {
    it("returns true when PONG is received", async () => {
      const { isClamAVAvailable } = await import("../file-scanning.server");

      const promise = isClamAVAvailable();

      setTimeout(() => {
        mockSocket.emit("connect");
        setTimeout(() => {
          mockSocket.emit("data", Buffer.from("PONG"));
          mockSocket.emit("end");
        }, 10);
      }, 10);

      expect(await promise).toBe(true);
    });

    it("returns false on connection error", async () => {
      const { isClamAVAvailable } = await import("../file-scanning.server");

      const promise = isClamAVAvailable();

      setTimeout(() => {
        mockSocket.emit("error", new Error("ECONNREFUSED"));
      }, 10);

      expect(await promise).toBe(false);
    });

    it("returns false on timeout", async () => {
      const { isClamAVAvailable } = await import("../file-scanning.server");

      const promise = isClamAVAvailable();

      setTimeout(() => {
        mockSocket.emit("timeout");
      }, 10);

      expect(await promise).toBe(false);
    });
  });
});
