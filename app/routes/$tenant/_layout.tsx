import { useEffect } from "react";
import { data, useLoaderData } from "react-router";
import { requireAuth, toClientUser } from "~/lib/require-auth.server";
import { resolveTenant } from "~/lib/tenant.server";
import { getSidebarState, getSidebarGroupState } from "~/lib/sidebar.server";
import { getTheme } from "~/lib/theme.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { env } from "~/lib/env.server";
import { getUnreadCount, listNotifications } from "~/services/notifications.server";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import type { Route } from "./+types/_layout";

export async function loader({ request, params }: Route.LoaderArgs) {
  // 1. Resolve tenant by slug (throws 404 if not found)
  const tenant = await resolveTenant(params.tenant);

  // 2. Authenticate user
  const { user, roles } = await requireAuth(request);

  // 3. Ensure user belongs to this tenant
  if (user.tenantId !== tenant.id) {
    throw data({ error: "You do not have access to this tenant" }, { status: 403 });
  }

  // 4. Load feature flags and notifications (same as admin layout)
  const flagContext = {
    tenantId: tenant.id,
    roles,
    userId: user.id,
  };
  const sseEnabled = env.ENABLE_SSE && (await isFeatureEnabled("FF_SSE_UPDATES", flagContext));
  const notificationsEnabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.NOTIFICATIONS, flagContext);
  const searchEnabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.GLOBAL_SEARCH, flagContext);
  const shortcutsEnabled = await isFeatureEnabled(
    FEATURE_FLAG_KEYS.KEYBOARD_SHORTCUTS,
    flagContext,
  );
  const i18nEnabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.I18N, flagContext);
  const pwaEnabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.PWA, flagContext);
  const offlineEnabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.OFFLINE_MODE, flagContext);
  const customObjectsEnabled = await isFeatureEnabled(
    FEATURE_FLAG_KEYS.CUSTOM_OBJECTS,
    flagContext,
  );
  const analyticsEnabled = await isFeatureEnabled(
    FEATURE_FLAG_KEYS.ANALYTICS_DASHBOARD,
    flagContext,
  );
  const savedViewsEnabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.SAVED_VIEWS, flagContext);

  let unreadCount = 0;
  let recentNotifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
  }> = [];

  if (notificationsEnabled) {
    const [count, result] = await Promise.all([
      getUnreadCount(user.id),
      listNotifications(user.id, { page: 1, perPage: 10 }),
    ]);
    unreadCount = count;
    recentNotifications = result.notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  const enabledFeatures: Record<string, boolean> = {
    notifications: notificationsEnabled,
    savedViews: savedViewsEnabled,
    customObjects: customObjectsEnabled,
    analytics: analyticsEnabled,
  };

  return {
    user: { id: user.id, name: user.name, email: user.email },
    clientUser: toClientUser(user),
    roles,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.subscriptionPlan,
      logoUrl: tenant.logoUrl,
      brandTheme: tenant.brandTheme,
    },
    sidebarOpen: getSidebarState(request),
    sidebarGroups: getSidebarGroupState(request),
    theme: getTheme(request),
    sseEnabled,
    notificationsEnabled,
    searchEnabled,
    shortcutsEnabled,
    i18nEnabled,
    pwaEnabled,
    offlineEnabled,
    unreadCount,
    recentNotifications,
    enabledFeatures,
  };
}

export default function TenantLayout() {
  const loaderData = useLoaderData<typeof loader>();
  const { tenant } = loaderData;

  // Set data-brand attribute on <html> for static CSS theme matching.
  // Cleaned up when leaving the tenant layout or when brandTheme is empty.
  useEffect(() => {
    const el = document.documentElement;
    if (tenant.brandTheme) {
      el.setAttribute("data-brand", tenant.brandTheme);
    } else {
      el.removeAttribute("data-brand");
    }
    return () => {
      el.removeAttribute("data-brand");
    };
  }, [tenant.brandTheme]);

  return (
    <DashboardLayout
      basePrefix={`/${tenant.slug}`}
      tenant={{
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        logoUrl: tenant.logoUrl,
      }}
      user={loaderData.user}
      roles={loaderData.roles}
      sidebarOpen={loaderData.sidebarOpen}
      sidebarGroups={loaderData.sidebarGroups}
      theme={loaderData.theme}
      sseEnabled={loaderData.sseEnabled}
      notificationsEnabled={loaderData.notificationsEnabled}
      searchEnabled={loaderData.searchEnabled}
      shortcutsEnabled={loaderData.shortcutsEnabled}
      i18nEnabled={loaderData.i18nEnabled}
      pwaEnabled={loaderData.pwaEnabled}
      offlineEnabled={loaderData.offlineEnabled}
      unreadCount={loaderData.unreadCount}
      recentNotifications={loaderData.recentNotifications}
      enabledFeatures={loaderData.enabledFeatures}
    />
  );
}
