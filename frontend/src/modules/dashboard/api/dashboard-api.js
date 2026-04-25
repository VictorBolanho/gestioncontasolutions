import { apiClient } from "@/lib/axios";

export async function fetchOverview() {
  const response = await apiClient.get("/dashboard/overview");
  return response.data.data;
}

export async function fetchWorkload() {
  const response = await apiClient.get("/dashboard/workload");
  return response.data.data;
}

export async function fetchCompliance() {
  const response = await apiClient.get("/dashboard/compliance");
  return response.data.data;
}
