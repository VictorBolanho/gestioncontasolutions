import { StatCard } from "@/shared/components/ui/stat-card";

export function TaskCountersStrip({ counters }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Pendientes" value={counters?.pending ?? 0} accent="cyan" />
      <StatCard title="Vencidas" value={counters?.overdue ?? 0} accent="rose" />
      <StatCard title="Para hoy" value={counters?.today ?? 0} accent="amber" />
      <StatCard title="Esta semana" value={counters?.thisWeek ?? 0} accent="teal" />
    </div>
  );
}
