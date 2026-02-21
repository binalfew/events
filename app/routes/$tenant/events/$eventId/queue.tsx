import { data, useLoaderData } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import {
  getQueueStatus,
  callNextTicket,
  startServing,
  completeService,
  cancelTicket,
  QueueError,
} from "~/services/queue-tickets.server";
import { QueueManager } from "~/components/kiosk/queue-manager";
import type { Route } from "./+types/queue";

export const handle = { breadcrumb: "Queue" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "kiosk", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.KIOSK_MODE);
  if (!enabled) {
    throw data({ error: "Kiosk mode is not enabled" }, { status: 404 });
  }

  const eventId = params.eventId;
  const queueStatus = await getQueueStatus(eventId);

  // Get completed count for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedToday = await prisma.queueTicket.count({
    where: {
      eventId,
      tenantId,
      status: "COMPLETED",
      joinedAt: { gte: today },
    },
  });

  return {
    eventId,
    nowServing: queueStatus.nowServing.map((t: any) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      counterNumber: t.counterNumber,
      status: t.status,
      joinedAt: t.joinedAt.toISOString ? t.joinedAt.toISOString() : String(t.joinedAt),
      participant: t.participant,
    })),
    waitingCount: queueStatus.waitingCount,
    averageWaitMinutes: queueStatus.averageWaitMinutes,
    completedToday,
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "kiosk", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  const ctx = { tenantId };

  try {
    if (_action === "callNext") {
      const counterNumber = Number(formData.get("counterNumber")) || 1;
      const ticket = await callNextTicket(eventId, counterNumber, ctx);
      if (!ticket) {
        return data({ error: "No tickets waiting in the queue" });
      }
      return data({
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          counterNumber: ticket.counterNumber,
          status: ticket.status,
          joinedAt: ticket.joinedAt.toISOString(),
          participant: ticket.participant,
        },
      });
    }

    if (_action === "startServing") {
      const ticketId = formData.get("ticketId") as string;
      await startServing(ticketId, ctx);
      return data({ success: true });
    }

    if (_action === "complete") {
      const ticketId = formData.get("ticketId") as string;
      await completeService(ticketId, ctx);
      return data({ success: true });
    }

    if (_action === "cancel") {
      const ticketId = formData.get("ticketId") as string;
      await cancelTicket(ticketId, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof QueueError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

export default function QueuePage() {
  const { nowServing, waitingCount, averageWaitMinutes, completedToday } =
    useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Queue Management</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the service queue for this event.
        </p>
      </div>

      <QueueManager
        nowServing={nowServing}
        waitingCount={waitingCount}
        averageWaitMinutes={averageWaitMinutes}
        completedToday={completedToday}
      />
    </div>
  );
}
