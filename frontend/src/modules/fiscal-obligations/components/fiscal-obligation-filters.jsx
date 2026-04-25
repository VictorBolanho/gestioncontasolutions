export function FiscalObligationFilters({ filters, companies = [], onChange, onReset, onPreset }) {
  return (
    <div className="panel space-y-4 p-5">
      <div className="flex flex-wrap gap-3">
        <button type="button" className="button-secondary" onClick={() => onPreset("upcoming7")}>
          Próximas 7 días
        </button>
        <button type="button" className="button-secondary" onClick={() => onPreset("overdue")}>
          Vencidas
        </button>
        <button type="button" className="button-secondary" onClick={() => onPreset("pending")}>
          Pendientes
        </button>
        <button type="button" className="button-secondary" onClick={() => onPreset("submitted")}>
          Presentadas
        </button>
        <button type="button" className="button-secondary" onClick={onReset}>
          Limpiar filtros
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Cliente</label>
          <select className="field-input" value={filters.companyId} onChange={(event) => onChange("companyId", event.target.value)}>
            <option value="">Todos</option>
            {companies.map((company) => (
              <option key={company._id} value={company._id}>
                {company.businessName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Estado</label>
          <select className="field-input" value={filters.status} onChange={(event) => onChange("status", event.target.value)}>
            <option value="">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="in_progress">En proceso</option>
            <option value="submitted">Presentadas</option>
            <option value="overdue">Vencidas</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Desde</label>
          <input type="date" className="field-input" value={filters.dateFrom} onChange={(event) => onChange("dateFrom", event.target.value)} />
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Hasta</label>
          <input type="date" className="field-input" value={filters.dateTo} onChange={(event) => onChange("dateTo", event.target.value)} />
        </div>
      </div>
    </div>
  );
}
