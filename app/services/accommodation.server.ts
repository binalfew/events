import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type {
  CreateHotelInput,
  CreateRoomBlockInput,
  AssignRoomInput,
} from "~/lib/schemas/accommodation";

// ─── Types ────────────────────────────────────────────────

export class AccommodationError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AccommodationError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Hotel Functions ──────────────────────────────────────

export async function createHotel(input: CreateHotelInput, ctx: ServiceContext) {
  const hotel = await prisma.hotel.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      address: input.address,
      starRating: input.starRating ?? null,
      totalRooms: input.totalRooms,
      contactName: input.contactName ?? null,
      contactPhone: input.contactPhone ?? null,
      distanceToVenue: input.distanceToVenue ?? null,
      notes: input.notes ?? null,
    },
  });

  logger.info({ hotelId: hotel.id, eventId: input.eventId }, "Hotel created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Hotel",
      entityId: hotel.id,
      description: `Created hotel "${input.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { eventId: input.eventId, name: input.name },
    },
  });

  return hotel;
}

export async function listHotels(eventId: string, tenantId: string) {
  return prisma.hotel.findMany({
    where: { eventId, tenantId },
    include: {
      roomBlocks: {
        include: {
          _count: { select: { assignments: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

// ─── Room Block Functions ─────────────────────────────────

export async function createRoomBlock(input: CreateRoomBlockInput, ctx: ServiceContext) {
  const hotel = await prisma.hotel.findFirst({
    where: { id: input.hotelId, tenantId: ctx.tenantId },
  });
  if (!hotel) {
    throw new AccommodationError("Hotel not found", 404);
  }

  const roomBlock = await prisma.roomBlock.create({
    data: {
      hotelId: input.hotelId,
      roomType: input.roomType,
      quantity: input.quantity,
      pricePerNight: input.pricePerNight ?? null,
      checkInDate: new Date(input.checkInDate),
      checkOutDate: new Date(input.checkOutDate),
      contactEmail: input.contactEmail ?? null,
      participantTypeId: input.participantTypeId ?? null,
    },
  });

  logger.info({ roomBlockId: roomBlock.id, hotelId: input.hotelId }, "Room block created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "RoomBlock",
      entityId: roomBlock.id,
      description: `Created room block "${input.roomType}" (qty: ${input.quantity}) at hotel "${hotel.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { hotelId: input.hotelId, roomType: input.roomType, quantity: input.quantity },
    },
  });

  return roomBlock;
}

// ─── Assignment Functions ─────────────────────────────────

export async function assignRoom(input: AssignRoomInput, ctx: ServiceContext) {
  // Get room block with hotel info
  const roomBlock = await prisma.roomBlock.findFirst({
    where: { id: input.roomBlockId },
    include: { hotel: true, _count: { select: { assignments: true } } },
  });
  if (!roomBlock) {
    throw new AccommodationError("Room block not found", 404);
  }
  if (roomBlock.hotel.tenantId !== ctx.tenantId) {
    throw new AccommodationError("Room block not found", 404);
  }

  // Check availability
  if (roomBlock._count.assignments >= roomBlock.quantity) {
    throw new AccommodationError("Room block is full — no available rooms", 409);
  }

  // participantId has @unique on AccommodationAssignment, Prisma will enforce,
  // but let's give a better error message
  const existing = await prisma.accommodationAssignment.findUnique({
    where: { participantId: input.participantId },
  });
  if (existing) {
    throw new AccommodationError("Participant already has an accommodation assignment", 409);
  }

  const assignment = await prisma.accommodationAssignment.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: roomBlock.hotel.eventId,
      roomBlockId: input.roomBlockId,
      participantId: input.participantId,
      roomNumber: input.roomNumber ?? null,
      checkInDate: roomBlock.checkInDate,
      checkOutDate: roomBlock.checkOutDate,
      specialRequests: input.specialRequests ?? null,
      assignedBy: ctx.userId,
    },
    include: { participant: true },
  });

  logger.info({ assignmentId: assignment.id, participantId: input.participantId }, "Room assigned");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "AccommodationAssignment",
      entityId: assignment.id,
      description: `Assigned room to participant ${assignment.participant.firstName} ${assignment.participant.lastName}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        roomBlockId: input.roomBlockId,
        participantId: input.participantId,
        roomNumber: input.roomNumber,
      },
    },
  });

  return assignment;
}

export async function releaseRoom(assignmentId: string, ctx: ServiceContext) {
  const assignment = await prisma.accommodationAssignment.findFirst({
    where: { id: assignmentId, tenantId: ctx.tenantId },
  });
  if (!assignment) {
    throw new AccommodationError("Assignment not found", 404);
  }

  const updated = await prisma.accommodationAssignment.update({
    where: { id: assignmentId },
    data: { status: "CANCELLED" },
  });

  logger.info({ assignmentId }, "Room assignment released");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "AccommodationAssignment",
      entityId: assignmentId,
      description: "Room assignment cancelled/released",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { previousStatus: assignment.status },
    },
  });

  return updated;
}

export async function checkIn(assignmentId: string, ctx: ServiceContext) {
  const assignment = await prisma.accommodationAssignment.findFirst({
    where: { id: assignmentId, tenantId: ctx.tenantId },
  });
  if (!assignment) {
    throw new AccommodationError("Assignment not found", 404);
  }
  if (assignment.status !== "PENDING" && assignment.status !== "CONFIRMED") {
    throw new AccommodationError(
      `Cannot check in from status "${assignment.status}" — must be PENDING or CONFIRMED`,
      400,
    );
  }

  const updated = await prisma.accommodationAssignment.update({
    where: { id: assignmentId },
    data: { status: "CHECKED_IN" },
  });

  logger.info({ assignmentId }, "Accommodation check-in");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "AccommodationAssignment",
      entityId: assignmentId,
      description: "Participant checked in to accommodation",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { previousStatus: assignment.status },
    },
  });

  return updated;
}

export async function checkOut(assignmentId: string, ctx: ServiceContext) {
  const assignment = await prisma.accommodationAssignment.findFirst({
    where: { id: assignmentId, tenantId: ctx.tenantId },
  });
  if (!assignment) {
    throw new AccommodationError("Assignment not found", 404);
  }
  if (assignment.status !== "CHECKED_IN") {
    throw new AccommodationError(
      `Cannot check out from status "${assignment.status}" — must be CHECKED_IN`,
      400,
    );
  }

  const updated = await prisma.accommodationAssignment.update({
    where: { id: assignmentId },
    data: { status: "CHECKED_OUT" },
  });

  logger.info({ assignmentId }, "Accommodation check-out");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "AccommodationAssignment",
      entityId: assignmentId,
      description: "Participant checked out of accommodation",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { previousStatus: assignment.status },
    },
  });

  return updated;
}

// ─── Query Functions ──────────────────────────────────────

export async function getRoomingList(eventId: string, tenantId: string, hotelId?: string) {
  const where: Record<string, unknown> = { eventId, tenantId };
  if (hotelId) {
    where.roomBlock = { hotelId };
  }

  return prisma.accommodationAssignment.findMany({
    where,
    include: {
      participant: true,
      roomBlock: { include: { hotel: true } },
    },
    orderBy: [{ roomBlock: { hotel: { name: "asc" } } }, { roomNumber: "asc" }],
  });
}

export async function getAccommodationStats(eventId: string, tenantId: string) {
  const [pending, confirmed, checkedIn, checkedOut, cancelled, hotels] = await Promise.all([
    prisma.accommodationAssignment.count({
      where: { eventId, tenantId, status: "PENDING" },
    }),
    prisma.accommodationAssignment.count({
      where: { eventId, tenantId, status: "CONFIRMED" },
    }),
    prisma.accommodationAssignment.count({
      where: { eventId, tenantId, status: "CHECKED_IN" },
    }),
    prisma.accommodationAssignment.count({
      where: { eventId, tenantId, status: "CHECKED_OUT" },
    }),
    prisma.accommodationAssignment.count({
      where: { eventId, tenantId, status: "CANCELLED" },
    }),
    prisma.hotel.findMany({
      where: { eventId, tenantId },
      include: {
        roomBlocks: {
          include: { _count: { select: { assignments: true } } },
        },
      },
    }),
  ]);

  const totalAssigned = pending + confirmed + checkedIn + checkedOut + cancelled;
  const totalHotels = hotels.length;
  let totalRooms = 0;
  let totalAvailable = 0;

  for (const hotel of hotels) {
    for (const block of hotel.roomBlocks) {
      totalRooms += block.quantity;
      totalAvailable += Math.max(0, block.quantity - block._count.assignments);
    }
  }

  return {
    totalHotels,
    totalRooms,
    totalAssigned,
    totalAvailable,
    pending,
    confirmed,
    checkedIn,
    checkedOut,
    cancelled,
    occupancyRate:
      totalRooms > 0 ? Math.round(((totalAssigned - cancelled) / totalRooms) * 100) : 0,
  };
}

// ─── Auto-assign ──────────────────────────────────────────

export async function autoAssignRooms(
  eventId: string,
  tenantId: string,
  strategy: string,
  ctx: ServiceContext,
) {
  // Find participants without accommodation assignments
  const unassigned = await prisma.participant.findMany({
    where: {
      eventId,
      tenantId,
      status: "APPROVED",
      accommodationAssignment: null,
    },
    include: { participantType: true },
    orderBy:
      strategy === "by_participant_type" ? { participantTypeId: "asc" } : { lastName: "asc" },
  });

  // Find room blocks with availability
  const roomBlocks = await prisma.roomBlock.findMany({
    where: {
      hotel: { eventId, tenantId },
      status: "AVAILABLE",
    },
    include: {
      hotel: true,
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  let assignedCount = 0;

  for (const participant of unassigned) {
    // Find a room block with availability, optionally matching participant type
    const block = roomBlocks.find((b) => {
      const available = b.quantity - b._count.assignments;
      if (available <= 0) return false;
      if (strategy === "by_participant_type" && b.participantTypeId) {
        return b.participantTypeId === participant.participantTypeId;
      }
      return true;
    });

    if (!block) continue;

    await prisma.accommodationAssignment.create({
      data: {
        tenantId,
        eventId,
        roomBlockId: block.id,
        participantId: participant.id,
        checkInDate: block.checkInDate,
        checkOutDate: block.checkOutDate,
        assignedBy: ctx.userId,
      },
    });

    // Update in-memory count
    block._count.assignments += 1;
    assignedCount++;
  }

  logger.info({ eventId, strategy, assignedCount }, "Auto-assigned accommodation rooms");

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "AccommodationAssignment",
      entityId: eventId,
      description: `Auto-assigned ${assignedCount} participants to rooms (strategy: ${strategy})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { strategy, assignedCount },
    },
  });

  return { assignedCount };
}
