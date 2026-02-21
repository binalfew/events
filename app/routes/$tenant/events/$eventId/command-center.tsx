import { useState } from "react";
import { data, useLoaderData, useActionData, Form, useNavigation } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import {
  getCommandCenterData,
  createWidget,
  listWidgets,
  deleteWidget,
  createAlertRule,
  listAlertRules,
  toggleAlertRule,
  deleteAlertRule,
  evaluateAlerts,
  getRecentAlerts,
  CommandCenterError,
} from "~/services/command-center.server";
import { createWidgetSchema, createAlertRuleSchema } from "~/lib/schemas/command-center";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import type { Route } from "./+types/command-center";

export const handle = { breadcrumb: "Command Center" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "command-center", "view");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;

  const [dashboardData, widgets, alertRules, recentAlerts, triggeredAlerts] = await Promise.all([
    getCommandCenterData(eventId, tenantId),
    listWidgets(eventId, tenantId),
    listAlertRules(eventId, tenantId),
    getRecentAlerts(eventId, tenantId),
    evaluateAlerts(eventId, tenantId),
  ]);

  return {
    eventId,
    dashboard: dashboardData,
    widgets: widgets.map((w: any) => ({
      id: w.id,
      widgetType: w.widgetType,
      title: w.title,
      gridX: w.gridX,
      gridY: w.gridY,
      gridW: w.gridW,
      gridH: w.gridH,
      refreshRate: w.refreshRate,
    })),
    alertRules: alertRules.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      metric: r.metric,
      condition: r.condition,
      threshold: r.threshold,
      severity: r.severity,
      isActive: r.isActive,
      cooldownMinutes: r.cooldownMinutes,
      lastTriggered: r.lastTriggered?.toISOString() ?? null,
    })),
    recentAlerts: recentAlerts.map((a: any) => ({
      ...a,
      lastTriggered: a.lastTriggered?.toISOString() ?? null,
    })),
    triggeredAlerts: triggeredAlerts,
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "command-center", "view");
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
    if (_action === "create_widget") {
      const raw = Object.fromEntries(formData);
      const parsed = createWidgetSchema.parse({ ...raw, eventId });
      await createWidget(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "delete_widget") {
      const widgetId = formData.get("widgetId") as string;
      await deleteWidget(widgetId, ctx);
      return data({ success: true });
    }

    if (_action === "create_alert_rule") {
      const raw = Object.fromEntries(formData);
      const parsed = createAlertRuleSchema.parse({ ...raw, eventId });
      await createAlertRule(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "toggle_alert") {
      const ruleId = formData.get("ruleId") as string;
      await toggleAlertRule(ruleId, ctx);
      return data({ success: true });
    }

    if (_action === "delete_alert") {
      const ruleId = formData.get("ruleId") as string;
      await deleteAlertRule(ruleId, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof CommandCenterError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-blue-100 text-blue-800",
};

const conditionLabels: Record<string, string> = {
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  eq: "=",
};

const metricLabels: Record<string, string> = {
  open_incidents: "Open Incidents",
  critical_incidents: "Critical Incidents",
  checkin_rate: "Check-ins Today",
  queue_wait_time: "Queue Wait (min)",
  occupancy_rate: "Checked-in Guests",
  transport_delays: "Transfers En Route",
  unassigned_rooms: "Pending Rooms",
};

const widgetTypeLabels: Record<string, string> = {
  STAT_CARD: "Stat Card",
  INCIDENT_LIST: "Incident List",
  CHECKIN_CHART: "Check-in Chart",
  TRANSPORT_STATUS: "Transport Status",
  OCCUPANCY: "Occupancy",
  QUEUE_STATUS: "Queue Status",
  ALERT_FEED: "Alert Feed",
  TIMELINE: "Timeline",
};

export default function CommandCenterPage() {
  const { eventId, dashboard, widgets, alertRules, recentAlerts, triggeredAlerts } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showAddAlert, setShowAddAlert] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Command Center</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time operational dashboard for event management.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddAlert(!showAddAlert)}>
            {showAddAlert ? "Hide" : "Add Alert Rule"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddWidget(!showAddWidget)}>
            {showAddWidget ? "Hide" : "Add Widget"}
          </Button>
        </div>
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

      {/* Active Alerts Banner */}
      {triggeredAlerts.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <h3 className="mb-2 font-semibold text-red-800">Active Alerts</h3>
          <div className="space-y-1">
            {triggeredAlerts.map((alert: any) => (
              <div key={alert.ruleId} className="flex items-center gap-2 text-sm text-red-700">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[alert.severity]}`}
                >
                  {alert.severity}
                </span>
                <span className="font-medium">{alert.name}</span>
                <span className="text-red-500">
                  ({metricLabels[alert.metric] ?? alert.metric}: {alert.value} — threshold:{" "}
                  {alert.threshold})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {/* Registration */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Registrations</p>
          <p className="text-2xl font-bold">{dashboard.registration.total}</p>
          <div className="mt-1 text-xs text-muted-foreground">
            <span className="text-green-600">{dashboard.registration.approved} approved</span>
            {" · "}
            <span className="text-yellow-600">{dashboard.registration.pending} pending</span>
          </div>
        </div>
        {/* Check-in */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Check-ins Today</p>
          <p className="text-2xl font-bold text-green-600">{dashboard.checkIn.scannedToday}</p>
          <div className="mt-1 text-xs text-muted-foreground">
            {dashboard.checkIn.deniedToday} denied · {dashboard.checkIn.totalScansToday} total scans
          </div>
        </div>
        {/* Incidents */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Open Incidents</p>
          <p className="text-2xl font-bold text-orange-600">{dashboard.incidents.totalOpen}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(dashboard.incidents.openBySeverity).map(([sev, count]) => (
              <span
                key={sev}
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${severityColors[sev]}`}
              >
                {sev}: {count as number}
              </span>
            ))}
          </div>
        </div>
        {/* Transport */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Transport</p>
          <p className="text-2xl font-bold">{dashboard.transport.enRoute}</p>
          <div className="mt-1 text-xs text-muted-foreground">
            en route · {dashboard.transport.scheduled} scheduled
          </div>
        </div>
        {/* Queue */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Queue</p>
          <p className="text-2xl font-bold">{dashboard.queue.waiting}</p>
          <div className="mt-1 text-xs text-muted-foreground">
            waiting · avg {dashboard.queue.avgWaitMinutes}m
          </div>
        </div>
        {/* Accommodation */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Accommodation</p>
          <p className="text-2xl font-bold">{dashboard.accommodation.checkedIn}</p>
          <div className="mt-1 text-xs text-muted-foreground">
            checked in · {dashboard.accommodation.confirmed} confirmed
          </div>
        </div>
      </div>

      {/* Add Widget Form */}
      {showAddWidget && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Add Dashboard Widget</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input type="hidden" name="_action" value="create_widget" />
            <div>
              <label className="mb-1 block text-sm font-medium">Widget Type *</label>
              <NativeSelect name="widgetType" required>
                <NativeSelectOption value="">Select type</NativeSelectOption>
                {Object.entries(widgetTypeLabels).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Title *</label>
              <input
                name="title"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Widget title"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Width (1-12)</label>
              <input
                name="gridW"
                type="number"
                min="1"
                max="12"
                defaultValue="3"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Widget"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Add Alert Rule Form */}
      {showAddAlert && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Add Alert Rule</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input type="hidden" name="_action" value="create_alert_rule" />
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input
                name="name"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Alert name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Metric *</label>
              <NativeSelect name="metric" required>
                <NativeSelectOption value="">Select metric</NativeSelectOption>
                {Object.entries(metricLabels).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Condition *</label>
              <NativeSelect name="condition" required>
                <NativeSelectOption value="">Select</NativeSelectOption>
                <NativeSelectOption value="gt">Greater than (&gt;)</NativeSelectOption>
                <NativeSelectOption value="gte">Greater or equal (&gt;=)</NativeSelectOption>
                <NativeSelectOption value="lt">Less than (&lt;)</NativeSelectOption>
                <NativeSelectOption value="lte">Less or equal (&lt;=)</NativeSelectOption>
                <NativeSelectOption value="eq">Equal (=)</NativeSelectOption>
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Threshold *</label>
              <input
                name="threshold"
                type="number"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Severity</label>
              <NativeSelect name="severity" defaultValue="MEDIUM">
                <NativeSelectOption value="LOW">Low</NativeSelectOption>
                <NativeSelectOption value="MEDIUM">Medium</NativeSelectOption>
                <NativeSelectOption value="HIGH">High</NativeSelectOption>
                <NativeSelectOption value="CRITICAL">Critical</NativeSelectOption>
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cooldown (min)</label>
              <input
                name="cooldownMinutes"
                type="number"
                min="1"
                defaultValue="15"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <input
                name="description"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Optional description"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Widgets */}
      {widgets.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">Dashboard Widgets ({widgets.length})</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {widgets.map((w: any) => (
              <div key={w.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {widgetTypeLabels[w.widgetType] ?? w.widgetType}
                    </span>
                    <h4 className="font-semibold">{w.title}</h4>
                  </div>
                  <Form method="post">
                    <input type="hidden" name="_action" value="delete_widget" />
                    <input type="hidden" name="widgetId" value={w.id} />
                    <Button type="submit" variant="ghost" size="sm" disabled={isSubmitting}>
                      &times;
                    </Button>
                  </Form>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Grid: {w.gridW}&times;{w.gridH} · Refresh: {w.refreshRate}s
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Rules */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Alert Rules ({alertRules.length})</h3>
        {alertRules.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No alert rules configured. Add one above.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Metric</th>
                  <th className="px-4 py-3 text-left font-medium">Condition</th>
                  <th className="px-4 py-3 text-left font-medium">Severity</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Last Triggered</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {alertRules.map((rule: any) => (
                  <tr key={rule.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{rule.name}</div>
                      {rule.description && (
                        <div className="text-xs text-muted-foreground">{rule.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{metricLabels[rule.metric] ?? rule.metric}</td>
                    <td className="px-4 py-3 font-mono">
                      {conditionLabels[rule.condition]} {rule.threshold}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[rule.severity]}`}
                      >
                        {rule.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${rule.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {rule.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Form method="post">
                          <input type="hidden" name="_action" value="toggle_alert" />
                          <input type="hidden" name="ruleId" value={rule.id} />
                          <Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
                            {rule.isActive ? "Disable" : "Enable"}
                          </Button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="_action" value="delete_alert" />
                          <input type="hidden" name="ruleId" value={rule.id} />
                          <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            disabled={isSubmitting}
                          >
                            Delete
                          </Button>
                        </Form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">Recent Alert History</h3>
          <div className="space-y-2">
            {recentAlerts.map((alert: any) => (
              <div key={alert.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[alert.severity]}`}
                >
                  {alert.severity}
                </span>
                <span className="font-medium">{alert.name}</span>
                <span className="text-sm text-muted-foreground">
                  {metricLabels[alert.metric] ?? alert.metric} {conditionLabels[alert.condition]}{" "}
                  {alert.threshold}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {alert.lastTriggered ? new Date(alert.lastTriggered).toLocaleString() : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
