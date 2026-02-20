import { useState } from "react";
import { data, useLoaderData, useActionData, Form, Link } from "react-router";

export const handle = { breadcrumb: "Permissions" };

import { requirePermission } from "~/lib/require-auth.server";
import { getRole, assignPermissions, RoleError } from "~/services/roles.server";
import { listPermissions } from "~/services/permissions.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/permissions";

// Semantic grouping of resources for display
const RESOURCE_GROUPS: Record<string, string[]> = {
  "Core Data": ["participant", "event", "field", "form", "section-template", "workflow"],
  Operations: [
    "bulk-operations",
    "event-clone",
    "check-in",
    "kiosk",
    "duplicates",
    "blacklist",
    "waitlist",
    "communication",
  ],
  Logistics: ["accommodation", "transport", "catering", "parking", "venue"],
  "Protocol & People": ["protocol", "bilateral", "incident", "staff", "delegation"],
  Content: ["survey", "certificate", "compliance"],
  Administration: [
    "settings",
    "feature-flag",
    "analytics",
    "command-center",
    "api-keys",
    "webhooks",
    "views",
    "custom-objects",
  ],
};

type Permission = { id: string; resource: string; action: string; description: string | null };

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const role = await getRole(params.roleId, tenantId);
  const allPermissions = await listPermissions();

  // Build a map of permissionId → access level from current role assignments
  const currentAssignments: Record<string, string> = {};
  for (const rp of role.rolePermissions) {
    currentAssignments[rp.permissionId] = rp.access;
  }

  // Group permissions by resource
  const byResource: Record<string, Permission[]> = {};
  for (const perm of allPermissions) {
    if (!byResource[perm.resource]) {
      byResource[perm.resource] = [];
    }
    byResource[perm.resource].push(perm);
  }

  return { role, byResource, currentAssignments };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const permissionIds = formData.getAll("permissionIds") as string[];
  const accessValues = formData.getAll("accessValues") as string[];

  // Build assignments array pairing permissionId with access level
  const assignments = permissionIds.map((permissionId, i) => ({
    permissionId,
    access: accessValues[i] || "any",
  }));

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    await assignPermissions(params.roleId, assignments, ctx);
    return data({ success: true });
  } catch (error) {
    if (error instanceof RoleError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export default function RolePermissionsPage() {
  const { role, byResource, currentAssignments } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  // State: permissionId → access level ("any" | "own"), or absent if unchecked
  const [assignments, setAssignments] = useState<Map<string, string>>(
    () => new Map(Object.entries(currentAssignments)),
  );

  function toggle(id: string) {
    setAssignments((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, "any");
      }
      return next;
    });
  }

  function setAccess(id: string, access: string) {
    setAssignments((prev) => {
      const next = new Map(prev);
      next.set(id, access);
      return next;
    });
  }

  function toggleGroup(resources: string[]) {
    const groupPermIds = resources.flatMap((r) => (byResource[r] ?? []).map((p) => p.id));
    const allChecked = groupPermIds.every((id) => assignments.has(id));
    setAssignments((prev) => {
      const next = new Map(prev);
      for (const id of groupPermIds) {
        if (allChecked) {
          next.delete(id);
        } else if (!next.has(id)) {
          next.set(id, "any");
        }
      }
      return next;
    });
  }

  function isGroupAllChecked(resources: string[]) {
    const groupPermIds = resources.flatMap((r) => (byResource[r] ?? []).map((p) => p.id));
    return groupPermIds.length > 0 && groupPermIds.every((id) => assignments.has(id));
  }

  function isGroupPartiallyChecked(resources: string[]) {
    const groupPermIds = resources.flatMap((r) => (byResource[r] ?? []).map((p) => p.id));
    const checkedCount = groupPermIds.filter((id) => assignments.has(id)).length;
    return checkedCount > 0 && checkedCount < groupPermIds.length;
  }

  // Collect resources not in any group (fallback)
  const groupedResources = new Set(Object.values(RESOURCE_GROUPS).flat());
  const ungrouped = Object.keys(byResource)
    .filter((r) => !groupedResources.has(r))
    .sort();

  const groups = { ...RESOURCE_GROUPS };
  if (ungrouped.length > 0) {
    groups["Other"] = ungrouped;
  }

  const totalPerms = Object.values(byResource).reduce((sum, perms) => sum + perms.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Manage Permissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure permissions for the <strong>{role.name}</strong> role.{" "}
          <span className="text-xs">
            ({assignments.size} of {totalPerms} selected)
          </span>
        </p>
      </div>

      {actionData && "success" in actionData && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Permissions updated successfully.
        </div>
      )}

      {actionData && "error" in actionData && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {actionData.error}
        </div>
      )}

      <Form method="post" className="space-y-4">
        {/* Hidden inputs for all assigned permissions with their access levels */}
        {Array.from(assignments.entries()).map(([id, access]) => (
          <span key={id}>
            <input type="hidden" name="permissionIds" value={id} />
            <input type="hidden" name="accessValues" value={access} />
          </span>
        ))}

        {Object.entries(groups).map(([groupName, resources]) => {
          // Filter to resources that actually have permissions
          const activeResources = resources.filter((r) => byResource[r]?.length);
          if (activeResources.length === 0) return null;

          return (
            <Card key={groupName}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{groupName}</CardTitle>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGroupAllChecked(activeResources)}
                      ref={(el) => {
                        if (el) el.indeterminate = isGroupPartiallyChecked(activeResources);
                      }}
                      onChange={() => toggleGroup(activeResources)}
                      className="h-3.5 w-3.5 rounded border-gray-300"
                    />
                    Toggle all
                  </label>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <table className="w-full text-sm">
                  <tbody>
                    {activeResources.map((resource) => {
                      const perms = byResource[resource];
                      return (
                        <tr key={resource} className="border-t first:border-0">
                          <td className="py-2 pr-4 font-medium text-foreground capitalize whitespace-nowrap align-top w-40">
                            {resource.replace("-", " ")}
                          </td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {perms.map((perm) => {
                                const isChecked = assignments.has(perm.id);
                                const access = assignments.get(perm.id) ?? "any";
                                return (
                                  <div key={perm.id} className="inline-flex items-center gap-1.5">
                                    <label className="inline-flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggle(perm.id)}
                                        className="h-3.5 w-3.5 rounded border-gray-300"
                                      />
                                      <span className="text-muted-foreground">{perm.action}</span>
                                    </label>
                                    {isChecked && (
                                      <select
                                        value={access}
                                        onChange={(e) => setAccess(perm.id, e.target.value)}
                                        className="h-5 rounded border border-gray-300 bg-background px-1 text-xs text-muted-foreground"
                                      >
                                        <option value="any">any</option>
                                        <option value="own">own</option>
                                      </select>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          );
        })}

        <div className="flex gap-3 pt-2">
          <Button type="submit">Save Permissions</Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/roles">Cancel</Link>
          </Button>
        </div>
      </Form>
    </div>
  );
}
