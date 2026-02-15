import { data } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { participantSearchSchema } from "~/lib/schemas/field-query";
import { filterWithFields } from "~/services/field-query.server";
import { FieldError } from "~/services/fields.server";
import type { Route } from "./+types/search";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw data({ error: "Method not allowed" }, { status: 405 });
  }

  const { user } = await requirePermission(request, "participant", "read");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const body = await request.json();
  const result = participantSearchSchema.safeParse(body);
  if (!result.success) {
    return data({ error: "Validation failed", details: result.error.format() }, { status: 400 });
  }

  try {
    const { data: participants, total } = await filterWithFields({
      ...result.data,
      tenantId,
    });

    return data({
      data: participants,
      meta: {
        total,
        limit: result.data.limit,
        offset: result.data.offset,
        hasMore: result.data.offset + result.data.limit < total,
      },
    });
  } catch (error) {
    if (error instanceof FieldError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
