import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "./useDashboard";

export function SyncStatusBanner() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync Status</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-red-600">
          Unable to load sync status. Please try again.
        </CardContent>
      </Card>
    );
  }

  if (data.syncStatuses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-slate-600">
          No accounts connected yet. Connect GitHub or LeetCode to start
          syncing your activity.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync Status</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {data.syncStatuses.map((status) => (
          <div
            key={status.source}
            className="flex items-center justify-between rounded-md border border-slate-200 p-3"
          >
            <div>
              <p className="font-medium capitalize text-slate-900">
                {status.source}
              </p>

              {status.status === "success" && status.lastSyncedAt && (
                <p className="text-sm text-slate-500">
                  Last synced:{" "}
                  {new Date(status.lastSyncedAt).toLocaleString()}
                </p>
              )}
            </div>

            <Badge
              variant={status.status === "success" ? "default" : "destructive"}
            >
              {status.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}