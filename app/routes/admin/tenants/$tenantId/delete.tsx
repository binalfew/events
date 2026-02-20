import { data, redirect, useLoaderData, useActionData, Form, Link } from "react-router";

export const handle = { breadcrumb: "Delete Tenant" };

import { requirePermission } from "~/lib/require-auth.server";
import { getTenantWithCounts, deleteTenant, TenantError } from "~/services/tenants.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/delete";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requirePermission(request, "settings", "manage");

  const tenant = await getTenantWithCounts(params.tenantId);
  return { tenant };
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
    await deleteTenant(params.tenantId, ctx);
    return redirect("/admin/tenants");
  } catch (error) {
    if (error instanceof TenantError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export default function DeleteTenantPage() {
  const { tenant } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const canDelete = tenant._count.users === 0 && tenant._count.events === 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Delete Tenant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the details below before deleting this tenant.
        </p>
      </div>

      {actionData && "error" in actionData && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {actionData.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tenant.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-foreground">Email</span>
              <p className="text-muted-foreground">{tenant.email}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Phone</span>
              <p className="text-muted-foreground">{tenant.phone}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Plan</span>
              <p className="text-muted-foreground capitalize">{tenant.subscriptionPlan}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Users</span>
              <p className="text-muted-foreground">{tenant._count.users}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Events</span>
              <p className="text-muted-foreground">{tenant._count.events}</p>
            </div>
          </div>

          {!canDelete && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Cannot delete this tenant because it has {tenant._count.users} user(s) and{" "}
              {tenant._count.events} event(s). Remove all users and events first.
            </div>
          )}

          {canDelete && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              This action cannot be undone. The tenant and all associated data will be permanently
              removed.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {canDelete ? (
              <Form method="post">
                <Button type="submit" variant="destructive">
                  Delete Tenant
                </Button>
              </Form>
            ) : (
              <Button variant="destructive" disabled>
                Delete Tenant
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/admin/tenants">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
