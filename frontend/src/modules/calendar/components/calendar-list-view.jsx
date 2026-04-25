import { cn, formatDate } from "@/lib/utils";
import { calendarEventTheme } from "@/modules/calendar/constants/calendar-options";
import { DataState } from "@/shared/components/ui/data-state";

export function CalendarListView({ events = [], onSelectEvent }) {
  if (!events.length) {
    return (
      <DataState
        title="Sin eventos para el rango actual"
        description="Ajusta filtros o navega a otro rango de fechas para visualizar tareas y vencimientos tributarios."
      />
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="space-y-3 p-4 md:p-6">
        {events.map((event) => (
          <button
            key={`${event.type}-${event.id}`}
            type="button"
            onClick={() => onSelectEvent(event)}
            className="flex w-full flex-col gap-3 rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-200 hover:bg-white md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]",
                    event.status === "OVERDUE"
                      ? calendarEventTheme.OVERDUE
                      : event.status === "COMPLETED"
                        ? calendarEventTheme.COMPLETED
                        : calendarEventTheme[event.type]
                  )}
                >
                  {event.type === "TASK" ? "Tarea" : "Obligación"}
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{event.status}</span>
              </div>
              <p className="mt-3 text-base font-bold text-brand-ink">{event.title}</p>
              <p className="mt-1 text-sm text-slate-500">{event.company?.businessName || "Sin empresa"}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm font-bold text-brand-ink">{formatDate(event.date)}</p>
              <p className="mt-1 text-xs text-slate-500">
                {event.assignedTo
                  ? event.assignedTo.fullName || `${event.assignedTo.firstName} ${event.assignedTo.lastName}`.trim()
                  : "Sin responsable"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
