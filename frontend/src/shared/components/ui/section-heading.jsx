export function SectionHeading({ eyebrow, title, description, actions = null }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <span className="text-xs font-bold uppercase tracking-[0.28em] text-brand-cyan">{eyebrow}</span> : null}
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-brand-ink md:text-3xl">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
