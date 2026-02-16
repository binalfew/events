import { Outlet, useLoaderData, useNavigation } from "react-router";
import { requireAuth } from "~/lib/require-auth.server";
import { getSidebarState, getSidebarGroupState } from "~/lib/sidebar.server";
import { getTheme } from "~/lib/theme.server";
import { getColorTheme } from "~/lib/color-theme.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { env } from "~/lib/env.server";
import { getUnreadCount, listNotifications } from "~/services/notifications.server";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/layout/app-sidebar";
import { TopNavbar } from "~/components/layout/top-navbar";
import { Toaster } from "~/components/ui/toaster";
import { SSEProvider } from "~/components/sse-provider";
import type { Route } from "./+types/_layout";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, roles } = await requireAuth(request);
  const flagContext = {
    tenantId: user.tenantId ?? undefined,
    roles,
    userId: user.id,
  };
  const sseEnabled = env.ENABLE_SSE && (await isFeatureEnabled("FF_SSE_UPDATES", flagContext));
  const notificationsEnabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.NOTIFICATIONS, flagContext);
  const searchEnabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.GLOBAL_SEARCH, flagContext);

  let unreadCount = 0;
  let recentNotifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
  }> = [];

  if (notificationsEnabled) {
    const [count, result] = await Promise.all([
      getUnreadCount(user.id),
      listNotifications(user.id, { page: 1, perPage: 10 }),
    ]);
    unreadCount = count;
    recentNotifications = result.notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  return {
    user: { id: user.id, name: user.name, email: user.email },
    roles,
    sidebarOpen: getSidebarState(request),
    sidebarGroups: getSidebarGroupState(request),
    theme: getTheme(request),
    colorTheme: getColorTheme(request),
    sseEnabled,
    notificationsEnabled,
    searchEnabled,
    unreadCount,
    recentNotifications,
  };
}

export default function DashboardLayout() {
  const {
    user,
    roles,
    sidebarOpen,
    sidebarGroups,
    theme,
    colorTheme,
    sseEnabled,
    notificationsEnabled,
    searchEnabled,
    unreadCount,
    recentNotifications,
  } = useLoaderData<typeof loader>();
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
        <TopNavbar
          user={user}
          theme={theme}
          colorTheme={colorTheme}
          notificationsEnabled={notificationsEnabled}
          searchEnabled={searchEnabled}
          unreadCount={unreadCount}
          notifications={recentNotifications}
        />
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
