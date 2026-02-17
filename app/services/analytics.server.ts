import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";

// ─── Types ────────────────────────────────────────────────

export interface SnapshotInput {
  tenantId: string;
  eventId?: string;
  metric: string;
  value: number;
  dimensions?: Record<string, unknown>;
  period: string;
  timestamp: Date;
}

export interface MetricQuery {
  tenantId: string;
  eventId?: string;
  metric: string;
  period?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

export interface DashboardMetrics {
  totalEvents: number;
  totalParticipants: number;
  totalWorkflows: number;
  pendingApprovals: number;
  registrationsByStatus: { status: string; count: number }[];
  participantsByEvent: { eventName: string; count: number }[];
  recentActivity: { date: string; registrations: number; approvals: number }[];
}

// ─── Snapshot CRUD ────────────────────────────────────────

export async function recordSnapshot(input: SnapshotInput) {
  const snapshot = await prisma.analyticsSnapshot.create({
    data: {
      tenantId: input.tenantId,
      eventId: input.eventId,
      metric: input.metric,
      value: input.value,
      dimensions: (input.dimensions as object) ?? {},
      period: input.period,
      timestamp: input.timestamp,
    },
  });

  logger.info(
    { snapshotId: snapshot.id, metric: input.metric, value: input.value },
    "Analytics snapshot recorded",
  );
  return snapshot;
}

export async function querySnapshots(query: MetricQuery) {
  return prisma.analyticsSnapshot.findMany({
    where: {
      tenantId: query.tenantId,
      ...(query.eventId && { eventId: query.eventId }),
      metric: query.metric,
      ...(query.period && { period: query.period }),
      ...(query.from || query.to
        ? {
            timestamp: {
              ...(query.from && { gte: query.from }),
              ...(query.to && { lte: query.to }),
            },
          }
        : {}),
    },
    orderBy: { timestamp: "asc" },
    ...(query.limit && { take: query.limit }),
  });
}

export async function deleteSnapshots(tenantId: string, metric?: string) {
  const result = await prisma.analyticsSnapshot.deleteMany({
    where: {
      tenantId,
      ...(metric && { metric }),
    },
  });

  logger.info({ tenantId, metric, count: result.count }, "Analytics snapshots deleted");
  return result.count;
}

// ─── Live Dashboard Metrics ───────────────────────────────

/**
 * Compute live dashboard metrics by querying actual data tables.
 * This provides real-time counts without requiring pre-computed snapshots.
 */
export async function getDashboardMetrics(
  tenantId: string,
  eventId?: string,
): Promise<DashboardMetrics> {
  const eventFilter = eventId ? { id: eventId, tenantId } : { tenantId };

  // Parallel queries for performance
  const [
    totalEvents,
    totalParticipants,
    totalWorkflows,
    pendingApprovals,
    statusGroups,
    eventGroups,
  ] = await Promise.all([
    prisma.event.count({ where: { tenantId } }),
    prisma.participant.count({
      where: { tenantId, ...(eventId && { eventId }) },
    }),
    prisma.workflow.count({
      where: { tenantId, ...(eventId && { eventId }) },
    }),
    prisma.participant.count({
      where: {
        tenantId,
        ...(eventId && { eventId }),
        status: "PENDING",
      },
    }),
    prisma.participant.groupBy({
      by: ["status"],
      where: { tenantId, ...(eventId && { eventId }) },
      _count: true,
    }),
    prisma.participant.groupBy({
      by: ["eventId"],
      where: { tenantId },
      _count: true,
    }),
  ]);

  // Map status groups
  const registrationsByStatus = statusGroups.map((g) => ({
    status: g.status ?? "UNKNOWN",
    count: g._count,
  }));

  // Map event groups with event names
  const eventIds = eventGroups.map((g) => g.eventId);
  const events = await prisma.event.findMany({
    where: { id: { in: eventIds } },
    select: { id: true, name: true },
  });
  const eventNameMap = new Map(events.map((e) => [e.id, e.name]));

  const participantsByEvent = eventGroups.map((g) => ({
    eventName: eventNameMap.get(g.eventId) ?? g.eventId,
    count: g._count,
  }));

  // Recent activity from snapshots (last 14 days)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const recentSnapshots = await prisma.analyticsSnapshot.findMany({
    where: {
      tenantId,
      ...(eventId && { eventId }),
      metric: { in: ["registrations", "approvals"] },
      period: "daily",
      timestamp: { gte: twoWeeksAgo },
    },
    orderBy: { timestamp: "asc" },
  });

  // Group by date
  const activityMap = new Map<string, { registrations: number; approvals: number }>();
  for (const snap of recentSnapshots) {
    const date = snap.timestamp.toISOString().split("T")[0];
    const entry = activityMap.get(date) ?? { registrations: 0, approvals: 0 };
    if (snap.metric === "registrations") entry.registrations = snap.value;
    if (snap.metric === "approvals") entry.approvals = snap.value;
    activityMap.set(date, entry);
  }

  const recentActivity = Array.from(activityMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));

  return {
    totalEvents,
    totalParticipants,
    totalWorkflows,
    pendingApprovals,
    registrationsByStatus,
    participantsByEvent,
    recentActivity,
  };
}

// ─── CSV Export ────────────────────────────────────────────

export function metricsToCSV(metrics: DashboardMetrics): string {
  const lines: string[] = [];

  lines.push("Metric,Value");
  lines.push(`Total Events,${metrics.totalEvents}`);
  lines.push(`Total Participants,${metrics.totalParticipants}`);
  lines.push(`Total Workflows,${metrics.totalWorkflows}`);
  lines.push(`Pending Approvals,${metrics.pendingApprovals}`);
  lines.push("");

  lines.push("Status,Count");
  for (const s of metrics.registrationsByStatus) {
    lines.push(`${s.status},${s.count}`);
  }
  lines.push("");

  lines.push("Event,Participants");
  for (const e of metrics.participantsByEvent) {
    lines.push(`"${e.eventName}",${e.count}`);
  }
  lines.push("");

  lines.push("Date,Registrations,Approvals");
  for (const a of metrics.recentActivity) {
    lines.push(`${a.date},${a.registrations},${a.approvals}`);
  }

  return lines.join("\n");
}
