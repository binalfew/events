import type { Prisma } from "~/generated/prisma/client.js";
import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type {
  CreateRouteInput,
  RegisterVehicleInput,
  ScheduleTransferInput,
} from "~/lib/schemas/transportation";

// ─── Types ────────────────────────────────────────────────

export class TransportError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "TransportError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Route Functions ──────────────────────────────────────

export async function createRoute(input: CreateRouteInput, ctx: ServiceContext) {
  const route = await prisma.transportRoute.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      stops: input.stops as unknown as Prisma.InputJsonValue,
      frequency: input.frequency ?? null,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
    },
  });

  logger.info({ routeId: route.id, eventId: input.eventId }, "Transport route created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "TransportRoute",
      entityId: route.id,
      description: `Created transport route "${input.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { eventId: input.eventId, name: input.name },
    },
  });

  return route;
}

export async function listRoutes(eventId: string, tenantId: string) {
  return prisma.transportRoute.findMany({
    where: { eventId, tenantId },
    include: {
      _count: { select: { transfers: true } },
    },
    orderBy: { name: "asc" },
  });
}

// ─── Vehicle Functions ────────────────────────────────────

export async function registerVehicle(input: RegisterVehicleInput, ctx: ServiceContext) {
  const vehicle = await prisma.vehicle.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      plateNumber: input.plateNumber,
      type: input.type,
      capacity: input.capacity,
      driverName: input.driverName ?? null,
      driverPhone: input.driverPhone ?? null,
      gpsTrackingId: input.gpsTrackingId ?? null,
    },
  });

  logger.info({ vehicleId: vehicle.id, eventId: input.eventId }, "Vehicle registered");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Vehicle",
      entityId: vehicle.id,
      description: `Registered vehicle ${input.plateNumber} (${input.type})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { eventId: input.eventId, plateNumber: input.plateNumber, type: input.type },
    },
  });

  return vehicle;
}

export async function listVehicles(eventId: string, tenantId: string) {
  return prisma.vehicle.findMany({
    where: { eventId, tenantId, isActive: true },
    include: {
      _count: { select: { transfers: true } },
    },
    orderBy: { plateNumber: "asc" },
  });
}

// ─── Transfer Functions ───────────────────────────────────

export async function scheduleTransfer(input: ScheduleTransferInput, ctx: ServiceContext) {
  const transfer = await prisma.transfer.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      routeId: input.routeId ?? null,
      type: input.type,
      origin: input.origin,
      destination: input.destination,
      scheduledAt: new Date(input.scheduledAt),
      notes: input.notes ?? null,
      passengers: {
        create: input.participantIds.map((participantId) => ({
          participantId,
        })),
      },
    },
    include: { passengers: { include: { participant: true } } },
  });

  logger.info(
    { transferId: transfer.id, passengers: input.participantIds.length },
    "Transfer scheduled",
  );

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Transfer",
      entityId: transfer.id,
      description: `Scheduled ${input.type} transfer: ${input.origin} → ${input.destination} with ${input.participantIds.length} passenger(s)`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        type: input.type,
        origin: input.origin,
        destination: input.destination,
        passengerCount: input.participantIds.length,
      },
    },
  });

  return transfer;
}

export async function bulkScheduleTransfers(
  eventId: string,
  participantIds: string[],
  routeId: string,
  ctx: ServiceContext,
) {
  const route = await prisma.transportRoute.findFirst({
    where: { id: routeId, tenantId: ctx.tenantId },
  });
  if (!route) {
    throw new TransportError("Route not found", 404);
  }

  const stops = route.stops as Array<{ name: string; order: number }>;
  const origin = stops.length > 0 ? stops[0].name : route.name;
  const destination = stops.length > 1 ? stops[stops.length - 1].name : route.name;

  const transfer = await prisma.transfer.create({
    data: {
      tenantId: ctx.tenantId,
      eventId,
      routeId,
      type: "CUSTOM",
      origin,
      destination,
      scheduledAt: new Date(),
      passengers: {
        create: participantIds.map((participantId) => ({
          participantId,
        })),
      },
    },
    include: { passengers: true },
  });

  logger.info(
    { transferId: transfer.id, routeId, passengers: participantIds.length },
    "Bulk transfer scheduled",
  );

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Transfer",
      entityId: transfer.id,
      description: `Bulk scheduled transfer on route "${route.name}" with ${participantIds.length} passenger(s)`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { routeId, passengerCount: participantIds.length },
    },
  });

  return transfer;
}

export async function assignVehicle(transferId: string, vehicleId: string, ctx: ServiceContext) {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, tenantId: ctx.tenantId },
  });
  if (!transfer) {
    throw new TransportError("Transfer not found", 404);
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, tenantId: ctx.tenantId },
  });
  if (!vehicle) {
    throw new TransportError("Vehicle not found", 404);
  }

  const updated = await prisma.transfer.update({
    where: { id: transferId },
    data: { vehicleId },
    include: { vehicle: true },
  });

  logger.info({ transferId, vehicleId }, "Vehicle assigned to transfer");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Transfer",
      entityId: transferId,
      description: `Assigned vehicle ${vehicle.plateNumber} to transfer`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { vehicleId, plateNumber: vehicle.plateNumber },
    },
  });

  return updated;
}

// ─── Status Transitions ──────────────────────────────────

export async function markEnRoute(transferId: string, ctx: ServiceContext) {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, tenantId: ctx.tenantId },
  });
  if (!transfer) {
    throw new TransportError("Transfer not found", 404);
  }
  if (transfer.status !== "SCHEDULED") {
    throw new TransportError(
      `Cannot mark as en route from status "${transfer.status}" — must be SCHEDULED`,
      400,
    );
  }

  const updated = await prisma.transfer.update({
    where: { id: transferId },
    data: { status: "EN_ROUTE" },
  });

  logger.info({ transferId }, "Transfer marked en route");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Transfer",
      entityId: transferId,
      description: "Transfer marked as en route",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { previousStatus: transfer.status },
    },
  });

  return updated;
}

export async function markCompleted(transferId: string, ctx: ServiceContext) {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, tenantId: ctx.tenantId },
  });
  if (!transfer) {
    throw new TransportError("Transfer not found", 404);
  }
  if (transfer.status !== "EN_ROUTE") {
    throw new TransportError(
      `Cannot mark as completed from status "${transfer.status}" — must be EN_ROUTE`,
      400,
    );
  }

  const updated = await prisma.transfer.update({
    where: { id: transferId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  logger.info({ transferId }, "Transfer completed");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Transfer",
      entityId: transferId,
      description: "Transfer completed",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { previousStatus: transfer.status },
    },
  });

  return updated;
}

export async function markNoShow(transferId: string, ctx: ServiceContext) {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, tenantId: ctx.tenantId },
  });
  if (!transfer) {
    throw new TransportError("Transfer not found", 404);
  }
  if (transfer.status !== "SCHEDULED" && transfer.status !== "EN_ROUTE") {
    throw new TransportError(
      `Cannot mark as no-show from status "${transfer.status}" — must be SCHEDULED or EN_ROUTE`,
      400,
    );
  }

  const updated = await prisma.transfer.update({
    where: { id: transferId },
    data: { status: "NO_SHOW" },
  });

  logger.info({ transferId }, "Transfer marked as no-show");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Transfer",
      entityId: transferId,
      description: "Transfer marked as no-show",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { previousStatus: transfer.status },
    },
  });

  return updated;
}

export async function cancelTransfer(transferId: string, ctx: ServiceContext) {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, tenantId: ctx.tenantId },
  });
  if (!transfer) {
    throw new TransportError("Transfer not found", 404);
  }
  if (transfer.status === "COMPLETED" || transfer.status === "CANCELLED") {
    throw new TransportError(`Cannot cancel transfer with status "${transfer.status}"`, 400);
  }

  const updated = await prisma.transfer.update({
    where: { id: transferId },
    data: { status: "CANCELLED" },
  });

  logger.info({ transferId }, "Transfer cancelled");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Transfer",
      entityId: transferId,
      description: "Transfer cancelled",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { previousStatus: transfer.status },
    },
  });

  return updated;
}

// ─── Query Functions ──────────────────────────────────────

export async function getTransportDashboard(eventId: string, tenantId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [scheduled, enRoute, completed, noShow, cancelled, todaysTransfers, activeVehicles] =
    await Promise.all([
      prisma.transfer.count({ where: { eventId, tenantId, status: "SCHEDULED" } }),
      prisma.transfer.count({ where: { eventId, tenantId, status: "EN_ROUTE" } }),
      prisma.transfer.count({ where: { eventId, tenantId, status: "COMPLETED" } }),
      prisma.transfer.count({ where: { eventId, tenantId, status: "NO_SHOW" } }),
      prisma.transfer.count({ where: { eventId, tenantId, status: "CANCELLED" } }),
      prisma.transfer.count({
        where: {
          eventId,
          tenantId,
          scheduledAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.vehicle.count({ where: { eventId, tenantId, isActive: true } }),
    ]);

  return {
    scheduled,
    enRoute,
    completed,
    noShow,
    cancelled,
    total: scheduled + enRoute + completed + noShow + cancelled,
    todaysTransfers,
    activeVehicles,
  };
}

export async function getParticipantTransfers(participantId: string, tenantId: string) {
  return prisma.transferPassenger.findMany({
    where: {
      participantId,
      transfer: { tenantId },
    },
    include: {
      transfer: {
        include: { route: true, vehicle: true },
      },
    },
    orderBy: { transfer: { scheduledAt: "asc" } },
  });
}
