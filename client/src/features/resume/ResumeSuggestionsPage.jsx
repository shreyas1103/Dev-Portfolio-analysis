import { useResumeSuggestions } from "./useResumeSuggestions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function ResumeSuggestionsPage() {
  const {
    data: bullets,
    isLoading,
    error,
    isError,
  } = useResumeSuggestions();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />

        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    const errorData = error?.response?.data?.error;

    if (errorData?.reason === "insufficient_history") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Resume Suggestions</CardTitle>
          </CardHeader>

          <CardContent className="text-slate-600">
            Keep practicing — we need at least{" "}
            {errorData.daysRequired} days of activity before generating
            suggestions.

            <p className="mt-2">
              You're at {errorData.daysTracked} of{" "}
              {errorData.daysRequired} days.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="pt-6 text-red-600">
          Unable to load resume suggestions.
        </CardContent>
      </Card>
    );
  }

  const grouped = bullets.reduce((acc, bullet) => {
    (acc[bullet.category] ??= []).push(bullet);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">
        Resume Suggestions
      </h1>

      {Object.entries(grouped).map(([category, categoryBullets]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg">
                {category}
              </CardTitle>

              <Badge variant="secondary">
                {categoryBullets.length}{" "}
                {categoryBullets.length === 1
                  ? "suggestion"
                  : "suggestions"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <ul className="list-disc space-y-3 pl-5 text-slate-700">
              {categoryBullets.map((bullet, i) => (
                <li key={i}>{bullet.text}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}