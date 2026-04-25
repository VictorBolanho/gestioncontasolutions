import { apiClient } from "@/lib/axios";

export async function fetchCalendarEvents(params = {}) {
  const response = await apiClient.get("/calendar/events", { params });
  return response.data.data;
}
