import { data, Form, Link, redirect, useLoaderData } from "react-router";
import { Plus, Copy, Trash2, Pencil, FileText } from "lucide-react";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import {
  listFormTemplates,
  createFormTemplate,
  cloneFormTemplate,
  deleteFormTemplate,
  FormTemplateError,
} from "~/services/form-templates.server";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { EmptyState } from "~/components/ui/empty-state";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/index";

export const handle = { breadcrumb: "Forms" };

export async function loader({ request, params }: Route.LoaderArgs) {
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

  const eventId = params.eventId;
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    select: { id: true, name: true },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  const templates = await listFormTemplates(tenantId, { eventId });

  return { event, templates };
}

export async function action({ request, params }: Route.ActionArgs) {
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

  const eventId = params.eventId;
  const formData = await request.formData();
  const _action = formData.get("_action");

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    if (_action === "create") {
      const name = formData.get("name") as string;
      if (!name) {
        return data({ error: "Name is required" }, { status: 400 });
      }
      const template = await createFormTemplate(
        {
          eventId,
          name,
          definition: {
            pages: [
              {
                id: crypto.randomUUID(),
                title: "Page 1",
                order: 0,
                sections: [
                  {
                    id: crypto.randomUUID(),
                    title: "Section 1",
                    columns: 2,
                    collapsible: false,
                    order: 0,
                    fields: [],
                  },
                ],
              },
            ],
          },
        },
        ctx,
      );
      return redirect(`/${params.tenant}/events/${eventId}/forms/${template.id}`);
    }

    if (_action === "clone") {
      const formId = formData.get("formId") as string;
      const newName = formData.get("newName") as string;
      if (!formId || !newName) {
        return data({ error: "Form ID and new name are required" }, { status: 400 });
      }
      await cloneFormTemplate(formId, newName, ctx);
      return redirect(`/${params.tenant}/events/${eventId}/forms`);
    }

    if (_action === "delete") {
      const formId = formData.get("formId") as string;
      if (!formId) {
        return data({ error: "Form ID is required" }, { status: 400 });
      }
      await deleteFormTemplate(formId, ctx);
      return redirect(`/${params.tenant}/events/${eventId}/forms`);
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    if (error instanceof FormTemplateError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export default function FormsListPage() {
  const { event, templates } = useLoaderData<typeof loader>();
  const basePrefix = useBasePrefix();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Forms</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Design registration forms for {event.name}. {templates.length} form
            {templates.length !== 1 ? "s" : ""} defined.
          </p>
        </div>
        <Form method="post">
          <input type="hidden" name="_action" value="create" />
          <input type="hidden" name="name" value={`Form ${templates.length + 1}`} />
          <Button type="submit">
            <Plus className="size-4" />
            New Form
          </Button>
        </Form>
      </div>

      <Separator />

      {templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No forms created yet"
          description="Create your first form to start designing the registration experience."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Version</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Participant Type</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Last Modified</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      to={`${basePrefix}/events/${event.id}/forms/${template.id}`}
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
                    <Badge variant={template.publishedAt ? "default" : "secondary"}>
                      {template.publishedAt ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">v{template.version}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                    {template.participantType?.name ?? "All"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`${basePrefix}/events/${event.id}/forms/${template.id}`}>
                        <Button variant="ghost" size="icon-xs" title="Edit">
                          <Pencil className="size-3" />
                        </Button>
                      </Link>
                      <Form method="post" className="inline">
                        <input type="hidden" name="_action" value="clone" />
                        <input type="hidden" name="formId" value={template.id} />
                        <input type="hidden" name="newName" value={`${template.name} (Copy)`} />
                        <Button variant="ghost" size="icon-xs" type="submit" title="Clone">
                          <Copy className="size-3" />
                        </Button>
                      </Form>
                      <Form
                        method="post"
                        className="inline"
                        onSubmit={(e) => {
                          if (!confirm(`Delete "${template.name}"?`)) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="_action" value="delete" />
                        <input type="hidden" name="formId" value={template.id} />
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          type="submit"
                          title="Delete"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </Form>
                    </div>
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
