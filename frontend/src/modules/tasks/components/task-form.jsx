import { Link } from "react-router-dom";

export function TaskForm({
  mode = "create",
  values,
  companies = [],
  users = [],
  responsibilities = [],
  onFieldChange,
  onSubmit,
  onCommentChange,
  isSubmitting
}) {
  const isEdit = mode === "edit";

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-brand-cyan">
              {isEdit ? "Editar tarea" : "Nueva tarea"}
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-ink">
              {isEdit ? "Actualiza la ejecución operativa" : "Crea una nueva tarea operativa"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Vincula empresa, responsabilidad, responsable y fecha de entrega en una sola captura preparada para seguimiento gerencial.
            </p>
          </div>
          <Link to="/tasks" className="button-secondary">
            Volver al listado
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Título</label>
            <input className="field-input" value={values.title} onChange={(event) => onFieldChange("title", event.target.value)} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Descripción</label>
            <textarea className="field-input min-h-40 py-3" value={values.description} onChange={(event) => onFieldChange("description", event.target.value)} />
          </div>
          {!isEdit ? (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Comentarios iniciales</label>
              <div className="space-y-3">
                {values.comments.map((comment, index) => (
                  <textarea
                    key={`comment-${index}`}
                    className="field-input min-h-24 py-3"
                    placeholder="Agrega contexto inicial para el responsable..."
                    value={comment.content}
                    onChange={(event) => onCommentChange(index, event.target.value)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Nuevo comentario</label>
              <textarea className="field-input min-h-24 py-3" value={values.comment} onChange={(event) => onFieldChange("comment", event.target.value)} />
            </div>
          )}
        </div>

        <div className="panel space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Empresa</label>
            <select className="field-input" value={values.companyId} onChange={(event) => onFieldChange("companyId", event.target.value)}>
              <option value="">Selecciona empresa</option>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.businessName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Responsabilidad fiscal</label>
            <select className="field-input" value={values.responsibilityId} onChange={(event) => onFieldChange("responsibilityId", event.target.value)}>
              <option value="">Sin vincular</option>
              {responsibilities.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Responsable</label>
            <select className="field-input" value={values.assignedTo} onChange={(event) => onFieldChange("assignedTo", event.target.value)}>
              <option value="">Selecciona responsable</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.fullName || `${user.firstName} ${user.lastName}`.trim()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Prioridad</label>
              <select className="field-input" value={values.priority} onChange={(event) => onFieldChange("priority", event.target.value)}>
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Estado</label>
              <select className="field-input" value={values.status} onChange={(event) => onFieldChange("status", event.target.value)}>
                <option value="PENDING">Pendiente</option>
                <option value="IN_PROGRESS">En proceso</option>
                <option value="COMPLETED">Completada</option>
                <option value="OVERDUE">Vencida</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Fecha límite</label>
            <input type="date" className="field-input" value={values.dueDate} onChange={(event) => onFieldChange("dueDate", event.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:justify-end">
        <Link to="/tasks" className="button-secondary">
          Cancelar
        </Link>
        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEdit ? "Actualizar tarea" : "Crear tarea"}
        </button>
      </div>
    </form>
  );
}
