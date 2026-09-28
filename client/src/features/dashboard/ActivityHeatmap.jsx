import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHeatmap } from "./useHeatmap";
import { formatDateKey, groupEventsByLocalDay } from "./heatmapUtils";

export function ActivityHeatmap({ days = 90 }) {
  const { data: events, isLoading, isError } = useHeatmap(days);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-red-600">
          Unable to load activity heatmap.
        </CardContent>
      </Card>
    );
  }

  const dailyCounts = groupEventsByLocalDay(events);

  const cells = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);

    const key = formatDateKey(day);

    cells.push({
      key,
      count: dailyCounts.get(key) ?? 0,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Heatmap</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-1">
          {cells.map((cell) => (
            <div
              key={cell.key}
              title={`${cell.key}: ${cell.count} activities`}
              className={`h-3 w-3 rounded-sm ${
                cell.count > 0 ? "bg-green-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}