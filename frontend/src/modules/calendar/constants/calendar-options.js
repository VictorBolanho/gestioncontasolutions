export const calendarViewOptions = [
  { label: "Mes", value: "month" },
  { label: "Semana", value: "week" },
  { label: "Lista", value: "list" }
];

export const calendarTypeOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Tareas", value: "TASK" },
  { label: "Obligaciones fiscales", value: "TAX_RESPONSIBILITY" }
];

export const calendarEventTheme = {
  TASK: "border-cyan-200 bg-cyan-50 text-cyan-900",
  TAX_RESPONSIBILITY: "border-violet-200 bg-violet-50 text-violet-900",
  OVERDUE: "border-rose-200 bg-rose-50 text-rose-900",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-900"
};
