import * as fs from "node:fs/promises";
import * as path from "node:path";
import crypto from "node:crypto";
import { env } from "~/lib/env.server";
import { logger } from "~/lib/logger.server";
import { prisma } from "~/lib/db.server";
import { validateMagicBytes, scanBuffer, isClamAVAvailable } from "./file-scanning.server";

export interface UploadOptions {
  tenantId: string;
  uploadedBy: string;
  allowedTypes?: string[];
  ipAddress?: string;
  userAgent?: string;
}

export interface UploadResult {
  allowed: boolean;
  reason?: string;
  fileId?: string;
  url?: string;
}

export interface FileMeta {
  fileId: string;
  originalName: string;
  mimeType: string;
  tenantId: string;
  uploadedBy: string;
  size: number;
  createdAt: string;
  filePath: string;
}

export const DEFAULT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export class FileUploadError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "FileUploadError";
  }
}

/**
 * Full file upload pipeline:
 * 1. MIME type check
 * 2. Magic bytes validation
 * 3. Size check
 * 4. ClamAV scan (if enabled)
 * 5. Store locally
 * 6. Write .meta.json sidecar
 * 7. Audit log
 */
export async function processFileUpload(file: File, options: UploadOptions): Promise<UploadResult> {
  const { tenantId, uploadedBy, ipAddress, userAgent } = options;
  const allowedTypes = options.allowedTypes ?? DEFAULT_ALLOWED_TYPES;
  const mimeType = file.type;
  const originalName = file.name;

  // 1. MIME type check
  if (!allowedTypes.includes(mimeType)) {
    await auditBlock(
      tenantId,
      uploadedBy,
      originalName,
      "File type not allowed",
      ipAddress,
      userAgent,
    );
    return { allowed: false, reason: "File type not allowed" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 2. Magic bytes check
  if (!validateMagicBytes(buffer, mimeType)) {
    await auditBlock(
      tenantId,
      uploadedBy,
      originalName,
      "File content does not match declared type",
      ipAddress,
      userAgent,
    );
    return { allowed: false, reason: "File content does not match declared type" };
  }

  // 3. Size check
  const maxBytes = env.FILE_UPLOAD_MAX_SIZE_MB * 1024 * 1024;
  if (buffer.length > maxBytes) {
    await auditBlock(
      tenantId,
      uploadedBy,
      originalName,
      "File exceeds size limit",
      ipAddress,
      userAgent,
    );
    return { allowed: false, reason: "File exceeds size limit" };
  }

  // 4. ClamAV scan
  if (env.CLAMAV_ENABLED) {
    const available = await isClamAVAvailable();
    if (!available) {
      if (env.CLAMAV_REQUIRED) {
        await auditBlock(
          tenantId,
          uploadedBy,
          originalName,
          "File scanning unavailable",
          ipAddress,
          userAgent,
        );
        return { allowed: false, reason: "File scanning unavailable" };
      }
      logger.warn({ originalName, tenantId }, "ClamAV unavailable, allowing upload without scan");
    } else {
      const scanResult = await scanBuffer(buffer);
      if (!scanResult.safe) {
        const threats = scanResult.threats?.join(", ") ?? "Unknown threat";
        await auditBlock(
          tenantId,
          uploadedBy,
          originalName,
          `Malware detected: ${threats}`,
          ipAddress,
          userAgent,
        );
        return { allowed: false, reason: `Malware detected: ${threats}` };
      }
    }
  }

  // 5. Store file locally
  const {
    fileId,
    path: filePath,
    url,
  } = await storeFileLocally(buffer, tenantId, originalName, mimeType);

  // 6. Write .meta.json sidecar
  const meta: FileMeta = {
    fileId,
    originalName,
    mimeType,
    tenantId,
    uploadedBy,
    size: buffer.length,
    createdAt: new Date().toISOString(),
    filePath,
  };
  const metaPath = filePath + ".meta.json";
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");

  // 7. Audit log (success)
  prisma.auditLog
    .create({
      data: {
        tenantId,
        userId: uploadedBy,
        action: "FILE_UPLOAD",
        entityType: "File",
        entityId: fileId,
        description: `Uploaded file "${originalName}"`,
        ipAddress,
        userAgent,
        metadata: { originalName, mimeType, size: buffer.length, fileId },
      },
    })
    .catch((err: unknown) => logger.error({ err }, "Failed to create FILE_UPLOAD audit log"));

  return { allowed: true, fileId, url };
}

/**
 * Stores a file buffer to local disk.
 * Layout: {FILE_UPLOAD_DIR}/{tenantId}/{YYYY}/{MM}/{fileId}{ext}
 */
export async function storeFileLocally(
  buffer: Buffer,
  tenantId: string,
  originalName: string,
  mimeType: string,
): Promise<{ fileId: string; path: string; url: string }> {
  const fileId = crypto.randomUUID();
  const ext = path.extname(originalName) || mimeExtension(mimeType);
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");

  const dir = path.join(env.FILE_UPLOAD_DIR, tenantId, year, month);
  await fs.mkdir(dir, { recursive: true });

  const fileName = `${fileId}${ext}`;
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, buffer);

  const url = `/api/v1/files/${fileId}`;

  return { fileId, path: filePath, url };
}

/**
 * Retrieves file metadata by searching for the .meta.json sidecar file.
 */
export async function getFileMetadata(fileId: string): Promise<FileMeta | null> {
  const metaFile = await findMetaFile(env.FILE_UPLOAD_DIR, fileId);
  if (!metaFile) return null;

  const content = await fs.readFile(metaFile, "utf8");
  return JSON.parse(content) as FileMeta;
}

/**
 * Recursively searches for a .meta.json file matching the given fileId.
 */
async function findMetaFile(baseDir: string, fileId: string): Promise<string | null> {
  try {
    await fs.access(baseDir);
  } catch {
    return null;
  }

  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      const result = await findMetaFile(fullPath, fileId);
      if (result) return result;
    } else if (
      entry.name === `${fileId}.meta.json` ||
      (entry.name.startsWith(fileId) && entry.name.endsWith(".meta.json"))
    ) {
      return fullPath;
    }
  }
  return null;
}

function mimeExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  };
  return map[mimeType] ?? "";
}

async function auditBlock(
  tenantId: string,
  userId: string,
  originalName: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string,
) {
  prisma.auditLog
    .create({
      data: {
        tenantId,
        userId,
        action: "FILE_UPLOAD_BLOCKED",
        entityType: "File",
        entityId: originalName,
        description: `File upload blocked: ${reason}`,
        ipAddress,
        userAgent,
        metadata: { originalName, reason },
      },
    })
    .catch((err: unknown) =>
      logger.error({ err }, "Failed to create FILE_UPLOAD_BLOCKED audit log"),
    );
}
