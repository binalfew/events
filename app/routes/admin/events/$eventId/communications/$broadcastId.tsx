import { data, useLoaderData, useFetcher, useNavigate } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import {
  getBroadcast,
  getBroadcastDeliveries,
  cancelBroadcast,
} from "~/services/broadcasts.server";
import { BroadcastDetail } from "~/components/communications/broadcast-detail";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Route } from "./+types/$broadcastId";

export const handle = { breadcrumb: "Broadcast Detail" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "communication", "broadcast");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.COMMUNICATION_HUB, { tenantId });
  if (!enabled) {
    throw data({ error: "Communication Hub is not enabled" }, { status: 404 });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");

  const [broadcast, deliveryResult] = await Promise.all([
    getBroadcast(params.broadcastId, tenantId),
    getBroadcastDeliveries(params.broadcastId, tenantId, page, 20),
  ]);

  return {
    broadcast,
    deliveries: deliveryResult.deliveries,
    deliveryTotal: deliveryResult.total,
    deliveryPage: deliveryResult.page,
    deliveryTotalPages: deliveryResult.totalPages,
    eventId: params.eventId,
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "communication", "broadcast");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  try {
    if (_action === "cancel") {
      const reason = (formData.get("reason") as string) || undefined;
      await cancelBroadcast(params.broadcastId, reason, { userId: user.id, tenantId });
      return data({ success: true });
    }
    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return data(
      { error: error.message ?? "Operation failed" },
      { status: error.statusCode ?? 500 },
    );
  }
}

// ─── Component ────────────────────────────────────────────

export default function BroadcastDetailPage() {
  const { broadcast, deliveries, deliveryTotal, eventId } = useLoaderData<typeof loader>();
  const cancelFetcher = useFetcher();
  const navigate = useNavigate();

  function handleCancel() {
    if (!confirm("Are you sure you want to cancel this broadcast?")) return;
    cancelFetcher.submit({ _action: "cancel" }, { method: "POST" });
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/admin/events/${eventId}/communications`)}
      >
        <ArrowLeft className="mr-2 size-4" /> Back to Broadcasts
      </Button>

      <BroadcastDetail
        broadcast={broadcast as any}
        deliveries={deliveries as any}
        deliveryTotal={deliveryTotal}
        onCancel={handleCancel}
      />
    </div>
  );
}
