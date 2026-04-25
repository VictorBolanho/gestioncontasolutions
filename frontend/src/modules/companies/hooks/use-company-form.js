import { useMemo, useState } from "react";

export function useCompanyForm(initialValues = {}) {
  const baseState = useMemo(
    () => ({
      businessName: initialValues.businessName || "",
      personType: initialValues.personType || "JURIDICA",
      identificationType: initialValues.identificationType || "NIT",
      nit: initialValues.nit || "",
      verificationDigit: initialValues.verificationDigit || "",
      companyType: initialValues.companyType || "",
      taxRegime: initialValues.taxRegime || "",
      city: initialValues.city || "",
      municipality: initialValues.municipality || "",
      activeEmployees: initialValues.activeEmployees ?? 0,
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
