/**
 * Dev-only test route for publishing fake SSE events.
 * Registered only when NODE_ENV === "development".
 *
 * Usage (from browser console while logged in):
 *   fetch("/api/sse-test/approved", { method: "POST" })
 *   fetch("/api/sse-test/rejected", { method: "POST" })
 *   fetch("/api/sse-test/sla-warning", { method: "POST" })
 *   fetch("/api/sse-test/sla-breached", { method: "POST" })
 *   fetch("/api/sse-test/notification", { method: "POST" })
 */
import { Router } from "express";
import type { Request, Response } from "express";
import { eventBus } from "./event-bus.js";
import type { SSEEventType, SSEChannel } from "../app/types/sse-events.js";

type GetSessionFn = (request: globalThis.Request) => Promise<{ get(key: string): unknown }>;
type GetTenantFn = (userId: string) => Promise<string | null>;

interface TestEvent {
  channel: SSEChannel;
  type: SSEEventType;
  data: Record<string, unknown>;
}

const TEST_EVENTS: Record<string, TestEvent> = {
  approved: {
    channel: "validation",
    type: "participant:approved",
    data: {
      participantId: "test-001",
      participantName: "Jane Doe",
      stepName: "Document Review",
    },
  },
  rejected: {
    channel: "validation",
    type: "participant:rejected",
    data: {
      participantId: "test-002",
      participantName: "John Smith",
      stepName: "Badge Approval",
    },
  },
  "sla-warning": {
    channel: "dashboard",
    type: "sla:warning",
    data: {
      participantId: "test-003",
      participantName: "Alice Johnson",
      stepName: "Security Check",
      remainingMinutes: 15,
    },
  },
  "sla-breached": {
    channel: "dashboard",
    type: "sla:breached",
    data: {
      participantId: "test-004",
      participantName: "Bob Wilson",
      stepName: "Final Approval",
      overdueMinutes: 30,
    },
  },
  notification: {
    channel: "notifications",
    type: "notification:new",
    data: {
      title: "Test Notification",
      message: "This is a test notification from the SSE test route.",
    },
  },
};

export function createSSETestRouter(getSessionFn: GetSessionFn, getTenantFn: GetTenantFn): Router {
  const router = Router();

  router.post("/api/sse-test/:eventName", async (req: Request, res: Response) => {
    // Auth — same pattern as SSE route
    let userId: string | undefined;
    try {
      const cookie = req.headers.cookie || "";
      const fakeReq = new globalThis.Request("http://localhost", {
        headers: { Cookie: cookie },
      });
      const session = await getSessionFn(fakeReq);
      const id = session.get("userId");
      if (id && typeof id === "string") userId = id;
    } catch {
      // auth failed
    }

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const tenantId = await getTenantFn(userId);
    if (!tenantId) {
      res.status(403).json({ error: "No tenant assigned" });
      return;
    }

    const eventName = req.params.eventName as string;
    const testEvent = TEST_EVENTS[eventName];

    if (!testEvent) {
      res.status(400).json({
        error: "Unknown event",
        available: Object.keys(TEST_EVENTS),
      });
      return;
    }

    const eventId = eventBus.publish(testEvent.channel, tenantId, testEvent.type, testEvent.data);

    res.json({
      ok: true,
      eventId,
      channel: testEvent.channel,
      type: testEvent.type,
    });
  });

  return router;
}
