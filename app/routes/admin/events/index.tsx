import { data, Link, useLoaderData } from "react-router";
import { CalendarDays } from "lucide-react";

export const handle = { breadcrumb: "Events" };
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { EmptyState } from "~/components/ui/empty-state";
import { CardGridSkeleton } from "~/components/skeletons";
import { Skeleton } from "~/components/ui/skeleton";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "event", "read");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const events = await prisma.event.findMany({
    where: { tenantId },
    orderBy: { startDate: "asc" },
    include: {
      _count: { select: { fieldDefinitions: true, formTemplates: true } },
    },
  });

  return { events };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
};

export default function EventsListPage() {
  const { events } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Events</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage events and their field definitions.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events found"
          description="Events will appear here once they are created."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground">{event.name}</h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[event.status] ?? "bg-gray-100 text-gray-800"}`}
                >
                  {event.status}
                </span>
              </div>
              {event.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {event.description}
                </p>
              )}
              <div className="mt-3 text-xs text-muted-foreground">
                {event.startDate && new Date(event.startDate).toLocaleDateString()}
                {event.endDate && ` — ${new Date(event.endDate).toLocaleDateString()}`}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {event._count.fieldDefinitions} field
                {event._count.fieldDefinitions !== 1 ? "s" : ""}
                {" · "}
                {event._count.formTemplates} form
                {event._count.formTemplates !== 1 ? "s" : ""}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="text-muted-foreground font-medium">Setup:</span>
                  <Link
                    to={`/admin/events/${event.id}/fields`}
                    className="text-primary hover:underline"
                  >
                    Fields
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/forms`}
                    className="text-primary hover:underline"
                  >
                    Forms
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/delegations`}
                    className="text-primary hover:underline"
                  >
                    Delegations
                  </Link>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="text-muted-foreground font-medium">People:</span>
                  <Link
                    to={`/admin/events/${event.id}/participants`}
                    className="text-primary hover:underline"
                  >
                    Participants
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/bulk-operations`}
                    className="text-primary hover:underline"
                  >
                    Bulk Ops
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/bulk-operations/import`}
                    className="text-primary hover:underline"
                  >
                    Import
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/bulk-operations/export`}
                    className="text-primary hover:underline"
                  >
                    Export
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/duplicates`}
                    className="text-primary hover:underline"
                  >
                    Duplicates
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/merge-history`}
                    className="text-primary hover:underline"
                  >
                    Merge History
                  </Link>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="text-muted-foreground font-medium">Ops:</span>
                  <Link
                    to={`/admin/events/${event.id}/check-in`}
                    className="text-primary hover:underline"
                  >
                    Check-in
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/access-logs`}
                    className="text-primary hover:underline"
                  >
                    Access Logs
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/queue`}
                    className="text-primary hover:underline"
                  >
                    Queue
                  </Link>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="text-muted-foreground font-medium">Comms:</span>
                  <Link
                    to={`/admin/events/${event.id}/communications`}
                    className="text-primary hover:underline"
                  >
                    Broadcasts
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/communications/templates`}
                    className="text-primary hover:underline"
                  >
                    Templates
                  </Link>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="text-muted-foreground font-medium">Settings:</span>
                  <Link
                    to={`/admin/events/${event.id}/settings/checkpoints`}
                    className="text-primary hover:underline"
                  >
                    Checkpoints
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/settings/kiosks`}
                    className="text-primary hover:underline"
                  >
                    Kiosks
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/settings/blacklist`}
                    className="text-primary hover:underline"
                  >
                    Blacklist
                  </Link>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="text-muted-foreground font-medium">Actions:</span>
                  <Link
                    to={`/admin/events/${event.id}/clone`}
                    className="text-primary hover:underline"
                  >
                    Clone
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
