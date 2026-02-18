import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { CreateParkingZoneInput, IssuePermitInput } from "~/lib/schemas/parking";

// ─── Types ────────────────────────────────────────────────

export class ParkingError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ParkingError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Zone Functions ───────────────────────────────────────

export async function createParkingZone(input: CreateParkingZoneInput, ctx: ServiceContext) {
  const zone = await prisma.parkingZone.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      code: input.code,
      capacity: input.capacity,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      color: input.color ?? null,
    },
  });

  logger.info({ zoneId: zone.id, eventId: input.eventId }, "Parking zone created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "ParkingZone",
      entityId: zone.id,
      description: `Created parking zone "${input.name}" (${input.code})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { eventId: input.eventId, code: input.code },
    },
  });

  return zone;
}

export async function listParkingZones(eventId: string, tenantId: string) {
  return prisma.parkingZone.findMany({
    where: { eventId, tenantId },
    include: {
      _count: { select: { permits: true } },
    },
    orderBy: { code: "asc" },
  });
}

// ─── Permit Functions ─────────────────────────────────────

export async function issuePermit(input: IssuePermitInput, ctx: ServiceContext) {
  const zone = await prisma.parkingZone.findFirst({
    where: { id: input.zoneId, tenantId: ctx.tenantId },
  });
  if (!zone) {
    throw new ParkingError("Parking zone not found", 404);
  }

  // Check zone capacity
  const activePermits = await prisma.parkingPermit.count({
    where: { zoneId: input.zoneId, status: "ACTIVE" },
  });
  if (activePermits >= zone.capacity) {
    throw new ParkingError("Parking zone is at full capacity", 409);
  }

  const permitNumber = `PK-${zone.code}-${Date.now().toString(36).toUpperCase()}`;

  const permit = await prisma.parkingPermit.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      zoneId: input.zoneId,
      participantId: input.participantId ?? null,
      vehiclePlate: input.vehiclePlate ?? null,
      permitNumber,
      validFrom: new Date(input.validFrom),
      validUntil: new Date(input.validUntil),
      issuedBy: ctx.userId,
    },
    include: { zone: true, participant: true },
  });

  logger.info({ permitId: permit.id, zoneId: input.zoneId }, "Parking permit issued");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "ParkingPermit",
      entityId: permit.id,
      description: `Issued parking permit ${permitNumber} for zone "${zone.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        zoneId: input.zoneId,
        permitNumber,
        vehiclePlate: input.vehiclePlate,
      },
    },
  });

  return permit;
}

export async function revokePermit(permitId: string, reason: string, ctx: ServiceContext) {
  const permit = await prisma.parkingPermit.findFirst({
    where: { id: permitId, tenantId: ctx.tenantId },
  });
  if (!permit) {
    throw new ParkingError("Parking permit not found", 404);
  }
  if (permit.status === "REVOKED") {
    throw new ParkingError("Permit is already revoked", 400);
  }

  const updated = await prisma.parkingPermit.update({
    where: { id: permitId },
    data: { status: "REVOKED" },
  });

  logger.info({ permitId, reason }, "Parking permit revoked");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "ParkingPermit",
      entityId: permitId,
      description: `Revoked parking permit: ${reason}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { previousStatus: permit.status, reason },
    },
  });

  return updated;
}

export async function scanPermit(permitId: string, ctx: ServiceContext) {
  const permit = await prisma.parkingPermit.findFirst({
    where: { id: permitId, tenantId: ctx.tenantId },
    include: { zone: true },
  });
  if (!permit) {
    throw new ParkingError("Parking permit not found", 404);
  }
  if (permit.status !== "ACTIVE") {
    throw new ParkingError(`Permit is ${permit.status} — access denied`, 403);
  }

  const now = new Date();
  if (now < permit.validFrom || now > permit.validUntil) {
    throw new ParkingError("Permit is outside its validity period — access denied", 403);
  }

  logger.info({ permitId, zone: permit.zone.name }, "Parking permit scanned — access granted");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "ParkingPermit",
      entityId: permitId,
      description: `Parking permit scanned at zone "${permit.zone.name}" — access granted`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { zoneId: permit.zoneId, zoneName: permit.zone.name },
    },
  });

  return { granted: true, zone: permit.zone, permit };
}

// ─── Stats ────────────────────────────────────────────────

export async function getParkingStats(eventId: string, tenantId: string) {
  const [active, expired, revoked, suspended, zones] = await Promise.all([
    prisma.parkingPermit.count({ where: { eventId, tenantId, status: "ACTIVE" } }),
    prisma.parkingPermit.count({ where: { eventId, tenantId, status: "EXPIRED" } }),
    prisma.parkingPermit.count({ where: { eventId, tenantId, status: "REVOKED" } }),
    prisma.parkingPermit.count({ where: { eventId, tenantId, status: "SUSPENDED" } }),
    prisma.parkingZone.findMany({
      where: { eventId, tenantId },
      include: {
        _count: { select: { permits: { where: { status: "ACTIVE" } } } },
      },
    }),
  ]);

  const total = active + expired + revoked + suspended;
  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);

  return {
    active,
    expired,
    revoked,
    suspended,
    total,
    totalCapacity,
    occupancyRate: totalCapacity > 0 ? Math.round((active / totalCapacity) * 100) : 0,
    zones: zones.map((z) => ({
      id: z.id,
      name: z.name,
      code: z.code,
      capacity: z.capacity,
      activePermits: z._count.permits,
      occupancyRate: z.capacity > 0 ? Math.round((z._count.permits / z.capacity) * 100) : 0,
    })),
  };
}
