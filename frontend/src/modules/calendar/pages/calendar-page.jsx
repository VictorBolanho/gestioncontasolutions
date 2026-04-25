import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";

import { fetchCalendarEvents } from "@/modules/calendar/api/calendar-api";
import { CalendarEventDrawer } from "@/modules/calendar/components/calendar-event-drawer";
import { CalendarListView } from "@/modules/calendar/components/calendar-list-view";
import { CalendarMonthView } from "@/modules/calendar/components/calendar-month-view";
import { CalendarToolbar } from "@/modules/calendar/components/calendar-toolbar";
import { CalendarWeekView } from "@/modules/calendar/components/calendar-week-view";
import { fetchCompanies } from "@/modules/companies/api/companies-api";
import { fetchUsers } from "@/modules/users/api/users-api";
import { LoadingPanel } from "@/shared/components/feedback/loading-panel";
import { SectionHeading } from "@/shared/components/ui/section-heading";
import { getMonthRange, getWeekRange } from "@/modules/calendar/utils/calendar-utils";

export function CalendarPage() {
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filters, setFilters] = useState({
    companyId: "",
    personId: "",
    type: "ALL",
    startDate: "",
    endDate: ""
  });

  const computedRange = useMemo(() => {
    if (filters.startDate || filters.endDate) {
      return {
        start: filters.startDate ? new Date(filters.startDate) : getMonthRange(currentDate).start,
        end: filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : getMonthRange(currentDate).end
      };
    }

    return view === "week" ? getWeekRange(currentDate) : getMonthRange(currentDate);
  }, [currentDate, filters.endDate, filters.startDate, view]);

  const queryParams = useMemo(
    () => ({
      startDate: computedRange.start.toISOString(),
      endDate: computedRange.end.toISOString(),
      ...(filters.companyId ? { companyId: filters.companyId } : {}),
      ...(filters.personId ? { assignedTo: filters.personId, responsible: filters.personId } : {})
    }),
    [computedRange.end, computedRange.start, filters.companyId, filters.personId]
  );

  const [eventsQuery, companiesQuery, usersQuery] = useQueries({
    queries: [
      {
        queryKey: ["calendar", "events", view, queryParams],
        queryFn: () => fetchCalendarEvents(queryParams)
      },
      {
        queryKey: ["companies", "calendar-selector"],
        queryFn: () => fetchCompanies({ limit: 100 })
      },
      {
        queryKey: ["users", "calendar-selector"],
        queryFn: () => fetchUsers()
      }
    ]
  });

  const filteredEvents = useMemo(() => {
    const allEvents = eventsQuery.data || [];
    if (filters.type === "ALL") return allEvents;
    return allEvents.filter((event) => event.type === filters.type);
  }, [eventsQuery.data, filters.type]);

  const handleNavigate = (direction) => {
    if (direction === 0) {
      setCurrentDate(new Date());
      return;
    }

    setCurrentDate((current) => {
      const next = new Date(current);
      if (view === "week") {
        next.setDate(current.getDate() + direction * 7);
      } else {
        next.setMonth(current.getMonth() + direction);
      }
      return next;
    });
  };

  const renderCurrentView = () => {
    if (view === "week") {
      return <CalendarWeekView currentDate={currentDate} events={filteredEvents} onSelectEvent={setSelectedEvent} />;
    }

    if (view === "list") {
      return <CalendarListView events={filteredEvents} onSelectEvent={setSelectedEvent} />;
    }

    return <CalendarMonthView currentDate={currentDate} events={filteredEvents} onSelectEvent={setSelectedEvent} />;
  };

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Calendar Intelligence"
        title="Calendario operativo y tributario"
        description="Consolida tareas y vencimientos fiscales en una misma experiencia para anticipar riesgos y distribuir mejor la ejecución."
      />

      <CalendarToolbar
        view={view}
        currentDate={currentDate}
        onNavigate={handleNavigate}
        onViewChange={setView}
        filters={filters}
        onFilterChange={(field, value) =>
          setFilters((current) => ({
            ...current,
            [field]: value
          }))
        }
        companies={companiesQuery.data?.data || []}
        users={usersQuery.data || []}
      />

      {eventsQuery.isLoading ? (
        <LoadingPanel title="Cargando calendario" description="Estamos combinando tareas y obligaciones tributarias para tu vista actual." />
      ) : (
        renderCurrentView()
      )}

      <CalendarEventDrawer event={selectedEvent} open={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} />
    </section>
  );
}
