import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { deleteCompany, fetchCompanies } from "@/modules/companies/api/companies-api";
import { CompanyFilters } from "@/modules/companies/components/company-filters";
import { CompanyTable } from "@/modules/companies/components/company-table";
import { PaginationControls } from "@/modules/companies/components/pagination-controls";
import { fetchUsers } from "@/modules/users/api/users-api";
import { LoadingPanel } from "@/shared/components/feedback/loading-panel";
import { DataState } from "@/shared/components/ui/data-state";
import { SectionHeading } from "@/shared/components/ui/section-heading";

const initialFilters = {
  page: 1,
  limit: 10,
  search: "",
  city: "",
  status: "",
  assignedProfessional: ""
};

export function CompaniesPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(initialFilters);

  const normalizedFilters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "" && value !== null && value !== undefined)
      ),
    [filters]
  );

  const companiesQuery = useQuery({
    queryKey: ["companies", normalizedFilters],
    queryFn: () => fetchCompanies(normalizedFilters)
  });

  const usersQuery = useQuery({
    queryKey: ["users", "company-selector"],
    queryFn: () => fetchUsers()
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    }
  });

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
      page: field === "page" ? value : 1
    }));
  };

  const handleDelete = (company) => {
    const confirmed = window.confirm(`¿Deseas eliminar ${company.businessName}?`);
    if (confirmed) {
      deleteMutation.mutate(company._id);
    }
  };

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Client Companies"
        title="Empresas clientes"
        description="Gestiona la base empresarial, su asignación operativa y el punto de entrada a cumplimiento, tareas y trazabilidad."
        actions={
          <Link to="/companies/new" className="button-primary">
            Crear empresa
          </Link>
        }
      />

      <CompanyFilters
        filters={filters}
        users={usersQuery.data || []}
        onChange={handleFilterChange}
        onReset={() => setFilters(initialFilters)}
      />

      {companiesQuery.isLoading ? (
        <LoadingPanel title="Cargando empresas" description="Estamos consultando el listado con filtros y paginación." />
      ) : companiesQuery.data?.data?.length ? (
        <>
          <CompanyTable companies={companiesQuery.data.data} onDelete={handleDelete} />
          <PaginationControls meta={companiesQuery.data.meta} onPageChange={(page) => handleFilterChange("page", page)} />
        </>
      ) : (
        <DataState
          title="No encontramos empresas"
          description="Ajusta los filtros o registra la primera empresa cliente para empezar a operar desde el sistema."
        />
      )}
    </section>
  );
}
