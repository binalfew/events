import { useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";

interface NowServingTicket {
  id: string;
  ticketNumber: string;
  counterNumber: number | null;
  status: string;
  joinedAt: string;
  participant: { firstName: string; lastName: string } | null;
}

interface QueueManagerProps {
  nowServing: NowServingTicket[];
  waitingCount: number;
  averageWaitMinutes: number;
  completedToday?: number;
}

export function QueueManager({
  nowServing,
  waitingCount,
  averageWaitMinutes,
  completedToday = 0,
}: QueueManagerProps) {
  const callFetcher = useFetcher();
  const actionFetcher = useFetcher();
  const [counterNumber, setCounterNumber] = useState("1");

  const myCounter = Number(counterNumber) || 1;
  const myTicket = nowServing.find((t) => t.counterNumber === myCounter);
  const calledTicket = callFetcher.data?.ticket as NowServingTicket | undefined;
  const activeTicket = myTicket ?? calledTicket;

  const handleCallNext = () => {
    callFetcher.submit(
      { _action: "callNext", counterNumber: String(myCounter) },
      { method: "POST" },
    );
  };

  const handleStartServing = (ticketId: string) => {
    actionFetcher.submit({ _action: "startServing", ticketId }, { method: "POST" });
  };

  const handleComplete = (ticketId: string) => {
    actionFetcher.submit({ _action: "complete", ticketId }, { method: "POST" });
  };

  const handleCancel = (ticketId: string) => {
    actionFetcher.submit({ _action: "cancel", ticketId }, { method: "POST" });
  };

  return (
    <div className="space-y-6">
      {/* Counter assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Your Counter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <Label htmlFor="counter-number">Counter Number</Label>
              <Input
                id="counter-number"
                type="number"
                min="1"
                max="10"
                value={counterNumber}
                onChange={(e) => setCounterNumber(e.target.value)}
                className="w-24"
              />
            </div>
            <Button onClick={handleCallNext} disabled={callFetcher.state !== "idle"} size="lg">
              {callFetcher.state !== "idle" ? "Calling..." : "Call Next"}
            </Button>
          </div>
          {callFetcher.data?.error && (
            <p className="mt-2 text-sm text-destructive">{callFetcher.data.error}</p>
          )}
        </CardContent>
      </Card>

      {/* Current ticket */}
      {activeTicket && (
        <Card>
          <CardHeader>
            <CardTitle>Current Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-black text-primary">{activeTicket.ticketNumber}</p>
                {activeTicket.participant && (
                  <p className="mt-1 text-lg text-muted-foreground">
                    {activeTicket.participant.firstName} {activeTicket.participant.lastName}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <Badge>{activeTicket.status}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Waiting since {new Date(activeTicket.joinedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {activeTicket.status === "CALLED" && (
                  <Button onClick={() => handleStartServing(activeTicket.id)} size="lg">
                    Start Serving
                  </Button>
                )}
                {(activeTicket.status === "SERVING" || activeTicket.status === "CALLED") && (
                  <>
                    <Button
                      onClick={() => handleComplete(activeTicket.id)}
                      size="lg"
                      variant="default"
                    >
                      Complete
                    </Button>
                    <Button
                      onClick={() => handleCancel(activeTicket.id)}
                      size="lg"
                      variant="destructive"
                    >
                      No Show
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Queue overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Waiting</p>
            <p className="text-3xl font-bold">{waitingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Avg Wait</p>
            <p className="text-3xl font-bold">
              {averageWaitMinutes > 0 ? `${averageWaitMinutes}m` : "--"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Served Today</p>
            <p className="text-3xl font-bold">{completedToday}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
