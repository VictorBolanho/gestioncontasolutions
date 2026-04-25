export function ComingSoonPage({ title, description }) {
  return (
    <section className="panel flex min-h-[60vh] flex-col justify-center px-8 py-12">
      <span className="text-xs font-bold uppercase tracking-[0.28em] text-brand-cyan">Module in progress</span>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-ink">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">{description}</p>
    </section>
  );
}
