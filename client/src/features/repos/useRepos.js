import { useQuery } from "@tanstack/react-query";
import { getRepos } from "../../api/repos.api";
export function useRepos(sort = "quality", limit = 20) {
  return useQuery({
    queryKey: ["repos", sort, limit],
    queryFn: () => getRepos(sort, limit),
  });
}