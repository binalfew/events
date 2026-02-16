import * as React from "react";
import { NavMain } from "~/components/layout/nav-main";
import { TenantSwitcher } from "~/components/layout/tenant-switcher";
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "~/components/ui/sidebar";
import { getVisibleGroups } from "~/config/navigation";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  roles: string[];
  groupState: Record<string, boolean>;
};

export function AppSidebar({ roles, groupState, ...props }: AppSidebarProps) {
  const groups = getVisibleGroups(roles);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TenantSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} groupState={groupState} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
