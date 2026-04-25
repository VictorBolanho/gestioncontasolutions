import { apiClient } from "@/lib/axios";

export async function fetchUsers(params = {}) {
  const response = await apiClient.get("/users", { params });
  return response.data.data;
}
