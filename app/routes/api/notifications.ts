import { data } from "react-router";
import { requireAuth } from "~/lib/require-auth.server";
import { markAsRead, markAllAsRead, deleteNotification } from "~/services/notifications.server";
import type { Route } from "./+types/notifications";

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "mark-read": {
      const notificationId = formData.get("notificationId");
      if (typeof notificationId !== "string") {
        return data({ error: "Missing notificationId" }, { status: 400 });
      }
      await markAsRead(notificationId, user.id);
      return data({ ok: true });
    }

    case "mark-all-read": {
      await markAllAsRead(user.id);
      return data({ ok: true });
    }

    case "delete": {
      const notificationId = formData.get("notificationId");
      if (typeof notificationId !== "string") {
        return data({ error: "Missing notificationId" }, { status: 400 });
      }
      await deleteNotification(notificationId, user.id);
      return data({ ok: true });
    }

    default:
      return data({ error: "Unknown intent" }, { status: 400 });
  }
}
