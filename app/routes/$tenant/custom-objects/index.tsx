import { data, Form, Link, useLoaderData, redirect } from "react-router";
import { Plus, Trash2, Database, Box, ToggleLeft, ToggleRight } from "lucide-react";
import { requireAuth } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import {
  listDefinitions,
  createDefinition,
  deleteDefinition,
  updateDefinition,
  CustomObjectError,
} from "~/services/custom-objects.server";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { EmptyState } from "~/components/ui/empty-state";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/index";

export const handle = { breadcrumb: "Custom Objects" };

export async function loader({ request }: Route.LoaderArgs) {
  const { user, roles } = await requireAuth(request);
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.CUSTOM_OBJECTS, {
    tenantId,
    roles,
    userId: user.id,
  });
  if (!enabled) {
    throw data({ error: "Custom objects is not enabled" }, { status: 404 });
  }

  const definitions = await listDefinitions(tenantId, true);

  return { definitions, tenantId };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requireAuth(request);
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  try {
    switch (_action) {
      case "create": {
        const name = formData.get("name") as string;
        const slug = formData.get("slug") as string;
        const description = formData.get("description") as string;
        if (!name || !slug) {
          return data({ error: "Name and slug are required" }, { status: 400 });
        }
        await createDefinition({
          tenantId,
          name,
          slug,
          description: description || undefined,
          fields: [],
          createdBy: user.id,
        });
        break;
      }

      case "delete": {
        const definitionId = formData.get("definitionId") as string;
        await deleteDefinition(definitionId);
        break;
      }

      case "toggle-active": {
        const definitionId = formData.get("definitionId") as string;
        const isActive = formData.get("isActive") === "true";
        await updateDefinition(definitionId, { isActive: !isActive });
        break;
      }

      default:
        return data({ error: "Unknown action" }, { status: 400 });
    }

    return redirect(`/${params.tenant}/custom-objects`);
  } catch (error) {
    if (error instanceof CustomObjectError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export default function CustomObjectsPage() {
  const { definitions } = useLoaderData<typeof loader>();
  const basePrefix = useBasePrefix();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Custom Objects</h1>
          <p className="text-muted-foreground">
            Define custom entity types with dynamic fields for your tenant.
          </p>
        </div>
      </div>

      <Separator />

      {/* Create definition form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4" />
            New Object Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="flex flex-wrap items-end gap-4">
            <input type="hidden" name="_action" value="create" />
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Name
              </label>
              <Input id="name" name="name" required placeholder="e.g. Vehicles" className="w-48" />
            </div>
            <div>
              <label
                htmlFor="slug"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Slug
              </label>
              <Input
                id="slug"
                name="slug"
                required
                placeholder="e.g. vehicles"
                pattern="^[a-z][a-z0-9_-]*$"
                className="w-48"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Description
              </label>
              <Input
                id="description"
                name="description"
                placeholder="Optional description"
                className="w-64"
              />
            </div>
            <Button type="submit" size="sm">
              Create
            </Button>
          </Form>
        </CardContent>
      </Card>

      {/* Definitions list */}
      {definitions.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No custom objects"
          description="Create an object type to define custom entities with dynamic fields."
        />
      ) : (
        <div className="space-y-2">
          {definitions.map((def) => (
            <div
              key={def.id}
              className="flex items-center justify-between rounded-md border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Box className="size-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`${basePrefix}/custom-objects/${def.slug}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {def.name}
                    </Link>
                    <Badge variant="outline" className="text-xs">
                      {def.slug}
                    </Badge>
                    {!def.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(def.fields as unknown[]).length} field
                    {(def.fields as unknown[]).length !== 1 ? "s" : ""}
                    {" · "}
                    {def._count.records} record
                    {def._count.records !== 1 ? "s" : ""}
                    {def.description && ` · ${def.description}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Form method="post" className="inline">
                  <input type="hidden" name="_action" value="toggle-active" />
                  <input type="hidden" name="definitionId" value={def.id} />
                  <input type="hidden" name="isActive" value={String(def.isActive)} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    title={def.isActive ? "Deactivate" : "Activate"}
                  >
                    {def.isActive ? (
                      <ToggleRight className="size-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </Form>
                <Form method="post" className="inline">
                  <input type="hidden" name="_action" value="delete" />
                  <input type="hidden" name="definitionId" value={def.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </Form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
