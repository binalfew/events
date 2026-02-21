import { data, useLoaderData, useFetcher, Link } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import { listOperations, undoOperation } from "~/services/bulk-operations.server";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { OperationList } from "~/components/bulk-operations/operation-list";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/index";

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "bulk-operations", "execute");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.BULK_OPERATIONS, { tenantId });
  if (!enabled) {
    throw data({ error: "Bulk operations feature is not enabled" }, { status: 404 });
  }

  const eventId = params.eventId;
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    select: { id: true, name: true },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  const result = await listOperations(eventId, tenantId);

  return { event, operations: result.operations, meta: result.meta };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "bulk-operations", "execute");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  try {
    if (_action === "undo") {
      const operationId = formData.get("operationId") as string;
      const result = await undoOperation(operationId, {
        userId: user.id,
        tenantId,
      });
      return data({ success: true, ...result });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return data(
      { error: error.message ?? "Operation failed" },
      { status: error.statusCode ?? 500 },
    );
  }
}

// ─── Component ───────────────────────────────────────────

export default function BulkOperationsIndexPage() {
  const { event, operations } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const basePrefix = useBasePrefix();

  const handleUndo = (operationId: string) => {
    if (
      !confirm(
        "Are you sure you want to undo this operation? This will remove all imported participants.",
      )
    ) {
      return;
    }
    fetcher.submit({ _action: "undo", operationId }, { method: "POST" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bulk Operations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Import, export, and manage participants in bulk for {event.name}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`${basePrefix}/events/${event.id}/bulk-operations/import`}>
            <Button>Import</Button>
          </Link>
          <Link to={`${basePrefix}/events/${event.id}/bulk-operations/export`}>
            <Button variant="outline">Export</Button>
          </Link>
        </div>
      </div>

      <Separator />

      <OperationList operations={operations as any} eventId={event.id} onUndo={handleUndo} />
    </div>
  );
}
