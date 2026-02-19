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
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Badge } from "~/components/ui/badge";

export const handle = { breadcrumb: "Series Detail" };

// ─── Loader ──────────────────────────────────────────────

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requirePermission } = await import("~/lib/require-auth.server");
  const { getSeries, getYoYComparison } = await import("~/services/event-series.server");

  const { user } = await requirePermission(request, "event-clone", "execute");
  const tenantId = user.tenantId!;
  const seriesId = params.seriesId!;

  const [series, yoyData] = await Promise.all([
    getSeries(seriesId, tenantId),
    getYoYComparison(seriesId, tenantId).catch(() => null),
  ]);

  // Load events for the "Add Edition" form
  const { prisma } = await import("~/lib/db.server");
  const events = await prisma.event.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, name: true, startDate: true },
    orderBy: { startDate: "desc" },
  });

  return {
    series: {
      ...series,
      createdAt: series.createdAt?.toISOString?.() ?? series.createdAt,
      editions: series.editions.map((e: any) => ({
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
    },
    yoyData,
    events: events.map((e: any) => ({
      ...e,
      startDate: e.startDate?.toISOString?.() ?? e.startDate,
    })),
  };
}

// ─── Action ──────────────────────────────────────────────

export async function action({ request, params }: ActionFunctionArgs) {
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
    if (_action === "add_edition") {
      const { addEditionSchema } = await import("~/lib/schemas/event-series");
      const { addEdition } = await import("~/services/event-series.server");

      const parsed = addEditionSchema.parse({
        seriesId: params.seriesId,
        eventId: formData.get("eventId"),
        editionNumber: formData.get("editionNumber"),
        year: formData.get("year"),
        hostCountry: formData.get("hostCountry"),
        hostCity: formData.get("hostCity"),
        notes: formData.get("notes"),
      });

      await addEdition(parsed, ctx);
      return { success: true, message: "Edition added" };
    }

    if (_action === "remove_edition") {
      const { removeEdition } = await import("~/services/event-series.server");
      const editionId = formData.get("editionId") as string;
      await removeEdition(editionId, ctx);
      return { success: true, message: "Edition removed" };
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

export default function SeriesDetailPage() {
  const { series, yoyData, events } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-muted-foreground mb-1 text-sm">
            <Link to="/admin/series" className="hover:underline">
              Event Series
            </Link>{" "}
            / {series.name}
          </div>
          <h2 className="text-2xl font-bold">{series.name}</h2>
          {series.description && <p className="text-muted-foreground mt-1">{series.description}</p>}
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add Edition"}
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

      {/* Add Edition Form */}
      {showAddForm && (
        <Form method="post" className="rounded-lg border p-4 space-y-4">
          <input type="hidden" name="_action" value="add_edition" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="ed-event">Event</Label>
              <NativeSelect id="ed-event" name="eventId" required>
                <NativeSelectOption value="">Select event...</NativeSelectOption>
                {events.map((e: any) => (
                  <NativeSelectOption key={e.id} value={e.id}>
                    {e.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="ed-num">Edition Number</Label>
              <Input
                id="ed-num"
                name="editionNumber"
                type="number"
                required
                min={1}
                defaultValue={series.editions.length + 1}
              />
            </div>
            <div>
              <Label htmlFor="ed-year">Year</Label>
              <Input
                id="ed-year"
                name="year"
                type="number"
                required
                defaultValue={new Date().getFullYear()}
              />
            </div>
            <div>
              <Label htmlFor="ed-country">Host Country</Label>
              <Input id="ed-country" name="hostCountry" placeholder="e.g., Ethiopia" />
            </div>
            <div>
              <Label htmlFor="ed-city">Host City</Label>
              <Input id="ed-city" name="hostCity" placeholder="e.g., Addis Ababa" />
            </div>
            <div>
              <Label htmlFor="ed-notes">Notes</Label>
              <Input id="ed-notes" name="notes" placeholder="Optional notes" />
            </div>
          </div>
          <Button type="submit">Add Edition</Button>
        </Form>
      )}

      {/* Edition Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Editions</h3>
        {series.editions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No editions linked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Year</th>
                  <th className="pb-2 font-medium">Event</th>
                  <th className="pb-2 font-medium">Location</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {series.editions.map((edition: any) => (
                  <tr key={edition.id} className="border-b">
                    <td className="py-2 font-medium">{edition.editionNumber}</td>
                    <td className="py-2">{edition.year}</td>
                    <td className="py-2">
                      {edition.event ? (
                        <Link
                          to={`/admin/events/${edition.event.id}/participants`}
                          className="text-primary hover:underline"
                        >
                          {edition.event.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2">
                      {edition.hostCity && edition.hostCountry
                        ? `${edition.hostCity}, ${edition.hostCountry}`
                        : edition.hostCountry || edition.hostCity || "—"}
                    </td>
                    <td className="py-2">
                      {edition.event && (
                        <Badge
                          className={
                            edition.event.status === "PUBLISHED"
                              ? "bg-green-100 text-green-800"
                              : edition.event.status === "COMPLETED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {edition.event.status}
                        </Badge>
                      )}
                    </td>
                    <td className="py-2">
                      <Form method="post" className="inline">
                        <input type="hidden" name="_action" value="remove_edition" />
                        <input type="hidden" name="editionId" value={edition.id} />
                        <Button type="submit" size="sm" variant="outline" className="text-red-600">
                          Remove
                        </Button>
                      </Form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* YoY Comparison */}
      {yoyData && yoyData.editions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Year-over-Year Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Metric</th>
                  {yoyData.editions.map((e: any) => (
                    <th key={e.editionId} className="pb-2 text-center font-medium">
                      {e.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-medium">Total Registrations</td>
                  {yoyData.editions.map((e: any) => (
                    <td key={e.editionId} className="py-2 text-center">
                      {e.registration.total}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Approved</td>
                  {yoyData.editions.map((e: any) => (
                    <td key={e.editionId} className="py-2 text-center text-green-600">
                      {e.registration.approved}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Pending</td>
                  {yoyData.editions.map((e: any) => (
                    <td key={e.editionId} className="py-2 text-center text-yellow-600">
                      {e.registration.pending}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Rejected</td>
                  {yoyData.editions.map((e: any) => (
                    <td key={e.editionId} className="py-2 text-center text-red-600">
                      {e.registration.rejected}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Avg Processing (days)</td>
                  {yoyData.editions.map((e: any) => (
                    <td key={e.editionId} className="py-2 text-center">
                      {e.avgProcessingDays}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Check-in Rate</td>
                  {yoyData.editions.map((e: any) => (
                    <td key={e.editionId} className="py-2 text-center">
                      {e.checkInRate}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Accommodation Utilization</td>
                  {yoyData.editions.map((e: any) => (
                    <td key={e.editionId} className="py-2 text-center">
                      {e.accommodation.utilization}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Survey Responses</td>
                  {yoyData.editions.map((e: any) => (
                    <td key={e.editionId} className="py-2 text-center">
                      {e.surveyResponses}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Avg Satisfaction</td>
                  {yoyData.editions.map((e: any) => (
                    <td key={e.editionId} className="py-2 text-center">
                      {e.avgSatisfaction ?? "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
