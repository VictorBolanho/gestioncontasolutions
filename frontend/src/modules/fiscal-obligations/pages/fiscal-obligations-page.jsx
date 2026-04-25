import { useMemo, useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";

import { fetchCompanies } from "@/modules/companies/api/companies-api";
import { PaginationControls } from "@/modules/companies/components/pagination-controls";
import {
  fetchFiscalClientsAtRisk,
  fetchFiscalObligations,
  fetchUpcomingFiscalObligations,
  updateFiscalObligation
} from "@/modules/fiscal-obligations/api/fiscal-obligations-api";
import { FiscalObligationCards } from "@/modules/fiscal-obligations/components/fiscal-obligation-cards";
import { FiscalObligationFilters } from "@/modules/fiscal-obligations/components/fiscal-obligation-filters";
import { FiscalObligationTable } from "@/modules/fiscal-obligations/components/fiscal-obligation-table";
import { fetchUsers } from "@/modules/users/api/users-api";
import { LoadingPanel } from "@/shared/components/feedback/loading-panel";
import { DataState } from "@/shared/components/ui/data-state";
import { SectionHeading } from "@/shared/components/ui/section-heading";

const todayInput = () => new Date().toISOString().slice(0, 10);

const addDaysInput = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const initialFilters = {
  page: 1,
  limit: 10,
  companyId: "",
  status: "",
  dateFrom: "",
  dateTo: ""
};

export function FiscalObligationsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(initialFilters);

  const normalizedFilters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "" && value !== null && value !== undefined)
      ),
    [filters]
  );

  const [obligationsQuery, upcomingQuery, overdueQuery, riskQuery, companiesQuery, usersQuery] = useQueries({
    queries: [
      {
        queryKey: ["fiscal-obligations", normalizedFilters],
        queryFn: () => fetchFiscalObligations(normalizedFilters)
      },
      {
        queryKey: ["fiscal-obligations", "upcoming", 30],
        queryFn: () => fetchUpcomingFiscalObligations({ days: 30, limit: 100 })
      },
      {
        queryKey: ["fiscal-obligations", "overdue-count"],
        queryFn: () => fetchFiscalObligations({ status: "overdue", limit: 1 })
      },
      {
        queryKey: ["fiscal-obligations", "clients-at-risk"],
        queryFn: fetchFiscalClientsAtRisk
      },
      {
        queryKey: ["companies", "fiscal-obligation-selector"],
        queryFn: () => fetchCompanies({ limit: 100 })
      },
      {
        queryKey: ["users", "fiscal-obligation-selector"],
        queryFn: () => fetchUsers()
      }
    ]
  });

  const updateMutation = useMutation({
    mutationFn: ({ obligationId, payload }) => updateFiscalObligation(obligationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-obligations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
      page: field === "page" ? value : 1
    }));
  };

  const handlePreset = (preset) => {
    const presetFilters = {
      upcoming7: { status: "", dateFrom: todayInput(), dateTo: addDaysInput(7) },
      overdue: { status: "overdue", dateFrom: "", dateTo: "" },
      pending: { status: "pending", dateFrom: "", dateTo: "" },
      submitted: { status: "submitted", dateFrom: "", dateTo: "" }
    };

    setFilters((current) => ({
      ...current,
      ...presetFilters[preset],
      page: 1
    }));
  };

  const markSubmitted = (obligation) => {
    updateMutation.mutate({
      obligationId: obligation._id,
      payload: {
        status: "submitted",
        submittedAt: new Date().toISOString()
      }
    });
  };

  const assignUser = (obligation, assignedUserId) => {
    updateMutation.mutate({
      obligationId: obligation._id,
      payload: { assignedUserId }
    });
  };

  const obligations = obligationsQuery.data?.data || [];
  const companies = companiesQuery.data?.data || [];
  const users = usersQuery.data || [];

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Fiscal Operations"
        title="Panel operativo tributario"
        description="Controla vencimientos, responsables y riesgo fiscal por cliente desde obligaciones operativas reales."
      />

      <FiscalObligationCards
        upcomingCount={upcomingQuery.data?.length || 0}
        overdueCount={overdueQuery.data?.meta?.total || 0}
        riskCount={riskQuery.data?.length || 0}
      />

      <FiscalObligationFilters
        filters={filters}
        companies={companies}
        onChange={handleFilterChange}
        onReset={() => setFilters(initialFilters)}
        onPreset={handlePreset}
      />

      {obligationsQuery.isLoading || companiesQuery.isLoading || usersQuery.isLoading ? (
        <LoadingPanel title="Cargando obligaciones" description="Consultando vencimientos fiscales, clientes y responsables." />
      ) : obligations.length ? (
        <>
          <FiscalObligationTable
            obligations={obligations}
            users={users}
            onMarkSubmitted={markSubmitted}
            onAssignUser={assignUser}
          />
          <PaginationControls meta={obligationsQuery.data.meta} onPageChange={(page) => handleFilterChange("page", page)} />
        </>
      ) : (
        <DataState
          title="No encontramos obligaciones"
          description="Ajusta los filtros o genera obligaciones desde las responsabilidades fiscales del cliente."
        />
      )}
    </section>
  );
}
