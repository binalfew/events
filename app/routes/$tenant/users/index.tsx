import { data, Link, useLoaderData } from "react-router";
import { Users, Plus } from "lucide-react";

export const handle = { breadcrumb: "Users" };

import { requirePermission } from "~/lib/require-auth.server";
import { listUsers } from "~/services/users.server";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, roles } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const isSuperAdmin = roles.includes("ADMIN");
  const users = await listUsers(isSuperAdmin ? undefined : tenantId);
  return { users, isSuperAdmin };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-yellow-100 text-yellow-800",
  LOCKED: "bg-red-100 text-red-800",
};

export default function UsersListPage() {
  const { users, isSuperAdmin } = useLoaderData<typeof loader>();
  const base = useBasePrefix();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Users</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage user accounts and role assignments.
          </p>
        </div>
        <Button asChild>
          <Link to={`${base}/users/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New User
          </Link>
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Users will appear here once they are created."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Username</th>
                {isSuperAdmin && (
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tenant</th>
                )}
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Roles</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {u.name || <span className="text-muted-foreground italic">No name</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.username}</td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3 text-muted-foreground">{u.tenant?.name ?? "—"}</td>
                  )}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[u.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.userRoles.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">None</span>
                      ) : (
                        u.userRoles.map((ur) => (
                          <span
                            key={ur.id}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                          >
                            {ur.role.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`${base}/users/${u.id}/edit`}
                        className="text-primary hover:underline"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`${base}/users/${u.id}/roles`}
                        className="text-primary hover:underline"
                      >
                        Roles
                      </Link>
                      <Link
                        to={`${base}/users/${u.id}/delete`}
                        className="text-destructive hover:underline"
                      >
                        Delete
                      </Link>
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
