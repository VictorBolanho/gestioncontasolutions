import { DataState } from "@/shared/components/ui/data-state";
import { formatPercent } from "@/lib/utils";

export function WorkloadPanel({ workload = [] }) {
  if (!workload.length) {
    return (
      <DataState
        title="Sin carga operativa registrada"
        description="Cuando existan tareas activas en el sistema, aquí verás distribución de trabajo por profesional."
      />
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-extrabold text-brand-ink">Carga por profesional</h3>
        <p className="mt-1 text-sm text-slate-500">Visibilidad gerencial sobre capacidad operativa y cumplimiento individual.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-[0.22em] text-slate-400">
              <th className="px-6 py-4 font-semibold">Usuario</th>
              <th className="px-6 py-4 font-semibold">Activas</th>
              <th className="px-6 py-4 font-semibold">Vencidas</th>
              <th className="px-6 py-4 font-semibold">Completadas Mes</th>
              <th className="px-6 py-4 font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {workload.map((item) => (
              <tr key={item.user.id} className="border-t border-slate-100 text-sm">
                <td className="px-6 py-4">
                  <div className="font-bold text-brand-ink">
                    {item.user.firstName} {item.user.lastName}
                  </div>
                  <div className="text-slate-500">{item.user.email}</div>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-700">{item.activeTasks}</td>
                <td className="px-6 py-4 font-semibold text-rose-600">{item.overdueTasks}</td>
                <td className="px-6 py-4 font-semibold text-teal-700">{item.completedThisMonth}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {formatPercent(item.complianceScore)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
