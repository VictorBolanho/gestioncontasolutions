import { formatDate } from "@/lib/utils";
import { DataState } from "@/shared/components/ui/data-state";

export function CompanyResponsibilitiesCard({ responsibilities = [] }) {
  if (!responsibilities.length) {
    return (
      <DataState
        title="Sin responsabilidades registradas"
        description="Esta empresa aún no tiene obligaciones tributarias asociadas en el backend."
      />
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-extrabold text-brand-ink">Responsabilidades fiscales</h3>
        <p className="mt-1 text-sm text-slate-500">Seguimiento de obligaciones tributarias activas y sus próximos vencimientos.</p>
      </div>
      <div className="space-y-3 p-6">
        {responsibilities.map((item) => (
          <article key={item._id} className="panel-muted p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-base font-bold text-brand-ink">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.periodicity} · Próxima fecha: {formatDate(item.nextDate)}
                </p>
              </div>
              <div className="text-sm font-semibold text-slate-600">{item.status}</div>
            </div>
            <p className="mt-3 text-sm text-slate-600">{item.observation || "Sin observación."}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
