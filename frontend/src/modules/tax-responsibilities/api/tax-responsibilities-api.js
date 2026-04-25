import { apiClient } from "@/lib/axios";

export async function fetchTaxResponsibilities(params = {}) {
  const response = await apiClient.get("/tax-responsibilities", { params });
  return response.data;
}

export async function fetchTaxResponsibilityById(responsibilityId) {
  const response = await apiClient.get(`/tax-responsibilities/${responsibilityId}`);
  return response.data.data;
}
