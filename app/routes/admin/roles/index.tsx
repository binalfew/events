import { data, Link, useLoaderData } from "react-router";
import { Shield, Plus } from "lucide-react";

export const handle = { breadcrumb: "Roles" };

import { requirePermission } from "~/lib/require-auth.server";
import { listRoles } from "~/services/roles.server";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const roles = await listRoles(tenantId);
  return { roles };
}

export default function RolesListPage() {
  const { roles } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Roles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage roles and their permission assignments.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/roles/new">
            <Plus className="mr-2 h-4 w-4" />
            New Role
          </Link>
        </Button>
      </div>

      {roles.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No roles found"
          description="Roles will appear here once they are created."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div key={role.id} className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="font-semibold text-foreground">{role.name}</h3>
              {role.description && (
                <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
              )}
              <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800">
                  {role._count.userRoles} user{role._count.userRoles !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 font-medium text-purple-800">
                  {role._count.rolePermissions} permission
                  {role._count.rolePermissions !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <Link to={`/admin/roles/${role.id}/edit`} className="text-primary hover:underline">
                  Edit
                </Link>
                <Link
                  to={`/admin/roles/${role.id}/permissions`}
                  className="text-primary hover:underline"
                >
                  Permissions
                </Link>
                <Link
                  to={`/admin/roles/${role.id}/delete`}
                  className="text-destructive hover:underline"
                >
                  Delete
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
