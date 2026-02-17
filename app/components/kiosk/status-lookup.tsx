import { useState, lazy, Suspense } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

const QRScanner =
  typeof window !== "undefined" ? lazy(() => import("~/components/check-in/qr-scanner")) : null;

interface ParticipantResult {
  id: string;
  firstName: string;
  lastName: string;
  registrationCode: string;
  status: string;
}

interface StatusLookupProps {
  onParticipantFound?: (participant: ParticipantResult) => void;
  onJoinQueue?: (participantId: string) => void;
}

export function StatusLookup({ onParticipantFound, onJoinQueue }: StatusLookupProps) {
  const fetcher = useFetcher();
  const [inputMode, setInputMode] = useState<"scan" | "manual">("manual");
  const [email, setEmail] = useState("");

  const participant = fetcher.data?.participant as ParticipantResult | undefined;
  const error = fetcher.data?.error as string | undefined;
  const isLoading = fetcher.state !== "idle";

  const handleScan = (payload: string) => {
    fetcher.submit({ _action: "scan", qrPayload: payload }, { method: "POST" });
  };

  const handleManualLookup = () => {
    if (!email.trim()) return;
    fetcher.submit({ _action: "lookup", query: email.trim() }, { method: "POST" });
  };

  const handleReset = () => {
    setEmail("");
    fetcher.data = undefined;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500";
      case "PENDING":
      case "SUBMITTED":
        return "bg-yellow-500";
      case "REJECTED":
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Show result if participant found
  if (participant) {
    onParticipantFound?.(participant);
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Participant Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div>
            <p className="text-3xl font-bold">
              {participant.firstName} {participant.lastName}
            </p>
            <p className="mt-1 text-lg text-muted-foreground">{participant.registrationCode}</p>
          </div>
          <div className="flex justify-center">
            <div
              className={`inline-flex items-center rounded-full px-6 py-3 text-xl font-bold text-white ${statusColor(participant.status)}`}
            >
              {participant.status}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {onJoinQueue && (
              <Button
                size="lg"
                className="min-h-[56px] text-lg"
                onClick={() => onJoinQueue(participant.id)}
              >
                Join Queue
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className="min-h-[56px] text-lg"
              onClick={handleReset}
            >
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Look Up Your Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <Button
            variant={inputMode === "manual" ? "default" : "outline"}
            className="min-h-[48px] flex-1 text-base"
            onClick={() => setInputMode("manual")}
          >
            Enter Email / Code
          </Button>
          <Button
            variant={inputMode === "scan" ? "default" : "outline"}
            className="min-h-[48px] flex-1 text-base"
            onClick={() => setInputMode("scan")}
          >
            Scan QR Code
          </Button>
        </div>

        {inputMode === "manual" ? (
          <div className="space-y-4">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or Registration Code"
              className="min-h-[56px] text-lg"
              onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
            />
            <Button
              onClick={handleManualLookup}
              disabled={isLoading || !email.trim()}
              size="lg"
              className="min-h-[56px] w-full text-lg"
            >
              {isLoading ? "Looking up..." : "Look Up"}
            </Button>
          </div>
        ) : (
          <div className="flex min-h-[300px] items-center justify-center rounded-lg border bg-muted">
            {QRScanner ? (
              <Suspense fallback={<p className="text-muted-foreground">Loading scanner...</p>}>
                <QRScanner onScan={handleScan} />
              </Suspense>
            ) : (
              <p className="text-muted-foreground">QR Scanner unavailable</p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
            <p className="text-lg font-medium text-destructive">{error}</p>
            <Button variant="outline" className="mt-3 min-h-[48px]" onClick={handleReset}>
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
