import { Link } from "react-router-dom";

import { formatDate, cn } from "@/lib/utils";
import { taskPriorityTheme, taskStatusTheme } from "@/modules/tasks/constants/task-options";

export function TaskTable({ tasks = [], onDelete }) {
  return (
    <div className="panel overflow-hidden">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-[0.22em] text-slate-400">
              <th className="px-6 py-4 font-semibold">Tarea</th>
              <th className="px-6 py-4 font-semibold">Empresa</th>
              <th className="px-6 py-4 font-semibold">Responsable</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold">Prioridad</th>
              <th className="px-6 py-4 font-semibold">Vence</th>
              <th className="px-6 py-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task._id} className="border-t border-slate-100 text-sm">
                <td className="px-6 py-5">
                  <p className="font-bold text-brand-ink">{task.title}</p>
                  <p className="mt-1 text-slate-500">{task.description || "Sin descripción"}</p>
                </td>
                <td className="px-6 py-5 text-slate-600">{task.company?.businessName || "Sin empresa"}</td>
                <td className="px-6 py-5 text-slate-600">
                  {task.assignedTo
                    ? task.assignedTo.fullName || `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.trim()
                    : "Sin asignar"}
                </td>
                <td className="px-6 py-5">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", taskStatusTheme[task.status])}>{task.status}</span>
                </td>
                <td className="px-6 py-5">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", taskPriorityTheme[task.priority])}>{task.priority}</span>
                </td>
                <td className="px-6 py-5 text-slate-600">{formatDate(task.dueDate)}</td>
                <td className="px-6 py-5">
                  <div className="flex gap-2">
                    <Link className="button-secondary px-4 py-2 text-xs" to={`/tasks/${task._id}`}>
                      Ver
                    </Link>
                    <Link className="button-secondary px-4 py-2 text-xs" to={`/tasks/${task._id}/edit`}>
                      Editar
                    </Link>
                    <button type="button" className="button-secondary px-4 py-2 text-xs text-rose-700" onClick={() => onDelete(task)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 p-4 lg:hidden">
        {tasks.map((task) => (
          <article key={task._id} className="panel-muted p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-brand-ink">{task.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{task.company?.businessName || "Sin empresa"}</p>
              </div>
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold", taskStatusTheme[task.status])}>{task.status}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold", taskPriorityTheme[task.priority])}>{task.priority}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{formatDate(task.dueDate)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="button-secondary px-4 py-2 text-xs" to={`/tasks/${task._id}`}>
                Ver
              </Link>
              <Link className="button-secondary px-4 py-2 text-xs" to={`/tasks/${task._id}/edit`}>
                Editar
              </Link>
              <button type="button" className="button-secondary px-4 py-2 text-xs text-rose-700" onClick={() => onDelete(task)}>
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
