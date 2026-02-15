import * as React from "react";
import { NavMain } from "~/components/layout/nav-main";
import { NavUser } from "~/components/layout/nav-user";
import { TenantSwitcher } from "~/components/layout/tenant-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar";
import { getVisibleGroups } from "~/config/navigation";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: { id: string; name: string | null; email: string };
  roles: string[];
  groupState: Record<string, boolean>;
};

export function AppSidebar({ user, roles, groupState, ...props }: AppSidebarProps) {
  const groups = getVisibleGroups(roles);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-12 justify-center">
        <TenantSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} groupState={groupState} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} roles={roles} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
