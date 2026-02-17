import crypto from "node:crypto";
import QRCode from "qrcode";
import { env } from "~/lib/env.server";
import { logger } from "~/lib/logger.server";

// ─── Types ────────────────────────────────────────────────

export class QRCodeError extends Error {
  constructor(
    message: string,
    public code: "INVALID_PAYLOAD" | "DECRYPTION_FAILED" | "CRC_MISMATCH" | "GENERATION_FAILED",
  ) {
    super(message);
    this.name = "QRCodeError";
  }
}

interface QRPayloadData {
  pid: string; // participantId
  tid: string; // tenantId
  eid: string; // eventId
  iat: number; // issued at (epoch seconds)
  v: number; // version
}

export interface DecodedQRPayload {
  participantId: string;
  tenantId: string;
  eventId: string;
  issuedAt: Date;
  version: number;
}

// ─── CRC32 ───────────────────────────────────────────────

const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let crc = i;
  for (let j = 0; j < 8; j++) {
    crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  CRC32_TABLE[i] = crc >>> 0;
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ─── Encryption Helpers ──────────────────────────────────

function getEncryptionKey(): Buffer {
  const hex = env.QR_ENCRYPTION_KEY;
  return Buffer.from(hex.slice(0, 64), "hex"); // 32 bytes = 256 bits
}

function encrypt(plaintext: string): Buffer {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  // Format: IV (12) + AuthTag (16) + Ciphertext
  return Buffer.concat([iv, authTag, encrypted]);
}

function decrypt(data: Buffer): string {
  const key = getEncryptionKey();

  if (data.length < 28) {
    throw new QRCodeError("Payload too short for decryption", "DECRYPTION_FAILED");
  }

  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    throw new QRCodeError("Decryption failed — invalid key or tampered data", "DECRYPTION_FAILED");
  }
}

// ─── Public API ──────────────────────────────────────────

/**
 * Generates an encrypted QR payload string for a participant.
 * Format: Base64url( CRC32(4 bytes) + IV(12) + AuthTag(16) + Ciphertext )
 */
export function generateQRPayload(
  participantId: string,
  tenantId: string,
  eventId: string,
): string {
  const payloadData: QRPayloadData = {
    pid: participantId,
    tid: tenantId,
    eid: eventId,
    iat: Math.floor(Date.now() / 1000),
    v: 1,
  };

  const json = JSON.stringify(payloadData);
  const encrypted = encrypt(json);

  // Prepend CRC32 of encrypted data for quick integrity check
  const checksum = crc32(encrypted);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(checksum, 0);

  const final = Buffer.concat([crcBuf, encrypted]);
  return final.toString("base64url");
}

/**
 * Decodes and decrypts a QR payload string back to structured data.
 */
export function decodeQRPayload(payload: string): DecodedQRPayload {
  let raw: Buffer;
  try {
    raw = Buffer.from(payload, "base64url");
  } catch {
    throw new QRCodeError("Invalid Base64url encoding", "INVALID_PAYLOAD");
  }

  if (raw.length < 32) {
    throw new QRCodeError("Payload too short", "INVALID_PAYLOAD");
  }

  // Extract and verify CRC32
  const expectedCrc = raw.readUInt32BE(0);
  const encryptedData = raw.subarray(4);
  const actualCrc = crc32(encryptedData);

  if (expectedCrc !== actualCrc) {
    throw new QRCodeError("CRC32 checksum mismatch — data may be corrupted", "CRC_MISMATCH");
  }

  // Decrypt
  const json = decrypt(encryptedData);

  let parsed: QRPayloadData;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new QRCodeError("Decrypted data is not valid JSON", "INVALID_PAYLOAD");
  }

  if (!parsed.pid || !parsed.tid || !parsed.eid || parsed.v !== 1) {
    throw new QRCodeError("Missing required fields in QR payload", "INVALID_PAYLOAD");
  }

  return {
    participantId: parsed.pid,
    tenantId: parsed.tid,
    eventId: parsed.eid,
    issuedAt: new Date(parsed.iat * 1000),
    version: parsed.v,
  };
}

/**
 * Generates a QR code as a PNG data URL from an encrypted payload string.
 */
export async function generateQRCodeDataURL(payload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch (err) {
    logger.error({ err }, "Failed to generate QR code data URL");
    throw new QRCodeError("Failed to generate QR code image", "GENERATION_FAILED");
  }
}
