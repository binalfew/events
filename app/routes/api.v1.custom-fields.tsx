import { data } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { createCustomFieldSchema } from "~/lib/schemas/custom-field";
import {
  listCustomFields,
  createCustomField,
  CustomFieldError,
} from "~/services/custom-fields.server";
import type { Route } from "./+types/api.v1.custom-fields";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "custom-field", "read");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters = {
    eventId: url.searchParams.get("eventId") ?? undefined,
    participantTypeId: url.searchParams.get("participantTypeId") ?? undefined,
    entityType: url.searchParams.get("entityType") ?? undefined,
    dataType: url.searchParams.get("dataType") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
  };

  const fields = await listCustomFields(tenantId, filters);

  return data({ data: fields, meta: { count: fields.length } });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw data({ error: "Method not allowed" }, { status: 405 });
  }

  const { user } = await requirePermission(request, "custom-field", "create");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const body = await request.json();
  const result = createCustomFieldSchema.safeParse(body);
  if (!result.success) {
    return data({ error: "Validation failed", details: result.error.format() }, { status: 400 });
  }

  try {
    const field = await createCustomField(result.data, {
      userId: user.id,
      tenantId,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return data({ data: field }, { status: 201 });
  } catch (error) {
    if (error instanceof CustomFieldError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
