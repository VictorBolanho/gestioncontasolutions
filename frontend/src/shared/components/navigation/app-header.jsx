import { useNavigate } from "react-router-dom";

import { useAuth } from "@/app/hooks/use-auth";

export function AppHeader() {
  const navigate = useNavigate();
  const { user, clearSession } = useAuth();

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <header className="panel flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-cyan">Executive Workspace</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-brand-ink">Control operativo en tiempo real</h1>
        <p className="mt-2 text-sm text-slate-500">
          Consolida cumplimiento, carga operativa y prioridades críticas para el equipo de ContaSolutions.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Sesión activa</p>
          <p className="mt-1 text-sm font-bold text-brand-ink">{user?.fullName || user?.email || "Cuenta activa"}</p>
          <p className="text-xs text-slate-500">{user?.role?.label || user?.role?.name || "Usuario"}</p>
        </div>
        <button type="button" className="button-secondary" onClick={handleLogout}>
          Salir
        </button>
      </div>
    </header>
  );
}
