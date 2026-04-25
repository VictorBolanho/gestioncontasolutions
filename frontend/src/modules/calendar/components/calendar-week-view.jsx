import { cn, formatDate } from "@/lib/utils";
import { calendarEventTheme } from "@/modules/calendar/constants/calendar-options";
import { getWeekDays, groupEventsByDay } from "@/modules/calendar/utils/calendar-utils";

export function CalendarWeekView({ currentDate, events = [], onSelectEvent }) {
  const weekDays = getWeekDays(currentDate);
  const grouped = groupEventsByDay(events);

  return (
    <div className="grid gap-4 xl:grid-cols-7">
      {weekDays.map((day) => {
        const key = day.date.toISOString().slice(0, 10);
        const dayEvents = grouped[key] || [];

        return (
          <section key={key} className="panel min-h-72 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                  {new Intl.DateTimeFormat("es-CO", { weekday: "short" }).format(day.date)}
                </p>
                <p className={cn("mt-2 text-2xl font-extrabold text-brand-ink", day.isToday && "text-brand-cyan")}>{day.date.getDate()}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{dayEvents.length}</span>
            </div>

            <div className="mt-4 space-y-3">
              {dayEvents.length ? (
                dayEvents.map((event) => (
                  <button
                    key={`${event.type}-${event.id}`}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className={cn(
                      "w-full rounded-3xl border px-4 py-4 text-left transition hover:shadow-sm",
                      event.status === "OVERDUE"
                        ? calendarEventTheme.OVERDUE
                        : event.status === "COMPLETED"
                          ? calendarEventTheme.COMPLETED
                          : calendarEventTheme[event.type]
                    )}
                  >
                    <p className="text-sm font-bold">{event.title}</p>
                    <p className="mt-1 text-xs opacity-75">{event.company?.businessName || "Sin empresa"}</p>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em]">{formatDate(event.date)}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                  Sin eventos
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
