import { useState } from "react";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { StatusButton } from "~/components/ui/status-button";
import { EmptyState } from "~/components/ui/empty-state";
import { CalendarDays, FileText, Users, Inbox } from "lucide-react";
import {
  TableSkeleton,
  CardGridSkeleton,
  FormSkeleton,
  DesignerSkeleton,
  DashboardSkeleton,
} from "~/components/skeletons";

export const handle = { breadcrumb: "Component Preview" };

export default function PreviewComponentsPage() {
  const [statusA, setStatusA] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusB, setStatusB] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const simulateAction = (
    setter: (s: "idle" | "loading" | "success" | "error") => void,
    outcome: "success" | "error",
  ) => {
    setter("loading");
    setTimeout(() => setter(outcome), 1500);
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold">Component Preview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Visual check for P2-08 skeleton loading states, StatusButton, and EmptyState.
        </p>
      </div>

      {/* ─── StatusButton ──────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">StatusButton</h3>
        <Separator />
        <div className="flex flex-wrap items-center gap-3">
          <StatusButton status={statusA} onClick={() => simulateAction(setStatusA, "success")}>
            Save (success)
          </StatusButton>
          <StatusButton
            status={statusB}
            variant="destructive"
            onClick={() => simulateAction(setStatusB, "error")}
          >
            Delete (error)
          </StatusButton>
          <StatusButton status="idle">Idle</StatusButton>
          <StatusButton status="loading">Loading...</StatusButton>
        </div>
        <p className="text-xs text-muted-foreground">
          Click &ldquo;Save&rdquo; or &ldquo;Delete&rdquo; to see the state transitions.
        </p>
      </section>

      {/* ─── EmptyState ────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">EmptyState</h3>
        <Separator />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <EmptyState
            icon={CalendarDays}
            title="No events found"
            description="Events will appear here once they are created."
          />
          <EmptyState
            icon={FileText}
            title="No forms created yet"
            description="Create your first form to start designing."
            action={<Button size="sm">Create Form</Button>}
          />
          <EmptyState
            icon={Users}
            title="No participants"
            description="Participants will appear after registration opens."
          />
          <EmptyState icon={Inbox} title="No results" description="Try adjusting your filters." />
        </div>
      </section>

      {/* ─── Skeleton Demos ────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Page Skeletons</h3>
        <Separator />
        <div className="flex flex-wrap gap-2">
          {["table", "cards", "form", "dashboard", "designer"].map((demo) => (
            <Button
              key={demo}
              variant={activeDemo === demo ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveDemo(activeDemo === demo ? null : demo)}
            >
              {demo.charAt(0).toUpperCase() + demo.slice(1)}
            </Button>
          ))}
        </div>

        {activeDemo === "table" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              TableSkeleton — 7 columns, 6 rows (matches field list)
            </p>
            <TableSkeleton
              columns={7}
              rows={6}
              columnWidths={["w-28", "w-24", "w-16", "w-12", "w-12", "w-16", "w-20"]}
            />
          </div>
        )}

        {activeDemo === "cards" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              CardGridSkeleton — 6 cards (matches events list)
            </p>
            <CardGridSkeleton cards={6} />
          </div>
        )}

        {activeDemo === "form" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              FormSkeleton — matches field edit page layout
            </p>
            <FormSkeleton />
          </div>
        )}

        {activeDemo === "dashboard" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">DashboardSkeleton — 3 stat cards</p>
            <DashboardSkeleton />
          </div>
        )}

        {activeDemo === "designer" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              DesignerSkeleton — three-panel form designer
            </p>
            <div className="h-[600px] overflow-hidden rounded-lg border">
              <div className="m-4 md:m-6">
                <DesignerSkeleton />
              </div>
            </div>
          </div>
        )}

        {!activeDemo && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Click a button above to preview a skeleton variant.
          </p>
        )}
      </section>

      {/* ─── Base Skeleton ─────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Base Skeleton</h3>
        <Separator />
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
