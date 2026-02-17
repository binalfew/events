import { data, useFetcher, useLoaderData } from "react-router";
import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { listCheckpoints } from "~/services/checkpoints.server";
import { processScan, processManualEntry } from "~/services/check-in.server";
import type { ScanResponse } from "~/services/check-in.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { ScanResultDisplay } from "~/components/check-in/scan-result-display";
import { ManualEntry } from "~/components/check-in/manual-entry";
import { CheckpointSelector } from "~/components/check-in/checkpoint-selector";
import { ScanHistory, type ScanHistoryItem } from "~/components/check-in/scan-history";
import { useScanAudio } from "~/hooks/use-scan-audio";
import type { Route } from "./+types/check-in";

// Client-only QR scanner (prevents html5-qrcode SSR crash)
const QRScanner =
  typeof window !== "undefined" ? lazy(() => import("~/components/check-in/qr-scanner")) : null;

export const handle = { breadcrumb: "Check-in" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "check-in", "scan");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    select: { id: true, name: true },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  const checkpoints = await listCheckpoints(tenantId, { eventId, isActive: true });

  return { event, checkpoints };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "check-in", "scan");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  const checkpointId = formData.get("checkpointId") as string;

  if (!checkpointId) {
    return data({ error: "Please select a checkpoint" }, { status: 400 });
  }

  const ctx = {
    userId: user.id,
    tenantId,
    checkpointId,
    deviceId: (formData.get("deviceId") as string) || undefined,
  };

  try {
    if (_action === "scan") {
      const qrPayload = formData.get("qrPayload") as string;
      if (!qrPayload) return data({ error: "No QR payload" }, { status: 400 });
      const overrideReason = (formData.get("overrideReason") as string) || undefined;
      const result = await processScan(qrPayload, ctx, overrideReason);
      return data(result);
    }

    if (_action === "manual") {
      const registrationCode = formData.get("registrationCode") as string;
      if (!registrationCode) return data({ error: "Registration code required" }, { status: 400 });
      const result = await processManualEntry(registrationCode, ctx);
      return data(result);
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return data({ result: "INVALID", message: error.message ?? "Scan failed" } as ScanResponse, {
      status: 500,
    });
  }
}

// ─── Component ────────────────────────────────────────────

export default function CheckInPage() {
  const { event, checkpoints } = useLoaderData<typeof loader>();
  const scanFetcher = useFetcher<ScanResponse>();
  const manualFetcher = useFetcher<ScanResponse>();
  const { playSuccess, playError, playWarning } = useScanAudio();

  const [selectedCheckpoint, setSelectedCheckpoint] = useState(
    checkpoints.length === 1 ? checkpoints[0].id : "",
  );
  const [lastResult, setLastResult] = useState<ScanResponse | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const prevScanDataRef = useRef(scanFetcher.data);
  const prevManualDataRef = useRef(manualFetcher.data);

  const handleScanResult = useCallback(
    (result: ScanResponse) => {
      setLastResult(result);

      // Audio feedback
      if (result.result === "VALID" || result.result === "MANUAL_OVERRIDE") {
        playSuccess();
      } else if (result.result === "ALREADY_SCANNED" || result.result === "EXPIRED") {
        playWarning();
      } else {
        playError();
      }

      // Add to history
      setHistory((prev) => [
        {
          result: result.result,
          participantName: result.participantName,
          registrationCode: result.registrationCode,
          message: result.message,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 49), // Keep last 50
      ]);
    },
    [playSuccess, playError, playWarning],
  );

  // Watch scan fetcher
  useEffect(() => {
    if (scanFetcher.data && scanFetcher.data !== prevScanDataRef.current) {
      prevScanDataRef.current = scanFetcher.data;
      if (scanFetcher.data.result) {
        handleScanResult(scanFetcher.data);
      }
    }
  }, [scanFetcher.data, handleScanResult]);

  // Watch manual fetcher
  useEffect(() => {
    if (manualFetcher.data && manualFetcher.data !== prevManualDataRef.current) {
      prevManualDataRef.current = manualFetcher.data;
      if (manualFetcher.data.result) {
        handleScanResult(manualFetcher.data);
      }
    }
  }, [manualFetcher.data, handleScanResult]);

  const handleQRScan = useCallback(
    (payload: string) => {
      if (!selectedCheckpoint) return;
      scanFetcher.submit(
        { _action: "scan", qrPayload: payload, checkpointId: selectedCheckpoint },
        { method: "POST" },
      );
    },
    [selectedCheckpoint, scanFetcher],
  );

  const handleManualEntry = useCallback(
    (registrationCode: string) => {
      if (!selectedCheckpoint) return;
      manualFetcher.submit(
        { _action: "manual", registrationCode, checkpointId: selectedCheckpoint },
        { method: "POST" },
      );
    },
    [selectedCheckpoint, manualFetcher],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Check-in Scanner</h2>
        <p className="mt-1 text-sm text-muted-foreground">Scan badges at {event.name}.</p>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Scanner + Controls */}
        <div className="space-y-4">
          <CheckpointSelector
            checkpoints={checkpoints}
            value={selectedCheckpoint}
            onChange={setSelectedCheckpoint}
          />

          {/* QR Scanner — client only */}
          {QRScanner && selectedCheckpoint && (
            <Suspense
              fallback={
                <div className="flex h-64 items-center justify-center rounded-lg border bg-muted">
                  <p className="text-muted-foreground">Loading camera...</p>
                </div>
              }
            >
              <QRScanner onScan={handleQRScan} enabled={!!selectedCheckpoint} />
            </Suspense>
          )}

          {!selectedCheckpoint && (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">Select a checkpoint to start scanning</p>
            </div>
          )}

          {/* Manual Entry Fallback */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manual Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <ManualEntry
                onSubmit={handleManualEntry}
                disabled={!selectedCheckpoint || manualFetcher.state !== "idle"}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Result + History */}
        <div className="space-y-4">
          {/* Scan Result Display */}
          {lastResult && (
            <ScanResultDisplay
              result={lastResult.result}
              message={lastResult.message}
              participantName={lastResult.participantName}
              registrationCode={lastResult.registrationCode}
              onDismiss={() => setLastResult(null)}
            />
          )}

          {/* Scan History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <ScanHistory items={history} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
