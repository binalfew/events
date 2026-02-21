import { data, redirect, useActionData, useLoaderData } from "react-router";

export const handle = { breadcrumb: "Edit Global Field" };

import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { updateField, FieldError } from "~/services/fields.server";
import { FieldForm } from "~/components/fields/FieldForm";
import type { Route } from "./+types/$fieldId";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "field", "read");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const { fieldId } = params;

  const field = await prisma.fieldDefinition.findFirst({
    where: { id: fieldId, tenantId, eventId: null },
  });
  if (!field) {
    throw data({ error: "Global field not found" }, { status: 404 });
  }

  return { field };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "field", "update");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const { fieldId } = params;
  const formData = await request.formData();

  const configRaw = formData.get("config") as string;
  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(configRaw || "{}");
  } catch {
    // ignore parse error, use empty config
  }

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
    await updateField(fieldId, input, ctx);
    return redirect(`/${params.tenant}/settings/fields`);
  } catch (error) {
    if (error instanceof FieldError) {
      return data({ formErrors: [error.message] }, { status: error.status });
    }
    throw error;
  }
}

export default function EditGlobalFieldPage() {
  const { field } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Edit Global Field: {field.label}</h2>

      <FieldForm field={field} errors={actionData as { formErrors?: string[] } | undefined} />
    </div>
  );
}
