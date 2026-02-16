import { useEffect } from "react";
import { Link, useFetcher } from "react-router";
import { ArrowLeft, Save, Upload, Undo2, Redo2, Monitor, Columns2, Eye } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { AutosaveIndicator } from "./autosave-indicator";
import type { ViewMode } from "~/types/designer-state";
import type { AutosaveStatus } from "~/hooks/use-autosave";
import { cn } from "~/lib/utils";

interface DesignerToolbarProps {
  formName: string;
  eventId: string;
  formId: string;
  viewMode: ViewMode;
  canUndo: boolean;
  canRedo: boolean;
  autosaveStatus: AutosaveStatus;
  lastSavedAt: Date | null;
  onUndo: () => void;
  onRedo: () => void;
  onSetViewMode: (mode: ViewMode) => void;
  onSaveNow: () => void;
}

const viewModes: { mode: ViewMode; icon: typeof Monitor; label: string }[] = [
  { mode: "editor", icon: Monitor, label: "Editor" },
  { mode: "split", icon: Columns2, label: "Split" },
  { mode: "preview", icon: Eye, label: "Preview" },
];

export function DesignerToolbar({
  formName,
  eventId,
  formId,
  viewMode,
  canUndo,
  canRedo,
  autosaveStatus,
  lastSavedAt,
  onUndo,
  onRedo,
  onSetViewMode,
  onSaveNow,
}: DesignerToolbarProps) {
  const publishFetcher = useFetcher();
  const isPublishing = publishFetcher.state !== "idle";

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      } else if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        onRedo();
      } else if (mod && e.key === "s") {
        e.preventDefault();
        onSaveNow();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, onRedo, onSaveNow]);

  return (
    <div className="flex h-12 items-center gap-2 border-b bg-background px-3">
      {/* Back button */}
      <Link to={`/admin/events/${eventId}/forms`}>
        <Button variant="ghost" size="icon-sm">
          <ArrowLeft className="size-4" />
        </Button>
      </Link>

      {/* Form name */}
      <span className="truncate text-sm font-medium">{formName}</span>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Save + Publish */}
      <Button
        variant="outline"
        size="sm"
        onClick={onSaveNow}
        disabled={autosaveStatus === "saved" || autosaveStatus === "saving"}
      >
        <Save className="size-3.5" />
        <span className="hidden sm:inline">Save</span>
      </Button>

      <publishFetcher.Form method="post" action={`/api/v1/form-templates/${formId}/publish`}>
        <Button type="submit" variant="outline" size="sm" disabled={isPublishing}>
          <Upload className="size-3.5" />
          <span className="hidden sm:inline">{isPublishing ? "Publishing..." : "Publish"}</span>
        </Button>
      </publishFetcher.Form>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* View mode toggle */}
      <div className="flex items-center rounded-md border bg-muted p-0.5">
        {viewModes.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => onSetViewMode(mode)}
            title={label}
            className={cn(
              "inline-flex items-center justify-center rounded-sm px-2 py-1 text-xs transition-colors",
              viewMode === mode
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            <span className="ml-1 hidden lg:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Spacer + autosave status */}
      <div className="ml-auto">
        <AutosaveIndicator status={autosaveStatus} lastSavedAt={lastSavedAt} />
      </div>
    </div>
  );
}
