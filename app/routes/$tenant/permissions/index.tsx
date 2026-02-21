import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import { KeyRound, Plus, Pencil, Trash2 } from "lucide-react";

export const handle = { breadcrumb: "Permissions" };

import { requirePermission } from "~/lib/require-auth.server";
import { listPermissions } from "~/services/permissions.server";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requirePermission(request, "settings", "manage");
  const permissions = await listPermissions();
  return { permissions };
}

export default function PermissionsListPage() {
  const { permissions } = useLoaderData<typeof loader>();
  const [resourceFilter, setResourceFilter] = useState("");
  const basePrefix = useBasePrefix();

  const resources = [...new Set(permissions.map((p) => p.resource))].sort();

  const filtered = resourceFilter
    ? permissions.filter((p) => p.resource === resourceFilter)
    : permissions;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Permissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {permissions.length} permission{permissions.length !== 1 ? "s" : ""} across{" "}
            {resources.length} resource{resources.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <Button asChild>
          <Link to={`${basePrefix}/permissions/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Permission
          </Link>
        </Button>
      </div>

      {permissions.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No permissions found"
          description="Permissions will appear here once they are created."
        />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <NativeSelect
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
            >
              <NativeSelectOption value="">All resources ({permissions.length})</NativeSelectOption>
              {resources.map((r) => (
                <NativeSelectOption key={r} value={r}>
                  {r} ({permissions.filter((p) => p.resource === r).length})
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {resourceFilter && (
              <button
                onClick={() => setResourceFilter("")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear filter
              </button>
            )}
            <span className="ml-auto text-sm text-muted-foreground">
              Showing {filtered.length} of {permissions.length}
            </span>
          </div>

          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Roles</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((perm) => (
                  <tr key={perm.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">
                      {perm.resource}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {perm.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate">
                      {perm.description || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                        {perm._count.rolePermissions}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                          <Link to={`${basePrefix}/permissions/${perm.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Link to={`${basePrefix}/permissions/${perm.id}/delete`}>
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete</span>
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
