export const taskStatusOptions = [
  { label: "Pendiente", value: "PENDING" },
  { label: "En proceso", value: "IN_PROGRESS" },
  { label: "Completada", value: "COMPLETED" },
  { label: "Vencida", value: "OVERDUE" }
];

export const taskPriorityOptions = [
  { label: "Baja", value: "LOW" },
  { label: "Media", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
  { label: "Crítica", value: "CRITICAL" }
];

export const taskStatusTheme = {
  PENDING: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-cyan-50 text-cyan-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  OVERDUE: "bg-rose-50 text-rose-700"
};

export const taskPriorityTheme = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-rose-50 text-rose-700"
};
