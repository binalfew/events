import { useMemo, useState } from "react";
import { Form, Link, useMatches, useNavigate } from "react-router";
import { LogOut, Search, User } from "lucide-react";
import { CommandPalette } from "~/components/layout/command-palette";
import { ShortcutHelp } from "~/components/layout/shortcut-help";
import {
  useKeyboardShortcuts,
  getShortcutInfo,
  type ShortcutDefinition,
} from "~/lib/use-keyboard-shortcuts";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { NotificationBell } from "~/components/notification-bell";
import { OfflineIndicator } from "~/components/offline-indicator";
import { LanguageSwitcher } from "~/components/layout/language-switcher";
import { ThemeSwitch } from "~/routes/resources/theme-switch";
import { ColorThemeSelector } from "~/routes/resources/color-theme";
import type { Theme } from "~/lib/theme.server";
import type { ColorTheme } from "~/lib/color-theme";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

type TopNavbarProps = {
  user: { id: string; name: string | null; email: string };
  theme?: Theme | null;
  colorTheme?: ColorTheme;
  notificationsEnabled?: boolean;
  unreadCount?: number;
  notifications?: NotificationItem[];
  searchEnabled?: boolean;
  shortcutsEnabled?: boolean;
  i18nEnabled?: boolean;
  offlineEnabled?: boolean;
};

type BreadcrumbEntry = {
  label: string;
  to?: string;
};

function useBreadcrumbs(): BreadcrumbEntry[] {
  const matches = useMatches();

  const crumbs: BreadcrumbEntry[] = [];
  for (const match of matches) {
    const handle = match.handle as { breadcrumb?: string } | undefined;
    if (handle?.breadcrumb) {
      crumbs.push({
        label: handle.breadcrumb,
        to: match.pathname,
      });
    }
  }

  return crumbs;
}

function getUserInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

export function TopNavbar({
  user,
  theme,
  colorTheme,
  notificationsEnabled = false,
  unreadCount = 0,
  notifications = [],
  searchEnabled = false,
  shortcutsEnabled = false,
  i18nEnabled = false,
  offlineEnabled = false,
}: TopNavbarProps) {
  const breadcrumbs = useBreadcrumbs();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);

  // Build shortcut definitions
  const shortcuts = useMemo<ShortcutDefinition[]>(() => {
    const defs: ShortcutDefinition[] = [];

    // ⌘K — Open command palette (works even without shortcuts feature, if search is enabled)
    if (searchEnabled) {
      defs.push({
        id: "search",
        keys: "⌘ K",
        description: "Open command palette",
        group: "global",
        key: "k",
        mod: true,
        handler: () => setSearchOpen((o) => !o),
      });
    }

    // ? — Open shortcut help
    defs.push({
      id: "help",
      keys: "?",
      description: "Show keyboard shortcuts",
      group: "global",
      key: "?",
      handler: () => setShortcutHelpOpen((o) => !o),
    });

    // Navigation chords
    defs.push(
      {
        id: "nav-dashboard",
        keys: "g then d",
        description: "Go to Dashboard",
        group: "navigation",
        key: ["g", "d"],
        handler: () => navigate("/admin"),
      },
      {
        id: "nav-events",
        keys: "g then e",
        description: "Go to Events",
        group: "navigation",
        key: ["g", "e"],
        handler: () => navigate("/admin/events"),
      },
      {
        id: "nav-settings",
        keys: "g then s",
        description: "Go to Settings",
        group: "navigation",
        key: ["g", "s"],
        handler: () => navigate("/admin/settings"),
      },
      {
        id: "nav-notifications",
        keys: "g then n",
        description: "Go to Notifications",
        group: "navigation",
        key: ["g", "n"],
        handler: () => navigate("/admin/notifications"),
      },
      {
        id: "nav-participants",
        keys: "g then p",
        description: "Go to Participants",
        group: "navigation",
        key: ["g", "p"],
        handler: () => navigate("/admin/participants"),
      },
    );

    // Designer shortcuts (informational — actual handlers in designer-toolbar.tsx)
    defs.push(
      {
        id: "designer-undo",
        keys: "⌘ Z",
        description: "Undo",
        group: "designer",
        key: "z",
        mod: true,
        handler: () => {},
        enabled: false,
      },
      {
        id: "designer-redo",
        keys: "⌘ ⇧ Z",
        description: "Redo",
        group: "designer",
        key: "z",
        mod: true,
        shift: true,
        handler: () => {},
        enabled: false,
      },
      {
        id: "designer-save",
        keys: "⌘ S",
        description: "Save form",
        group: "designer",
        key: "s",
        mod: true,
        handler: () => {},
        enabled: false,
      },
    );

    // Workflow shortcuts (informational — handlers wired when validation queue is built)
    defs.push(
      {
        id: "workflow-approve",
        keys: "A",
        description: "Approve current participant",
        group: "workflow",
        key: "a",
        handler: () => {},
        enabled: false,
      },
      {
        id: "workflow-reject",
        keys: "R",
        description: "Reject current participant",
        group: "workflow",
        key: "r",
        handler: () => {},
        enabled: false,
      },
      {
        id: "workflow-bypass",
        keys: "B",
        description: "Bypass current step",
        group: "workflow",
        key: "b",
        handler: () => {},
        enabled: false,
      },
      {
        id: "workflow-next",
        keys: "N",
        description: "Next participant",
        group: "workflow",
        key: "n",
        handler: () => {},
        enabled: false,
      },
      {
        id: "workflow-prev",
        keys: "P",
        description: "Previous participant",
        group: "workflow",
        key: "p",
        handler: () => {},
        enabled: false,
      },
    );

    return defs;
  }, [searchEnabled, navigate]);

  // Register shortcuts — ⌘K always active if search is enabled, others need shortcutsEnabled
  useKeyboardShortcuts(shortcuts, {
    enabled: searchEnabled || shortcutsEnabled,
  });

  const shortcutInfoList = useMemo(() => getShortcutInfo(shortcuts), [shortcuts]);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <BreadcrumbItem key={crumb.to ?? crumb.label}>
                  {index > 0 && <BreadcrumbSeparator />}
                  {isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.to!}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-1 px-2 sm:gap-2 sm:px-4">
        {/* Search trigger — icon on mobile, full bar on desktop */}
        {searchEnabled ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 md:hidden"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="size-4" />
            </Button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden cursor-pointer items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
            >
              <Search className="size-4" />
              <span>Search...</span>
              <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">&#8984;</span>K
              </kbd>
            </button>
          </>
        ) : (
          <div className="hidden items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground md:flex">
            <Search className="size-4" />
            <span>Search...</span>
            <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </div>
        )}

        {/* Language switcher — hidden on small screens */}
        {i18nEnabled && (
          <div className="hidden sm:flex">
            <LanguageSwitcher />
          </div>
        )}

        {/* Theme switcher */}
        <ThemeSwitch userPreference={theme} />

        {/* Color theme selector — hidden on small screens */}
        <div className="hidden sm:flex">
          <ColorThemeSelector currentTheme={colorTheme} />
        </div>

        {/* Offline indicator */}
        {offlineEnabled && <OfflineIndicator />}

        {/* Notifications */}
        <NotificationBell
          unreadCount={unreadCount}
          notifications={notifications}
          enabled={notificationsEnabled}
        />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-full">
              <Avatar className="size-8">
                <AvatarFallback>{getUserInitials(user.name, user.email)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name ?? user.email}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Form method="post" action="/auth/logout">
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full">
                  <LogOut />
                  Sign out
                </button>
              </DropdownMenuItem>
            </Form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {searchEnabled && <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />}
      <ShortcutHelp
        open={shortcutHelpOpen}
        onOpenChange={setShortcutHelpOpen}
        shortcuts={shortcutInfoList}
      />
    </header>
  );
}
