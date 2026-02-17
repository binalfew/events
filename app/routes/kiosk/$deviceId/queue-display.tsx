import { data, useLoaderData } from "react-router";
import { getDevice } from "~/services/kiosk-devices.server";
import { getQueueStatus } from "~/services/queue-tickets.server";
import { QueueDisplay } from "~/components/kiosk/queue-display";
import type { Route } from "./+types/queue-display";

// ─── Loader ───────────────────────────────────────────────

export async function loader({ params }: Route.LoaderArgs) {
  const device = await getDevice(params.deviceId);
  const eventId = device.event.id;

  const queueStatus = await getQueueStatus(eventId);

  return {
    nowServing: queueStatus.nowServing.map((t) => ({
      ticketNumber: t.ticketNumber,
      counterNumber: t.counterNumber,
      status: t.status,
      participant: t.participant,
    })),
    nextUp: queueStatus.nextUp.map((t) => ({
      ticketNumber: t.ticketNumber,
      priority: t.priority,
    })),
    waitingCount: queueStatus.waitingCount,
    averageWaitMinutes: queueStatus.averageWaitMinutes,
  };
}

// ─── Component ────────────────────────────────────────────

export default function QueueDisplayPage() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="w-full">
      <QueueDisplay
        nowServing={loaderData.nowServing}
        nextUp={loaderData.nextUp}
        waitingCount={loaderData.waitingCount}
        averageWaitMinutes={loaderData.averageWaitMinutes}
      />
    </div>
  );
}
