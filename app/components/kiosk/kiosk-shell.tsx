import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { useNavigate, useFetcher } from "react-router";
import { Button } from "~/components/ui/button";

const INACTIVITY_TIMEOUT = 120; // seconds
const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const COUNTDOWN_THRESHOLD = 30; // show countdown in last 30 seconds
const KIOSK_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Francais" },
  { code: "am", label: "Amharic" },
  { code: "ar", label: "Arabic" },
] as const;

interface KioskShellProps {
  deviceId: string;
  eventName: string;
  language: string;
  children: ReactNode;
  onSessionTimeout?: () => void;
}

export function KioskShell({
  deviceId,
  eventName,
  language,
  children,
  onSessionTimeout,
}: KioskShellProps) {
  const navigate = useNavigate();
  const heartbeatFetcher = useFetcher();
  const [secondsLeft, setSecondsLeft] = useState(INACTIVITY_TIMEOUT);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const [currentLang, setCurrentLang] = useState(language);

  const resetTimer = useCallback(() => {
    setSecondsLeft(INACTIVITY_TIMEOUT);
  }, []);

  // Auto-reset on inactivity
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          onSessionTimeout?.();
          navigate(`/kiosk/${deviceId}`);
          return INACTIVITY_TIMEOUT;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [deviceId, navigate, onSessionTimeout]);

  // Activity detection: reset timer on interaction
  useEffect(() => {
    const events = ["touchstart", "click", "keypress"] as const;
    const handler = () => resetTimer();
    events.forEach((e) => document.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
    };
  }, [resetTimer]);

  // Heartbeat ping every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      heartbeatFetcher.submit({ _action: "heartbeat" }, { method: "POST" });
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Fullscreen on mount
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {
        // Fullscreen may require user gesture; fail silently
      });
    }
  }, []);

  const showCountdown = secondsLeft <= COUNTDOWN_THRESHOLD;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header with event branding */}
      <header className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{eventName}</h1>
        </div>
        <div className="flex items-center gap-2">
          {KIOSK_LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              variant={currentLang === lang.code ? "default" : "outline"}
              size="sm"
              className="min-h-[48px] min-w-[48px] text-base"
              onClick={() => setCurrentLang(lang.code)}
            >
              {lang.label}
            </Button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center p-8">{children}</main>

      {/* Footer with countdown */}
      <footer className="flex items-center justify-between border-t bg-card px-6 py-3">
        <p className="text-sm text-muted-foreground">
          Touch the screen to keep your session active
        </p>
        {showCountdown && (
          <div className="rounded-md bg-destructive px-3 py-1 text-sm font-medium text-destructive-foreground">
            Session resets in {secondsLeft}s
          </div>
        )}
      </footer>
    </div>
  );
}
