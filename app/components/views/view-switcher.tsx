import { Form, useSubmit } from "react-router";
import {
  Table2,
  LayoutGrid,
  Calendar,
  Image,
  Plus,
  Star,
  Share2,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import type { ViewType } from "~/generated/prisma/client.js";

interface SavedViewItem {
  id: string;
  name: string;
  viewType: ViewType;
  isShared: boolean;
  isDefault: boolean;
  userId: string | null;
  owner?: { id: string; name: string | null } | null;
}

interface ViewSwitcherProps {
  views: SavedViewItem[];
  activeViewId?: string;
  currentUserId: string;
  onSelectView?: (viewId: string) => void;
}

const VIEW_TYPE_ICONS: Record<ViewType, typeof Table2> = {
  TABLE: Table2,
  KANBAN: LayoutGrid,
  CALENDAR: Calendar,
  GALLERY: Image,
};

const VIEW_TYPE_LABELS: Record<ViewType, string> = {
  TABLE: "Table",
  KANBAN: "Kanban",
  CALENDAR: "Calendar",
  GALLERY: "Gallery",
};

export function ViewSwitcher({
  views,
  activeViewId,
  currentUserId,
  onSelectView,
}: ViewSwitcherProps) {
  const submit = useSubmit();

  return (
    <div className="space-y-3">
      {/* View type tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 p-1">
        {views.map((view) => {
          const Icon = VIEW_TYPE_ICONS[view.viewType] ?? Table2;
          const isActive = view.id === activeViewId;

          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onSelectView?.(view.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{view.name}</span>
              {view.isDefault && <Star className="size-3 text-yellow-500" />}
              {view.isShared && <Share2 className="size-3 text-blue-500" />}
            </button>
          );
        })}
      </div>

      {/* Actions for active view */}
      {activeViewId && (
        <div className="flex items-center gap-2">
          {views.find((v) => v.id === activeViewId)?.userId === currentUserId && (
            <>
              <Form method="post" className="inline">
                <input type="hidden" name="_action" value="duplicate-view" />
                <input type="hidden" name="viewId" value={activeViewId} />
                <Button type="submit" variant="ghost" size="sm">
                  <Copy className="mr-1 size-3" />
                  Duplicate
                </Button>
              </Form>
              <Form method="post" className="inline">
                <input type="hidden" name="_action" value="delete-view" />
                <input type="hidden" name="viewId" value={activeViewId} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1 size-3" />
                  Delete
                </Button>
              </Form>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ViewTypeIcon({ viewType }: { viewType: ViewType }) {
  const Icon = VIEW_TYPE_ICONS[viewType] ?? Table2;
  return <Icon className="size-4" />;
}

export { VIEW_TYPE_ICONS, VIEW_TYPE_LABELS };
