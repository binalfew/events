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

export const navigationGroups: NavGroup[] = [
  {
    label: "Main",
    tKey: "main",
    items: [
      { title: "Dashboard", tKey: "dashboard", url: "/admin", icon: LayoutDashboard, end: true },
      { title: "Notifications", tKey: "notifications", url: "/admin/notifications", icon: Bell },
      {
        title: "My Assignments",
        tKey: "myAssignments",
        url: "/admin/assignments",
        icon: ClipboardList,
      },
      { title: "Saved Views", tKey: "savedViews", url: "/admin/views", icon: Eye },
      {
        title: "Custom Objects",
        tKey: "customObjects",
        url: "/admin/custom-objects",
        icon: Database,
      },
      { title: "Analytics", tKey: "analytics", url: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Management",
    tKey: "management",
    items: [
      {
        title: "Events",
        tKey: "events",
        url: "/admin/events",
        icon: CalendarDays,
        roles: ["ADMIN"],
        children: [
          { title: "All Events", tKey: "allEvents", url: "/admin/events", end: true },
          { title: "Forms", tKey: "forms", url: "/admin/events/forms" },
        ],
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
        url: "/admin/settings",
        icon: Settings,
        roles: ["ADMIN"],
        children: [
          { title: "General", tKey: "general", url: "/admin/settings", end: true },
          { title: "Feature Flags", tKey: "featureFlags", url: "/admin/settings/feature-flags" },
          { title: "API Keys", tKey: "apiKeys", url: "/admin/settings/api-keys" },
          { title: "Webhooks", tKey: "webhooks", url: "/admin/settings/webhooks" },
        ],
      },
    ],
  },
];

export function getVisibleGroups(roles: string[]): NavGroup[] {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.some((r) => roles.includes(r))),
    }))
    .filter((group) => group.items.length > 0);
}
