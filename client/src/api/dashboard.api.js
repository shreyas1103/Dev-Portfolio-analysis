import apiClient from "./client";

export async function getDashboard() {
  const response = await apiClient.get("/dashboard");
  return response.data.data;
}
export async function getHeatmap(days = 90) {
  const response = await apiClient.get(`/dashboard/heatmap?days=${days}`);
  return response.data.data;
}