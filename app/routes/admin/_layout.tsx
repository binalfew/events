import { Outlet, useLoaderData } from "react-router";
import { requireAuth } from "~/lib/require-auth.server";
import { getSidebarState, getSidebarGroupState } from "~/lib/sidebar.server";
import { getTheme } from "~/lib/theme.server";
import { getColorTheme } from "~/lib/color-theme.server";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/layout/app-sidebar";
import { TopNavbar } from "~/components/layout/top-navbar";
import type { Route } from "./+types/_layout";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, roles } = await requireAuth(request);
  return {
    user: { id: user.id, name: user.name, email: user.email },
    roles,
    sidebarOpen: getSidebarState(request),
    sidebarGroups: getSidebarGroupState(request),
    theme: getTheme(request),
    colorTheme: getColorTheme(request),
  };
}

export default function DashboardLayout() {
  const { user, roles, sidebarOpen, sidebarGroups, theme, colorTheme } =
    useLoaderData<typeof loader>();

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar roles={roles} groupState={sidebarGroups} />
      <SidebarInset>
        <TopNavbar user={user} theme={theme} colorTheme={colorTheme} />
        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
