import { useCallback, useRef } from "react";

/**
 * Generates success/failure tones using the Web Audio API.
 * No audio files needed — synthesized in real-time.
 */
export function useScanAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = "sine") => {
      try {
        const ctx = getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.value = 0.3;
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Audio not available — silently fail
      }
    },
    [getContext],
  );

  const playSuccess = useCallback(() => {
    playTone(880, 0.15); // A5 short beep
    setTimeout(() => playTone(1100, 0.2), 150); // C#6 rising confirm
  }, [playTone]);

  const playError = useCallback(() => {
    playTone(300, 0.3, "square"); // Low buzz
  }, [playTone]);

  const playWarning = useCallback(() => {
    playTone(600, 0.15);
    setTimeout(() => playTone(600, 0.15), 200); // Double beep
  }, [playTone]);

  return { playSuccess, playError, playWarning };
}
