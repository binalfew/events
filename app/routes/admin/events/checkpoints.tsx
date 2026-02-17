import { data, Link, useLoaderData } from "react-router";
import { Settings } from "lucide-react";
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import type { Route } from "./+types/checkpoints";

export const handle = { breadcrumb: "Checkpoints" };

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

export default function CrossEventCheckpointsPage() {
  const { events } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Checkpoints</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select an event to manage its scanning checkpoints.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={Settings}
          title="No events found"
          description="Create an event first, then configure its checkpoints."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/admin/events/${event.id}/settings/checkpoints`}
              className="rounded-lg border bg-card p-6 shadow-sm transition-colors hover:border-primary"
            >
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
