import { data, useLoaderData, Form, useNavigation } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import {
  getWaitlist,
  getWaitlistStats,
  updatePriority,
  withdrawFromWaitlist,
  removeFromWaitlist,
  checkAndPromote,
  WaitlistError,
} from "~/services/waitlist.server";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import type { Route } from "./+types/waitlist";

export const handle = { breadcrumb: "Waitlist" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "waitlist", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.WAITLIST);
  if (!enabled) {
    throw data({ error: "Waitlist feature is not enabled" }, { status: 404 });
  }

  const eventId = params.eventId;
  const url = new URL(request.url);

  const filters = {
    status: (url.searchParams.get("status") as any) || undefined,
    participantType: url.searchParams.get("participantType") || undefined,
    priority: (url.searchParams.get("priority") as any) || undefined,
    page: Number(url.searchParams.get("page")) || 1,
    pageSize: Number(url.searchParams.get("pageSize")) || 20,
  };

  const [waitlist, stats] = await Promise.all([
    getWaitlist(eventId, tenantId, filters),
    getWaitlistStats(eventId, tenantId),
  ]);

  return {
    eventId,
    entries: waitlist.entries.map((e: any) => ({
      id: e.id,
      participantId: e.participantId,
      participantType: e.participantType,
      priority: e.priority,
      position: e.position,
      status: e.status,
      promotionDeadline: e.promotionDeadline?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
      participant: {
        id: e.participant.id,
        firstName: e.participant.firstName,
        lastName: e.participant.lastName,
        email: e.participant.email,
      },
      promotions: e.promotions.map((p: any) => ({
        id: p.id,
        confirmedAt: p.confirmedAt?.toISOString() ?? null,
        declinedAt: p.declinedAt?.toISOString() ?? null,
      })),
    })),
    stats,
    total: waitlist.total,
    page: waitlist.page,
    pageSize: waitlist.pageSize,
    totalPages: waitlist.totalPages,
    filters,
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "waitlist", "manage");
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
    if (_action === "update_priority") {
      const entryId = formData.get("entryId") as string;
      const priority = formData.get("priority") as "STANDARD" | "HIGH" | "VIP";
      await updatePriority(entryId, priority, ctx);
      return data({ success: true });
    }

    if (_action === "promote_now") {
      const entryId = formData.get("entryId") as string;
      // Promote a single entry immediately (1 slot)
      const entry = await (
        await import("~/services/waitlist.server")
      ).getWaitlistEntry(entryId, tenantId);
      await checkAndPromote(eventId, tenantId, entry.participantType, 1, "manual", entryId);
      return data({ success: true });
    }

    if (_action === "withdraw") {
      const entryId = formData.get("entryId") as string;
      await withdrawFromWaitlist(entryId, ctx);
      return data({ success: true });
    }

    if (_action === "remove") {
      const entryId = formData.get("entryId") as string;
      await removeFromWaitlist(entryId, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof WaitlistError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

const statusColors: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  PROMOTED: "bg-green-100 text-green-800",
  EXPIRED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-yellow-100 text-yellow-800",
};

const priorityColors: Record<string, string> = {
  VIP: "bg-purple-100 text-purple-800",
  HIGH: "bg-orange-100 text-orange-800",
  STANDARD: "bg-gray-100 text-gray-800",
};

export default function WaitlistPage() {
  const { entries, stats, total, page, totalPages, filters, eventId } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Waitlist Management</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage waitlisted participants for this event.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Promoted</p>
          <p className="text-2xl font-bold text-green-600">{stats.promoted}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Expired</p>
          <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <p className="text-2xl font-bold">{stats.promotionSuccessRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <Form method="get" className="flex flex-wrap gap-3">
        <NativeSelect name="status" defaultValue={filters.status ?? ""}>
          <NativeSelectOption value="">All Statuses</NativeSelectOption>
          <NativeSelectOption value="ACTIVE">Active</NativeSelectOption>
          <NativeSelectOption value="PROMOTED">Promoted</NativeSelectOption>
          <NativeSelectOption value="EXPIRED">Expired</NativeSelectOption>
          <NativeSelectOption value="WITHDRAWN">Withdrawn</NativeSelectOption>
          <NativeSelectOption value="CANCELLED">Cancelled</NativeSelectOption>
        </NativeSelect>
        <NativeSelect name="priority" defaultValue={filters.priority ?? ""}>
          <NativeSelectOption value="">All Priorities</NativeSelectOption>
          <NativeSelectOption value="VIP">VIP</NativeSelectOption>
          <NativeSelectOption value="HIGH">High</NativeSelectOption>
          <NativeSelectOption value="STANDARD">Standard</NativeSelectOption>
        </NativeSelect>
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
      </Form>

      {/* Entries Table */}
      {entries.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No waitlist entries found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Added</th>
                <th className="px-4 py-3 text-left font-medium">Deadline</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry: any, idx: number) => (
                <tr key={entry.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{(page - 1) * 20 + idx + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    {entry.participant.firstName} {entry.participant.lastName}
                    {entry.participant.email && (
                      <span className="block text-xs text-muted-foreground">
                        {entry.participant.email}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{entry.participantType}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[entry.priority] ?? ""}`}
                    >
                      {entry.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[entry.status] ?? ""}`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entry.promotionDeadline
                      ? new Date(entry.promotionDeadline).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {entry.status === "ACTIVE" && (
                      <div className="flex gap-1">
                        <Form method="post">
                          <input type="hidden" name="_action" value="update_priority" />
                          <input type="hidden" name="entryId" value={entry.id} />
                          <NativeSelect
                            name="priority"
                            defaultValue={entry.priority}
                            onChange={(e) => e.target.form?.requestSubmit()}
                            disabled={isSubmitting}
                          >
                            <NativeSelectOption value="STANDARD">Standard</NativeSelectOption>
                            <NativeSelectOption value="HIGH">High</NativeSelectOption>
                            <NativeSelectOption value="VIP">VIP</NativeSelectOption>
                          </NativeSelect>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="_action" value="promote_now" />
                          <input type="hidden" name="entryId" value={entry.id} />
                          <Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
                            Promote
                          </Button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="_action" value="withdraw" />
                          <input type="hidden" name="entryId" value={entry.id} />
                          <Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
                            Withdraw
                          </Button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="_action" value="remove" />
                          <input type="hidden" name="entryId" value={entry.id} />
                          <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            disabled={isSubmitting}
                          >
                            Remove
                          </Button>
                        </Form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Form method="get">
                <input type="hidden" name="page" value={String(page - 1)} />
                {filters.status && <input type="hidden" name="status" value={filters.status} />}
                {filters.priority && (
                  <input type="hidden" name="priority" value={filters.priority} />
                )}
                <Button type="submit" variant="outline" size="sm">
                  Previous
                </Button>
              </Form>
            )}
            {page < totalPages && (
              <Form method="get">
                <input type="hidden" name="page" value={String(page + 1)} />
                {filters.status && <input type="hidden" name="status" value={filters.status} />}
                {filters.priority && (
                  <input type="hidden" name="priority" value={filters.priority} />
                )}
                <Button type="submit" variant="outline" size="sm">
                  Next
                </Button>
              </Form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
