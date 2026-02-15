import { data } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { reorderFieldsSchema } from "~/lib/schemas/custom-field";
import { reorderCustomFields, CustomFieldError } from "~/services/custom-fields.server";
import type { Route } from "./+types/api.v1.custom-fields.reorder";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw data({ error: "Method not allowed" }, { status: 405 });
  }

  const { user } = await requirePermission(request, "custom-field", "update");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const body = await request.json();
  const result = reorderFieldsSchema.safeParse(body);
  if (!result.success) {
    return data({ error: "Validation failed", details: result.error.format() }, { status: 400 });
  }

  try {
    const reorderResult = await reorderCustomFields(result.data, {
      userId: user.id,
      tenantId,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return data({ data: reorderResult });
  } catch (error) {
    if (error instanceof CustomFieldError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
