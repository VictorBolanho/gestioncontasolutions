import { apiClient } from "@/lib/axios";

export async function fetchFiscalObligations(params = {}) {
  const response = await apiClient.get("/fiscal-obligations", { params });
  return response.data;
}

export async function fetchFiscalObligationById(obligationId) {
  const response = await apiClient.get(`/fiscal-obligations/${obligationId}`);
  return response.data.data;
}

export async function updateFiscalObligation(obligationId, payload) {
  const response = await apiClient.patch(`/fiscal-obligations/${obligationId}`, payload);
  return response.data.data;
}

export async function fetchUpcomingFiscalObligations(params = {}) {
  const response = await apiClient.get("/fiscal-obligations/upcoming", { params });
  return response.data.data;
}

export async function fetchFiscalClientsAtRisk() {
  const response = await apiClient.get("/fiscal-obligations/clients-at-risk");
  return response.data.data;
}
