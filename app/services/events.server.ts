import { prisma } from "~/lib/db.server";

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class EventError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "EventError";
  }
}

export async function getEvent(id: string, tenantId: string) {
  const event = await prisma.event.findFirst({
    where: { id, tenantId, deletedAt: null },
  });
  if (!event) {
    throw new EventError("Event not found", 404);
  }
  return event;
}

interface CreateEventInput {
  name: string;
  description?: string;
  status?: string;
  startDate: string;
  endDate: string;
}

export async function createEvent(input: CreateEventInput, ctx: ServiceContext) {
  // Check if an active event with this name already exists
  const existing = await prisma.event.findFirst({
    where: { tenantId: ctx.tenantId, name: input.name },
  });
  if (existing && !existing.deletedAt) {
    throw new EventError("An event with this name already exists", 409);
  }
  // Free up the unique slot by renaming the soft-deleted event
  if (existing && existing.deletedAt) {
    await prisma.event.update({
      where: { id: existing.id },
      data: { name: `${existing.name}__deleted_${existing.id}` },
    });
  }

  let event;
  try {
    event = await prisma.event.create({
      data: {
        name: input.name,
        description: input.description ?? "",
        status: (input.status as any) ?? "DRAFT",
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        tenantId: ctx.tenantId,
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as any).code === "P2002") {
      throw new EventError("An event with this name already exists", 409);
    }
    throw error;
  }

  await prisma.auditLog.create({
    data: {
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Event",
      entityId: event.id,
      description: `Created event "${event.name}"`,
      metadata: { name: event.name, status: event.status },
    },
  });

  return event;
}

interface UpdateEventInput {
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
}

export async function updateEvent(id: string, input: UpdateEventInput, ctx: ServiceContext) {
  const existing = await prisma.event.findFirst({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
  });
  if (!existing) {
    throw new EventError("Event not found", 404);
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description ?? "",
      status: input.status as any,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Event",
      entityId: event.id,
      description: `Updated event "${event.name}"`,
      metadata: { name: event.name, status: event.status },
    },
  });

  return event;
}

export async function deleteEvent(id: string, ctx: ServiceContext) {
  const existing = await prisma.event.findFirst({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    include: { _count: { select: { participants: true } } },
  });
  if (!existing) {
    throw new EventError("Event not found", 404);
  }

  if (existing._count.participants > 0) {
    throw new EventError(
      `Cannot delete event with ${existing._count.participants} participant(s). Remove participants first.`,
      409,
    );
  }

  await prisma.event.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: ctx.userId,
      action: "DELETE",
      entityType: "Event",
      entityId: id,
      description: `Deleted event "${existing.name}"`,
      metadata: { name: existing.name },
    },
  });
}
