import { StatCard } from "@/shared/components/ui/stat-card";

export function FiscalObligationCards({ upcomingCount = 0, overdueCount = 0, riskCount = 0 }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard title="Próximas 30 días" value={upcomingCount} accent="amber" />
      <StatCard title="Vencidas" value={overdueCount} accent="rose" />
      <StatCard title="Clientes en riesgo" value={riskCount} accent="cyan" />
    </div>
  );
}
