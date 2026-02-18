import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { RegisterCompanionInput, CreateActivityInput } from "~/lib/schemas/companion";

// ─── Types ────────────────────────────────────────────────

export class CompanionError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "CompanionError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Registration Code ────────────────────────────────────

function generateRegistrationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CMP-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Companion Functions ──────────────────────────────────

export async function registerCompanion(input: RegisterCompanionInput, ctx: ServiceContext) {
  const registrationCode = generateRegistrationCode();

  const companion = await prisma.companion.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      primaryParticipantId: input.primaryParticipantId,
      firstName: input.firstName,
      lastName: input.lastName,
      type: input.type,
      email: input.email ?? null,
      phone: input.phone ?? null,
      passportNumber: input.passportNumber ?? null,
      nationality: input.nationality ?? null,
      registrationCode,
    },
    include: {
      primaryParticipant: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  logger.info({ companionId: companion.id, registrationCode }, "Companion registered");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Companion",
      entityId: companion.id,
      description: `Registered companion ${input.firstName} ${input.lastName} (${input.type})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { type: input.type, registrationCode },
    },
  });

  return companion;
}

export async function listCompanions(eventId: string, tenantId: string, type?: string) {
  const where: any = { eventId, tenantId };
  if (type) where.type = type;

  return prisma.companion.findMany({
    where,
    include: {
      primaryParticipant: { select: { id: true, firstName: true, lastName: true } },
      activities: { select: { id: true, name: true } },
    },
    orderBy: { lastName: "asc" },
  });
}

export async function updateCompanion(
  companionId: string,
  updates: Partial<RegisterCompanionInput>,
  ctx: ServiceContext,
) {
  const companion = await prisma.companion.findFirst({
    where: { id: companionId, tenantId: ctx.tenantId },
  });
  if (!companion) {
    throw new CompanionError("Companion not found", 404);
  }

  const updated = await prisma.companion.update({
    where: { id: companionId },
    data: {
      firstName: updates.firstName ?? companion.firstName,
      lastName: updates.lastName ?? companion.lastName,
      type: updates.type ?? companion.type,
      email: updates.email ?? companion.email,
      phone: updates.phone ?? companion.phone,
      passportNumber: updates.passportNumber ?? companion.passportNumber,
      nationality: updates.nationality ?? companion.nationality,
    },
  });

  logger.info({ companionId }, "Companion updated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Companion",
      entityId: companionId,
      description: `Updated companion ${updated.firstName} ${updated.lastName}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

export async function removeCompanion(companionId: string, ctx: ServiceContext) {
  const companion = await prisma.companion.findFirst({
    where: { id: companionId, tenantId: ctx.tenantId },
  });
  if (!companion) {
    throw new CompanionError("Companion not found", 404);
  }

  await prisma.companion.delete({ where: { id: companionId } });

  logger.info({ companionId }, "Companion removed");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "Companion",
      entityId: companionId,
      description: `Removed companion ${companion.firstName} ${companion.lastName}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return { success: true };
}

// ─── Activity Functions ───────────────────────────────────

export async function createActivity(input: CreateActivityInput, ctx: ServiceContext) {
  const activity = await prisma.companionActivity.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      description: input.description ?? null,
      date: new Date(input.date),
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
      location: input.location,
      capacity: input.capacity,
      transportIncluded: input.transportIncluded ?? true,
      cost: input.cost ?? 0,
    },
  });

  logger.info({ activityId: activity.id }, "Companion activity created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "CompanionActivity",
      entityId: activity.id,
      description: `Created companion activity "${input.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { location: input.location, capacity: input.capacity },
    },
  });

  return activity;
}

export async function listActivities(eventId: string, tenantId: string) {
  return prisma.companionActivity.findMany({
    where: { eventId, tenantId, companionId: null },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function signUpForActivity(
  companionId: string,
  activityId: string,
  ctx: ServiceContext,
) {
  const [companion, activity] = await Promise.all([
    prisma.companion.findFirst({ where: { id: companionId, tenantId: ctx.tenantId } }),
    prisma.companionActivity.findFirst({ where: { id: activityId, tenantId: ctx.tenantId } }),
  ]);

  if (!companion) {
    throw new CompanionError("Companion not found", 404);
  }
  if (!activity) {
    throw new CompanionError("Activity not found", 404);
  }
  if (activity.currentSignups >= activity.capacity) {
    throw new CompanionError("Activity is at full capacity", 409);
  }

  // Check if already signed up
  const existing = await prisma.companionActivity.findFirst({
    where: {
      tenantId: ctx.tenantId,
      eventId: activity.eventId,
      companionId,
      name: activity.name,
      date: activity.date,
    },
  });
  if (existing) {
    throw new CompanionError("Companion is already signed up for this activity", 409);
  }

  // Create sign-up record
  const signUp = await prisma.companionActivity.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: activity.eventId,
      companionId,
      name: activity.name,
      description: activity.description,
      date: activity.date,
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: activity.location,
      capacity: activity.capacity,
      transportIncluded: activity.transportIncluded,
      cost: activity.cost,
    },
  });

  // Increment sign-up counter
  await prisma.companionActivity.update({
    where: { id: activityId },
    data: { currentSignups: { increment: 1 } },
  });

  logger.info({ companionId, activityId }, "Companion signed up for activity");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "CompanionActivity",
      entityId: signUp.id,
      description: `Signed up companion ${companion.firstName} ${companion.lastName} for "${activity.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return signUp;
}

export async function cancelActivitySignUp(
  companionId: string,
  activityId: string,
  ctx: ServiceContext,
) {
  const activity = await prisma.companionActivity.findFirst({
    where: { id: activityId, tenantId: ctx.tenantId, companionId: null },
  });
  if (!activity) {
    throw new CompanionError("Activity not found", 404);
  }

  const signUp = await prisma.companionActivity.findFirst({
    where: {
      tenantId: ctx.tenantId,
      companionId,
      name: activity.name,
      date: activity.date,
    },
  });
  if (!signUp) {
    throw new CompanionError("Sign-up not found", 404);
  }

  await prisma.companionActivity.delete({ where: { id: signUp.id } });

  await prisma.companionActivity.update({
    where: { id: activityId },
    data: { currentSignups: { decrement: 1 } },
  });

  logger.info({ companionId, activityId }, "Companion activity sign-up cancelled");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "CompanionActivity",
      entityId: signUp.id,
      description: `Cancelled sign-up for "${activity.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return { success: true };
}

// ─── Badge & Stats ────────────────────────────────────────

export async function getCompanionBadgeData(companionId: string, tenantId: string) {
  const companion = await prisma.companion.findFirst({
    where: { id: companionId, tenantId },
    include: {
      primaryParticipant: { select: { id: true, firstName: true, lastName: true } },
      activities: {
        select: { name: true, date: true, startTime: true, location: true },
        orderBy: { date: "asc" },
      },
    },
  });
  if (!companion) {
    throw new CompanionError("Companion not found", 404);
  }

  return {
    id: companion.id,
    registrationCode: companion.registrationCode,
    firstName: companion.firstName,
    lastName: companion.lastName,
    type: companion.type,
    photoUrl: companion.photoUrl,
    primaryParticipant: companion.primaryParticipant,
    activities: companion.activities,
  };
}

export async function getCompanionStats(eventId: string, tenantId: string) {
  const companions = await prisma.companion.findMany({
    where: { eventId, tenantId },
    select: { type: true },
  });

  const activities = await prisma.companionActivity.findMany({
    where: { eventId, tenantId, companionId: null },
    select: { capacity: true, currentSignups: true },
  });

  const byType: Record<string, number> = {};
  for (const c of companions) {
    byType[c.type] = (byType[c.type] || 0) + 1;
  }

  const totalCapacity = activities.reduce((sum, a) => sum + a.capacity, 0);
  const totalSignups = activities.reduce((sum, a) => sum + a.currentSignups, 0);

  return {
    totalCompanions: companions.length,
    byType,
    totalActivities: activities.length,
    totalCapacity,
    totalSignups,
    fillRate: totalCapacity > 0 ? Math.round((totalSignups / totalCapacity) * 100) : 0,
  };
}
