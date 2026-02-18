import { useState } from "react";
import { data, useLoaderData, Form, useNavigation } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import {
  createMealPlan,
  listMealPlans,
  createMealSession,
  issueMealVoucher,
  redeemMealVoucher,
  getMealDashboard,
  exportCateringSheet,
  CateringError,
} from "~/services/catering.server";
import {
  createMealPlanSchema,
  createMealSessionSchema,
  issueMealVoucherSchema,
} from "~/lib/schemas/catering";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import type { Route } from "./+types/catering";

export const handle = { breadcrumb: "Catering" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "catering", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.CATERING);
  if (!enabled) {
    throw data({ error: "Catering feature is not enabled" }, { status: 404 });
  }

  const eventId = params.eventId;

  const [mealPlans, stats, participants] = await Promise.all([
    listMealPlans(eventId, tenantId),
    getMealDashboard(eventId, tenantId),
    prisma.participant.findMany({
      where: { eventId, tenantId, status: "APPROVED" },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  return {
    eventId,
    mealPlans: mealPlans.map((mp: any) => ({
      id: mp.id,
      name: mp.name,
      date: mp.date.toISOString().split("T")[0],
      notes: mp.notes,
      sessions: mp.sessions.map((s: any) => ({
        id: s.id,
        mealType: s.mealType,
        venue: s.venue,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        capacity: s.capacity,
        menuNotes: s.menuNotes,
        voucherCount: s._count.vouchers,
      })),
    })),
    stats,
    participants,
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "catering", "manage");
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
    if (_action === "create_meal_plan") {
      const raw = Object.fromEntries(formData);
      const parsed = createMealPlanSchema.parse({ ...raw, eventId });
      await createMealPlan(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "create_meal_session") {
      const raw = Object.fromEntries(formData);
      const parsed = createMealSessionSchema.parse(raw);
      await createMealSession(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "issue_voucher") {
      const raw = Object.fromEntries(formData);
      const parsed = issueMealVoucherSchema.parse(raw);
      await issueMealVoucher(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "redeem_voucher") {
      const voucherId = formData.get("voucherId") as string;
      await redeemMealVoucher(voucherId, ctx);
      return data({ success: true });
    }

    if (_action === "export_sheet") {
      const date = (formData.get("date") as string) || undefined;
      const sheet = await exportCateringSheet(eventId, tenantId, date);
      return data({ success: true, sheet });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof CateringError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

const mealTypeLabels: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  RECEPTION: "Reception",
  COFFEE_BREAK: "Coffee Break",
  SNACK: "Snack",
};

const dietaryColors: Record<string, string> = {
  REGULAR: "bg-gray-100 text-gray-800",
  VEGETARIAN: "bg-green-100 text-green-800",
  VEGAN: "bg-emerald-100 text-emerald-800",
  HALAL: "bg-blue-100 text-blue-800",
  KOSHER: "bg-purple-100 text-purple-800",
  GLUTEN_FREE: "bg-yellow-100 text-yellow-800",
  CUSTOM: "bg-orange-100 text-orange-800",
};

export default function CateringPage() {
  const { mealPlans, stats, participants, eventId } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showAddPlan, setShowAddPlan] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [showIssueVoucher, setShowIssueVoucher] = useState(false);

  // Collect all sessions for voucher form
  const allSessions = mealPlans.flatMap((mp: any) =>
    mp.sessions.map((s: any) => ({
      id: s.id,
      label: `${mp.date} — ${mealTypeLabels[s.mealType] ?? s.mealType} @ ${s.venue}`,
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Catering & Meal Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage meal plans, dietary requirements, and vouchers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIssueVoucher(!showIssueVoucher)}
          >
            {showIssueVoucher ? "Hide" : "Issue Voucher"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddPlan(!showAddPlan)}>
            {showAddPlan ? "Hide" : "Add Meal Plan"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Meal Plans</p>
          <p className="text-2xl font-bold">{stats.mealPlans}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Vouchers Issued</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalVouchers}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Redeemed</p>
          <p className="text-2xl font-bold text-green-600">{stats.redeemed}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Redemption Rate</p>
          <p className="text-2xl font-bold">{stats.redemptionRate}%</p>
        </div>
      </div>

      {/* Dietary Breakdown */}
      {Object.keys(stats.dietaryBreakdown).length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold">Dietary Breakdown</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.dietaryBreakdown).map(([category, count]) => (
              <span
                key={category}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${dietaryColors[category] ?? ""}`}
              >
                {category}: {count as number}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add Meal Plan Form */}
      {showAddPlan && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Add Meal Plan</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="_action" value="create_meal_plan" />
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input
                name="name"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Day 1 Meals"
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
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <input
                name="notes"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Meal Plan"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Issue Voucher Form */}
      {showIssueVoucher && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Issue Meal Voucher</h3>
          {allSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No meal sessions available. Create a meal plan and session first.
            </p>
          ) : (
            <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input type="hidden" name="_action" value="issue_voucher" />
              <div>
                <label className="mb-1 block text-sm font-medium">Meal Session *</label>
                <NativeSelect name="mealSessionId" required>
                  <NativeSelectOption value="">Select session</NativeSelectOption>
                  {allSessions.map((s: any) => (
                    <NativeSelectOption key={s.id} value={s.id}>
                      {s.label}
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
                <label className="mb-1 block text-sm font-medium">Dietary Category</label>
                <NativeSelect name="dietaryCategory">
                  <NativeSelectOption value="REGULAR">Regular</NativeSelectOption>
                  <NativeSelectOption value="VEGETARIAN">Vegetarian</NativeSelectOption>
                  <NativeSelectOption value="VEGAN">Vegan</NativeSelectOption>
                  <NativeSelectOption value="HALAL">Halal</NativeSelectOption>
                  <NativeSelectOption value="KOSHER">Kosher</NativeSelectOption>
                  <NativeSelectOption value="GLUTEN_FREE">Gluten Free</NativeSelectOption>
                  <NativeSelectOption value="CUSTOM">Custom</NativeSelectOption>
                </NativeSelect>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Issuing..." : "Issue Voucher"}
                </Button>
              </div>
            </Form>
          )}
        </div>
      )}

      {/* Meal Plans */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Meal Plans ({mealPlans.length})</h3>
        {mealPlans.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No meal plans yet. Click "Add Meal Plan" to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {mealPlans.map((mp: any) => (
              <div key={mp.id} className="rounded-lg border bg-card">
                <div
                  className="flex cursor-pointer items-center justify-between p-4"
                  onClick={() => setExpandedPlan(expandedPlan === mp.id ? null : mp.id)}
                >
                  <div>
                    <span className="font-medium">{mp.name}</span>
                    <span className="ml-3 text-sm text-muted-foreground">{mp.date}</span>
                    {mp.notes && (
                      <span className="ml-2 text-xs text-muted-foreground">— {mp.notes}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {mp.sessions.length} session(s)
                    </span>
                    <span className="text-muted-foreground">
                      {expandedPlan === mp.id ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {expandedPlan === mp.id && (
                  <div className="border-t px-4 pb-4 pt-3">
                    {/* Sessions */}
                    {mp.sessions.length > 0 && (
                      <div className="mb-4 overflow-x-auto rounded border">
                        <table className="w-full text-sm">
                          <thead className="border-b bg-muted/50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">Meal</th>
                              <th className="px-3 py-2 text-left font-medium">Venue</th>
                              <th className="px-3 py-2 text-left font-medium">Time</th>
                              <th className="px-3 py-2 text-left font-medium">Capacity</th>
                              <th className="px-3 py-2 text-left font-medium">Vouchers</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {mp.sessions.map((s: any) => (
                              <tr key={s.id}>
                                <td className="px-3 py-2 font-medium">
                                  {mealTypeLabels[s.mealType] ?? s.mealType}
                                </td>
                                <td className="px-3 py-2">{s.venue}</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                  {new Date(s.startTime).toLocaleTimeString()} –{" "}
                                  {new Date(s.endTime).toLocaleTimeString()}
                                </td>
                                <td className="px-3 py-2">{s.capacity ?? "—"}</td>
                                <td className="px-3 py-2">{s.voucherCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Add Session Form */}
                    <details className="rounded border p-3">
                      <summary className="cursor-pointer text-sm font-medium">
                        Add Meal Session
                      </summary>
                      <Form method="post" className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <input type="hidden" name="_action" value="create_meal_session" />
                        <input type="hidden" name="mealPlanId" value={mp.id} />
                        <div>
                          <label className="mb-1 block text-sm font-medium">Meal Type *</label>
                          <NativeSelect name="mealType" required>
                            <NativeSelectOption value="BREAKFAST">Breakfast</NativeSelectOption>
                            <NativeSelectOption value="LUNCH">Lunch</NativeSelectOption>
                            <NativeSelectOption value="DINNER">Dinner</NativeSelectOption>
                            <NativeSelectOption value="RECEPTION">Reception</NativeSelectOption>
                            <NativeSelectOption value="COFFEE_BREAK">
                              Coffee Break
                            </NativeSelectOption>
                            <NativeSelectOption value="SNACK">Snack</NativeSelectOption>
                          </NativeSelect>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">Venue *</label>
                          <input
                            name="venue"
                            required
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            placeholder="e.g. Grand Ballroom"
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
                          <label className="mb-1 block text-sm font-medium">Start Time *</label>
                          <input
                            name="startTime"
                            type="datetime-local"
                            required
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">End Time *</label>
                          <input
                            name="endTime"
                            type="datetime-local"
                            required
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">Menu Notes</label>
                          <input
                            name="menuNotes"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Button type="submit" size="sm" disabled={isSubmitting}>
                            {isSubmitting ? "Adding..." : "Add Session"}
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
    </div>
  );
}
