import { data, Form, Link, redirect, useLoaderData, useSearchParams } from "react-router";

export const handle = { breadcrumb: "Fields" };
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import {
  listFields,
  deleteField,
  reorderFields,
  getFieldDataCount,
  FieldError,
} from "~/services/fields.server";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Separator } from "~/components/ui/separator";
import { FieldTable } from "~/components/fields/FieldTable";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/index";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "field", "read");
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
  const dataType = url.searchParams.get("dataType") || undefined;

  // Fetch event-scoped and global fields separately
  const [eventFields, globalFields] = await Promise.all([
    listFields(tenantId, { scope: "event", eventId, dataType }),
    listFields(tenantId, { scope: "global", dataType }),
  ]);

  // Filter out global fields whose name is overridden by an event-scoped field
  const eventFieldNames = new Set(eventFields.map((f) => f.name));
  const nonOverriddenGlobals = globalFields.filter((f) => !eventFieldNames.has(f.name));

  // Combine: event fields + non-overridden global fields
  const fields = [...eventFields, ...nonOverriddenGlobals].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const readOnlyIds = nonOverriddenGlobals.map((f) => f.id);

  // Get data counts for each field (for delete warnings)
  const dataCounts: Record<string, number> = {};
  for (const field of fields) {
    dataCounts[field.id] = await getFieldDataCount(field.id, tenantId);
  }

  return { event, fields, dataCounts, readOnlyIds };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "field", "delete");
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
      await deleteField(fieldId, ctx, { force });
      return redirect(`/${params.tenant}/events/${eventId}/fields`);
    }

    if (_action === "reorder") {
      const fieldId = formData.get("fieldId") as string;
      const direction = formData.get("direction") as "up" | "down";

      // Get all fields in current order
      const fields = await listFields(tenantId, { eventId });
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

      await reorderFields({ fieldIds }, ctx);
      return redirect(`/${params.tenant}/events/${eventId}/fields`);
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    if (error instanceof FieldError) {
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
  const { event, fields, dataCounts, readOnlyIds } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const basePrefix = useBasePrefix();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Fields</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Define the fields for this event. {fields.length} field
            {fields.length !== 1 ? "s" : ""} defined.
          </p>
        </div>
        <Link to={`${basePrefix}/events/${event.id}/fields/new`}>
          <Button>Add Field</Button>
        </Link>
      </div>

      <Separator />

      {/* Filters */}
      <Form method="get" className="flex flex-wrap items-end gap-4">
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
        {searchParams.get("dataType") && (
          <Link
            to={`${basePrefix}/events/${event.id}/fields`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </Link>
        )}
      </Form>

      {readOnlyIds.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Fields marked <span className="font-medium">Global</span> are managed in{" "}
          <Link to={`${basePrefix}/settings/fields`} className="underline hover:text-foreground">
            Settings &gt; Fields
          </Link>
          . To override a global field for this event, create an event field with the same name.
        </p>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <FieldTable
          fields={fields}
          dataCounts={dataCounts}
          eventId={event.id}
          readOnlyIds={new Set(readOnlyIds)}
        />
      </div>
    </div>
  );
}
