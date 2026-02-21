import { useState } from "react";
import { data, useLoaderData, Form, useNavigation } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import {
  createHotel,
  listHotels,
  createRoomBlock,
  assignRoom,
  releaseRoom,
  checkIn,
  checkOut,
  getAccommodationStats,
  getRoomingList,
  autoAssignRooms,
  AccommodationError,
} from "~/services/accommodation.server";
import {
  createHotelSchema,
  createRoomBlockSchema,
  assignRoomSchema,
} from "~/lib/schemas/accommodation";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import type { Route } from "./+types/accommodation";

export const handle = { breadcrumb: "Accommodation" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "accommodation", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.ACCOMMODATION);
  if (!enabled) {
    throw data({ error: "Accommodation feature is not enabled" }, { status: 404 });
  }

  const eventId = params.eventId;
  const url = new URL(request.url);
  const filterHotelId = url.searchParams.get("hotelId") || undefined;
  const filterStatus = url.searchParams.get("status") || undefined;

  const [hotels, stats, assignments, participants] = await Promise.all([
    listHotels(eventId, tenantId),
    getAccommodationStats(eventId, tenantId),
    getRoomingList(eventId, tenantId, filterHotelId),
    // Participants without accommodation for the assign form
    prisma.participant.findMany({
      where: {
        eventId,
        tenantId,
        status: "APPROVED",
        accommodationAssignment: null,
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  // Apply status filter on assignments
  const filteredAssignments = filterStatus
    ? assignments.filter((a: any) => a.status === filterStatus)
    : assignments;

  return {
    eventId,
    hotels: hotels.map((h: any) => ({
      id: h.id,
      name: h.name,
      address: h.address,
      starRating: h.starRating,
      totalRooms: h.totalRooms,
      contactName: h.contactName,
      contactPhone: h.contactPhone,
      distanceToVenue: h.distanceToVenue,
      notes: h.notes,
      roomBlocks: h.roomBlocks.map((rb: any) => ({
        id: rb.id,
        roomType: rb.roomType,
        quantity: rb.quantity,
        pricePerNight: rb.pricePerNight,
        status: rb.status,
        checkInDate: rb.checkInDate.toISOString(),
        checkOutDate: rb.checkOutDate.toISOString(),
        assignedCount: rb._count.assignments,
      })),
    })),
    stats,
    assignments: filteredAssignments.map((a: any) => ({
      id: a.id,
      participantId: a.participantId,
      roomNumber: a.roomNumber,
      status: a.status,
      checkInDate: a.checkInDate.toISOString(),
      checkOutDate: a.checkOutDate.toISOString(),
      specialRequests: a.specialRequests,
      participant: {
        id: a.participant.id,
        firstName: a.participant.firstName,
        lastName: a.participant.lastName,
        email: a.participant.email,
      },
      hotelName: a.roomBlock.hotel.name,
      roomType: a.roomBlock.roomType,
    })),
    participants,
    filters: { hotelId: filterHotelId, status: filterStatus },
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "accommodation", "manage");
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
    if (_action === "create_hotel") {
      const raw = Object.fromEntries(formData);
      const parsed = createHotelSchema.parse({ ...raw, eventId });
      await createHotel(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "create_room_block") {
      const raw = Object.fromEntries(formData);
      const parsed = createRoomBlockSchema.parse(raw);
      await createRoomBlock(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "assign_room") {
      const raw = Object.fromEntries(formData);
      const parsed = assignRoomSchema.parse(raw);
      await assignRoom(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "release_room") {
      const assignmentId = formData.get("assignmentId") as string;
      await releaseRoom(assignmentId, ctx);
      return data({ success: true });
    }

    if (_action === "check_in") {
      const assignmentId = formData.get("assignmentId") as string;
      await checkIn(assignmentId, ctx);
      return data({ success: true });
    }

    if (_action === "check_out") {
      const assignmentId = formData.get("assignmentId") as string;
      await checkOut(assignmentId, ctx);
      return data({ success: true });
    }

    if (_action === "auto_assign") {
      const strategy = (formData.get("strategy") as string) || "by_participant_type";
      await autoAssignRooms(eventId, tenantId, strategy, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof AccommodationError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  CHECKED_IN: "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const roomBlockStatusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  RESERVED: "bg-blue-100 text-blue-800",
  OCCUPIED: "bg-yellow-100 text-yellow-800",
  RELEASED: "bg-gray-100 text-gray-800",
};

export default function AccommodationPage() {
  const { hotels, stats, assignments, participants, filters, eventId } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showAddHotel, setShowAddHotel] = useState(false);
  const [expandedHotel, setExpandedHotel] = useState<string | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Collect all room blocks for the assign form
  const allRoomBlocks = hotels.flatMap((h: any) =>
    h.roomBlocks
      .filter((rb: any) => rb.assignedCount < rb.quantity)
      .map((rb: any) => ({
        id: rb.id,
        label: `${h.name} — ${rb.roomType} (${rb.quantity - rb.assignedCount} avail)`,
      })),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Accommodation Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage hotels, room blocks, and participant assignments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAssignForm(!showAssignForm)}>
            {showAssignForm ? "Hide Assign" : "Assign Room"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddHotel(!showAddHotel)}>
            {showAddHotel ? "Hide Form" : "Add Hotel"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Hotels</p>
          <p className="text-2xl font-bold">{stats.totalHotels}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Rooms</p>
          <p className="text-2xl font-bold">{stats.totalRooms}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Assigned</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalAssigned}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Checked In</p>
          <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.totalAvailable}</p>
        </div>
      </div>

      {/* Add Hotel Form */}
      {showAddHotel && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Add Hotel</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input type="hidden" name="_action" value="create_hotel" />
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input
                name="name"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Hotel name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Address *</label>
              <input
                name="address"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Hotel address"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Star Rating</label>
              <input
                name="starRating"
                type="number"
                min="1"
                max="5"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Total Rooms *</label>
              <input
                name="totalRooms"
                type="number"
                min="1"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Contact Name</label>
              <input
                name="contactName"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Contact Phone</label>
              <input
                name="contactPhone"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Distance to Venue</label>
              <input
                name="distanceToVenue"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. 2.5 km"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <input
                name="notes"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Hotel"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Assign Room Form */}
      {showAssignForm && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Assign Room</h3>
          {allRoomBlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No available room blocks.</p>
          ) : participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unassigned participants.</p>
          ) : (
            <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input type="hidden" name="_action" value="assign_room" />
              <div>
                <label className="mb-1 block text-sm font-medium">Room Block *</label>
                <NativeSelect name="roomBlockId" required>
                  <NativeSelectOption value="">Select room block</NativeSelectOption>
                  {allRoomBlocks.map((rb: any) => (
                    <NativeSelectOption key={rb.id} value={rb.id}>
                      {rb.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Participant *</label>
                <NativeSelect name="participantId" required>
                  <NativeSelectOption value="">Select participant</NativeSelectOption>
                  {participants.map((p: any) => (
                    <NativeSelectOption key={p.id} value={p.id}>
                      {p.lastName}, {p.firstName} {p.email ? `(${p.email})` : ""}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Room Number</label>
                <input
                  name="roomNumber"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. 301"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Special Requests</label>
                <input
                  name="specialRequests"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Assigning..." : "Assign Room"}
                </Button>
              </div>
            </Form>
          )}
        </div>
      )}

      {/* Auto-assign */}
      <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
        <span className="text-sm font-medium">Auto-assign:</span>
        <Form method="post" className="flex items-center gap-2">
          <input type="hidden" name="_action" value="auto_assign" />
          <NativeSelect name="strategy">
            <NativeSelectOption value="by_participant_type">By Participant Type</NativeSelectOption>
            <NativeSelectOption value="first_available">First Available</NativeSelectOption>
          </NativeSelect>
          <Button type="submit" variant="secondary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Assigning..." : "Auto-Assign"}
          </Button>
        </Form>
      </div>

      {/* Hotels Section */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Hotels ({hotels.length})</h3>
        {hotels.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No hotels added yet. Click "Add Hotel" to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {hotels.map((hotel: any) => (
              <div key={hotel.id} className="rounded-lg border bg-card">
                <div
                  className="flex cursor-pointer items-center justify-between p-4"
                  onClick={() => setExpandedHotel(expandedHotel === hotel.id ? null : hotel.id)}
                >
                  <div>
                    <span className="font-medium">{hotel.name}</span>
                    {hotel.starRating && (
                      <span className="ml-2 text-sm text-yellow-500">
                        {"★".repeat(hotel.starRating)}
                      </span>
                    )}
                    <span className="ml-3 text-sm text-muted-foreground">{hotel.address}</span>
                    {hotel.distanceToVenue && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({hotel.distanceToVenue})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {hotel.roomBlocks.length} block(s) | {hotel.totalRooms} rooms
                    </span>
                    <span className="text-muted-foreground">
                      {expandedHotel === hotel.id ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {expandedHotel === hotel.id && (
                  <div className="border-t px-4 pb-4 pt-3">
                    {/* Room Blocks */}
                    {hotel.roomBlocks.length > 0 && (
                      <div className="mb-4">
                        <h4 className="mb-2 text-sm font-medium">Room Blocks</h4>
                        <div className="overflow-x-auto rounded border">
                          <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium">Type</th>
                                <th className="px-3 py-2 text-left font-medium">Qty</th>
                                <th className="px-3 py-2 text-left font-medium">Assigned</th>
                                <th className="px-3 py-2 text-left font-medium">Available</th>
                                <th className="px-3 py-2 text-left font-medium">Price/Night</th>
                                <th className="px-3 py-2 text-left font-medium">Status</th>
                                <th className="px-3 py-2 text-left font-medium">Dates</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {hotel.roomBlocks.map((rb: any) => (
                                <tr key={rb.id}>
                                  <td className="px-3 py-2">{rb.roomType}</td>
                                  <td className="px-3 py-2">{rb.quantity}</td>
                                  <td className="px-3 py-2">{rb.assignedCount}</td>
                                  <td className="px-3 py-2">{rb.quantity - rb.assignedCount}</td>
                                  <td className="px-3 py-2">
                                    {rb.pricePerNight != null ? `$${rb.pricePerNight}` : "—"}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roomBlockStatusColors[rb.status] ?? ""}`}
                                    >
                                      {rb.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-xs text-muted-foreground">
                                    {new Date(rb.checkInDate).toLocaleDateString()} –{" "}
                                    {new Date(rb.checkOutDate).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Add Room Block Form */}
                    <details className="rounded border p-3">
                      <summary className="cursor-pointer text-sm font-medium">
                        Add Room Block
                      </summary>
                      <Form method="post" className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <input type="hidden" name="_action" value="create_room_block" />
                        <input type="hidden" name="hotelId" value={hotel.id} />
                        <div>
                          <label className="mb-1 block text-sm font-medium">Room Type *</label>
                          <input
                            name="roomType"
                            required
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            placeholder="e.g. Standard Double"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">Quantity *</label>
                          <input
                            name="quantity"
                            type="number"
                            min="1"
                            required
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">Price/Night</label>
                          <input
                            name="pricePerNight"
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">Check-in Date *</label>
                          <input
                            name="checkInDate"
                            type="date"
                            required
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">Check-out Date *</label>
                          <input
                            name="checkOutDate"
                            type="date"
                            required
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">Contact Email</label>
                          <input
                            name="contactEmail"
                            type="email"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Button type="submit" size="sm" disabled={isSubmitting}>
                            {isSubmitting ? "Adding..." : "Add Room Block"}
                          </Button>
                        </div>
                      </Form>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Assignments</h3>
        <Form method="get" className="mb-3 flex flex-wrap gap-3">
          <NativeSelect name="hotelId" defaultValue={filters.hotelId ?? ""}>
            <NativeSelectOption value="">All Hotels</NativeSelectOption>
            {hotels.map((h: any) => (
              <NativeSelectOption key={h.id} value={h.id}>
                {h.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect name="status" defaultValue={filters.status ?? ""}>
            <NativeSelectOption value="">All Statuses</NativeSelectOption>
            <NativeSelectOption value="PENDING">Pending</NativeSelectOption>
            <NativeSelectOption value="CONFIRMED">Confirmed</NativeSelectOption>
            <NativeSelectOption value="CHECKED_IN">Checked In</NativeSelectOption>
            <NativeSelectOption value="CHECKED_OUT">Checked Out</NativeSelectOption>
            <NativeSelectOption value="CANCELLED">Cancelled</NativeSelectOption>
          </NativeSelect>
          <Button type="submit" variant="secondary" size="sm">
            Filter
          </Button>
        </Form>
      </div>

      {/* Assignments Table */}
      {assignments.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No accommodation assignments found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Participant</th>
                <th className="px-4 py-3 text-left font-medium">Hotel</th>
                <th className="px-4 py-3 text-left font-medium">Room Type</th>
                <th className="px-4 py-3 text-left font-medium">Room #</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Check-in</th>
                <th className="px-4 py-3 text-left font-medium">Check-out</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.map((a: any) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {a.participant.firstName} {a.participant.lastName}
                    {a.participant.email && (
                      <span className="block text-xs text-muted-foreground">
                        {a.participant.email}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{a.hotelName}</td>
                  <td className="px-4 py-3">{a.roomType}</td>
                  <td className="px-4 py-3">{a.roomNumber || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[a.status] ?? ""}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(a.checkInDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(a.checkOutDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                        <Form method="post">
                          <input type="hidden" name="_action" value="check_in" />
                          <input type="hidden" name="assignmentId" value={a.id} />
                          <Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
                            Check In
                          </Button>
                        </Form>
                      )}
                      {a.status === "CHECKED_IN" && (
                        <Form method="post">
                          <input type="hidden" name="_action" value="check_out" />
                          <input type="hidden" name="assignmentId" value={a.id} />
                          <Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
                            Check Out
                          </Button>
                        </Form>
                      )}
                      {a.status !== "CANCELLED" && a.status !== "CHECKED_OUT" && (
                        <Form method="post">
                          <input type="hidden" name="_action" value="release_room" />
                          <input type="hidden" name="assignmentId" value={a.id} />
                          <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            disabled={isSubmitting}
                          >
                            Release
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
  );
}
