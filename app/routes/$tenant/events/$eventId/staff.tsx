import { useState } from "react";
import { data, useLoaderData, useActionData, Form, useNavigation } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import {
  registerStaff,
  listStaff,
  deactivateStaff,
  createShift,
  listShifts,
  assignToShift,
  unassignFromShift,
  checkInStaff,
  checkOutStaff,
  autoAssignShifts,
  getStaffDashboard,
  StaffError,
} from "~/services/staff.server";
import { registerStaffSchema, createShiftSchema } from "~/lib/schemas/staff";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { DateTimePicker } from "~/components/ui/date-time-picker";
import type { Route } from "./+types/staff";

export const handle = { breadcrumb: "Staff" };

const ROLES = [
  "COORDINATOR",
  "USHER",
  "SECURITY",
  "PROTOCOL",
  "TECHNICAL",
  "MEDICAL",
  "TRANSPORT",
  "CATERING",
] as const;

const roleLabels: Record<string, string> = {
  COORDINATOR: "Coordinator",
  USHER: "Usher",
  SECURITY: "Security",
  PROTOCOL: "Protocol",
  TECHNICAL: "Technical",
  MEDICAL: "Medical",
  TRANSPORT: "Transport",
  CATERING: "Catering",
};

const roleColors: Record<string, string> = {
  COORDINATOR: "bg-purple-100 text-purple-800",
  USHER: "bg-blue-100 text-blue-800",
  SECURITY: "bg-red-100 text-red-800",
  PROTOCOL: "bg-indigo-100 text-indigo-800",
  TECHNICAL: "bg-cyan-100 text-cyan-800",
  MEDICAL: "bg-green-100 text-green-800",
  TRANSPORT: "bg-orange-100 text-orange-800",
  CATERING: "bg-yellow-100 text-yellow-800",
};

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-yellow-100 text-yellow-800",
  CHECKED_IN: "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-gray-100 text-gray-800",
  NO_SHOW: "bg-red-100 text-red-800",
};

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "staff", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.STAFF_MANAGEMENT);
  if (!enabled) {
    throw data({ error: "Staff management is not enabled" }, { status: 404 });
  }

  const eventId = params.eventId;
  const url = new URL(request.url);
  const roleFilter = url.searchParams.get("role") || undefined;

  const [staffList, shifts, dashboard, users] = await Promise.all([
    listStaff(eventId, tenantId, { role: roleFilter }),
    listShifts(eventId, tenantId),
    getStaffDashboard(eventId, tenantId),
    import("~/lib/db.server").then(({ prisma }) =>
      prisma.user.findMany({
        where: { tenantId },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
    ),
  ]);

  return {
    eventId,
    staff: staffList.map((s: any) => ({
      id: s.id,
      userId: s.userId,
      userName: s.user?.name ?? "Unknown",
      userEmail: s.user?.email ?? "",
      role: s.role,
      zone: s.zone,
      phone: s.phone,
      isActive: s.isActive,
      assignmentCount: s.assignments.length,
      recentAssignments: s.assignments.map((a: any) => ({
        shiftName: a.shift.name,
        status: a.status,
      })),
    })),
    shifts: shifts.map((sh: any) => ({
      id: sh.id,
      name: sh.name,
      date: sh.date.toISOString(),
      startTime: sh.startTime.toISOString(),
      endTime: sh.endTime.toISOString(),
      zone: sh.zone,
      requiredRole: sh.requiredRole,
      capacity: sh.capacity,
      assignedCount: sh.assignments.length,
      assignments: sh.assignments.map((a: any) => ({
        id: a.id,
        staffId: a.staffMemberId,
        staffName: a.staffMember?.user?.name ?? "Unknown",
        status: a.status,
      })),
    })),
    dashboard,
    users,
    filters: { role: roleFilter },
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "staff", "manage");
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
    if (_action === "register_staff") {
      const raw = Object.fromEntries(formData);
      const parsed = registerStaffSchema.parse({ ...raw, eventId });
      await registerStaff(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "deactivate_staff") {
      const staffId = formData.get("staffId") as string;
      await deactivateStaff(staffId, ctx);
      return data({ success: true });
    }

    if (_action === "create_shift") {
      const raw = Object.fromEntries(formData);
      const parsed = createShiftSchema.parse({ ...raw, eventId });
      await createShift(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "assign_to_shift") {
      const staffId = formData.get("staffId") as string;
      const shiftId = formData.get("shiftId") as string;
      await assignToShift(staffId, shiftId, ctx);
      return data({ success: true });
    }

    if (_action === "unassign") {
      const staffId = formData.get("staffId") as string;
      const shiftId = formData.get("shiftId") as string;
      await unassignFromShift(staffId, shiftId, ctx);
      return data({ success: true });
    }

    if (_action === "check_in") {
      const staffId = formData.get("staffId") as string;
      const shiftId = formData.get("shiftId") as string;
      await checkInStaff(staffId, shiftId, ctx);
      return data({ success: true });
    }

    if (_action === "check_out") {
      const staffId = formData.get("staffId") as string;
      const shiftId = formData.get("shiftId") as string;
      await checkOutStaff(staffId, shiftId, ctx);
      return data({ success: true });
    }

    if (_action === "auto_assign") {
      await autoAssignShifts(eventId, tenantId, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof StaffError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

export default function StaffPage() {
  const { eventId, staff, shifts, dashboard, users, filters } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showRegister, setShowRegister] = useState(false);
  const [showShift, setShowShift] = useState(false);
  const [assignShiftId, setAssignShiftId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Staff & Volunteer Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage staff roster, shifts, and deployment.
          </p>
        </div>
        <div className="flex gap-2">
          <Form method="post">
            <input type="hidden" name="_action" value="auto_assign" />
            <Button type="submit" variant="secondary" size="sm" disabled={isSubmitting}>
              Auto-Assign
            </Button>
          </Form>
          <Button variant="outline" size="sm" onClick={() => setShowShift(!showShift)}>
            {showShift ? "Hide" : "New Shift"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowRegister(!showRegister)}>
            {showRegister ? "Hide" : "Register Staff"}
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

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Staff</p>
          <p className="text-2xl font-bold">{dashboard.totalStaff}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">{dashboard.activeStaff}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Scheduled</p>
          <p className="text-2xl font-bold">{dashboard.scheduled}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Checked In</p>
          <p className="text-2xl font-bold text-green-600">{dashboard.checkedIn}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Checked Out</p>
          <p className="text-2xl font-bold">{dashboard.checkedOut}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">No-Shows</p>
          <p className="text-2xl font-bold text-red-600">{dashboard.noShows}</p>
        </div>
        {Object.entries(dashboard.byRole)
          .slice(0, 2)
          .map(([role, count]) => (
            <div key={role} className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">{roleLabels[role] ?? role}</p>
              <p className="text-2xl font-bold">{count as number}</p>
            </div>
          ))}
      </div>

      {/* Register Staff Form */}
      {showRegister && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Register Staff Member</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input type="hidden" name="_action" value="register_staff" />
            <div>
              <label className="mb-1 block text-sm font-medium">User *</label>
              <NativeSelect name="userId" required>
                <NativeSelectOption value="">Select user</NativeSelectOption>
                {users.map((u: any) => (
                  <NativeSelectOption key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Role *</label>
              <NativeSelect name="role" required>
                <NativeSelectOption value="">Select role</NativeSelectOption>
                {ROLES.map((r) => (
                  <NativeSelectOption key={r} value={r}>
                    {roleLabels[r]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Zone</label>
              <input
                name="zone"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Main Gate, Hall A"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                name="phone"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Create Shift Form */}
      {showShift && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Create Shift</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input type="hidden" name="_action" value="create_shift" />
            <div>
              <label className="mb-1 block text-sm font-medium">Shift Name *</label>
              <input
                name="name"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Morning Security"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date *</label>
              <input
                name="date"
                type="date"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Start Time *</label>
              <DateTimePicker name="startTime" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End Time *</label>
              <DateTimePicker name="endTime" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Zone</label>
              <input
                name="zone"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Main Gate"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Required Role</label>
              <NativeSelect name="requiredRole">
                <NativeSelectOption value="">Any Role</NativeSelectOption>
                {ROLES.map((r) => (
                  <NativeSelectOption key={r} value={r}>
                    {roleLabels[r]}
                  </NativeSelectOption>
                ))}
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
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Shift"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Filter */}
      <Form method="get" className="flex items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Filter by Role</label>
          <NativeSelect name="role" defaultValue={filters.role ?? ""}>
            <NativeSelectOption value="">All Roles</NativeSelectOption>
            {ROLES.map((r) => (
              <NativeSelectOption key={r} value={r}>
                {roleLabels[r]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
      </Form>

      {/* Staff Roster */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Staff Roster ({staff.length})</h3>
        {staff.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No staff registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Zone</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Shifts</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staff.map((s: any) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.userName}</div>
                      <div className="text-xs text-muted-foreground">{s.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[s.role] ?? ""}`}
                      >
                        {roleLabels[s.role] ?? s.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{s.zone ?? "—"}</td>
                    <td className="px-4 py-3">{s.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{s.assignmentCount}</td>
                    <td className="px-4 py-3">
                      {s.isActive && (
                        <Form method="post">
                          <input type="hidden" name="_action" value="deactivate_staff" />
                          <input type="hidden" name="staffId" value={s.id} />
                          <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            disabled={isSubmitting}
                          >
                            Deactivate
                          </Button>
                        </Form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shifts */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Shifts ({shifts.length})</h3>
        {shifts.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No shifts created yet.
          </div>
        ) : (
          <div className="space-y-3">
            {shifts.map((sh: any) => (
              <div key={sh.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{sh.name}</h4>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {new Date(sh.date).toLocaleDateString()} ·{" "}
                      {new Date(sh.startTime).toLocaleTimeString()} —{" "}
                      {new Date(sh.endTime).toLocaleTimeString()}
                    </div>
                    <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                      {sh.zone && <span>Zone: {sh.zone}</span>}
                      {sh.requiredRole && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${roleColors[sh.requiredRole] ?? ""}`}
                        >
                          {roleLabels[sh.requiredRole]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">
                      {sh.assignedCount} / {sh.capacity}
                    </span>
                    <p className="text-xs text-muted-foreground">assigned</p>
                  </div>
                </div>

                {/* Fill rate bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{
                      width: `${Math.min(Math.round((sh.assignedCount / sh.capacity) * 100), 100)}%`,
                    }}
                  />
                </div>

                {/* Assignments */}
                {sh.assignments.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {sh.assignments.map((a: any) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded bg-muted/30 px-3 py-1.5 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span>{a.staffName}</span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[a.status] ?? ""}`}
                          >
                            {a.status}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {a.status === "SCHEDULED" && (
                            <Form method="post">
                              <input type="hidden" name="_action" value="check_in" />
                              <input type="hidden" name="staffId" value={a.staffId} />
                              <input type="hidden" name="shiftId" value={sh.id} />
                              <Button type="submit" size="sm" disabled={isSubmitting}>
                                Check In
                              </Button>
                            </Form>
                          )}
                          {a.status === "CHECKED_IN" && (
                            <Form method="post">
                              <input type="hidden" name="_action" value="check_out" />
                              <input type="hidden" name="staffId" value={a.staffId} />
                              <input type="hidden" name="shiftId" value={sh.id} />
                              <Button type="submit" size="sm" disabled={isSubmitting}>
                                Check Out
                              </Button>
                            </Form>
                          )}
                          <Form method="post">
                            <input type="hidden" name="_action" value="unassign" />
                            <input type="hidden" name="staffId" value={a.staffId} />
                            <input type="hidden" name="shiftId" value={sh.id} />
                            <Button type="submit" variant="ghost" size="sm" disabled={isSubmitting}>
                              Remove
                            </Button>
                          </Form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assign to shift */}
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssignShiftId(assignShiftId === sh.id ? null : sh.id)}
                  >
                    {assignShiftId === sh.id ? "Hide" : "Assign Staff"}
                  </Button>
                </div>
                {assignShiftId === sh.id && (
                  <div className="mt-3 rounded border bg-muted/20 p-3">
                    <Form method="post" className="flex items-end gap-2">
                      <input type="hidden" name="_action" value="assign_to_shift" />
                      <input type="hidden" name="shiftId" value={sh.id} />
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium">Staff Member</label>
                        <NativeSelect name="staffId" required>
                          <NativeSelectOption value="">Select staff</NativeSelectOption>
                          {staff
                            .filter((s: any) => s.isActive)
                            .map((s: any) => (
                              <NativeSelectOption key={s.id} value={s.id}>
                                {s.userName} ({roleLabels[s.role]})
                              </NativeSelectOption>
                            ))}
                        </NativeSelect>
                      </div>
                      <Button type="submit" size="sm" disabled={isSubmitting}>
                        Assign
                      </Button>
                    </Form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
