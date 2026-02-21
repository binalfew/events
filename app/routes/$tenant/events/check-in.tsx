import { data, Link, useLoaderData } from "react-router";
import { ScanLine } from "lucide-react";
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/check-in";

export const handle = { breadcrumb: "Check-in" };

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "check-in", "scan");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const events = await prisma.event.findMany({
    where: { tenantId },
    orderBy: { startDate: "desc" },
    include: {
      _count: { select: { checkpoints: true } },
    },
  });

  return { events };
}

export default function CrossEventCheckInPage() {
  const { events } = useLoaderData<typeof loader>();
  const basePrefix = useBasePrefix();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Check-in</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select an event to start scanning badges.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={ScanLine}
          title="No events found"
          description="Create an event first, then configure checkpoints for badge scanning."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground">{event.name}</h3>
                <Badge variant={event.status === "PUBLISHED" ? "default" : "secondary"}>
                  {event.status}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(event.startDate).toLocaleDateString()}
                {` — ${new Date(event.endDate).toLocaleDateString()}`}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {event._count.checkpoints} checkpoint
                {event._count.checkpoints !== 1 ? "s" : ""}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to={`${basePrefix}/events/${event.id}/check-in`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Scanner
                </Link>
                <Link
                  to={`${basePrefix}/events/${event.id}/access-logs`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Access Logs
                </Link>
                <Link
                  to={`${basePrefix}/events/${event.id}/settings/checkpoints`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Checkpoints
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
