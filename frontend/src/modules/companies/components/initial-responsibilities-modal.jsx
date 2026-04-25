import { useMemo, useState } from "react";

import {
  periodicityOptions,
  responsibilityNameOptions,
  responsibilityStatusOptions
} from "@/modules/companies/constants/company-options";

const createEmptyResponsibility = () => ({
  name: "IVA",
  active: true,
  periodicity: "MONTHLY",
  nextDate: "",
  responsible: "",
  observation: "",
  status: "PENDING"
});

export function InitialResponsibilitiesModal({ open, onClose, value = [], onSave, users = [] }) {
  const [items, setItems] = useState(value.length ? value : [createEmptyResponsibility()]);

  const userOptions = useMemo(() => users, [users]);

  if (!open) return null;

  const updateItem = (index, field, nextValue) => {
    setItems((current) =>
      current.map((item, currentIndex) => (currentIndex === index ? { ...item, [field]: nextValue } : item))
    );
  };

  const addItem = () => {
    setItems((current) => [...current, createEmptyResponsibility()]);
  };

  const removeItem = (index) => {
    setItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSave = () => {
    const normalized = items.map((item) => ({
      ...item,
      nextDate: item.nextDate || null,
      responsible: item.responsible || null
    }));

    onSave(normalized);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-brand-cyan">Setup tributario</span>
            <h3 className="mt-2 text-2xl font-extrabold text-brand-ink">Responsabilidades iniciales</h3>
            <p className="mt-2 text-sm text-slate-500">
              Define desde el alta de la empresa qué obligaciones tributarias deben activarse y quién será responsable.
            </p>
          </div>
          <button type="button" className="button-secondary px-4 py-2 text-sm" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {items.map((item, index) => (
            <article key={`${item.name}-${index}`} className="panel-muted space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Obligación</label>
                  <select className="field-input" value={item.name} onChange={(event) => updateItem(index, "name", event.target.value)}>
                    {responsibilityNameOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Periodicidad</label>
                  <select
                    className="field-input"
                    value={item.periodicity}
                    onChange={(event) => updateItem(index, "periodicity", event.target.value)}
                  >
                    {periodicityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Próxima fecha</label>
                  <input
                    type="date"
                    className="field-input"
                    value={item.nextDate}
                    onChange={(event) => updateItem(index, "nextDate", event.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Estado</label>
                  <select className="field-input" value={item.status} onChange={(event) => updateItem(index, "status", event.target.value)}>
                    {responsibilityStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Responsable</label>
                  <select className="field-input" value={item.responsible} onChange={(event) => updateItem(index, "responsible", event.target.value)}>
                    <option value="">Sin asignar</option>
                    {userOptions.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.fullName || `${user.firstName} ${user.lastName}`.trim()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={(event) => updateItem(index, "active", event.target.checked)}
                    />
                    Activa
                  </label>
                  <button type="button" className="button-secondary px-4 py-3 text-sm text-rose-700" onClick={() => removeItem(index)}>
                    Eliminar
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Observación</label>
                <textarea
                  className="field-input min-h-24 py-3"
                  value={item.observation}
                  onChange={(event) => updateItem(index, "observation", event.target.value)}
                />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-between">
          <button type="button" className="button-secondary" onClick={addItem}>
            Agregar responsabilidad
          </button>
          <div className="flex gap-3">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="button-primary" onClick={handleSave}>
              Guardar configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
