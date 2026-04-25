export function DataState({ title, description }) {
  return (
    <div className="panel-muted flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
      <h3 className="text-lg font-bold text-brand-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}
