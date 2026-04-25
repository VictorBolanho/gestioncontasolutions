import { useMemo, useState } from "react";

export function useCompanyForm(initialValues = {}) {
  const baseState = useMemo(
    () => ({
      businessName: initialValues.businessName || "",
      nit: initialValues.nit || "",
      companyType: initialValues.companyType || "",
      taxRegime: initialValues.taxRegime || "",
      city: initialValues.city || "",
      economicActivity: initialValues.economicActivity || "",
      assignedProfessional: initialValues.assignedProfessional?._id || "",
      observations: initialValues.observations || "",
      status: initialValues.status || "ACTIVE",
      initialResponsibilities: initialValues.initialResponsibilities || []
    }),
    [initialValues]
  );

  const [values, setValues] = useState(baseState);

  const updateField = (name, value) => {
    setValues((current) => ({
      ...current,
      [name]: value
    }));
  };

  const setResponsibilities = (nextResponsibilities) => {
    setValues((current) => ({
      ...current,
      initialResponsibilities: nextResponsibilities
    }));
  };

  const reset = () => {
    setValues(baseState);
  };

  return {
    values,
    setValues,
    updateField,
    setResponsibilities,
    reset
  };
}
