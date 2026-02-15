import { data, Link, redirect, useActionData, useLoaderData } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { updateDynamicField, DynamicFieldError } from "~/services/dynamic-fields.server";
import { FieldForm } from "~/components/dynamic-fields/FieldForm";
import type { Route } from "./+types/$fieldId";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "dynamic-field", "read");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const { eventId, fieldId } = params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    select: { id: true, name: true },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  const field = await prisma.fieldDefinition.findFirst({
    where: { id: fieldId, tenantId, eventId },
  });
  if (!field) {
    throw data({ error: "Field not found" }, { status: 404 });
  }

  const participantTypes = await prisma.participantType.findMany({
    where: { eventId, tenantId },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return { event, field, participantTypes };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "dynamic-field", "update");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const { eventId, fieldId } = params;
  const formData = await request.formData();

  const configRaw = formData.get("config") as string;
  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(configRaw || "{}");
  } catch {
    // ignore parse error, use empty config
  }

  // Clean undefined values from config
  const cleanConfig: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined && value !== null && value !== "") {
      cleanConfig[key] = value;
    }
  }

  const entityType = (formData.get("entityType") as string) || "Participant";
  const dataType = formData.get("dataType") as string;

  const input = {
    name: formData.get("name") as string,
    label: formData.get("label") as string,
    description: (formData.get("description") as string) || undefined,
    entityType: entityType as "Participant" | "Event",
    participantTypeId: (formData.get("participantTypeId") as string) || undefined,
    dataType: dataType as
      | "TEXT"
      | "LONG_TEXT"
      | "NUMBER"
      | "BOOLEAN"
      | "DATE"
      | "DATETIME"
      | "ENUM"
      | "MULTI_ENUM"
      | "EMAIL"
      | "URL"
      | "PHONE"
      | "FILE"
      | "IMAGE"
      | "REFERENCE"
      | "FORMULA"
      | "JSON",
    isRequired: formData.get("isRequired") === "true",
    isUnique: formData.get("isUnique") === "true",
    isSearchable: formData.get("isSearchable") === "true",
    isFilterable: formData.get("isFilterable") === "true",
    defaultValue: (formData.get("defaultValue") as string) || undefined,
    config: cleanConfig,
    validation: [] as Record<string, unknown>[],
  };

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    await updateDynamicField(fieldId, input, ctx);
    return redirect(`/admin/events/${eventId}/fields`);
  } catch (error) {
    if (error instanceof DynamicFieldError) {
      return data({ formErrors: [error.message] }, { status: error.status });
    }
    throw error;
  }
}

export default function EditFieldPage() {
  const { event, field, participantTypes } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/admin/events" className="hover:text-foreground">
            Events
          </Link>
          <span>/</span>
          <Link to={`/admin/events/${event.id}/fields`} className="hover:text-foreground">
            {event.name}
          </Link>
          <span>/</span>
          <span>Edit: {field.label}</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold text-foreground">Edit Field</h2>
      </div>

      <FieldForm
        eventId={event.id}
        participantTypes={participantTypes}
        field={field}
        errors={actionData as { formErrors?: string[] } | undefined}
      />
    </div>
  );
}
