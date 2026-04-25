import { Link } from "react-router-dom";

export function CompanyForm({
  mode = "create",
  values,
  users = [],
  onFieldChange,
  onSubmit,
  onOpenResponsibilitiesModal,
  isSubmitting
}) {
  const isEdit = mode === "edit";

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-brand-cyan">
              {isEdit ? "Editar cliente fiscal" : "Nuevo cliente fiscal"}
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-ink">
              {isEdit ? "Actualiza la ficha fiscal-operativa del cliente" : "Registra un cliente fiscal"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Usa una captura completa desde el inicio para que responsabilidades, tareas y seguimiento gerencial nazcan bien modelados.
            </p>
          </div>
          <div className="flex gap-3">
            {!isEdit ? (
              <button type="button" className="button-secondary" onClick={onOpenResponsibilitiesModal}>
                Configurar responsabilidades iniciales
              </button>
            ) : null}
            <Link to="/companies" className="button-secondary">
              Volver al listado
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel space-y-5 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Razón social / nombre completo</label>
              <input className="field-input" value={values.businessName} onChange={(event) => onFieldChange("businessName", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Tipo de persona</label>
              <select className="field-input" value={values.personType} onChange={(event) => onFieldChange("personType", event.target.value)}>
                <option value="JURIDICA">Jurídica</option>
                <option value="NATURAL">Natural</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Tipo de identificación</label>
              <select className="field-input" value={values.identificationType} onChange={(event) => onFieldChange("identificationType", event.target.value)}>
                <option value="NIT">NIT</option>
                <option value="CEDULA">Cédula</option>
                <option value="CEDULA_EXTRANJERIA">Cédula extranjería</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">NIT / cédula</label>
              <input className="field-input" value={values.nit} onChange={(event) => onFieldChange("nit", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">DV</label>
              <input className="field-input" value={values.verificationDigit} onChange={(event) => onFieldChange("verificationDigit", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Tipo empresa</label>
              <input className="field-input" value={values.companyType} onChange={(event) => onFieldChange("companyType", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Régimen tributario</label>
              <input className="field-input" value={values.taxRegime} onChange={(event) => onFieldChange("taxRegime", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Ciudad</label>
              <input className="field-input" value={values.city} onChange={(event) => onFieldChange("city", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Municipio</label>
              <input className="field-input" value={values.municipality} onChange={(event) => onFieldChange("municipality", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Empleados activos</label>
              <input type="number" min="0" className="field-input" value={values.activeEmployees} onChange={(event) => onFieldChange("activeEmployees", event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Actividad económica</label>
              <input className="field-input" value={values.economicActivity} onChange={(event) => onFieldChange("economicActivity", event.target.value)} />
            </div>
          </div>
        </div>

        <div className="panel space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Responsable asignado</label>
            <select className="field-input" value={values.assignedProfessional} onChange={(event) => onFieldChange("assignedProfessional", event.target.value)}>
              <option value="">Sin asignar</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.fullName || `${user.firstName} ${user.lastName}`.trim()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Estado</label>
            <select className="field-input" value={values.status} onChange={(event) => onFieldChange("status", event.target.value)}>
              <option value="ACTIVE">Activa</option>
              <option value="INACTIVE">Inactiva</option>
              <option value="SUSPENDED">Suspendida</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Observaciones</label>
            <textarea
              className="field-input min-h-40 py-3"
              value={values.observations}
              onChange={(event) => onFieldChange("observations", event.target.value)}
            />
          </div>

          {!isEdit ? (
            <div className="rounded-3xl border border-cyan-100 bg-cyan-50/80 px-4 py-4 text-sm text-cyan-900">
              <p className="font-bold">Responsabilidades iniciales configuradas</p>
              <p className="mt-2">{values.initialResponsibilities.length} responsabilidades listas para crearse junto con la empresa.</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:justify-end">
        <Link to="/companies" className="button-secondary">
          Cancelar
        </Link>
        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEdit ? "Actualizar empresa" : "Crear empresa"}
        </button>
      </div>
    </form>
  );
}
