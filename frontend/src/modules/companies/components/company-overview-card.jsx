export function CompanyOverviewCard({ company }) {
  return (
    <div className="panel p-6">
      <span className="text-xs font-bold uppercase tracking-[0.28em] text-brand-cyan">Ficha general</span>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-ink">{company.businessName}</h2>
      <p className="mt-2 text-sm text-slate-500">
        NIT {company.nit} · {company.city || "Ciudad pendiente"} · {company.status}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Info label="Tipo empresa" value={company.companyType || "No definido"} />
        <Info label="Régimen" value={company.taxRegime || "No definido"} />
        <Info label="Actividad" value={company.economicActivity || "No definida"} />
        <Info
          label="Responsable"
          value={
            company.assignedProfessional
              ? company.assignedProfessional.fullName ||
                `${company.assignedProfessional.firstName} ${company.assignedProfessional.lastName}`.trim()
              : "Sin asignar"
          }
        />
      </div>

      <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Observaciones</p>
        <p className="mt-2 text-sm leading-7 text-slate-600">{company.observations || "Sin observaciones registradas."}</p>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-brand-ink">{value}</p>
    </div>
  );
}
