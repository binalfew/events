import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";

interface OtherBranch {
  branchStepId: string;
  label: string;
  status: string;
}

interface BranchActionPanelProps {
  participantId: string;
  forkStepId: string;
  branchStepId: string;
  branchLabel?: string;
  otherBranches: OtherBranch[];
  onAction: (action: "APPROVE" | "REJECT", remarks?: string) => void;
  disabled?: boolean;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export function BranchActionPanel({
  branchLabel,
  otherBranches,
  onAction,
  disabled = false,
}: BranchActionPanelProps) {
  const [remarks, setRemarks] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{branchLabel ?? "Branch Review"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Other branches context */}
          {otherBranches.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Other Branches</Label>
              <div className="mt-1 space-y-1">
                {otherBranches.map((branch) => (
                  <div
                    key={branch.branchStepId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{branch.label}</span>
                    <Badge className={statusStyles[branch.status] ?? "bg-gray-100 text-gray-800"}>
                      {branch.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remarks */}
          <div>
            <Label htmlFor="branch-remarks">Remarks (optional)</Label>
            <Textarea
              id="branch-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any notes about your decision..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => onAction("APPROVE", remarks || undefined)}
              disabled={disabled}
              className="flex-1"
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => onAction("REJECT", remarks || undefined)}
              disabled={disabled}
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
