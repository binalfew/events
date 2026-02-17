import { Badge } from "~/components/ui/badge";
import type { ScanResultCode } from "~/services/check-in.server";

interface ScanHistoryItem {
  result: ScanResultCode;
  participantName?: string;
  registrationCode?: string;
  message: string;
  timestamp: number;
}

interface ScanHistoryProps {
  items: ScanHistoryItem[];
}

const RESULT_VARIANT: Record<ScanResultCode, "default" | "secondary" | "destructive" | "outline"> =
  {
    VALID: "default",
    MANUAL_OVERRIDE: "default",
    INVALID: "destructive",
    REVOKED: "destructive",
    EXPIRED: "secondary",
    ALREADY_SCANNED: "secondary",
  };

export function ScanHistory({ items }: ScanHistoryProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No scans yet. Point the camera at a QR code.</p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={RESULT_VARIANT[item.result]}>{item.result}</Badge>
              {item.participantName && (
                <span className="truncate text-sm font-medium">{item.participantName}</span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.message}</p>
          </div>
          <span className="ml-2 shrink-0 text-xs text-muted-foreground">
            {new Date(item.timestamp).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export type { ScanHistoryItem };
