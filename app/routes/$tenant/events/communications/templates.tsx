import { data, useLoaderData, useFetcher } from "react-router";
import { useState } from "react";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import {
  createTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,
  cloneTemplate,
} from "~/services/message-templates.server";
import { createTemplateSchema, updateTemplateSchema } from "~/lib/schemas/message-template";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { TemplateList } from "~/components/communications/template-list";
import { TemplateEditor } from "~/components/communications/template-editor";
import { Plus } from "lucide-react";
import type { Route } from "./+types/templates";

export const handle = { breadcrumb: "Templates" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "communication", "broadcast");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.COMMUNICATION_HUB, { tenantId });
  if (!enabled) {
    throw data({ error: "Communication Hub is not enabled" }, { status: 404 });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const channel = url.searchParams.get("channel") ?? undefined;

  const result = await listTemplates(tenantId, { page, channel, perPage: 50 });

  return {
    templates: result.templates,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "communication", "broadcast");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  const ctx = { userId: user.id, tenantId };

  try {
    if (_action === "create") {
      const input = {
        name: formData.get("name") as string,
        subject: (formData.get("subject") as string) || undefined,
        body: formData.get("body") as string,
        channel: formData.get("channel") as string,
        variables: JSON.parse((formData.get("variables") as string) || "[]"),
      };
      const parsed = createTemplateSchema.parse(input);
      await createTemplate(parsed, ctx);
      return data({ success: true });
    }

    if (_action === "update") {
      const id = formData.get("id") as string;
      const input = {
        name: (formData.get("name") as string) || undefined,
        subject: (formData.get("subject") as string) || undefined,
        body: (formData.get("body") as string) || undefined,
        channel: (formData.get("channel") as string) || undefined,
        variables: formData.has("variables")
          ? JSON.parse(formData.get("variables") as string)
          : undefined,
      };
      const parsed = updateTemplateSchema.parse(input);
      await updateTemplate(id, parsed, ctx);
      return data({ success: true });
    }

    if (_action === "delete") {
      const id = formData.get("id") as string;
      await deleteTemplate(id, ctx);
      return data({ success: true });
    }

    if (_action === "clone") {
      const id = formData.get("id") as string;
      const newName = formData.get("newName") as string;
      await cloneTemplate(id, newName, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return data(
      { error: error.message ?? "Operation failed" },
      { status: error.statusCode ?? 500 },
    );
  }
}

// ─── Component ────────────────────────────────────────────

export default function CrossEventTemplatesPage() {
  const { templates } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingTemplate, setEditingTemplate] = useState<(typeof templates)[number] | null>(null);

  function handleEdit(template: (typeof templates)[number]) {
    setEditingTemplate(template);
    setMode("edit");
  }

  function handleDelete(template: { id: string; name: string }) {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    fetcher.submit({ _action: "delete", id: template.id }, { method: "POST" });
  }

  function handleClone(template: { id: string; name: string }) {
    const newName = prompt("Name for the clone:", `${template.name} (copy)`);
    if (!newName) return;
    fetcher.submit({ _action: "clone", id: template.id, newName }, { method: "POST" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Message Templates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage reusable message templates for broadcasts.
          </p>
        </div>
        {mode === "list" && (
          <Button onClick={() => setMode("create")}>
            <Plus className="mr-2 size-4" /> New Template
          </Button>
        )}
      </div>

      <Separator />

      {mode === "list" ? (
        <TemplateList
          templates={templates as any}
          onEdit={handleEdit as any}
          onDelete={handleDelete}
          onClone={handleClone}
        />
      ) : (
        <fetcher.Form method="POST">
          <input type="hidden" name="_action" value={mode === "create" ? "create" : "update"} />
          {editingTemplate && <input type="hidden" name="id" value={editingTemplate.id} />}
          <TemplateEditor
            defaultValues={
              editingTemplate
                ? {
                    name: editingTemplate.name,
                    subject: editingTemplate.subject ?? undefined,
                    body: editingTemplate.body,
                    channel: editingTemplate.channel,
                    variables: editingTemplate.variables,
                  }
                : undefined
            }
            mode={mode === "create" ? "create" : "edit"}
            onCancel={() => {
              setMode("list");
              setEditingTemplate(null);
            }}
          />
        </fetcher.Form>
      )}
    </div>
  );
}
