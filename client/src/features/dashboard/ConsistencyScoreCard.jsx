import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { useDashboard } from "./useDashboard";
import { ScoreBadge } from "../../components/ScoreBadge";

function ScoreExplanation({ explanation }) {
  return (
    <p className="text-sm text-slate-600">
      {explanation}
    </p>
  );
}

export function ConsistencyScoreCard() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>

        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-5 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-red-600">
          Unable to load consistency score.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Consistency Score</CardTitle>

          <ScoreBadge score={data.consistencyScore} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-4xl font-bold text-indigo-600">
          {data.consistencyScore}
          <span className="text-lg font-normal text-slate-500">
            /100
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            Current streak: {data.currentStreak} days
          </Badge>

          <Badge variant="secondary">
            Longest: {data.longestStreak} days
          </Badge>

          <Badge variant="outline">
            Trend: {data.trend}
          </Badge>
        </div>

        <ScoreExplanation
          explanation={data.explanation}
        />
      </CardContent>
    </Card>
  );
}