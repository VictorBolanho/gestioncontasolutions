import { useMemo, useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { fetchCompanies } from "@/modules/companies/api/companies-api";
import { TaskCountersStrip } from "@/modules/tasks/components/task-counters-strip";
import { TaskFilters } from "@/modules/tasks/components/task-filters";
import { TaskTable } from "@/modules/tasks/components/task-table";
import { TasksKanban } from "@/modules/tasks/components/tasks-kanban";
import { deleteTask, fetchTaskCounters, fetchTasks } from "@/modules/tasks/api/tasks-api";
import { fetchUsers } from "@/modules/users/api/users-api";
import { LoadingPanel } from "@/shared/components/feedback/loading-panel";
import { DataState } from "@/shared/components/ui/data-state";
import { SectionHeading } from "@/shared/components/ui/section-heading";
import { PaginationControls } from "@/modules/companies/components/pagination-controls";

const initialFilters = {
  page: 1,
  limit: 10,
  companyId: "",
  assignedTo: "",
  status: "",
  priority: "",
  overdue: false,
  dateFrom: "",
  dateTo: ""
};

export function TasksPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(initialFilters);
  const [viewMode, setViewMode] = useState("table");

  const normalizedFilters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "" && value !== null && value !== undefined && value !== false)
      ),
    [filters]
  );

  const [tasksQuery, countersQuery, companiesQuery, usersQuery] = useQueries({
    queries: [
      {
        queryKey: ["tasks", normalizedFilters],
        queryFn: () => fetchTasks(normalizedFilters)
      },
      {
        queryKey: ["tasks", "counters"],
        queryFn: fetchTaskCounters
      },
      {
        queryKey: ["companies", "task-selector"],
        queryFn: () => fetchCompanies({ limit: 100 })
      },
      {
        queryKey: ["users", "task-selector"],
        queryFn: () => fetchUsers()
      }
    ]
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
      page: field === "page" ? value : 1
    }));
  };

  const handleDelete = (task) => {
    const confirmed = window.confirm(`¿Deseas eliminar la tarea "${task.title}"?`);
    if (confirmed) {
      deleteMutation.mutate(task._id);
    }
  };

  const companies = companiesQuery.data?.data || [];
  const users = usersQuery.data || [];
  const tasks = tasksQuery.data?.data || [];

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Task Operations"
        title="Gestión operativa de tareas"
        description="Supervisa ejecución, responsables, prioridades y vencimientos desde una vista premium diseñada para coordinación real."
        actions={
          <div className="flex gap-3">
            <button type="button" className={viewMode === "table" ? "button-primary" : "button-secondary"} onClick={() => setViewMode("table")}>
              Tabla
            </button>
            <button type="button" className={viewMode === "kanban" ? "button-primary" : "button-secondary"} onClick={() => setViewMode("kanban")}>
              Kanban
            </button>
            <Link to="/tasks/new" className="button-primary">
              Crear tarea
            </Link>
          </div>
        }
      />

      <TaskCountersStrip counters={countersQuery.data} />

      <TaskFilters filters={filters} onChange={handleFilterChange} onReset={() => setFilters(initialFilters)} companies={companies} users={users} />

      {tasksQuery.isLoading ? (
        <LoadingPanel title="Cargando tareas" description="Consultando tareas, responsables y prioridades desde el backend." />
      ) : tasks.length ? (
        <>
          {viewMode === "table" ? <TaskTable tasks={tasks} onDelete={handleDelete} /> : <TasksKanban tasks={tasks} />}
          {viewMode === "table" ? (
            <PaginationControls meta={tasksQuery.data.meta} onPageChange={(page) => handleFilterChange("page", page)} />
          ) : null}
        </>
      ) : (
        <DataState
          title="No encontramos tareas"
          description="Ajusta los filtros o crea una nueva tarea para empezar a coordinar la ejecución operativa."
        />
      )}
    </section>
  );
}
