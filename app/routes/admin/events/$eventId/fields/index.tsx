import { data, Form, Link, redirect, useLoaderData, useSearchParams } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import {
  listDynamicFields,
  deleteDynamicField,
  reorderDynamicFields,
  getFieldDataCount,
  DynamicFieldError,
} from "~/services/dynamic-fields.server";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Separator } from "~/components/ui/separator";
import { FieldTable } from "~/components/dynamic-fields/FieldTable";
import type { Route } from "./+types/index";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "dynamic-field", "read");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    select: { id: true, name: true },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const participantTypeId = url.searchParams.get("participantTypeId") || undefined;
  const dataType = url.searchParams.get("dataType") || undefined;

  const fields = await listDynamicFields(tenantId, {
    eventId,
    participantTypeId,
    dataType,
  });

  const participantTypes = await prisma.participantType.findMany({
    where: { eventId, tenantId },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  // Get data counts for each field (for delete warnings)
  const dataCounts: Record<string, number> = {};
  for (const field of fields) {
    dataCounts[field.id] = await getFieldDataCount(field.id, tenantId);
  }

  return { event, fields, participantTypes, dataCounts };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "dynamic-field", "delete");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const formData = await request.formData();
  const _action = formData.get("_action");

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    if (_action === "delete") {
      const fieldId = formData.get("fieldId") as string;
      const force = formData.get("force") === "true";
      await deleteDynamicField(fieldId, ctx, { force });
      return redirect(`/admin/events/${eventId}/fields`);
    }

    if (_action === "reorder") {
      const fieldId = formData.get("fieldId") as string;
      const direction = formData.get("direction") as "up" | "down";

      // Get all fields in current order
      const fields = await listDynamicFields(tenantId, { eventId });
      const currentIndex = fields.findIndex((f) => f.id === fieldId);
      if (currentIndex === -1) {
        return data({ error: "Field not found" }, { status: 404 });
      }

      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= fields.length) {
        return data({ error: "Cannot move further" }, { status: 400 });
      }

      // Build new order: swap the two fields
      const fieldIds = fields.map((f) => f.id);
      [fieldIds[currentIndex], fieldIds[swapIndex]] = [fieldIds[swapIndex], fieldIds[currentIndex]];

      await reorderDynamicFields({ fieldIds }, ctx);
      return redirect(`/admin/events/${eventId}/fields`);
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    if (error instanceof DynamicFieldError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

const FIELD_DATA_TYPES = [
  "TEXT",
  "LONG_TEXT",
  "NUMBER",
  "BOOLEAN",
  "DATE",
  "DATETIME",
  "ENUM",
  "MULTI_ENUM",
  "EMAIL",
  "URL",
  "PHONE",
  "FILE",
  "IMAGE",
  "REFERENCE",
  "FORMULA",
  "JSON",
] as const;

export default function FieldsListPage() {
  const { event, fields, participantTypes, dataCounts } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/admin/events" className="hover:text-foreground">
              Events
            </Link>
            <span>/</span>
            <span>{event.name}</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold text-foreground">Fields</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Define the fields for this event. {fields.length} field
            {fields.length !== 1 ? "s" : ""} defined.
          </p>
        </div>
        <Link to={`/admin/events/${event.id}/fields/new`}>
          <Button>Add Field</Button>
        </Link>
      </div>

      <Separator />

      {/* Filters */}
      <Form method="get" className="flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="participantTypeId"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Participant Type
          </label>
          <NativeSelect
            id="participantTypeId"
            name="participantTypeId"
            defaultValue={searchParams.get("participantTypeId") ?? ""}
          >
            <NativeSelectOption value="">All types</NativeSelectOption>
            {participantTypes.map((pt) => (
              <NativeSelectOption key={pt.id} value={pt.id}>
                {pt.name} ({pt.code})
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label
            htmlFor="dataType"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Data Type
          </label>
          <NativeSelect
            id="dataType"
            name="dataType"
            defaultValue={searchParams.get("dataType") ?? ""}
          >
            <NativeSelectOption value="">All types</NativeSelectOption>
            {FIELD_DATA_TYPES.map((dt) => (
              <NativeSelectOption key={dt} value={dt}>
                {dt.replace(/_/g, " ")}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
        {(searchParams.get("participantTypeId") || searchParams.get("dataType")) && (
          <Link
            to={`/admin/events/${event.id}/fields`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </Link>
        )}
      </Form>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <FieldTable fields={fields} dataCounts={dataCounts} eventId={event.id} />
      </div>
    </div>
  );
}
