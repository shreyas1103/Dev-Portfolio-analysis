import apiClient from "./client";

export async function getRepos(sort = "quality", limit = 20) {
  const response = await apiClient.get(`/repos?sort=${sort}&limit=${limit}`);
  return response.data.data.repos;
}