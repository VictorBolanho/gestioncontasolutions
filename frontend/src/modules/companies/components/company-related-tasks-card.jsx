import { Link } from "react-router-dom";

import { formatDate } from "@/lib/utils";
import { DataState } from "@/shared/components/ui/data-state";

export function CompanyRelatedTasksCard({ tasks = [] }) {
  if (!tasks.length) {
    return (
      <DataState
        title="Sin tareas relacionadas"
        description="Cuando la operación cree tareas para esta empresa, aquí verás prioridades, responsables y fechas límite."
      />
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-extrabold text-brand-ink">Tareas relacionadas</h3>
        <p className="mt-1 text-sm text-slate-500">Lectura rápida de la operación activa asociada a esta empresa.</p>
      </div>
      <div className="space-y-3 p-6">
        {tasks.map((task) => (
          <article key={task._id} className="panel-muted p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-bold text-brand-ink">{task.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {task.priority} · {task.status} · vence {formatDate(task.dueDate)}
                </p>
              </div>
              <Link to="/tasks" className="button-secondary px-4 py-2 text-xs">
                Ir a tareas
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
