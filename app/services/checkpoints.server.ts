import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { CreateCheckpointInput, UpdateCheckpointInput } from "~/lib/schemas/checkpoint";

// ─── Types ────────────────────────────────────────────────

export class CheckpointError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "CheckpointError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ListCheckpointsFilters {
  eventId: string;
  isActive?: boolean;
}

// ─── Service Functions ────────────────────────────────────

export async function createCheckpoint(input: CreateCheckpointInput, ctx: ServiceContext) {
  const checkpoint = await prisma.checkpoint.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      location: input.location,
      type: input.type,
      direction: input.direction,
      capacity: input.capacity,
    },
  });

  logger.info({ checkpointId: checkpoint.id }, "Checkpoint created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Checkpoint",
      entityId: checkpoint.id,
      description: `Created checkpoint "${input.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { name: input.name, type: input.type, direction: input.direction },
    },
  });

  return checkpoint;
}

export async function listCheckpoints(tenantId: string, filters: ListCheckpointsFilters) {
  const where = {
    tenantId,
    eventId: filters.eventId,
    ...(filters.isActive !== undefined && { isActive: filters.isActive }),
  };

  return prisma.checkpoint.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });
}

export async function getCheckpoint(id: string, tenantId: string) {
  const checkpoint = await prisma.checkpoint.findFirst({
    where: { id, tenantId },
  });
  if (!checkpoint) {
    throw new CheckpointError("Checkpoint not found", 404);
  }
  return checkpoint;
}

export async function updateCheckpoint(
  id: string,
  input: UpdateCheckpointInput,
  ctx: ServiceContext,
) {
  const existing = await prisma.checkpoint.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new CheckpointError("Checkpoint not found", 404);
  }

  const checkpoint = await prisma.checkpoint.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.direction !== undefined && { direction: input.direction }),
      ...(input.capacity !== undefined && { capacity: input.capacity }),
    },
  });

  logger.info({ checkpointId: id }, "Checkpoint updated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CONFIGURE",
      entityType: "Checkpoint",
      entityId: id,
      description: `Updated checkpoint "${checkpoint.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: JSON.parse(JSON.stringify(input)),
    },
  });

  return checkpoint;
}

export async function deleteCheckpoint(id: string, ctx: ServiceContext) {
  const existing = await prisma.checkpoint.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new CheckpointError("Checkpoint not found", 404);
  }

  await prisma.checkpoint.delete({ where: { id } });

  logger.info({ checkpointId: id }, "Checkpoint deleted");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "Checkpoint",
      entityId: id,
      description: `Deleted checkpoint "${existing.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { name: existing.name },
    },
  });
}

export async function toggleCheckpoint(id: string, ctx: ServiceContext) {
  const existing = await prisma.checkpoint.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new CheckpointError("Checkpoint not found", 404);
  }

  const checkpoint = await prisma.checkpoint.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  logger.info({ checkpointId: id, isActive: checkpoint.isActive }, "Checkpoint toggled");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CONFIGURE",
      entityType: "Checkpoint",
      entityId: id,
      description: `${checkpoint.isActive ? "Activated" : "Deactivated"} checkpoint "${checkpoint.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { isActive: checkpoint.isActive },
    },
  });

  return checkpoint;
}
