import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Eye, XCircle } from "lucide-react";

interface Broadcast {
  id: string;
  subject: string | null;
  channel: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  isEmergency: boolean;
  createdAt: string;
  template?: { name: string } | null;
}

interface BroadcastListProps {
  broadcasts: Broadcast[];
  eventId: string;
  onCancel?: (broadcast: Broadcast) => void;
}

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SCHEDULED: "secondary",
  SENDING: "default",
  SENT: "default",
  CANCELLED: "destructive",
};

const channelColors: Record<string, "default" | "secondary" | "outline"> = {
  EMAIL: "default",
  SMS: "secondary",
  PUSH: "outline",
  IN_APP: "secondary",
};

export function BroadcastList({ broadcasts, eventId, onCancel }: BroadcastListProps) {
  if (broadcasts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No broadcasts yet. Create one to reach your participants.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Subject</th>
            <th className="px-4 py-3 text-left font-medium">Channel</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Recipients</th>
            <th className="px-4 py-3 text-right font-medium">Sent</th>
            <th className="px-4 py-3 text-right font-medium">Failed</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {broadcasts.map((broadcast) => (
            <tr key={broadcast.id} className="border-b last:border-0">
              <td className="px-4 py-3">
                <div className="font-medium">
                  {broadcast.subject ?? "(no subject)"}
                  {broadcast.isEmergency && (
                    <Badge variant="destructive" className="ml-2">
                      Emergency
                    </Badge>
                  )}
                </div>
                {broadcast.template && (
                  <div className="text-xs text-muted-foreground">
                    Template: {broadcast.template.name}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge variant={channelColors[broadcast.channel] ?? "default"}>
                  {broadcast.channel}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={statusColors[broadcast.status] ?? "outline"}>
                  {broadcast.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">{broadcast.recipientCount}</td>
              <td className="px-4 py-3 text-right">{broadcast.sentCount}</td>
              <td className="px-4 py-3 text-right">{broadcast.failedCount}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    to={`/admin/events/${eventId}/communications/${broadcast.id}`}
                    className="inline-flex"
                  >
                    <Button variant="ghost" size="sm" title="View Details">
                      <Eye className="size-4" />
                    </Button>
                  </Link>
                  {(broadcast.status === "SENDING" || broadcast.status === "SCHEDULED") &&
                    onCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(broadcast)}
                        title="Cancel"
                      >
                        <XCircle className="size-4" />
                      </Button>
                    )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
