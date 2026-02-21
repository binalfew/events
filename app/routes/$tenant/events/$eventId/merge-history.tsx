import { data, useLoaderData, useSearchParams } from "react-router";
import { useState } from "react";
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { listMergeHistory } from "~/services/participant-merge.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import type { Route } from "./+types/merge-history";

export const handle = { breadcrumb: "Merge History" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "duplicates", "review");
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
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  const result = await listMergeHistory(tenantId, eventId, page);

  // Load participant names for display
  const participantIds = new Set<string>();
  for (const entry of result.entries) {
    participantIds.add(entry.survivingId);
    participantIds.add(entry.mergedId);
  }

  const participants =
    participantIds.size > 0
      ? await prisma.participant.findMany({
          where: { id: { in: Array.from(participantIds) } },
          select: { id: true, firstName: true, lastName: true, registrationCode: true },
        })
      : [];

  const participantMap = Object.fromEntries(participants.map((p) => [p.id, p]));

  // Load user names for "merged by"
  const userIds = new Set<string>();
  for (const entry of result.entries) {
    userIds.add(entry.mergedBy);
  }

  const users =
    userIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: Array.from(userIds) } },
          select: { id: true, name: true, email: true },
        })
      : [];

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return {
    event,
    entries: result.entries,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    participantMap,
    userMap,
  };
}

// ─── Component ────────────────────────────────────────────

export default function MergeHistoryPage() {
  const { event, entries, total, page, pageSize, participantMap, userMap } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Merge History</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Audit trail of participant merges for {event.name}.
        </p>
      </div>

      <Separator />

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No merge history yet. Merges will appear here after duplicate participants are merged.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Merge Records</CardTitle>
            <CardDescription>
              {total} merge{total !== 1 ? "s" : ""} recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {entries.map((entry: any) => (
                <MergeHistoryEntry
                  key={entry.id}
                  entry={entry}
                  surviving={participantMap[entry.survivingId]}
                  merged={participantMap[entry.mergedId]}
                  mergedByUser={userMap[entry.mergedBy]}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set("page", String(page - 1));
              setSearchParams(params);
            }}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set("page", String(page + 1));
              setSearchParams(params);
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────

function MergeHistoryEntry({
  entry,
  surviving,
  merged,
  mergedByUser,
}: {
  entry: any;
  surviving: any;
  merged: any;
  mergedByUser: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const fieldResolution = (entry.fieldResolution as Record<string, string>) ?? {};
  const fieldCount = Object.keys(fieldResolution).length;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{new Date(entry.mergedAt).toLocaleDateString()}</Badge>
            <span className="text-sm font-medium">
              {surviving?.firstName ?? "?"} {surviving?.lastName ?? "?"}{" "}
              <span className="text-muted-foreground">(surviving)</span>
            </span>
            <span className="text-muted-foreground">&larr;</span>
            <span className="text-sm">
              {merged?.firstName ?? "?"} {merged?.lastName ?? "?"}{" "}
              <span className="text-muted-foreground">(merged)</span>
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {fieldCount} field{fieldCount !== 1 ? "s" : ""} resolved
            {" · "}
            {entry.approvalsMigrated} relation{entry.approvalsMigrated !== 1 ? "s" : ""} migrated
            {" · "}
            by {mergedByUser?.name ?? mergedByUser?.email ?? entry.mergedBy}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Hide" : "Details"}
        </Button>
      </div>

      {expanded && (
        <div className="mt-3 border-t pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Field Resolution</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(fieldResolution).map(([field, source]) => (
              <div key={field} className="flex items-center gap-2">
                <span className="font-medium capitalize">
                  {field.replace(/([A-Z])/g, " $1").trim()}:
                </span>
                <Badge
                  variant={source === "surviving" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {source}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
