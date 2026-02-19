import { useState } from "react";
import {
  data,
  useLoaderData,
  useActionData,
  Form,
  Link,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";

export const handle = { breadcrumb: "Event Series" };

// ─── Loader ──────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const { requirePermission } = await import("~/lib/require-auth.server");
  const { listSeries } = await import("~/services/event-series.server");

  const { user } = await requirePermission(request, "event-clone", "execute");
  const tenantId = user.tenantId!;

  const seriesList = await listSeries(tenantId);

  return {
    seriesList: seriesList.map((s: any) => ({
      ...s,
      createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
      editionCount: s._count?.editions ?? 0,
      editions: s.editions?.map((e: any) => ({
        ...e,
        createdAt: e.createdAt?.toISOString?.() ?? e.createdAt,
        event: e.event
          ? {
              ...e.event,
              startDate: e.event.startDate?.toISOString?.() ?? e.event.startDate,
              endDate: e.event.endDate?.toISOString?.() ?? e.event.endDate,
            }
          : null,
      })),
    })),
  };
}

// ─── Action ──────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const { requirePermission } = await import("~/lib/require-auth.server");
  const { user } = await requirePermission(request, "event-clone", "execute");
  const tenantId = user.tenantId!;

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    if (_action === "create_series") {
      const { createSeriesSchema } = await import("~/lib/schemas/event-series");
      const { createSeries } = await import("~/services/event-series.server");

      const parsed = createSeriesSchema.parse({
        name: formData.get("name"),
        description: formData.get("description"),
      });

      await createSeries(parsed, ctx);
      return { success: true, message: "Series created" };
    }

    return { error: "Unknown action" };
  } catch (err: any) {
    if (err.name === "EventSeriesError") {
      return data({ error: err.message }, { status: err.status });
    }
    if (err.issues) {
      return data({ error: err.issues.map((i: any) => i.message).join(", ") }, { status: 400 });
    }
    throw err;
  }
}

// ─── UI ──────────────────────────────────────────────────

export default function SeriesListPage() {
  const { seriesList } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Series</h2>
          <p className="text-muted-foreground">
            Manage recurring event series and track year-over-year analytics
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create Series"}
        </Button>
      </div>

      {actionData && "error" in actionData && (
        <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
          {actionData.error}
        </div>
      )}
      {actionData && "success" in actionData && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          {actionData.message}
        </div>
      )}

      {showCreateForm && (
        <Form method="post" className="rounded-lg border p-4 space-y-4">
          <input type="hidden" name="_action" value="create_series" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="series-name">Series Name</Label>
              <Input id="series-name" name="name" required placeholder="e.g., AU Summit" />
            </div>
            <div>
              <Label htmlFor="series-desc">Description</Label>
              <Textarea
                id="series-desc"
                name="description"
                placeholder="Annual summit of the African Union"
              />
            </div>
          </div>
          <Button type="submit">Create Series</Button>
        </Form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total Series</p>
          <p className="text-2xl font-bold">{seriesList.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total Editions</p>
          <p className="text-2xl font-bold">
            {seriesList.reduce((sum: number, s: any) => sum + s.editionCount, 0)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Active Series</p>
          <p className="text-2xl font-bold text-green-600">
            {seriesList.filter((s: any) => s.editionCount > 0).length}
          </p>
        </div>
      </div>

      {/* Series List */}
      {seriesList.length === 0 ? (
        <p className="text-muted-foreground text-sm">No event series created yet.</p>
      ) : (
        <div className="space-y-4">
          {seriesList.map((series: any) => (
            <div key={series.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    to={`/admin/series/${series.id}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {series.name}
                  </Link>
                  {series.description && (
                    <p className="text-muted-foreground mt-1 text-sm">{series.description}</p>
                  )}
                  <div className="text-muted-foreground mt-2 text-xs">
                    {series.editionCount} edition{series.editionCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <Link to={`/admin/series/${series.id}`}>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </Link>
              </div>

              {/* Edition Timeline */}
              {series.editions?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {series.editions.map((edition: any) => (
                    <div key={edition.id} className="rounded border bg-gray-50 px-3 py-1 text-sm">
                      <span className="font-medium">#{edition.editionNumber}</span>{" "}
                      <span className="text-muted-foreground">{edition.year}</span>
                      {edition.event && (
                        <span className="ml-1">
                          —{" "}
                          <Link
                            to={`/admin/events/${edition.event.id}/participants`}
                            className="text-primary hover:underline"
                          >
                            {edition.event.name}
                          </Link>
                          <Badge
                            className={
                              edition.event.status === "PUBLISHED"
                                ? "ml-1 bg-green-100 text-green-800"
                                : edition.event.status === "COMPLETED"
                                  ? "ml-1 bg-blue-100 text-blue-800"
                                  : "ml-1 bg-gray-100 text-gray-800"
                            }
                          >
                            {edition.event.status}
                          </Badge>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
