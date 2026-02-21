import { useState } from "react";
import { data, useLoaderData, useActionData, Form, useNavigation } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import {
  requestMeeting,
  confirmMeeting,
  declineMeeting,
  cancelMeeting,
  completeMeeting,
  listMeetings,
  createMeetingSlot,
  getBilateralStats,
  getDailyBriefing,
  BilateralError,
} from "~/services/bilateral.server";
import { requestMeetingSchema, confirmMeetingSchema } from "~/lib/schemas/bilateral";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { DateTimePicker } from "~/components/ui/date-time-picker";
import type { Route } from "./+types/bilaterals";

export const handle = { breadcrumb: "Bilaterals" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "bilateral", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.BILATERAL_SCHEDULER);
  if (!enabled) {
    throw data({ error: "Bilateral scheduler feature is not enabled" }, { status: 404 });
  }

  const eventId = params.eventId;
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") || undefined;
  const dateFilter = url.searchParams.get("date") || undefined;

  const [meetings, stats, participants, rooms, slots] = await Promise.all([
    listMeetings(eventId, tenantId, statusFilter),
    getBilateralStats(eventId, tenantId),
    import("~/lib/db.server").then(({ prisma }) =>
      prisma.participant.findMany({
        where: { eventId, tenantId, status: "APPROVED" },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { lastName: "asc" },
      }),
    ),
    import("~/lib/db.server").then(({ prisma }) =>
      prisma.venueRoom.findMany({
        where: { venueMap: { eventId, tenantId } },
        select: { id: true, name: true, capacity: true },
        orderBy: { name: "asc" },
      }),
    ),
    import("~/lib/db.server").then(({ prisma }) =>
      prisma.meetingSlot.findMany({
        where: { eventId, tenantId },
        orderBy: { startTime: "asc" },
        take: 100,
      }),
    ),
  ]);

  let briefing = null;
  if (dateFilter) {
    try {
      briefing = await getDailyBriefing(eventId, tenantId, dateFilter);
    } catch {
      // ignore
    }
  }

  return {
    eventId,
    meetings: meetings.map((m: any) => ({
      id: m.id,
      status: m.status,
      priority: m.priority,
      duration: m.duration,
      notes: m.notes,
      roomId: m.roomId,
      scheduledAt: m.scheduledAt?.toISOString() ?? null,
      confirmedAt: m.confirmedAt?.toISOString() ?? null,
      completedAt: m.completedAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      requesterId: m.requesterId,
      requesterName: `${m.requester.firstName} ${m.requester.lastName}`,
      requesteeId: m.requesteeId,
      requesteeName: `${m.requestee.firstName} ${m.requestee.lastName}`,
    })),
    stats,
    participants,
    rooms,
    briefing: briefing
      ? {
          ...briefing,
          confirmedMeetings: briefing.confirmedMeetings.map((m: any) => ({
            id: m.id,
            scheduledAt: m.scheduledAt?.toISOString() ?? null,
            duration: m.duration,
            roomId: m.roomId,
            requesterName: `${m.requester.firstName} ${m.requester.lastName}`,
            requesteeName: `${m.requestee.firstName} ${m.requestee.lastName}`,
          })),
        }
      : null,
    slots: slots.map((s: any) => ({
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      roomId: s.roomId,
      isBooked: s.isBooked,
      meetingId: s.meetingId,
    })),
    filters: { status: statusFilter, date: dateFilter },
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "bilateral", "manage");
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
    if (_action === "request_meeting") {
      const raw = Object.fromEntries(formData);
      const parsed = requestMeetingSchema.parse({ ...raw, eventId });
      await requestMeeting(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "confirm_meeting") {
      const raw = Object.fromEntries(formData);
      const parsed = confirmMeetingSchema.parse(raw);
      await confirmMeeting(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "decline_meeting") {
      const meetingId = formData.get("meetingId") as string;
      const reason = (formData.get("reason") as string) || null;
      await declineMeeting(meetingId, reason, ctx);
      return data({ success: true });
    }

    if (_action === "cancel_meeting") {
      const meetingId = formData.get("meetingId") as string;
      const reason = (formData.get("reason") as string) || null;
      await cancelMeeting(meetingId, reason, ctx);
      return data({ success: true });
    }

    if (_action === "complete_meeting") {
      const meetingId = formData.get("meetingId") as string;
      const notes = (formData.get("notes") as string) || null;
      await completeMeeting(meetingId, notes, ctx);
      return data({ success: true });
    }

    if (_action === "create_slot") {
      const startTime = formData.get("startTime") as string;
      const endTime = formData.get("endTime") as string;
      const roomId = (formData.get("roomId") as string) || undefined;
      await createMeetingSlot({ eventId, startTime, endTime, roomId }, ctx);
      return data({ success: true });
    }

    if (_action === "delete_slot") {
      const slotId = formData.get("slotId") as string;
      const { prisma } = await import("~/lib/db.server");
      const slot = await prisma.meetingSlot.findFirst({
        where: { id: slotId, tenantId },
      });
      if (!slot) {
        return data({ error: "Slot not found" }, { status: 404 });
      }
      if (slot.isBooked) {
        return data(
          { error: "Cannot delete a booked slot — cancel the meeting first" },
          { status: 400 },
        );
      }
      await prisma.meetingSlot.delete({ where: { id: slotId } });
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof BilateralError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

const statusColors: Record<string, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  DECLINED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export default function BilateralsPage() {
  const { eventId, meetings, stats, participants, rooms, slots, briefing, filters } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showRequest, setShowRequest] = useState(false);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bilateral Meetings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage bilateral meeting requests, scheduling, and room assignments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSlotForm(!showSlotForm)}>
            {showSlotForm ? "Hide" : "Add Time Slot"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowRequest(!showRequest)}>
            {showRequest ? "Hide" : "Request Meeting"}
          </Button>
        </div>
      </div>

      {/* Action Feedback */}
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Requested</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.requested}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Confirmed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Declined</p>
          <p className="text-2xl font-bold text-red-600">{stats.declined}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Cancelled</p>
          <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Time Slots</p>
          <p className="text-2xl font-bold">{stats.totalSlots}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Slots Free</p>
          <p className="text-2xl font-bold">{stats.availableSlots}</p>
        </div>
      </div>

      {/* Request Meeting Form */}
      {showRequest && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Request Bilateral Meeting</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <input type="hidden" name="_action" value="request_meeting" />
            <div>
              <label className="mb-1 block text-sm font-medium">Requester *</label>
              <NativeSelect name="requesterId" required>
                <NativeSelectOption value="">Select participant</NativeSelectOption>
                {participants.map((p: any) => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    {p.lastName}, {p.firstName}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Requestee *</label>
              <NativeSelect name="requesteeId" required>
                <NativeSelectOption value="">Select participant</NativeSelectOption>
                {participants.map((p: any) => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    {p.lastName}, {p.firstName}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Duration (min)</label>
              <NativeSelect name="duration">
                <NativeSelectOption value="15">15 min</NativeSelectOption>
                <NativeSelectOption value="30">30 min</NativeSelectOption>
                <NativeSelectOption value="45">45 min</NativeSelectOption>
                <NativeSelectOption value="60">60 min</NativeSelectOption>
                <NativeSelectOption value="90">90 min</NativeSelectOption>
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Priority</label>
              <NativeSelect name="priority">
                <NativeSelectOption value="0">Normal</NativeSelectOption>
                <NativeSelectOption value="1">High</NativeSelectOption>
                <NativeSelectOption value="2">Urgent</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Requesting..." : "Request"}
              </Button>
            </div>
            <div className="md:col-span-5">
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <input
                name="notes"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Agenda or special requirements"
              />
            </div>
          </Form>
        </div>
      )}

      {/* Create Time Slot Form */}
      {showSlotForm && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Add Meeting Time Slot</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input type="hidden" name="_action" value="create_slot" />
            <div>
              <label className="mb-1 block text-sm font-medium">Start Time *</label>
              <DateTimePicker name="startTime" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End Time *</label>
              <DateTimePicker name="endTime" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Room</label>
              <NativeSelect name="roomId">
                <NativeSelectOption value="">No specific room</NativeSelectOption>
                {rooms.map((r: any) => (
                  <NativeSelectOption key={r.id} value={r.id}>
                    {r.name} (Cap: {r.capacity})
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Add Slot"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Time Slots List */}
      {slots.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">Time Slots ({slots.length})</h3>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Start</th>
                  <th className="px-4 py-3 text-left font-medium">End</th>
                  <th className="px-4 py-3 text-left font-medium">Room</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {slots.map((s: any) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">
                      {new Date(s.startTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {new Date(s.endTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {s.roomId ? (rooms.find((r: any) => r.id === s.roomId)?.name ?? "—") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {s.isBooked ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          Booked
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Available
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!s.isBooked && (
                        <Form method="post">
                          <input type="hidden" name="_action" value="delete_slot" />
                          <input type="hidden" name="slotId" value={s.id} />
                          <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            disabled={isSubmitting}
                          >
                            Delete
                          </Button>
                        </Form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <Form method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <NativeSelect name="status" defaultValue={filters.status ?? ""}>
              <NativeSelectOption value="">All</NativeSelectOption>
              <NativeSelectOption value="REQUESTED">Requested</NativeSelectOption>
              <NativeSelectOption value="CONFIRMED">Confirmed</NativeSelectOption>
              <NativeSelectOption value="DECLINED">Declined</NativeSelectOption>
              <NativeSelectOption value="CANCELLED">Cancelled</NativeSelectOption>
              <NativeSelectOption value="COMPLETED">Completed</NativeSelectOption>
            </NativeSelect>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Briefing Date</label>
            <input
              name="date"
              type="date"
              defaultValue={filters.date ?? ""}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Filter
          </Button>
        </Form>
      </div>

      {/* Daily Briefing */}
      {briefing && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">
            Daily Briefing — {new Date(briefing.date).toLocaleDateString()}
          </h3>
          <div className="mb-3 flex gap-4 text-sm">
            <span>
              <strong>{briefing.totalScheduled}</strong> confirmed meetings
            </span>
            <span>
              <strong>{briefing.pendingRequests}</strong> pending requests
            </span>
            <span>
              <strong>{briefing.availableSlots}</strong> free slots
            </span>
          </div>
          {briefing.confirmedMeetings.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Time</th>
                    <th className="px-4 py-2 text-left font-medium">Duration</th>
                    <th className="px-4 py-2 text-left font-medium">Party A</th>
                    <th className="px-4 py-2 text-left font-medium">Party B</th>
                    <th className="px-4 py-2 text-left font-medium">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {briefing.confirmedMeetings.map((m: any) => (
                    <tr key={m.id}>
                      <td className="px-4 py-2 font-mono text-xs">
                        {m.scheduledAt ? new Date(m.scheduledAt).toLocaleTimeString() : "—"}
                      </td>
                      <td className="px-4 py-2">{m.duration} min</td>
                      <td className="px-4 py-2">{m.requesterName}</td>
                      <td className="px-4 py-2">{m.requesteeName}</td>
                      <td className="px-4 py-2">
                        {m.roomId
                          ? (rooms.find((r: any) => r.id === m.roomId)?.name ?? m.roomId)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Meetings List */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Meetings ({meetings.length})</h3>
        {meetings.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No bilateral meetings yet. Use "Request Meeting" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Requester</th>
                  <th className="px-4 py-3 text-left font-medium">Requestee</th>
                  <th className="px-4 py-3 text-left font-medium">Duration</th>
                  <th className="px-4 py-3 text-left font-medium">Scheduled</th>
                  <th className="px-4 py-3 text-left font-medium">Room</th>
                  <th className="px-4 py-3 text-left font-medium">Priority</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {meetings.map((m: any) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[m.status] ?? ""}`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{m.requesterName}</td>
                    <td className="px-4 py-3">{m.requesteeName}</td>
                    <td className="px-4 py-3">{m.duration} min</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {m.roomId ? (rooms.find((r: any) => r.id === m.roomId)?.name ?? "—") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {m.priority > 0 && (
                        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                          {m.priority === 2 ? "Urgent" : "High"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {m.status === "REQUESTED" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmingId(confirmingId === m.id ? null : m.id)}
                            >
                              Confirm
                            </Button>
                            <Form method="post">
                              <input type="hidden" name="_action" value="decline_meeting" />
                              <input type="hidden" name="meetingId" value={m.id} />
                              <Button
                                type="submit"
                                variant="destructive"
                                size="sm"
                                disabled={isSubmitting}
                              >
                                Decline
                              </Button>
                            </Form>
                          </>
                        )}
                        {m.status === "CONFIRMED" && (
                          <>
                            <Form method="post">
                              <input type="hidden" name="_action" value="complete_meeting" />
                              <input type="hidden" name="meetingId" value={m.id} />
                              <Button
                                type="submit"
                                variant="secondary"
                                size="sm"
                                disabled={isSubmitting}
                              >
                                Complete
                              </Button>
                            </Form>
                            <Form method="post">
                              <input type="hidden" name="_action" value="cancel_meeting" />
                              <input type="hidden" name="meetingId" value={m.id} />
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
                        {(m.status === "REQUESTED" || m.status === "CONFIRMED") && (
                          <Form method="post">
                            <input type="hidden" name="_action" value="cancel_meeting" />
                            <input type="hidden" name="meetingId" value={m.id} />
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

      {/* Confirm Meeting Inline Form */}
      {confirmingId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-3 font-semibold text-blue-900">
            Confirm Meeting —{" "}
            {(() => {
              const m = meetings.find((m: any) => m.id === confirmingId);
              return m ? `${m.requesterName} & ${m.requesteeName}` : "";
            })()}
          </h4>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input type="hidden" name="_action" value="confirm_meeting" />
            <input type="hidden" name="meetingId" value={confirmingId} />
            <div>
              <label className="mb-1 block text-sm font-medium">Scheduled Time *</label>
              <DateTimePicker name="scheduledAt" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Room</label>
              <NativeSelect name="roomId">
                <NativeSelectOption value="">No specific room</NativeSelectOption>
                {rooms.map((r: any) => (
                  <NativeSelectOption key={r.id} value={r.id}>
                    {r.name} (Cap: {r.capacity})
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Confirming..." : "Confirm"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmingId(null)}>
                Cancel
              </Button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
}
