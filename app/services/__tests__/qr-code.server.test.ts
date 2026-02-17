import { describe, it, expect, vi } from "vitest";

vi.mock("~/lib/env.server", () => ({
  env: {
    QR_ENCRYPTION_KEY: "a".repeat(64), // 32-byte hex key
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("qr-code.server", () => {
  describe("generateQRPayload + decodeQRPayload", () => {
    it("round-trips participant data through encrypt/decrypt", async () => {
      const { generateQRPayload, decodeQRPayload } = await import("../qr-code.server");

      const payload = generateQRPayload("part-1", "tenant-1", "event-1");
      const decoded = decodeQRPayload(payload);

      expect(decoded.participantId).toBe("part-1");
      expect(decoded.tenantId).toBe("tenant-1");
      expect(decoded.eventId).toBe("event-1");
      expect(decoded.version).toBe(1);
      expect(decoded.issuedAt).toBeInstanceOf(Date);
    });

    it("produces Base64url-encoded output", async () => {
      const { generateQRPayload } = await import("../qr-code.server");

      const payload = generateQRPayload("part-1", "tenant-1", "event-1");

      // Base64url should not contain +, /, or =
      expect(payload).not.toMatch(/[+/=]/);
      expect(payload.length).toBeGreaterThan(0);
    });

    it("generates unique payloads for same input (random IV)", async () => {
      const { generateQRPayload } = await import("../qr-code.server");

      const p1 = generateQRPayload("part-1", "tenant-1", "event-1");
      const p2 = generateQRPayload("part-1", "tenant-1", "event-1");

      expect(p1).not.toBe(p2);
    });

    it("throws on tampered payload (CRC mismatch)", async () => {
      const { generateQRPayload, decodeQRPayload, QRCodeError } = await import("../qr-code.server");

      const payload = generateQRPayload("part-1", "tenant-1", "event-1");

      // Tamper with a character in the middle
      const tampered = payload.slice(0, 10) + "X" + payload.slice(11);

      expect(() => decodeQRPayload(tampered)).toThrow(QRCodeError);
    });

    it("throws on garbage input", async () => {
      const { decodeQRPayload, QRCodeError } = await import("../qr-code.server");

      expect(() => decodeQRPayload("not-valid")).toThrow(QRCodeError);
    });
  });

  describe("generateQRCodeDataURL", () => {
    it("generates a PNG data URL from payload", async () => {
      const { generateQRPayload, generateQRCodeDataURL } = await import("../qr-code.server");

      const payload = generateQRPayload("part-1", "tenant-1", "event-1");
      const dataUrl = await generateQRCodeDataURL(payload);

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });
});
