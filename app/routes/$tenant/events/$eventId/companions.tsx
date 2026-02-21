import { useState } from "react";
import { data, useLoaderData, useActionData, Form, useNavigation } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import {
  registerCompanion,
  listCompanions,
  removeCompanion,
  createActivity,
  listActivities,
  signUpForActivity,
  cancelActivitySignUp,
  getCompanionStats,
  CompanionError,
} from "~/services/companion.server";
import { registerCompanionSchema, createActivitySchema } from "~/lib/schemas/companion";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { DateTimePicker } from "~/components/ui/date-time-picker";
import type { Route } from "./+types/companions";

export const handle = { breadcrumb: "Companions" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "protocol", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const url = new URL(request.url);
  const typeFilter = url.searchParams.get("type") || undefined;

  const [companions, activities, stats, participants] = await Promise.all([
    listCompanions(eventId, tenantId, typeFilter),
    listActivities(eventId, tenantId),
    getCompanionStats(eventId, tenantId),
    import("~/lib/db.server").then(({ prisma }) =>
      prisma.participant.findMany({
        where: { eventId, tenantId, status: "APPROVED" },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { lastName: "asc" },
      }),
    ),
  ]);

  return {
    eventId,
    companions: companions.map((c: any) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      type: c.type,
      email: c.email,
      phone: c.phone,
      registrationCode: c.registrationCode,
      nationality: c.nationality,
      primaryParticipantId: c.primaryParticipantId,
      primaryParticipantName: `${c.primaryParticipant.firstName} ${c.primaryParticipant.lastName}`,
      activityCount: c.activities.length,
    })),
    activities: activities.map((a: any) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      date: a.date.toISOString(),
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
      location: a.location,
      capacity: a.capacity,
      currentSignups: a.currentSignups,
      transportIncluded: a.transportIncluded,
      cost: a.cost,
    })),
    stats,
    participants,
    filters: { type: typeFilter },
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
    if (_action === "register_companion") {
      const raw = Object.fromEntries(formData);
      const parsed = registerCompanionSchema.parse({ ...raw, eventId });
      await registerCompanion(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "remove_companion") {
      const companionId = formData.get("companionId") as string;
      await removeCompanion(companionId, ctx);
      return data({ success: true });
    }

    if (_action === "create_activity") {
      const raw = Object.fromEntries(formData);
      const parsed = createActivitySchema.parse({ ...raw, eventId });
      await createActivity(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "sign_up") {
      const companionId = formData.get("companionId") as string;
      const activityId = formData.get("activityId") as string;
      await signUpForActivity(companionId, activityId, ctx);
      return data({ success: true });
    }

    if (_action === "cancel_signup") {
      const companionId = formData.get("companionId") as string;
      const activityId = formData.get("activityId") as string;
      await cancelActivitySignUp(companionId, activityId, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof CompanionError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  SPOUSE: "Spouse",
  FAMILY: "Family",
  AIDE: "Aide",
  SECURITY: "Security",
  INTERPRETER: "Interpreter",
};

const typeColors: Record<string, string> = {
  SPOUSE: "bg-pink-100 text-pink-800",
  FAMILY: "bg-purple-100 text-purple-800",
  AIDE: "bg-blue-100 text-blue-800",
  SECURITY: "bg-red-100 text-red-800",
  INTERPRETER: "bg-cyan-100 text-cyan-800",
};

export default function CompanionsPage() {
  const { eventId, companions, activities, stats, participants, filters } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showRegister, setShowRegister] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [signUpFor, setSignUpFor] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Companion & Spouse Program</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Register companions and manage activity programs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowActivity(!showActivity)}>
            {showActivity ? "Hide" : "New Activity"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowRegister(!showRegister)}>
            {showRegister ? "Hide" : "Register Companion"}
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Companions</p>
          <p className="text-2xl font-bold">{stats.totalCompanions}</p>
        </div>
        {Object.entries(stats.byType).map(([type, count]) => (
          <div key={type} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{typeLabels[type] ?? type}</p>
            <p className="text-2xl font-bold">{count as number}</p>
          </div>
        ))}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Activities</p>
          <p className="text-2xl font-bold">{stats.totalActivities}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Sign-ups</p>
          <p className="text-2xl font-bold">
            {stats.totalSignups}/{stats.totalCapacity}
          </p>
        </div>
      </div>

      {/* Register Companion Form */}
      {showRegister && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Register Companion</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="_action" value="register_companion" />
            <div>
              <label className="mb-1 block text-sm font-medium">Primary Participant *</label>
              <NativeSelect name="primaryParticipantId" required>
                <NativeSelectOption value="">Select participant</NativeSelectOption>
                {participants.map((p: any) => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    {p.lastName}, {p.firstName}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">First Name *</label>
              <input
                name="firstName"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Last Name *</label>
              <input
                name="lastName"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type *</label>
              <NativeSelect name="type" required>
                <NativeSelectOption value="">Select type</NativeSelectOption>
                <NativeSelectOption value="SPOUSE">Spouse</NativeSelectOption>
                <NativeSelectOption value="FAMILY">Family</NativeSelectOption>
                <NativeSelectOption value="AIDE">Aide</NativeSelectOption>
                <NativeSelectOption value="SECURITY">Security</NativeSelectOption>
                <NativeSelectOption value="INTERPRETER">Interpreter</NativeSelectOption>
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                name="email"
                type="email"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                name="phone"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nationality</label>
              <input
                name="nationality"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Passport #</label>
              <input
                name="passportNumber"
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

      {/* Create Activity Form */}
      {showActivity && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Create Activity</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="_action" value="create_activity" />
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input
                name="name"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. City Tour, Museum Visit"
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
              <label className="mb-1 block text-sm font-medium">Location *</label>
              <input
                name="location"
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
              <label className="mb-1 block text-sm font-medium">Cost</label>
              <input
                name="cost"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 text-sm">
                <input name="transportIncluded" type="checkbox" defaultChecked />
                Transport included
              </label>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Activity"}
              </Button>
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <input
                name="description"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Optional description"
              />
            </div>
          </Form>
        </div>
      )}

      {/* Filter */}
      <Form method="get" className="flex items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Filter by Type</label>
          <NativeSelect name="type" defaultValue={filters.type ?? ""}>
            <NativeSelectOption value="">All Types</NativeSelectOption>
            <NativeSelectOption value="SPOUSE">Spouse</NativeSelectOption>
            <NativeSelectOption value="FAMILY">Family</NativeSelectOption>
            <NativeSelectOption value="AIDE">Aide</NativeSelectOption>
            <NativeSelectOption value="SECURITY">Security</NativeSelectOption>
            <NativeSelectOption value="INTERPRETER">Interpreter</NativeSelectOption>
          </NativeSelect>
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
      </Form>

      {/* Companions Table */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Companions ({companions.length})</h3>
        {companions.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No companions registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Primary Participant</th>
                  <th className="px-4 py-3 text-left font-medium">Reg. Code</th>
                  <th className="px-4 py-3 text-left font-medium">Contact</th>
                  <th className="px-4 py-3 text-left font-medium">Activities</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {companions.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[c.type] ?? ""}`}
                      >
                        {typeLabels[c.type] ?? c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{c.primaryParticipantName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.registrationCode}</td>
                    <td className="px-4 py-3 text-xs">
                      {c.email && <div>{c.email}</div>}
                      {c.phone && <div>{c.phone}</div>}
                    </td>
                    <td className="px-4 py-3">{c.activityCount}</td>
                    <td className="px-4 py-3">
                      <Form method="post">
                        <input type="hidden" name="_action" value="remove_companion" />
                        <input type="hidden" name="companionId" value={c.id} />
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activities */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Activities ({activities.length})</h3>
        {activities.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No activities yet. Create one above.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activities.map((a: any) => (
              <div key={a.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold">{a.name}</h4>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.date).toLocaleDateString()}
                  </span>
                </div>
                {a.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                )}
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div>
                    {new Date(a.startTime).toLocaleTimeString()} —{" "}
                    {new Date(a.endTime).toLocaleTimeString()}
                  </div>
                  <div>{a.location}</div>
                  {a.transportIncluded && <div>Transport included</div>}
                  {a.cost > 0 && <div>Cost: ${a.cost}</div>}
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">{a.currentSignups}</span> / {a.capacity} signed up
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{
                      width: `${Math.min(Math.round((a.currentSignups / a.capacity) * 100), 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSignUpFor(signUpFor === a.id ? null : a.id)}
                  >
                    {signUpFor === a.id ? "Hide" : "Sign Up Companion"}
                  </Button>
                </div>
                {signUpFor === a.id && (
                  <div className="mt-3 rounded border bg-muted/20 p-3">
                    <Form method="post" className="flex items-end gap-2">
                      <input type="hidden" name="_action" value="sign_up" />
                      <input type="hidden" name="activityId" value={a.id} />
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium">Companion</label>
                        <NativeSelect name="companionId" required>
                          <NativeSelectOption value="">Select</NativeSelectOption>
                          {companions.map((c: any) => (
                            <NativeSelectOption key={c.id} value={c.id}>
                              {c.firstName} {c.lastName} ({typeLabels[c.type]})
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </div>
                      <Button type="submit" size="sm" disabled={isSubmitting}>
                        Sign Up
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
