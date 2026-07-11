import {
  COMPANY_STATUS,
  canAccessCompany,
  getEffectivePermissions
} from "../../../../packages/domain/index.js";
import {
  getCompanies,
  getCompanyObligations,
  getUsers
} from "./storage.js";
import { canUserAccessTask } from "./access-control.js";
import { listInternalAlertsForUser } from "./alert-service.js";
import { listTasks } from "./task-service.js";

const COMPLETED_STATUSES = new Set(["presentada", "completada"]);
const CLOSED_STATUSES = new Set(["presentada", "completada", "cancelada", "no_aplica"]);

function userWithEffectivePermissions(user) {
  return {
    ...user,
    permisos: user?.permisosEfectivos || getEffectivePermissions(user)
  };
}

function canSeeCompany(user, companyId) {
  return canAccessCompany(userWithEffectivePermissions(user), companyId);
}

function isAlertOpen(alert) {
  return !["atendida", "descartada"].includes(String(alert?.estado || ""));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(value, days) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function currentMonthRange() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
  return { start, end };
}

function dateOnly(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

function isInRange(value, start, end) {
  const date = dateOnly(value);
  return Boolean(date && date >= start && date <= end);
}

function taskStatus(task) {
  return String(task.estadoOperativo || task.estadoGeneral || "pendiente");
}

function isTaskClosed(task) {
  return CLOSED_STATUSES.has(taskStatus(task));
}

function isUpcomingTask(task, currentDate = today()) {
  const status = taskStatus(task);
  const dueDate = dateOnly(task.fechaVencimiento);
  return Boolean(dueDate && dueDate >= currentDate && dueDate <= addDays(currentDate, 7) && !CLOSED_STATUSES.has(status));
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

function percent(part, total) {
  if (!total) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function isBlockedByClient(task) {
  const clientBlock = task.bloqueoCliente || task.bloqueoPorCliente || {};
  const paymentStatus = String(task.estadoPago || "");
  const observations = String(task.observaciones || "").toLowerCase();

  return Boolean(
    clientBlock.estado === "abierto" ||
      clientBlock.activo === true ||
      ["enviado_al_cliente", "no_pagado_por_cliente", "sin_soporte_pago"].includes(paymentStatus) ||
      observations.includes("cliente") && observations.includes("bloque")
  );
}

function isWaitingForReview(task) {
  return String(task.etapaGestion || "") === "en_revision";
}

function isWaitingForClientPayment(task) {
  return ["enviado_al_cliente", "pendiente_pago", "no_pagado_por_cliente", "sin_soporte_pago"].includes(String(task.estadoPago || ""));
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
    impuesto: task.impuestoNombre || task.impuesto?.nombre || "",
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

function sortByOperationalRisk(left, right) {
  const leftDays = Number.isFinite(left.diasParaVencer) ? left.diasParaVencer : 9999;
  const rightDays = Number.isFinite(right.diasParaVencer) ? right.diasParaVencer : 9999;
  const priorityScore = { critica: 4, alta: 3, media: 2, baja: 1 };

  return leftDays - rightDays ||
    (priorityScore[right.prioridad] || 0) - (priorityScore[left.prioridad] || 0) ||
    String(left.empresa || "").localeCompare(String(right.empresa || ""), "es") ||
    String(left.titulo || "").localeCompare(String(right.titulo || ""), "es");
}

function summarizeQueue(tasks, predicate, companyMap, userMap, currentDate = today(), limit = 8) {
  return tasks
    .filter(predicate)
    .map((task) => buildTaskSummary(task, companyMap, userMap, currentDate))
    .sort(sortByOperationalRisk)
    .slice(0, limit);
}

function buildOperationsCenter(tasks, companyMap, userMap, currentDate = today()) {
  const openTasks = tasks.filter((task) => !isTaskClosed(task));
  const overdue = openTasks.filter((task) => taskStatus(task) === "vencida");
  const dueToday = openTasks.filter((task) => dateOnly(task.fechaVencimiento) === currentDate);
  const dueNextThreeDays = openTasks.filter((task) => {
    const days = daysUntil(task.fechaVencimiento, currentDate);
    return days !== null && days >= 0 && days <= 3;
  });
  const dueNextSevenDays = openTasks.filter((task) => {
    const days = daysUntil(task.fechaVencimiento, currentDate);
    return days !== null && days >= 0 && days <= 7;
  });
  const unassigned = openTasks.filter((task) => !String(task.responsableId || "").trim());
  const blockedByClient = openTasks.filter(isBlockedByClient);
  const waitingForReview = openTasks.filter(isWaitingForReview);
  const waitingForClientPayment = openTasks.filter(isWaitingForClientPayment);

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      abiertas: openTasks.length,
      vencidas: overdue.length,
      vencenHoy: dueToday.length,
      vencenTresDias: dueNextThreeDays.length,
      vencenSieteDias: dueNextSevenDays.length,
      sinResponsable: unassigned.length,
      bloqueadasCliente: blockedByClient.length,
      enRevision: waitingForReview.length,
      pendientePagoCliente: waitingForClientPayment.length
    },
    queues: {
      vencidas: summarizeQueue(openTasks, (task) => taskStatus(task) === "vencida", companyMap, userMap, currentDate),
      vencenTresDias: summarizeQueue(openTasks, (task) => {
        const days = daysUntil(task.fechaVencimiento, currentDate);
        return days !== null && days >= 0 && days <= 3;
      }, companyMap, userMap, currentDate),
      sinResponsable: summarizeQueue(openTasks, (task) => !String(task.responsableId || "").trim(), companyMap, userMap, currentDate),
      bloqueadasCliente: summarizeQueue(openTasks, isBlockedByClient, companyMap, userMap, currentDate),
      enRevision: summarizeQueue(openTasks, isWaitingForReview, companyMap, userMap, currentDate),
      pendientePagoCliente: summarizeQueue(openTasks, isWaitingForClientPayment, companyMap, userMap, currentDate),
      proximas: summarizeQueue(openTasks, (task) => {
        const days = daysUntil(task.fechaVencimiento, currentDate);
        return days !== null && days >= 0;
      }, companyMap, userMap, currentDate, 10)
    }
  };
}

function buildCompanyRisk(company, tasks, alerts) {
  const companyTasks = tasks.filter((task) => task.empresaId === company.id);
  const companyAlerts = alerts.filter((alert) => alert.empresaId === company.id && isAlertOpen(alert));
  const overdueTasks = companyTasks.filter((task) => taskStatus(task) === "vencida").length;
  const upcomingTasks = companyTasks.filter((task) => isUpcomingTask(task)).length;
  const criticalAlerts = companyAlerts.filter((alert) => alert.nivel === "critica").length;
  const preventiveAlerts = companyAlerts.filter((alert) => alert.nivel === "preventiva").length;
  const riskLevel = overdueTasks || criticalAlerts ? "alto" : upcomingTasks || preventiveAlerts ? "medio" : "bajo";

  return {
    empresaId: company.id,
    empresa: company.razonSocial,
    tareasVencidas: overdueTasks,
    tareasProximas: upcomingTasks,
    alertasCriticas: criticalAlerts,
    alertasPreventivas: preventiveAlerts,
    nivelRiesgo: riskLevel
  };
}

function buildUserLoad(user, visibleCompanyIds, tasks, alerts) {
  const assignedCompanyIds = Array.isArray(user.empresasAsignadas)
    ? user.empresasAsignadas.filter((companyId) => visibleCompanyIds.has(companyId))
    : [];
  const userTasks = tasks.filter((task) => task.responsableId === user.id);
  const userAlerts = alerts.filter((alert) => alert.responsableId === user.id && isAlertOpen(alert));

  return {
    usuarioId: user.id,
    usuario: user.nombreCompleto || [user.nombre, user.apellido].filter(Boolean).join(" ") || user.email || user.id,
    empresasAsignadas: assignedCompanyIds.length,
    tareasPendientes: userTasks.filter((task) => taskStatus(task) === "pendiente").length,
    tareasEnProceso: userTasks.filter((task) => taskStatus(task) === "en_proceso").length,
    tareasCompletadas: userTasks.filter((task) => COMPLETED_STATUSES.has(taskStatus(task))).length,
    tareasVencidas: userTasks.filter((task) => taskStatus(task) === "vencida").length,
    alertasCriticas: userAlerts.filter((alert) => alert.nivel === "critica").length
  };
}

export function buildDashboard(currentUser) {
  const companies = getCompanies();
  const visibleCompanies = companies.filter((company) => canSeeCompany(currentUser, company.id));
  const visibleCompanyIds = new Set(visibleCompanies.map((company) => company.id));
  const companyMap = new Map(visibleCompanies.map((company) => [company.id, company]));
  const tasks = listTasks().filter((task) => visibleCompanyIds.has(task.empresaId) && canUserAccessTask(currentUser, task));
  const obligations = getCompanyObligations().filter((obligation) => visibleCompanyIds.has(obligation.empresaId));
  const alerts = listInternalAlertsForUser(currentUser, {}, "system").filter((alert) => visibleCompanyIds.has(alert.empresaId));
  const users = getUsers();
  const userMap = new Map(users.map((user) => [user.id, user]));
  const { start, end } = currentMonthRange();
  const currentDate = today();
  const monthTasks = tasks.filter((task) => isInRange(task.fechaVencimiento, start, end));
  const completedTasks = tasks.filter((task) => COMPLETED_STATUSES.has(taskStatus(task)));
  const overdueTasks = tasks.filter((task) => taskStatus(task) === "vencida");
  const monthCompletedTasks = tasks.filter((task) => {
    const status = taskStatus(task);
    return COMPLETED_STATUSES.has(status) && isInRange(task.closedAt || task.updatedAt || task.fechaVencimiento, start, end);
  });
  const monthOverdueTasks = overdueTasks.filter((task) => isInRange(task.fechaVencimiento, start, end));
  const upcomingTasks = tasks.filter((task) => isUpcomingTask(task, currentDate));
  const fiscalMonthTasks = monthTasks.filter((task) => task.tipoTarea === "fiscal");
  const activeObligations = obligations.filter((obligation) => ["activa", "confirmada"].includes(String(obligation.estado || "")));
  const activeCompanies = visibleCompanies.filter((company) => company.estadoEmpresa === COMPANY_STATUS.ACTIVE);
  const companyRisk = visibleCompanies
    .map((company) => buildCompanyRisk(company, tasks, alerts))
    .sort((left, right) => {
      const score = { alto: 3, medio: 2, bajo: 1 };
      return score[right.nivelRiesgo] - score[left.nivelRiesgo] ||
        right.tareasVencidas - left.tareasVencidas ||
        right.alertasCriticas - left.alertasCriticas ||
        left.empresa.localeCompare(right.empresa, "es");
    });
  const userLoad = users
    .map((user) => buildUserLoad(user, visibleCompanyIds, tasks, alerts))
    .filter((item) => item.empresasAsignadas > 0 || item.tareasPendientes || item.tareasEnProceso || item.tareasCompletadas || item.tareasVencidas || item.alertasCriticas)
    .sort((left, right) => right.tareasVencidas - left.tareasVencidas || right.alertasCriticas - left.alertasCriticas || left.usuario.localeCompare(right.usuario, "es"));

  return {
    generatedAt: new Date().toISOString(),
    scope: {
      visibleCompanies: visibleCompanies.length,
      monthStart: start,
      monthEnd: end
    },
    summary: {
      empresasActivas: activeCompanies.length,
      obligacionesFiscalesActivas: activeObligations.length,
      tareasPendientes: tasks.filter((task) => taskStatus(task) === "pendiente").length,
      tareasEnProceso: tasks.filter((task) => taskStatus(task) === "en_proceso").length,
      tareasCompletadasPresentadas: completedTasks.length,
      tareasVencidas: overdueTasks.length,
      alertasPreventivas: alerts.filter((alert) => alert.nivel === "preventiva" && isAlertOpen(alert)).length,
      alertasCriticas: alerts.filter((alert) => alert.nivel === "critica" && isAlertOpen(alert)).length
    },
    currentMonth: {
      tareasVencidas: monthOverdueTasks.length,
      tareasCompletadasPresentadas: monthCompletedTasks.length,
      tareasProximasSieteDias: upcomingTasks.length,
      obligacionesTareasFiscalesMes: fiscalMonthTasks.length,
      empresasConRiesgoOperativo: companyRisk.filter((company) => company.nivelRiesgo !== "bajo").length
    },
    operationsCenter: buildOperationsCenter(tasks, companyMap, userMap, currentDate),
    riskByCompany: companyRisk,
    workloadByUser: userLoad,
    compliance: {
      porcentajeTareasCompletadas: percent(completedTasks.length, tasks.length),
      porcentajeTareasVencidas: percent(overdueTasks.length, tasks.length),
      cumplimientoMesActual: percent(monthCompletedTasks.length, monthTasks.length)
    },
    criticalAlerts: alerts
      .filter((alert) => alert.nivel === "critica" && isAlertOpen(alert))
      .sort((left, right) => String(left.fechaVencimiento || "").localeCompare(String(right.fechaVencimiento || "")))
      .slice(0, 10)
      .map((alert) => ({
        ...alert,
        empresa: companyMap.get(alert.empresaId)?.razonSocial || "",
        responsable: userMap.get(alert.responsableId)?.nombreCompleto || ""
      }))
  };
}
