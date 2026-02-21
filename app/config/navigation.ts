import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bell,
  ClipboardList,
  CalendarDays,
  BarChart3,
  Settings,
  Layers,
  Building2,
  Users,
  Shield,
  KeyRound,
} from "lucide-react";

export type NavChild = {
  title: string;
  tKey?: string;
  url: string;
  end?: boolean;
  roles?: string[];
  featureFlag?: string;
};

export type NavItem = {
  title: string;
  tKey?: string;
  url: string;
  icon: LucideIcon;
  end?: boolean;
  roles?: string[];
  featureFlag?: string;
  children?: NavChild[];
};

export type NavGroup = {
  label: string;
  tKey?: string;
  items: NavItem[];
};

/**
 * Build navigation groups with the given base prefix.
 * - `/admin` for super-admin routes
 * - `/<slug>` for tenant-scoped routes
 */
export function buildNavigationGroups(basePrefix: string): NavGroup[] {
  return [
    {
      label: "Main",
      tKey: "main",
      items: [
        {
          title: "Dashboard",
          tKey: "dashboard",
          url: basePrefix,
          icon: LayoutDashboard,
          end: true,
        },
        {
          title: "Notifications",
          tKey: "notifications",
          url: `${basePrefix}/notifications`,
          icon: Bell,
          featureFlag: "notifications",
        },
        {
          title: "Assignments",
          tKey: "myAssignments",
          url: `${basePrefix}/assignments`,
          icon: ClipboardList,
        },
        {
          title: "Analytics",
          tKey: "analytics",
          url: `${basePrefix}/analytics`,
          icon: BarChart3,
          featureFlag: "analytics",
        },
      ],
    },
    {
      label: "Management",
      tKey: "management",
      items: [
        {
          title: "Events",
          tKey: "events",
          url: `${basePrefix}/events`,
          icon: CalendarDays,
          roles: ["ADMIN", "TENANT_ADMIN"],
        },
        {
          title: "Series",
          tKey: "series",
          url: `${basePrefix}/series`,
          icon: Layers,
          roles: ["ADMIN", "TENANT_ADMIN"],
        },
        {
          title: "Tenants",
          tKey: "tenants",
          url: `${basePrefix}/tenants`,
          icon: Building2,
          roles: ["ADMIN"],
        },
        {
          title: "Users",
          tKey: "users",
          url: `${basePrefix}/users`,
          icon: Users,
          roles: ["ADMIN", "TENANT_ADMIN"],
        },
        {
          title: "Roles",
          tKey: "roles",
          url: `${basePrefix}/roles`,
          icon: Shield,
          roles: ["ADMIN"],
        },
        {
          title: "Permissions",
          tKey: "permissions",
          url: `${basePrefix}/permissions`,
          icon: KeyRound,
          roles: ["ADMIN"],
        },
      ],
    },
    {
      label: "Administration",
      tKey: "administration",
      items: [
        {
          title: "Settings",
          tKey: "settings",
          url: `${basePrefix}/settings`,
          icon: Settings,
          roles: ["ADMIN", "TENANT_ADMIN"],
          children: [
            { title: "General", tKey: "general", url: `${basePrefix}/settings`, end: true },
            {
              title: "Organization",
              tKey: "organization",
              url: `${basePrefix}/settings/organization`,
            },
            { title: "Fields", tKey: "fields", url: `${basePrefix}/settings/fields` },
            {
              title: "Feature Flags",
              tKey: "featureFlags",
              url: `${basePrefix}/settings/feature-flags`,
              roles: ["ADMIN"],
            },
            {
              title: "API Keys",
              tKey: "apiKeys",
              url: `${basePrefix}/settings/api-keys`,
              roles: ["ADMIN"],
            },
            {
              title: "Webhooks",
              tKey: "webhooks",
              url: `${basePrefix}/settings/webhooks`,
              roles: ["ADMIN"],
            },
            {
              title: "Saved Views",
              tKey: "savedViews",
              url: `${basePrefix}/views`,
              featureFlag: "savedViews",
            },
            {
              title: "Custom Objects",
              tKey: "customObjects",
              url: `${basePrefix}/custom-objects`,
              featureFlag: "customObjects",
            },
          ],
        },
      ],
    },
  ];
}

export function getVisibleGroups(
  roles: string[],
  basePrefix = "/admin",
  enabledFeatures?: Record<string, boolean>,
): NavGroup[] {
  return buildNavigationGroups(basePrefix)
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => !item.roles || item.roles.some((r) => roles.includes(r)))
        .filter((item) => !item.featureFlag || enabledFeatures?.[item.featureFlag])
        .map((item) => ({
          ...item,
          children: item.children?.filter(
            (child) =>
              (!child.roles || child.roles.some((r) => roles.includes(r))) &&
              (!child.featureFlag || enabledFeatures?.[child.featureFlag]),
          ),
        })),
    }))
    .filter((group) => group.items.length > 0);
}
