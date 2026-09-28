import { useQuery } from "@tanstack/react-query";
import { getResumeSuggestions } from "../../api/resume.api";
export function useResumeSuggestions() {
  return useQuery({
    queryKey: ["resume-suggestions"],
    queryFn: getResumeSuggestions,
    retry: false, // don't retry a 422 — it's not a transient failure
  });
}