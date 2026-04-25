import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

const statusStyles = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  SUSPENDED: "bg-amber-50 text-amber-700"
};

export function CompanyTable({ companies = [], onDelete }) {
  return (
    <div className="panel overflow-hidden">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-[0.22em] text-slate-400">
              <th className="px-6 py-4 font-semibold">Empresa</th>
              <th className="px-6 py-4 font-semibold">Responsable</th>
              <th className="px-6 py-4 font-semibold">Ciudad</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company._id} className="border-t border-slate-100 text-sm">
                <td className="px-6 py-5">
                  <p className="font-bold text-brand-ink">{company.businessName}</p>
                  <p className="mt-1 text-slate-500">NIT {company.nit}</p>
                </td>
                <td className="px-6 py-5 text-slate-600">
                  {company.assignedProfessional
                    ? company.assignedProfessional.fullName ||
                      `${company.assignedProfessional.firstName} ${company.assignedProfessional.lastName}`.trim()
                    : "Sin asignar"}
                </td>
                <td className="px-6 py-5 text-slate-600">{company.city || "No definida"}</td>
                <td className="px-6 py-5">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", statusStyles[company.status] || statusStyles.INACTIVE)}>
                    {company.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex gap-2">
                    <Link className="button-secondary px-4 py-2 text-xs" to={`/companies/${company._id}`}>
                      Ver
                    </Link>
                    <Link className="button-secondary px-4 py-2 text-xs" to={`/companies/${company._id}/edit`}>
                      Editar
                    </Link>
                    <button type="button" className="button-secondary px-4 py-2 text-xs text-rose-700" onClick={() => onDelete(company)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 p-4 lg:hidden">
        {companies.map((company) => (
          <article key={company._id} className="panel-muted p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-brand-ink">{company.businessName}</h3>
                <p className="mt-1 text-sm text-slate-500">NIT {company.nit}</p>
              </div>
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold", statusStyles[company.status] || statusStyles.INACTIVE)}>
                {company.status}
              </span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-400">Ciudad:</span> {company.city || "No definida"}
              </p>
              <p>
                <span className="font-semibold text-slate-400">Responsable:</span>{" "}
                {company.assignedProfessional
                  ? company.assignedProfessional.fullName ||
                    `${company.assignedProfessional.firstName} ${company.assignedProfessional.lastName}`.trim()
                  : "Sin asignar"}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="button-secondary px-4 py-2 text-xs" to={`/companies/${company._id}`}>
                Ver
              </Link>
              <Link className="button-secondary px-4 py-2 text-xs" to={`/companies/${company._id}/edit`}>
                Editar
              </Link>
              <button type="button" className="button-secondary px-4 py-2 text-xs text-rose-700" onClick={() => onDelete(company)}>
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
