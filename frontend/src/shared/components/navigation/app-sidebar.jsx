import { NavLink } from "react-router-dom";

import { LogoMark } from "@/shared/components/ui/logo-mark";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Dashboard", to: "/" },
  { label: "Empresas", to: "/companies" },
  { label: "Responsabilidades", to: "/responsibilities" },
  { label: "Obligaciones", to: "/fiscal-obligations" },
  { label: "Tareas", to: "/tasks" },
  { label: "Calendario", to: "/calendar" },
  { label: "Reportes", to: "/reports" },
  { label: "Usuarios", to: "/users" }
];

export function AppSidebar() {
  return (
    <aside className="panel flex h-full flex-col overflow-hidden border-white/50 bg-brand-midnight text-white">
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center gap-4">
          <LogoMark />
          <div>
            <p className="text-lg font-extrabold tracking-tight">ContaSolutions</p>
            <p className="text-sm text-cyan-100/70">Operating intelligence for accounting teams</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
                isActive ? "bg-white text-brand-midnight shadow-lg" : "text-slate-200 hover:bg-white/8 hover:text-white"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-6 py-5">
        <div className="rounded-2xl bg-white/6 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">Platform Status</p>
          <p className="mt-2 text-sm font-semibold">API connectivity and compliance monitoring enabled.</p>
        </div>
      </div>
    </aside>
  );
}
