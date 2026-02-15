import { useRouteLoaderData } from "react-router";

export default function DashboardIndex() {
  const data = useRouteLoaderData("routes/dashboard/_layout") as
    | { user: { id: string; name: string | null; email: string }; roles: string[] }
    | undefined;

  const user = data?.user;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's an overview of your accreditation platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard title="Events" value={0} />
        <StatCard title="Participants" value={0} />
        <StatCard title="Pending" value={0} />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg bg-card p-6 shadow">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
