import { data } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { publishFormTemplate, FormTemplateError } from "~/services/form-templates.server";
import type { Route } from "./+types/$id.publish";

export async function action({ request, params }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw data({ error: "Method not allowed" }, { status: 405 });
  }

  const { id } = params;
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

  try {
    const template = await publishFormTemplate(id, {
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
