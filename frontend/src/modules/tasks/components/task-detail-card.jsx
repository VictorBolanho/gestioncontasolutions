import { formatDate, cn } from "@/lib/utils";
import { taskPriorityTheme, taskStatusTheme } from "@/modules/tasks/constants/task-options";

export function TaskDetailCard({ task }) {
  return (
    <div className="panel p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.28em] text-brand-cyan">Task Detail</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-ink">{task.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">{task.description || "Sin descripción detallada."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold", taskStatusTheme[task.status])}>{task.status}</span>
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold", taskPriorityTheme[task.priority])}>{task.priority}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Info label="Empresa" value={task.company?.businessName || "Sin empresa"} />
        <Info
          label="Responsable"
          value={
            task.assignedTo
              ? task.assignedTo.fullName || `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.trim()
              : "Sin asignar"
          }
        />
        <Info label="Fecha límite" value={formatDate(task.dueDate)} />
        <Info label="Responsabilidad" value={task.taxResponsibility?.name || "Sin vincular"} />
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-brand-ink">{value}</p>
    </div>
  );
}
