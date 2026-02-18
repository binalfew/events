import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { CreateWidgetInput, CreateAlertRuleInput } from "~/lib/schemas/command-center";

// ─── Types ────────────────────────────────────────────────

export class CommandCenterError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "CommandCenterError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Condition Operators ─────────────────────────────────

function evalCondition(value: number, condition: string, threshold: number): boolean {
  switch (condition) {
    case "gt":
      return value > threshold;
    case "gte":
      return value >= threshold;
    case "lt":
      return value < threshold;
    case "lte":
      return value <= threshold;
    case "eq":
      return value === threshold;
    default:
      return false;
  }
}

// ─── Dashboard Data Aggregation ──────────────────────────

export async function getCommandCenterData(eventId: string, tenantId: string) {
  const [participants, accessLogs, incidents, transfers, queueTickets, accommodationAssignments] =
    await Promise.all([
      // Registration stats
      prisma.participant.groupBy({
        by: ["status"],
        where: { eventId, tenantId },
        _count: true,
      }),
      // Check-in stats (today)
      prisma.accessLog.findMany({
        where: {
          checkpoint: { eventId },
          scannedAt: { gte: startOfToday() },
        },
        select: { scanResult: true },
      }),
      // Incident summary
      prisma.incident.groupBy({
        by: ["severity", "status"],
        where: { eventId, tenantId },
        _count: true,
      }),
      // Transport status
      prisma.transfer.groupBy({
        by: ["status"],
        where: { eventId, tenantId },
        _count: true,
      }),
      // Queue status
      prisma.queueTicket.findMany({
        where: { eventId, tenantId, status: "WAITING" },
        select: { joinedAt: true },
      }),
      // Accommodation occupancy
      prisma.accommodationAssignment.groupBy({
        by: ["status"],
        where: { eventId, tenantId },
        _count: true,
      }),
    ]);

  // Registration
  const regByStatus: Record<string, number> = {};
  for (const g of participants) {
    regByStatus[g.status] = g._count;
  }

  // Check-in
  const checkInsToday = accessLogs.filter((l) => l.scanResult === "GRANTED").length;
  const checkInsDenied = accessLogs.filter((l) => l.scanResult === "DENIED").length;

  // Incidents
  const openIncidents: Record<string, number> = {};
  let totalOpenIncidents = 0;
  for (const g of incidents) {
    if (["REPORTED", "INVESTIGATING", "ESCALATED"].includes(g.status)) {
      openIncidents[g.severity] = (openIncidents[g.severity] || 0) + g._count;
      totalOpenIncidents += g._count;
    }
  }

  // Transport
  const transportByStatus: Record<string, number> = {};
  for (const g of transfers) {
    transportByStatus[g.status] = g._count;
  }

  // Queue
  const now = Date.now();
  const avgWaitMinutes =
    queueTickets.length > 0
      ? Math.round(
          queueTickets.reduce((sum, t) => sum + (now - t.joinedAt.getTime()) / 60000, 0) /
            queueTickets.length,
        )
      : 0;

  // Accommodation
  const accommByStatus: Record<string, number> = {};
  for (const g of accommodationAssignments) {
    accommByStatus[g.status] = g._count;
  }

  return {
    registration: {
      approved: regByStatus["APPROVED"] || 0,
      pending: regByStatus["PENDING"] || 0,
      rejected: regByStatus["REJECTED"] || 0,
      total: Object.values(regByStatus).reduce((a, b) => a + b, 0),
    },
    checkIn: {
      scannedToday: checkInsToday,
      deniedToday: checkInsDenied,
      totalScansToday: accessLogs.length,
    },
    incidents: {
      openBySeverity: openIncidents,
      totalOpen: totalOpenIncidents,
    },
    transport: {
      scheduled: transportByStatus["SCHEDULED"] || 0,
      enRoute: transportByStatus["EN_ROUTE"] || 0,
      completed: transportByStatus["COMPLETED"] || 0,
    },
    queue: {
      waiting: queueTickets.length,
      avgWaitMinutes,
    },
    accommodation: {
      checkedIn: accommByStatus["CHECKED_IN"] || 0,
      confirmed: accommByStatus["CONFIRMED"] || 0,
      pending: accommByStatus["PENDING"] || 0,
    },
  };
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Widget Functions ────────────────────────────────────

export async function createWidget(input: CreateWidgetInput, ctx: ServiceContext) {
  let config: any;
  try {
    config = JSON.parse(input.config ?? "{}");
  } catch {
    config = {};
  }

  const widget = await prisma.commandCenterWidget.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      widgetType: input.widgetType,
      title: input.title,
      config,
      gridX: input.gridX,
      gridY: input.gridY,
      gridW: input.gridW,
      gridH: input.gridH,
      refreshRate: input.refreshRate,
    },
  });

  logger.info({ widgetId: widget.id }, "Command center widget created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "CommandCenterWidget",
      entityId: widget.id,
      description: `Created widget "${input.title}" (${input.widgetType})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { widgetType: input.widgetType },
    },
  });

  return widget;
}

export async function listWidgets(eventId: string, tenantId: string) {
  return prisma.commandCenterWidget.findMany({
    where: { eventId, tenantId },
    orderBy: [{ gridY: "asc" }, { gridX: "asc" }],
  });
}

export async function deleteWidget(widgetId: string, ctx: ServiceContext) {
  const widget = await prisma.commandCenterWidget.findFirst({
    where: { id: widgetId, tenantId: ctx.tenantId },
  });
  if (!widget) {
    throw new CommandCenterError("Widget not found", 404);
  }

  await prisma.commandCenterWidget.delete({ where: { id: widgetId } });

  logger.info({ widgetId }, "Command center widget deleted");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "CommandCenterWidget",
      entityId: widgetId,
      description: `Deleted widget "${widget.title}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return { success: true };
}

// ─── Alert Rule Functions ────────────────────────────────

export async function createAlertRule(input: CreateAlertRuleInput, ctx: ServiceContext) {
  const rule = await prisma.alertRule.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      description: input.description ?? null,
      metric: input.metric,
      condition: input.condition,
      threshold: input.threshold,
      severity: input.severity,
      cooldownMinutes: input.cooldownMinutes,
    },
  });

  logger.info({ ruleId: rule.id }, "Alert rule created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "AlertRule",
      entityId: rule.id,
      description: `Created alert rule "${input.name}" (${input.metric} ${input.condition} ${input.threshold})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { metric: input.metric, condition: input.condition, threshold: input.threshold },
    },
  });

  return rule;
}

export async function listAlertRules(eventId: string, tenantId: string) {
  return prisma.alertRule.findMany({
    where: { eventId, tenantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleAlertRule(ruleId: string, ctx: ServiceContext) {
  const rule = await prisma.alertRule.findFirst({
    where: { id: ruleId, tenantId: ctx.tenantId },
  });
  if (!rule) {
    throw new CommandCenterError("Alert rule not found", 404);
  }

  const updated = await prisma.alertRule.update({
    where: { id: ruleId },
    data: { isActive: !rule.isActive },
  });

  logger.info({ ruleId, isActive: updated.isActive }, "Alert rule toggled");

  return updated;
}

export async function deleteAlertRule(ruleId: string, ctx: ServiceContext) {
  const rule = await prisma.alertRule.findFirst({
    where: { id: ruleId, tenantId: ctx.tenantId },
  });
  if (!rule) {
    throw new CommandCenterError("Alert rule not found", 404);
  }

  await prisma.alertRule.delete({ where: { id: ruleId } });

  logger.info({ ruleId }, "Alert rule deleted");

  return { success: true };
}

// ─── Alert Evaluation ────────────────────────────────────

export async function evaluateAlerts(eventId: string, tenantId: string) {
  const rules = await prisma.alertRule.findMany({
    where: { eventId, tenantId, isActive: true },
  });

  const data = await getCommandCenterData(eventId, tenantId);
  const now = new Date();
  const triggered: Array<{
    ruleId: string;
    name: string;
    metric: string;
    value: number;
    threshold: number;
    severity: string;
  }> = [];

  for (const rule of rules) {
    // Check cooldown
    if (rule.lastTriggered) {
      const cooldownMs = rule.cooldownMinutes * 60000;
      if (now.getTime() - rule.lastTriggered.getTime() < cooldownMs) {
        continue;
      }
    }

    const value = getMetricValue(data, rule.metric);
    if (value === null) continue;

    if (evalCondition(value, rule.condition, rule.threshold)) {
      triggered.push({
        ruleId: rule.id,
        name: rule.name,
        metric: rule.metric,
        value,
        threshold: rule.threshold,
        severity: rule.severity,
      });

      // Update last triggered timestamp
      await prisma.alertRule.update({
        where: { id: rule.id },
        data: { lastTriggered: now },
      });
    }
  }

  if (triggered.length > 0) {
    logger.info({ eventId, triggeredCount: triggered.length }, "Alerts triggered");
  }

  return triggered;
}

function getMetricValue(
  data: Awaited<ReturnType<typeof getCommandCenterData>>,
  metric: string,
): number | null {
  switch (metric) {
    case "open_incidents":
      return data.incidents.totalOpen;
    case "critical_incidents":
      return data.incidents.openBySeverity["CRITICAL"] || 0;
    case "checkin_rate":
      return data.checkIn.scannedToday;
    case "queue_wait_time":
      return data.queue.avgWaitMinutes;
    case "occupancy_rate":
      return data.accommodation.checkedIn;
    case "transport_delays":
      return data.transport.enRoute;
    case "unassigned_rooms":
      return data.accommodation.pending;
    default:
      return null;
  }
}

export async function getRecentAlerts(eventId: string, tenantId: string) {
  const rules = await prisma.alertRule.findMany({
    where: {
      eventId,
      tenantId,
      lastTriggered: { not: null },
    },
    orderBy: { lastTriggered: "desc" },
    take: 20,
  });

  return rules.map((r) => ({
    id: r.id,
    name: r.name,
    metric: r.metric,
    condition: r.condition,
    threshold: r.threshold,
    severity: r.severity,
    lastTriggered: r.lastTriggered,
  }));
}
