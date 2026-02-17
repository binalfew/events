import { data, Link, useLoaderData } from "react-router";
import { Monitor } from "lucide-react";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import type { Route } from "./+types/kiosks";

export const handle = { breadcrumb: "Kiosks" };

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "kiosk", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.KIOSK_MODE);
  if (!enabled) {
    throw data({ error: "Kiosk mode is not enabled" }, { status: 404 });
  }

  const events = await prisma.event.findMany({
    where: { tenantId },
    orderBy: { startDate: "desc" },
    include: {
      _count: { select: { kioskDevices: true, queueTickets: true } },
    },
  });

  return { events };
}

export default function CrossEventKiosksPage() {
  const { events } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Kiosks</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage kiosk devices and queues across events.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={Monitor}
          title="No events found"
          description="Create an event first, then configure kiosk devices."
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
                {event._count.kioskDevices} device
                {event._count.kioskDevices !== 1 ? "s" : ""}
                {" · "}
                {event._count.queueTickets} queue ticket
                {event._count.queueTickets !== 1 ? "s" : ""}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to={`/admin/events/${event.id}/settings/kiosks`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Devices
                </Link>
                <Link
                  to={`/admin/events/${event.id}/queue`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Queue
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
