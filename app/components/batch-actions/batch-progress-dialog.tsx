import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

interface BatchProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalItems: number;
  successCount: number;
  failureCount: number;
  status: string;
  operationId?: string;
  onUndo?: () => void;
}

export function BatchProgressDialog({
  open,
  onOpenChange,
  totalItems,
  successCount,
  failureCount,
  status,
  onUndo,
}: BatchProgressDialogProps) {
  const processedCount = successCount + failureCount;
  const progress = totalItems > 0 ? Math.round((processedCount / totalItems) * 100) : 0;
  const isComplete = status === "COMPLETED" || status === "FAILED";

  return (
    <Dialog open={open} onOpenChange={isComplete ? onOpenChange : undefined}>
      <DialogContent showCloseButton={isComplete}>
        <DialogHeader>
          <DialogTitle>
            {isComplete ? "Batch Action Complete" : "Processing Batch Action..."}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {processedCount} of {totalItems} processed
            </p>
          </div>

          {/* Counts */}
          <div className="flex gap-3">
            <div className="bg-muted flex-1 rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{successCount}</p>
              <p className="text-muted-foreground text-xs">Succeeded</p>
            </div>
            <div className="bg-muted flex-1 rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{failureCount}</p>
              <p className="text-muted-foreground text-xs">Failed</p>
            </div>
          </div>

          {/* Status */}
          {isComplete && (
            <div className="flex items-center justify-center gap-2">
              <Badge variant={status === "COMPLETED" ? "default" : "destructive"}>{status}</Badge>
            </div>
          )}
        </div>

        {isComplete && (
          <DialogFooter>
            {onUndo && status === "COMPLETED" && (
              <Button variant="outline" onClick={onUndo}>
                Undo
              </Button>
            )}
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
