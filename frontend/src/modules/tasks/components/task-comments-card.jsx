import { formatDate } from "@/lib/utils";
import { DataState } from "@/shared/components/ui/data-state";

export function TaskCommentsCard({ comments = [] }) {
  if (!comments.length) {
    return (
      <DataState
        title="Sin comentarios"
        description="Esta tarea todavía no tiene notas colaborativas registradas."
      />
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-extrabold text-brand-ink">Comentarios</h3>
        <p className="mt-1 text-sm text-slate-500">Contexto operativo, seguimiento del responsable y trazabilidad de ejecución.</p>
      </div>
      <div className="space-y-4 p-6">
        {comments.map((comment) => (
          <article key={comment._id || `${comment.content}-${comment.createdAt}`} className="panel-muted p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="font-bold text-brand-ink">
                {comment.author
                  ? comment.author.fullName || `${comment.author.firstName} ${comment.author.lastName}`.trim()
                  : "Sistema"}
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{formatDate(comment.createdAt)}</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">{comment.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
