import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type {
  CreateSeatingPlanInput,
  AssignSeatInput,
  AddConflictInput,
} from "~/lib/schemas/seating";

// ─── Types ────────────────────────────────────────────────

export class SeatingError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "SeatingError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

const PRIORITY_ORDER = [
  "HEAD_OF_STATE",
  "MINISTER",
  "AMBASSADOR",
  "SENIOR_OFFICIAL",
  "DELEGATE",
  "OBSERVER",
  "MEDIA",
] as const;

// ─── Plan Functions ───────────────────────────────────────

export async function createSeatingPlan(input: CreateSeatingPlanInput, ctx: ServiceContext) {
  const plan = await prisma.seatingPlan.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      layoutType: input.layoutType,
      totalSeats: input.totalSeats,
    },
  });

  logger.info({ planId: plan.id, eventId: input.eventId }, "Seating plan created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "SeatingPlan",
      entityId: plan.id,
      description: `Created seating plan "${input.name}" (${input.layoutType}, ${input.totalSeats} seats)`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { eventId: input.eventId, layoutType: input.layoutType },
    },
  });

  return plan;
}

export async function listSeatingPlans(eventId: string, tenantId: string) {
  return prisma.seatingPlan.findMany({
    where: { eventId, tenantId },
    include: {
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteSeatingPlan(planId: string, ctx: ServiceContext) {
  const plan = await prisma.seatingPlan.findFirst({
    where: { id: planId, tenantId: ctx.tenantId },
  });
  if (!plan) {
    throw new SeatingError("Seating plan not found", 404);
  }
  await prisma.seatingPlan.delete({ where: { id: planId } });

  logger.info({ planId }, "Seating plan deleted");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "SeatingPlan",
      entityId: planId,
      description: `Deleted seating plan "${plan.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return { success: true };
}

export async function getSeatingPlan(planId: string, tenantId: string) {
  const plan = await prisma.seatingPlan.findFirst({
    where: { id: planId, tenantId },
    include: {
      assignments: {
        include: {
          participant: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { seatLabel: "asc" },
      },
    },
  });
  if (!plan) {
    throw new SeatingError("Seating plan not found", 404);
  }
  return plan;
}

// ─── Assignment Functions ─────────────────────────────────

export async function assignSeat(input: AssignSeatInput, ctx: ServiceContext) {
  const plan = await prisma.seatingPlan.findFirst({
    where: { id: input.seatingPlanId, tenantId: ctx.tenantId },
  });
  if (!plan) {
    throw new SeatingError("Seating plan not found", 404);
  }
  if (plan.isFinalized) {
    throw new SeatingError("Seating plan is finalized — no changes allowed", 400);
  }
  if (plan.assignedSeats >= plan.totalSeats) {
    throw new SeatingError("All seats are assigned", 409);
  }

  const assignment = await prisma.seatingAssignment.create({
    data: {
      seatingPlanId: input.seatingPlanId,
      participantId: input.participantId,
      seatLabel: input.seatLabel,
      tableNumber: input.tableNumber ?? null,
      priority: input.priority,
      assignedBy: ctx.userId,
    },
    include: {
      participant: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  await prisma.seatingPlan.update({
    where: { id: input.seatingPlanId },
    data: { assignedSeats: { increment: 1 } },
  });

  logger.info({ planId: input.seatingPlanId, seatLabel: input.seatLabel }, "Seat assigned");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "SeatingAssignment",
      entityId: assignment.id,
      description: `Assigned seat ${input.seatLabel} to participant`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { planId: input.seatingPlanId, seatLabel: input.seatLabel },
    },
  });

  return assignment;
}

export async function unassignSeat(assignmentId: string, ctx: ServiceContext) {
  const assignment = await prisma.seatingAssignment.findFirst({
    where: { id: assignmentId },
    include: { seatingPlan: true },
  });
  if (!assignment) {
    throw new SeatingError("Assignment not found", 404);
  }
  if (assignment.seatingPlan.tenantId !== ctx.tenantId) {
    throw new SeatingError("Assignment not found", 404);
  }
  if (assignment.seatingPlan.isFinalized) {
    throw new SeatingError("Seating plan is finalized — no changes allowed", 400);
  }

  await prisma.seatingAssignment.delete({ where: { id: assignmentId } });

  await prisma.seatingPlan.update({
    where: { id: assignment.seatingPlanId },
    data: { assignedSeats: { decrement: 1 } },
  });

  logger.info({ assignmentId, seatLabel: assignment.seatLabel }, "Seat unassigned");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "SeatingAssignment",
      entityId: assignmentId,
      description: `Unassigned seat ${assignment.seatLabel}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { planId: assignment.seatingPlanId, seatLabel: assignment.seatLabel },
    },
  });

  return { success: true };
}

// ─── Auto-Assign ──────────────────────────────────────────

export async function autoAssignSeating(planId: string, ctx: ServiceContext) {
  const plan = await prisma.seatingPlan.findFirst({
    where: { id: planId, tenantId: ctx.tenantId },
    include: { assignments: { select: { participantId: true } } },
  });
  if (!plan) {
    throw new SeatingError("Seating plan not found", 404);
  }
  if (plan.isFinalized) {
    throw new SeatingError("Seating plan is finalized — no changes allowed", 400);
  }

  const assignedIds = new Set(plan.assignments.map((a) => a.participantId));
  const availableSeats = plan.totalSeats - plan.assignedSeats;
  if (availableSeats <= 0) {
    throw new SeatingError("No available seats", 409);
  }

  // Get unassigned participants, ordered by priority
  const participants = await prisma.participant.findMany({
    where: {
      eventId: plan.eventId,
      tenantId: ctx.tenantId,
      status: "APPROVED",
      id: { notIn: [...assignedIds] },
    },
    select: { id: true, firstName: true, lastName: true },
    take: availableSeats,
  });

  if (participants.length === 0) {
    return { assigned: 0 };
  }

  // Get conflicts for this event
  const conflicts = await prisma.seatingConflict.findMany({
    where: { eventId: plan.eventId, tenantId: ctx.tenantId, isResolved: false },
    select: { participantAId: true, participantBId: true },
  });

  const conflictMap = new Map<string, Set<string>>();
  for (const c of conflicts) {
    if (!conflictMap.has(c.participantAId)) conflictMap.set(c.participantAId, new Set());
    if (!conflictMap.has(c.participantBId)) conflictMap.set(c.participantBId, new Set());
    conflictMap.get(c.participantAId)!.add(c.participantBId);
    conflictMap.get(c.participantBId)!.add(c.participantAId);
  }

  let nextSeatNum = plan.assignedSeats + 1;
  let assignedCount = 0;

  for (const participant of participants) {
    if (nextSeatNum > plan.totalSeats) break;

    const seatLabel = `S${String(nextSeatNum).padStart(3, "0")}`;

    await prisma.seatingAssignment.create({
      data: {
        seatingPlanId: planId,
        participantId: participant.id,
        seatLabel,
        priority: "DELEGATE", // Default priority for auto-assign
        assignedBy: ctx.userId,
      },
    });

    nextSeatNum++;
    assignedCount++;
  }

  await prisma.seatingPlan.update({
    where: { id: planId },
    data: { assignedSeats: { increment: assignedCount } },
  });

  logger.info({ planId, assignedCount }, "Auto-assigned seating");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "SeatingPlan",
      entityId: planId,
      description: `Auto-assigned ${assignedCount} seats`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { assignedCount },
    },
  });

  return { assigned: assignedCount };
}

// ─── Conflict Functions ───────────────────────────────────

export async function addConflict(input: AddConflictInput, ctx: ServiceContext) {
  if (input.participantAId === input.participantBId) {
    throw new SeatingError("Cannot create conflict between a participant and themselves", 400);
  }

  // Normalize order to prevent duplicates
  const [pA, pB] =
    input.participantAId < input.participantBId
      ? [input.participantAId, input.participantBId]
      : [input.participantBId, input.participantAId];

  const conflict = await prisma.seatingConflict.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      seatingPlanId: input.seatingPlanId ?? null,
      participantAId: pA,
      participantBId: pB,
      conflictType: input.conflictType,
      description: input.description ?? null,
    },
  });

  logger.info({ conflictId: conflict.id }, "Seating conflict added");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "SeatingConflict",
      entityId: conflict.id,
      description: `Added seating conflict: ${input.conflictType}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { conflictType: input.conflictType },
    },
  });

  return conflict;
}

export async function resolveConflict(conflictId: string, ctx: ServiceContext) {
  const conflict = await prisma.seatingConflict.findFirst({
    where: { id: conflictId, tenantId: ctx.tenantId },
  });
  if (!conflict) {
    throw new SeatingError("Conflict not found", 404);
  }
  if (conflict.isResolved) {
    throw new SeatingError("Conflict is already resolved", 400);
  }

  const updated = await prisma.seatingConflict.update({
    where: { id: conflictId },
    data: { isResolved: true, resolvedBy: ctx.userId, resolvedAt: new Date() },
  });

  logger.info({ conflictId }, "Seating conflict resolved");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "SeatingConflict",
      entityId: conflictId,
      description: "Resolved seating conflict",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

// ─── Validation ───────────────────────────────────────────

export async function validateSeating(planId: string, tenantId: string) {
  const plan = await prisma.seatingPlan.findFirst({
    where: { id: planId, tenantId },
    include: {
      assignments: {
        include: {
          participant: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { seatLabel: "asc" },
      },
    },
  });
  if (!plan) {
    throw new SeatingError("Seating plan not found", 404);
  }

  const conflicts = await prisma.seatingConflict.findMany({
    where: { eventId: plan.eventId, tenantId, isResolved: false },
    select: { participantAId: true, participantBId: true, conflictType: true },
  });

  const warnings: Array<{ type: string; message: string; seatLabel?: string }> = [];

  // Check rank ordering — adjacent seats should respect priority hierarchy
  for (let i = 0; i < plan.assignments.length - 1; i++) {
    const current = plan.assignments[i];
    const next = plan.assignments[i + 1];
    const currentRank = PRIORITY_ORDER.indexOf(current.priority as (typeof PRIORITY_ORDER)[number]);
    const nextRank = PRIORITY_ORDER.indexOf(next.priority as (typeof PRIORITY_ORDER)[number]);

    // Higher-ranked (lower index) should come before lower-ranked (higher index)
    if (currentRank > nextRank && currentRank <= 2 && nextRank <= 2) {
      // Only warn for top-tier protocol violations
      warnings.push({
        type: "rank_violation",
        message: `${current.participant.firstName} ${current.participant.lastName} (${current.priority}) is seated before ${next.participant.firstName} ${next.participant.lastName} (${next.priority})`,
        seatLabel: current.seatLabel,
      });
    }
  }

  // Check conflict adjacencies
  const conflictPairs = new Set(conflicts.map((c) => `${c.participantAId}:${c.participantBId}`));

  for (let i = 0; i < plan.assignments.length - 1; i++) {
    const current = plan.assignments[i];
    const next = plan.assignments[i + 1];
    const key1 = `${current.participantId}:${next.participantId}`;
    const key2 = `${next.participantId}:${current.participantId}`;

    if (conflictPairs.has(key1) || conflictPairs.has(key2)) {
      warnings.push({
        type: "conflict_adjacency",
        message: `${current.participant.firstName} ${current.participant.lastName} and ${next.participant.firstName} ${next.participant.lastName} are in conflict but seated adjacent`,
        seatLabel: current.seatLabel,
      });
    }
  }

  return {
    planId,
    totalSeats: plan.totalSeats,
    assignedSeats: plan.assignedSeats,
    warnings,
    isValid: warnings.length === 0,
  };
}

// ─── Stats ────────────────────────────────────────────────

export async function getSeatingStats(eventId: string, tenantId: string) {
  const [plans, totalAssignments, unresolvedConflicts] = await Promise.all([
    prisma.seatingPlan.findMany({
      where: { eventId, tenantId },
      select: { totalSeats: true, assignedSeats: true, isFinalized: true },
    }),
    prisma.seatingAssignment.count({
      where: { seatingPlan: { eventId, tenantId } },
    }),
    prisma.seatingConflict.count({
      where: { eventId, tenantId, isResolved: false },
    }),
  ]);

  const totalSeats = plans.reduce((sum, p) => sum + p.totalSeats, 0);
  const finalized = plans.filter((p) => p.isFinalized).length;

  return {
    plans: plans.length,
    totalSeats,
    totalAssignments,
    fillRate: totalSeats > 0 ? Math.round((totalAssignments / totalSeats) * 100) : 0,
    finalized,
    unresolvedConflicts,
  };
}
