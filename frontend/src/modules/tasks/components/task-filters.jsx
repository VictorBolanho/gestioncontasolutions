export function TaskFilters({ filters, onChange, onReset, companies = [], users = [] }) {
  return (
    <div className="panel grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Empresa</label>
        <select className="field-input" value={filters.companyId} onChange={(event) => onChange("companyId", event.target.value)}>
          <option value="">Todas</option>
          {companies.map((company) => (
            <option key={company._id} value={company._id}>
              {company.businessName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Responsable</label>
        <select className="field-input" value={filters.assignedTo} onChange={(event) => onChange("assignedTo", event.target.value)}>
          <option value="">Todos</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.fullName || `${user.firstName} ${user.lastName}`.trim()}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Estado</label>
        <select className="field-input" value={filters.status} onChange={(event) => onChange("status", event.target.value)}>
          <option value="">Todos</option>
          <option value="PENDING">Pendiente</option>
          <option value="IN_PROGRESS">En proceso</option>
          <option value="COMPLETED">Completada</option>
          <option value="OVERDUE">Vencida</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Prioridad</label>
        <select className="field-input" value={filters.priority} onChange={(event) => onChange("priority", event.target.value)}>
          <option value="">Todas</option>
          <option value="LOW">Baja</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
          <option value="CRITICAL">Crítica</option>
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

      <div className="xl:col-span-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={filters.overdue} onChange={(event) => onChange("overdue", event.target.checked)} />
          Solo vencidas
        </label>
        <button type="button" className="button-secondary" onClick={onReset}>
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
