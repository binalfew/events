import { data } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { updateFormTemplateSchema } from "~/lib/schemas/form-template";
import {
  getFormTemplate,
  updateFormTemplate,
  deleteFormTemplate,
  FormTemplateError,
} from "~/services/form-templates.server";
import type { Route } from "./+types/$id";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { id } = params;
  const { user, roles } = await requirePermission(request, "form", "read");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.VISUAL_FORM_DESIGNER, {
    tenantId,
    roles,
    userId: user.id,
  });
  if (!enabled) {
    throw data({ error: "Visual form designer is not enabled" }, { status: 403 });
  }

  try {
    const template = await getFormTemplate(id, tenantId);
    return data({ data: template });
  } catch (error) {
    if (error instanceof FormTemplateError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params;

  switch (request.method) {
    case "PUT": {
      const { user, roles } = await requirePermission(request, "form", "update");
      const tenantId = user.tenantId;
      if (!tenantId) {
        throw data({ error: "User is not associated with a tenant" }, { status: 403 });
      }

      const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.VISUAL_FORM_DESIGNER, {
        tenantId,
        roles,
        userId: user.id,
      });
      if (!enabled) {
        throw data({ error: "Visual form designer is not enabled" }, { status: 403 });
      }

      const body = await request.json();
      const result = updateFormTemplateSchema.safeParse(body);
      if (!result.success) {
        return data(
          { error: "Validation failed", details: result.error.format() },
          { status: 400 },
        );
      }

      try {
        const template = await updateFormTemplate(id, result.data, {
          userId: user.id,
          tenantId,
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
        });

        return data({ data: template });
      } catch (error) {
        if (error instanceof FormTemplateError) {
          return data({ error: error.message }, { status: error.status });
        }
        throw error;
      }
    }

    case "DELETE": {
      const { user, roles } = await requirePermission(request, "form", "delete");
      const tenantId = user.tenantId;
      if (!tenantId) {
        throw data({ error: "User is not associated with a tenant" }, { status: 403 });
      }

      const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.VISUAL_FORM_DESIGNER, {
        tenantId,
        roles,
        userId: user.id,
      });
      if (!enabled) {
        throw data({ error: "Visual form designer is not enabled" }, { status: 403 });
      }

      try {
        const result = await deleteFormTemplate(id, {
          userId: user.id,
          tenantId,
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
        });

        return data({ data: result });
      } catch (error) {
        if (error instanceof FormTemplateError) {
          return data({ error: error.message }, { status: error.status });
        }
        throw error;
      }
    }

    default:
      throw data({ error: "Method not allowed" }, { status: 405 });
  }
}
