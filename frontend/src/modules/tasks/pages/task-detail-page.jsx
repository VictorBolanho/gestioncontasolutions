import { useQueries } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { fetchTaskById } from "@/modules/tasks/api/tasks-api";
import { TaskCommentsCard } from "@/modules/tasks/components/task-comments-card";
import { TaskDetailCard } from "@/modules/tasks/components/task-detail-card";
import { TaskHistoryCard } from "@/modules/tasks/components/task-history-card";
import { apiClient } from "@/lib/axios";
import { LoadingPanel } from "@/shared/components/feedback/loading-panel";
import { SectionHeading } from "@/shared/components/ui/section-heading";

async function fetchTaskAuditLogs(taskId) {
  const response = await apiClient.get("/audit-logs", {
    params: {
      entityName: "Task",
      entityId: taskId,
      limit: 12
    }
  });

  return response.data.data;
}

export function TaskDetailPage() {
  const { taskId } = useParams();

  const [taskQuery, historyQuery] = useQueries({
    queries: [
      {
        queryKey: ["tasks", "detail", taskId],
        queryFn: () => fetchTaskById(taskId)
      },
      {
        queryKey: ["tasks", "history", taskId],
        queryFn: () => fetchTaskAuditLogs(taskId)
      }
    ]
  });

  if (taskQuery.isLoading || !taskQuery.data) {
    return <LoadingPanel title="Cargando detalle de tarea" description="Preparando la vista operativa completa de la tarea." />;
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Task Detail"
        title="Vista detallada de la tarea"
        description="Consolida contexto, responsables, comentarios e historial de cambios para una ejecución más disciplinada."
        actions={
          <div className="flex gap-3">
            <Link to="/tasks" className="button-secondary">
              Volver
            </Link>
            <Link to={`/tasks/${taskId}/edit`} className="button-primary">
              Editar tarea
            </Link>
          </div>
        }
      />

      <TaskDetailCard task={taskQuery.data} />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <TaskCommentsCard comments={taskQuery.data.comments || []} />
        <TaskHistoryCard logs={historyQuery.data || []} />
      </div>
    </section>
  );
}
