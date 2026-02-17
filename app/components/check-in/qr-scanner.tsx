import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (payload: string) => void;
  enabled?: boolean;
}

/**
 * Client-only QR code camera scanner.
 * Must be loaded with React.lazy() to prevent SSR import of html5-qrcode.
 */
export default function QRScanner({ onScan, enabled = true }: QRScannerProps) {
  const onScanRef = useRef(onScan);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef(0);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    async function start() {
      // Small delay to let any previous cleanup finish (React strict mode)
      await new Promise((r) => setTimeout(r, 50));
      if (cancelled) return;

      scanner = new Html5Qrcode("qr-reader");

      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            // Debounce: ignore same code within 3 seconds
            const now = Date.now();
            if (decodedText === lastScanRef.current && now - lastScanTimeRef.current < 3000) {
              return;
            }
            lastScanRef.current = decodedText;
            lastScanTimeRef.current = now;
            onScanRef.current(decodedText);
          },
          () => {
            // Scan failure (no QR found in frame) — ignore
          },
        );
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to start QR scanner:", err);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner!.clear())
          .catch(() => {
            // Best-effort cleanup
            try {
              scanner!.clear();
            } catch {
              // Already cleared
            }
          });
      }
    };
  }, [enabled]);

  return (
    <div className="overflow-hidden rounded-lg border bg-black">
      <div id="qr-reader" className="w-full" />
      {!enabled && (
        <div className="flex h-64 items-center justify-center bg-muted">
          <p className="text-muted-foreground">Scanner paused</p>
        </div>
      )}
    </div>
  );
}
