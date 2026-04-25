import { apiClient } from "@/lib/axios";

export async function loginRequest(payload) {
  const response = await apiClient.post("/auth/login", payload);
  return response.data;
}

export async function profileRequest() {
  const response = await apiClient.get("/auth/me");
  return response.data;
}
