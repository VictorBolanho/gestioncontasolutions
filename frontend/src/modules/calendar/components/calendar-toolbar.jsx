import { calendarTypeOptions, calendarViewOptions } from "@/modules/calendar/constants/calendar-options";

export function CalendarToolbar({ view, onViewChange, currentDate, onNavigate, filters, onFilterChange, companies = [], users = [] }) {
  return (
    <div className="space-y-4">
      <div className="panel flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-cyan">Planning Workspace</p>
          <h2 className="mt-2 text-3xl font-extrabold capitalize tracking-tight text-brand-ink">
            {new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(currentDate)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="button-secondary px-4 py-2 text-sm" onClick={() => onNavigate(-1)}>
            Anterior
          </button>
          <button type="button" className="button-secondary px-4 py-2 text-sm" onClick={() => onNavigate(0)}>
            Hoy
          </button>
          <button type="button" className="button-secondary px-4 py-2 text-sm" onClick={() => onNavigate(1)}>
            Siguiente
          </button>
          <div className="flex rounded-2xl border border-slate-200 bg-white p-1">
            {calendarViewOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={view === option.value ? "button-primary px-4 py-2 text-sm" : "button-secondary border-transparent px-4 py-2 text-sm shadow-none"}
                onClick={() => onViewChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Empresa</label>
          <select className="field-input" value={filters.companyId} onChange={(event) => onFilterChange("companyId", event.target.value)}>
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
          <select className="field-input" value={filters.personId} onChange={(event) => onFilterChange("personId", event.target.value)}>
            <option value="">Todos</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.fullName || `${user.firstName} ${user.lastName}`.trim()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Tipo</label>
          <select className="field-input" value={filters.type} onChange={(event) => onFilterChange("type", event.target.value)}>
            {calendarTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Desde</label>
          <input type="date" className="field-input" value={filters.startDate} onChange={(event) => onFilterChange("startDate", event.target.value)} />
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Hasta</label>
          <input type="date" className="field-input" value={filters.endDate} onChange={(event) => onFilterChange("endDate", event.target.value)} />
        </div>
      </div>
    </div>
  );
}
