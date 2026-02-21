import { useState } from "react";
import { data, useLoaderData, useActionData, Form, useNavigation } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import {
  createVenueMap,
  listVenueMaps,
  createRoom,
  bookRoom,
  confirmBooking,
  cancelBooking,
  getRoomSchedule,
  getVenueOverview,
  VenueError,
} from "~/services/venue.server";
import { createVenueMapSchema, createRoomSchema, bookRoomSchema } from "~/lib/schemas/venue";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { DateTimePicker } from "~/components/ui/date-time-picker";
import { DatePicker } from "~/components/ui/date-picker";
import type { Route } from "./+types/venue";

export const handle = { breadcrumb: "Venue" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "venue", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const url = new URL(request.url);
  const filterVenueId = url.searchParams.get("venueMapId") || undefined;
  const filterDate = url.searchParams.get("date") || new Date().toISOString().split("T")[0];

  let venues, overview, schedule;
  try {
    [venues, overview, schedule] = await Promise.all([
      listVenueMaps(eventId, tenantId),
      getVenueOverview(eventId, tenantId),
      getRoomSchedule(eventId, tenantId, filterDate),
    ]);
  } catch (err: any) {
    console.error("Venue loader error:", err);
    throw data({ error: err.message ?? "Failed to load venue data" }, { status: 500 });
  }

  // Build a flat list of all rooms for the booking form
  const allRooms = venues.flatMap((v: any) =>
    v.rooms.map((r: any) => ({
      id: r.id,
      name: r.name,
      venueName: v.name,
      capacity: r.capacity,
    })),
  );

  return {
    eventId,
    venues: venues.map((v: any) => ({
      id: v.id,
      name: v.name,
      description: v.description,
      rooms: v.rooms.map((r: any) => ({
        id: r.id,
        name: r.name,
        floor: r.floor,
        capacity: r.capacity,
        roomType: r.roomType,
        equipment: r.equipment as string[],
        bookingCount: r.bookings?.length ?? 0,
      })),
    })),
    allRooms,
    overview,
    schedule: schedule.map((b: any) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      status: b.status,
      roomName: b.room.name,
      venueName: b.room.venueMap.name,
      bookedBy: b.bookedByUser.name ?? b.bookedByUser.email,
    })),
    filters: { venueMapId: filterVenueId, date: filterDate },
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "venue", "manage");
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
    if (_action === "create_venue") {
      const raw = Object.fromEntries(formData);
      const parsed = createVenueMapSchema.parse({ ...raw, eventId });
      await createVenueMap(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "create_room") {
      const raw = Object.fromEntries(formData);
      const parsed = createRoomSchema.parse(raw);
      await createRoom(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "book_room") {
      const raw = Object.fromEntries(formData);
      const parsed = bookRoomSchema.parse({ ...raw, eventId });
      await bookRoom(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "confirm_booking") {
      const bookingId = formData.get("bookingId") as string;
      await confirmBooking(bookingId, ctx);
      return data({ success: true });
    }

    if (_action === "cancel_booking") {
      const bookingId = formData.get("bookingId") as string;
      const reason = (formData.get("reason") as string) || "Cancelled by admin";
      await cancelBooking(bookingId, reason, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof VenueError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

const bookingStatusColors: Record<string, string> = {
  TENTATIVE: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function VenuePage() {
  const { venues, allRooms, overview, schedule, filters, eventId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showAddVenue, setShowAddVenue] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showBookRoom, setShowBookRoom] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Venue & Room Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage venues, rooms, and bookings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowBookRoom(!showBookRoom)}>
            {showBookRoom ? "Hide" : "Book Room"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddRoom(!showAddRoom)}>
            {showAddRoom ? "Hide" : "Add Room"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddVenue(!showAddVenue)}>
            {showAddVenue ? "Hide" : "Add Venue"}
          </Button>
        </div>
      </div>

      {/* Action Error/Success */}
      {actionData && "error" in actionData && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {actionData.error}
        </div>
      )}
      {actionData && "success" in actionData && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Operation completed successfully.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Venues</p>
          <p className="text-2xl font-bold">{overview.venues}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Rooms</p>
          <p className="text-2xl font-bold">{overview.rooms}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Capacity</p>
          <p className="text-2xl font-bold">{overview.totalCapacity}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Bookings</p>
          <p className="text-2xl font-bold text-green-600">{overview.activeBookings}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{overview.cancelledBookings}</p>
        </div>
      </div>

      {/* Add Venue Form */}
      {showAddVenue && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Add Venue</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input type="hidden" name="_action" value="create_venue" />
            <div>
              <label className="mb-1 block text-sm font-medium">Venue Name *</label>
              <input
                name="name"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Main Conference Center"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <input
                name="description"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Brief description"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Venue"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Add Room Form */}
      {showAddRoom && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Add Room</h3>
          {venues.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create a venue first.</p>
          ) : (
            <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input type="hidden" name="_action" value="create_room" />
              <div>
                <label className="mb-1 block text-sm font-medium">Venue *</label>
                <NativeSelect name="venueMapId" required>
                  <NativeSelectOption value="">Select venue</NativeSelectOption>
                  {venues.map((v: any) => (
                    <NativeSelectOption key={v.id} value={v.id}>
                      {v.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Room Name *</label>
                <input
                  name="name"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. Hall A"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Floor</label>
                <input
                  name="floor"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. Ground Floor"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Capacity</label>
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Room Type</label>
                <input
                  name="roomType"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. Conference, Meeting, Plenary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Equipment</label>
                <input
                  name="equipment"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Projector, Microphone, Whiteboard"
                />
              </div>
              <div className="md:col-span-3 flex items-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Room"}
                </Button>
              </div>
            </Form>
          )}
        </div>
      )}

      {/* Book Room Form */}
      {showBookRoom && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Book Room</h3>
          {allRooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create a venue and room first.</p>
          ) : (
            <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input type="hidden" name="_action" value="book_room" />
              <div>
                <label className="mb-1 block text-sm font-medium">Room *</label>
                <NativeSelect name="roomId" required>
                  <NativeSelectOption value="">Select room</NativeSelectOption>
                  {allRooms.map((r: any) => (
                    <NativeSelectOption key={r.id} value={r.id}>
                      {r.venueName} — {r.name}
                      {r.capacity ? ` (${r.capacity} seats)` : ""}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Title *</label>
                <input
                  name="title"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. Opening Ceremony"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <input
                  name="description"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Optional description"
                />
              </div>
              <div>{/* spacer */}</div>
              <div>
                <label className="mb-1 block text-sm font-medium">Start Time *</label>
                <DateTimePicker name="startTime" required placeholder="Select start time" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">End Time *</label>
                <DateTimePicker name="endTime" required placeholder="Select end time" />
              </div>
              <div className="md:col-span-2 flex items-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Booking..." : "Book Room"}
                </Button>
              </div>
            </Form>
          )}
        </div>
      )}

      {/* Venues & Rooms */}
      {venues.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Venues & Rooms</h3>
          {venues.map((v: any) => (
            <div key={v.id} className="rounded-lg border bg-card p-4">
              <h4 className="font-semibold">{v.name}</h4>
              {v.description && (
                <p className="mt-1 text-sm text-muted-foreground">{v.description}</p>
              )}
              {v.rooms.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No rooms added yet.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Room</th>
                        <th className="px-3 py-2 text-left font-medium">Floor</th>
                        <th className="px-3 py-2 text-left font-medium">Type</th>
                        <th className="px-3 py-2 text-left font-medium">Capacity</th>
                        <th className="px-3 py-2 text-left font-medium">Equipment</th>
                        <th className="px-3 py-2 text-left font-medium">Bookings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {v.rooms.map((r: any) => (
                        <tr key={r.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{r.name}</td>
                          <td className="px-3 py-2">{r.floor || "—"}</td>
                          <td className="px-3 py-2">{r.roomType || "—"}</td>
                          <td className="px-3 py-2">{r.capacity ?? "—"}</td>
                          <td className="px-3 py-2 text-xs">
                            {(r.equipment as string[]).length > 0
                              ? (r.equipment as string[]).join(", ")
                              : "—"}
                          </td>
                          <td className="px-3 py-2">{r.bookingCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Daily Schedule */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Daily Schedule</h3>
          <Form method="get" className="flex items-center gap-2">
            <DatePicker name="date" placeholder="Select date" />
            <Button type="submit" variant="secondary" size="sm">
              View
            </Button>
          </Form>
        </div>

        {schedule.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No bookings for this date.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Time</th>
                  <th className="px-4 py-3 text-left font-medium">Room</th>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Booked By</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {schedule.map((b: any) => (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {new Date(b.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {new Date(b.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {b.roomName}{" "}
                      <span className="text-xs text-muted-foreground">({b.venueName})</span>
                    </td>
                    <td className="px-4 py-3">{b.title}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.bookedBy}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${bookingStatusColors[b.status] ?? ""}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {b.status === "TENTATIVE" && (
                          <Form method="post">
                            <input type="hidden" name="_action" value="confirm_booking" />
                            <input type="hidden" name="bookingId" value={b.id} />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              disabled={isSubmitting}
                            >
                              Confirm
                            </Button>
                          </Form>
                        )}
                        {b.status !== "CANCELLED" && (
                          <Form method="post">
                            <input type="hidden" name="_action" value="cancel_booking" />
                            <input type="hidden" name="bookingId" value={b.id} />
                            <input type="hidden" name="reason" value="Cancelled by admin" />
                            <Button
                              type="submit"
                              variant="destructive"
                              size="sm"
                              disabled={isSubmitting}
                            >
                              Cancel
                            </Button>
                          </Form>
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
    </div>
  );
}
