import { data, useLoaderData, useActionData, Form, Link } from "react-router";

export const handle = { breadcrumb: "Permissions" };

import { requirePermission } from "~/lib/require-auth.server";
import { getRole, listPermissions, assignPermissions, RoleError } from "~/services/roles.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/permissions";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const role = await getRole(params.roleId, tenantId);
  const allPermissions = await listPermissions();
  const currentPermissionIds = role.rolePermissions.map((rp) => rp.permissionId);

  // Group permissions by resource
  const grouped: Record<string, typeof allPermissions> = {};
  for (const perm of allPermissions) {
    if (!grouped[perm.resource]) {
      grouped[perm.resource] = [];
    }
    grouped[perm.resource].push(perm);
  }

  return { role, grouped, currentPermissionIds };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const permissionIds = formData.getAll("permissionIds") as string[];

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    await assignPermissions(params.roleId, permissionIds, ctx);
    return data({ success: true });
  } catch (error) {
    if (error instanceof RoleError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export default function RolePermissionsPage() {
  const { role, grouped, currentPermissionIds } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const resources = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Manage Permissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure permissions for the {role.name} role.
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold capitalize">{resource}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {grouped[resource].map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        name="permissionIds"
                        value={perm.id}
                        defaultChecked={currentPermissionIds.includes(perm.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-foreground">{perm.action}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
