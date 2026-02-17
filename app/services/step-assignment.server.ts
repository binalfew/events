import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { createNotification } from "~/services/notifications.server";
import type { AssignmentStrategy } from "~/generated/prisma/client.js";

// ─── Types ────────────────────────────────────────────────

interface AssignStepInput {
  stepId: string;
  userId: string;
  strategy?: AssignmentStrategy;
  assignedBy: string;
  tenantId?: string;
}

interface ReassignStepInput {
  assignmentId: string;
  newUserId: string;
  reassignedBy: string;
  tenantId?: string;
}

// ─── Core Functions ───────────────────────────────────────

/**
 * Assign a user to a workflow step.
 */
export async function assignStep(input: AssignStepInput) {
  const assignment = await prisma.stepAssignment.upsert({
    where: {
      stepId_userId: { stepId: input.stepId, userId: input.userId },
    },
    update: {
      isActive: true,
      strategy: input.strategy ?? "MANUAL",
      assignedBy: input.assignedBy,
    },
    create: {
      stepId: input.stepId,
      userId: input.userId,
      strategy: input.strategy ?? "MANUAL",
      assignedBy: input.assignedBy,
      isActive: true,
    },
    include: { step: true, user: true },
  });

  logger.info(
    { assignmentId: assignment.id, stepId: input.stepId, userId: input.userId },
    "Step assignment created",
  );

  // Notify assigned user
  if (input.tenantId) {
    try {
      await createNotification({
        userId: input.userId,
        tenantId: input.tenantId,
        type: "step_assignment",
        title: "New step assignment",
        message: `You have been assigned to step "${assignment.step.name}"`,
        data: {
          stepId: input.stepId,
          assignmentId: assignment.id,
        },
      });
    } catch {
      // Notification failure should not break assignment
    }
  }

  return assignment;
}

/**
 * Reassign a step from one user to another.
 * Deactivates the old assignment, creates a new one.
 */
export async function reassignStep(input: ReassignStepInput) {
  const oldAssignment = await prisma.stepAssignment.findUniqueOrThrow({
    where: { id: input.assignmentId },
  });

  // Deactivate old assignment
  await prisma.stepAssignment.update({
    where: { id: input.assignmentId },
    data: { isActive: false },
  });

  // Create new assignment
  const newAssignment = await assignStep({
    stepId: oldAssignment.stepId,
    userId: input.newUserId,
    strategy: oldAssignment.strategy,
    assignedBy: input.reassignedBy,
    tenantId: input.tenantId,
  });

  logger.info(
    {
      oldAssignmentId: input.assignmentId,
      newAssignmentId: newAssignment.id,
      oldUserId: oldAssignment.userId,
      newUserId: input.newUserId,
    },
    "Step reassigned",
  );

  return newAssignment;
}

/**
 * Deactivate an assignment (soft removal).
 */
export async function unassignStep(assignmentId: string) {
  await prisma.stepAssignment.update({
    where: { id: assignmentId },
    data: { isActive: false },
  });

  logger.info({ assignmentId }, "Step assignment deactivated");
}

/**
 * Get all active assignments for a step.
 */
export async function getStepAssignments(stepId: string) {
  return prisma.stepAssignment.findMany({
    where: { stepId, isActive: true },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Get all active assignments for a user.
 */
export async function getUserAssignments(userId: string) {
  return prisma.stepAssignment.findMany({
    where: { userId, isActive: true },
    include: {
      step: {
        include: {
          workflow: { select: { id: true, name: true, eventId: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get the next assignee for a step based on the assignment strategy.
 *
 * - MANUAL: returns null (admin must choose)
 * - ROUND_ROBIN: cycles through active assignees
 * - LEAST_LOADED: picks user with fewest in-progress participants at this step
 */
export async function getNextAssignee(stepId: string): Promise<string | null> {
  const assignments = await prisma.stepAssignment.findMany({
    where: { stepId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (assignments.length === 0) return null;

  const strategy = assignments[0].strategy;

  switch (strategy) {
    case "MANUAL":
      return null;

    case "ROUND_ROBIN":
      return getNextRoundRobin(stepId, assignments);

    case "LEAST_LOADED":
      return getNextLeastLoaded(stepId, assignments);

    default:
      return null;
  }
}

// ─── Strategy Implementations ─────────────────────────────

/**
 * Round-robin: track last-assigned index in step config.
 * Cycles through active assignees in creation order.
 */
async function getNextRoundRobin(
  stepId: string,
  assignments: Array<{ userId: string }>,
): Promise<string> {
  const step = await prisma.step.findUniqueOrThrow({
    where: { id: stepId },
    select: { config: true },
  });

  const config = (step.config ?? {}) as Record<string, unknown>;
  const lastIndex = typeof config.roundRobinIndex === "number" ? config.roundRobinIndex : -1;
  const nextIndex = (lastIndex + 1) % assignments.length;

  // Update the index for next time
  await prisma.step.update({
    where: { id: stepId },
    data: {
      config: { ...config, roundRobinIndex: nextIndex },
    },
  });

  return assignments[nextIndex].userId;
}

/**
 * Least-loaded: count in-progress participants per assignee at this step.
 * Pick the user with the fewest.
 */
async function getNextLeastLoaded(
  stepId: string,
  assignments: Array<{ userId: string }>,
): Promise<string> {
  const userIds = assignments.map((a) => a.userId);

  // Count participants currently at this step that were last approved by each user
  const loadCounts = await Promise.all(
    userIds.map(async (userId) => {
      const count = await prisma.approval.count({
        where: {
          stepId,
          userId,
          participant: {
            currentStepId: stepId,
            status: "IN_PROGRESS",
            deletedAt: null,
          },
        },
      });
      return { userId, count };
    }),
  );

  // Sort by count ascending, pick first
  loadCounts.sort((a, b) => a.count - b.count);
  return loadCounts[0].userId;
}
