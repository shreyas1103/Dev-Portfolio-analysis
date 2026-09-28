import apiClient from "./client";

export async function getResumeSuggestions() {
  const response = await apiClient.get("/resume/suggestions");
  return response.data.data.bullets;
}