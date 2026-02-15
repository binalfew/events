import { data } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { updateDynamicFieldSchema } from "~/lib/schemas/dynamic-field";
import {
  updateDynamicField,
  deleteDynamicField,
  DynamicFieldError,
} from "~/services/dynamic-fields.server";
import type { Route } from "./+types/$id";

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params;

  switch (request.method) {
    case "PUT": {
      const { user } = await requirePermission(request, "dynamic-field", "update");
      const tenantId = user.tenantId;
      if (!tenantId) {
        throw data({ error: "User is not associated with a tenant" }, { status: 403 });
      }

      const body = await request.json();
      const result = updateDynamicFieldSchema.safeParse(body);
      if (!result.success) {
        return data(
          { error: "Validation failed", details: result.error.format() },
          { status: 400 },
        );
      }

      try {
        const field = await updateDynamicField(id, result.data, {
          userId: user.id,
          tenantId,
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
        });

        return data({ data: field });
      } catch (error) {
        if (error instanceof DynamicFieldError) {
          return data({ error: error.message }, { status: error.status });
        }
        throw error;
      }
    }

    case "DELETE": {
      const { user } = await requirePermission(request, "dynamic-field", "delete");
      const tenantId = user.tenantId;
      if (!tenantId) {
        throw data({ error: "User is not associated with a tenant" }, { status: 403 });
      }

      const url = new URL(request.url);
      const force = url.searchParams.get("force") === "true";

      try {
        const result = await deleteDynamicField(
          id,
          {
            userId: user.id,
            tenantId,
            ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
            userAgent: request.headers.get("user-agent") ?? undefined,
          },
          { force },
        );

        return data({ data: result });
      } catch (error) {
        if (error instanceof DynamicFieldError) {
          return data({ error: error.message }, { status: error.status });
        }
        throw error;
      }
    }

    default:
      throw data({ error: "Method not allowed" }, { status: 405 });
  }
}
