import { apiClient } from "@/lib/axios";

export async function fetchCompanies(params) {
  const response = await apiClient.get("/companies", { params });
  return response.data;
}

export async function fetchCompanyById(companyId) {
  const response = await apiClient.get(`/companies/${companyId}`);
  return response.data.data;
}

export async function createCompany(payload) {
  const hasInitialResponsibilities = Array.isArray(payload.initialResponsibilities) && payload.initialResponsibilities.length > 0;
  const endpoint = hasInitialResponsibilities ? "/companies/with-responsibilities" : "/companies";
  const response = await apiClient.post(endpoint, payload);
  return response.data.data;
}

export async function updateCompany(companyId, payload) {
  const response = await apiClient.patch(`/companies/${companyId}`, payload);
  return response.data.data;
}

export async function deleteCompany(companyId) {
  const response = await apiClient.delete(`/companies/${companyId}`);
  return response.data.data;
}

export async function fetchCompanyTasks(companyId) {
  const response = await apiClient.get("/tasks", {
    params: {
      companyId,
      limit: 6
    }
  });
  return response.data.data;
}

export async function fetchCompanyAuditLogs(companyId) {
  const response = await apiClient.get("/audit-logs", {
    params: {
      entityName: "Company",
      entityId: companyId,
      limit: 12
    }
  });
  return response.data.data;
}
