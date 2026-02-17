import { createNotification } from "~/services/notifications.server";
import { logger } from "~/lib/logger.server";
import type { ChannelResult } from "./email.server";

// ─── Public API ──────────────────────────────────────────

export async function sendInApp(
  userId: string | null,
  tenantId: string,
  title: string,
  body: string,
): Promise<ChannelResult> {
  if (!userId) {
    logger.warn({ tenantId, title }, "Cannot send in-app notification: no userId for participant");
    return { externalId: null, status: "FAILED", error: "No userId for participant" };
  }

  try {
    const notification = await createNotification({
      userId,
      tenantId,
      type: "broadcast",
      title,
      message: body,
    });

    return { externalId: notification.id, status: "SENT" };
  } catch (error: any) {
    logger.error({ userId, error: error.message }, "In-app notification failed");
    return { externalId: null, status: "FAILED", error: error.message };
  }
}

// ─── Stubs for SMS / Push ────────────────────────────────

export async function sendSMS(to: string, body: string): Promise<ChannelResult> {
  logger.info({ to, bodyLength: body.length }, "[SMS Stub] Would send SMS");
  return { externalId: null, status: "SENT" };
}

export async function sendPush(to: string, title: string, body: string): Promise<ChannelResult> {
  logger.info({ to, title, bodyLength: body.length }, "[Push Stub] Would send push notification");
  return { externalId: null, status: "SENT" };
}
