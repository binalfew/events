import { data, useLoaderData } from "react-router";
import { ClipboardList, Users, Workflow } from "lucide-react";
import { requireAuth } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { getUserAssignments } from "~/services/step-assignment.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/ui/empty-state";
import type { Route } from "./+types/assignments";

export const handle = { breadcrumb: "My Assignments" };

export async function loader({ request }: Route.LoaderArgs) {
  const { user, roles } = await requireAuth(request);

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.STEP_ASSIGNMENT, {
    tenantId: user.tenantId ?? undefined,
    roles,
    userId: user.id,
  });

  if (!enabled) {
    throw data({ error: "Step assignment is not enabled" }, { status: 404 });
  }

  const assignments = await getUserAssignments(user.id);

  // Group by event → workflow → step
  const grouped = new Map<
    string,
    {
      workflowName: string;
      eventId: string;
      steps: Array<{
        assignmentId: string;
        stepName: string;
        stepType: string;
        strategy: string;
      }>;
    }
  >();

  for (const a of assignments) {
    const wf = a.step.workflow;
    const key = wf.id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        workflowName: wf.name,
        eventId: wf.eventId,
        steps: [],
      });
    }
    grouped.get(key)!.steps.push({
      assignmentId: a.id,
      stepName: a.step.name,
      stepType: a.step.stepType,
      strategy: a.strategy,
    });
  }

  return {
    assignments: Array.from(grouped.entries()).map(([workflowId, group]) => ({
      workflowId,
      ...group,
    })),
    totalCount: assignments.length,
  };
}

export default function AssignmentsPage() {
  const { assignments, totalCount } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Assignments</h1>
          <p className="text-muted-foreground">Workflow steps assigned to you across all events</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {totalCount} active
        </Badge>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments"
          description="You don't have any active step assignments yet."
        />
      ) : (
        <div className="space-y-4">
          {assignments.map((group) => (
            <Card key={group.workflowId}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Workflow className="size-4" />
                  {group.workflowName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.steps.map((step) => (
                    <div
                      key={step.assignmentId}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{step.stepName}</p>
                          <p className="text-xs text-muted-foreground">{step.stepType}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {step.strategy.replace("_", " ").toLowerCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
