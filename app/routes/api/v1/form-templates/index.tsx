import { data } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { createFormTemplateSchema } from "~/lib/schemas/form-template";
import {
  listFormTemplates,
  createFormTemplate,
  FormTemplateError,
} from "~/services/form-templates.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
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

  const url = new URL(request.url);
  const filters = {
    eventId: url.searchParams.get("eventId") ?? undefined,
    participantTypeId: url.searchParams.get("participantTypeId") ?? undefined,
    isActive: url.searchParams.get("isActive") === "false" ? false : undefined,
    search: url.searchParams.get("search") ?? undefined,
  };

  const templates = await listFormTemplates(tenantId, filters);

  return data({ data: templates, meta: { count: templates.length } });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw data({ error: "Method not allowed" }, { status: 405 });
  }

  const { user, roles } = await requirePermission(request, "form", "create");
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
  const result = createFormTemplateSchema.safeParse(body);
  if (!result.success) {
    return data({ error: "Validation failed", details: result.error.format() }, { status: 400 });
  }

  try {
    const template = await createFormTemplate(result.data, {
      userId: user.id,
      tenantId,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return data({ data: template }, { status: 201 });
  } catch (error) {
    if (error instanceof FormTemplateError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
