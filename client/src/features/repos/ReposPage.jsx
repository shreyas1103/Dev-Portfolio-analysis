import { useRepos } from "./useRepos";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreBadge } from "../../components/ScoreBadge";

export function ReposPage() {
  const { data: repos, isLoading, isError } = useRepos();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />

        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-40" />
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
          Unable to load repositories.
        </CardContent>
      </Card>
    );
  }

  if (repos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-600">
          No repositories found. Connect your GitHub account in Settings to
          see your projects here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">
        Repositories
      </h1>

      <div className="grid gap-4">
        {repos.map((repo) => (
          <Card key={repo.externalRepoId}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-lg">
                  {repo.name}
                </CardTitle>

                {/* <Badge>
                  Quality: {repo.qualityScore ?? "Not yet scored"}
                </Badge> */}

                <ScoreBadge score={repo.qualityScore} />
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-slate-500">
                Last commit:{" "}
                {repo.lastCommitAt
                  ? new Date(repo.lastCommitAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}