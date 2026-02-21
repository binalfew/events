import { data, useFetcher, useLoaderData } from "react-router";

export const handle = { breadcrumb: "Feature Flags" };

import { requirePermission } from "~/lib/require-auth.server";
import { getAllFlags, setFlag } from "~/lib/feature-flags.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
import { Separator } from "~/components/ui/separator";
import type { Route } from "./+types/feature-flags";
import type { FlagWithStatus } from "~/lib/feature-flags.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, roles } = await requirePermission(request, "settings", "manage");

  const flags = await getAllFlags({
    tenantId: user.tenantId ?? undefined,
    roles,
    userId: user.id,
  });

  return { flags };
}

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "feature-flag", "manage");

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  const ctx = {
    userId: user.id,
    tenantId: user.tenantId ?? undefined,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    if (_action === "toggle-all") {
      const enabled = formData.get("enabled") === "true";
      const flags = await getAllFlags(ctx);
      await Promise.all(flags.map((f) => setFlag(f.key, { enabled }, ctx)));
      return data({ success: true });
    }

    const flagKey = formData.get("flagKey") as string;
    const enabled = formData.get("enabled") === "true";

    if (!flagKey) {
      return data({ error: "Flag key is required" }, { status: 400 });
    }

    await setFlag(flagKey, { enabled }, ctx);
    return data({ success: true });
  } catch {
    return data({ error: "Failed to update flag" }, { status: 500 });
  }
}

export default function FeatureFlagsPage() {
  const { flags } = useLoaderData<typeof loader>();
  const bulkFetcher = useFetcher();
  const isBulkSubmitting = bulkFetcher.state !== "idle";
  const enabledCount = flags.filter((f) => f.enabled).length;
  const allEnabled = enabledCount === flags.length;
  const allDisabled = enabledCount === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Feature Flags</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enable or disable features across the platform. Changes take effect immediately.
          </p>
        </div>
        {flags.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isBulkSubmitting || allEnabled}
              onClick={() =>
                bulkFetcher.submit({ _action: "toggle-all", enabled: "true" }, { method: "POST" })
              }
            >
              Enable All
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isBulkSubmitting || allDisabled}
              onClick={() =>
                bulkFetcher.submit({ _action: "toggle-all", enabled: "false" }, { method: "POST" })
              }
            >
              Disable All
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {flags.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No feature flags configured.</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Flags</CardTitle>
            <CardDescription>
              {flags.filter((f) => f.enabled).length} of {flags.length} flags globally enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {flags.map((flag) => (
                <FlagRow key={flag.key} flag={flag} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FlagRow({ flag }: { flag: FlagWithStatus }) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  // Optimistic: if submitting, show the target state
  const optimisticEnabled =
    isSubmitting && fetcher.formData ? fetcher.formData.get("enabled") === "true" : flag.enabled;

  const targetingInfo: string[] = [];
  if (flag.enabledForTenants.length > 0) {
    targetingInfo.push(
      `${flag.enabledForTenants.length} tenant${flag.enabledForTenants.length !== 1 ? "s" : ""}`,
    );
  }
  if (flag.enabledForRoles.length > 0) {
    targetingInfo.push(flag.enabledForRoles.join(", "));
  }
  if (flag.enabledForUsers.length > 0) {
    targetingInfo.push(
      `${flag.enabledForUsers.length} user${flag.enabledForUsers.length !== 1 ? "s" : ""}`,
    );
  }

  return (
    <div className="flex items-center justify-between py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <code className="text-sm font-medium text-foreground">{flag.key}</code>
          {targetingInfo.length > 0 && <Badge variant="outline">{targetingInfo.join(" | ")}</Badge>}
        </div>
        {flag.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{flag.description}</p>
        )}
      </div>
      <fetcher.Form method="POST" className="ml-4 shrink-0">
        <input type="hidden" name="flagKey" value={flag.key} />
        <input type="hidden" name="enabled" value={String(!optimisticEnabled)} />
        <Switch
          checked={optimisticEnabled}
          onCheckedChange={() => {
            fetcher.submit(
              { flagKey: flag.key, enabled: String(!optimisticEnabled) },
              { method: "POST" },
            );
          }}
          disabled={isSubmitting}
          aria-label={`Toggle ${flag.key}`}
        />
      </fetcher.Form>
    </div>
  );
}
