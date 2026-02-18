import { useState } from "react";
import { data, useLoaderData, useActionData, Form, useNavigation } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import {
  createGiftItem,
  listGiftItems,
  updateStock,
  createWelcomePackage,
  listWelcomePackages,
  assignPackage,
  bulkAssignPackages,
  markAssembled,
  markDelivered,
  listDeliveries,
  getDeliveryDashboard,
  GiftError,
} from "~/services/gift-protocol.server";
import {
  createGiftItemSchema,
  createWelcomePackageSchema,
  assignPackageSchema,
} from "~/lib/schemas/gift-protocol";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import type { Route } from "./+types/gifts";

export const handle = { breadcrumb: "Gifts" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "protocol", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") || undefined;

  const [items, packages, deliveries, dashboard, participants] = await Promise.all([
    listGiftItems(eventId, tenantId),
    listWelcomePackages(eventId, tenantId),
    listDeliveries(eventId, tenantId, statusFilter),
    getDeliveryDashboard(eventId, tenantId),
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
    items: items.map((i: any) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      category: i.category,
      value: i.value,
      currency: i.currency,
      quantity: i.quantity,
      allocated: i.allocated,
      deliveryCount: i._count.deliveries,
    })),
    packages: packages.map((p: any) => ({
      id: p.id,
      name: p.name,
      forParticipantType: p.forParticipantType,
      contents: p.contents,
      deliveryCount: p._count.deliveries,
    })),
    deliveries: deliveries.map((d: any) => ({
      id: d.id,
      recipientName: d.recipientName,
      status: d.status,
      notes: d.notes,
      deliveredAt: d.deliveredAt?.toISOString() ?? null,
      packageName: d.welcomePackage?.name ?? null,
      giftItemName: d.giftItem?.name ?? null,
      participantName: d.participant
        ? `${d.participant.firstName} ${d.participant.lastName}`
        : null,
    })),
    dashboard,
    participants,
    filters: { status: statusFilter },
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
    if (_action === "create_item") {
      const raw = Object.fromEntries(formData);
      const parsed = createGiftItemSchema.parse({ ...raw, eventId });
      await createGiftItem(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "update_stock") {
      const itemId = formData.get("itemId") as string;
      const adjustment = parseInt(formData.get("adjustment") as string, 10);
      if (isNaN(adjustment)) {
        return data({ error: "Invalid adjustment value" }, { status: 400 });
      }
      await updateStock(itemId, adjustment, ctx);
      return data({ success: true });
    }

    if (_action === "create_package") {
      const raw = Object.fromEntries(formData);
      const parsed = createWelcomePackageSchema.parse({ ...raw, eventId });
      await createWelcomePackage(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "assign_package") {
      const raw = Object.fromEntries(formData);
      const parsed = assignPackageSchema.parse(raw);
      await assignPackage(parsed, eventId, ctx);
      return data({ success: true });
    }

    if (_action === "bulk_assign") {
      const result = await bulkAssignPackages(eventId, tenantId, ctx);
      return data({ success: true, assigned: result.assigned });
    }

    if (_action === "mark_assembled") {
      const deliveryId = formData.get("deliveryId") as string;
      await markAssembled(deliveryId, ctx);
      return data({ success: true });
    }

    if (_action === "mark_delivered") {
      const deliveryId = formData.get("deliveryId") as string;
      await markDelivered(deliveryId, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof GiftError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ASSEMBLED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
  RETURNED: "bg-gray-100 text-gray-800",
};

export default function GiftsPage() {
  const { eventId, items, packages, deliveries, dashboard, participants, filters } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showItemForm, setShowItemForm] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gift Protocol & Welcome Packages</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage gift inventory, welcome packages, and delivery tracking.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowItemForm(!showItemForm)}>
            {showItemForm ? "Hide" : "Add Gift Item"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPackageForm(!showPackageForm)}>
            {showPackageForm ? "Hide" : "New Package"}
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
          {"assigned" in actionData
            ? `Bulk assigned ${actionData.assigned} packages.`
            : "Operation completed successfully."}
        </div>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Deliveries</p>
          <p className="text-2xl font-bold">{dashboard.totalDeliveries}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{dashboard.pending}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Assembled</p>
          <p className="text-2xl font-bold text-blue-600">{dashboard.assembled}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Delivered</p>
          <p className="text-2xl font-bold text-green-600">{dashboard.delivered}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Completion</p>
          <p className="text-2xl font-bold">{dashboard.completionRate}%</p>
        </div>
      </div>

      {/* Add Gift Item Form */}
      {showItemForm && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Add Gift Item</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input type="hidden" name="_action" value="create_item" />
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input
                name="name"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Crystal Vase"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category *</label>
              <input
                name="category"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Premium, Standard"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Quantity *</label>
              <input
                name="quantity"
                type="number"
                min="0"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Value</label>
              <input
                name="value"
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Unit cost"
              />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <input
                name="description"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Create Package Form */}
      {showPackageForm && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Create Welcome Package</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="_action" value="create_package" />
            <div>
              <label className="mb-1 block text-sm font-medium">Package Name *</label>
              <input
                name="name"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. VIP Package, Standard Package"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">For Participant Type</label>
              <input
                name="forParticipantType"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. HEAD_OF_STATE (leave blank for all)"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Contents (JSON array)</label>
              <input
                name="contents"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder='["Item 1","Item 2"]'
                defaultValue="[]"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Package"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Gift Inventory */}
      {items.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">Gift Inventory ({items.length})</h3>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Item</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Value</th>
                  <th className="px-4 py-3 text-left font-medium">Stock</th>
                  <th className="px-4 py-3 text-left font-medium">Allocated</th>
                  <th className="px-4 py-3 text-left font-medium">Available</th>
                  <th className="px-4 py-3 text-left font-medium">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((i: any) => (
                  <tr key={i.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{i.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                        {i.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {i.value != null ? `${i.currency} ${i.value}` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono">{i.quantity}</td>
                    <td className="px-4 py-3 font-mono">{i.allocated}</td>
                    <td className="px-4 py-3 font-mono font-medium">{i.quantity - i.allocated}</td>
                    <td className="px-4 py-3">
                      <Form method="post" className="flex items-center gap-1">
                        <input type="hidden" name="_action" value="update_stock" />
                        <input type="hidden" name="itemId" value={i.id} />
                        <input
                          name="adjustment"
                          type="number"
                          className="w-16 rounded-md border bg-background px-2 py-1 text-xs"
                          placeholder="+/-"
                        />
                        <Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
                          Adjust
                        </Button>
                      </Form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Welcome Packages */}
      {packages.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">Welcome Packages ({packages.length})</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((p: any) => (
              <div key={p.id} className="rounded-lg border bg-card p-4">
                <h4 className="font-semibold">{p.name}</h4>
                {p.forParticipantType && (
                  <p className="mt-1 text-xs text-muted-foreground">For: {p.forParticipantType}</p>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  Contents:{" "}
                  {Array.isArray(p.contents) && p.contents.length > 0
                    ? (p.contents as string[]).join(", ")
                    : "Not specified"}
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">{p.deliveryCount}</span> assigned
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Package + Bulk Assign */}
      <div className="flex flex-wrap items-end gap-3">
        <Button variant="outline" size="sm" onClick={() => setShowAssignForm(!showAssignForm)}>
          {showAssignForm ? "Hide" : "Assign Package"}
        </Button>
        <Form method="post">
          <input type="hidden" name="_action" value="bulk_assign" />
          <Button type="submit" variant="secondary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Assigning..." : "Bulk Assign Packages"}
          </Button>
        </Form>
      </div>

      {showAssignForm && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Assign Package to Participant</h3>
          <Form method="post" className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input type="hidden" name="_action" value="assign_package" />
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
              <label className="mb-1 block text-sm font-medium">Welcome Package</label>
              <NativeSelect name="welcomePackageId">
                <NativeSelectOption value="">None</NativeSelectOption>
                {packages.map((p: any) => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    {p.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Recipient Name *</label>
              <input
                name="recipientName"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* Deliveries */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Deliveries ({deliveries.length})</h3>
          <Form method="get" className="flex items-end gap-2">
            <NativeSelect name="status" defaultValue={filters.status ?? ""}>
              <NativeSelectOption value="">All</NativeSelectOption>
              <NativeSelectOption value="PENDING">Pending</NativeSelectOption>
              <NativeSelectOption value="ASSEMBLED">Assembled</NativeSelectOption>
              <NativeSelectOption value="DELIVERED">Delivered</NativeSelectOption>
              <NativeSelectOption value="RETURNED">Returned</NativeSelectOption>
            </NativeSelect>
            <Button type="submit" variant="secondary" size="sm">
              Filter
            </Button>
          </Form>
        </div>
        {deliveries.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No deliveries yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Recipient</th>
                  <th className="px-4 py-3 text-left font-medium">Package / Item</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Delivered</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deliveries.map((d: any) => (
                  <tr key={d.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">{d.recipientName}</td>
                    <td className="px-4 py-3 text-xs">
                      {d.packageName && <div>{d.packageName}</div>}
                      {d.giftItemName && <div>{d.giftItemName}</div>}
                      {!d.packageName && !d.giftItemName && "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[d.status] ?? ""}`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {d.status === "PENDING" && (
                          <Form method="post">
                            <input type="hidden" name="_action" value="mark_assembled" />
                            <input type="hidden" name="deliveryId" value={d.id} />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              disabled={isSubmitting}
                            >
                              Assembled
                            </Button>
                          </Form>
                        )}
                        {d.status === "ASSEMBLED" && (
                          <Form method="post">
                            <input type="hidden" name="_action" value="mark_delivered" />
                            <input type="hidden" name="deliveryId" value={d.id} />
                            <Button
                              type="submit"
                              variant="secondary"
                              size="sm"
                              disabled={isSubmitting}
                            >
                              Delivered
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
