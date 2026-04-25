import { useQuery } from "@tanstack/react-query";

import { fetchTaskById } from "@/modules/tasks/api/tasks-api";
import { fetchTaxResponsibilityById } from "@/modules/tax-responsibilities/api/tax-responsibilities-api";
import { formatDate } from "@/lib/utils";

export function CalendarEventDrawer({ event, open, onClose }) {
  const detailQuery = useQuery({
    queryKey: ["calendar", "event-detail", event?.type, event?.referenceId],
    enabled: Boolean(open && event?.referenceId),
    queryFn: () =>
      event.type === "TASK"
        ? fetchTaskById(event.referenceId)
        : fetchTaxResponsibilityById(event.referenceId)
  });

  if (!open || !event) return null;

  const detail = detailQuery.data;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <button type="button" className="flex-1" onClick={onClose} aria-label="Close drawer" />
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-cyan">
                {event.type === "TASK" ? "Detalle de tarea" : "Detalle de obligación"}
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-brand-ink">{event.title}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {event.company?.businessName || "Sin empresa"} · {formatDate(event.date)}
              </p>
            </div>
            <button type="button" className="button-secondary px-4 py-2 text-sm" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <section className="panel-muted p-5">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">Resumen</h4>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Info label="Tipo" value={event.type === "TASK" ? "Tarea" : "Obligación fiscal"} />
              <Info label="Estado" value={event.status} />
              <Info label="Prioridad" value={event.priority} />
              <Info
                label="Responsable"
                value={
                  event.assignedTo
                    ? event.assignedTo.fullName || `${event.assignedTo.firstName} ${event.assignedTo.lastName}`.trim()
                    : "Sin responsable"
                }
              />
            </div>
          </section>

          {detailQuery.isLoading ? (
            <div className="panel-muted p-5 text-sm text-slate-500">Cargando detalle del evento...</div>
          ) : null}

          {detail ? (
            event.type === "TASK" ? (
              <>
                <section className="panel-muted p-5">
                  <h4 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">Descripción</h4>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{detail.description || "Sin descripción detallada."}</p>
                </section>

                <section className="panel-muted p-5">
                  <h4 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">Comentarios</h4>
                  <div className="mt-4 space-y-3">
                    {detail.comments?.length ? (
                      detail.comments.map((comment) => (
                        <article key={comment._id || comment.createdAt} className="rounded-2xl border border-white bg-white px-4 py-4">
                          <p className="text-sm leading-7 text-slate-600">{comment.content}</p>
                        </article>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Sin comentarios registrados.</p>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className="panel-muted p-5">
                  <h4 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">Configuración</h4>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Info label="Periodicidad" value={detail.periodicity || "No definida"} />
                    <Info label="Activa" value={detail.active ? "Sí" : "No"} />
                  </div>
                </section>
                <section className="panel-muted p-5">
                  <h4 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">Observación</h4>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{detail.observation || "Sin observación registrada."}</p>
                </section>
              </>
            )
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-white bg-white px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-brand-ink">{value}</p>
    </div>
  );
}
