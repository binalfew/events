import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { JoinQueueInput } from "~/lib/schemas/queue-ticket";

// ─── Types ────────────────────────────────────────────────

export class QueueError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "QueueError";
  }
}

interface ServiceContext {
  tenantId: string;
}

// ─── Service Functions ────────────────────────────────────

export async function joinQueue(input: JoinQueueInput, ctx: ServiceContext) {
  // Generate next ticket number for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.queueTicket.count({
    where: {
      eventId: input.eventId,
      joinedAt: { gte: today },
    },
  });

  const ticketNumber = `A${String(count + 1).padStart(3, "0")}`;

  // Estimate wait time
  const estimatedWait = await estimateWaitTime(input.eventId, input.priority);

  const ticket = await prisma.queueTicket.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      participantId: input.participantId,
      ticketNumber,
      priority: input.priority,
      estimatedWait,
      status: "WAITING",
    },
  });

  logger.info({ ticketId: ticket.id, ticketNumber }, "Queue ticket created");

  return ticket;
}

export async function callNextTicket(eventId: string, counterNumber: number, ctx: ServiceContext) {
  // Find highest-priority WAITING ticket (FIFO within same priority)
  const ticket = await prisma.queueTicket.findFirst({
    where: {
      eventId,
      tenantId: ctx.tenantId,
      status: "WAITING",
    },
    orderBy: [{ priority: "desc" }, { joinedAt: "asc" }],
    include: {
      participant: {
        select: { id: true, firstName: true, lastName: true, registrationCode: true },
      },
    },
  });

  if (!ticket) {
    return null;
  }

  const updated = await prisma.queueTicket.update({
    where: { id: ticket.id },
    data: {
      status: "CALLED",
      calledAt: new Date(),
      counterNumber,
    },
    include: {
      participant: {
        select: { id: true, firstName: true, lastName: true, registrationCode: true },
      },
    },
  });

  logger.info({ ticketId: ticket.id, counterNumber }, "Queue ticket called");

  return updated;
}

export async function startServing(ticketId: string, ctx: ServiceContext) {
  const ticket = await prisma.queueTicket.findFirst({
    where: { id: ticketId, tenantId: ctx.tenantId },
  });

  if (!ticket) {
    throw new QueueError("Ticket not found", 404);
  }

  if (ticket.status !== "CALLED") {
    throw new QueueError("Ticket must be in CALLED status to start serving", 400);
  }

  return prisma.queueTicket.update({
    where: { id: ticketId },
    data: {
      status: "SERVING",
      servedAt: new Date(),
    },
  });
}

export async function completeService(ticketId: string, ctx: ServiceContext) {
  const ticket = await prisma.queueTicket.findFirst({
    where: { id: ticketId, tenantId: ctx.tenantId },
  });

  if (!ticket) {
    throw new QueueError("Ticket not found", 404);
  }

  return prisma.queueTicket.update({
    where: { id: ticketId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
}

export async function cancelTicket(ticketId: string, ctx: ServiceContext) {
  const ticket = await prisma.queueTicket.findFirst({
    where: { id: ticketId, tenantId: ctx.tenantId },
  });

  if (!ticket) {
    throw new QueueError("Ticket not found", 404);
  }

  return prisma.queueTicket.update({
    where: { id: ticketId },
    data: {
      status: "CANCELLED",
      completedAt: new Date(),
    },
  });
}

export async function getQueueStatus(eventId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [nowServing, nextUp, waitingCount, completedToday] = await Promise.all([
    // Tickets currently being served or called (per counter)
    prisma.queueTicket.findMany({
      where: {
        eventId,
        status: { in: ["SERVING", "CALLED"] },
      },
      include: {
        participant: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { counterNumber: "asc" },
    }),
    // Next 5 waiting tickets
    prisma.queueTicket.findMany({
      where: {
        eventId,
        status: "WAITING",
      },
      orderBy: [{ priority: "desc" }, { joinedAt: "asc" }],
      take: 5,
    }),
    // Total waiting count
    prisma.queueTicket.count({
      where: {
        eventId,
        status: "WAITING",
      },
    }),
    // Completed today for average wait calculation
    prisma.queueTicket.findMany({
      where: {
        eventId,
        status: "COMPLETED",
        joinedAt: { gte: today },
        completedAt: { not: null },
      },
      select: { joinedAt: true, servedAt: true },
    }),
  ]);

  // Calculate average wait time from completed tickets
  let averageWaitMinutes = 0;
  if (completedToday.length > 0) {
    const totalWait = completedToday.reduce((sum, ticket) => {
      const waitEnd = ticket.servedAt ?? ticket.joinedAt;
      return sum + (waitEnd.getTime() - ticket.joinedAt.getTime());
    }, 0);
    averageWaitMinutes = Math.round(totalWait / completedToday.length / 60000);
  }

  return {
    nowServing,
    nextUp,
    waitingCount,
    averageWaitMinutes,
  };
}

export async function estimateWaitTime(eventId: string, priority: number = 0): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get average service time from completed tickets today
  const completedToday = await prisma.queueTicket.findMany({
    where: {
      eventId,
      status: "COMPLETED",
      joinedAt: { gte: today },
      servedAt: { not: null },
      completedAt: { not: null },
    },
    select: { servedAt: true, completedAt: true },
  });

  let avgServiceMinutes = 5; // default 5 minutes
  if (completedToday.length > 0) {
    const totalService = completedToday.reduce((sum, t) => {
      return sum + (t.completedAt!.getTime() - t.servedAt!.getTime());
    }, 0);
    avgServiceMinutes = Math.round(totalService / completedToday.length / 60000) || 5;
  }

  // Count tickets ahead with equal or higher priority
  const ticketsAhead = await prisma.queueTicket.count({
    where: {
      eventId,
      status: "WAITING",
      priority: { gte: priority },
    },
  });

  return ticketsAhead * avgServiceMinutes;
}
