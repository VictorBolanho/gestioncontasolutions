import { useQueries } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import {
  fetchCompanyAuditLogs,
  fetchCompanyById,
  fetchCompanyTasks
} from "@/modules/companies/api/companies-api";
import { CompanyHistoryCard } from "@/modules/companies/components/company-history-card";
import { CompanyOverviewCard } from "@/modules/companies/components/company-overview-card";
import { CompanyRelatedTasksCard } from "@/modules/companies/components/company-related-tasks-card";
import { CompanyResponsibilitiesCard } from "@/modules/companies/components/company-responsibilities-card";
import { LoadingPanel } from "@/shared/components/feedback/loading-panel";
import { SectionHeading } from "@/shared/components/ui/section-heading";

export function CompanyDetailPage() {
  const { companyId } = useParams();

  const [companyQuery, tasksQuery, historyQuery] = useQueries({
    queries: [
      {
        queryKey: ["companies", "detail", companyId],
        queryFn: () => fetchCompanyById(companyId)
      },
      {
        queryKey: ["companies", "tasks", companyId],
        queryFn: () => fetchCompanyTasks(companyId)
      },
      {
        queryKey: ["companies", "history", companyId],
        queryFn: () => fetchCompanyAuditLogs(companyId)
      }
    ]
  });

  if (companyQuery.isLoading) {
    return <LoadingPanel title="Cargando detalle de empresa" description="Estamos reuniendo la vista 360° del cliente." />;
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Company Detail"
        title="Vista 360° del cliente"
        description="Concentra ficha general, obligaciones fiscales, tareas operativas y trazabilidad de cambios en un solo espacio de gestión."
        actions={
          <div className="flex gap-3">
            <Link to="/companies" className="button-secondary">
              Volver
            </Link>
            <Link to={`/companies/${companyId}/edit`} className="button-primary">
              Editar empresa
            </Link>
          </div>
        }
      />

      <CompanyOverviewCard company={companyQuery.data} />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <CompanyResponsibilitiesCard responsibilities={companyQuery.data.taxResponsibilities || []} />
        <CompanyRelatedTasksCard tasks={tasksQuery.data || []} />
      </div>

      <CompanyHistoryCard logs={historyQuery.data || []} />
    </section>
  );
}
