import { redirect } from "react-router";
import { getDevice } from "~/services/kiosk-devices.server";
import type { Route } from "./+types/index";

export async function loader({ params }: Route.LoaderArgs) {
  const device = await getDevice(params.deviceId);

  const modeRoutes: Record<string, string> = {
    "self-service": "self-service",
    "check-in": "self-service",
    "queue-display": "queue-display",
    info: "self-service",
  };

  const route = modeRoutes[device.mode] ?? "self-service";
  return redirect(`/kiosk/${params.deviceId}/${route}`);
}
