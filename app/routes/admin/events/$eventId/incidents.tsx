import { useState } from "react";
import { data, useLoaderData, useActionData, Form, useNavigation } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import {
  reportIncident,
  listIncidents,
  assignIncident,
  addUpdate,
  escalateIncident,
  resolveIncident,
  closeIncident,
  reopenIncident,
  getIncidentStats,
  checkOverdueIncidents,
  IncidentError,
} from "~/services/incidents.server";
import { reportIncidentSchema, addUpdateSchema, escalateSchema } from "~/lib/schemas/incident";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import type { Route } from "./+types/incidents";

export const handle = { breadcrumb: "Incidents" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "incident", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.INCIDENT_MANAGEMENT);
  if (!enabled) {
    throw data({ error: "Incident management is not enabled" }, { status: 404 });
  }

  const eventId = params.eventId;
  const url = new URL(request.url);
  const severityFilter = url.searchParams.get("severity") || undefined;
  const statusFilter = url.searchParams.get("status") || undefined;

  const [incidents, stats, overdueIncidents, users] = await Promise.all([
    listIncidents(eventId, tenantId, {
      severity: severityFilter,
      status: statusFilter,
    }),
    getIncidentStats(eventId, tenantId),
    checkOverdueIncidents(eventId, tenantId),
    import("~/lib/db.server").then(({ prisma }) =>
      prisma.user.findMany({
        where: { tenantId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ),
  ]);

  return {
    eventId,
    incidents: incidents.map((inc: any) => ({
      id: inc.id,
      title: inc.title,
      description: inc.description,
      severity: inc.severity,
      status: inc.status,
      location: inc.location,
      category: (inc.metadata as any)?.category ?? "General",
      reportedBy: inc.reportedByUser?.name ?? "Unknown",
      assignedTo: inc.assignedToUser?.name ?? null,
      assignedToId: inc.assignedTo,
      updatesCount: inc._count.updates,
      escalationsCount: inc._count.escalations,
      createdAt: inc.createdAt.toISOString(),
      resolvedAt: inc.resolvedAt?.toISOString() ?? null,
    })),
    stats,
    overdueCount: overdueIncidents.length,
    users,
    filters: { severity: severityFilter, status: statusFilter },
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "incident", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    if (_action === "report_incident") {
      const raw = Object.fromEntries(formData);
      const parsed = reportIncidentSchema.parse({ ...raw, eventId });
      await reportIncident(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "assign_incident") {
      const incidentId = formData.get("incidentId") as string;
      const assigneeId = formData.get("assigneeId") as string;
      await assignIncident(incidentId, assigneeId, ctx);
      return data({ success: true });
    }

    if (_action === "add_update") {
      const raw = Object.fromEntries(formData);
      const parsed = addUpdateSchema.parse(raw);
      await addUpdate(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "escalate") {
      const raw = Object.fromEntries(formData);
      const parsed = escalateSchema.parse(raw);
      await escalateIncident(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "resolve") {
      const incidentId = formData.get("incidentId") as string;
      const resolution = formData.get("resolution") as string;
      await resolveIncident(incidentId, resolution, ctx);
      return data({ success: true });
    }

    if (_action === "close") {
      const incidentId = formData.get("incidentId") as string;
      await closeIncident(incidentId, ctx);
      return data({ success: true });
    }

    if (_action === "reopen") {
      const incidentId = formData.get("incidentId") as string;
      const reason = formData.get("reason") as string;
      await reopenIncident(incidentId, reason, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof IncidentError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800 border-red-300",
  HIGH: "bg-orange-100 text-orange-800 border-orange-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
  LOW: "bg-blue-100 text-blue-800 border-blue-300",
};

const statusColors: Record<string, string> = {
  REPORTED: "bg-yellow-100 text-yellow-800",
  INVESTIGATING: "bg-blue-100 text-blue-800",
  ESCALATED: "bg-red-100 text-red-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const CATEGORIES = [
  "Medical",
  "Security",
  "Technical",
  "Fire",
  "Weather",
  "Crowd Control",
  "VIP",
  "General",
];

export default function IncidentsPage() {
  const { eventId, incidents, stats, overdueCount, users, filters } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showReport, setShowReport] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Incident Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Report, track, and resolve event incidents.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowReport(!showReport)}>
          {showReport ? "Hide" : "Report Incident"}
        </Button>
      </div>

      {/* Action Feedback */}
      {actionData && "error" in actionData && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {actionData.error}
        </div>
      )}
      {actionData && "success" in actionData && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Operation completed successfully.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Open</p>
          <p className="text-2xl font-bold text-orange-600">{stats.open}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Reported</p>
          <p className="text-2xl font-bold">{stats.reported}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Investigating</p>
          <p className="text-2xl font-bold">{stats.investigating}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Escalated</p>
          <p className="text-2xl font-bold text-red-600">{stats.escalated}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avg Resolution</p>
          <p className="text-2xl font-bold">
            {stats.avgResolutionMinutes != null ? `${stats.avgResolutionMinutes}m` : "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
        </div>
      </div>

      {/* Severity Breakdown */}
      {Object.keys(stats.bySeverity).length > 0 && (
        <div className="flex gap-3">
          {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) =>
            stats.bySeverity[sev] ? (
              <span
                key={sev}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${severityColors[sev]}`}
              >
                {sev}: {stats.bySeverity[sev]}
              </span>
            ) : null,
          )}
        </div>
      )}

      {/* Report Incident Form */}
      {showReport && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Report New Incident</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="_action" value="report_incident" />
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Title *</label>
              <input
                name="title"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Brief description of the incident"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Severity *</label>
              <NativeSelect name="severity" required>
                <NativeSelectOption value="">Select severity</NativeSelectOption>
                <NativeSelectOption value="CRITICAL">Critical</NativeSelectOption>
                <NativeSelectOption value="HIGH">High</NativeSelectOption>
                <NativeSelectOption value="MEDIUM">Medium</NativeSelectOption>
                <NativeSelectOption value="LOW">Low</NativeSelectOption>
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category *</label>
              <NativeSelect name="category" required>
                <NativeSelectOption value="">Select category</NativeSelectOption>
                {CATEGORIES.map((cat) => (
                  <NativeSelectOption key={cat} value={cat}>
                    {cat}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Location</label>
              <input
                name="location"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Hall A, Entrance Gate 2"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Reporting..." : "Report Incident"}
              </Button>
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm font-medium">Description *</label>
              <textarea
                name="description"
                required
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Detailed description of the incident"
              />
            </div>
          </Form>
        </div>
      )}

      {/* Filters */}
      <Form method="get" className="flex items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Severity</label>
          <NativeSelect name="severity" defaultValue={filters.severity ?? ""}>
            <NativeSelectOption value="">All Severities</NativeSelectOption>
            <NativeSelectOption value="CRITICAL">Critical</NativeSelectOption>
            <NativeSelectOption value="HIGH">High</NativeSelectOption>
            <NativeSelectOption value="MEDIUM">Medium</NativeSelectOption>
            <NativeSelectOption value="LOW">Low</NativeSelectOption>
          </NativeSelect>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <NativeSelect name="status" defaultValue={filters.status ?? ""}>
            <NativeSelectOption value="">All Statuses</NativeSelectOption>
            <NativeSelectOption value="REPORTED">Reported</NativeSelectOption>
            <NativeSelectOption value="INVESTIGATING">Investigating</NativeSelectOption>
            <NativeSelectOption value="ESCALATED">Escalated</NativeSelectOption>
            <NativeSelectOption value="RESOLVED">Resolved</NativeSelectOption>
            <NativeSelectOption value="CLOSED">Closed</NativeSelectOption>
          </NativeSelect>
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
      </Form>

      {/* Incidents List */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Incidents ({incidents.length})</h3>
        {incidents.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No incidents reported.
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc: any) => (
              <div key={inc.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${severityColors[inc.severity]}`}
                      >
                        {inc.severity}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[inc.status]}`}
                      >
                        {inc.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{inc.category}</span>
                    </div>
                    <h4 className="mt-1 font-semibold">{inc.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {inc.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Reported by: {inc.reportedBy}</span>
                      {inc.assignedTo && <span>Assigned to: {inc.assignedTo}</span>}
                      {inc.location && <span>Location: {inc.location}</span>}
                      <span>{new Date(inc.createdAt).toLocaleString()}</span>
                      {inc.updatesCount > 0 && <span>{inc.updatesCount} updates</span>}
                      {inc.escalationsCount > 0 && (
                        <span className="text-red-600">{inc.escalationsCount} escalation(s)</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === inc.id ? null : inc.id)}
                  >
                    {expandedId === inc.id ? "Collapse" : "Actions"}
                  </Button>
                </div>

                {/* Expanded Actions Panel */}
                {expandedId === inc.id && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {/* Assign */}
                    {inc.status !== "CLOSED" && (
                      <div className="rounded border bg-muted/20 p-3">
                        <p className="mb-2 text-sm font-medium">Assign Responder</p>
                        <Form method="post" className="flex items-end gap-2">
                          <input type="hidden" name="_action" value="assign_incident" />
                          <input type="hidden" name="incidentId" value={inc.id} />
                          <div className="flex-1">
                            <NativeSelect
                              name="assigneeId"
                              required
                              defaultValue={inc.assignedToId ?? ""}
                            >
                              <NativeSelectOption value="">Select responder</NativeSelectOption>
                              {users.map((u: any) => (
                                <NativeSelectOption key={u.id} value={u.id}>
                                  {u.name}
                                </NativeSelectOption>
                              ))}
                            </NativeSelect>
                          </div>
                          <Button type="submit" size="sm" disabled={isSubmitting}>
                            Assign
                          </Button>
                        </Form>
                      </div>
                    )}

                    {/* Add Update */}
                    {inc.status !== "CLOSED" && (
                      <div className="rounded border bg-muted/20 p-3">
                        <p className="mb-2 text-sm font-medium">Add Update</p>
                        <Form method="post" className="flex items-end gap-2">
                          <input type="hidden" name="_action" value="add_update" />
                          <input type="hidden" name="incidentId" value={inc.id} />
                          <div className="flex-1">
                            <input
                              name="message"
                              required
                              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                              placeholder="Status update or note"
                            />
                          </div>
                          <Button type="submit" size="sm" disabled={isSubmitting}>
                            Add
                          </Button>
                        </Form>
                      </div>
                    )}

                    {/* Escalate */}
                    {inc.status !== "CLOSED" && inc.status !== "RESOLVED" && (
                      <div className="rounded border bg-muted/20 p-3">
                        <p className="mb-2 text-sm font-medium">Escalate</p>
                        <Form method="post" className="flex flex-wrap items-end gap-2">
                          <input type="hidden" name="_action" value="escalate" />
                          <input type="hidden" name="incidentId" value={inc.id} />
                          <div className="flex-1 min-w-[200px]">
                            <NativeSelect name="escalatedTo" required>
                              <NativeSelectOption value="">
                                Select escalation target
                              </NativeSelectOption>
                              {users.map((u: any) => (
                                <NativeSelectOption key={u.id} value={u.id}>
                                  {u.name}
                                </NativeSelectOption>
                              ))}
                            </NativeSelect>
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <input
                              name="reason"
                              required
                              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                              placeholder="Escalation reason"
                            />
                          </div>
                          <Button
                            type="submit"
                            size="sm"
                            variant="destructive"
                            disabled={isSubmitting}
                          >
                            Escalate
                          </Button>
                        </Form>
                      </div>
                    )}

                    {/* Resolve */}
                    {inc.status !== "CLOSED" && inc.status !== "RESOLVED" && (
                      <div className="rounded border bg-muted/20 p-3">
                        <p className="mb-2 text-sm font-medium">Resolve</p>
                        <Form method="post" className="flex items-end gap-2">
                          <input type="hidden" name="_action" value="resolve" />
                          <input type="hidden" name="incidentId" value={inc.id} />
                          <div className="flex-1">
                            <input
                              name="resolution"
                              required
                              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                              placeholder="Resolution summary"
                            />
                          </div>
                          <Button type="submit" size="sm" disabled={isSubmitting}>
                            Resolve
                          </Button>
                        </Form>
                      </div>
                    )}

                    {/* Close */}
                    {inc.status === "RESOLVED" && (
                      <Form method="post" className="inline">
                        <input type="hidden" name="_action" value="close" />
                        <input type="hidden" name="incidentId" value={inc.id} />
                        <Button type="submit" size="sm" variant="secondary" disabled={isSubmitting}>
                          Close Incident
                        </Button>
                      </Form>
                    )}

                    {/* Reopen */}
                    {(inc.status === "RESOLVED" || inc.status === "CLOSED") && (
                      <div className="rounded border bg-muted/20 p-3">
                        <p className="mb-2 text-sm font-medium">Reopen</p>
                        <Form method="post" className="flex items-end gap-2">
                          <input type="hidden" name="_action" value="reopen" />
                          <input type="hidden" name="incidentId" value={inc.id} />
                          <div className="flex-1">
                            <input
                              name="reason"
                              required
                              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                              placeholder="Reason for reopening"
                            />
                          </div>
                          <Button type="submit" size="sm" variant="outline" disabled={isSubmitting}>
                            Reopen
                          </Button>
                        </Form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
