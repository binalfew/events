import { Form, Link, NavLink, Outlet, useLoaderData } from "react-router";
import { requireAuth } from "~/lib/require-auth.server";
import type { Route } from "./+types/_dashboard";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, roles } = await requireAuth(request);
  return {
    user: { id: user.id, name: user.name, email: user.email },
    roles,
  };
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
  }`;

export default function DashboardLayout() {
  const { user, roles } = useLoaderData<typeof loader>();
  const isAdmin = roles.includes("ADMIN");

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-gray-800">
        <div className="flex h-16 items-center px-4">
          <span className="text-lg font-semibold text-white">Accreditation</span>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          <NavLink to="/dashboard" end className={navLinkClass}>
            Dashboard
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/dashboard/events" className={navLinkClass}>
                Events
              </NavLink>
              <NavLink to="/dashboard/users" className={navLinkClass}>
                Users
              </NavLink>
              <NavLink to="/dashboard/settings" className={navLinkClass}>
                Settings
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <h1 className="text-lg font-semibold text-gray-900">Accreditation Platform</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">{user.name ?? user.email}</span>
              {roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                >
                  {role}
                </span>
              ))}
            </div>
            <Form method="post" action="/auth/logout">
              <button
                type="submit"
                className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                Sign out
              </button>
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
