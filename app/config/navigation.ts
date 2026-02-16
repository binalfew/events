import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bell,
  CalendarDays,
  Users,
  GitBranch,
  Truck,
  BarChart3,
  UserCog,
  Settings,
} from "lucide-react";

export type NavChild = {
  title: string;
  url: string;
  end?: boolean;
};

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  end?: boolean;
  roles?: string[];
  children?: NavChild[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navigationGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
      { title: "Notifications", url: "/admin/notifications", icon: Bell },
    ],
  },
  {
    label: "Management",
    items: [
      {
        title: "Events",
        url: "/admin/events",
        icon: CalendarDays,
        roles: ["ADMIN"],
        children: [
          { title: "All Events", url: "/admin/events", end: true },
          { title: "Forms", url: "/admin/events/forms" },
          { title: "Categories", url: "/admin/events/categories" },
          { title: "Templates", url: "/admin/events/templates" },
        ],
      },
      {
        title: "Participants",
        url: "/admin/participants",
        icon: Users,
        roles: ["ADMIN", "REVIEWER"],
        children: [
          { title: "All Participants", url: "/admin/participants", end: true },
          { title: "Import", url: "/admin/participants/import" },
          { title: "Groups", url: "/admin/participants/groups" },
        ],
      },
      {
        title: "Workflows",
        url: "/admin/workflows",
        icon: GitBranch,
        roles: ["ADMIN"],
        children: [
          { title: "All Workflows", url: "/admin/workflows", end: true },
          { title: "Templates", url: "/admin/workflows/templates" },
        ],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Logistics",
        url: "/admin/logistics",
        icon: Truck,
        roles: ["ADMIN"],
        children: [
          { title: "Venues", url: "/admin/logistics/venues" },
          { title: "Accommodation", url: "/admin/logistics/accommodation" },
          { title: "Transportation", url: "/admin/logistics/transportation" },
        ],
      },
      {
        title: "Reports",
        url: "/admin/reports",
        icon: BarChart3,
        roles: ["ADMIN", "REVIEWER"],
        children: [
          { title: "Overview", url: "/admin/reports", end: true },
          { title: "Analytics", url: "/admin/reports/analytics" },
          { title: "Export", url: "/admin/reports/export" },
        ],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Users",
        url: "/admin/users",
        icon: UserCog,
        roles: ["ADMIN"],
        children: [
          { title: "All Users", url: "/admin/users", end: true },
          { title: "Roles", url: "/admin/users/roles" },
          { title: "Invitations", url: "/admin/users/invitations" },
        ],
      },
      {
        title: "Settings",
        url: "/admin/settings",
        icon: Settings,
        roles: ["ADMIN"],
        children: [
          { title: "General", url: "/admin/settings", end: true },
          { title: "Feature Flags", url: "/admin/settings/feature-flags" },
          { title: "Security", url: "/admin/settings/security" },
          { title: "Integrations", url: "/admin/settings/integrations" },
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
