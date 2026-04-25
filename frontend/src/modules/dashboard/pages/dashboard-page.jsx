import { useQueries } from "@tanstack/react-query";

import { fetchCompliance, fetchOverview, fetchWorkload } from "@/modules/dashboard/api/dashboard-api";
import { CompliancePanel } from "@/modules/dashboard/components/compliance-panel";
import { OverviewGrid } from "@/modules/dashboard/components/overview-grid";
import { WorkloadPanel } from "@/modules/dashboard/components/workload-panel";
import { SectionHeading } from "@/shared/components/ui/section-heading";

export function DashboardPage() {
  const results = useQueries({
    queries: [
      { queryKey: ["dashboard", "overview"], queryFn: fetchOverview },
      { queryKey: ["dashboard", "workload"], queryFn: fetchWorkload },
      { queryKey: ["dashboard", "compliance"], queryFn: fetchCompliance }
    ]
  });

  const [overviewQuery, workloadQuery, complianceQuery] = results;

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Executive Dashboard"
        title="Vista integral del estado operativo"
        description="Combina indicadores clave, distribución de trabajo y seguimiento del cumplimiento mensual en un solo espacio."
        actions={
          <div className="panel-muted px-4 py-3 text-sm">
            <span className="font-semibold text-slate-500">Estado de datos:</span>{" "}
            <span className="font-bold text-brand-ink">
              {results.some((query) => query.isFetching) ? "Sincronizando..." : "Actualizado"}
            </span>
          </div>
        }
      />

      <OverviewGrid overview={overviewQuery.data} />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <WorkloadPanel workload={workloadQuery.data || []} />
        <CompliancePanel compliance={complianceQuery.data || []} />
      </div>
    </section>
  );
}
