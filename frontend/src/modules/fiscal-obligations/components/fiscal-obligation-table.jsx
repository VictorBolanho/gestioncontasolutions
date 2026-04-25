import { Link } from "react-router-dom";

import { cn, formatDate } from "@/lib/utils";
import {
  fiscalObligationStatusLabels,
  fiscalObligationStatusTheme,
  fiscalObligationTypeLabels
} from "@/modules/fiscal-obligations/constants/fiscal-obligation-options";

function formatUser(user) {
  if (!user) return "Sin asignar";
  return user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
}

export function FiscalObligationTable({ obligations = [], users = [], onMarkSubmitted, onAssignUser }) {
  return (
    <div className="panel overflow-hidden">
      <div className="hidden overflow-x-auto xl:block">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-[0.22em] text-slate-400">
              <th className="px-6 py-4 font-semibold">Cliente</th>
              <th className="px-6 py-4 font-semibold">Tipo</th>
              <th className="px-6 py-4 font-semibold">Periodo</th>
              <th className="px-6 py-4 font-semibold">Año fiscal</th>
              <th className="px-6 py-4 font-semibold">Fecha vencimiento</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold">Responsable</th>
              <th className="px-6 py-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {obligations.map((obligation) => (
              <tr key={obligation._id} className="border-t border-slate-100 text-sm">
                <td className="px-6 py-5">
                  <p className="font-bold text-brand-ink">{obligation.companyId?.businessName || "Sin cliente"}</p>
                  <p className="mt-1 text-slate-500">{obligation.companyId?.nit || "Sin identificación"}</p>
                </td>
                <td className="px-6 py-5 text-slate-600">{fiscalObligationTypeLabels[obligation.type] || obligation.type}</td>
                <td className="px-6 py-5 text-slate-600">{obligation.period}</td>
                <td className="px-6 py-5 text-slate-600">{obligation.fiscalYear}</td>
                <td className="px-6 py-5 text-slate-600">{formatDate(obligation.dueDate)}</td>
                <td className="px-6 py-5">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", fiscalObligationStatusTheme[obligation.status])}>
                    {fiscalObligationStatusLabels[obligation.status] || obligation.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <select
                    className="field-input min-w-44 py-2 text-sm"
                    value={obligation.assignedUserId?._id || ""}
                    onChange={(event) => onAssignUser(obligation, event.target.value || null)}
                  >
                    <option value="">Sin asignar</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {formatUser(user)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-5">
                  <div className="flex gap-2">
                    <Link className="button-secondary px-4 py-2 text-xs" to={`/fiscal-obligations/${obligation._id}`}>
                      Ver
                    </Link>
                    <button
                      type="button"
                      className="button-secondary px-4 py-2 text-xs text-emerald-700"
                      disabled={obligation.status === "submitted"}
                      onClick={() => onMarkSubmitted(obligation)}
                    >
                      Presentada
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 p-4 xl:hidden">
        {obligations.map((obligation) => (
          <article key={obligation._id} className="panel-muted p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-brand-ink">{obligation.companyId?.businessName || "Sin cliente"}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {fiscalObligationTypeLabels[obligation.type] || obligation.type} · {obligation.period}
                </p>
              </div>
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold", fiscalObligationStatusTheme[obligation.status])}>
                {fiscalObligationStatusLabels[obligation.status] || obligation.status}
              </span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-600">
              <span>Vence: {formatDate(obligation.dueDate)}</span>
              <span>Responsable: {formatUser(obligation.assignedUserId)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="button-secondary px-4 py-2 text-xs" to={`/fiscal-obligations/${obligation._id}`}>
                Ver
              </Link>
              <button
                type="button"
                className="button-secondary px-4 py-2 text-xs text-emerald-700"
                disabled={obligation.status === "submitted"}
                onClick={() => onMarkSubmitted(obligation)}
              >
                Presentada
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
