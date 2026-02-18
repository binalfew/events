import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { ReportIncidentInput, AddUpdateInput, EscalateInput } from "~/lib/schemas/incident";

// ─── Types ────────────────────────────────────────────────

export class IncidentError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "IncidentError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── SLA Thresholds (minutes) ────────────────────────────

const SLA_THRESHOLDS: Record<string, number> = {
  CRITICAL: 15,
  HIGH: 60,
  MEDIUM: 240,
  LOW: 1440,
};

// ─── Incident Functions ──────────────────────────────────

export async function reportIncident(input: ReportIncidentInput, ctx: ServiceContext) {
  const incident = await prisma.incident.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      title: input.title,
      description: input.description,
      severity: input.severity,
      status: "REPORTED",
      location: input.location ?? null,
      reportedBy: ctx.userId,
      metadata: { category: input.category },
    },
    include: {
      reportedByUser: { select: { id: true, name: true } },
    },
  });

  logger.info({ incidentId: incident.id, severity: input.severity }, "Incident reported");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Incident",
      entityId: incident.id,
      description: `Reported incident "${input.title}" (${input.severity})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { severity: input.severity, category: input.category },
    },
  });

  return incident;
}

export async function listIncidents(
  eventId: string,
  tenantId: string,
  filters?: { severity?: string; status?: string; category?: string },
) {
  const where: any = { eventId, tenantId };
  if (filters?.severity) where.severity = filters.severity;
  if (filters?.status) where.status = filters.status;
  if (filters?.category) where.metadata = { path: ["category"], equals: filters.category };

  return prisma.incident.findMany({
    where,
    include: {
      reportedByUser: { select: { id: true, name: true } },
      assignedToUser: { select: { id: true, name: true } },
      _count: { select: { updates: true, escalations: true } },
    },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
}

export async function getIncident(id: string, tenantId: string) {
  const incident = await prisma.incident.findFirst({
    where: { id, tenantId },
    include: {
      reportedByUser: { select: { id: true, name: true } },
      assignedToUser: { select: { id: true, name: true } },
      resolvedByUser: { select: { id: true, name: true } },
      updates: {
        include: { updatedByUser: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      escalations: {
        include: {
          escalatedByUser: { select: { id: true, name: true } },
          escalatedToUser: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!incident) {
    throw new IncidentError("Incident not found", 404);
  }
  return incident;
}

export async function assignIncident(incidentId: string, assigneeId: string, ctx: ServiceContext) {
  const incident = await prisma.incident.findFirst({
    where: { id: incidentId, tenantId: ctx.tenantId },
  });
  if (!incident) {
    throw new IncidentError("Incident not found", 404);
  }
  if (incident.status === "CLOSED") {
    throw new IncidentError("Cannot assign a closed incident", 400);
  }

  const newStatus = incident.status === "REPORTED" ? "INVESTIGATING" : incident.status;

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      assignedTo: assigneeId,
      status: newStatus,
    },
  });

  logger.info({ incidentId, assigneeId }, "Incident assigned");

  // Add timeline entry
  await prisma.incidentUpdate.create({
    data: {
      incidentId,
      message: `Incident assigned to responder. Status: ${newStatus}`,
      updatedBy: ctx.userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Incident",
      entityId: incidentId,
      description: `Assigned incident to user ${assigneeId}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { assigneeId, newStatus },
    },
  });

  return updated;
}

export async function addUpdate(input: AddUpdateInput, ctx: ServiceContext) {
  const incident = await prisma.incident.findFirst({
    where: { id: input.incidentId, tenantId: ctx.tenantId },
  });
  if (!incident) {
    throw new IncidentError("Incident not found", 404);
  }
  if (incident.status === "CLOSED") {
    throw new IncidentError("Cannot add updates to a closed incident", 400);
  }

  const update = await prisma.incidentUpdate.create({
    data: {
      incidentId: input.incidentId,
      message: input.message,
      updatedBy: ctx.userId,
    },
    include: {
      updatedByUser: { select: { id: true, name: true } },
    },
  });

  logger.info({ incidentId: input.incidentId }, "Incident update added");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "IncidentUpdate",
      entityId: update.id,
      description: `Added update to incident "${incident.title}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return update;
}

export async function escalateIncident(input: EscalateInput, ctx: ServiceContext) {
  const incident = await prisma.incident.findFirst({
    where: { id: input.incidentId, tenantId: ctx.tenantId },
  });
  if (!incident) {
    throw new IncidentError("Incident not found", 404);
  }
  if (incident.status === "CLOSED" || incident.status === "RESOLVED") {
    throw new IncidentError("Cannot escalate a resolved or closed incident", 400);
  }

  const [escalation] = await Promise.all([
    prisma.incidentEscalation.create({
      data: {
        incidentId: input.incidentId,
        escalatedTo: input.escalatedTo,
        escalatedBy: ctx.userId,
        reason: input.reason,
      },
      include: {
        escalatedToUser: { select: { id: true, name: true } },
      },
    }),
    prisma.incident.update({
      where: { id: input.incidentId },
      data: {
        status: "ESCALATED",
        assignedTo: input.escalatedTo,
      },
    }),
  ]);

  // Add timeline entry
  await prisma.incidentUpdate.create({
    data: {
      incidentId: input.incidentId,
      message: `Escalated: ${input.reason}`,
      updatedBy: ctx.userId,
    },
  });

  logger.info({ incidentId: input.incidentId }, "Incident escalated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Incident",
      entityId: input.incidentId,
      description: `Escalated incident: ${input.reason}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { escalatedTo: input.escalatedTo, reason: input.reason },
    },
  });

  return escalation;
}

export async function resolveIncident(incidentId: string, resolution: string, ctx: ServiceContext) {
  const incident = await prisma.incident.findFirst({
    where: { id: incidentId, tenantId: ctx.tenantId },
  });
  if (!incident) {
    throw new IncidentError("Incident not found", 404);
  }
  if (incident.status === "CLOSED") {
    throw new IncidentError("Cannot resolve a closed incident", 400);
  }
  if (incident.status === "RESOLVED") {
    throw new IncidentError("Incident is already resolved", 400);
  }

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      status: "RESOLVED",
      resolvedBy: ctx.userId,
      resolvedAt: new Date(),
    },
  });

  // Add timeline entry with resolution
  await prisma.incidentUpdate.create({
    data: {
      incidentId,
      message: `Resolved: ${resolution}`,
      updatedBy: ctx.userId,
    },
  });

  logger.info({ incidentId }, "Incident resolved");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Incident",
      entityId: incidentId,
      description: `Resolved incident: ${resolution}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { resolution },
    },
  });

  return updated;
}

export async function closeIncident(incidentId: string, ctx: ServiceContext) {
  const incident = await prisma.incident.findFirst({
    where: { id: incidentId, tenantId: ctx.tenantId },
  });
  if (!incident) {
    throw new IncidentError("Incident not found", 404);
  }
  if (incident.status !== "RESOLVED") {
    throw new IncidentError("Can only close a resolved incident", 400);
  }

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: { status: "CLOSED" },
  });

  await prisma.incidentUpdate.create({
    data: {
      incidentId,
      message: "Incident closed after verification",
      updatedBy: ctx.userId,
    },
  });

  logger.info({ incidentId }, "Incident closed");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Incident",
      entityId: incidentId,
      description: "Closed incident after resolution verification",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

export async function reopenIncident(incidentId: string, reason: string, ctx: ServiceContext) {
  const incident = await prisma.incident.findFirst({
    where: { id: incidentId, tenantId: ctx.tenantId },
  });
  if (!incident) {
    throw new IncidentError("Incident not found", 404);
  }
  if (incident.status !== "CLOSED" && incident.status !== "RESOLVED") {
    throw new IncidentError("Can only reopen a resolved or closed incident", 400);
  }

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      status: "INVESTIGATING",
      resolvedAt: null,
      resolvedBy: null,
    },
  });

  await prisma.incidentUpdate.create({
    data: {
      incidentId,
      message: `Reopened: ${reason}`,
      updatedBy: ctx.userId,
    },
  });

  logger.info({ incidentId }, "Incident reopened");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Incident",
      entityId: incidentId,
      description: `Reopened incident: ${reason}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { reason },
    },
  });

  return updated;
}

// ─── Stats & SLA ─────────────────────────────────────────

export async function getIncidentStats(eventId: string, tenantId: string) {
  const incidents = await prisma.incident.findMany({
    where: { eventId, tenantId },
    select: {
      severity: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
    },
  });

  const byStatus: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let totalResolutionMs = 0;
  let resolvedCount = 0;

  for (const inc of incidents) {
    byStatus[inc.status] = (byStatus[inc.status] || 0) + 1;
    bySeverity[inc.severity] = (bySeverity[inc.severity] || 0) + 1;

    if (inc.resolvedAt) {
      totalResolutionMs += inc.resolvedAt.getTime() - inc.createdAt.getTime();
      resolvedCount++;
    }
  }

  const avgResolutionMinutes =
    resolvedCount > 0 ? Math.round(totalResolutionMs / resolvedCount / 60000) : null;

  return {
    total: incidents.length,
    open:
      (byStatus["REPORTED"] || 0) + (byStatus["INVESTIGATING"] || 0) + (byStatus["ESCALATED"] || 0),
    reported: byStatus["REPORTED"] || 0,
    investigating: byStatus["INVESTIGATING"] || 0,
    escalated: byStatus["ESCALATED"] || 0,
    resolved: byStatus["RESOLVED"] || 0,
    closed: byStatus["CLOSED"] || 0,
    bySeverity,
    avgResolutionMinutes,
  };
}

export async function checkOverdueIncidents(eventId: string, tenantId: string) {
  const openStatuses = ["REPORTED", "INVESTIGATING", "ESCALATED"];
  const incidents = await prisma.incident.findMany({
    where: {
      eventId,
      tenantId,
      status: { in: openStatuses },
    },
    include: {
      reportedByUser: { select: { id: true, name: true } },
      assignedToUser: { select: { id: true, name: true } },
    },
  });

  const now = Date.now();
  const overdue = incidents.filter((inc) => {
    const threshold = SLA_THRESHOLDS[inc.severity] ?? 1440;
    const elapsedMinutes = (now - inc.createdAt.getTime()) / 60000;
    return elapsedMinutes > threshold;
  });

  return overdue;
}
