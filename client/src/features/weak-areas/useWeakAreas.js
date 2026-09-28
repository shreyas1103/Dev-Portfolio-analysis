import { useQuery } from "@tanstack/react-query";
import { getWeakAreas } from "../../api/weakAreas.api";
export function useWeakAreas() {
  return useQuery({
    queryKey: ["weak-areas"],
    queryFn: getWeakAreas,
  });
}