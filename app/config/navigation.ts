import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bell,
  ClipboardList,
  CalendarDays,
  Users,
  GitBranch,
  Truck,
  BarChart3,
  UserCog,
  Settings,
  Eye,
  Database,
  ScanLine,
  MessageSquare,
  Monitor,
  Upload,
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
          { title: "Categories", tKey: "categories", url: "/admin/events/categories" },
          { title: "Templates", tKey: "templates", url: "/admin/events/templates" },
          { title: "Delegations", tKey: "delegations", url: "/admin/events/delegations" },
          {
            title: "Bulk Operations",
            tKey: "bulkOperations",
            url: "/admin/events/bulk-operations",
          },
        ],
      },
      {
        title: "Participants",
        tKey: "participants",
        url: "/admin/participants",
        icon: Users,
        roles: ["ADMIN", "REVIEWER"],
        children: [
          {
            title: "All Participants",
            tKey: "allParticipants",
            url: "/admin/participants",
            end: true,
          },
          { title: "Import", tKey: "import", url: "/admin/participants/import" },
          { title: "Groups", tKey: "groups", url: "/admin/participants/groups" },
        ],
      },
      {
        title: "Workflows",
        tKey: "workflows",
        url: "/admin/workflows",
        icon: GitBranch,
        roles: ["ADMIN"],
        children: [
          { title: "All Workflows", tKey: "allWorkflows", url: "/admin/workflows", end: true },
          { title: "Templates", tKey: "templates", url: "/admin/workflows/templates" },
        ],
      },
    ],
  },
  {
    label: "Operations",
    tKey: "operations",
    items: [
      {
        title: "Check-in",
        tKey: "checkIn",
        url: "/admin/events/check-in",
        icon: ScanLine,
        roles: ["ADMIN"],
        children: [
          { title: "Scanner", tKey: "scanner", url: "/admin/events/check-in", end: true },
          { title: "Access Logs", tKey: "accessLogs", url: "/admin/events/access-logs" },
          { title: "Checkpoints", tKey: "checkpoints", url: "/admin/events/checkpoints" },
        ],
      },
      {
        title: "Communications",
        tKey: "communications",
        url: "/admin/events/communications",
        icon: MessageSquare,
        roles: ["ADMIN"],
        children: [
          {
            title: "Broadcasts",
            tKey: "broadcasts",
            url: "/admin/events/communications",
            end: true,
          },
          {
            title: "Templates",
            tKey: "communicationTemplates",
            url: "/admin/events/communications/templates",
          },
        ],
      },
      {
        title: "Kiosks",
        tKey: "kiosks",
        url: "/admin/events/kiosks",
        icon: Monitor,
        roles: ["ADMIN"],
        children: [
          { title: "Devices", tKey: "devices", url: "/admin/events/kiosks", end: true },
          { title: "Queue", tKey: "queue", url: "/admin/events/queue" },
        ],
      },
      {
        title: "Logistics",
        tKey: "logistics",
        url: "/admin/logistics",
        icon: Truck,
        roles: ["ADMIN"],
        children: [
          { title: "Venues", tKey: "venues", url: "/admin/logistics/venues" },
          { title: "Accommodation", tKey: "accommodation", url: "/admin/logistics/accommodation" },
          {
            title: "Transportation",
            tKey: "transportation",
            url: "/admin/logistics/transportation",
          },
        ],
      },
      {
        title: "Reports",
        tKey: "reports",
        url: "/admin/reports",
        icon: BarChart3,
        roles: ["ADMIN", "REVIEWER"],
        children: [
          { title: "Overview", tKey: "overview", url: "/admin/reports", end: true },
          { title: "Analytics", tKey: "analytics", url: "/admin/reports/analytics" },
          { title: "Export", tKey: "export", url: "/admin/reports/export" },
        ],
      },
    ],
  },
  {
    label: "Administration",
    tKey: "administration",
    items: [
      {
        title: "Users",
        tKey: "users",
        url: "/admin/users",
        icon: UserCog,
        roles: ["ADMIN"],
        children: [
          { title: "All Users", tKey: "allUsers", url: "/admin/users", end: true },
          { title: "Roles", tKey: "roles", url: "/admin/users/roles" },
          { title: "Invitations", tKey: "invitations", url: "/admin/users/invitations" },
        ],
      },
      {
        title: "Settings",
        tKey: "settings",
        url: "/admin/settings",
        icon: Settings,
        roles: ["ADMIN"],
        children: [
          { title: "General", tKey: "general", url: "/admin/settings", end: true },
          { title: "Feature Flags", tKey: "featureFlags", url: "/admin/settings/feature-flags" },
          { title: "Security", tKey: "security", url: "/admin/settings/security" },
          { title: "Integrations", tKey: "integrations", url: "/admin/settings/integrations" },
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
