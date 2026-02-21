import { data, useFetcher, useLoaderData } from "react-router";
import { useState } from "react";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import {
  registerDevice,
  listDevices,
  updateDevice,
  decommissionDevice,
  KioskDeviceError,
} from "~/services/kiosk-devices.server";
import { registerDeviceSchema } from "~/lib/schemas/kiosk-device";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { DeviceList } from "~/components/kiosk/device-list";
import { RegisterDeviceDialog } from "~/components/kiosk/register-device-dialog";
import type { Route } from "./+types/kiosks";

export const handle = { breadcrumb: "Kiosks" };

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
  const devices = await listDevices(eventId, tenantId);

  return { eventId, devices };
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

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    if (_action === "register") {
      const input = {
        eventId,
        name: formData.get("name") as string,
        location: formData.get("location") as string,
        mode: formData.get("mode") as string,
        language: (formData.get("language") as string) || "en",
      };

      const parsed = registerDeviceSchema.safeParse(input);
      if (!parsed.success) {
        return data({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      await registerDevice(parsed.data, ctx);
      return data({ success: true });
    }

    if (_action === "update") {
      const id = formData.get("id") as string;
      if (!id) return data({ error: "Device ID is required" }, { status: 400 });

      const input: Record<string, unknown> = {};
      const name = formData.get("name") as string;
      const location = formData.get("location") as string;
      const mode = formData.get("mode") as string;
      const language = formData.get("language") as string;

      if (name) input.name = name;
      if (location) input.location = location;
      if (mode) input.mode = mode;
      if (language) input.language = language;

      await updateDevice(id, input as any, ctx);
      return data({ success: true });
    }

    if (_action === "decommission") {
      const id = formData.get("id") as string;
      if (!id) return data({ error: "Device ID is required" }, { status: 400 });
      await decommissionDevice(id, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof KioskDeviceError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

export default function KiosksSettingsPage() {
  const { eventId, devices } = useLoaderData<typeof loader>();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Kiosk Devices</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage self-service kiosk devices for this event.
          </p>
        </div>
        <Button onClick={() => setRegisterOpen(true)}>Register Device</Button>
      </div>

      <Separator />

      {devices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No kiosk devices registered yet. Register one to enable self-service stations.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
            <CardDescription>
              {devices.length} device{devices.length !== 1 ? "s" : ""} registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeviceList
              devices={devices.map((d: any) => ({
                ...d,
                lastHeartbeat: d.lastHeartbeat.toISOString
                  ? d.lastHeartbeat.toISOString()
                  : String(d.lastHeartbeat),
              }))}
              onEdit={(device) => setEditDevice(device)}
            />
          </CardContent>
        </Card>
      )}

      <RegisterDeviceDialog open={registerOpen} onOpenChange={setRegisterOpen} />

      {editDevice && (
        <RegisterDeviceDialog
          open={!!editDevice}
          onOpenChange={(open) => !open && setEditDevice(null)}
          device={editDevice}
        />
      )}
    </div>
  );
}
