import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface OccupancyRecord {
  id: string;
  eventId: string;
  zoneId: string | null;
  currentCount: number;
  maxCapacity: number;
  lastUpdated: string;
}

interface OccupancyPanelProps {
  records: OccupancyRecord[];
}

function getOccupancyColor(percent: number): string {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 75) return "bg-yellow-500";
  return "bg-green-500";
}

function getOccupancyTextColor(percent: number): string {
  if (percent >= 90) return "text-red-700 dark:text-red-300";
  if (percent >= 75) return "text-yellow-700 dark:text-yellow-300";
  return "text-green-700 dark:text-green-300";
}

export function OccupancyPanel({ records }: OccupancyPanelProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Venue Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No occupancy zones configured for this event.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Venue Occupancy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {records.map((record) => {
          const percent =
            record.maxCapacity > 0
              ? Math.round((record.currentCount / record.maxCapacity) * 100)
              : 0;
          const barWidth = Math.min(percent, 100);

          return (
            <div key={record.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{record.zoneId ?? "Main Venue"}</span>
                <span className={getOccupancyTextColor(percent)}>
                  {record.currentCount}/{record.maxCapacity} ({percent}%)
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${getOccupancyColor(percent)}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
