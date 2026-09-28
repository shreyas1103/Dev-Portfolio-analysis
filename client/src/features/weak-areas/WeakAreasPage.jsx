import { useWeakAreas } from "./useWeakAreas";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function WeakAreasPage() {
  const { data, isLoading, isError } = useWeakAreas();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />

        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6 text-red-600">
          Unable to load weak areas.
        </CardContent>
      </Card>
    );
  }

  if (data.weakAreas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weak Areas</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-600">
          {data.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">
        Weak Areas
      </h1>

      <div className="grid gap-4">
        {data.weakAreas.map((area) => (
          <Card key={area.topic}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-lg">
                  {area.topic}
                </CardTitle>

                <Badge variant="secondary">
                  Confidence: {area.confidence}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-slate-600">
                {area.reason}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}