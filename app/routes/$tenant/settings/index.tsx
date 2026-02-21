import { data, Form, useLoaderData, useActionData } from "react-router";

export const handle = { breadcrumb: "Settings" };

import { requirePermission } from "~/lib/require-auth.server";
import { getAllSettings, setSetting, deleteSetting } from "~/lib/settings.server";
import { upsertSettingSchema, SETTING_CATEGORIES } from "~/lib/schemas/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import type { Route } from "./+types/index";
import type { ResolvedSetting } from "~/lib/settings.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;

  const settingsByCategory = await getAllSettings(tenantId ? { tenantId } : undefined);

  return { settingsByCategory };
}

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "settings", "manage");

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  const ctx = {
    userId: user.id,
    tenantId: user.tenantId ?? undefined,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  if (_action === "upsert") {
    const raw = {
      key: formData.get("key"),
      value: formData.get("value"),
      type: formData.get("type") || "string",
      category: formData.get("category"),
      scope: formData.get("scope") || "global",
      scopeId: formData.get("scopeId") || "",
    };

    const result = upsertSettingSchema.safeParse(raw);
    if (!result.success) {
      return data({ error: result.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
    }

    await setSetting(result.data, ctx);
    return data({ success: true });
  }

  if (_action === "delete") {
    const key = formData.get("key") as string;
    const scope = formData.get("scope") as string;
    const scopeId = (formData.get("scopeId") as string) || "";
    await deleteSetting(key, scope, scopeId, ctx);
    return data({ success: true });
  }

  return data({ error: "Unknown action" }, { status: 400 });
}

const CATEGORY_INFO: Record<string, { title: string; description: string }> = {
  general: { title: "General", description: "Basic application settings" },
  auth: { title: "Authentication", description: "Login and session settings" },
  email: { title: "Email", description: "Email delivery configuration" },
  upload: { title: "Upload", description: "File upload limits and policies" },
  workflow: { title: "Workflow", description: "Workflow automation settings" },
};

export default function SettingsPage() {
  const { settingsByCategory } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const categories = SETTING_CATEGORIES;
  const hasAnySettings = Object.values(settingsByCategory).some((s) => s.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">General Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage application settings across scopes. More specific scopes override broader ones.
        </p>
      </div>

      {actionData && "error" in actionData && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {actionData.error}
        </div>
      )}

      {actionData && "success" in actionData && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          Setting saved successfully.
        </div>
      )}

      <Separator />

      {!hasAnySettings ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No settings configured yet. Default values will be used.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const settings = settingsByCategory[category] ?? [];
            const info = CATEGORY_INFO[category] ?? {
              title: category,
              description: "",
            };

            if (settings.length === 0) return null;

            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{info.title}</CardTitle>
                  <CardDescription>{info.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {settings.map((setting) => (
                      <SettingRow key={setting.key} setting={setting} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add New Setting */}
      <Card>
        <CardHeader>
          <CardTitle>Add Setting</CardTitle>
          <CardDescription>Create or update a setting value.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="POST" className="space-y-4">
            <input type="hidden" name="_action" value="upsert" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label htmlFor="key">Key</Label>
                <Input id="key" name="key" placeholder="e.g. upload.max_file_size_mb" required />
              </div>
              <div>
                <Label htmlFor="value">Value</Label>
                <Input id="value" name="value" placeholder="Setting value" required />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_INFO[c]?.title ?? c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  name="type"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div>
                <Label htmlFor="scope">Scope</Label>
                <select
                  id="scope"
                  name="scope"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="global">Global</option>
                  <option value="tenant">Tenant</option>
                  <option value="event">Event</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <Label htmlFor="scopeId">Scope ID</Label>
                <Input id="scopeId" name="scopeId" placeholder="Leave empty for global" />
              </div>
            </div>
            <Button type="submit">Save Setting</Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({ setting }: { setting: ResolvedSetting }) {
  const scopeLabel =
    setting.scope === "default"
      ? "Default"
      : setting.scope.charAt(0).toUpperCase() + setting.scope.slice(1);

  const scopeVariant =
    setting.scope === "default" || setting.scope === "global" ? "secondary" : "outline";

  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <code className="text-sm font-medium text-foreground">{setting.key}</code>
          <Badge variant={scopeVariant}>{scopeLabel}</Badge>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{setting.value}</p>
      </div>
      {setting.scope !== "default" && (
        <Form method="POST" className="ml-4 shrink-0">
          <input type="hidden" name="_action" value="delete" />
          <input type="hidden" name="key" value={setting.key} />
          <input type="hidden" name="scope" value={setting.scope} />
          <input type="hidden" name="scopeId" value={setting.scopeId} />
          <Button type="submit" variant="ghost" size="sm">
            Reset
          </Button>
        </Form>
      )}
    </div>
  );
}
