export function CompanyFilters({ filters, onChange, onReset, users = [] }) {
  return (
    <div className="panel grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
      <div className="xl:col-span-2">
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Búsqueda</label>
        <input
          className="field-input"
          placeholder="Razón social, NIT o ciudad"
          value={filters.search}
          onChange={(event) => onChange("search", event.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Ciudad</label>
        <input
          className="field-input"
          placeholder="Bogotá"
          value={filters.city}
          onChange={(event) => onChange("city", event.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Estado</label>
        <select className="field-input" value={filters.status} onChange={(event) => onChange("status", event.target.value)}>
          <option value="">Todos</option>
          <option value="ACTIVE">Activas</option>
          <option value="INACTIVE">Inactivas</option>
          <option value="SUSPENDED">Suspendidas</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Responsable</label>
        <select
          className="field-input"
          value={filters.assignedProfessional}
          onChange={(event) => onChange("assignedProfessional", event.target.value)}
        >
          <option value="">Todos</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.fullName || `${user.firstName} ${user.lastName}`.trim()}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end">
        <button type="button" className="button-secondary w-full" onClick={onReset}>
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
