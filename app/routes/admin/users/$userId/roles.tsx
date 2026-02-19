import { data, useLoaderData, useActionData, Form, Link } from "react-router";

export const handle = { breadcrumb: "Assign Roles" };

import { requirePermission } from "~/lib/require-auth.server";
import { getUser, assignRoles, UserError } from "~/services/users.server";
import { listRoles } from "~/services/roles.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/roles";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const targetUser = await getUser(params.userId, tenantId);
  const allRoles = await listRoles(tenantId);
  const currentRoleIds = targetUser.userRoles.map((ur) => ur.roleId);

  return { targetUser, allRoles, currentRoleIds };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const roleIds = formData.getAll("roleIds") as string[];

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    await assignRoles(params.userId, roleIds, ctx);
    return data({ success: true });
  } catch (error) {
    if (error instanceof UserError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export default function UserRolesPage() {
  const { targetUser, allRoles, currentRoleIds } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Assign Roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage global role assignments for {targetUser.name || targetUser.email}.
        </p>
      </div>

      {actionData && "success" in actionData && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Roles updated successfully.
        </div>
      )}

      {actionData && "error" in actionData && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {actionData.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            {allRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles available.</p>
            ) : (
              <div className="space-y-3">
                {allRoles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="roleIds"
                      value={role.id}
                      defaultChecked={currentRoleIds.includes(role.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300"
                    />
                    <div>
                      <p className="font-medium text-foreground">{role.name}</p>
                      {role.description && (
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {role._count.userRoles} user{role._count.userRoles !== 1 ? "s" : ""}
                        {" · "}
                        {role._count.rolePermissions} permission
                        {role._count.rolePermissions !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit">Save Roles</Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/admin/users">Cancel</Link>
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
