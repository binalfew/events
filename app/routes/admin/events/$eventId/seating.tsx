import { useState } from "react";
import { data, useLoaderData, useActionData, Form, useNavigation } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import {
  createSeatingPlan,
  deleteSeatingPlan,
  listSeatingPlans,
  getSeatingPlan,
  assignSeat,
  unassignSeat,
  autoAssignSeating,
  addConflict,
  resolveConflict,
  validateSeating,
  getSeatingStats,
  SeatingError,
} from "~/services/seating.server";
import {
  createSeatingPlanSchema,
  assignSeatSchema,
  addConflictSchema,
} from "~/lib/schemas/seating";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import type { Route } from "./+types/seating";

export const handle = { breadcrumb: "Seating" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "protocol", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.PROTOCOL_SEATING);
  if (!enabled) {
    throw data({ error: "Protocol seating feature is not enabled" }, { status: 404 });
  }

  const eventId = params.eventId;
  const url = new URL(request.url);
  const selectedPlanId = url.searchParams.get("planId") || undefined;

  const [plans, stats, participants] = await Promise.all([
    listSeatingPlans(eventId, tenantId),
    getSeatingStats(eventId, tenantId),
    import("~/lib/db.server").then(({ prisma }) =>
      prisma.participant.findMany({
        where: { eventId, tenantId, status: "APPROVED" },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { lastName: "asc" },
      }),
    ),
  ]);

  let selectedPlan = null;
  let validation = null;

  if (selectedPlanId) {
    try {
      selectedPlan = await getSeatingPlan(selectedPlanId, tenantId);
      validation = await validateSeating(selectedPlanId, tenantId);
    } catch {
      // Plan not found — ignore
    }
  }

  // Get unresolved conflicts
  const conflicts = await import("~/lib/db.server").then(({ prisma }) =>
    prisma.seatingConflict.findMany({
      where: { eventId, tenantId, isResolved: false },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  );

  return {
    eventId,
    plans: plans.map((p: any) => ({
      id: p.id,
      name: p.name,
      layoutType: p.layoutType,
      totalSeats: p.totalSeats,
      assignedSeats: p.assignedSeats,
      isFinalized: p.isFinalized,
      assignmentCount: p._count.assignments,
    })),
    stats,
    participants,
    selectedPlan: selectedPlan
      ? {
          id: selectedPlan.id,
          name: selectedPlan.name,
          layoutType: selectedPlan.layoutType,
          totalSeats: selectedPlan.totalSeats,
          assignedSeats: selectedPlan.assignedSeats,
          isFinalized: selectedPlan.isFinalized,
          assignments: selectedPlan.assignments.map((a: any) => ({
            id: a.id,
            seatLabel: a.seatLabel,
            tableNumber: a.tableNumber,
            priority: a.priority,
            participantId: a.participantId,
            participantName: `${a.participant.firstName} ${a.participant.lastName}`,
          })),
        }
      : null,
    validation,
    conflicts: conflicts.map((c: any) => ({
      id: c.id,
      participantAId: c.participantAId,
      participantBId: c.participantBId,
      conflictType: c.conflictType,
      description: c.description,
    })),
    filters: { planId: selectedPlanId },
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "protocol", "manage");
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
    if (_action === "create_plan") {
      const raw = Object.fromEntries(formData);
      const parsed = createSeatingPlanSchema.parse({ ...raw, eventId });
      await createSeatingPlan(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "assign_seat") {
      const raw = Object.fromEntries(formData);
      const parsed = assignSeatSchema.parse(raw);
      await assignSeat(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "unassign_seat") {
      const assignmentId = formData.get("assignmentId") as string;
      await unassignSeat(assignmentId, ctx);
      return data({ success: true });
    }

    if (_action === "auto_assign") {
      const planId = formData.get("planId") as string;
      const result = await autoAssignSeating(planId, ctx);
      return data({ success: true, assigned: result.assigned });
    }

    if (_action === "add_conflict") {
      const raw = Object.fromEntries(formData);
      const parsed = addConflictSchema.parse({ ...raw, eventId });
      await addConflict(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "resolve_conflict") {
      const conflictId = formData.get("conflictId") as string;
      await resolveConflict(conflictId, ctx);
      return data({ success: true });
    }

    if (_action === "delete_plan") {
      const planId = formData.get("planId") as string;
      await deleteSeatingPlan(planId, ctx);
      return data({ success: true });
    }

    if (_action === "finalize_plan") {
      const planId = formData.get("planId") as string;
      await import("~/lib/db.server").then(({ prisma }) =>
        prisma.seatingPlan.update({
          where: { id: planId },
          data: { isFinalized: true },
        }),
      );
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof SeatingError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

const priorityColors: Record<string, string> = {
  HEAD_OF_STATE: "bg-purple-100 text-purple-800",
  MINISTER: "bg-blue-100 text-blue-800",
  AMBASSADOR: "bg-indigo-100 text-indigo-800",
  SENIOR_OFFICIAL: "bg-cyan-100 text-cyan-800",
  DELEGATE: "bg-green-100 text-green-800",
  OBSERVER: "bg-gray-100 text-gray-800",
  MEDIA: "bg-yellow-100 text-yellow-800",
};

const layoutLabels: Record<string, string> = {
  table: "Round Table",
  theater: "Theater",
  "u-shape": "U-Shape",
  classroom: "Classroom",
};

export default function SeatingPage() {
  const { eventId, plans, stats, participants, selectedPlan, validation, conflicts, filters } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showAssignSeat, setShowAssignSeat] = useState(false);
  const [showAddConflict, setShowAddConflict] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Protocol & Seating</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage seating plans, assignments, and diplomatic conflicts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddConflict(!showAddConflict)}>
            {showAddConflict ? "Hide" : "Add Conflict"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCreatePlan(!showCreatePlan)}>
            {showCreatePlan ? "Hide" : "New Plan"}
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
          {"assigned" in actionData
            ? `Auto-assigned ${actionData.assigned} seats.`
            : "Operation completed successfully."}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Plans</p>
          <p className="text-2xl font-bold">{stats.plans}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Seats</p>
          <p className="text-2xl font-bold">{stats.totalSeats}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Assigned</p>
          <p className="text-2xl font-bold text-green-600">{stats.totalAssignments}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Fill Rate</p>
          <p className="text-2xl font-bold">{stats.fillRate}%</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Finalized</p>
          <p className="text-2xl font-bold">{stats.finalized}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Conflicts</p>
          <p className="text-2xl font-bold text-red-600">{stats.unresolvedConflicts}</p>
        </div>
      </div>

      {/* Create Plan Form */}
      {showCreatePlan && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Create Seating Plan</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input type="hidden" name="_action" value="create_plan" />
            <div>
              <label className="mb-1 block text-sm font-medium">Plan Name *</label>
              <input
                name="name"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Opening Ceremony"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Layout *</label>
              <NativeSelect name="layoutType" required>
                <NativeSelectOption value="">Select layout</NativeSelectOption>
                <NativeSelectOption value="table">Round Table</NativeSelectOption>
                <NativeSelectOption value="theater">Theater</NativeSelectOption>
                <NativeSelectOption value="u-shape">U-Shape</NativeSelectOption>
                <NativeSelectOption value="classroom">Classroom</NativeSelectOption>
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Total Seats *</label>
              <input
                name="totalSeats"
                type="number"
                min="1"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Plan"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Add Conflict Form */}
      {showAddConflict && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Add Seating Conflict</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input type="hidden" name="_action" value="add_conflict" />
            <div>
              <label className="mb-1 block text-sm font-medium">Participant A *</label>
              <NativeSelect name="participantAId" required>
                <NativeSelectOption value="">Select participant</NativeSelectOption>
                {participants.map((p: any) => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    {p.lastName}, {p.firstName}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Participant B *</label>
              <NativeSelect name="participantBId" required>
                <NativeSelectOption value="">Select participant</NativeSelectOption>
                {participants.map((p: any) => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    {p.lastName}, {p.firstName}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Conflict Type *</label>
              <input
                name="conflictType"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Diplomatic, Personal"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Conflict"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Plans List */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Seating Plans</h3>
        {plans.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No seating plans yet. Create one above.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((p: any) => (
              <div
                key={p.id}
                className={`rounded-lg border bg-card p-4 ${filters.planId === p.id ? "ring-2 ring-primary" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{p.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {layoutLabels[p.layoutType] ?? p.layoutType}
                    </p>
                  </div>
                  {p.isFinalized && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      Finalized
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">{p.assignedSeats}</span> / {p.totalSeats} seats
                  assigned
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{
                      width: `${Math.min(Math.round((p.assignedSeats / p.totalSeats) * 100), 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <Form method="get">
                    <input type="hidden" name="planId" value={p.id} />
                    <Button type="submit" variant="outline" size="sm">
                      {filters.planId === p.id ? "Selected" : "View"}
                    </Button>
                  </Form>
                  {!p.isFinalized && (
                    <>
                      <Form method="post">
                        <input type="hidden" name="_action" value="auto_assign" />
                        <input type="hidden" name="planId" value={p.id} />
                        <Button type="submit" variant="secondary" size="sm" disabled={isSubmitting}>
                          Auto-Assign
                        </Button>
                      </Form>
                      <Form method="post">
                        <input type="hidden" name="_action" value="finalize_plan" />
                        <input type="hidden" name="planId" value={p.id} />
                        <Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
                          Finalize
                        </Button>
                      </Form>
                    </>
                  )}
                  <Form method="post">
                    <input type="hidden" name="_action" value="delete_plan" />
                    <input type="hidden" name="planId" value={p.id} />
                    <Button type="submit" variant="destructive" size="sm" disabled={isSubmitting}>
                      Delete
                    </Button>
                  </Form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Plan Detail */}
      {selectedPlan && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{selectedPlan.name} — Assignments</h3>
            {!selectedPlan.isFinalized && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAssignSeat(!showAssignSeat)}
              >
                {showAssignSeat ? "Hide" : "Assign Seat"}
              </Button>
            )}
          </div>

          {/* Validation Warnings */}
          {validation && !validation.isValid && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <h4 className="text-sm font-semibold text-yellow-800">
                Validation Warnings ({validation.warnings.length})
              </h4>
              <ul className="mt-1 space-y-1 text-sm text-yellow-700">
                {validation.warnings.map((w: any, i: number) => (
                  <li key={i}>
                    <span className="font-medium">[{w.type}]</span> {w.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {validation && validation.isValid && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              All seating assignments pass validation.
            </div>
          )}

          {/* Assign Seat Form */}
          {showAssignSeat && !selectedPlan.isFinalized && (
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-3 font-semibold">Assign Seat</h4>
              <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <input type="hidden" name="_action" value="assign_seat" />
                <input type="hidden" name="seatingPlanId" value={selectedPlan.id} />
                <div>
                  <label className="mb-1 block text-sm font-medium">Participant *</label>
                  <NativeSelect name="participantId" required>
                    <NativeSelectOption value="">Select</NativeSelectOption>
                    {participants.map((p: any) => (
                      <NativeSelectOption key={p.id} value={p.id}>
                        {p.lastName}, {p.firstName}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Seat Label *</label>
                  <input
                    name="seatLabel"
                    required
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. A1, S001"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Table #</label>
                  <input
                    name="tableNumber"
                    type="number"
                    min="1"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Priority *</label>
                  <NativeSelect name="priority" required>
                    <NativeSelectOption value="">Select rank</NativeSelectOption>
                    <NativeSelectOption value="HEAD_OF_STATE">Head of State</NativeSelectOption>
                    <NativeSelectOption value="MINISTER">Minister</NativeSelectOption>
                    <NativeSelectOption value="AMBASSADOR">Ambassador</NativeSelectOption>
                    <NativeSelectOption value="SENIOR_OFFICIAL">Senior Official</NativeSelectOption>
                    <NativeSelectOption value="DELEGATE">Delegate</NativeSelectOption>
                    <NativeSelectOption value="OBSERVER">Observer</NativeSelectOption>
                    <NativeSelectOption value="MEDIA">Media</NativeSelectOption>
                  </NativeSelect>
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              </Form>
            </div>
          )}

          {/* Seating Grid */}
          {selectedPlan.assignments.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No seats assigned yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Seat</th>
                    <th className="px-4 py-3 text-left font-medium">Table</th>
                    <th className="px-4 py-3 text-left font-medium">Participant</th>
                    <th className="px-4 py-3 text-left font-medium">Priority</th>
                    {!selectedPlan.isFinalized && (
                      <th className="px-4 py-3 text-left font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedPlan.assignments.map((a: any) => (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{a.seatLabel}</td>
                      <td className="px-4 py-3">{a.tableNumber ?? "—"}</td>
                      <td className="px-4 py-3">{a.participantName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[a.priority] ?? ""}`}
                        >
                          {a.priority.replace(/_/g, " ")}
                        </span>
                      </td>
                      {!selectedPlan.isFinalized && (
                        <td className="px-4 py-3">
                          <Form method="post">
                            <input type="hidden" name="_action" value="unassign_seat" />
                            <input type="hidden" name="assignmentId" value={a.id} />
                            <Button
                              type="submit"
                              variant="destructive"
                              size="sm"
                              disabled={isSubmitting}
                            >
                              Remove
                            </Button>
                          </Form>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">Unresolved Conflicts ({conflicts.length})</h3>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Participant A</th>
                  <th className="px-4 py-3 text-left font-medium">Participant B</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {conflicts.map((c: any) => {
                  const pA = participants.find((p: any) => p.id === c.participantAId);
                  const pB = participants.find((p: any) => p.id === c.participantBId);
                  return (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          {c.conflictType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {pA ? `${pA.firstName} ${pA.lastName}` : c.participantAId}
                      </td>
                      <td className="px-4 py-3">
                        {pB ? `${pB.firstName} ${pB.lastName}` : c.participantBId}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Form method="post">
                          <input type="hidden" name="_action" value="resolve_conflict" />
                          <input type="hidden" name="conflictId" value={c.id} />
                          <Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
                            Resolve
                          </Button>
                        </Form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
