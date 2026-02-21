import { data, redirect, useLoaderData, useActionData, Form, Link } from "react-router";

export const handle = { breadcrumb: "Delete Role" };

import { requirePermission } from "~/lib/require-auth.server";
import { getRoleWithCounts, deleteRole, RoleError } from "~/services/roles.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/delete";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const role = await getRoleWithCounts(params.roleId, tenantId);
  return { role };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    await deleteRole(params.roleId, ctx);
    return redirect(`/${params.tenant}/roles`);
  } catch (error) {
    if (error instanceof RoleError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export default function DeleteRolePage() {
  const { role } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const basePrefix = useBasePrefix();

  const canDelete = role._count.userRoles === 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Delete Role</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the details below before deleting this role.
        </p>
      </div>

      {actionData && "error" in actionData && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {actionData.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{role.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {role.description && (
              <div className="col-span-2">
                <span className="font-medium text-foreground">Description</span>
                <p className="text-muted-foreground">{role.description}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-foreground">Users</span>
              <p className="text-muted-foreground">{role._count.userRoles}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Permissions</span>
              <p className="text-muted-foreground">{role._count.rolePermissions}</p>
            </div>
          </div>

          {!canDelete && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Cannot delete this role because it has {role._count.userRoles} assigned user(s).
              Unassign all users first.
            </div>
          )}

          {canDelete && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              This action cannot be undone. The role and all its permission assignments will be
              permanently removed.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {canDelete ? (
              <Form method="post">
                <Button type="submit" variant="destructive">
                  Delete Role
                </Button>
              </Form>
            ) : (
              <Button variant="destructive" disabled>
                Delete Role
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to={`${basePrefix}/roles`}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
