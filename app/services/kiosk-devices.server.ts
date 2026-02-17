import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { RegisterDeviceInput, UpdateDeviceInput } from "~/lib/schemas/kiosk-device";

// ─── Types ────────────────────────────────────────────────

export class KioskDeviceError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "KioskDeviceError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Service Functions ────────────────────────────────────

export async function registerDevice(input: RegisterDeviceInput, ctx: ServiceContext) {
  const device = await prisma.kioskDevice.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      location: input.location,
      mode: input.mode,
      language: input.language ?? "en",
    },
  });

  logger.info({ deviceId: device.id }, "Kiosk device registered");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "KioskDevice",
      entityId: device.id,
      description: `Registered kiosk device "${input.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { name: input.name, mode: input.mode, location: input.location },
    },
  });

  return device;
}

export async function listDevices(eventId: string, tenantId: string) {
  return prisma.kioskDevice.findMany({
    where: { eventId, tenantId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getDevice(id: string) {
  const device = await prisma.kioskDevice.findUnique({
    where: { id },
    include: {
      event: { select: { id: true, name: true, tenantId: true, startDate: true, endDate: true } },
    },
  });
  if (!device) {
    throw new KioskDeviceError("Device not found", 404);
  }
  return device;
}

export async function updateDevice(id: string, input: UpdateDeviceInput, ctx: ServiceContext) {
  const existing = await prisma.kioskDevice.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new KioskDeviceError("Device not found", 404);
  }

  const device = await prisma.kioskDevice.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.mode !== undefined && { mode: input.mode }),
      ...(input.language !== undefined && { language: input.language }),
    },
  });

  logger.info({ deviceId: id }, "Kiosk device updated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CONFIGURE",
      entityType: "KioskDevice",
      entityId: id,
      description: `Updated kiosk device "${device.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: JSON.parse(JSON.stringify(input)),
    },
  });

  return device;
}

export async function decommissionDevice(id: string, ctx: ServiceContext) {
  const existing = await prisma.kioskDevice.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new KioskDeviceError("Device not found", 404);
  }

  await prisma.kioskDevice.delete({ where: { id } });

  logger.info({ deviceId: id }, "Kiosk device decommissioned");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "KioskDevice",
      entityId: id,
      description: `Decommissioned kiosk device "${existing.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { name: existing.name },
    },
  });
}

export async function recordHeartbeat(deviceId: string) {
  await prisma.kioskDevice.update({
    where: { id: deviceId },
    data: {
      lastHeartbeat: new Date(),
      isOnline: true,
    },
  });
}

export async function markStaleDevicesOffline() {
  const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

  const result = await prisma.kioskDevice.updateMany({
    where: {
      lastHeartbeat: { lt: threeMinutesAgo },
      isOnline: true,
    },
    data: { isOnline: false },
  });

  if (result.count > 0) {
    logger.info({ count: result.count }, "Marked stale kiosk devices offline");
  }

  return result.count;
}
