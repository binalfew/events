import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type {
  CreateMealPlanInput,
  CreateMealSessionInput,
  IssueMealVoucherInput,
} from "~/lib/schemas/catering";

// ─── Types ────────────────────────────────────────────────

export class CateringError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "CateringError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Meal Plan Functions ──────────────────────────────────

export async function createMealPlan(input: CreateMealPlanInput, ctx: ServiceContext) {
  const mealPlan = await prisma.mealPlan.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      date: new Date(input.date),
      notes: input.notes ?? null,
    },
  });

  logger.info({ mealPlanId: mealPlan.id, eventId: input.eventId }, "Meal plan created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "MealPlan",
      entityId: mealPlan.id,
      description: `Created meal plan "${input.name}" for ${input.date}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { eventId: input.eventId, name: input.name, date: input.date },
    },
  });

  return mealPlan;
}

export async function listMealPlans(eventId: string, tenantId: string) {
  return prisma.mealPlan.findMany({
    where: { eventId, tenantId },
    include: {
      sessions: {
        include: { _count: { select: { vouchers: true } } },
        orderBy: { startTime: "asc" },
      },
    },
    orderBy: [{ date: "asc" }, { name: "asc" }],
  });
}

// ─── Meal Session Functions ───────────────────────────────

export async function createMealSession(input: CreateMealSessionInput, ctx: ServiceContext) {
  const mealPlan = await prisma.mealPlan.findFirst({
    where: { id: input.mealPlanId, tenantId: ctx.tenantId },
  });
  if (!mealPlan) {
    throw new CateringError("Meal plan not found", 404);
  }

  const session = await prisma.mealSession.create({
    data: {
      mealPlanId: input.mealPlanId,
      mealType: input.mealType,
      venue: input.venue,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
      capacity: input.capacity ?? null,
      menuNotes: input.menuNotes ?? null,
    },
  });

  logger.info({ sessionId: session.id, mealPlanId: input.mealPlanId }, "Meal session created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "MealSession",
      entityId: session.id,
      description: `Created ${input.mealType} session at "${input.venue}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { mealPlanId: input.mealPlanId, mealType: input.mealType },
    },
  });

  return session;
}

// ─── Dietary Functions ────────────────────────────────────

export async function getDietaryAggregation(
  eventId: string,
  tenantId: string,
  mealSessionId?: string,
) {
  const where: Record<string, unknown> = { eventId, tenantId };
  if (mealSessionId) where.mealSessionId = mealSessionId;

  const vouchers = await prisma.mealVoucher.groupBy({
    by: ["dietaryCategory"],
    where,
    _count: { id: true },
  });

  const result: Record<string, number> = {};
  for (const v of vouchers) {
    result[v.dietaryCategory] = v._count.id;
  }

  return result;
}

// ─── Voucher Functions ────────────────────────────────────

export async function issueMealVoucher(input: IssueMealVoucherInput, ctx: ServiceContext) {
  // Check the session exists
  const session = await prisma.mealSession.findFirst({
    where: { id: input.mealSessionId },
    include: { mealPlan: true },
  });
  if (!session) {
    throw new CateringError("Meal session not found", 404);
  }
  if (session.mealPlan.tenantId !== ctx.tenantId) {
    throw new CateringError("Meal session not found", 404);
  }

  // Generate a unique QR code
  const qrCode = `MV-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  const voucher = await prisma.mealVoucher.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: session.mealPlan.eventId,
      mealSessionId: input.mealSessionId,
      participantId: input.participantId,
      dietaryCategory: input.dietaryCategory,
      qrCode,
    },
    include: { participant: true },
  });

  logger.info({ voucherId: voucher.id, participantId: input.participantId }, "Meal voucher issued");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "MealVoucher",
      entityId: voucher.id,
      description: `Issued meal voucher for ${voucher.participant.firstName} ${voucher.participant.lastName}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        mealSessionId: input.mealSessionId,
        participantId: input.participantId,
        dietaryCategory: input.dietaryCategory,
      },
    },
  });

  return voucher;
}

export async function redeemMealVoucher(voucherId: string, ctx: ServiceContext) {
  const voucher = await prisma.mealVoucher.findFirst({
    where: { id: voucherId, tenantId: ctx.tenantId },
  });
  if (!voucher) {
    throw new CateringError("Meal voucher not found", 404);
  }
  if (voucher.isRedeemed) {
    throw new CateringError("Voucher has already been redeemed", 409);
  }

  const updated = await prisma.mealVoucher.update({
    where: { id: voucherId },
    data: {
      isRedeemed: true,
      redeemedAt: new Date(),
      redeemedBy: ctx.userId,
    },
  });

  logger.info({ voucherId }, "Meal voucher redeemed");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "MealVoucher",
      entityId: voucherId,
      description: "Meal voucher redeemed",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { mealSessionId: voucher.mealSessionId },
    },
  });

  return updated;
}

// ─── Dashboard & Export ───────────────────────────────────

export async function getMealDashboard(eventId: string, tenantId: string) {
  const [totalVouchers, redeemed, mealPlans, dietaryBreakdown] = await Promise.all([
    prisma.mealVoucher.count({ where: { eventId, tenantId } }),
    prisma.mealVoucher.count({ where: { eventId, tenantId, isRedeemed: true } }),
    prisma.mealPlan.count({ where: { eventId, tenantId } }),
    getDietaryAggregation(eventId, tenantId),
  ]);

  return {
    totalVouchers,
    redeemed,
    unredeemed: totalVouchers - redeemed,
    redemptionRate: totalVouchers > 0 ? Math.round((redeemed / totalVouchers) * 100) : 0,
    mealPlans,
    dietaryBreakdown,
  };
}

export async function exportCateringSheet(eventId: string, tenantId: string, date?: string) {
  const where: Record<string, unknown> = { eventId, tenantId };
  if (date) {
    const dateObj = new Date(date);
    where.date = dateObj;
  }

  const plans = await prisma.mealPlan.findMany({
    where,
    include: {
      sessions: {
        include: {
          vouchers: {
            select: { dietaryCategory: true, isRedeemed: true },
          },
        },
        orderBy: { startTime: "asc" },
      },
    },
    orderBy: { date: "asc" },
  });

  return plans.map((plan) => ({
    name: plan.name,
    date: plan.date.toISOString().split("T")[0],
    sessions: plan.sessions.map((session) => {
      const dietaryCounts: Record<string, number> = {};
      for (const v of session.vouchers) {
        dietaryCounts[v.dietaryCategory] = (dietaryCounts[v.dietaryCategory] || 0) + 1;
      }
      return {
        mealType: session.mealType,
        venue: session.venue,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        capacity: session.capacity,
        totalGuests: session.vouchers.length,
        redeemed: session.vouchers.filter((v) => v.isRedeemed).length,
        dietaryCounts,
      };
    }),
  }));
}
