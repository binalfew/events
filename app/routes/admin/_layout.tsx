import { Form, Link, NavLink, Outlet, useLoaderData } from "react-router";
import { requireAuth } from "~/lib/require-auth.server";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/_layout";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, roles } = await requireAuth(request);
  return {
    user: { id: user.id, name: user.name, email: user.email },
    roles,
  };
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive
      ? "bg-sidebar-primary text-sidebar-primary-foreground"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
  }`;

export default function DashboardLayout() {
  const { user, roles } = useLoaderData<typeof loader>();
  const isAdmin = roles.includes("ADMIN");

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-sidebar">
        <div className="flex h-16 items-center px-4">
          <span className="text-lg font-semibold text-sidebar-foreground">Accreditation</span>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          <NavLink to="/admin" end className={navLinkClass}>
            Dashboard
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/admin/events" className={navLinkClass}>
                Events
              </NavLink>
              <NavLink to="/admin/users" className={navLinkClass}>
                Users
              </NavLink>
              <NavLink to="/admin/settings" className={navLinkClass}>
                Settings
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <h1 className="text-lg font-semibold text-foreground">Accreditation Platform</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{user.name ?? user.email}</span>
              {roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {role}
                </span>
              ))}
            </div>
            <Form method="post" action="/auth/logout">
              <Button type="submit" variant="secondary" size="sm">
                Sign out
              </Button>
            </Form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
