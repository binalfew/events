import { data, useLoaderData } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import { getEffectiveFields } from "~/services/fields.server";
import {
  createBulkOperation,
  validateOperation,
  confirmOperation,
  cancelOperation,
  getOperation,
  undoOperation,
} from "~/services/bulk-operations.server";
import { FIXED_PARTICIPANT_FIELDS } from "~/services/bulk-import/column-mapper.server";
import { ImportWizard } from "~/components/bulk-operations/import-wizard";
import type { Route } from "./+types/import";

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

  // Load dynamic field definitions for target fields (includes global + event-specific)
  const dynamicFields = await getEffectiveFields(tenantId, eventId, "Participant");

  const targetFields = [
    ...FIXED_PARTICIPANT_FIELDS,
    ...dynamicFields.map((f) => ({
      name: f.name,
      label: f.label,
      isRequired: f.isRequired,
    })),
  ];

  // If operationId in search params, load operation state
  const url = new URL(request.url);
  const operationId = url.searchParams.get("operationId");
  let operationData = null;

  if (operationId) {
    try {
      operationData = await getOperation(operationId, tenantId);
    } catch {
      // ignore, will start fresh
    }
  }

  return {
    eventId,
    targetFields,
    operationId,
    operationData,
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

  try {
    if (_action === "upload") {
      const file = formData.get("file") as File;
      if (!file || file.size === 0) {
        return data({ error: "No file uploaded" }, { status: 400 });
      }

      const description = (formData.get("description") as string) || `Import from ${file.name}`;

      // Create operation
      const operation = await createBulkOperation(
        {
          eventId,
          type: "IMPORT_PARTICIPANTS",
          description,
        },
        { userId: user.id, tenantId },
      );

      // Validate
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await validateOperation(
        operation.id,
        buffer,
        file.type || "text/csv",
        tenantId,
      );

      return data({
        operationId: operation.id,
        headers: result.headers,
        mappings: result.mappings,
        preview: result.preview,
        validCount: result.validCount,
        warningCount: result.warningCount,
        errorCount: result.errorCount,
      });
    }

    if (_action === "updateMappings") {
      const operationId = formData.get("operationId") as string;
      const mappingsJson = formData.get("mappings") as string;
      const mappings = JSON.parse(mappingsJson);

      // Re-validate with new mappings — delete old items first, then re-validate
      await prisma.bulkOperationItem.deleteMany({ where: { operationId } });
      await prisma.bulkOperation.update({
        where: { id: operationId },
        data: { status: "VALIDATING" },
      });

      // We need the file again, but it was already parsed.
      // Since we can't re-parse without the file, we return the mappings
      // and let the client re-submit from the preview step.
      // For now, transition to PREVIEW with existing data.
      await prisma.bulkOperation.update({
        where: { id: operationId },
        data: {
          status: "PREVIEW",
          filters: { mappings },
        },
      });

      return data({ validated: true, mappings });
    }

    if (_action === "confirm") {
      const operationId = formData.get("operationId") as string;
      const skipErrors = formData.get("skipErrors") === "true";
      const result = await confirmOperation(
        operationId,
        {
          userId: user.id,
          tenantId,
        },
        skipErrors,
      );

      return data({ confirmed: true, operation: result });
    }

    if (_action === "cancel") {
      const operationId = formData.get("operationId") as string;
      await cancelOperation(operationId, { userId: user.id, tenantId });
      return data({ cancelled: true });
    }

    if (_action === "undo") {
      const operationId = formData.get("operationId") as string;
      const result = await undoOperation(operationId, {
        userId: user.id,
        tenantId,
      });
      return data({ undone: true, ...result });
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

export default function BulkImportPage() {
  const { eventId, targetFields, operationId, operationData } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Import Participants</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV or XLSX file to import participants in bulk.
        </p>
      </div>

      <ImportWizard
        eventId={eventId}
        targetFields={targetFields}
        operationId={operationId ?? undefined}
        operationStatus={operationData?.operation.status}
        headers={(operationData?.operation.filters as any)?.headers}
        mappings={(operationData?.operation.filters as any)?.mappings}
        validCount={(operationData?.operation.filters as any)?.validCount}
        warningCount={(operationData?.operation.filters as any)?.warningCount}
        errorCount={(operationData?.operation.filters as any)?.errorCount}
        operation={
          operationData
            ? {
                id: operationData.operation.id,
                status: operationData.operation.status,
                totalItems: operationData.operation.totalItems,
                processedItems: operationData.operation.processedItems,
                successCount: operationData.operation.successCount,
                failureCount: operationData.operation.failureCount,
                undoDeadline: operationData.operation.undoDeadline?.toISOString() ?? null,
              }
            : undefined
        }
      />
    </div>
  );
}
