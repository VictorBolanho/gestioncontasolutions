import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { createCompany } from "@/modules/companies/api/companies-api";
import { CompanyForm } from "@/modules/companies/components/company-form";
import { InitialResponsibilitiesModal } from "@/modules/companies/components/initial-responsibilities-modal";
import { useCompanyForm } from "@/modules/companies/hooks/use-company-form";
import { fetchUsers } from "@/modules/users/api/users-api";
import { LoadingPanel } from "@/shared/components/feedback/loading-panel";

export function CompanyCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { values, updateField, setResponsibilities } = useCompanyForm();
  const [responsibilitiesModalOpen, setResponsibilitiesModalOpen] = useState(false);

  const usersQuery = useQuery({
    queryKey: ["users", "company-form"],
    queryFn: () => fetchUsers()
  });

  if (usersQuery.isLoading) {
    return <LoadingPanel title="Preparando formulario" description="Cargando responsables activos para registrar la empresa." />;
  }

  const createMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      navigate(`/companies/${company._id}`);
    }
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    createMutation.mutate({
      ...values,
      activeEmployees: Number(values.activeEmployees) || 0,
      assignedProfessional: values.assignedProfessional || null
    });
  };

  return (
    <>
      <CompanyForm
        mode="create"
        values={values}
        users={usersQuery.data || []}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
        onOpenResponsibilitiesModal={() => setResponsibilitiesModalOpen(true)}
        isSubmitting={createMutation.isPending}
      />

      {createMutation.isError ? (
        <div className="panel border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {createMutation.error?.response?.data?.message || "No fue posible crear la empresa."}
        </div>
      ) : null}

      <InitialResponsibilitiesModal
        open={responsibilitiesModalOpen}
        value={values.initialResponsibilities}
        users={usersQuery.data || []}
        onClose={() => setResponsibilitiesModalOpen(false)}
        onSave={setResponsibilities}
      />
    </>
  );
}
