import { formatDate } from "@/lib/utils";
import { DataState } from "@/shared/components/ui/data-state";

export function CompanyHistoryCard({ logs = [] }) {
  if (!logs.length) {
    return (
      <DataState
        title="Sin historial disponible"
        description="El backend aún no registra eventos visibles para esta empresa o no existen cambios recientes."
      />
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-extrabold text-brand-ink">Historial</h3>
        <p className="mt-1 text-sm text-slate-500">Auditoría de acciones realizadas sobre la ficha de la empresa.</p>
      </div>
      <div className="space-y-4 p-6">
        {logs.map((log) => (
          <article key={log._id} className="relative border-l-2 border-cyan-200 pl-5">
            <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-brand-cyan" />
            <p className="text-sm font-bold text-brand-ink">{log.action}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">{formatDate(log.createdAt, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            <p className="mt-2 text-sm text-slate-600">
              {log.performedBy
                ? `${log.performedBy.firstName} ${log.performedBy.lastName}`.trim() || log.performedBy.email
                : "Sistema"}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
