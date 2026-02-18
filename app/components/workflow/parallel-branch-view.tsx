import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import type { ForkConfig } from "~/services/workflow-engine/parallel-types";

interface BranchInfo {
  id: string;
  branchStepId: string;
  status: string;
  completedAt: string | null;
  completedBy: string | null;
  action: string | null;
  remarks: string | null;
  createdAt: string;
}

interface ParallelBranchViewProps {
  branches: BranchInfo[];
  forkConfig: ForkConfig;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

function formatDuration(startDate: string, endDate: string | null): string {
  if (!endDate) return "In progress";
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function ParallelBranchView({ branches, forkConfig }: ParallelBranchViewProps) {
  const completedCount = branches.filter((b) => b.status !== "PENDING").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parallel Branches</CardTitle>
        <p className="text-sm text-muted-foreground">
          {completedCount} of {branches.length} branches completed
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {branches.map((branch) => {
            const configBranch = forkConfig.branches.find(
              (b) => b.branchStepId === branch.branchStepId,
            );
            const label = configBranch?.label ?? branch.branchStepId;

            return (
              <div
                key={branch.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{label}</span>
                    <Badge className={statusStyles[branch.status] ?? "bg-gray-100 text-gray-800"}>
                      {branch.status}
                    </Badge>
                  </div>
                  {branch.completedBy && (
                    <p className="text-xs text-muted-foreground">By: {branch.completedBy}</p>
                  )}
                  {branch.remarks && (
                    <p className="text-xs text-muted-foreground italic">{branch.remarks}</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDuration(branch.createdAt, branch.completedAt)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
