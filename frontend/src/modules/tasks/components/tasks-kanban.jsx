import { Link } from "react-router-dom";

import { formatDate, cn } from "@/lib/utils";
import { taskPriorityTheme, taskStatusTheme } from "@/modules/tasks/constants/task-options";

const columns = [
  { id: "PENDING", title: "Pendientes" },
  { id: "IN_PROGRESS", title: "En proceso" },
  { id: "COMPLETED", title: "Completadas" },
  { id: "OVERDUE", title: "Vencidas" }
];

export function TasksKanban({ tasks = [] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-4">
      {columns.map((column) => {
        const items = tasks.filter((task) => task.status === column.id);

        return (
          <section key={column.id} className="panel min-h-[26rem] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.18em] text-brand-ink">{column.title}</h3>
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold", taskStatusTheme[column.id])}>{items.length}</span>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((task) => (
                <article key={task._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                  <p className="font-bold text-brand-ink">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{task.company?.businessName || "Sin empresa"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={cn("rounded-full px-3 py-1 text-xs font-bold", taskPriorityTheme[task.priority])}>{task.priority}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">{formatDate(task.dueDate)}</span>
                  </div>
                  <Link className="mt-4 inline-flex text-sm font-bold text-brand-cyan" to={`/tasks/${task._id}`}>
                    Abrir detalle
                  </Link>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
