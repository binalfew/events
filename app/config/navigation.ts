import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bell,
  ClipboardList,
  CalendarDays,
  BarChart3,
  Settings,
  Eye,
  Database,
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
};

export type NavItem = {
  title: string;
  tKey?: string;
  url: string;
  icon: LucideIcon;
  end?: boolean;
  roles?: string[];
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
        },
        {
          title: "My Assignments",
          tKey: "myAssignments",
          url: `${basePrefix}/assignments`,
          icon: ClipboardList,
        },
        { title: "Saved Views", tKey: "savedViews", url: `${basePrefix}/views`, icon: Eye },
        {
          title: "Custom Objects",
          tKey: "customObjects",
          url: `${basePrefix}/custom-objects`,
          icon: Database,
        },
        { title: "Analytics", tKey: "analytics", url: `${basePrefix}/analytics`, icon: BarChart3 },
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
          roles: ["ADMIN"],
        },
        {
          title: "Series",
          url: `${basePrefix}/series`,
          icon: Layers,
          roles: ["ADMIN"],
        },
        {
          title: "Tenants",
          url: `${basePrefix}/tenants`,
          icon: Building2,
          roles: ["ADMIN"],
        },
        {
          title: "Users",
          url: `${basePrefix}/users`,
          icon: Users,
          roles: ["ADMIN"],
        },
        {
          title: "Roles",
          url: `${basePrefix}/roles`,
          icon: Shield,
          roles: ["ADMIN"],
        },
        {
          title: "Permissions",
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
          roles: ["ADMIN"],
          children: [
            { title: "General", tKey: "general", url: `${basePrefix}/settings`, end: true },
            { title: "Fields", tKey: "fields", url: `${basePrefix}/settings/fields` },
            {
              title: "Feature Flags",
              tKey: "featureFlags",
              url: `${basePrefix}/settings/feature-flags`,
            },
            { title: "API Keys", tKey: "apiKeys", url: `${basePrefix}/settings/api-keys` },
            { title: "Webhooks", tKey: "webhooks", url: `${basePrefix}/settings/webhooks` },
          ],
        },
      ],
    },
  ];
}

export function getVisibleGroups(roles: string[], basePrefix = "/admin"): NavGroup[] {
  return buildNavigationGroups(basePrefix)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.some((r) => roles.includes(r))),
    }))
    .filter((group) => group.items.length > 0);
}
