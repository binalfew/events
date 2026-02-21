import { data, useLoaderData, useSearchParams } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { getAccessLogs, exportAccessLogsCsv } from "~/services/check-in.server";
import { listCheckpoints } from "~/services/checkpoints.server";
import { getEventOccupancy } from "~/services/venue-occupancy.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { AccessLogTable } from "~/components/check-in/access-log-table";
import { OccupancyPanel } from "~/components/occupancy/occupancy-panel";
import type { Route } from "./+types/access-logs";

export const handle = { breadcrumb: "Access Logs" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "check-in", "scan");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    select: { id: true, name: true },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const checkpointId = url.searchParams.get("checkpointId") || undefined;
  const scanResult = url.searchParams.get("scanResult") || undefined;

  const [logs, checkpoints, occupancy] = await Promise.all([
    getAccessLogs(tenantId, {
      eventId,
      checkpointId,
      scanResult: scanResult as any,
      page,
      pageSize: 50,
    }),
    listCheckpoints(tenantId, { eventId }),
    getEventOccupancy(eventId),
  ]);

  return { event, logs, checkpoints, occupancy };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "check-in", "scan");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  if (_action === "export") {
    const csv = await exportAccessLogsCsv(tenantId, eventId);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="access-logs-${eventId}.csv"`,
      },
    });
  }

  return data({ error: "Unknown action" }, { status: 400 });
}

// ─── Component ────────────────────────────────────────────

export default function AccessLogsPage() {
  const { event, logs, checkpoints, occupancy } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCheckpointId = searchParams.get("checkpointId") ?? "";
  const currentScanResult = searchParams.get("scanResult") ?? "";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    setSearchParams(params);
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Access Logs</h2>
          <p className="mt-1 text-sm text-muted-foreground">Scan history for {event.name}.</p>
        </div>
        <form method="POST">
          <input type="hidden" name="_action" value="export" />
          <Button type="submit" variant="outline">
            Export CSV
          </Button>
        </form>
      </div>

      <Separator />

      {/* Occupancy */}
      <OccupancyPanel records={occupancy as any} />

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="w-48">
          <Label>Checkpoint</Label>
          <NativeSelect
            value={currentCheckpointId}
            onChange={(e) => updateFilter("checkpointId", e.target.value)}
          >
            <NativeSelectOption value="">All checkpoints</NativeSelectOption>
            {checkpoints.map((cp: any) => (
              <NativeSelectOption key={cp.id} value={cp.id}>
                {cp.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="w-48">
          <Label>Result</Label>
          <NativeSelect
            value={currentScanResult}
            onChange={(e) => updateFilter("scanResult", e.target.value)}
          >
            <NativeSelectOption value="">All results</NativeSelectOption>
            <NativeSelectOption value="VALID">Valid</NativeSelectOption>
            <NativeSelectOption value="INVALID">Invalid</NativeSelectOption>
            <NativeSelectOption value="EXPIRED">Expired</NativeSelectOption>
            <NativeSelectOption value="REVOKED">Revoked</NativeSelectOption>
            <NativeSelectOption value="ALREADY_SCANNED">Already Scanned</NativeSelectOption>
            <NativeSelectOption value="MANUAL_OVERRIDE">Manual Override</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
          <CardDescription>
            {logs.meta.total} log{logs.meta.total !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccessLogTable logs={logs.items as any} />

          {/* Pagination */}
          {logs.meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {logs.meta.page} of {logs.meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logs.meta.page <= 1}
                  onClick={() => goToPage(logs.meta.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logs.meta.page >= logs.meta.totalPages}
                  onClick={() => goToPage(logs.meta.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
