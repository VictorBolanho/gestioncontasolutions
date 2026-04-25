import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { cn, formatDate } from "@/lib/utils";
import { fetchFiscalObligationById } from "@/modules/fiscal-obligations/api/fiscal-obligations-api";
import {
  fiscalObligationStatusLabels,
  fiscalObligationStatusTheme,
  fiscalObligationTypeLabels
} from "@/modules/fiscal-obligations/constants/fiscal-obligation-options";
import { LoadingPanel } from "@/shared/components/feedback/loading-panel";
import { SectionHeading } from "@/shared/components/ui/section-heading";

function formatUser(user) {
  if (!user) return "Sin asignar";
  return user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
}

export function FiscalObligationDetailPage() {
  const { obligationId } = useParams();
  const obligationQuery = useQuery({
    queryKey: ["fiscal-obligations", "detail", obligationId],
    queryFn: () => fetchFiscalObligationById(obligationId)
  });

  if (obligationQuery.isLoading) {
    return <LoadingPanel title="Cargando obligación" description="Preparando el detalle fiscal-operativo." />;
  }

  const obligation = obligationQuery.data;

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Detalle tributario"
        title={obligation?.companyId?.businessName || "Obligación fiscal"}
        description="Resumen operativo del vencimiento, periodo, responsable y estado de presentación."
        actions={
          <Link to="/fiscal-obligations" className="button-secondary">
            Volver al panel
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="panel space-y-5 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Cliente</p>
            <h2 className="mt-2 text-2xl font-extrabold text-brand-ink">{obligation?.companyId?.businessName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {obligation?.companyId?.nit}
              {obligation?.companyId?.verificationDigit ? `-${obligation.companyId.verificationDigit}` : ""}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel-muted p-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Tipo</p>
              <p className="mt-2 font-bold text-brand-ink">{fiscalObligationTypeLabels[obligation?.type] || obligation?.type}</p>
            </div>
            <div className="panel-muted p-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Estado</p>
              <span className={cn("mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold", fiscalObligationStatusTheme[obligation?.status])}>
                {fiscalObligationStatusLabels[obligation?.status] || obligation?.status}
              </span>
            </div>
            <div className="panel-muted p-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Periodo</p>
              <p className="mt-2 font-bold text-brand-ink">{obligation?.period}</p>
            </div>
            <div className="panel-muted p-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Año fiscal</p>
              <p className="mt-2 font-bold text-brand-ink">{obligation?.fiscalYear}</p>
            </div>
          </div>
        </article>

        <article className="panel space-y-5 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Fecha vencimiento</p>
            <p className="mt-2 text-xl font-extrabold text-brand-ink">{formatDate(obligation?.dueDate)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Responsable</p>
            <p className="mt-2 font-semibold text-slate-700">{formatUser(obligation?.assignedUserId)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Presentada el</p>
            <p className="mt-2 font-semibold text-slate-700">{formatDate(obligation?.submittedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Notas</p>
            <p className="mt-2 leading-7 text-slate-600">{obligation?.notes || "Sin notas registradas."}</p>
          </div>
        </article>
      </div>
    </section>
  );
}
