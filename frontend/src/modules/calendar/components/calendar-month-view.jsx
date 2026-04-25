import { cn } from "@/lib/utils";
import { calendarEventTheme } from "@/modules/calendar/constants/calendar-options";
import { getMonthGrid, groupEventsByDay } from "@/modules/calendar/utils/calendar-utils";

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CalendarMonthView({ currentDate, events = [], onSelectEvent }) {
  const { cells } = getMonthGrid(currentDate);
  const grouped = groupEventsByDay(events);

  return (
    <div className="panel overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {weekDays.map((day) => (
          <div key={day} className="px-3 py-4 text-center text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const key = cell.date.toISOString().slice(0, 10);
          const dayEvents = grouped[key] || [];

          return (
            <article
              key={key}
              className={cn(
                "min-h-36 border-b border-r border-slate-100 p-3",
                !cell.isCurrentMonth && "bg-slate-50/60",
                cell.isToday && "bg-cyan-50/50"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                    cell.isToday ? "bg-brand-cyan text-white" : "text-slate-600"
                  )}
                >
                  {cell.date.getDate()}
                </span>
                {dayEvents.length ? <span className="text-[11px] font-bold text-slate-400">{dayEvents.length}</span> : null}
              </div>

              <div className="mt-3 space-y-2">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={`${event.type}-${event.id}`}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className={cn(
                      "w-full rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition hover:shadow-sm",
                      event.status === "OVERDUE"
                        ? calendarEventTheme.OVERDUE
                        : event.status === "COMPLETED"
                          ? calendarEventTheme.COMPLETED
                          : calendarEventTheme[event.type]
                    )}
                  >
                    <div className="truncate">{event.title}</div>
                    <div className="mt-1 truncate text-[11px] opacity-75">{event.company?.businessName || "Sin empresa"}</div>
                  </button>
                ))}
                {dayEvents.length > 3 ? <p className="px-1 text-[11px] font-bold text-slate-400">+ {dayEvents.length - 3} más</p> : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
