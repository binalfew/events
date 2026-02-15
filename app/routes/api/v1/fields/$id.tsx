import { data } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { updateFieldSchema } from "~/lib/schemas/field";
import { updateField, deleteField, FieldError } from "~/services/fields.server";
import type { Route } from "./+types/$id";

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params;

  switch (request.method) {
    case "PUT": {
      const { user } = await requirePermission(request, "field", "update");
      const tenantId = user.tenantId;
      if (!tenantId) {
        throw data({ error: "User is not associated with a tenant" }, { status: 403 });
      }

      const body = await request.json();
      const result = updateFieldSchema.safeParse(body);
      if (!result.success) {
        return data(
          { error: "Validation failed", details: result.error.format() },
          { status: 400 },
        );
      }

      try {
        const field = await updateField(id, result.data, {
          userId: user.id,
          tenantId,
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
        });

        return data({ data: field });
      } catch (error) {
        if (error instanceof FieldError) {
          return data({ error: error.message }, { status: error.status });
        }
        throw error;
      }
    }

    case "DELETE": {
      const { user } = await requirePermission(request, "field", "delete");
      const tenantId = user.tenantId;
      if (!tenantId) {
        throw data({ error: "User is not associated with a tenant" }, { status: 403 });
      }

      const url = new URL(request.url);
      const force = url.searchParams.get("force") === "true";

      try {
        const result = await deleteField(
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
        if (error instanceof FieldError) {
          return data({ error: error.message }, { status: error.status });
        }
        throw error;
      }
    }

    default:
      throw data({ error: "Method not allowed" }, { status: 405 });
  }
}
