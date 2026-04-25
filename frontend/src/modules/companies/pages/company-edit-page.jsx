import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { fetchCompanyById, updateCompany } from "@/modules/companies/api/companies-api";
import { CompanyForm } from "@/modules/companies/components/company-form";
import { useCompanyForm } from "@/modules/companies/hooks/use-company-form";
import { fetchUsers } from "@/modules/users/api/users-api";
import { LoadingPanel } from "@/shared/components/feedback/loading-panel";

export function CompanyEditPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const companyQuery = useQuery({
    queryKey: ["companies", "detail", companyId],
    queryFn: () => fetchCompanyById(companyId)
  });

  const usersQuery = useQuery({
    queryKey: ["users", "company-form"],
    queryFn: () => fetchUsers()
  });

  const { values, setValues, updateField } = useCompanyForm(companyQuery.data || {});

  useEffect(() => {
    if (companyQuery.data) {
      setValues({
        businessName: companyQuery.data.businessName || "",
        nit: companyQuery.data.nit || "",
        companyType: companyQuery.data.companyType || "",
        taxRegime: companyQuery.data.taxRegime || "",
        city: companyQuery.data.city || "",
        economicActivity: companyQuery.data.economicActivity || "",
        assignedProfessional: companyQuery.data.assignedProfessional?._id || "",
        observations: companyQuery.data.observations || "",
        status: companyQuery.data.status || "ACTIVE",
        initialResponsibilities: []
      });
    }
  }, [companyQuery.data, setValues]);

  const updateMutation = useMutation({
    mutationFn: (payload) => updateCompany(companyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies", "detail", companyId] });
      navigate(`/companies/${companyId}`);
    }
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    updateMutation.mutate({
      businessName: values.businessName,
      nit: values.nit,
      companyType: values.companyType,
      taxRegime: values.taxRegime,
      city: values.city,
      economicActivity: values.economicActivity,
      assignedProfessional: values.assignedProfessional || null,
      observations: values.observations,
      status: values.status
    });
  };

  if (companyQuery.isLoading || usersQuery.isLoading || !companyQuery.data) {
    return <LoadingPanel title="Cargando empresa" description="Preparando la información para edición." />;
  }

  return (
    <>
      <CompanyForm
        mode="edit"
        values={values}
        users={usersQuery.data || []}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
        onOpenResponsibilitiesModal={() => {}}
        isSubmitting={updateMutation.isPending}
      />
      {updateMutation.isError ? (
        <div className="panel border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {updateMutation.error?.response?.data?.message || "No fue posible actualizar la empresa."}
        </div>
      ) : null}
    </>
  );
}
