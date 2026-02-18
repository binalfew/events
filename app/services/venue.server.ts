import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { CreateVenueMapInput, CreateRoomInput, BookRoomInput } from "~/lib/schemas/venue";

// ─── Types ────────────────────────────────────────────────

export class VenueError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "VenueError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Venue Map Functions ──────────────────────────────────

export async function createVenueMap(input: CreateVenueMapInput, ctx: ServiceContext) {
  const venue = await prisma.venueMap.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      description: input.description ?? null,
      floorPlanUrl: input.floorPlanUrl ?? null,
    },
  });

  logger.info({ venueId: venue.id, eventId: input.eventId }, "Venue map created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "VenueMap",
      entityId: venue.id,
      description: `Created venue "${input.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { eventId: input.eventId },
    },
  });

  return venue;
}

export async function listVenueMaps(eventId: string, tenantId: string) {
  return prisma.venueMap.findMany({
    where: { eventId, tenantId, isActive: true },
    include: {
      rooms: {
        where: { isActive: true },
        include: {
          bookings: {
            select: { id: true },
            where: { status: { not: "CANCELLED" } },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

// ─── Room Functions ───────────────────────────────────────

export async function createRoom(input: CreateRoomInput, ctx: ServiceContext) {
  const venue = await prisma.venueMap.findFirst({
    where: { id: input.venueMapId, tenantId: ctx.tenantId },
  });
  if (!venue) {
    throw new VenueError("Venue not found", 404);
  }

  const equipmentArray = input.equipment
    ? input.equipment
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
    : [];

  const room = await prisma.venueRoom.create({
    data: {
      venueMapId: input.venueMapId,
      name: input.name,
      floor: input.floor ?? null,
      capacity: input.capacity ?? null,
      roomType: input.roomType ?? null,
      equipment: equipmentArray,
    },
  });

  logger.info({ roomId: room.id, venueMapId: input.venueMapId }, "Room created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "VenueRoom",
      entityId: room.id,
      description: `Created room "${input.name}" in venue "${venue.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { venueMapId: input.venueMapId, roomType: input.roomType },
    },
  });

  return room;
}

export async function listRooms(eventId: string, tenantId: string, venueMapId?: string) {
  const where: Record<string, unknown> = { isActive: true };
  if (venueMapId) {
    where.venueMapId = venueMapId;
  } else {
    where.venueMap = { eventId, tenantId, isActive: true };
  }

  return prisma.venueRoom.findMany({
    where,
    include: {
      venueMap: { select: { id: true, name: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: [{ venueMap: { name: "asc" } }, { name: "asc" }],
  });
}

// ─── Booking Functions ────────────────────────────────────

export async function bookRoom(input: BookRoomInput, ctx: ServiceContext) {
  const room = await prisma.venueRoom.findFirst({
    where: { id: input.roomId, isActive: true },
    include: { venueMap: true },
  });
  if (!room) {
    throw new VenueError("Room not found", 404);
  }

  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);

  if (endTime <= startTime) {
    throw new VenueError("End time must be after start time", 400);
  }

  // Check for overlapping bookings
  const conflict = await prisma.roomBooking.findFirst({
    where: {
      roomId: input.roomId,
      status: { not: "CANCELLED" },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });
  if (conflict) {
    throw new VenueError("Room is already booked for this time slot", 409);
  }

  const booking = await prisma.roomBooking.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      roomId: input.roomId,
      title: input.title,
      description: input.description ?? null,
      startTime,
      endTime,
      bookedBy: ctx.userId,
    },
    include: { room: { include: { venueMap: true } } },
  });

  logger.info({ bookingId: booking.id, roomId: input.roomId }, "Room booked");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "RoomBooking",
      entityId: booking.id,
      description: `Booked room "${room.name}" for "${input.title}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { roomId: input.roomId, title: input.title },
    },
  });

  return booking;
}

export async function confirmBooking(bookingId: string, ctx: ServiceContext) {
  const booking = await prisma.roomBooking.findFirst({
    where: { id: bookingId, tenantId: ctx.tenantId },
  });
  if (!booking) {
    throw new VenueError("Booking not found", 404);
  }
  if (booking.status !== "TENTATIVE") {
    throw new VenueError(`Cannot confirm booking with status ${booking.status}`, 400);
  }

  const updated = await prisma.roomBooking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
  });

  logger.info({ bookingId }, "Room booking confirmed");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "RoomBooking",
      entityId: bookingId,
      description: `Confirmed room booking "${booking.title}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { previousStatus: booking.status },
    },
  });

  return updated;
}

export async function cancelBooking(bookingId: string, reason: string, ctx: ServiceContext) {
  const booking = await prisma.roomBooking.findFirst({
    where: { id: bookingId, tenantId: ctx.tenantId },
  });
  if (!booking) {
    throw new VenueError("Booking not found", 404);
  }
  if (booking.status === "CANCELLED") {
    throw new VenueError("Booking is already cancelled", 400);
  }

  const updated = await prisma.roomBooking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  logger.info({ bookingId, reason }, "Room booking cancelled");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "RoomBooking",
      entityId: bookingId,
      description: `Cancelled room booking "${booking.title}": ${reason}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { previousStatus: booking.status, reason },
    },
  });

  return updated;
}

// ─── Availability & Schedule ──────────────────────────────

export async function getRoomAvailability(roomId: string, date: string, tenantId: string) {
  const room = await prisma.venueRoom.findFirst({
    where: { id: roomId, isActive: true },
  });
  if (!room) {
    throw new VenueError("Room not found", 404);
  }

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  const bookings = await prisma.roomBooking.findMany({
    where: {
      roomId,
      status: { not: "CANCELLED" },
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      status: true,
    },
  });

  return { room, date, bookings };
}

export async function getRoomSchedule(eventId: string, tenantId: string, date: string) {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  const bookings = await prisma.roomBooking.findMany({
    where: {
      eventId,
      tenantId,
      status: { not: "CANCELLED" },
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    include: {
      room: { include: { venueMap: { select: { name: true } } } },
      bookedByUser: { select: { name: true, email: true } },
    },
    orderBy: [{ room: { name: "asc" } }, { startTime: "asc" }],
  });

  return bookings;
}

// ─── Stats ────────────────────────────────────────────────

export async function getVenueOverview(eventId: string, tenantId: string) {
  const [venueList, totalBookings, confirmedBookings, tentativeBookings, cancelledBookings] =
    await Promise.all([
      prisma.venueMap.findMany({
        where: { eventId, tenantId, isActive: true },
        include: {
          rooms: {
            where: { isActive: true },
            select: { capacity: true },
          },
        },
      }),
      prisma.roomBooking.count({ where: { eventId, tenantId } }),
      prisma.roomBooking.count({ where: { eventId, tenantId, status: "CONFIRMED" } }),
      prisma.roomBooking.count({ where: { eventId, tenantId, status: "TENTATIVE" } }),
      prisma.roomBooking.count({ where: { eventId, tenantId, status: "CANCELLED" } }),
    ]);

  const venues = venueList.length;
  const rooms = venueList.reduce((sum, v) => sum + v.rooms.length, 0);
  const totalCapacity = venueList.reduce(
    (sum, v) => sum + v.rooms.reduce((s, r) => s + (r.capacity ?? 0), 0),
    0,
  );

  return {
    venues,
    rooms,
    totalCapacity,
    totalBookings,
    confirmedBookings,
    tentativeBookings,
    cancelledBookings,
    activeBookings: confirmedBookings + tentativeBookings,
  };
}
