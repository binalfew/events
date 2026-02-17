import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { decodeQRPayload, QRCodeError, type DecodedQRPayload } from "./qr-code.server";
import { updateOccupancy } from "./venue-occupancy.server";

// ─── Types ────────────────────────────────────────────────

export type ScanResultCode =
  | "VALID"
  | "INVALID"
  | "EXPIRED"
  | "REVOKED"
  | "ALREADY_SCANNED"
  | "MANUAL_OVERRIDE";

export interface ScanResponse {
  result: ScanResultCode;
  message: string;
  participantId?: string;
  participantName?: string;
  registrationCode?: string;
  accessLogId?: string;
}

interface ScanContext {
  userId: string;
  tenantId: string;
  checkpointId: string;
  deviceId?: string;
}

interface AccessLogFilters {
  eventId: string;
  checkpointId?: string;
  scanResult?: ScanResultCode;
  participantId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

// ─── Scan Pipeline ───────────────────────────────────────

/**
 * Main scan processing pipeline:
 * 1. Decode QR → 2. Verify tenant → 3. Lookup participant → 4. Check status
 * → 5. Check event date → 6. Verify checkpoint active → 7. Duplicate check
 * → 8. Create AccessLog → 9. Update occupancy → 10. Return ScanResponse
 */
export async function processScan(
  qrPayload: string,
  ctx: ScanContext,
  overrideReason?: string,
): Promise<ScanResponse> {
  // 1. Decode QR payload
  let decoded: DecodedQRPayload;
  try {
    decoded = decodeQRPayload(qrPayload);
  } catch (err) {
    const accessLog = await createAccessLog({
      checkpointId: ctx.checkpointId,
      scanType: "QR_SCAN",
      scanResult: "INVALID",
      qrPayload,
      scannedBy: ctx.userId,
      deviceId: ctx.deviceId,
    });
    return { result: "INVALID", message: "Invalid QR code", accessLogId: accessLog.id };
  }

  // 2. Verify tenant match
  if (decoded.tenantId !== ctx.tenantId) {
    const accessLog = await createAccessLog({
      checkpointId: ctx.checkpointId,
      scanType: "QR_SCAN",
      scanResult: "INVALID",
      qrPayload,
      scannedBy: ctx.userId,
      deviceId: ctx.deviceId,
    });
    return {
      result: "INVALID",
      message: "QR code from different organization",
      accessLogId: accessLog.id,
    };
  }

  // 3. Lookup participant
  const participant = await prisma.participant.findFirst({
    where: { id: decoded.participantId, tenantId: ctx.tenantId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      registrationCode: true,
      status: true,
      eventId: true,
      event: { select: { id: true, endDate: true } },
    },
  });

  if (!participant) {
    const accessLog = await createAccessLog({
      checkpointId: ctx.checkpointId,
      scanType: "QR_SCAN",
      scanResult: "INVALID",
      qrPayload,
      scannedBy: ctx.userId,
      deviceId: ctx.deviceId,
    });
    return { result: "INVALID", message: "Participant not found", accessLogId: accessLog.id };
  }

  const participantName = `${participant.firstName} ${participant.lastName}`;

  // 4. Check participant status — CANCELLED = REVOKED
  if (participant.status === "CANCELLED" || participant.status === "REJECTED") {
    const accessLog = await createAccessLog({
      checkpointId: ctx.checkpointId,
      participantId: participant.id,
      scanType: "QR_SCAN",
      scanResult: "REVOKED",
      qrPayload,
      scannedBy: ctx.userId,
      deviceId: ctx.deviceId,
    });
    return {
      result: "REVOKED",
      message: `Accreditation ${participant.status.toLowerCase()}`,
      participantId: participant.id,
      participantName,
      registrationCode: participant.registrationCode,
      accessLogId: accessLog.id,
    };
  }

  // 5. Check event date — past endDate = EXPIRED
  if (participant.event.endDate < new Date()) {
    const accessLog = await createAccessLog({
      checkpointId: ctx.checkpointId,
      participantId: participant.id,
      scanType: "QR_SCAN",
      scanResult: "EXPIRED",
      qrPayload,
      scannedBy: ctx.userId,
      deviceId: ctx.deviceId,
    });
    return {
      result: "EXPIRED",
      message: "Event has ended",
      participantId: participant.id,
      participantName,
      registrationCode: participant.registrationCode,
      accessLogId: accessLog.id,
    };
  }

  // 6. Verify checkpoint is active
  const checkpoint = await prisma.checkpoint.findFirst({
    where: { id: ctx.checkpointId, tenantId: ctx.tenantId, isActive: true },
  });

  if (!checkpoint) {
    const accessLog = await createAccessLog({
      checkpointId: ctx.checkpointId,
      participantId: participant.id,
      scanType: "QR_SCAN",
      scanResult: "INVALID",
      qrPayload,
      scannedBy: ctx.userId,
      deviceId: ctx.deviceId,
    });
    return {
      result: "INVALID",
      message: "Checkpoint is inactive or not found",
      participantId: participant.id,
      participantName,
      registrationCode: participant.registrationCode,
      accessLogId: accessLog.id,
    };
  }

  // 7. Duplicate check — same participant at same checkpoint today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const existingScan = await prisma.accessLog.findFirst({
    where: {
      checkpointId: ctx.checkpointId,
      participantId: participant.id,
      scanResult: "VALID",
      scannedAt: { gte: todayStart },
    },
  });

  if (existingScan && !overrideReason) {
    const accessLog = await createAccessLog({
      checkpointId: ctx.checkpointId,
      participantId: participant.id,
      scanType: "QR_SCAN",
      scanResult: "ALREADY_SCANNED",
      qrPayload,
      scannedBy: ctx.userId,
      deviceId: ctx.deviceId,
    });
    return {
      result: "ALREADY_SCANNED",
      message: "Already scanned at this checkpoint today",
      participantId: participant.id,
      participantName,
      registrationCode: participant.registrationCode,
      accessLogId: accessLog.id,
    };
  }

  // Override case
  const scanResult = overrideReason ? "MANUAL_OVERRIDE" : "VALID";

  // 8. Create AccessLog
  const accessLog = await createAccessLog({
    checkpointId: ctx.checkpointId,
    participantId: participant.id,
    scanType: "QR_SCAN",
    scanResult,
    qrPayload,
    scannedBy: ctx.userId,
    deviceId: ctx.deviceId,
    overrideReason,
  });

  // 9. Update occupancy (fire-and-forget for speed)
  const direction = checkpoint.direction === "exit" ? "exit" : "entry";
  updateOccupancy(participant.eventId, direction).catch((err) => {
    logger.warn({ err, eventId: participant.eventId }, "Failed to update occupancy");
  });

  // 10. Return success
  return {
    result: scanResult as ScanResultCode,
    message: overrideReason ? "Override accepted" : "Access granted",
    participantId: participant.id,
    participantName,
    registrationCode: participant.registrationCode,
    accessLogId: accessLog.id,
  };
}

/**
 * Process a manual entry by registration code (fallback when QR scan fails).
 */
export async function processManualEntry(
  registrationCode: string,
  ctx: ScanContext,
): Promise<ScanResponse> {
  const participant = await prisma.participant.findFirst({
    where: { registrationCode, tenantId: ctx.tenantId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      registrationCode: true,
      status: true,
      eventId: true,
      event: { select: { id: true, endDate: true } },
    },
  });

  if (!participant) {
    const accessLog = await createAccessLog({
      checkpointId: ctx.checkpointId,
      scanType: "MANUAL_ENTRY",
      scanResult: "INVALID",
      qrPayload: registrationCode,
      scannedBy: ctx.userId,
      deviceId: ctx.deviceId,
    });
    return { result: "INVALID", message: "Registration code not found", accessLogId: accessLog.id };
  }

  const participantName = `${participant.firstName} ${participant.lastName}`;

  if (participant.status === "CANCELLED" || participant.status === "REJECTED") {
    const accessLog = await createAccessLog({
      checkpointId: ctx.checkpointId,
      participantId: participant.id,
      scanType: "MANUAL_ENTRY",
      scanResult: "REVOKED",
      qrPayload: registrationCode,
      scannedBy: ctx.userId,
      deviceId: ctx.deviceId,
    });
    return {
      result: "REVOKED",
      message: `Accreditation ${participant.status.toLowerCase()}`,
      participantId: participant.id,
      participantName,
      registrationCode: participant.registrationCode,
      accessLogId: accessLog.id,
    };
  }

  if (participant.event.endDate < new Date()) {
    const accessLog = await createAccessLog({
      checkpointId: ctx.checkpointId,
      participantId: participant.id,
      scanType: "MANUAL_ENTRY",
      scanResult: "EXPIRED",
      qrPayload: registrationCode,
      scannedBy: ctx.userId,
      deviceId: ctx.deviceId,
    });
    return {
      result: "EXPIRED",
      message: "Event has ended",
      participantId: participant.id,
      participantName,
      registrationCode: participant.registrationCode,
      accessLogId: accessLog.id,
    };
  }

  const accessLog = await createAccessLog({
    checkpointId: ctx.checkpointId,
    participantId: participant.id,
    scanType: "MANUAL_ENTRY",
    scanResult: "VALID",
    qrPayload: registrationCode,
    scannedBy: ctx.userId,
    deviceId: ctx.deviceId,
  });

  // Update occupancy
  const checkpoint = await prisma.checkpoint.findFirst({
    where: { id: ctx.checkpointId },
  });
  if (checkpoint) {
    const direction = checkpoint.direction === "exit" ? "exit" : "entry";
    updateOccupancy(participant.eventId, direction).catch((err) => {
      logger.warn({ err }, "Failed to update occupancy");
    });
  }

  return {
    result: "VALID",
    message: "Access granted (manual entry)",
    participantId: participant.id,
    participantName,
    registrationCode: participant.registrationCode,
    accessLogId: accessLog.id,
  };
}

// ─── Access Log Queries ──────────────────────────────────

export async function getAccessLogs(tenantId: string, filters: AccessLogFilters) {
  const page = filters.page ?? 1;
  const pageSize = Math.min(filters.pageSize ?? 20, 100);
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {
    checkpoint: { tenantId, eventId: filters.eventId },
  };

  if (filters.checkpointId) where.checkpointId = filters.checkpointId;
  if (filters.scanResult) where.scanResult = filters.scanResult;
  if (filters.participantId) where.participantId = filters.participantId;
  if (filters.startDate || filters.endDate) {
    where.scannedAt = {
      ...(filters.startDate && { gte: filters.startDate }),
      ...(filters.endDate && { lte: filters.endDate }),
    };
  }

  const [items, total] = await Promise.all([
    prisma.accessLog.findMany({
      where: where as any,
      include: {
        checkpoint: { select: { name: true, type: true, location: true } },
        participant: {
          select: { firstName: true, lastName: true, registrationCode: true },
        },
      },
      orderBy: { scannedAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.accessLog.count({ where: where as any }),
  ]);

  return {
    items,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

/**
 * Export access logs as CSV content.
 */
export async function exportAccessLogsCsv(tenantId: string, eventId: string): Promise<string> {
  const logs = await prisma.accessLog.findMany({
    where: { checkpoint: { tenantId, eventId } },
    include: {
      checkpoint: { select: { name: true, type: true, location: true } },
      participant: {
        select: { firstName: true, lastName: true, registrationCode: true },
      },
    },
    orderBy: { scannedAt: "desc" },
    take: 10000,
  });

  const headers = [
    "Scanned At",
    "Checkpoint",
    "Location",
    "Participant Name",
    "Registration Code",
    "Scan Type",
    "Result",
    "Override Reason",
    "Scanned By",
  ];

  const rows = logs.map((log) => [
    log.scannedAt.toISOString(),
    log.checkpoint.name,
    log.checkpoint.location ?? "",
    log.participant ? `${log.participant.firstName} ${log.participant.lastName}` : "",
    log.participant?.registrationCode ?? "",
    log.scanType,
    log.scanResult,
    log.overrideReason ?? "",
    log.scannedBy,
  ]);

  const csvLines = [headers, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
  );

  return csvLines.join("\n");
}

// ─── Helpers ─────────────────────────────────────────────

async function createAccessLog(data: {
  checkpointId: string;
  participantId?: string;
  scanType: "QR_SCAN" | "NFC_TAP" | "MANUAL_ENTRY";
  scanResult: string;
  qrPayload: string;
  scannedBy: string;
  deviceId?: string;
  overrideReason?: string;
}) {
  return prisma.accessLog.create({
    data: {
      checkpointId: data.checkpointId,
      participantId: data.participantId,
      scanType: data.scanType,
      scanResult: data.scanResult as any,
      qrPayload: data.qrPayload,
      scannedBy: data.scannedBy,
      deviceId: data.deviceId,
      overrideReason: data.overrideReason,
    },
  });
}
