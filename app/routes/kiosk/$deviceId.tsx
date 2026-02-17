import { Outlet, data, useLoaderData, useFetcher } from "react-router";
import { useEffect, useCallback } from "react";
import { getDevice, recordHeartbeat, KioskDeviceError } from "~/services/kiosk-devices.server";
import { endSession, getActiveSession } from "~/services/kiosk-sessions.server";
import { KioskShell } from "~/components/kiosk/kiosk-shell";
import type { Route } from "./+types/$deviceId";

// ─── Loader ───────────────────────────────────────────────

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const device = await getDevice(params.deviceId);
    return {
      device: {
        id: device.id,
        name: device.name,
        location: device.location,
        mode: device.mode,
        language: device.language,
        isOnline: device.isOnline,
        eventId: device.event.id,
        tenantId: device.event.tenantId,
      },
      event: {
        id: device.event.id,
        name: device.event.name,
      },
    };
  } catch (err) {
    if (err instanceof KioskDeviceError) {
      throw data({ error: err.message }, { status: err.status });
    }
    throw data({ error: "Device not found" }, { status: 404 });
  }
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  if (_action === "heartbeat") {
    try {
      await recordHeartbeat(params.deviceId);
      return data({ ok: true });
    } catch {
      return data({ error: "Heartbeat failed" }, { status: 500 });
    }
  }

  if (_action === "endSession") {
    const sessionId = formData.get("sessionId") as string;
    const timedOut = formData.get("timedOut") === "true";
    if (sessionId) {
      try {
        await endSession(sessionId, timedOut);
      } catch {
        // Session may already be ended
      }
    }
    return data({ ok: true });
  }

  return data({ error: "Unknown action" }, { status: 400 });
}

// ─── Component ────────────────────────────────────────────

export default function KioskDeviceLayout() {
  const { device, event } = useLoaderData<typeof loader>();
  const sessionFetcher = useFetcher();

  const handleSessionTimeout = useCallback(() => {
    // End any active session on timeout
    sessionFetcher.submit(
      { _action: "endSession", sessionId: "", timedOut: "true" },
      { method: "POST" },
    );
  }, []);

  return (
    <KioskShell
      deviceId={device.id}
      eventName={event.name}
      language={device.language}
      onSessionTimeout={handleSessionTimeout}
    >
      <Outlet />
    </KioskShell>
  );
}
