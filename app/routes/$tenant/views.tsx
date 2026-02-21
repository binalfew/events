import { data, Form, useLoaderData, redirect } from "react-router";
import {
  Plus,
  Trash2,
  Star,
  Share2,
  Copy,
  Table2,
  LayoutGrid,
  Calendar,
  Image,
  Eye,
} from "lucide-react";
import { requireAuth } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import {
  listViews,
  createView,
  updateView,
  deleteView,
  duplicateView,
  SavedViewError,
} from "~/services/saved-views.server";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { EmptyState } from "~/components/ui/empty-state";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/views";

export const handle = { breadcrumb: "Saved Views" };

const VIEW_TYPE_ICONS: Record<string, typeof Table2> = {
  TABLE: Table2,
  KANBAN: LayoutGrid,
  CALENDAR: Calendar,
  GALLERY: Image,
};

export async function loader({ request }: Route.LoaderArgs) {
  const { user, roles } = await requireAuth(request);
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.SAVED_VIEWS, {
    tenantId,
    roles,
    userId: user.id,
  });
  if (!enabled) {
    throw data({ error: "Saved views is not enabled" }, { status: 404 });
  }

  // List all entity types the user has views for
  const entityTypes = ["Participant", "Event", "Workflow"];
  const viewsByEntity: Record<string, Awaited<ReturnType<typeof listViews>>> = {};

  for (const entityType of entityTypes) {
    const views = await listViews(tenantId, user.id, entityType);
    if (views.length > 0) {
      viewsByEntity[entityType] = views;
    }
  }

  return { viewsByEntity, userId: user.id };
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
      case "create-view": {
        const name = formData.get("name") as string;
        const entityType = formData.get("entityType") as string;
        const viewType = (formData.get("viewType") as string) || "TABLE";
        const isShared = formData.get("isShared") === "on";

        if (!name || !entityType) {
          return data({ error: "Name and entity type are required" }, { status: 400 });
        }

        await createView({
          tenantId,
          userId: user.id,
          name,
          entityType,
          viewType: viewType as "TABLE" | "KANBAN" | "CALENDAR" | "GALLERY",
          isShared,
        });
        break;
      }

      case "delete-view": {
        const viewId = formData.get("viewId") as string;
        await deleteView(viewId, user.id);
        break;
      }

      case "duplicate-view": {
        const viewId = formData.get("viewId") as string;
        await duplicateView(viewId, user.id, tenantId);
        break;
      }

      case "toggle-default": {
        const viewId = formData.get("viewId") as string;
        const isDefault = formData.get("isDefault") === "true";
        await updateView(viewId, user.id, { isDefault: !isDefault });
        break;
      }

      case "toggle-shared": {
        const viewId = formData.get("viewId") as string;
        const isShared = formData.get("isShared") === "true";
        await updateView(viewId, user.id, { isShared: !isShared });
        break;
      }

      default:
        return data({ error: "Unknown action" }, { status: 400 });
    }

    return redirect(`/${params.tenant}/views`);
  } catch (error) {
    if (error instanceof SavedViewError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export default function SavedViewsPage() {
  const { viewsByEntity, userId } = useLoaderData<typeof loader>();
  const entityTypes = Object.keys(viewsByEntity);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved Views</h1>
          <p className="text-muted-foreground">Create and manage custom views for your data.</p>
        </div>
      </div>

      <Separator />

      {/* Create view form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4" />
            Create New View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="flex flex-wrap items-end gap-4">
            <input type="hidden" name="_action" value="create-view" />
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                View Name
              </label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g. Active Participants"
                className="w-60"
              />
            </div>
            <div>
              <label
                htmlFor="entityType"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Entity Type
              </label>
              <NativeSelect id="entityType" name="entityType">
                <NativeSelectOption value="Participant">Participant</NativeSelectOption>
                <NativeSelectOption value="Event">Event</NativeSelectOption>
                <NativeSelectOption value="Workflow">Workflow</NativeSelectOption>
              </NativeSelect>
            </div>
            <div>
              <label
                htmlFor="viewType"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                View Type
              </label>
              <NativeSelect id="viewType" name="viewType">
                <NativeSelectOption value="TABLE">Table</NativeSelectOption>
                <NativeSelectOption value="KANBAN">Kanban</NativeSelectOption>
                <NativeSelectOption value="CALENDAR">Calendar</NativeSelectOption>
                <NativeSelectOption value="GALLERY">Gallery</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="flex items-center gap-2">
              <input id="isShared" name="isShared" type="checkbox" className="size-4" />
              <label htmlFor="isShared" className="text-xs text-muted-foreground">
                Shared
              </label>
            </div>
            <Button type="submit" size="sm">
              Create View
            </Button>
          </Form>
        </CardContent>
      </Card>

      {/* Views by entity type */}
      {entityTypes.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="No saved views"
          description="Create a view to save your custom filters, sorts, and column configurations."
        />
      ) : (
        <div className="space-y-6">
          {entityTypes.map((entityType) => {
            const views = viewsByEntity[entityType];
            return (
              <div key={entityType}>
                <h3 className="mb-3 text-lg font-semibold">{entityType} Views</h3>
                <div className="space-y-2">
                  {views.map((view) => {
                    const Icon = VIEW_TYPE_ICONS[view.viewType] ?? Table2;
                    const isOwner = view.userId === userId;
                    return (
                      <div
                        key={view.id}
                        className="flex items-center justify-between rounded-md border px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="size-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{view.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {view.viewType.toLowerCase()}
                              {view.owner?.name && !isOwner && ` · by ${view.owner.name}`}
                            </p>
                          </div>
                          {view.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                          {view.isShared && (
                            <Badge variant="outline" className="text-xs">
                              Shared
                            </Badge>
                          )}
                        </div>

                        {isOwner && (
                          <div className="flex items-center gap-1">
                            <Form method="post" className="inline">
                              <input type="hidden" name="_action" value="toggle-default" />
                              <input type="hidden" name="viewId" value={view.id} />
                              <input
                                type="hidden"
                                name="isDefault"
                                value={String(view.isDefault)}
                              />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                title="Toggle default"
                              >
                                <Star
                                  className={`size-3.5 ${view.isDefault ? "fill-yellow-400 text-yellow-400" : ""}`}
                                />
                              </Button>
                            </Form>
                            <Form method="post" className="inline">
                              <input type="hidden" name="_action" value="toggle-shared" />
                              <input type="hidden" name="viewId" value={view.id} />
                              <input type="hidden" name="isShared" value={String(view.isShared)} />
                              <Button type="submit" variant="ghost" size="sm" title="Toggle shared">
                                <Share2
                                  className={`size-3.5 ${view.isShared ? "text-blue-500" : ""}`}
                                />
                              </Button>
                            </Form>
                            <Form method="post" className="inline">
                              <input type="hidden" name="_action" value="duplicate-view" />
                              <input type="hidden" name="viewId" value={view.id} />
                              <Button type="submit" variant="ghost" size="sm" title="Duplicate">
                                <Copy className="size-3.5" />
                              </Button>
                            </Form>
                            <Form method="post" className="inline">
                              <input type="hidden" name="_action" value="delete-view" />
                              <input type="hidden" name="viewId" value={view.id} />
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
