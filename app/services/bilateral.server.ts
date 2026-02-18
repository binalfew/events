import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { RequestMeetingInput, ConfirmMeetingInput } from "~/lib/schemas/bilateral";

// ─── Types ────────────────────────────────────────────────

export class BilateralError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "BilateralError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Request / Lifecycle ──────────────────────────────────

export async function requestMeeting(input: RequestMeetingInput, ctx: ServiceContext) {
  if (input.requesterId === input.requesteeId) {
    throw new BilateralError("Cannot request a meeting with the same participant", 400);
  }

  const meeting = await prisma.bilateralMeeting.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      requesterId: input.requesterId,
      requesteeId: input.requesteeId,
      requestedBy: ctx.userId,
      priority: input.priority,
      duration: input.duration,
      notes: input.notes ?? null,
    },
    include: {
      requester: { select: { id: true, firstName: true, lastName: true } },
      requestee: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  logger.info({ meetingId: meeting.id }, "Bilateral meeting requested");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "BilateralMeeting",
      entityId: meeting.id,
      description: `Requested bilateral meeting between ${meeting.requester.firstName} ${meeting.requester.lastName} and ${meeting.requestee.firstName} ${meeting.requestee.lastName}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { eventId: input.eventId, duration: input.duration },
    },
  });

  return meeting;
}

export async function confirmMeeting(input: ConfirmMeetingInput, ctx: ServiceContext) {
  const meeting = await prisma.bilateralMeeting.findFirst({
    where: { id: input.meetingId, tenantId: ctx.tenantId },
  });
  if (!meeting) {
    throw new BilateralError("Meeting not found", 404);
  }
  if (meeting.status !== "REQUESTED") {
    throw new BilateralError(`Cannot confirm a meeting with status ${meeting.status}`, 400);
  }

  const scheduledAt = new Date(input.scheduledAt);

  const updated = await prisma.bilateralMeeting.update({
    where: { id: input.meetingId },
    data: {
      status: "CONFIRMED",
      scheduledAt,
      roomId: input.roomId ?? null,
      confirmedAt: new Date(),
    },
    include: {
      requester: { select: { id: true, firstName: true, lastName: true } },
      requestee: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // If a slot was specified, mark it as booked
  if (input.slotId) {
    await prisma.meetingSlot.update({
      where: { id: input.slotId },
      data: { isBooked: true, meetingId: input.meetingId },
    });
  }

  logger.info({ meetingId: input.meetingId }, "Bilateral meeting confirmed");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "BilateralMeeting",
      entityId: input.meetingId,
      description: `Confirmed bilateral meeting at ${scheduledAt.toISOString()}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { roomId: input.roomId, scheduledAt: scheduledAt.toISOString() },
    },
  });

  return updated;
}

export async function declineMeeting(
  meetingId: string,
  reason: string | null,
  ctx: ServiceContext,
) {
  const meeting = await prisma.bilateralMeeting.findFirst({
    where: { id: meetingId, tenantId: ctx.tenantId },
  });
  if (!meeting) {
    throw new BilateralError("Meeting not found", 404);
  }
  if (meeting.status !== "REQUESTED") {
    throw new BilateralError(`Cannot decline a meeting with status ${meeting.status}`, 400);
  }

  const updated = await prisma.bilateralMeeting.update({
    where: { id: meetingId },
    data: {
      status: "DECLINED",
      notes: reason ? `${meeting.notes ?? ""}\n[Declined] ${reason}`.trim() : meeting.notes,
    },
  });

  logger.info({ meetingId }, "Bilateral meeting declined");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "BilateralMeeting",
      entityId: meetingId,
      description: `Declined bilateral meeting${reason ? `: ${reason}` : ""}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

export async function cancelMeeting(meetingId: string, reason: string | null, ctx: ServiceContext) {
  const meeting = await prisma.bilateralMeeting.findFirst({
    where: { id: meetingId, tenantId: ctx.tenantId },
  });
  if (!meeting) {
    throw new BilateralError("Meeting not found", 404);
  }
  if (meeting.status === "COMPLETED" || meeting.status === "CANCELLED") {
    throw new BilateralError(`Cannot cancel a meeting with status ${meeting.status}`, 400);
  }

  const updated = await prisma.bilateralMeeting.update({
    where: { id: meetingId },
    data: {
      status: "CANCELLED",
      notes: reason ? `${meeting.notes ?? ""}\n[Cancelled] ${reason}`.trim() : meeting.notes,
    },
  });

  // Release any booked slots
  await prisma.meetingSlot.updateMany({
    where: { meetingId },
    data: { isBooked: false, meetingId: null },
  });

  logger.info({ meetingId }, "Bilateral meeting cancelled");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "BilateralMeeting",
      entityId: meetingId,
      description: `Cancelled bilateral meeting${reason ? `: ${reason}` : ""}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

export async function completeMeeting(
  meetingId: string,
  notes: string | null,
  ctx: ServiceContext,
) {
  const meeting = await prisma.bilateralMeeting.findFirst({
    where: { id: meetingId, tenantId: ctx.tenantId },
  });
  if (!meeting) {
    throw new BilateralError("Meeting not found", 404);
  }
  if (meeting.status !== "CONFIRMED") {
    throw new BilateralError("Only confirmed meetings can be marked as completed", 400);
  }

  const updated = await prisma.bilateralMeeting.update({
    where: { id: meetingId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      notes: notes ? `${meeting.notes ?? ""}\n[Completed] ${notes}`.trim() : meeting.notes,
    },
  });

  logger.info({ meetingId }, "Bilateral meeting completed");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "BilateralMeeting",
      entityId: meetingId,
      description: "Marked bilateral meeting as completed",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

// ─── Slots & Availability ─────────────────────────────────

export async function getAvailableSlots(
  eventId: string,
  tenantId: string,
  date: string,
  participantIds: string[],
) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  // Get all slots for the day
  const slots = await prisma.meetingSlot.findMany({
    where: {
      eventId,
      tenantId,
      startTime: { gte: dayStart },
      endTime: { lte: dayEnd },
      isBooked: false,
    },
    orderBy: { startTime: "asc" },
  });

  // Get confirmed meetings for the participants on that day
  const busyMeetings = await prisma.bilateralMeeting.findMany({
    where: {
      eventId,
      tenantId,
      status: "CONFIRMED",
      scheduledAt: { gte: dayStart, lte: dayEnd },
      OR: [{ requesterId: { in: participantIds } }, { requesteeId: { in: participantIds } }],
    },
    select: { scheduledAt: true, duration: true },
  });

  // Filter out slots that overlap with busy times
  const available = slots.filter((slot) => {
    for (const busy of busyMeetings) {
      if (!busy.scheduledAt) continue;
      const busyEnd = new Date(busy.scheduledAt.getTime() + busy.duration * 60 * 1000);
      if (slot.startTime < busyEnd && slot.endTime > busy.scheduledAt) {
        return false;
      }
    }
    return true;
  });

  return available;
}

export async function createMeetingSlot(
  input: { eventId: string; startTime: string; endTime: string; roomId?: string },
  ctx: ServiceContext,
) {
  const slot = await prisma.meetingSlot.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
      roomId: input.roomId ?? null,
    },
  });

  logger.info({ slotId: slot.id }, "Meeting slot created");

  return slot;
}

// ─── Queries ──────────────────────────────────────────────

export async function getMeetingSchedule(eventId: string, tenantId: string, date?: string) {
  const where: any = { eventId, tenantId };

  if (date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    where.scheduledAt = { gte: dayStart, lte: dayEnd };
  }

  return prisma.bilateralMeeting.findMany({
    where,
    include: {
      requester: { select: { id: true, firstName: true, lastName: true } },
      requestee: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
  });
}

export async function listMeetings(eventId: string, tenantId: string, status?: string) {
  const where: any = { eventId, tenantId };
  if (status) where.status = status;

  return prisma.bilateralMeeting.findMany({
    where,
    include: {
      requester: { select: { id: true, firstName: true, lastName: true } },
      requestee: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getParticipantMeetings(participantId: string, tenantId: string) {
  return prisma.bilateralMeeting.findMany({
    where: {
      tenantId,
      OR: [{ requesterId: participantId }, { requesteeId: participantId }],
    },
    include: {
      requester: { select: { id: true, firstName: true, lastName: true } },
      requestee: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function getDailyBriefing(eventId: string, tenantId: string, date: string) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const [confirmed, pending, slots] = await Promise.all([
    prisma.bilateralMeeting.findMany({
      where: {
        eventId,
        tenantId,
        status: "CONFIRMED",
        scheduledAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true } },
        requestee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.bilateralMeeting.count({
      where: { eventId, tenantId, status: "REQUESTED" },
    }),
    prisma.meetingSlot.findMany({
      where: {
        eventId,
        tenantId,
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
        isBooked: false,
      },
    }),
  ]);

  return {
    date,
    confirmedMeetings: confirmed,
    pendingRequests: pending,
    availableSlots: slots.length,
    totalScheduled: confirmed.length,
  };
}

// ─── Stats ────────────────────────────────────────────────

export async function getBilateralStats(eventId: string, tenantId: string) {
  const [meetings, slotCount, availableSlots] = await Promise.all([
    prisma.bilateralMeeting.findMany({
      where: { eventId, tenantId },
      select: { status: true },
    }),
    prisma.meetingSlot.count({ where: { eventId, tenantId } }),
    prisma.meetingSlot.count({ where: { eventId, tenantId, isBooked: false } }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const m of meetings) {
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
  }

  return {
    total: meetings.length,
    requested: byStatus["REQUESTED"] || 0,
    confirmed: byStatus["CONFIRMED"] || 0,
    declined: byStatus["DECLINED"] || 0,
    cancelled: byStatus["CANCELLED"] || 0,
    completed: byStatus["COMPLETED"] || 0,
    totalSlots: slotCount,
    availableSlots,
  };
}
