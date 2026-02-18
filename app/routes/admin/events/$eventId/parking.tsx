import { useState } from "react";
import { data, useLoaderData, useActionData, Form, useNavigation } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import {
  createParkingZone,
  listParkingZones,
  issuePermit,
  revokePermit,
  getParkingStats,
  ParkingError,
} from "~/services/parking.server";
import { createParkingZoneSchema, issuePermitSchema } from "~/lib/schemas/parking";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { DateTimePicker } from "~/components/ui/date-time-picker";
import type { Route } from "./+types/parking";

export const handle = { breadcrumb: "Parking" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "parking", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const url = new URL(request.url);
  const filterZoneId = url.searchParams.get("zoneId") || undefined;
  const filterStatus = url.searchParams.get("status") || undefined;

  const [zones, stats, participants] = await Promise.all([
    listParkingZones(eventId, tenantId),
    getParkingStats(eventId, tenantId),
    prisma.participant.findMany({
      where: { eventId, tenantId, status: "APPROVED" },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  // Fetch permits
  const permitWhere: Record<string, unknown> = { eventId, tenantId };
  if (filterZoneId) permitWhere.zoneId = filterZoneId;
  if (filterStatus) permitWhere.status = filterStatus;

  const permits = await prisma.parkingPermit.findMany({
    where: permitWhere,
    include: { zone: true, participant: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    eventId,
    zones: zones.map((z: any) => ({
      id: z.id,
      name: z.name,
      code: z.code,
      capacity: z.capacity,
      color: z.color,
      permitCount: z._count.permits,
    })),
    stats,
    permits: permits.map((p: any) => ({
      id: p.id,
      permitNumber: p.permitNumber,
      vehiclePlate: p.vehiclePlate,
      status: p.status,
      validFrom: p.validFrom.toISOString(),
      validUntil: p.validUntil.toISOString(),
      zoneName: p.zone.name,
      zoneCode: p.zone.code,
      participantName: p.participant
        ? `${p.participant.firstName} ${p.participant.lastName}`
        : null,
    })),
    participants,
    filters: { zoneId: filterZoneId, status: filterStatus },
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "parking", "manage");
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
    if (_action === "create_zone") {
      const raw = Object.fromEntries(formData);
      const parsed = createParkingZoneSchema.parse({ ...raw, eventId });
      await createParkingZone(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "issue_permit") {
      const raw = Object.fromEntries(formData);
      const parsed = issuePermitSchema.parse({ ...raw, eventId });
      await issuePermit(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "revoke_permit") {
      const permitId = formData.get("permitId") as string;
      const reason = (formData.get("reason") as string) || "Revoked by admin";
      await revokePermit(permitId, reason, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof ParkingError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-gray-100 text-gray-800",
  REVOKED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-yellow-100 text-yellow-800",
};

export default function ParkingPage() {
  const { zones, stats, permits, participants, filters, eventId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showAddZone, setShowAddZone] = useState(false);
  const [showIssuePermit, setShowIssuePermit] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Parking & Zone Access</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage parking zones, permits, and gate access.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowIssuePermit(!showIssuePermit)}>
            {showIssuePermit ? "Hide" : "Issue Permit"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddZone(!showAddZone)}>
            {showAddZone ? "Hide" : "Add Zone"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Permits</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Issued</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Revoked</p>
          <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Capacity</p>
          <p className="text-2xl font-bold">{stats.totalCapacity}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Occupancy</p>
          <p className="text-2xl font-bold">{stats.occupancyRate}%</p>
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

      {/* Zone Occupancy */}
      {stats.zones.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold">Zone Occupancy</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.zones.map((z: any) => (
              <div key={z.id} className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{z.name}</span>
                  <span className="text-xs text-muted-foreground">{z.code}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {z.activePermits} / {z.capacity} ({z.occupancyRate}%)
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${Math.min(z.occupancyRate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Zone Form */}
      {showAddZone && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Add Parking Zone</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="_action" value="create_zone" />
            <div>
              <label className="mb-1 block text-sm font-medium">Zone Name *</label>
              <input
                name="name"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. VIP Parking"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Code *</label>
              <input
                name="code"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. VIP-A"
              />
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
              <label className="mb-1 block text-sm font-medium">Color</label>
              <input
                name="color"
                type="color"
                className="h-10 w-full rounded-md border bg-background px-1"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Zone"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Issue Permit Form */}
      {showIssuePermit && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Issue Parking Permit</h3>
          {zones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create a parking zone first.</p>
          ) : (
            <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input type="hidden" name="_action" value="issue_permit" />
              <div>
                <label className="mb-1 block text-sm font-medium">Zone *</label>
                <NativeSelect name="zoneId" required>
                  <NativeSelectOption value="">Select zone</NativeSelectOption>
                  {zones.map((z: any) => (
                    <NativeSelectOption key={z.id} value={z.id}>
                      {z.name} ({z.code}) — {z.capacity - z.permitCount} available
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Participant</label>
                <NativeSelect name="participantId">
                  <NativeSelectOption value="">None (general permit)</NativeSelectOption>
                  {participants.map((p: any) => (
                    <NativeSelectOption key={p.id} value={p.id}>
                      {p.lastName}, {p.firstName}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Vehicle Plate</label>
                <input
                  name="vehiclePlate"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. AB-1234"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Valid From *</label>
                <DateTimePicker name="validFrom" required placeholder="Select start date & time" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Valid Until *</label>
                <DateTimePicker name="validUntil" required placeholder="Select end date & time" />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Issuing..." : "Issue Permit"}
                </Button>
              </div>
            </Form>
          )}
        </div>
      )}

      {/* Filters */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Permits</h3>
        <Form method="get" className="mb-3 flex flex-wrap gap-3">
          <NativeSelect name="zoneId" defaultValue={filters.zoneId ?? ""}>
            <NativeSelectOption value="">All Zones</NativeSelectOption>
            {zones.map((z: any) => (
              <NativeSelectOption key={z.id} value={z.id}>
                {z.name} ({z.code})
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect name="status" defaultValue={filters.status ?? ""}>
            <NativeSelectOption value="">All Statuses</NativeSelectOption>
            <NativeSelectOption value="ACTIVE">Active</NativeSelectOption>
            <NativeSelectOption value="EXPIRED">Expired</NativeSelectOption>
            <NativeSelectOption value="REVOKED">Revoked</NativeSelectOption>
            <NativeSelectOption value="SUSPENDED">Suspended</NativeSelectOption>
          </NativeSelect>
          <Button type="submit" variant="secondary" size="sm">
            Filter
          </Button>
        </Form>
      </div>

      {/* Permits Table */}
      {permits.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No parking permits found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Permit #</th>
                <th className="px-4 py-3 text-left font-medium">Zone</th>
                <th className="px-4 py-3 text-left font-medium">Participant</th>
                <th className="px-4 py-3 text-left font-medium">Vehicle</th>
                <th className="px-4 py-3 text-left font-medium">Valid</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {permits.map((p: any) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{p.permitNumber}</td>
                  <td className="px-4 py-3">
                    {p.zoneName}{" "}
                    <span className="text-xs text-muted-foreground">({p.zoneCode})</span>
                  </td>
                  <td className="px-4 py-3">{p.participantName || "—"}</td>
                  <td className="px-4 py-3">{p.vehiclePlate || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.validFrom).toLocaleDateString()} –{" "}
                    {new Date(p.validUntil).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[p.status] ?? ""}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "ACTIVE" && (
                      <Form method="post" className="flex items-center gap-1">
                        <input type="hidden" name="_action" value="revoke_permit" />
                        <input type="hidden" name="permitId" value={p.id} />
                        <input type="hidden" name="reason" value="Revoked by admin" />
                        <Button
                          type="submit"
                          variant="destructive"
                          size="sm"
                          disabled={isSubmitting}
                        >
                          Revoke
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
  );
}
