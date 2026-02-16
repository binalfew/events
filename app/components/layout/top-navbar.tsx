import { useEffect, useState } from "react";
import { Form, Link, useMatches } from "react-router";
import { LogOut, Search, User } from "lucide-react";
import { CommandPalette } from "~/components/layout/command-palette";
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
}: TopNavbarProps) {
  const breadcrumbs = useBreadcrumbs();
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    if (!searchEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchEnabled]);

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

      <div className="flex items-center gap-2 px-4">
        {/* Search trigger */}
        {searchEnabled ? (
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
        ) : (
          <div className="hidden items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground md:flex">
            <Search className="size-4" />
            <span>Search...</span>
            <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </div>
        )}

        {/* Theme switcher */}
        <ThemeSwitch userPreference={theme} />

        {/* Color theme selector */}
        <ColorThemeSelector currentTheme={colorTheme} />

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
    </header>
  );
}
