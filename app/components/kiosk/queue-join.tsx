import { useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

const SERVICE_TYPES = [
  { value: "badge-pickup", label: "Badge Pickup" },
  { value: "information", label: "Information" },
  { value: "credential-verification", label: "Credential Verification" },
  { value: "general", label: "General Assistance" },
] as const;

interface QueueJoinProps {
  participantId: string;
  onDone: () => void;
}

export function QueueJoin({ participantId, onDone }: QueueJoinProps) {
  const fetcher = useFetcher();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const ticket = fetcher.data?.ticket as
    | { ticketNumber: string; estimatedWait: number | null }
    | undefined;
  const error = fetcher.data?.error as string | undefined;
  const isLoading = fetcher.state !== "idle";

  const handleJoin = (serviceType: string) => {
    setSelectedType(serviceType);
    fetcher.submit(
      {
        _action: "joinQueue",
        participantId,
        serviceType,
      },
      { method: "POST" },
    );
  };

  // Show ticket confirmation
  if (ticket) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">You're in the Queue!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Your Ticket Number
            </p>
            <p className="mt-2 text-7xl font-black text-primary">{ticket.ticketNumber}</p>
          </div>
          {ticket.estimatedWait != null && (
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">
                Estimated Wait
              </p>
              <p className="mt-1 text-2xl font-bold">
                {ticket.estimatedWait > 0 ? `~${ticket.estimatedWait} minutes` : "You're next!"}
              </p>
            </div>
          )}
          <Button size="lg" className="min-h-[56px] w-full text-lg" onClick={onDone}>
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Select a Service</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {SERVICE_TYPES.map((st) => (
          <Button
            key={st.value}
            variant="outline"
            size="lg"
            className="min-h-[64px] w-full text-xl"
            disabled={isLoading}
            onClick={() => handleJoin(st.value)}
          >
            {isLoading && selectedType === st.value ? "Joining..." : st.label}
          </Button>
        ))}

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
            <p className="text-lg font-medium text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
