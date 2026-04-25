import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/app/layouts/app-layout";
import { AuthLayout } from "@/app/layouts/auth-layout";
import { DashboardPage } from "@/modules/dashboard/pages/dashboard-page";
import { FiscalObligationDetailPage, FiscalObligationsPage } from "@/modules/fiscal-obligations";
import { LoginPage } from "@/modules/auth/pages/login-page";
import { CalendarPage } from "@/modules/calendar";
import {
  CompaniesPage,
  CompanyCreatePage,
  CompanyDetailPage,
  CompanyEditPage
} from "@/modules/companies";
import { TaskCreatePage, TaskDetailPage, TaskEditPage, TasksPage } from "@/modules/tasks";
import { ComingSoonPage } from "@/shared/pages/coming-soon-page";
import { ProtectedRoute } from "@/shared/routes/protected-route";
import { PublicRoute } from "@/shared/routes/public-route";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/new" element={<CompanyCreatePage />} />
          <Route path="/companies/:companyId" element={<CompanyDetailPage />} />
          <Route path="/companies/:companyId/edit" element={<CompanyEditPage />} />
          <Route
            path="/responsibilities"
            element={
              <ComingSoonPage
                title="Responsabilidades Fiscales"
                description="Aquí conectaremos checklist tributario, próximas fechas, responsables y control de cumplimiento por empresa."
              />
            }
          />
          <Route path="/fiscal-obligations" element={<FiscalObligationsPage />} />
          <Route path="/fiscal-obligations/:obligationId" element={<FiscalObligationDetailPage />} />
          <Route
            path="/tasks"
            element={<TasksPage />}
          />
          <Route path="/tasks/new" element={<TaskCreatePage />} />
          <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="/tasks/:taskId/edit" element={<TaskEditPage />} />
          <Route
            path="/calendar"
            element={<CalendarPage />}
          />
          <Route
            path="/reports"
            element={
              <ComingSoonPage
                title="Reportes"
                description="La siguiente iteración incluirá reportes ejecutivos, exportaciones y paneles de riesgo para gerencia."
              />
            }
          />
          <Route
            path="/users"
            element={
              <ComingSoonPage
                title="Usuarios"
                description="Este módulo permitirá administrar roles, permisos y asignaciones internas en una experiencia corporativa consistente."
              />
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
