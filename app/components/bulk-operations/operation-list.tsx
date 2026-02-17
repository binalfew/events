import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { Upload } from "lucide-react";

// ─── Types ───────────────────────────────────────────────

interface BulkOperation {
  id: string;
  type: string;
  description: string;
  status: string;
  totalItems: number;
  processedItems: number;
  successCount: number;
  failureCount: number;
  undoDeadline: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface OperationListProps {
  operations: BulkOperation[];
  eventId: string;
  onUndo?: (operationId: string) => void;
}

// ─── Status badge ────────────────────────────────────────

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  VALIDATING: { label: "Validating", className: "bg-blue-100 text-blue-800" },
  PREVIEW: { label: "Preview", className: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
  PROCESSING: { label: "Processing", className: "bg-blue-100 text-blue-800 animate-pulse" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-800" },
  ROLLED_BACK: { label: "Rolled Back", className: "bg-gray-100 text-gray-800" },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { label: status, className: "" };
  return <Badge className={style.className}>{style.label}</Badge>;
}

// ─── Type badge ──────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  IMPORT_PARTICIPANTS: "Import",
  EXPORT_PARTICIPANTS: "Export",
  STATUS_CHANGE: "Status Change",
  BULK_APPROVE: "Bulk Approve",
  BULK_REJECT: "Bulk Reject",
  BULK_BYPASS: "Bulk Bypass",
  FIELD_UPDATE: "Field Update",
  DELETE: "Delete",
};

// ─── Progress bar ────────────────────────────────────────

function ProgressBar({ processed, total }: { processed: number; total: number }) {
  if (total === 0) return null;
  const pct = Math.round((processed / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {processed}/{total}
      </span>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────

export function OperationList({ operations, eventId, onUndo }: OperationListProps) {
  if (operations.length === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="No bulk operations"
        description="Import participants from CSV/XLSX files or export participant data."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium">Type</th>
            <th className="pb-2 pr-4 font-medium">Description</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
            <th className="pb-2 pr-4 font-medium">Progress</th>
            <th className="pb-2 pr-4 font-medium">Results</th>
            <th className="pb-2 pr-4 font-medium">Created</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {operations.map((op) => {
            const canUndo =
              op.status === "COMPLETED" &&
              op.undoDeadline &&
              new Date(op.undoDeadline) > new Date();

            return (
              <tr key={op.id}>
                <td className="py-3 pr-4">
                  <Badge variant="outline">{TYPE_LABELS[op.type] ?? op.type}</Badge>
                </td>
                <td className="py-3 pr-4 max-w-48 truncate">{op.description}</td>
                <td className="py-3 pr-4">
                  <StatusBadge status={op.status} />
                </td>
                <td className="py-3 pr-4">
                  <ProgressBar processed={op.processedItems} total={op.totalItems} />
                </td>
                <td className="py-3 pr-4">
                  {op.successCount > 0 || op.failureCount > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      <span className="text-green-600">{op.successCount} ok</span>
                      {op.failureCount > 0 && (
                        <span className="ml-1 text-red-600">{op.failureCount} failed</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-xs text-muted-foreground">
                  {new Date(op.createdAt).toLocaleString()}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/events/${eventId}/bulk-operations/import?operationId=${op.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Details
                    </Link>
                    {canUndo && onUndo && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => onUndo(op.id)}
                      >
                        Undo
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
