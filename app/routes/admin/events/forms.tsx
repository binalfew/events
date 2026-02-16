import { data, Link, useLoaderData } from "react-router";
import { FileText } from "lucide-react";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { listFormTemplates } from "~/services/form-templates.server";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import type { Route } from "./+types/forms";

export const handle = { breadcrumb: "Forms" };

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

  const templates = await listFormTemplates(tenantId);

  return { templates };
}

export default function CrossEventFormsPage() {
  const { templates } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">All Forms</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View all form templates across events. {templates.length} form
          {templates.length !== 1 ? "s" : ""} total.
        </p>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No forms created yet"
          description="Navigate to an event to create your first form template."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Event</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Version</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Last Modified</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/events/${template.event.id}/forms/${template.id}`}
                      className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {template.name}
                    </Link>
                    {template.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {template.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/events/${template.event.id}/forms`}
                      className="text-sm text-muted-foreground hover:text-primary hover:underline"
                    >
                      {template.event.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={template.publishedAt ? "default" : "secondary"}>
                      {template.publishedAt ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">v{template.version}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
