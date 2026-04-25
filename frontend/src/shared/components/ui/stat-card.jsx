import { cn } from "@/lib/utils";

export function StatCard({ title, value, accent = "cyan", helper }) {
  const accentMap = {
    cyan: "from-cyan-500/20 to-cyan-50 text-cyan-700",
    teal: "from-teal-500/20 to-teal-50 text-teal-700",
    amber: "from-amber-500/20 to-amber-50 text-amber-700",
    rose: "from-rose-500/20 to-rose-50 text-rose-700"
  };

  return (
    <article className="panel relative overflow-hidden p-6">
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", accentMap[accent])} />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <strong className="text-3xl font-extrabold tracking-tight text-brand-ink">{value}</strong>
        {helper ? <span className="text-xs font-semibold text-slate-400">{helper}</span> : null}
      </div>
    </article>
  );
}
