import { apiClient } from "@/lib/axios";

export async function fetchTasks(params = {}) {
  const response = await apiClient.get("/tasks", { params });
  return response.data;
}

export async function fetchTaskById(taskId) {
  const response = await apiClient.get(`/tasks/${taskId}`);
  return response.data.data;
}

export async function createTask(payload) {
  const response = await apiClient.post("/tasks", payload);
  return response.data.data;
}

export async function updateTask(taskId, payload) {
  const response = await apiClient.patch(`/tasks/${taskId}`, payload);
  return response.data.data;
}

export async function deleteTask(taskId) {
  const response = await apiClient.delete(`/tasks/${taskId}`);
  return response.data.data;
}

export async function fetchTaskCounters() {
  const response = await apiClient.get("/tasks/counters");
  return response.data.data;
}
