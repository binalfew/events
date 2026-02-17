import { data, useLoaderData, Form } from "react-router";
import { CalendarDays, Users, GitBranch, Clock, Download, BarChart3 } from "lucide-react";
import { requireAuth } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { getDashboardMetrics, metricsToCSV } from "~/services/analytics.server";
import { prisma } from "~/lib/db.server";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { EmptyState } from "~/components/ui/empty-state";
import {
  MetricCard,
  BarChartCard,
  PieChartCard,
  LineChartCard,
} from "~/components/analytics/charts";
import type { Route } from "./+types/analytics";

export const handle = { breadcrumb: "Analytics" };

export async function loader({ request }: Route.LoaderArgs) {
  const { user, roles } = await requireAuth(request);
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.ANALYTICS_DASHBOARD, {
    tenantId,
    roles,
    userId: user.id,
  });
  if (!enabled) {
    throw data({ error: "Analytics dashboard is not enabled" }, { status: 404 });
  }

  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId") || undefined;

  const metrics = await getDashboardMetrics(tenantId, eventId);

  const events = await prisma.event.findMany({
    where: { tenantId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return { metrics, events, selectedEventId: eventId ?? "" };
}

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireAuth(request);
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action");

  if (_action === "export-csv") {
    const eventId = (formData.get("eventId") as string) || undefined;
    const metrics = await getDashboardMetrics(tenantId, eventId);
    const csv = metricsToCSV(metrics);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="analytics-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return data({ error: "Unknown action" }, { status: 400 });
}

export default function AnalyticsPage() {
  const { metrics, events, selectedEventId } = useLoaderData<typeof loader>();

  const hasData = metrics.totalParticipants > 0 || metrics.totalEvents > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Overview of registrations, workflows, and participant metrics.
          </p>
        </div>
        <Form method="post">
          <input type="hidden" name="_action" value="export-csv" />
          <input type="hidden" name="eventId" value={selectedEventId} />
          <Button type="submit" variant="outline" size="sm">
            <Download className="mr-1 size-3" />
            Export CSV
          </Button>
        </Form>
      </div>

      <Separator />

      {/* Event filter */}
      <Form method="get" className="flex items-end gap-4">
        <div>
          <label htmlFor="eventId" className="mb-1 block text-xs font-medium text-muted-foreground">
            Filter by Event
          </label>
          <NativeSelect id="eventId" name="eventId" defaultValue={selectedEventId}>
            <NativeSelectOption value="">All Events</NativeSelectOption>
            {events.map((e) => (
              <NativeSelectOption key={e.id} value={e.id}>
                {e.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Apply
        </Button>
      </Form>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Events"
          value={metrics.totalEvents}
          icon={<CalendarDays className="size-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Participants"
          value={metrics.totalParticipants}
          icon={<Users className="size-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Workflows"
          value={metrics.totalWorkflows}
          icon={<GitBranch className="size-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Pending Approvals"
          value={metrics.pendingApprovals}
          icon={<Clock className="size-4 text-muted-foreground" />}
        />
      </div>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          description="Charts will appear once events and participants are created."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Status distribution */}
          {metrics.registrationsByStatus.length > 0 && (
            <PieChartCard
              title="Registrations by Status"
              data={metrics.registrationsByStatus.map((s) => ({
                name: s.status,
                value: s.count,
              }))}
            />
          )}

          {/* Participants by event */}
          {metrics.participantsByEvent.length > 0 && (
            <BarChartCard
              title="Participants by Event"
              data={metrics.participantsByEvent}
              dataKey="count"
              nameKey="eventName"
            />
          )}

          {/* Recent activity */}
          {metrics.recentActivity.length > 0 && (
            <div className="lg:col-span-2">
              <LineChartCard
                title="Recent Activity (14 days)"
                data={metrics.recentActivity}
                xAxisKey="date"
                lines={[
                  { dataKey: "registrations", name: "Registrations", color: "hsl(221, 83%, 53%)" },
                  { dataKey: "approvals", name: "Approvals", color: "hsl(142, 71%, 45%)" },
                ]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
