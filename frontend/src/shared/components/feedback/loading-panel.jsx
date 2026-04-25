export function LoadingPanel({ title = "Cargando información", description = "Estamos consultando datos del backend." }) {
  return (
    <div className="panel flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-brand-cyan" />
      <h3 className="mt-5 text-lg font-bold text-brand-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}
