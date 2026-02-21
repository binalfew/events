import * as React from "react";
import { NavMain } from "~/components/layout/nav-main";
import { TenantSwitcher } from "~/components/layout/tenant-switcher";
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "~/components/ui/sidebar";
import { getVisibleGroups } from "~/config/navigation";

type TenantInfo = {
  name: string;
  slug: string;
  plan: string;
  logoUrl?: string | null;
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  roles: string[];
  groupState: Record<string, boolean>;
  basePrefix?: string;
  tenant?: TenantInfo | null;
};

export function AppSidebar({
  roles,
  groupState,
  basePrefix = "/admin",
  tenant,
  ...props
}: AppSidebarProps) {
  const groups = getVisibleGroups(roles, basePrefix);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TenantSwitcher tenant={tenant} basePrefix={basePrefix} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} groupState={groupState} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
