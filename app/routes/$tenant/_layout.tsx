import { data, useLoaderData } from "react-router";
import { requireAuth, toClientUser } from "~/lib/require-auth.server";
import { resolveTenant } from "~/lib/tenant.server";
import { getSidebarState, getSidebarGroupState } from "~/lib/sidebar.server";
import { getTheme } from "~/lib/theme.server";
import { getColorTheme } from "~/lib/color-theme.server";
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
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      accentColor: tenant.accentColor,
    },
    sidebarOpen: getSidebarState(request),
    sidebarGroups: getSidebarGroupState(request),
    theme: getTheme(request),
    colorTheme: getColorTheme(request),
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

/**
 * Convert a hex color (#rrggbb) to an oklch() CSS string.
 * Uses the sRGB → linear RGB → OKLab → OKLCH pipeline.
 */
function hexToOklch(hex: string): string | null {
  const c = hex.replace("#", "");
  if (c.length !== 6) return null;

  // sRGB [0-255] → linear RGB [0-1]
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lr = toLinear(parseInt(c.substring(0, 2), 16));
  const lg = toLinear(parseInt(c.substring(2, 4), 16));
  const lb = toLinear(parseInt(c.substring(4, 6), 16));

  // Linear RGB → OKLab
  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  // OKLab → OKLCH
  const C = Math.sqrt(a * a + b * b);
  const H = C < 0.0001 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(3)})`;
}

function contrastForeground(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "oklch(0.985 0 0)";
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // Perceived luminance formula
  return (r * 299 + g * 587 + b * 114) / 1000 > 150
    ? "oklch(0.145 0 0)" // dark foreground
    : "oklch(0.985 0 0)"; // light foreground
}

export default function TenantLayout() {
  const loaderData = useLoaderData<typeof loader>();
  const { tenant } = loaderData;

  // Build CSS variable overrides for tenant branding
  // Converts tenant hex colors to oklch() to match the theme system
  const primary = tenant.primaryColor ? hexToOklch(tenant.primaryColor) : null;
  const secondary = tenant.secondaryColor ? hexToOklch(tenant.secondaryColor) : null;
  const accent = tenant.accentColor ? hexToOklch(tenant.accentColor) : null;
  const primaryFg = tenant.primaryColor ? contrastForeground(tenant.primaryColor) : null;
  const secondaryFg = tenant.secondaryColor ? contrastForeground(tenant.secondaryColor) : null;
  const accentFg = tenant.accentColor ? contrastForeground(tenant.accentColor) : null;

  const brandingStyles = [
    primary && `--primary: ${primary};`,
    primaryFg && `--primary-foreground: ${primaryFg};`,
    primary && `--sidebar-primary: ${primary};`,
    primaryFg && `--sidebar-primary-foreground: ${primaryFg};`,
    primary && `--ring: ${primary};`,
    secondary && `--secondary: ${secondary};`,
    secondaryFg && `--secondary-foreground: ${secondaryFg};`,
    accent && `--accent: ${accent};`,
    accent && `--sidebar-accent: ${accent};`,
    accentFg && `--accent-foreground: ${accentFg};`,
    accentFg && `--sidebar-accent-foreground: ${accentFg};`,
  ]
    .filter(Boolean)
    .join(" ");

  const hasTenantBranding = Boolean(primary || secondary || accent);

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
      colorTheme={loaderData.colorTheme}
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
      hasTenantBranding={hasTenantBranding}
      headContent={
        hasTenantBranding ? (
          <style dangerouslySetInnerHTML={{ __html: `:root { ${brandingStyles} }` }} />
        ) : null
      }
    />
  );
}
