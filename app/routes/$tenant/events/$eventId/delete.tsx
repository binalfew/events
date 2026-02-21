import { data, redirect, useLoaderData, useActionData, Form, Link } from "react-router";

export const handle = { breadcrumb: "Delete Event" };

import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { deleteEvent, EventError } from "~/services/events.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/delete";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "event", "update");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const event = await prisma.event.findFirst({
    where: { id: params.eventId, tenantId, deletedAt: null },
    include: {
      _count: { select: { participants: true, fieldDefinitions: true, formTemplates: true } },
    },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  return { event };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "event", "update");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    await deleteEvent(params.eventId, ctx);
    return redirect(`/${params.tenant}/events`);
  } catch (error) {
    if (error instanceof EventError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export default function DeleteEventPage() {
  const { event } = useLoaderData<typeof loader>();
  const basePrefix = useBasePrefix();
  const actionData = useActionData<typeof action>();

  const canDelete = event._count.participants === 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Delete Event</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the details below before deleting this event.
        </p>
      </div>

      {actionData && "error" in actionData && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {actionData.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{event.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.description && (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-foreground">Status</span>
              <p className="text-muted-foreground">{event.status}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Dates</span>
              <p className="text-muted-foreground">
                {new Date(event.startDate).toLocaleDateString()}
                {" — "}
                {new Date(event.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="font-medium text-foreground">Participants</span>
              <p className="text-muted-foreground">{event._count.participants}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Fields</span>
              <p className="text-muted-foreground">{event._count.fieldDefinitions}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Form Templates</span>
              <p className="text-muted-foreground">{event._count.formTemplates}</p>
            </div>
          </div>

          {!canDelete && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Cannot delete this event because it has {event._count.participants} participant(s).
              Remove all participants first.
            </div>
          )}

          {canDelete && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              This action cannot be undone. The event and all associated field definitions and form
              templates will be permanently removed.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {canDelete ? (
              <Form method="post">
                <Button type="submit" variant="destructive">
                  Delete Event
                </Button>
              </Form>
            ) : (
              <Button variant="destructive" disabled>
                Delete Event
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to={`${basePrefix}/events`}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
