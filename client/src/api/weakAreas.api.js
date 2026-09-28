import apiClient from "./client";

export async function getWeakAreas() {
  const response = await apiClient.get("/weak-areas");
  return response.data.data;
}