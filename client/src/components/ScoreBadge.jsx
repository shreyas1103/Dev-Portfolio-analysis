import { Badge } from "@/components/ui/badge";

export function ScoreBadge({ score }) {
  if (score === null || score === undefined) {
    return (
      <Badge variant="secondary">
        No score
      </Badge>
    );
  }

  let className = "";

  if (score <= 40) {
    className =
      "border-rose-200 bg-rose-50 text-rose-700";
  } else if (score <= 70) {
    className =
      "border-amber-200 bg-amber-50 text-amber-700";
  } else {
    className =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return (
    <Badge
      variant="outline"
      className={className}
    >
      {score}/100
    </Badge>
  );
}