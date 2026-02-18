import { useState } from "react";
import { data, useLoaderData, Form, useNavigation } from "react-router";
import { DateTimePicker } from "~/components/ui/date-time-picker";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import {
  createRoute,
  listRoutes,
  registerVehicle,
  listVehicles,
  scheduleTransfer,
  assignVehicle,
  markEnRoute,
  markCompleted,
  markNoShow,
  cancelTransfer,
  getTransportDashboard,
  TransportError,
} from "~/services/transportation.server";
import {
  createRouteSchema,
  registerVehicleSchema,
  scheduleTransferSchema,
} from "~/lib/schemas/transportation";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import type { Route } from "./+types/transportation";

export const handle = { breadcrumb: "Transportation" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "transport", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.TRANSPORT);
  if (!enabled) {
    throw data({ error: "Transport feature is not enabled" }, { status: 404 });
  }

  const eventId = params.eventId;
  const url = new URL(request.url);
  const filterStatus = url.searchParams.get("status") || undefined;
  const filterType = url.searchParams.get("type") || undefined;
  const filterDate = url.searchParams.get("date") || undefined;

  const [routes, vehicles, stats, participants] = await Promise.all([
    listRoutes(eventId, tenantId),
    listVehicles(eventId, tenantId),
    getTransportDashboard(eventId, tenantId),
    prisma.participant.findMany({
      where: { eventId, tenantId, status: "APPROVED" },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  // Fetch transfers with filters
  const transferWhere: Record<string, unknown> = { eventId, tenantId };
  if (filterStatus) transferWhere.status = filterStatus;
  if (filterType) transferWhere.type = filterType;
  if (filterDate) {
    const dateStart = new Date(filterDate);
    const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000);
    transferWhere.scheduledAt = { gte: dateStart, lt: dateEnd };
  }

  const transfers = await prisma.transfer.findMany({
    where: transferWhere,
    include: {
      route: true,
      vehicle: true,
      passengers: { include: { participant: true } },
    },
    orderBy: { scheduledAt: "desc" },
    take: 50,
  });

  return {
    eventId,
    routes: routes.map((r: any) => ({
      id: r.id,
      name: r.name,
      stops: r.stops,
      frequency: r.frequency,
      startTime: r.startTime,
      endTime: r.endTime,
      isActive: r.isActive,
      transferCount: r._count.transfers,
    })),
    vehicles: vehicles.map((v: any) => ({
      id: v.id,
      plateNumber: v.plateNumber,
      type: v.type,
      capacity: v.capacity,
      driverName: v.driverName,
      driverPhone: v.driverPhone,
      isActive: v.isActive,
      transferCount: v._count.transfers,
    })),
    stats,
    transfers: transfers.map((t: any) => ({
      id: t.id,
      type: t.type,
      origin: t.origin,
      destination: t.destination,
      scheduledAt: t.scheduledAt.toISOString(),
      completedAt: t.completedAt?.toISOString() ?? null,
      status: t.status,
      notes: t.notes,
      routeName: t.route?.name ?? null,
      vehiclePlate: t.vehicle?.plateNumber ?? null,
      vehicleId: t.vehicleId,
      passengers: t.passengers.map((p: any) => ({
        id: p.id,
        participantId: p.participantId,
        firstName: p.participant.firstName,
        lastName: p.participant.lastName,
      })),
    })),
    participants,
    filters: { status: filterStatus, type: filterType, date: filterDate },
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "transport", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    if (_action === "create_route") {
      const raw = Object.fromEntries(formData);
      const parsed = createRouteSchema.parse({ ...raw, eventId });
      await createRoute(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "register_vehicle") {
      const raw = Object.fromEntries(formData);
      const parsed = registerVehicleSchema.parse({ ...raw, eventId });
      await registerVehicle(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "schedule_transfer") {
      const raw = Object.fromEntries(formData);
      const participantIds = formData.getAll("participantIds") as string[];
      const parsed = scheduleTransferSchema.parse({
        ...raw,
        eventId,
        participantIds,
      });
      await scheduleTransfer(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "assign_vehicle") {
      const transferId = formData.get("transferId") as string;
      const vehicleId = formData.get("vehicleId") as string;
      await assignVehicle(transferId, vehicleId, ctx);
      return data({ success: true });
    }

    if (_action === "mark_en_route") {
      const transferId = formData.get("transferId") as string;
      await markEnRoute(transferId, ctx);
      return data({ success: true });
    }

    if (_action === "mark_completed") {
      const transferId = formData.get("transferId") as string;
      await markCompleted(transferId, ctx);
      return data({ success: true });
    }

    if (_action === "mark_no_show") {
      const transferId = formData.get("transferId") as string;
      await markNoShow(transferId, ctx);
      return data({ success: true });
    }

    if (_action === "cancel_transfer") {
      const transferId = formData.get("transferId") as string;
      await cancelTransfer(transferId, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof TransportError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  EN_ROUTE: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  NO_SHOW: "bg-red-100 text-red-800",
};

const typeLabels: Record<string, string> = {
  AIRPORT_ARRIVAL: "Airport Arrival",
  AIRPORT_DEPARTURE: "Airport Departure",
  INTER_VENUE: "Inter-Venue",
  CUSTOM: "Custom",
};

export default function TransportationPage() {
  const { routes, vehicles, stats, transfers, participants, filters, eventId } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Transportation & Logistics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage routes, vehicles, and transfer scheduling.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSchedule(!showSchedule)}>
            {showSchedule ? "Hide" : "Schedule Transfer"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddVehicle(!showAddVehicle)}>
            {showAddVehicle ? "Hide" : "Add Vehicle"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddRoute(!showAddRoute)}>
            {showAddRoute ? "Hide" : "Add Route"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Scheduled</p>
          <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">En Route</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.enRoute}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Today's Transfers</p>
          <p className="text-2xl font-bold">{stats.todaysTransfers}</p>
        </div>
      </div>

      {/* Add Route Form */}
      {showAddRoute && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Add Route</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input type="hidden" name="_action" value="create_route" />
            <div>
              <label className="mb-1 block text-sm font-medium">Route Name *</label>
              <input
                name="name"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Airport → Convention Center"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Frequency (minutes)</label>
              <input
                name="frequency"
                type="number"
                min="1"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. 30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Start Time</label>
              <input
                name="startTime"
                type="time"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End Time</label>
              <input
                name="endTime"
                type="time"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Route"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Add Vehicle Form */}
      {showAddVehicle && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Register Vehicle</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="_action" value="register_vehicle" />
            <div>
              <label className="mb-1 block text-sm font-medium">Plate Number *</label>
              <input
                name="plateNumber"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type *</label>
              <NativeSelect name="type" required>
                <NativeSelectOption value="SEDAN">Sedan</NativeSelectOption>
                <NativeSelectOption value="SUV">SUV</NativeSelectOption>
                <NativeSelectOption value="VAN">Van</NativeSelectOption>
                <NativeSelectOption value="BUS">Bus</NativeSelectOption>
                <NativeSelectOption value="MINIBUS">Minibus</NativeSelectOption>
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Capacity *</label>
              <input
                name="capacity"
                type="number"
                min="1"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Driver Name</label>
              <input
                name="driverName"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Driver Phone</label>
              <input
                name="driverPhone"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">GPS Tracking ID</label>
              <input
                name="gpsTrackingId"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register Vehicle"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Schedule Transfer Form */}
      {showSchedule && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Schedule Transfer</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input type="hidden" name="_action" value="schedule_transfer" />
            <div>
              <label className="mb-1 block text-sm font-medium">Type *</label>
              <NativeSelect name="type" required>
                <NativeSelectOption value="AIRPORT_ARRIVAL">Airport Arrival</NativeSelectOption>
                <NativeSelectOption value="AIRPORT_DEPARTURE">Airport Departure</NativeSelectOption>
                <NativeSelectOption value="INTER_VENUE">Inter-Venue</NativeSelectOption>
                <NativeSelectOption value="CUSTOM">Custom</NativeSelectOption>
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Route (optional)</label>
              <NativeSelect name="routeId">
                <NativeSelectOption value="">No route</NativeSelectOption>
                {routes.map((r: any) => (
                  <NativeSelectOption key={r.id} value={r.id}>
                    {r.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Origin *</label>
              <input
                name="origin"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Bole International Airport"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Destination *</label>
              <input
                name="destination"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Hilton Hotel"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Scheduled At *</label>
              <DateTimePicker name="scheduledAt" required placeholder="Select date & time" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <input
                name="notes"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Passengers *</label>
              <select
                name="participantIds"
                multiple
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                size={5}
              >
                {participants.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.lastName}, {p.firstName} {p.email ? `(${p.email})` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Hold Ctrl/Cmd to select multiple passengers
              </p>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Schedule Transfer"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Routes & Vehicles */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Routes */}
        <div>
          <h3 className="mb-2 text-lg font-semibold">Routes ({routes.length})</h3>
          {routes.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
              No routes defined.
            </div>
          ) : (
            <div className="space-y-2">
              {routes.map((r: any) => (
                <div key={r.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.transferCount} transfer(s)
                    </span>
                  </div>
                  {(r.startTime || r.endTime || r.frequency) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.startTime && r.endTime ? `${r.startTime}–${r.endTime}` : ""}
                      {r.frequency ? ` every ${r.frequency} min` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehicles */}
        <div>
          <h3 className="mb-2 text-lg font-semibold">
            Fleet ({vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""})
          </h3>
          {vehicles.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
              No vehicles registered.
            </div>
          ) : (
            <div className="space-y-2">
              {vehicles.map((v: any) => (
                <div key={v.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {v.plateNumber}{" "}
                      <span className="text-xs text-muted-foreground">({v.type})</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Cap: {v.capacity} | {v.transferCount} trip(s)
                    </span>
                  </div>
                  {v.driverName && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Driver: {v.driverName}
                      {v.driverPhone ? ` (${v.driverPhone})` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Transfers</h3>
        <Form method="get" className="mb-3 flex flex-wrap gap-3">
          <NativeSelect name="status" defaultValue={filters.status ?? ""}>
            <NativeSelectOption value="">All Statuses</NativeSelectOption>
            <NativeSelectOption value="SCHEDULED">Scheduled</NativeSelectOption>
            <NativeSelectOption value="EN_ROUTE">En Route</NativeSelectOption>
            <NativeSelectOption value="COMPLETED">Completed</NativeSelectOption>
            <NativeSelectOption value="CANCELLED">Cancelled</NativeSelectOption>
            <NativeSelectOption value="NO_SHOW">No Show</NativeSelectOption>
          </NativeSelect>
          <NativeSelect name="type" defaultValue={filters.type ?? ""}>
            <NativeSelectOption value="">All Types</NativeSelectOption>
            <NativeSelectOption value="AIRPORT_ARRIVAL">Airport Arrival</NativeSelectOption>
            <NativeSelectOption value="AIRPORT_DEPARTURE">Airport Departure</NativeSelectOption>
            <NativeSelectOption value="INTER_VENUE">Inter-Venue</NativeSelectOption>
            <NativeSelectOption value="CUSTOM">Custom</NativeSelectOption>
          </NativeSelect>
          <input
            name="date"
            type="date"
            defaultValue={filters.date ?? ""}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
          <Button type="submit" variant="secondary" size="sm">
            Filter
          </Button>
        </Form>
      </div>

      {/* Transfers Table */}
      {transfers.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No transfers found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Route</th>
                <th className="px-4 py-3 text-left font-medium">Origin → Dest</th>
                <th className="px-4 py-3 text-left font-medium">Scheduled</th>
                <th className="px-4 py-3 text-left font-medium">Vehicle</th>
                <th className="px-4 py-3 text-left font-medium">Passengers</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transfers.map((t: any) => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs">{typeLabels[t.type] ?? t.type}</td>
                  <td className="px-4 py-3">{t.routeName || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs">
                      {t.origin} → {t.destination}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(t.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {t.vehiclePlate ? (
                      t.vehiclePlate
                    ) : t.status === "SCHEDULED" ? (
                      <Form method="post" className="flex items-center gap-1">
                        <input type="hidden" name="_action" value="assign_vehicle" />
                        <input type="hidden" name="transferId" value={t.id} />
                        <NativeSelect name="vehicleId" required>
                          <NativeSelectOption value="">Assign</NativeSelectOption>
                          {vehicles.map((v: any) => (
                            <NativeSelectOption key={v.id} value={v.id}>
                              {v.plateNumber}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                        <Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
                          Go
                        </Button>
                      </Form>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs">
                      {t.passengers.map((p: any) => `${p.firstName} ${p.lastName}`).join(", ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[t.status] ?? ""}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {t.status === "SCHEDULED" && (
                        <>
                          <Form method="post">
                            <input type="hidden" name="_action" value="mark_en_route" />
                            <input type="hidden" name="transferId" value={t.id} />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              disabled={isSubmitting}
                            >
                              Depart
                            </Button>
                          </Form>
                          <Form method="post">
                            <input type="hidden" name="_action" value="cancel_transfer" />
                            <input type="hidden" name="transferId" value={t.id} />
                            <Button
                              type="submit"
                              variant="destructive"
                              size="sm"
                              disabled={isSubmitting}
                            >
                              Cancel
                            </Button>
                          </Form>
                        </>
                      )}
                      {t.status === "EN_ROUTE" && (
                        <>
                          <Form method="post">
                            <input type="hidden" name="_action" value="mark_completed" />
                            <input type="hidden" name="transferId" value={t.id} />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              disabled={isSubmitting}
                            >
                              Complete
                            </Button>
                          </Form>
                          <Form method="post">
                            <input type="hidden" name="_action" value="mark_no_show" />
                            <input type="hidden" name="transferId" value={t.id} />
                            <Button
                              type="submit"
                              variant="destructive"
                              size="sm"
                              disabled={isSubmitting}
                            >
                              No Show
                            </Button>
                          </Form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
