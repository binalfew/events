import { useCallback, useEffect, useRef, useState } from "react";
import type { FormDefinition } from "~/types/form-designer";

export type AutosaveStatus = "saved" | "saving" | "unsaved" | "error";

interface UseAutosaveOptions {
  id: string;
  definition: FormDefinition;
  isDirty: boolean;
  debounceMs?: number;
  onSaved?: () => void;
}

export function useAutosave({
  id,
  definition,
  isDirty,
  debounceMs = 2000,
  onSaved,
}: UseAutosaveOptions) {
  const [status, setStatus] = useState<AutosaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const definitionRef = useRef(definition);
  definitionRef.current = definition;

  const save = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Cancel any inflight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("saving");

    try {
      const response = await fetch(`/api/v1/form-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ definition: definitionRef.current }),
        signal: controller.signal,
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("saved");
      setLastSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return; // Aborted — new save will follow
      }
      setStatus("error");
    }
  }, [id, onSaved]);

  // Debounced auto-save when dirty
  useEffect(() => {
    if (!isDirty) return;

    setStatus("unsaved");

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isDirty, definition, debounceMs, save]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { status, lastSavedAt, saveNow: save };
}
