import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface KanbanItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
  color?: string;
}

interface KanbanViewProps {
  columns: KanbanColumn[];
  onItemClick?: (itemId: string) => void;
}

const DEFAULT_COLORS: Record<string, string> = {
  PENDING: "border-t-yellow-400",
  IN_PROGRESS: "border-t-blue-400",
  APPROVED: "border-t-green-400",
  REJECTED: "border-t-red-400",
  COMPLETED: "border-t-green-600",
  DRAFT: "border-t-gray-400",
};

export function KanbanView({ columns, onItemClick }: KanbanViewProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex w-72 shrink-0 flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
            <Badge variant="secondary" className="text-xs">
              {column.items.length}
            </Badge>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            {column.items.map((item) => (
              <Card
                key={item.id}
                className={`cursor-pointer border-t-2 transition-shadow hover:shadow-md ${
                  column.color ?? DEFAULT_COLORS[column.id] ?? "border-t-primary"
                }`}
                onClick={() => onItemClick?.(item.id)}
              >
                <CardContent className="p-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.subtitle && (
                    <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
                  )}
                  {item.badge && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
            {column.items.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export type { KanbanItem, KanbanColumn };
