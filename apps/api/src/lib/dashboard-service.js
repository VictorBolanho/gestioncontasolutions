import {
  COMPANY_STATUS,
  canAccessCompany,
  getCompanyEffectiveTaxProfile,
  getEffectivePermissions,
  getPrimaryRole,
  hasPermission
} from "../../../../packages/domain/index.js";
import {
  getCompanies,
  getCompanyObligations,
  getFiscalCalendars,
  getTaxes,
  getUsers
} from "./storage.js";
import { canUserAccessTask } from "./access-control.js";
import { listInternalAlertsForUser } from "./alert-service.js";
import { listApplicableActiveCalendarsForObligation } from "./fiscal-calendar-service.js";
import { listTasks } from "./task-service.js";

const COMPLETED_STATUSES = new Set(["presentada", "completada"]);
const CLOSED_STATUSES = new Set(["presentada", "completada", "cancelada", "no_aplica"]);
const ACTIVE_ALERT_STATES = new Set(["no_leida", "leida"]);
const VISIBLE_COMPANY_STATUSES = new Set(["borrador", "pendiente_revision", "activa", "suspendida"]);
const MANAGEMENT_REPORT_TYPES = Object.freeze([
  "cumplimiento",
  "tareas_fiscales",
  "vencimientos",
  "alertas",
  "empresas",
  "responsables",
  "riesgo_empresas"
]);
const RISK_LEVELS = Object.freeze(["alto", "medio", "bajo", "sin_riesgo"]);

function userWithEffectivePermissions(user) {
  return {
    ...user,
    permisos: user?.permisosEfectivos || getEffectivePermissions(user)
  };
}

function canSeeCompany(user, companyId) {
  return canAccessCompany(userWithEffectivePermissions(user), companyId);
}

function normalizeText(value) {
  return String(value || "").trim();
}

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : "";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(value, days) {
  const date = new Date(`${dateOnly(value)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function subtractDays(value, days) {
  return addDays(value, days * -1);
}

function daysUntil(value, currentDate = today()) {
  const dueDate = dateOnly(value);
  if (!dueDate) {
    return null;
  }

  const start = new Date(`${currentDate}T00:00:00.000Z`);
  const end = new Date(`${dueDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function isInRange(value, start, end) {
  const normalized = dateOnly(value);
  if (!normalized) {
    return false;
  }

  if (start && normalized < start) {
    return false;
  }

  if (end && normalized > end) {
    return false;
  }

  return true;
}

function currentMonthRange() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10),
    end: new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10)
  };
}

function taskStatus(task) {
  return normalizeText(task?.estadoOperativo || task?.estadoGeneral || "pendiente");
}

function isTaskClosed(task) {
  return CLOSED_STATUSES.has(taskStatus(task));
}

function isFiscalTask(task) {
  return normalizeText(task?.tipoTarea) === "fiscal";
}

function isAlertOpen(alert) {
  return ACTIVE_ALERT_STATES.has(normalizeText(alert?.estado));
}

function safePercent(part, total) {
  if (!total) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function normalizeRoleName(user) {
  return normalizeText(getPrimaryRole(user));
}

function visibleUserIds(currentUser, users) {
  const role = normalizeRoleName(currentUser);
  const actorId = normalizeText(currentUser?.id);
  const supervisedIds = new Set(Array.isArray(currentUser?.supervisedUsers) ? currentUser.supervisedUsers : []);

  if (hasPermission(currentUser, "ver_todas_empresas") || ["owner", "administrador", "gerente"].includes(role)) {
    return new Set(users.map((user) => user.id));
  }

  if (["senior_accountant", "supervisor"].includes(role)) {
    return new Set([actorId, ...Array.from(supervisedIds)]);
  }

  return new Set([actorId]);
}

function companyHasAssignedUsers(companyId, users) {
  return users.some(
    (user) =>
      normalizeText(user.estado || "activo") === "activo" &&
      Array.isArray(user.empresasAsignadas) &&
      user.empresasAsignadas.includes(companyId)
  );
}

function taskPeriodLabel(task) {
  const period = normalizeText(task?.periodo);
  const year = normalizeText(task?.anio);
  return [period, year].filter(Boolean).join(" ");
}

function normalizeDashboardFilters(filters = {}) {
  return {
    fechaDesde: dateOnly(filters.fechaDesde || filters.startDate || ""),
    fechaHasta: dateOnly(filters.fechaHasta || filters.endDate || ""),
    empresaId: normalizeText(filters.empresaId || filters.companyId),
    responsableId: normalizeText(filters.responsableId || filters.userId),
    estadoTarea: normalizeText(filters.estadoTarea || filters.estado || ""),
    impuestoId: normalizeText(filters.impuestoId || filters.tipoObligacion || filters.obligationType),
    nivelRiesgo: normalizeText(filters.nivelRiesgo || filters.riskLevel),
    periodoFiscal: normalizeText(filters.periodoFiscal || filters.periodo),
    vista: normalizeText(filters.vista || filters.bucket || "")
  };
}

function taskMatchesView(task, view, currentDate = today()) {
  const status = taskStatus(task);
  const dueDate = dateOnly(task.fechaVencimiento);
  const normalizedView = normalizeText(view);

  if (!normalizedView) {
    return true;
  }

  if (normalizedView === "vencidas") {
    return status === "vencida";
  }

  if (normalizedView === "completadas") {
    return COMPLETED_STATUSES.has(status);
  }

  if (normalizedView === "proximas") {
    const days = daysUntil(dueDate, currentDate);
    return !isTaskClosed(task) && days !== null && days >= 0 && days <= 30;
  }

  return true;
}

function taskMatchesFilters(task, filters, currentDate = today()) {
  if (filters.empresaId && task.empresaId !== filters.empresaId) return false;
  if (filters.responsableId && normalizeText(task.responsableId) !== filters.responsableId) return false;
  if (filters.estadoTarea && taskStatus(task) !== filters.estadoTarea) return false;
  if (filters.impuestoId && normalizeText(task.impuestoId) !== filters.impuestoId) return false;
  if (filters.periodoFiscal && taskPeriodLabel(task) !== filters.periodoFiscal) return false;
  if ((filters.fechaDesde || filters.fechaHasta) && !isInRange(task.fechaVencimiento, filters.fechaDesde, filters.fechaHasta)) return false;
  if (!taskMatchesView(task, filters.vista, currentDate)) return false;
  return true;
}

function alertMatchesFilters(alert, filters) {
  if (filters.empresaId && alert.empresaId !== filters.empresaId) return false;
  if (filters.responsableId && normalizeText(alert.responsableId) !== filters.responsableId) return false;
  if (filters.impuestoId && normalizeText(alert?.tarea?.impuesto?.id || alert?.tarea?.obligacionFiscal?.impuestoId || "") !== filters.impuestoId) return false;
  if (filters.periodoFiscal && taskPeriodLabel(alert.tarea || {}) !== filters.periodoFiscal) return false;
  if ((filters.fechaDesde || filters.fechaHasta) && !isInRange(alert.fechaVencimiento, filters.fechaDesde, filters.fechaHasta)) return false;
  if (filters.vista === "vencidas" && normalizeText(alert.tipo) !== "vencida") return false;
  if (filters.vista === "proximas" && normalizeText(alert.tipo) !== "proxima_vencer") return false;
  if (filters.vista === "completadas" && normalizeText(alert.estado) !== "atendida") return false;
  return true;
}

function obligationMatchesFilters(obligation, filters) {
  if (filters.empresaId && obligation.empresaId !== filters.empresaId) return false;
  if (filters.impuestoId && normalizeText(obligation.impuestoId) !== filters.impuestoId) return false;
  if (filters.periodoFiscal && normalizeText(obligation.periodicidadAplicable || obligation.periodicidad) !== filters.periodoFiscal) return false;
  return true;
}

function sortByOperationalRisk(left, right) {
  const leftDays = Number.isFinite(left.diasParaVencer) ? left.diasParaVencer : 9999;
  const rightDays = Number.isFinite(right.diasParaVencer) ? right.diasParaVencer : 9999;
  const priorityScore = { critica: 4, alta: 3, media: 2, baja: 1 };

  return leftDays - rightDays ||
    (priorityScore[right.prioridad] || 0) - (priorityScore[left.prioridad] || 0) ||
    String(left.empresa || "").localeCompare(String(right.empresa || ""), "es") ||
    String(left.titulo || "").localeCompare(String(right.titulo || ""), "es");
}

function buildTaskSummary(task, companyMap, userMap, currentDate = today()) {
  return {
    id: task.id,
    titulo: task.titulo || task.id,
    empresaId: task.empresaId || "",
    empresa: task.empresa?.razonSocial || companyMap.get(task.empresaId)?.razonSocial || "",
    responsableId: task.responsableId || "",
    responsable: task.responsable?.nombreCompleto || userMap.get(task.responsableId)?.nombreCompleto || "",
    tipoTarea: task.tipoTarea || "",
    impuestoId: task.impuestoId || "",
    impuesto: task.impuestoNombre || task.impuesto?.nombre || task.obligacionFiscal?.nombreObligacion || "",
    periodo: task.periodo || "",
    anio: task.anio || "",
    estado: taskStatus(task),
    etapaGestion: task.etapaGestion || "",
    estadoPago: task.estadoPago || "",
    prioridad: task.prioridad || "",
    fechaVencimiento: dateOnly(task.fechaVencimiento),
    diasParaVencer: daysUntil(task.fechaVencimiento, currentDate)
  };
}

function summarizeQueue(tasks, predicate, companyMap, userMap, currentDate = today(), limit = 8) {
  return tasks
    .filter(predicate)
    .map((task) => buildTaskSummary(task, companyMap, userMap, currentDate))
    .sort(sortByOperationalRisk)
    .slice(0, limit);
}

function buildOverdueBuckets(tasks, currentDate = today()) {
  const buckets = {
    de_1_a_7: 0,
    de_8_a_15: 0,
    de_16_a_30: 0,
    mas_de_30: 0
  };

  for (const task of tasks) {
    if (taskStatus(task) !== "vencida") {
      continue;
    }

    const days = Math.abs(daysUntil(task.fechaVencimiento, currentDate) || 0);
    if (days <= 7) buckets.de_1_a_7 += 1;
    else if (days <= 15) buckets.de_8_a_15 += 1;
    else if (days <= 30) buckets.de_16_a_30 += 1;
    else buckets.mas_de_30 += 1;
  }

  return buckets;
}

function buildUpcomingSchedule(tasks, companyMap, userMap, currentDate = today(), limit = 15) {
  return tasks
    .filter((task) => {
      if (isTaskClosed(task)) {
        return false;
      }
      const days = daysUntil(task.fechaVencimiento, currentDate);
      return days !== null && days >= 0 && days <= 30;
    })
    .map((task) => buildTaskSummary(task, companyMap, userMap, currentDate))
    .sort((left, right) => {
      const leftRisk = left.diasParaVencer <= 7 ? 3 : left.diasParaVencer <= 15 ? 2 : 1;
      const rightRisk = right.diasParaVencer <= 7 ? 3 : right.diasParaVencer <= 15 ? 2 : 1;
      return left.diasParaVencer - right.diasParaVencer ||
        rightRisk - leftRisk ||
        String(left.empresa || "").localeCompare(String(right.empresa || ""), "es");
    })
    .slice(0, limit)
    .map((task) => ({
      ...task,
      nivelRiesgo:
        task.diasParaVencer <= 7 ? "alto" : task.diasParaVencer <= 15 ? "medio" : "bajo"
    }));
}

function buildComplianceSeries(tasks, currentDate = today()) {
  const fiscalTasks = tasks.filter(isFiscalTask);
  const expectedTasks = fiscalTasks.filter((task) => !["cancelada", "no_aplica"].includes(taskStatus(task)));
  const completedTasks = expectedTasks.filter((task) => COMPLETED_STATUSES.has(taskStatus(task)));
  const overdueTasks = expectedTasks.filter((task) => taskStatus(task) === "vencida");
  const pendingTasks = expectedTasks.filter((task) => ["pendiente", "en_proceso"].includes(taskStatus(task)));
  const recentWindowStart = subtractDays(currentDate, 30);
  const recentExpected = expectedTasks.filter((task) => isInRange(task.fechaVencimiento, recentWindowStart, currentDate));
  const recentCompleted = recentExpected.filter((task) => COMPLETED_STATUSES.has(taskStatus(task)));

  return {
    tareasEsperadas: expectedTasks.length,
    tareasCumplidas: completedTasks.length,
    tareasVencidas: overdueTasks.length,
    tareasPendientes: pendingTasks.length,
    porcentajeGeneral: safePercent(completedTasks.length, expectedTasks.length),
    porcentajeReciente: safePercent(recentCompleted.length, recentExpected.length),
    denominador: "tareas_fiscales_esperadas",
    detalleDenominador: "Tareas fiscales visibles excluyendo canceladas y no aplica."
  };
}

function buildCompanyRiskItem(company, tasks, alerts, complianceBase, currentDate = today()) {
  const companyTasks = tasks.filter((task) => task.empresaId === company.id);
  const companyOpenTasks = companyTasks.filter((task) => !isTaskClosed(task));
  const companyAlerts = alerts.filter((alert) => alert.empresaId === company.id);
  const overdueTasks = companyOpenTasks.filter((task) => taskStatus(task) === "vencida");
  const overdueAlerts = companyAlerts.filter((alert) => isAlertOpen(alert) && normalizeText(alert.tipo) === "vencida");
  const upcoming7 = companyOpenTasks.filter((task) => {
    const days = daysUntil(task.fechaVencimiento, currentDate);
    return days !== null && days >= 0 && days <= 7;
  });
  const upcoming15 = companyOpenTasks.filter((task) => {
    const days = daysUntil(task.fechaVencimiento, currentDate);
    return days !== null && days >= 0 && days <= 15;
  });
  const expectedRecent = companyTasks.filter((task) => isFiscalTask(task) && !["cancelada", "no_aplica"].includes(taskStatus(task)) && isInRange(task.fechaVencimiento, subtractDays(currentDate, 30), currentDate));
  const completedRecent = expectedRecent.filter((task) => COMPLETED_STATUSES.has(taskStatus(task)));
  const recentCompliance = safePercent(completedRecent.length, expectedRecent.length);

  let nivelRiesgo = "sin_riesgo";
  let criterio = "Sin tareas abiertas ni alertas activas.";

  if (overdueTasks.length > 0 || overdueAlerts.length > 0) {
    nivelRiesgo = "alto";
    criterio = "Tiene tareas vencidas o alertas de vencimiento activas.";
  } else if (upcoming7.length > 0 || (companyAlerts.filter(isAlertOpen).length >= 2) || (expectedRecent.length >= 3 && recentCompliance < 80)) {
    nivelRiesgo = "medio";
    criterio = "Tiene proximos vencimientos, multiples alertas activas o cumplimiento reciente por debajo del 80%.";
  } else if (companyOpenTasks.length > 0 || companyAlerts.filter(isAlertOpen).length > 0 || expectedRecent.length > 0) {
    nivelRiesgo = "bajo";
    criterio = "Tiene carga operativa visible, pero sin atrasos criticos.";
  }

  return {
    empresaId: company.id,
    empresa: company.razonSocial,
    estadoEmpresa: company.estadoEmpresa,
    tareasVencidas: overdueTasks.length,
    tareasProximas: upcoming15.length,
    alertasCriticas: companyAlerts.filter((alert) => isAlertOpen(alert) && alert.nivel === "critica").length,
    alertasPreventivas: companyAlerts.filter((alert) => isAlertOpen(alert) && alert.nivel === "preventiva").length,
    alertasVencidas: overdueAlerts.length,
    cumplimientoReciente: recentCompliance,
    tareasEsperadasRecientes: expectedRecent.length,
    tareasCumplidasRecientes: completedRecent.length,
    nivelRiesgo,
    criterioRiesgo: criterio,
    sinRiesgoOperativo: nivelRiesgo === "sin_riesgo",
    cumplimientoGeneral: complianceBase?.porcentajeGeneral || 0
  };
}

function buildWorkloadItem(user, visibleCompanyIds, tasks, alerts, currentDate = today()) {
  const assignedCompanyIds = Array.isArray(user.empresasAsignadas)
    ? user.empresasAsignadas.filter((companyId) => visibleCompanyIds.has(companyId))
    : [];
  const userTasks = tasks.filter((task) => normalizeText(task.responsableId) === normalizeText(user.id));
  const userOpenTasks = userTasks.filter((task) => !isTaskClosed(task));
  const userAlerts = alerts.filter((alert) => normalizeText(alert.responsableId) === normalizeText(user.id));
  const upcomingTasks = userOpenTasks.filter((task) => {
    const days = daysUntil(task.fechaVencimiento, currentDate);
    return days !== null && days >= 0 && days <= 15;
  });

  return {
    usuarioId: user.id,
    usuario: user.nombreCompleto || [user.nombre, user.apellido].filter(Boolean).join(" ") || user.email || user.id,
    cargo: user.cargo || "",
    empresasAsignadas: assignedCompanyIds.length,
    tareasPendientes: userTasks.filter((task) => taskStatus(task) === "pendiente").length,
    tareasEnProceso: userTasks.filter((task) => taskStatus(task) === "en_proceso").length,
    tareasCompletadas: userTasks.filter((task) => COMPLETED_STATUSES.has(taskStatus(task))).length,
    tareasVencidas: userTasks.filter((task) => taskStatus(task) === "vencida").length,
    tareasProximas: upcomingTasks.length,
    alertasCriticas: userAlerts.filter((alert) => isAlertOpen(alert) && alert.nivel === "critica").length,
    alertasActivas: userAlerts.filter(isAlertOpen).length,
    sinAsignaciones: assignedCompanyIds.length === 0 && userTasks.length === 0
  };
}

function buildManagerAlerts(companies, obligations, tasks, alerts, calendars, companyMap, currentDate = today()) {
  const activeTasks = tasks.filter((task) => !isTaskClosed(task));
  const activeAlerts = alerts.filter(isAlertOpen);
  const activeCompanies = companies.filter((company) => company.estadoEmpresa === COMPANY_STATUS.ACTIVE);

  const companiesWithOverdueTasks = activeCompanies
    .map((company) => {
      const overdueCount = activeTasks.filter((task) => task.empresaId === company.id && taskStatus(task) === "vencida").length;
      return overdueCount > 0 ? { empresaId: company.id, empresa: company.razonSocial, tareasVencidas: overdueCount } : null;
    })
    .filter(Boolean)
    .sort((left, right) => right.tareasVencidas - left.tareasVencidas || left.empresa.localeCompare(right.empresa, "es"));

  const companiesWithMultipleActiveAlerts = activeCompanies
    .map((company) => {
      const count = activeAlerts.filter((alert) => alert.empresaId === company.id).length;
      return count >= 2 ? { empresaId: company.id, empresa: company.razonSocial, alertasActivas: count } : null;
    })
    .filter(Boolean)
    .sort((left, right) => right.alertasActivas - left.alertasActivas || left.empresa.localeCompare(right.empresa, "es"));

  const activeObligations = obligations.filter((obligation) => ["activa", "confirmada"].includes(normalizeText(obligation.estado)));
  const activeObligationsWithoutTask = activeObligations
    .map((obligation) => {
      const company = companyMap.get(obligation.empresaId);
      if (!company) {
        return null;
      }

      const applicableCalendars = listApplicableActiveCalendarsForObligation(company, obligation);
      if (applicableCalendars.length === 0) {
        return null;
      }

      const matchingTasks = tasks.filter(
        (task) =>
          task.empresaId === obligation.empresaId &&
          normalizeText(task.obligacionFiscal?.id || task.obligacionFiscalEmpresaId) === normalizeText(obligation.id) &&
          isFiscalTask(task)
      );

      return matchingTasks.length === 0
        ? {
            empresaId: company.id,
            empresa: company.razonSocial,
            obligacionId: obligation.id,
            obligacion: obligation.nombreObligacion,
            calendariosActivos: applicableCalendars.length
          }
        : null;
    })
    .filter(Boolean);

  const upcomingWithoutResponsible = activeTasks
    .filter((task) => {
      const days = daysUntil(task.fechaVencimiento, currentDate);
      return !normalizeText(task.responsableId) && days !== null && days >= 0 && days <= 15;
    })
    .map((task) => ({
      tareaId: task.id,
      tarea: task.titulo || task.id,
      empresaId: task.empresaId,
      empresa: task.empresa?.razonSocial || companyMap.get(task.empresaId)?.razonSocial || "",
      fechaVencimiento: dateOnly(task.fechaVencimiento),
      diasParaVencer: daysUntil(task.fechaVencimiento, currentDate)
    }))
    .sort((left, right) => left.diasParaVencer - right.diasParaVencer || left.empresa.localeCompare(right.empresa, "es"));

  const overdueWithoutRecentManagement = activeTasks
    .filter((task) => {
      if (taskStatus(task) !== "vencida") {
        return false;
      }
      const referenceDate = dateOnly(task.updatedAt || task.createdAt);
      return !referenceDate || referenceDate < subtractDays(currentDate, 3);
    })
    .map((task) => ({
      tareaId: task.id,
      tarea: task.titulo || task.id,
      empresaId: task.empresaId,
      empresa: task.empresa?.razonSocial || companyMap.get(task.empresaId)?.razonSocial || "",
      fechaVencimiento: dateOnly(task.fechaVencimiento),
      ultimaGestion: dateOnly(task.updatedAt || task.createdAt)
    }))
    .sort((left, right) => String(left.fechaVencimiento || "").localeCompare(String(right.fechaVencimiento || "")));

  const activeCalendarsWithoutExpectedTasks = [];
  for (const calendar of calendars.filter((item) => normalizeText(item.estado) === "activo")) {
    const companiesForCalendar = activeCompanies.filter((company) =>
      activeObligations.some((obligation) => {
        if (obligation.empresaId !== company.id || normalizeText(obligation.impuestoId) !== normalizeText(calendar.impuestoId)) {
          return false;
        }
        const applicable = listApplicableActiveCalendarsForObligation(company, obligation);
        return applicable.some((candidate) => candidate.id === calendar.id);
      })
    );

    if (companiesForCalendar.length === 0) {
      continue;
    }

    const hasTask = tasks.some(
      (task) =>
        normalizeText(task.calendarioFiscal?.id || task.calendarioFiscalId) === normalizeText(calendar.id) &&
        companiesForCalendar.some((company) => company.id === task.empresaId) &&
        isFiscalTask(task)
    );

    if (!hasTask) {
      activeCalendarsWithoutExpectedTasks.push({
        calendarioId: calendar.id,
        impuestoId: calendar.impuestoId,
        impuesto: calendar.impuesto?.nombre || calendar.impuestoNombre || calendar.impuestoId,
        periodo: calendar.periodo,
        anio: calendar.anio,
        empresasEsperadas: companiesForCalendar.length
      });
    }
  }

  return {
    empresasConTareasVencidas: companiesWithOverdueTasks,
    empresasConMultiplesAlertasActivas: companiesWithMultipleActiveAlerts,
    obligacionesActivasSinTareaFiscal: activeObligationsWithoutTask,
    tareasProximasSinResponsable: upcomingWithoutResponsible,
    tareasVencidasSinGestionReciente: overdueWithoutRecentManagement,
    calendariosActivosSinTareasEsperadas: activeCalendarsWithoutExpectedTasks
  };
}

function buildFilterOptions(companies, users, taxes, tasks) {
  const visibleCompanyIds = new Set(companies.map((company) => company.id));
  return {
    empresas: companies
      .map((company) => ({ id: company.id, label: company.razonSocial, estado: company.estadoEmpresa }))
      .sort((left, right) => left.label.localeCompare(right.label, "es")),
    responsables: users
      .map((user) => ({
        id: user.id,
        label: user.nombreCompleto || [user.nombre, user.apellido].filter(Boolean).join(" ") || user.email || user.id,
        cargo: user.cargo || ""
      }))
      .sort((left, right) => left.label.localeCompare(right.label, "es")),
    impuestos: taxes
      .filter((tax) => tasks.some((task) => normalizeText(task.impuestoId) === normalizeText(tax.id)))
      .map((tax) => ({ id: tax.id, label: tax.nombre }))
      .sort((left, right) => left.label.localeCompare(right.label, "es")),
    estadosTarea: [
      { id: "pendiente", label: "Pendiente" },
      { id: "en_proceso", label: "En proceso" },
      { id: "presentada", label: "Presentada" },
      { id: "completada", label: "Completada" },
      { id: "vencida", label: "Vencida" },
      { id: "cancelada", label: "Cancelada" },
      { id: "no_aplica", label: "No aplica" }
    ],
    nivelesRiesgo: RISK_LEVELS.map((level) => ({ id: level, label: level })),
    vistas: [
      { id: "", label: "Todas" },
      { id: "vencidas", label: "Vencidas" },
      { id: "proximas", label: "Proximas" },
      { id: "completadas", label: "Completadas" }
    ],
    periodosFiscales: Array.from(
      new Set(
        tasks
          .filter((task) => visibleCompanyIds.has(task.empresaId))
          .map((task) => taskPeriodLabel(task))
          .filter(Boolean)
      )
    )
      .sort((left, right) => left.localeCompare(right, "es"))
      .map((label) => ({ id: label, label }))
  };
}

function getDashboardScope(currentUser, filters = {}) {
  const normalizedFilters = normalizeDashboardFilters(filters);
  const currentDate = today();
  const companies = getCompanies().filter((company) => VISIBLE_COMPANY_STATUSES.has(normalizeText(company.estadoEmpresa)));
  const allUsers = getUsers().filter((user) => normalizeText(user.estado || "activo") === "activo");
  const taxes = getTaxes();
  const allTasks = listTasks().filter((task) => canUserAccessTask(currentUser, task));
  const allAlerts = listInternalAlertsForUser(currentUser, {}, "system");
  const directVisibleCompanyIds = new Set(companies.filter((company) => canSeeCompany(currentUser, company.id)).map((company) => company.id));
  const taskVisibleCompanyIds = new Set(allTasks.map((task) => task.empresaId));
  const alertVisibleCompanyIds = new Set(allAlerts.map((alert) => alert.empresaId));
  const accessibleCompanyIds = new Set([...directVisibleCompanyIds, ...taskVisibleCompanyIds, ...alertVisibleCompanyIds]);
  const scopedCompanies = companies.filter((company) => accessibleCompanyIds.has(company.id));
  const companyMap = new Map(scopedCompanies.map((company) => [company.id, company]));
  const scopedObligations = getCompanyObligations().filter((obligation) => accessibleCompanyIds.has(obligation.empresaId));
  const scopedCalendars = getFiscalCalendars().filter((calendar) =>
    scopedObligations.some((obligation) => normalizeText(obligation.impuestoId) === normalizeText(calendar.impuestoId))
  );
  const visibleUserIdSet = visibleUserIds(currentUser, allUsers);
  const scopedUsers = allUsers.filter((user) => visibleUserIdSet.has(user.id) || allTasks.some((task) => normalizeText(task.responsableId) === normalizeText(user.id)));
  const userMap = new Map(scopedUsers.map((user) => [user.id, user]));
  const filteredTasks = allTasks.filter((task) => taskMatchesFilters(task, normalizedFilters, currentDate));
  const filteredAlerts = allAlerts.filter((alert) => alertMatchesFilters(alert, normalizedFilters));
  const filteredObligations = scopedObligations.filter((obligation) => obligationMatchesFilters(obligation, normalizedFilters));
  const filteredCompanyIds = new Set(
    [
      ...filteredTasks.map((task) => task.empresaId),
      ...filteredAlerts.map((alert) => alert.empresaId),
      ...filteredObligations.map((obligation) => obligation.empresaId),
      normalizedFilters.empresaId
    ].filter(Boolean)
  );
  const effectiveCompanies =
    filteredCompanyIds.size > 0
      ? scopedCompanies.filter((company) => filteredCompanyIds.has(company.id))
      : scopedCompanies;

  return {
    filters: normalizedFilters,
    currentDate,
    companies: effectiveCompanies,
    companyMap,
    users: scopedUsers,
    userMap,
    taxes,
    tasks: filteredTasks,
    alerts: filteredAlerts,
    obligations: filteredObligations,
    calendars: scopedCalendars,
    directVisibleCompanyIds,
    accessibleCompanyIds,
    filterOptions: buildFilterOptions(scopedCompanies, scopedUsers, taxes, allTasks)
  };
}

export function buildDashboard(currentUser, filters = {}) {
  const scope = getDashboardScope(currentUser, filters);
  const { companies, companyMap, users, userMap, tasks, alerts, obligations, calendars, currentDate, filterOptions } = scope;
  const visibleCompanyIds = new Set(companies.map((company) => company.id));
  const visibleExpectedTasks = tasks.filter((task) => !["cancelada", "no_aplica"].includes(taskStatus(task)));
  const fiscalTasks = tasks.filter(isFiscalTask);
  const expectedFiscalTasks = fiscalTasks.filter((task) => !["cancelada", "no_aplica"].includes(taskStatus(task)));
  const activeAlerts = alerts.filter(isAlertOpen);
  const activeObligations = obligations.filter((obligation) => ["activa", "confirmada"].includes(normalizeText(obligation.estado)));
  const activeCompanies = companies.filter((company) => company.estadoEmpresa === COMPANY_STATUS.ACTIVE);
  const companiesInFollowUp = companies.filter((company) => company.estadoEmpresa !== COMPANY_STATUS.ACTIVE);
  const companiesWithoutAssignedUsers = activeCompanies.filter((company) => !companyHasAssignedUsers(company.id, users));
  const visibleCompletedTasks = visibleExpectedTasks.filter((task) => COMPLETED_STATUSES.has(taskStatus(task)));
  const visibleOverdueTasks = visibleExpectedTasks.filter((task) => taskStatus(task) === "vencida");
  const visiblePendingTasks = visibleExpectedTasks.filter((task) => taskStatus(task) === "pendiente");
  const visibleInProgressTasks = visibleExpectedTasks.filter((task) => taskStatus(task) === "en_proceso");
  const completedTasks = expectedFiscalTasks.filter((task) => COMPLETED_STATUSES.has(taskStatus(task)));
  const overdueTasks = expectedFiscalTasks.filter((task) => taskStatus(task) === "vencida");
  const pendingTasks = expectedFiscalTasks.filter((task) => taskStatus(task) === "pendiente");
  const inProgressTasks = expectedFiscalTasks.filter((task) => taskStatus(task) === "en_proceso");
  const upcoming7Tasks = expectedFiscalTasks.filter((task) => {
    const days = daysUntil(task.fechaVencimiento, currentDate);
    return !isTaskClosed(task) && days !== null && days >= 0 && days <= 7;
  });
  const upcoming15Tasks = expectedFiscalTasks.filter((task) => {
    const days = daysUntil(task.fechaVencimiento, currentDate);
    return !isTaskClosed(task) && days !== null && days >= 0 && days <= 15;
  });
  const upcoming30Tasks = expectedFiscalTasks.filter((task) => {
    const days = daysUntil(task.fechaVencimiento, currentDate);
    return !isTaskClosed(task) && days !== null && days >= 0 && days <= 30;
  });
  const attendedAlerts = alerts.filter((alert) => normalizeText(alert.estado) === "atendida");
  const dueToday = expectedFiscalTasks.filter((task) => dateOnly(task.fechaVencimiento) === currentDate && !isTaskClosed(task));
  const monthRange = currentMonthRange();
  const monthTasks = expectedFiscalTasks.filter((task) => isInRange(task.fechaVencimiento, monthRange.start, monthRange.end));
  const monthOverdueTasks = overdueTasks.filter((task) => isInRange(task.fechaVencimiento, monthRange.start, monthRange.end));
  const monthCompletedTasks = completedTasks.filter((task) =>
    isInRange(dateOnly(task.closedAt || task.updatedAt || task.fechaVencimiento), monthRange.start, monthRange.end)
  );
  const companyRisk = companies
    .map((company) => buildCompanyRiskItem(company, expectedFiscalTasks, alerts, buildComplianceSeries(expectedFiscalTasks, currentDate), currentDate))
    .filter((item) => !scope.filters.nivelRiesgo || item.nivelRiesgo === scope.filters.nivelRiesgo)
    .sort((left, right) => {
      const score = { alto: 4, medio: 3, bajo: 2, sin_riesgo: 1 };
      return score[right.nivelRiesgo] - score[left.nivelRiesgo] ||
        right.tareasVencidas - left.tareasVencidas ||
        right.alertasVencidas - left.alertasVencidas ||
        left.empresa.localeCompare(right.empresa, "es");
    });
  const userLoad = users
    .map((user) => buildWorkloadItem(user, visibleCompanyIds, expectedFiscalTasks, alerts, currentDate))
    .filter((item) => !scope.filters.responsableId || normalizeText(item.usuarioId) === scope.filters.responsableId)
    .filter((item) =>
      item.empresasAsignadas > 0 ||
      item.tareasPendientes ||
      item.tareasEnProceso ||
      item.tareasCompletadas ||
      item.tareasVencidas ||
      item.alertasCriticas ||
      item.sinAsignaciones
    )
    .sort((left, right) =>
      right.tareasVencidas - left.tareasVencidas ||
      right.tareasProximas - left.tareasProximas ||
      left.usuario.localeCompare(right.usuario, "es")
    );
  const managerAlerts = buildManagerAlerts(companies, activeObligations, expectedFiscalTasks, alerts, calendars, companyMap, currentDate);
  const compliance = buildComplianceSeries(expectedFiscalTasks, currentDate);
  const operationsCenter = {
    generatedAt: new Date().toISOString(),
    counts: {
      abiertas: expectedFiscalTasks.filter((task) => !isTaskClosed(task)).length,
      vencidas: overdueTasks.length,
      vencenHoy: dueToday.length,
      vencenTresDias: expectedFiscalTasks.filter((task) => {
        const days = daysUntil(task.fechaVencimiento, currentDate);
        return !isTaskClosed(task) && days !== null && days >= 0 && days <= 3;
      }).length,
      vencenSieteDias: upcoming7Tasks.length,
      sinResponsable: expectedFiscalTasks.filter((task) => !normalizeText(task.responsableId) && !isTaskClosed(task)).length,
      bloqueadasCliente: expectedFiscalTasks.filter((task) => {
        const clientBlock = task.bloqueoCliente || task.bloqueoPorCliente || {};
        return clientBlock.estado === "abierto" || clientBlock.activo === true;
      }).length,
      enRevision: expectedFiscalTasks.filter((task) => normalizeText(task.etapaGestion) === "en_revision" && !isTaskClosed(task)).length,
      pendientePagoCliente: expectedFiscalTasks.filter((task) =>
        ["enviado_al_cliente", "pendiente_pago", "no_pagado_por_cliente", "sin_soporte_pago"].includes(normalizeText(task.estadoPago))
      ).length
    },
    queues: {
      vencidas: summarizeQueue(expectedFiscalTasks, (task) => taskStatus(task) === "vencida", companyMap, userMap, currentDate),
      vencenTresDias: summarizeQueue(expectedFiscalTasks, (task) => {
        const days = daysUntil(task.fechaVencimiento, currentDate);
        return !isTaskClosed(task) && days !== null && days >= 0 && days <= 3;
      }, companyMap, userMap, currentDate),
      sinResponsable: summarizeQueue(expectedFiscalTasks, (task) => !normalizeText(task.responsableId) && !isTaskClosed(task), companyMap, userMap, currentDate),
      bloqueadasCliente: summarizeQueue(expectedFiscalTasks, (task) => {
        const clientBlock = task.bloqueoCliente || task.bloqueoPorCliente || {};
        return clientBlock.estado === "abierto" || clientBlock.activo === true;
      }, companyMap, userMap, currentDate),
      enRevision: summarizeQueue(expectedFiscalTasks, (task) => normalizeText(task.etapaGestion) === "en_revision" && !isTaskClosed(task), companyMap, userMap, currentDate),
      pendientePagoCliente: summarizeQueue(expectedFiscalTasks, (task) =>
        ["enviado_al_cliente", "pendiente_pago", "no_pagado_por_cliente", "sin_soporte_pago"].includes(normalizeText(task.estadoPago))
      , companyMap, userMap, currentDate),
      proximas: buildUpcomingSchedule(expectedFiscalTasks, companyMap, userMap, currentDate, 10)
    }
  };

  return {
    generatedAt: new Date().toISOString(),
    generatedBy: currentUser?.id || "system",
    filters: scope.filters,
    filterOptions,
    scope: {
      visibleCompanies: companies.length,
      monthStart: monthRange.start,
      monthEnd: monthRange.end,
      dashboardVariant:
        hasPermission(currentUser, "ver_dashboard_general")
          ? "general"
          : hasPermission(currentUser, "ver_dashboard_supervisor")
            ? "supervisor"
            : hasPermission(currentUser, "ver_dashboard_usuario")
              ? "usuario"
              : "sin_dashboard"
    },
    summary: {
      empresasActivas: activeCompanies.length,
      empresasEnSeguimiento: companiesInFollowUp.length,
      empresasSinResponsableAsignado: companiesWithoutAssignedUsers.length,
      obligacionesFiscalesActivas: activeObligations.length,
      tareasPendientes: visiblePendingTasks.length,
      tareasEnProceso: visibleInProgressTasks.length,
      tareasCompletadasPresentadas: visibleCompletedTasks.length,
      tareasVencidas: visibleOverdueTasks.length,
      alertasProximas: activeAlerts.filter((alert) => normalizeText(alert.tipo) === "proxima_vencer").length,
      alertasVencidas: activeAlerts.filter((alert) => normalizeText(alert.tipo) === "vencida").length,
      alertasAtendidas: attendedAlerts.length,
      alertasPreventivas: activeAlerts.filter((alert) => alert.nivel === "preventiva").length,
      alertasCriticas: activeAlerts.filter((alert) => alert.nivel === "critica").length
    },
    currentMonth: {
      tareasVencidas: monthOverdueTasks.length,
      tareasCompletadasPresentadas: monthCompletedTasks.length,
      tareasProximasSieteDias: upcoming7Tasks.length,
      obligacionesTareasFiscalesMes: monthTasks.length,
      empresasConRiesgoOperativo: companyRisk.filter((company) => company.nivelRiesgo === "alto" || company.nivelRiesgo === "medio").length
    },
    deadlines: {
      vencenHoy: dueToday.length,
      vencenSieteDias: upcoming7Tasks.length,
      vencenQuinceDias: upcoming15Tasks.length,
      vencenTreintaDias: upcoming30Tasks.length,
      tareasVencidasPorAntiguedad: buildOverdueBuckets(expectedFiscalTasks, currentDate),
      proximosVencimientos: buildUpcomingSchedule(expectedFiscalTasks, companyMap, userMap, currentDate)
    },
    operationsCenter,
    riskByCompany: companyRisk,
    workloadByUser: userLoad,
    compliance: {
      porcentajeTareasCompletadas: compliance.porcentajeGeneral,
      porcentajeTareasVencidas: safePercent(overdueTasks.length, compliance.tareasEsperadas),
      cumplimientoMesActual: safePercent(monthCompletedTasks.length, monthTasks.length),
      porcentajeGeneralCumplimiento: compliance.porcentajeGeneral,
      tareasEsperadas: compliance.tareasEsperadas,
      tareasCumplidas: compliance.tareasCumplidas,
      tareasVencidas: compliance.tareasVencidas,
      tareasPendientes: compliance.tareasPendientes,
      denominador: compliance.denominador,
      detalleDenominador: compliance.detalleDenominador,
      porEmpresa: companyRisk.map((item) => ({
        empresaId: item.empresaId,
        empresa: item.empresa,
        cumplimientoReciente: item.cumplimientoReciente,
        tareasEsperadasRecientes: item.tareasEsperadasRecientes,
        tareasCumplidasRecientes: item.tareasCumplidasRecientes
      })),
      porResponsable: userLoad.map((item) => ({
        usuarioId: item.usuarioId,
        usuario: item.usuario,
        tareasEsperadas: item.tareasPendientes + item.tareasEnProceso + item.tareasCompletadas + item.tareasVencidas,
        tareasCumplidas: item.tareasCompletadas,
        tareasVencidas: item.tareasVencidas,
        cumplimiento: safePercent(item.tareasCompletadas, item.tareasPendientes + item.tareasEnProceso + item.tareasCompletadas + item.tareasVencidas)
      })),
      porTipoObligacion: Array.from(
        expectedFiscalTasks.reduce((map, task) => {
          const key = normalizeText(task.impuestoId || task.impuesto?.id || task.impuestoNombre || "sin_impuesto");
          const label = task.impuestoNombre || task.impuesto?.nombre || task.obligacionFiscal?.nombreObligacion || "Sin impuesto";
          const current = map.get(key) || {
            impuestoId: key,
            impuesto: label,
            tareasEsperadas: 0,
            tareasCumplidas: 0,
            tareasVencidas: 0
          };
          current.tareasEsperadas += 1;
          if (COMPLETED_STATUSES.has(taskStatus(task))) current.tareasCumplidas += 1;
          if (taskStatus(task) === "vencida") current.tareasVencidas += 1;
          map.set(key, current);
          return map;
        }, new Map()).values()
      ).map((item) => ({
        ...item,
        cumplimiento: safePercent(item.tareasCumplidas, item.tareasEsperadas)
      })),
      porPeriodo: Array.from(
        expectedFiscalTasks.reduce((map, task) => {
          const key = taskPeriodLabel(task) || "Sin periodo";
          const current = map.get(key) || {
            periodoFiscal: key,
            tareasEsperadas: 0,
            tareasCumplidas: 0,
            tareasVencidas: 0
          };
          current.tareasEsperadas += 1;
          if (COMPLETED_STATUSES.has(taskStatus(task))) current.tareasCumplidas += 1;
          if (taskStatus(task) === "vencida") current.tareasVencidas += 1;
          map.set(key, current);
          return map;
        }, new Map()).values()
      ).map((item) => ({
        ...item,
        cumplimiento: safePercent(item.tareasCumplidas, item.tareasEsperadas)
      }))
    },
    managementAlerts: managerAlerts,
    activeCompaniesWithoutAssignedUsers: companiesWithoutAssignedUsers.map((company) => ({
      empresaId: company.id,
      empresa: company.razonSocial
    })),
    usersWithoutAssignments: userLoad.filter((item) => item.sinAsignaciones),
    criticalAlerts: activeAlerts
      .filter((alert) => alert.nivel === "critica")
      .sort((left, right) => String(left.fechaVencimiento || "").localeCompare(String(right.fechaVencimiento || "")))
      .slice(0, 10)
      .map((alert) => ({
        ...alert,
        empresa: companyMap.get(alert.empresaId)?.razonSocial || "",
        responsable: userMap.get(alert.responsableId)?.nombreCompleto || ""
      }))
  };
}

function reportRowsFromDashboard(type, dashboard) {
  if (type === "cumplimiento") {
    return dashboard.compliance.porEmpresa.map((item) => ({
      empresa: item.empresa,
      cumplimiento_reciente_pct: item.cumplimientoReciente,
      tareas_esperadas_recientes: item.tareasEsperadasRecientes,
      tareas_cumplidas_recientes: item.tareasCumplidasRecientes
    }));
  }

  if (type === "tareas_fiscales") {
    return dashboard.operationsCenter.queues.proximas.concat(dashboard.operationsCenter.queues.vencidas).map((item) => ({
      empresa: item.empresa,
      tarea: item.titulo,
      impuesto: item.impuesto,
      responsable: item.responsable || "Sin responsable",
      estado: item.estado,
      fecha_vencimiento: item.fechaVencimiento,
      dias_para_vencer: item.diasParaVencer
    }));
  }

  if (type === "vencimientos") {
    return dashboard.deadlines.proximosVencimientos.map((item) => ({
      empresa: item.empresa,
      tarea: item.titulo,
      responsable: item.responsable || "Sin responsable",
      fecha_vencimiento: item.fechaVencimiento,
      dias_para_vencer: item.diasParaVencer,
      nivel_riesgo: item.nivelRiesgo
    }));
  }

  if (type === "alertas") {
    return dashboard.criticalAlerts.map((item) => ({
      empresa: item.empresa || item.empresaId,
      responsable: item.responsable || item.responsableId || "Sin responsable",
      tipo: item.tipo,
      nivel: item.nivel,
      estado: item.estado,
      fecha_vencimiento: item.fechaVencimiento,
      mensaje: item.mensaje
    }));
  }

  if (type === "empresas") {
    return dashboard.riskByCompany.map((item) => ({
      empresa: item.empresa,
      estado_empresa: item.estadoEmpresa,
      riesgo: item.nivelRiesgo,
      criterio: item.criterioRiesgo,
      tareas_vencidas: item.tareasVencidas,
      tareas_proximas: item.tareasProximas,
      alertas_criticas: item.alertasCriticas,
      alertas_vencidas: item.alertasVencidas,
      cumplimiento_reciente_pct: item.cumplimientoReciente
    }));
  }

  if (type === "responsables") {
    return dashboard.workloadByUser.map((item) => ({
      responsable: item.usuario,
      cargo: item.cargo,
      empresas_asignadas: item.empresasAsignadas,
      tareas_pendientes: item.tareasPendientes,
      tareas_en_proceso: item.tareasEnProceso,
      tareas_completadas: item.tareasCompletadas,
      tareas_vencidas: item.tareasVencidas,
      tareas_proximas: item.tareasProximas,
      alertas_criticas: item.alertasCriticas
    }));
  }

  return dashboard.riskByCompany.map((item) => ({
    empresa: item.empresa,
    riesgo: item.nivelRiesgo,
    criterio: item.criterioRiesgo,
    tareas_vencidas: item.tareasVencidas,
    alertas_vencidas: item.alertasVencidas,
    cumplimiento_reciente_pct: item.cumplimientoReciente
  }));
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function buildCsvContent({ title, generatedAt, generatedBy, filters, rows }) {
  const metadata = [
    ["Reporte", title],
    ["Generado en", generatedAt],
    ["Usuario", generatedBy],
    ["Filtros", JSON.stringify(filters)]
  ];
  const headers = rows.length ? Object.keys(rows[0]) : ["sin_datos"];
  const lines = [];

  for (const row of metadata) {
    lines.push(row.map(csvEscape).join(","));
  }

  lines.push("");
  lines.push(headers.map(csvEscape).join(","));

  if (rows.length === 0) {
    lines.push(csvEscape("sin_datos"));
  } else {
    for (const row of rows) {
      lines.push(headers.map((header) => csvEscape(row[header])).join(","));
    }
  }

  return `\uFEFF${lines.join("\r\n")}`;
}

export function buildDashboardReport(currentUser, type = "cumplimiento", filters = {}) {
  const normalizedType = MANAGEMENT_REPORT_TYPES.includes(normalizeText(type)) ? normalizeText(type) : "cumplimiento";
  const dashboard = buildDashboard(currentUser, filters);
  const rows = reportRowsFromDashboard(normalizedType, dashboard);

  return {
    type: normalizedType,
    title: `reporte_${normalizedType}`,
    generatedAt: dashboard.generatedAt,
    generatedBy: currentUser?.nombreCompleto || currentUser?.email || currentUser?.id || "system",
    filters: dashboard.filters,
    summary: dashboard.summary,
    rows
  };
}

export function exportDashboardReportCsv(currentUser, type = "cumplimiento", filters = {}) {
  const report = buildDashboardReport(currentUser, type, filters);
  const timestamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
  return {
    fileName: `${report.title}-${timestamp}.csv`,
    contentType: "text/csv; charset=utf-8",
    body: buildCsvContent(report)
  };
}

export function listDashboardReportTypes() {
  return MANAGEMENT_REPORT_TYPES.map((type) => ({ id: type, label: type }));
}
