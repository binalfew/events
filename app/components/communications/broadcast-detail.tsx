import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { XCircle } from "lucide-react";

interface Delivery {
  id: string;
  channel: string;
  recipient: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  participant: {
    firstName: string;
    lastName: string;
    registrationCode: string;
  };
}

interface BroadcastDetailProps {
  broadcast: {
    id: string;
    subject: string | null;
    body: string;
    channel: string;
    status: string;
    recipientCount: number;
    sentCount: number;
    failedCount: number;
    deliveredCount: number;
    bouncedCount: number;
    isEmergency: boolean;
    createdAt: string;
    sentAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    cancelReason: string | null;
    deliveryStats: Record<string, number>;
  };
  deliveries: Delivery[];
  deliveryTotal: number;
  onCancel?: () => void;
}

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SCHEDULED: "secondary",
  SENDING: "default",
  SENT: "default",
  CANCELLED: "destructive",
  QUEUED: "outline",
  FAILED: "destructive",
  DELIVERED: "default",
  BOUNCED: "destructive",
};

export function BroadcastDetail({
  broadcast,
  deliveries,
  deliveryTotal,
  onCancel,
}: BroadcastDetailProps) {
  const progressPercent =
    broadcast.recipientCount > 0
      ? Math.round(((broadcast.sentCount + broadcast.failedCount) / broadcast.recipientCount) * 100)
      : 0;

  const canCancel = broadcast.status === "SENDING" || broadcast.status === "SCHEDULED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{broadcast.subject ?? "Broadcast"}</h2>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={statusVariants[broadcast.status] ?? "outline"}>
              {broadcast.status}
            </Badge>
            <Badge variant="secondary">{broadcast.channel}</Badge>
            {broadcast.isEmergency && <Badge variant="destructive">Emergency</Badge>}
          </div>
        </div>
        {canCancel && onCancel && (
          <Button variant="destructive" size="sm" onClick={onCancel}>
            <XCircle className="mr-2 size-4" /> Cancel Broadcast
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex justify-between text-sm">
            <span>
              {broadcast.sentCount + broadcast.failedCount} / {broadcast.recipientCount}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Queued", count: broadcast.deliveryStats.QUEUED ?? 0, color: "bg-muted" },
          { label: "Sending", count: broadcast.deliveryStats.SENDING ?? 0, color: "bg-yellow-100" },
          { label: "Sent", count: broadcast.sentCount, color: "bg-green-100" },
          { label: "Bounced", count: broadcast.bouncedCount, color: "bg-orange-100" },
          { label: "Failed", count: broadcast.failedCount, color: "bg-red-100" },
        ].map((stat) => (
          <Card key={stat.label} className={stat.color}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stat.count}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timestamps */}
      <Card>
        <CardContent className="grid gap-2 p-4 text-sm md:grid-cols-3">
          <div>
            <span className="text-muted-foreground">Created:</span>{" "}
            {new Date(broadcast.createdAt).toLocaleString()}
          </div>
          {broadcast.sentAt && (
            <div>
              <span className="text-muted-foreground">Sent:</span>{" "}
              {new Date(broadcast.sentAt).toLocaleString()}
            </div>
          )}
          {broadcast.completedAt && (
            <div>
              <span className="text-muted-foreground">Completed:</span>{" "}
              {new Date(broadcast.completedAt).toLocaleString()}
            </div>
          )}
          {broadcast.cancelledAt && (
            <div>
              <span className="text-muted-foreground">Cancelled:</span>{" "}
              {new Date(broadcast.cancelledAt).toLocaleString()}
              {broadcast.cancelReason && ` — ${broadcast.cancelReason}`}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Delivery Log */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Delivery Log ({deliveryTotal})</h3>
        {deliveries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deliveries yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Participant</th>
                  <th className="px-4 py-3 text-left font-medium">Recipient</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Sent At</th>
                  <th className="px-4 py-3 text-left font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {d.participant.firstName} {d.participant.lastName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.recipient || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariants[d.status] ?? "outline"}>{d.status}</Badge>
                      {d.retryCount > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (retry {d.retryCount})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.sentAt ? new Date(d.sentAt).toLocaleString() : "—"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-destructive">
                      {d.errorMessage ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
