import { data, useLoaderData, useFetcher } from "react-router";
import { useState } from "react";
import { prisma } from "~/lib/db.server";
import { getDevice } from "~/services/kiosk-devices.server";
import { startSession, endSession } from "~/services/kiosk-sessions.server";
import { joinQueue } from "~/services/queue-tickets.server";
import { joinQueueSchema } from "~/lib/schemas/queue-ticket";
import { StatusLookup } from "~/components/kiosk/status-lookup";
import { QueueJoin } from "~/components/kiosk/queue-join";
import type { Route } from "./+types/self-service";

// ─── Loader ───────────────────────────────────────────────

export async function loader({ params }: Route.LoaderArgs) {
  const device = await getDevice(params.deviceId);
  return {
    deviceId: device.id,
    eventId: device.event.id,
    tenantId: device.event.tenantId,
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const device = await getDevice(params.deviceId);
  const tenantId = device.event.tenantId;
  const eventId = device.event.id;

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  try {
    if (_action === "lookup") {
      const query = (formData.get("query") as string)?.trim();
      if (!query)
        return data({ error: "Please enter an email or registration code" }, { status: 400 });

      const participant = await prisma.participant.findFirst({
        where: {
          tenantId,
          eventId,
          deletedAt: null,
          OR: [
            { email: { equals: query, mode: "insensitive" as const } },
            { registrationCode: query },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          registrationCode: true,
          status: true,
        },
      });

      if (!participant) {
        return data(
          { error: "Participant not found. Please check your email or registration code." },
          { status: 404 },
        );
      }

      return data({ participant });
    }

    if (_action === "scan") {
      const qrPayload = formData.get("qrPayload") as string;
      if (!qrPayload) return data({ error: "No QR code data" }, { status: 400 });

      // Use the check-in service for scanning
      const { processScan } = await import("~/services/check-in.server");
      const checkpoint = await prisma.checkpoint.findFirst({
        where: { tenantId, eventId: device.eventId, isActive: true },
      });

      if (!checkpoint) {
        return data({ error: "No active checkpoint configured" }, { status: 400 });
      }

      const result = await processScan(qrPayload, {
        userId: "kiosk",
        tenantId,
        checkpointId: checkpoint.id,
        deviceId: device.id,
      });

      if (result.result === "VALID" || result.result === "MANUAL_OVERRIDE") {
        // Look up participant for display
        if (result.participantId) {
          const participant = await prisma.participant.findUnique({
            where: { id: result.participantId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              registrationCode: true,
              status: true,
            },
          });
          return data({ participant, scanResult: result });
        }
      }

      return data({ error: result.message, scanResult: result });
    }

    if (_action === "joinQueue") {
      const participantId = formData.get("participantId") as string;
      const serviceType = formData.get("serviceType") as string;

      const parsed = joinQueueSchema.safeParse({
        eventId,
        participantId,
        serviceType,
        priority: 0,
      });

      if (!parsed.success) {
        return data({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      const ticket = await joinQueue(parsed.data, { tenantId });
      return data({ ticket });
    }

    if (_action === "startSession") {
      const session = await startSession(device.id, "self-service", device.language);
      return data({ session });
    }

    if (_action === "endSession") {
      const sessionId = formData.get("sessionId") as string;
      if (sessionId) {
        const timedOut = formData.get("timedOut") === "true";
        await endSession(sessionId, timedOut);
      }
      return data({ ok: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

export default function SelfServicePage() {
  const { deviceId, eventId } = useLoaderData<typeof loader>();
  const [view, setView] = useState<"lookup" | "queue">("lookup");
  const [participantId, setParticipantId] = useState<string | null>(null);

  if (view === "queue" && participantId) {
    return (
      <QueueJoin
        participantId={participantId}
        onDone={() => {
          setView("lookup");
          setParticipantId(null);
        }}
      />
    );
  }

  return (
    <StatusLookup
      onJoinQueue={(pid) => {
        setParticipantId(pid);
        setView("queue");
      }}
    />
  );
}
