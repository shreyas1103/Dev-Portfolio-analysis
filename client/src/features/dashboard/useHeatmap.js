import { useQuery } from "@tanstack/react-query";
import { getHeatmap } from "../../api/dashboard.api";

export function useHeatmap(days = 90) {
  return useQuery({
    queryKey: ["heatmap", days],
    queryFn: () => getHeatmap(days),
  });
}