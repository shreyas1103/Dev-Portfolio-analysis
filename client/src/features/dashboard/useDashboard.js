import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../../api/dashboard.api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    refetchInterval: (query) => {
      const isPending = query.state.data?.syncStatuses?.some(
        (s) => s.status === "pending"
      );
      return isPending ? 30000 : false;
    },
  });
}