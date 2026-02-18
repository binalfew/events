import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { RegisterStaffInput, CreateShiftInput } from "~/lib/schemas/staff";

// ─── Types ────────────────────────────────────────────────

export class StaffError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "StaffError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Staff Functions ─────────────────────────────────────

export async function registerStaff(input: RegisterStaffInput, ctx: ServiceContext) {
  const staff = await prisma.staffMember.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      userId: input.userId,
      role: input.role,
      zone: input.zone ?? null,
      phone: input.phone ?? null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  logger.info({ staffId: staff.id, role: input.role }, "Staff member registered");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "StaffMember",
      entityId: staff.id,
      description: `Registered staff member (${input.role})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { role: input.role, zone: input.zone },
    },
  });

  return staff;
}

export async function listStaff(
  eventId: string,
  tenantId: string,
  filters?: { role?: string; activeOnly?: boolean },
) {
  const where: any = { eventId, tenantId };
  if (filters?.role) where.role = filters.role;
  if (filters?.activeOnly) where.isActive = true;

  return prisma.staffMember.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignments: {
        include: {
          shift: { select: { id: true, name: true, date: true, startTime: true, endTime: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });
}

export async function updateStaff(
  staffId: string,
  updates: { role?: string; zone?: string; phone?: string },
  ctx: ServiceContext,
) {
  const staff = await prisma.staffMember.findFirst({
    where: { id: staffId, tenantId: ctx.tenantId },
  });
  if (!staff) {
    throw new StaffError("Staff member not found", 404);
  }

  const updated = await prisma.staffMember.update({
    where: { id: staffId },
    data: {
      ...(updates.role && { role: updates.role as any }),
      ...(updates.zone !== undefined && { zone: updates.zone || null }),
      ...(updates.phone !== undefined && { phone: updates.phone || null }),
    },
  });

  logger.info({ staffId }, "Staff member updated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "StaffMember",
      entityId: staffId,
      description: "Updated staff member details",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

export async function deactivateStaff(staffId: string, ctx: ServiceContext) {
  const staff = await prisma.staffMember.findFirst({
    where: { id: staffId, tenantId: ctx.tenantId },
  });
  if (!staff) {
    throw new StaffError("Staff member not found", 404);
  }

  const updated = await prisma.staffMember.update({
    where: { id: staffId },
    data: { isActive: false },
  });

  logger.info({ staffId }, "Staff member deactivated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "StaffMember",
      entityId: staffId,
      description: "Deactivated staff member",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

// ─── Shift Functions ─────────────────────────────────────

export async function createShift(input: CreateShiftInput, ctx: ServiceContext) {
  const shift = await prisma.staffShift.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      date: new Date(input.date),
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
      zone: input.zone ?? null,
      requiredRole: (input.requiredRole as any) ?? null,
      capacity: input.capacity,
    },
  });

  logger.info({ shiftId: shift.id }, "Staff shift created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "StaffShift",
      entityId: shift.id,
      description: `Created shift "${input.name}" (capacity: ${input.capacity})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { zone: input.zone, requiredRole: input.requiredRole },
    },
  });

  return shift;
}

export async function listShifts(
  eventId: string,
  tenantId: string,
  filters?: { date?: string; role?: string },
) {
  const where: any = { eventId, tenantId };
  if (filters?.date) where.date = new Date(filters.date);
  if (filters?.role) where.requiredRole = filters.role;

  return prisma.staffShift.findMany({
    where,
    include: {
      assignments: {
        include: {
          staffMember: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function assignToShift(staffId: string, shiftId: string, ctx: ServiceContext) {
  const [staff, shift] = await Promise.all([
    prisma.staffMember.findFirst({ where: { id: staffId, tenantId: ctx.tenantId } }),
    prisma.staffShift.findFirst({
      where: { id: shiftId, tenantId: ctx.tenantId },
      include: { _count: { select: { assignments: true } } },
    }),
  ]);

  if (!staff) throw new StaffError("Staff member not found", 404);
  if (!shift) throw new StaffError("Shift not found", 404);
  if (!staff.isActive) throw new StaffError("Staff member is inactive", 400);
  if (shift._count.assignments >= shift.capacity) {
    throw new StaffError("Shift is at full capacity", 409);
  }
  if (shift.requiredRole && shift.requiredRole !== staff.role) {
    throw new StaffError(`Shift requires role ${shift.requiredRole}, staff has ${staff.role}`, 400);
  }

  const assignment = await prisma.shiftAssignment.create({
    data: {
      shiftId,
      staffMemberId: staffId,
      assignedBy: ctx.userId,
      status: "SCHEDULED",
    },
    include: {
      staffMember: { include: { user: { select: { id: true, name: true } } } },
      shift: { select: { id: true, name: true } },
    },
  });

  logger.info({ staffId, shiftId }, "Staff assigned to shift");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "ShiftAssignment",
      entityId: assignment.id,
      description: `Assigned staff to shift "${shift.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return assignment;
}

export async function unassignFromShift(staffId: string, shiftId: string, ctx: ServiceContext) {
  const assignment = await prisma.shiftAssignment.findFirst({
    where: { staffMemberId: staffId, shiftId },
  });
  if (!assignment) {
    throw new StaffError("Assignment not found", 404);
  }

  await prisma.shiftAssignment.delete({ where: { id: assignment.id } });

  logger.info({ staffId, shiftId }, "Staff unassigned from shift");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "ShiftAssignment",
      entityId: assignment.id,
      description: "Unassigned staff from shift",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return { success: true };
}

export async function checkInStaff(staffId: string, shiftId: string, ctx: ServiceContext) {
  const assignment = await prisma.shiftAssignment.findFirst({
    where: { staffMemberId: staffId, shiftId },
  });
  if (!assignment) {
    throw new StaffError("Assignment not found", 404);
  }
  if (assignment.status !== "SCHEDULED") {
    throw new StaffError(`Cannot check in from status ${assignment.status}`, 400);
  }

  const updated = await prisma.shiftAssignment.update({
    where: { id: assignment.id },
    data: {
      status: "CHECKED_IN",
      checkedInAt: new Date(),
    },
  });

  logger.info({ staffId, shiftId }, "Staff checked in");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "ShiftAssignment",
      entityId: assignment.id,
      description: "Staff checked in to shift",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

export async function checkOutStaff(staffId: string, shiftId: string, ctx: ServiceContext) {
  const assignment = await prisma.shiftAssignment.findFirst({
    where: { staffMemberId: staffId, shiftId },
  });
  if (!assignment) {
    throw new StaffError("Assignment not found", 404);
  }
  if (assignment.status !== "CHECKED_IN") {
    throw new StaffError(`Cannot check out from status ${assignment.status}`, 400);
  }

  const updated = await prisma.shiftAssignment.update({
    where: { id: assignment.id },
    data: {
      status: "CHECKED_OUT",
      checkedOutAt: new Date(),
    },
  });

  logger.info({ staffId, shiftId }, "Staff checked out");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "ShiftAssignment",
      entityId: assignment.id,
      description: "Staff checked out from shift",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

// ─── Auto-assign & Dashboard ─────────────────────────────

export async function autoAssignShifts(eventId: string, tenantId: string, ctx: ServiceContext) {
  const [shifts, staff] = await Promise.all([
    prisma.staffShift.findMany({
      where: { eventId, tenantId },
      include: { _count: { select: { assignments: true } } },
    }),
    prisma.staffMember.findMany({
      where: { eventId, tenantId, isActive: true },
      include: { assignments: { select: { shiftId: true } } },
    }),
  ]);

  let assignedCount = 0;

  for (const shift of shifts) {
    const available = shift.capacity - shift._count.assignments;
    if (available <= 0) continue;

    const eligibleStaff = staff.filter((s) => {
      // Not already assigned to this shift
      if (s.assignments.some((a) => a.shiftId === shift.id)) return false;
      // Match required role if specified
      if (shift.requiredRole && shift.requiredRole !== s.role) return false;
      return true;
    });

    for (let i = 0; i < Math.min(available, eligibleStaff.length); i++) {
      await prisma.shiftAssignment.create({
        data: {
          shiftId: shift.id,
          staffMemberId: eligibleStaff[i].id,
          assignedBy: ctx.userId,
          status: "SCHEDULED",
        },
      });
      assignedCount++;
    }
  }

  logger.info({ eventId, assignedCount }, "Auto-assign shifts completed");

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "ShiftAssignment",
      entityId: eventId,
      description: `Auto-assigned ${assignedCount} staff to shifts`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { assignedCount },
    },
  });

  return { assigned: assignedCount };
}

export async function getStaffDashboard(eventId: string, tenantId: string) {
  const [staff, assignments] = await Promise.all([
    prisma.staffMember.findMany({
      where: { eventId, tenantId },
      select: { role: true, isActive: true },
    }),
    prisma.shiftAssignment.findMany({
      where: { shift: { eventId, tenantId } },
      select: { status: true },
    }),
  ]);

  const byRole: Record<string, number> = {};
  let activeCount = 0;
  for (const s of staff) {
    byRole[s.role] = (byRole[s.role] || 0) + 1;
    if (s.isActive) activeCount++;
  }

  const byStatus: Record<string, number> = {};
  for (const a of assignments) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  }

  return {
    totalStaff: staff.length,
    activeStaff: activeCount,
    byRole,
    scheduled: byStatus["SCHEDULED"] || 0,
    checkedIn: byStatus["CHECKED_IN"] || 0,
    checkedOut: byStatus["CHECKED_OUT"] || 0,
    noShows: byStatus["NO_SHOW"] || 0,
    totalAssignments: assignments.length,
  };
}

export async function getStaffSchedule(staffId: string, tenantId: string) {
  const staff = await prisma.staffMember.findFirst({
    where: { id: staffId, tenantId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignments: {
        include: {
          shift: true,
        },
        orderBy: { shift: { date: "asc" } },
      },
    },
  });
  if (!staff) {
    throw new StaffError("Staff member not found", 404);
  }
  return staff;
}
