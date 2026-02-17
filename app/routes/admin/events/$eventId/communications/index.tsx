import { data, useLoaderData, useFetcher } from "react-router";
import { useState } from "react";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import {
  createBroadcast,
  listBroadcasts,
  sendBroadcast,
  scheduleBroadcast,
  cancelBroadcast,
} from "~/services/broadcasts.server";
import { countAudience } from "~/services/audience-filter.server";
import { listTemplates } from "~/services/message-templates.server";
import { createBroadcastSchema } from "~/lib/schemas/broadcast";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { BroadcastList } from "~/components/communications/broadcast-list";
import { BroadcastComposer } from "~/components/communications/broadcast-composer";
import { Plus } from "lucide-react";
import type { Route } from "./+types/index";

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

  const eventId = params.eventId;
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    select: { id: true, name: true },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  const [broadcastResult, templateResult, participantTypes] = await Promise.all([
    listBroadcasts(eventId, tenantId),
    listTemplates(tenantId, { perPage: 100 }),
    prisma.participantType.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    event,
    broadcasts: broadcastResult.broadcasts,
    broadcastTotal: broadcastResult.total,
    templates: templateResult.templates,
    participantTypes,
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
  const ctx = { userId: user.id, tenantId };

  try {
    if (_action === "countAudience") {
      const eventId = formData.get("eventId") as string;
      const participantTypes = JSON.parse((formData.get("participantTypes") as string) || "[]");
      const statuses = JSON.parse((formData.get("statuses") as string) || "[]");
      const count = await countAudience(eventId, tenantId, { participantTypes, statuses });
      return data({ count });
    }

    if (_action === "send") {
      const input = {
        eventId: formData.get("eventId") as string,
        subject: (formData.get("subject") as string) || undefined,
        body: formData.get("body") as string,
        channel: formData.get("channel") as string,
        filters: JSON.parse((formData.get("filters") as string) || "{}"),
        templateId: (formData.get("templateId") as string) || undefined,
        isEmergency: formData.get("isEmergency") === "true",
        priority: formData.get("isEmergency") === "true" ? 1 : 5,
      };
      const parsed = createBroadcastSchema.parse(input);
      const broadcast = await createBroadcast(parsed, ctx);
      await sendBroadcast(broadcast.id, ctx);
      return data({ success: true, broadcastId: broadcast.id });
    }

    if (_action === "schedule") {
      const input = {
        eventId: formData.get("eventId") as string,
        subject: (formData.get("subject") as string) || undefined,
        body: formData.get("body") as string,
        channel: formData.get("channel") as string,
        filters: JSON.parse((formData.get("filters") as string) || "{}"),
        templateId: (formData.get("templateId") as string) || undefined,
        isEmergency: formData.get("isEmergency") === "true",
        priority: formData.get("isEmergency") === "true" ? 1 : 5,
        scheduledAt: formData.get("scheduledAt") as string,
      };
      const parsed = createBroadcastSchema.parse(input);
      const broadcast = await createBroadcast(parsed, ctx);
      if (parsed.scheduledAt) {
        await scheduleBroadcast(broadcast.id, parsed.scheduledAt, ctx);
      }
      return data({ success: true, broadcastId: broadcast.id });
    }

    if (_action === "cancel") {
      const broadcastId = formData.get("broadcastId") as string;
      const reason = (formData.get("reason") as string) || undefined;
      await cancelBroadcast(broadcastId, reason, ctx);
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

export default function CommunicationsIndexPage() {
  const { event, broadcasts, templates, participantTypes } = useLoaderData<typeof loader>();
  const [showComposer, setShowComposer] = useState(false);
  const cancelFetcher = useFetcher();

  function handleCancel(broadcast: { id: string }) {
    if (!confirm("Are you sure you want to cancel this broadcast?")) return;
    cancelFetcher.submit({ _action: "cancel", broadcastId: broadcast.id }, { method: "POST" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Communications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Send broadcasts to participants at {event.name}.
          </p>
        </div>
        {!showComposer && (
          <Button onClick={() => setShowComposer(true)}>
            <Plus className="mr-2 size-4" /> New Broadcast
          </Button>
        )}
      </div>

      <Separator />

      {showComposer ? (
        <BroadcastComposer
          eventId={event.id}
          templates={templates as any}
          participantTypes={participantTypes}
          onCancel={() => setShowComposer(false)}
        />
      ) : (
        <BroadcastList broadcasts={broadcasts as any} eventId={event.id} onCancel={handleCancel} />
      )}
    </div>
  );
}
