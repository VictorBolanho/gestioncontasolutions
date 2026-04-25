import { DataState } from "@/shared/components/ui/data-state";
import { formatPercent } from "@/lib/utils";

export function CompliancePanel({ compliance = [] }) {
  if (!compliance.length) {
    return (
      <DataState
        title="Sin métricas de cumplimiento"
        description="Las métricas por empresa aparecerán cuando el sistema tenga tareas y obligaciones tributarias activas."
      />
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-extrabold text-brand-ink">Cumplimiento mensual por empresa</h3>
        <p className="mt-1 text-sm text-slate-500">Monitorea qué clientes exigen mayor atención y dónde hay riesgo operativo.</p>
      </div>

      <div className="space-y-4 p-6">
        {compliance.slice(0, 6).map((item) => (
          <article key={item.company.id} className="panel-muted px-5 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-bold text-brand-ink">{item.company.businessName}</p>
                <p className="text-sm text-slate-500">
                  NIT {item.company.nit} · {item.company.city}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-500">Cumplimiento</p>
                <p className="text-2xl font-extrabold text-brand-ink">{formatPercent(item.compliancePercentage)}%</p>
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-teal via-brand-cyan to-sky-400"
                style={{ width: `${Math.max(6, Math.min(item.compliancePercentage, 100))}%` }}
              />
            </div>

            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
              <div className="rounded-2xl bg-white px-4 py-3">
                <span className="font-semibold text-slate-400">Items Totales</span>
                <p className="mt-1 font-bold text-brand-ink">{item.totalItems}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <span className="font-semibold text-slate-400">Completados</span>
                <p className="mt-1 font-bold text-teal-700">{item.completedItems}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <span className="font-semibold text-slate-400">Vencidos</span>
                <p className="mt-1 font-bold text-rose-700">{item.overdueItems}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
