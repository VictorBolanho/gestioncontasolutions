import { StatCard } from "@/shared/components/ui/stat-card";

export function OverviewGrid({ overview }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Clientes Totales" value={overview?.totalCompanies ?? 0} accent="cyan" />
      <StatCard title="Clientes Activos" value={overview?.activeCompanies ?? 0} accent="teal" />
      <StatCard title="Tareas Pendientes" value={overview?.pendingTasks ?? 0} accent="amber" />
      <StatCard title="Tareas Vencidas" value={overview?.overdueTasks ?? 0} accent="rose" />
      <StatCard title="Completadas este mes" value={overview?.completedThisMonth ?? 0} accent="teal" />
      <StatCard title="Clientes en riesgo" value={overview?.clientsAtRisk ?? 0} accent="rose" />
      <StatCard title="Obligaciones Próximas" value={overview?.responsibilitiesUpcoming ?? 0} accent="amber" />
      <StatCard title="Alertas Críticas" value={overview?.criticalAlerts ?? 0} accent="rose" />
    </div>
  );
}
