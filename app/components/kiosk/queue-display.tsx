import { useEffect, useRef } from "react";
import { useRevalidator } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

const POLL_INTERVAL = 5_000; // 5 seconds

interface NowServingTicket {
  ticketNumber: string;
  counterNumber: number | null;
  status: string;
  participant: { firstName: string; lastName: string } | null;
}

interface NextUpTicket {
  ticketNumber: string;
  priority: number;
}

interface QueueDisplayProps {
  nowServing: NowServingTicket[];
  nextUp: NextUpTicket[];
  waitingCount: number;
  averageWaitMinutes: number;
}

export function QueueDisplay({
  nowServing,
  nextUp,
  waitingCount,
  averageWaitMinutes,
}: QueueDisplayProps) {
  const revalidator = useRevalidator();
  const prevServingRef = useRef<string[]>([]);

  // Auto-refresh via polling
  useEffect(() => {
    const interval = setInterval(() => {
      if (revalidator.state === "idle") {
        revalidator.revalidate();
      }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [revalidator]);

  // Audio chime when new ticket is called
  useEffect(() => {
    const currentServing = nowServing.map((t) => t.ticketNumber).sort();
    const prevServing = prevServingRef.current;

    const hasNewTicket = currentServing.some((t) => !prevServing.includes(t));

    if (hasNewTicket && prevServing.length > 0) {
      playChime();
    }

    prevServingRef.current = currentServing;
  }, [nowServing]);

  return (
    <div className="flex h-full w-full flex-col gap-6">
      {/* Now Serving */}
      <Card className="flex-1">
        <CardHeader className="bg-primary pb-4 text-primary-foreground">
          <CardTitle className="text-center text-4xl">Now Serving</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {nowServing.length === 0 ? (
            <p className="py-12 text-center text-3xl text-muted-foreground">
              No one is being served right now
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nowServing.map((ticket) => (
                <div
                  key={ticket.ticketNumber}
                  className="rounded-xl border-2 border-primary bg-primary/5 p-6 text-center"
                >
                  {ticket.counterNumber && (
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">
                      Counter {ticket.counterNumber}
                    </p>
                  )}
                  <p className="mt-2 text-6xl font-black text-primary">{ticket.ticketNumber}</p>
                  {ticket.participant && (
                    <p className="mt-2 text-lg text-muted-foreground">
                      {ticket.participant.firstName} {ticket.participant.lastName}
                    </p>
                  )}
                  <Badge
                    variant={ticket.status === "SERVING" ? "default" : "secondary"}
                    className="mt-2"
                  >
                    {ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom row: Next Up + Stats */}
      <div className="flex gap-6">
        {/* Next Up */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Next Up</CardTitle>
          </CardHeader>
          <CardContent>
            {nextUp.length === 0 ? (
              <p className="py-4 text-center text-lg text-muted-foreground">Queue is empty</p>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {nextUp.map((ticket) => (
                  <div
                    key={ticket.ticketNumber}
                    className="rounded-lg border bg-muted px-6 py-3 text-center"
                  >
                    <p className="text-3xl font-bold">{ticket.ticketNumber}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="w-64 shrink-0">
          <CardHeader>
            <CardTitle className="text-center text-xl">Queue Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Waiting</p>
              <p className="text-4xl font-bold">{waitingCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Wait</p>
              <p className="text-4xl font-bold">
                {averageWaitMinutes > 0 ? `${averageWaitMinutes}m` : "--"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Web Audio API not available; fail silently
  }
}
