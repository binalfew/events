import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";

interface IneligibleItem {
  id: string;
  name: string;
  reason: string;
}

interface BatchConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "APPROVE" | "REJECT" | "BYPASS";
  eligibleCount: number;
  ineligibleItems: IneligibleItem[];
  onConfirm: (remarks?: string) => void;
  isSubmitting: boolean;
}

const ACTION_LABELS: Record<
  string,
  { label: string; variant: "default" | "destructive" | "outline" }
> = {
  APPROVE: { label: "Approve", variant: "default" },
  REJECT: { label: "Reject", variant: "destructive" },
  BYPASS: { label: "Bypass", variant: "outline" },
};

export function BatchConfirmationDialog({
  open,
  onOpenChange,
  action,
  eligibleCount,
  ineligibleItems,
  onConfirm,
  isSubmitting,
}: BatchConfirmationDialogProps) {
  const [remarks, setRemarks] = useState("");
  const [showIneligible, setShowIneligible] = useState(false);
  const { label, variant } = ACTION_LABELS[action] ?? ACTION_LABELS.APPROVE;

  function handleConfirm() {
    onConfirm(remarks || undefined);
    setRemarks("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Batch {label}</DialogTitle>
          <DialogDescription>
            This action will {label.toLowerCase()} {eligibleCount} participant
            {eligibleCount !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Eligibility Summary */}
          <div className="flex gap-3">
            <div className="bg-muted flex-1 rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{eligibleCount}</p>
              <p className="text-muted-foreground text-xs">Eligible</p>
            </div>
            {ineligibleItems.length > 0 && (
              <div className="bg-muted flex-1 rounded-md p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{ineligibleItems.length}</p>
                <p className="text-muted-foreground text-xs">Ineligible</p>
              </div>
            )}
          </div>

          {/* Ineligible Details */}
          {ineligibleItems.length > 0 && (
            <div>
              <button
                type="button"
                className="text-muted-foreground text-sm underline"
                onClick={() => setShowIneligible(!showIneligible)}
              >
                {showIneligible ? "Hide" : "Show"} ineligible participants ({ineligibleItems.length}
                )
              </button>
              {showIneligible && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded border">
                  {ineligibleItems.map((item) => (
                    <div key={item.id} className="border-b px-3 py-2 text-sm last:border-b-0">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {item.reason}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="batch-remarks">Remarks (optional)</Label>
            <Textarea
              id="batch-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add a comment for this batch action..."
              maxLength={500}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={eligibleCount === 0 || isSubmitting}
          >
            {isSubmitting
              ? "Processing..."
              : `${label} ${eligibleCount} Participant${eligibleCount !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
