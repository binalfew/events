import { Badge } from "~/components/ui/badge";

interface AccessLogEntry {
  id: string;
  scanType: string;
  scanResult: string;
  scannedBy: string;
  scannedAt: string;
  overrideReason?: string | null;
  checkpoint: { name: string; type: string; location?: string | null };
  participant?: { firstName: string; lastName: string; registrationCode: string } | null;
}

interface AccessLogTableProps {
  logs: AccessLogEntry[];
}

const RESULT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  VALID: "default",
  MANUAL_OVERRIDE: "default",
  INVALID: "destructive",
  REVOKED: "destructive",
  EXPIRED: "secondary",
  ALREADY_SCANNED: "secondary",
};

export function AccessLogTable({ logs }: AccessLogTableProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">No access logs found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium">Time</th>
            <th className="pb-2 pr-4 font-medium">Participant</th>
            <th className="pb-2 pr-4 font-medium">Checkpoint</th>
            <th className="pb-2 pr-4 font-medium">Type</th>
            <th className="pb-2 pr-4 font-medium">Result</th>
            <th className="pb-2 font-medium">Override</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="py-2 pr-4 text-muted-foreground">
                {new Date(log.scannedAt).toLocaleString()}
              </td>
              <td className="py-2 pr-4">
                {log.participant ? (
                  <div>
                    <span className="font-medium">
                      {log.participant.firstName} {log.participant.lastName}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({log.participant.registrationCode})
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </td>
              <td className="py-2 pr-4">{log.checkpoint.name}</td>
              <td className="py-2 pr-4">
                <Badge variant="outline">{log.scanType.replace("_", " ")}</Badge>
              </td>
              <td className="py-2 pr-4">
                <Badge variant={RESULT_VARIANT[log.scanResult] ?? "secondary"}>
                  {log.scanResult}
                </Badge>
              </td>
              <td className="py-2 text-muted-foreground">{log.overrideReason ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
