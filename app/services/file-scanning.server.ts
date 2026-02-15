import * as net from "node:net";
import { env } from "~/lib/env.server";
import { logger } from "~/lib/logger.server";

export interface ScanResult {
  safe: boolean;
  threats?: string[];
  scanTimeMs: number;
}

/**
 * Magic bytes signatures for common file types.
 * Maps MIME type to an array of possible signatures (hex byte arrays).
 */
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP starts with RIFF....WEBP)
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "application/msword": [[0xd0, 0xcf, 0x11, 0xe0]], // OLE compound
  "application/vnd.ms-excel": [[0xd0, 0xcf, 0x11, 0xe0]],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    [0x50, 0x4b, 0x03, 0x04],
  ], // ZIP (OOXML)
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [[0x50, 0x4b, 0x03, 0x04]],
};

/**
 * Validates file content against declared MIME type using magic bytes.
 * Returns true for types not in our map (permissive for unknown types).
 */
export function validateMagicBytes(buffer: Buffer, claimedType: string): boolean {
  const signatures = MAGIC_BYTES[claimedType];
  if (!signatures) {
    return true; // Unknown type — allow through
  }

  if (buffer.length === 0) {
    return false;
  }

  return signatures.some((sig) => {
    if (buffer.length < sig.length) return false;
    return sig.every((byte, i) => buffer[i] === byte);
  });
}

/**
 * Scans a buffer using ClamAV's INSTREAM protocol over TCP.
 *
 * Protocol:
 * 1. Send "zINSTREAM\0"
 * 2. Send chunks: 4-byte big-endian length + chunk data
 * 3. Send 4 zero bytes (terminator)
 * 4. Read response: "stream: OK\0" or "stream: {name} FOUND\0"
 */
export async function scanBuffer(buffer: Buffer): Promise<ScanResult> {
  const start = Date.now();

  if (!env.CLAMAV_ENABLED) {
    return { safe: true, scanTimeMs: Date.now() - start };
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const socket = net.createConnection(env.CLAMAV_PORT, env.CLAMAV_HOST);

    socket.setTimeout(30_000);

    socket.on("connect", () => {
      // Send INSTREAM command
      socket.write("zINSTREAM\0");

      // Send file data in chunks (max 2MB per chunk)
      const CHUNK_SIZE = 2 * 1024 * 1024;
      for (let offset = 0; offset < buffer.length; offset += CHUNK_SIZE) {
        const chunk = buffer.subarray(offset, offset + CHUNK_SIZE);
        const lengthBuf = Buffer.alloc(4);
        lengthBuf.writeUInt32BE(chunk.length, 0);
        socket.write(lengthBuf);
        socket.write(chunk);
      }

      // Send terminator (4 zero bytes)
      socket.write(Buffer.alloc(4));
    });

    socket.on("data", (data) => {
      chunks.push(data);
    });

    socket.on("end", () => {
      const response = Buffer.concat(chunks).toString("utf8").replace(/\0/g, "").trim();
      const scanTimeMs = Date.now() - start;

      if (response.endsWith("OK")) {
        resolve({ safe: true, scanTimeMs });
      } else {
        // Parse "stream: Eicar-Signature FOUND"
        const match = response.match(/stream:\s*(.+)\s+FOUND/i);
        const threat = match ? match[1].trim() : "Unknown threat";
        resolve({ safe: false, threats: [threat], scanTimeMs });
      }
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("ClamAV scan timeout"));
    });

    socket.on("error", (err) => {
      const scanTimeMs = Date.now() - start;
      logger.error({ err }, "ClamAV scan error");
      reject(err);
    });
  });
}

/**
 * Checks if ClamAV daemon is reachable by sending a PING command.
 * Returns true if PONG is received.
 */
export async function isClamAVAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection(env.CLAMAV_PORT, env.CLAMAV_HOST);
    const chunks: Buffer[] = [];

    socket.setTimeout(5_000);

    socket.on("connect", () => {
      socket.write("zPING\0");
    });

    socket.on("data", (data) => {
      chunks.push(data);
    });

    socket.on("end", () => {
      const response = Buffer.concat(chunks).toString("utf8").replace(/\0/g, "").trim();
      resolve(response === "PONG");
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}
