import { Outlet, useLoaderData, useNavigation } from "react-router";
import { requireAuth } from "~/lib/require-auth.server";
import { getSidebarState, getSidebarGroupState } from "~/lib/sidebar.server";
import { getTheme } from "~/lib/theme.server";
import { getColorTheme } from "~/lib/color-theme.server";
import { isFeatureEnabled } from "~/lib/feature-flags.server";
import { env } from "~/lib/env.server";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/layout/app-sidebar";
import { TopNavbar } from "~/components/layout/top-navbar";
import { Toaster } from "~/components/ui/toaster";
import { SSEProvider } from "~/components/sse-provider";
import type { Route } from "./+types/_layout";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, roles } = await requireAuth(request);
  const sseEnabled =
    env.ENABLE_SSE &&
    (await isFeatureEnabled("FF_SSE_UPDATES", {
      tenantId: user.tenantId ?? undefined,
      roles,
      userId: user.id,
    }));
  return {
    user: { id: user.id, name: user.name, email: user.email },
    roles,
    sidebarOpen: getSidebarState(request),
    sidebarGroups: getSidebarGroupState(request),
    theme: getTheme(request),
    colorTheme: getColorTheme(request),
    sseEnabled,
  };
}

export default function DashboardLayout() {
  const { user, roles, sidebarOpen, sidebarGroups, theme, colorTheme, sseEnabled } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar roles={roles} groupState={sidebarGroups} />
      <SidebarInset>
        {isNavigating && (
          <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/20">
            <div className="h-full w-1/3 animate-[progress_1s_ease-in-out_infinite] bg-primary" />
          </div>
        )}
        <TopNavbar user={user} theme={theme} colorTheme={colorTheme} />
        <div className="flex-1 p-4 md:p-6">
          <SSEProvider enabled={sseEnabled}>
            <Outlet />
          </SSEProvider>
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
