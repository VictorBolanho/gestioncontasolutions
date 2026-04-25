import { Outlet } from "react-router-dom";

import { LogoMark } from "@/shared/components/ui/logo-mark";

export function AuthLayout() {
  return (
    <main className="grid min-h-screen bg-brand-mist lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-brand-midnight px-10 py-12 text-white lg:flex">
        <div className="absolute inset-0 bg-grid-soft bg-[size:34px_34px] opacity-20" />
        <div className="absolute left-10 top-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />

        <div className="relative z-10 flex max-w-xl flex-col justify-between">
          <div className="flex items-center gap-4">
            <LogoMark />
            <div>
              <p className="text-2xl font-extrabold tracking-tight">ContaSolutions</p>
              <p className="text-sm text-cyan-100/80">Corporate accounting command center</p>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">Premium SaaS Control</span>
            <h1 className="mt-5 text-5xl font-extrabold leading-tight tracking-tight">
              Gestiona empresas, vencimientos y cumplimiento desde un solo sistema.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-slate-200">
              Diseñado para firmas contables que necesitan operar con trazabilidad, visibilidad gerencial y ejecución disciplinada.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-extrabold">360°</p>
              <p className="mt-2 text-sm text-slate-300">Visión integral de operaciones contables</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-extrabold">24/7</p>
              <p className="mt-2 text-sm text-slate-300">Monitoreo de alertas y obligaciones</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-extrabold">ROI</p>
              <p className="mt-2 text-sm text-slate-300">Menos control manual, más foco estratégico</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 sm:px-10">
        <Outlet />
      </section>
    </main>
  );
}
