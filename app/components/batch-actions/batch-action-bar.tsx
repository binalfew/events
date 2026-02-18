import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

interface BatchActionBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  onApprove: () => void;
  onReject: () => void;
  onBypass: () => void;
  onSelectAllFiltered: () => void;
  onClear: () => void;
  isSubmitting: boolean;
}

export function BatchActionBar({
  selectedCount,
  totalFilteredCount,
  onApprove,
  onReject,
  onBypass,
  onSelectAllFiltered,
  onClear,
  isSubmitting,
}: BatchActionBarProps) {
  return (
    <div className="bg-background fixed bottom-0 left-0 right-0 z-40 border-t px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} selected
          </Badge>
          {selectedCount < totalFilteredCount && (
            <button
              type="button"
              className="text-primary text-sm underline"
              onClick={onSelectAllFiltered}
            >
              Select all {totalFilteredCount} matching
            </button>
          )}
          <button
            type="button"
            className="text-muted-foreground text-sm underline"
            onClick={onClear}
          >
            Clear
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" onClick={onApprove} disabled={isSubmitting}>
            Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={onReject} disabled={isSubmitting}>
            Reject
          </Button>
          <Button size="sm" variant="outline" onClick={onBypass} disabled={isSubmitting}>
            Bypass
          </Button>
        </div>
      </div>
    </div>
  );
}
