import { data, Link, useLoaderData } from "react-router";
import { Building2, Plus } from "lucide-react";

export const handle = { breadcrumb: "Tenants" };

import { requirePermission } from "~/lib/require-auth.server";
import { listTenants } from "~/services/tenants.server";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requirePermission(request, "settings", "manage");

  const tenants = await listTenants();
  return { tenants };
}

const planColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-800",
  starter: "bg-blue-100 text-blue-800",
  professional: "bg-purple-100 text-purple-800",
  enterprise: "bg-green-100 text-green-800",
};

export default function TenantsListPage() {
  const { tenants } = useLoaderData<typeof loader>();
  const basePrefix = useBasePrefix();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tenants</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage organizations and their subscription plans.
          </p>
        </div>
        <Button asChild>
          <Link to={`${basePrefix}/tenants/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Tenant
          </Link>
        </Button>
      </div>

      {tenants.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No tenants found"
          description="Tenants will appear here once they are created."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground">{tenant.name}</h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${planColors[tenant.subscriptionPlan] ?? "bg-gray-100 text-gray-800"}`}
                >
                  {tenant.subscriptionPlan}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>{tenant.email}</p>
                <p>{tenant.phone}</p>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {tenant._count.users} user{tenant._count.users !== 1 ? "s" : ""}
                {" · "}
                {tenant._count.events} event{tenant._count.events !== 1 ? "s" : ""}
              </div>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <Link
                  to={`${basePrefix}/tenants/${tenant.id}/edit`}
                  className="text-primary hover:underline"
                >
                  Edit
                </Link>
                <Link
                  to={`${basePrefix}/tenants/${tenant.id}/delete`}
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
