export const fiscalObligationStatusOptions = [
  { label: "Pendiente", value: "pending" },
  { label: "En proceso", value: "in_progress" },
  { label: "Presentada", value: "submitted" },
  { label: "Vencida", value: "overdue" }
];

export const fiscalObligationStatusLabels = {
  pending: "Pendiente",
  in_progress: "En proceso",
  submitted: "Presentada",
  overdue: "Vencida"
};

export const fiscalObligationStatusTheme = {
  pending: "bg-amber-50 text-amber-700",
  in_progress: "bg-cyan-50 text-cyan-700",
  submitted: "bg-emerald-50 text-emerald-700",
  overdue: "bg-rose-50 text-rose-700"
};

export const fiscalObligationTypeLabels = {
  RENTA: "Renta",
  IVA: "IVA",
  RETEFUENTE: "Retención",
  ICA: "ICA",
  EXOGENA: "Exógena",
  NOMINA_ELECTRONICA: "Nómina electrónica",
  FACTURACION_ELECTRONICA: "Facturación electrónica",
  MEDIOS_MAGNETICOS: "Medios magnéticos",
  OTRA: "Otra"
};
