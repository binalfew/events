import { data, useLoaderData } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import { exportParticipants } from "~/services/bulk-export.server";
import { getEffectiveFields } from "~/services/fields.server";
import { ExportForm } from "~/components/bulk-operations/export-form";
import type { Route } from "./+types/export";

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

  // Load field definitions for field selector (includes global + event-specific)
  const [dynamicFields, participantTypes] = await Promise.all([
    getEffectiveFields(tenantId, eventId, "Participant"),
    prisma.participantType.findMany({
      where: { tenantId, eventId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return {
    eventId,
    dynamicFields: dynamicFields.map((f) => ({
      name: f.name,
      label: f.label,
      isFixed: false,
    })),
    participantTypes,
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "bulk-operations", "execute");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  if (_action === "export") {
    try {
      const fieldsJson = formData.get("fields") as string;
      const fields = fieldsJson ? JSON.parse(fieldsJson) : [];
      const filterStatus = (formData.get("filterStatus") as string) || undefined;
      const filterParticipantType = (formData.get("filterParticipantType") as string) || undefined;

      const csv = await exportParticipants(
        eventId,
        tenantId,
        {
          status: filterStatus,
          participantTypeId: filterParticipantType,
        },
        fields,
      );

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="participants-${eventId}.csv"`,
        },
      });
    } catch (error: any) {
      return data({ error: error.message ?? "Export failed" }, { status: 500 });
    }
  }

  return data({ error: "Unknown action" }, { status: 400 });
}

// ─── Component ───────────────────────────────────────────

export default function BulkExportPage() {
  const { eventId, dynamicFields, participantTypes } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Export Participants</h2>
        <p className="mt-1 text-sm text-muted-foreground">Export participant data as a CSV file.</p>
      </div>

      <ExportForm eventId={eventId} fields={dynamicFields} participantTypes={participantTypes} />
    </div>
  );
}
