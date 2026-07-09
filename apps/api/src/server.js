import http from "node:http";
import { URL } from "node:url";
import {
  canAccessCompany,
  canViewSensitiveCompanyData,
  hasPermission,
  getPrimaryRole,
  getCiiuActivityByCode,
  listCiiuActivities,
  searchCiiuActivities
} from "../../../packages/domain/index.js";
import { readJsonBody, readRequestBody, sendEmpty, sendJson } from "./lib/http.js";
import { parseMultipartFormData } from "./lib/multipart.js";
import { generateClientSummaryReport } from "./lib/client-report-service.js";
import {
  approveCompanyReview,
  buildBootstrap,
  confirmExtractionAndCreateCompany,
  getCompanyDetail,
  getCompanyDetailForUser,
  getExtraction,
  listCompaniesForUser,
  saveRutUpload
} from "./lib/company-repository.js";
import {
  analyzeCompanyObligations,
  confirmCompanyObligation,
  createManualCompanyObligation,
  createInferredTaxRule,
  createTax,
  listAllCompanyObligations,
  listCompanyObligations,
  listInferredTaxRules,
  listTaxRules,
  listTaxes,
  markCompanyObligationNotApplicable,
  previewTaxUpdateImpact,
  reviewCompanyObligation,
  updateInferredTaxRule,
  updateCompanyObligation,
  updateTax
} from "./lib/obligations-service.js";
import {
  activateFiscalCalendar,
  cancelFiscalCalendar,
  createFiscalCalendar,
  deleteFiscalCalendar,
  generateFiscalTasks,
  getFiscalCalendarById,
  getFiscalTaskById,
  listCompanyFiscalTasks,
  listFiscalCalendars,
  listFiscalTasks,
  replaceFiscalCalendar,
  updateFiscalCalendar
} from "./lib/fiscal-calendar-service.js";
import {
  assignTask,
  bulkAssignTasks,
  closeTask,
  createManualTask,
  generateDianComplianceTasks,
  getTaskById,
  listTaskResponsiblesForUser,
  listTasks,
  updateTaskClientBlock,
  updateTaskStatus,
  updateTaskSupport,
  updateTaskWorkflowStage
} from "./lib/task-service.js";
import {
  generateInternalAlerts,
  getInternalAlertById,
  listInternalAlerts,
  updateInternalAlertStatus
} from "./lib/alert-service.js";
import { buildDashboard } from "./lib/dashboard-service.js";
import { ensureStorage } from "./lib/storage.js";
import { getAudits, getUsers } from "./lib/storage.js";
import {
  canUserAccessCompany as canUserAccessCompanyByHierarchy,
  createUser,
  getSessionSummary,
  getSessionUser,
  listUsers,
  listSupervisedUsers,
  login,
  logout,
  updateUser
} from "./lib/auth-service.js";

const port = Number(process.env.PORT || 4000);
ensureStorage();

function sendActionError(response, error) {
  const statusCode = Number(error?.statusCode || 500);

  if (statusCode >= 500) {
    sendJson(response, 500, {
      error: "No se pudo actualizar la obligacion.",
      details: error?.message || "Error interno."
    });
    return;
  }

  sendJson(response, statusCode, {
    error: error?.message || "No se pudo completar la operacion."
  });
}

function sendApiError(response, error, fallbackMessage = "No se pudo completar la operacion.") {
  sendJson(response, Number(error?.statusCode || 400), {
    error: error?.message || fallbackMessage
  });
}

function getBearerToken(request) {
  const header = String(request.headers.authorization || "").trim();
  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

function requireAuthenticatedUser(response, currentUser) {
  if (!currentUser) {
    sendJson(response, 401, { error: "Debes iniciar sesion para continuar." });
    return false;
  }

  return true;
}

function requireActiveUser(response, currentUser) {
  if (!currentUser || currentUser.estado === undefined || currentUser.estado === "activo") {
    return true;
  }

  sendJson(response, 403, { error: "Tu usuario no se encuentra activo." });
  return false;
}

function requirePermission(response, currentUser, permission, message = "No tienes permisos para ejecutar esta accion.") {
  if (!hasPermission(currentUser, permission)) {
    sendJson(response, 403, { error: message });
    return false;
  }

  return true;
}

function requireRole(response, currentUser, roles, message = "Tu rol no puede ejecutar esta accion.") {
  const allowedRoles = Array.isArray(roles) ? roles : [];
  if (allowedRoles.includes(getPrimaryRole(currentUser))) {
    return true;
  }

  sendJson(response, 403, { error: message });
  return false;
}

function requireAnyPermission(response, currentUser, permissions, message = "No tienes permisos para acceder a este modulo.") {
  const allowed = permissions.some((permission) => hasPermission(currentUser, permission));
  if (!allowed) {
    sendJson(response, 403, { error: message });
    return false;
  }

  return true;
}

function userCanAccessCompany(currentUser, companyId) {
  return canUserAccessCompanyByHierarchy(
    {
      ...currentUser,
      permisos: currentUser?.permisosEfectivos || currentUser?.permisos || []
    },
    companyId
  );
}

function userCanAccessAlert(currentUser, alert) {
  if (!alert) {
    return false;
  }

  return userCanAccessCompany(currentUser, alert.empresaId) || alert.responsableId === currentUser?.id;
}

function userCanAccessTask(currentUser, task) {
  if (!task) {
    return false;
  }

  const primaryRole = getPrimaryRole(currentUser);
  const supervisedUsers = Array.isArray(currentUser?.supervisedUsers) ? currentUser.supervisedUsers : [];
  const canAccessCompanyScope = userCanAccessCompany(currentUser, task.empresaId);

  if (hasPermission(currentUser, "ver_todas_empresas") || ["owner", "administrador", "gerente"].includes(primaryRole)) {
    return true;
  }

  if (primaryRole === "cliente") {
    return task.visibleParaCliente === true && (!task.clienteUsuarioId || task.clienteUsuarioId === currentUser?.id);
  }

  if (["senior_accountant", "supervisor"].includes(primaryRole)) {
    return canAccessCompanyScope || task.responsableId === currentUser?.id || supervisedUsers.includes(task.responsableId);
  }

  if (["junior_accountant", "operativo_medio", "operativo_basico"].includes(primaryRole)) {
    return task.responsableId === currentUser?.id || task.creadoPor === currentUser?.id;
  }

  if (primaryRole === "apprentice") {
    return task.responsableId === currentUser?.id;
  }

  return canAccessCompanyScope;
}

function canManageTaskAsReviewer(currentUser, task) {
  if (!task) {
    return false;
  }

  const primaryRole = getPrimaryRole(currentUser);
  if (["owner", "administrador", "gerente"].includes(primaryRole) || hasPermission(currentUser, "ver_todas_empresas")) {
    return true;
  }

  if (["senior_accountant", "supervisor"].includes(primaryRole)) {
    const supervisedUsers = Array.isArray(currentUser?.supervisedUsers) ? currentUser.supervisedUsers : [];
    return task.responsableId === currentUser?.id || supervisedUsers.includes(task.responsableId);
  }

  return task.responsableId === currentUser?.id;
}

function requireTaskAccess(response, currentUser, task, message = "No tienes acceso a esta tarea.") {
  if (!userCanAccessTask(currentUser, task)) {
    sendJson(response, 403, { error: message });
    return false;
  }

  return true;
}

function requireTaskManagement(response, currentUser, task, message = "No tienes permisos para gestionar esta tarea.") {
  if (!canManageTaskAsReviewer(currentUser, task)) {
    sendJson(response, 403, { error: message });
    return false;
  }

  return true;
}

function requireCompanyAccess(response, currentUser, companyId) {
  if (!userCanAccessCompany(currentUser, companyId)) {
    sendJson(response, 403, { error: "No tienes acceso a esa empresa." });
    return false;
  }

  return true;
}

function parseTaskFilters(searchParams) {
  return {
    estado: searchParams.get("estado") || "",
    empresaId: searchParams.get("empresaId") || searchParams.get("companyId") || "",
    responsableId: searchParams.get("responsableId") || "",
    tipoTarea: searchParams.get("tipoTarea") || "",
    vencidas: searchParams.get("vencidas") || "",
    proximas: searchParams.get("proximas") || ""
  };
}

function buildVisibleAuditEntries(currentUser) {
  const audits = getAudits();
  const users = getUsers();
  const userMap = new Map(
    users.map((user) => [
      user.id,
      {
        id: user.id,
        nombreCompleto: user.nombreCompleto || [user.nombre, user.apellido].filter(Boolean).join(" "),
        email: user.email,
        role: user.role || user.roles?.[0] || ""
      }
    ])
  );

  return audits
    .filter((item) => {
      if (hasPermission(currentUser, "ver_todas_empresas") || ["owner", "administrador", "gerente"].includes(getPrimaryRole(currentUser))) {
        return true;
      }

      const visibleUserIds = new Set([currentUser?.id, ...(Array.isArray(currentUser?.supervisedUsers) ? currentUser.supervisedUsers : [])]);
      if (visibleUserIds.has(item.usuarioId)) {
        return true;
      }

      const companyId =
        item?.valorNuevo?.empresaId ||
        item?.valorAnterior?.empresaId ||
        (item?.recursoTipo === "empresa" ? item?.recursoId : "");

      return companyId ? userCanAccessCompany(currentUser, companyId) : false;
    })
    .sort((left, right) => String(right.fecha || "").localeCompare(String(left.fecha || "")))
    .map((item) => ({
      ...item,
      usuario: userMap.get(item.usuarioId) || null
    }));
}

function getCurrentOperationalYear() {
  return new Date().getUTCFullYear();
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const authToken = getBearerToken(request);
  const currentUser = getSessionUser(authToken);

  if (request.method === "OPTIONS") {
    sendEmpty(response);
    return;
  }

  if (url.pathname === "/health") {
    sendJson(response, 200, {
      status: "ok",
      app: "gestorconta-api",
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (url.pathname === "/api/meta") {
    sendJson(response, 200, {
      version: "0.1.0",
      implementedPhase: "fase-5-gestion-integral-de-tareas",
      nextPhase: "fase-6-alertas-internas"
    });
    return;
  }

  if (url.pathname.startsWith("/api/") && url.pathname !== "/api/auth/login") {
    if (!requireAuthenticatedUser(response, currentUser) || !requireActiveUser(response, currentUser)) {
      return;
    }
  }

  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    Promise.resolve()
      .then(async () => {
        const payload = await readJsonBody(request);
        const result = login(payload.email, payload.password);
        sendJson(response, 200, result);
      })
      .catch((error) => sendApiError(response, error, "No fue posible iniciar sesion."));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/auth/session") {
    if (!requireAuthenticatedUser(response, currentUser)) {
      return;
    }

    sendJson(response, 200, getSessionSummary(authToken));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/logout") {
    if (authToken) {
      logout(authToken);
    }

    sendJson(response, 200, { ok: true });
    return;
  }

  if (String(url.pathname || "").startsWith("/api/") && !requireAuthenticatedUser(response, currentUser)) {
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/catalogs/ciiu/search") {
    if (
      !requireAnyPermission(response, currentUser, ["cargar_rut_pdf", "gestionar_obligaciones", "gestionar_calendarios"])
    ) {
      return;
    }
    sendJson(response, 200, {
      items: searchCiiuActivities(url.searchParams.get("q") || "")
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/taxes") {
    if (
      !requireAnyPermission(response, currentUser, ["gestionar_impuestos", "gestionar_obligaciones", "gestionar_calendarios"])
    ) {
      return;
    }
    sendJson(response, 200, {
      items: listTaxes()
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/taxes") {
    if (!requirePermission(response, currentUser, "gestionar_impuestos")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const payload = await readJsonBody(request);
        const result = createTax(payload, currentUser.id);
        sendJson(response, 201, result);
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/taxes\/[^/]+$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_impuestos")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const taxId = url.pathname.split("/")[3];
        const payload = await readJsonBody(request);
        const result = updateTax(taxId, payload, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "POST" && /^\/api\/taxes\/[^/]+\/impact$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_impuestos")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const taxId = url.pathname.split("/")[3];
        const payload = await readJsonBody(request);
        const result = previewTaxUpdateImpact(taxId, payload);
        sendJson(response, 200, result);
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/tax-rules") {
    if (
      !requireAnyPermission(response, currentUser, ["gestionar_impuestos", "gestionar_obligaciones", "gestionar_calendarios"])
    ) {
      return;
    }
    sendJson(response, 200, {
      items: listTaxRules()
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/inferred-tax-rules") {
    if (
      !requireAnyPermission(response, currentUser, ["gestionar_impuestos", "gestionar_obligaciones", "gestionar_calendarios"])
    ) {
      return;
    }
    sendJson(response, 200, {
      items: listInferredTaxRules()
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/inferred-tax-rules") {
    if (!requirePermission(response, currentUser, "gestionar_impuestos")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const payload = await readJsonBody(request);
        const result = createInferredTaxRule(payload, currentUser.id);
        sendJson(response, 201, result);
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/inferred-tax-rules\/[^/]+$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_impuestos")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const ruleId = url.pathname.split("/")[3];
        const payload = await readJsonBody(request);
        const result = updateInferredTaxRule(ruleId, payload, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/fiscal-calendars") {
    if (
      !requireAnyPermission(response, currentUser, ["gestionar_calendarios", "generar_tareas_fiscales", "gestionar_obligaciones"])
    ) {
      return;
    }
    sendJson(response, 200, {
      items: listFiscalCalendars()
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/fiscal-calendars") {
    if (!requirePermission(response, currentUser, "gestionar_calendarios")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const payload = await readJsonBody(request);
        const result = createFiscalCalendar(payload, currentUser.id);
        sendJson(response, 201, result);
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/fiscal-calendars/generate-tasks") {
    if (!requirePermission(response, currentUser, "generar_tareas_fiscales")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const payload = await readJsonBody(request);
        if (payload?.companyId && !requireCompanyAccess(response, currentUser, payload.companyId)) {
          return;
        }
        const result = generateFiscalTasks(payload || {}, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "GET" && /^\/api\/fiscal-calendars\/[^/]+$/.test(url.pathname)) {
    if (
      !requireAnyPermission(response, currentUser, ["gestionar_calendarios", "generar_tareas_fiscales", "gestionar_obligaciones"])
    ) {
      return;
    }
    const calendarId = url.pathname.split("/").at(-1);
    const calendar = getFiscalCalendarById(calendarId);

    if (!calendar) {
      sendJson(response, 404, { error: "Calendario fiscal no encontrado." });
      return;
    }

    sendJson(response, 200, calendar);
    return;
  }

  if (request.method === "PATCH" && /^\/api\/fiscal-calendars\/[^/]+\/activate$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_calendarios")) {
      return;
    }
    Promise.resolve()
      .then(() => {
        const calendarId = url.pathname.split("/")[3];
        const result = activateFiscalCalendar(calendarId, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/fiscal-calendars\/[^/]+\/cancel$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_calendarios")) {
      return;
    }
    Promise.resolve()
      .then(() => {
        const calendarId = url.pathname.split("/")[3];
        const result = cancelFiscalCalendar(calendarId, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "POST" && /^\/api\/fiscal-calendars\/[^/]+\/replace$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_calendarios")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const calendarId = url.pathname.split("/")[3];
        const payload = await readJsonBody(request);
        const result = replaceFiscalCalendar(calendarId, payload, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/fiscal-calendars\/[^/]+$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_calendarios")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const calendarId = url.pathname.split("/")[3];
        const payload = await readJsonBody(request);
        const result = updateFiscalCalendar(calendarId, payload, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "DELETE" && /^\/api\/fiscal-calendars\/[^/]+$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_calendarios")) {
      return;
    }
    Promise.resolve()
      .then(() => {
        const calendarId = url.pathname.split("/")[3];
        const result = deleteFiscalCalendar(calendarId, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/fiscal-tasks") {
    if (!requireAnyPermission(response, currentUser, ["ver_tareas", "ver_tareas_empresa", "generar_tareas_fiscales", "gestionar_calendarios"])) {
      return;
    }
    sendJson(response, 200, {
      items: listFiscalTasks().filter((task) => userCanAccessTask(currentUser, task))
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/tasks") {
    if (!requireAnyPermission(response, currentUser, ["ver_tareas", "ver_tareas_empresa", "generar_tareas_fiscales", "gestionar_calendarios"])) {
      return;
    }

    sendJson(response, 200, {
      items: listTasks(parseTaskFilters(url.searchParams)).filter((task) => userCanAccessTask(currentUser, task))
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/dashboard") {
    if (!requireAnyPermission(response, currentUser, ["ver_dashboard_general", "ver_dashboard_supervisor", "ver_dashboard_usuario", "ver_tareas", "ver_tareas_empresa"])) {
      return;
    }

    sendJson(response, 200, buildDashboard(currentUser));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/task-responsibles") {
    if (!requireAnyPermission(response, currentUser, ["ver_tareas", "ver_tareas_empresa", "generar_tareas_fiscales", "gestionar_calendarios"])) {
      return;
    }

    sendJson(response, 200, {
      items: listTaskResponsiblesForUser(currentUser)
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/alerts") {
    if (!requireAnyPermission(response, currentUser, ["ver_alertas", "gestionar_alertas", "ver_tareas", "ver_tareas_empresa", "generar_tareas_fiscales", "gestionar_calendarios"])) {
      return;
    }

    const filters = {
      estado: url.searchParams.get("estado") || "",
      tipo: url.searchParams.get("tipo") || "",
      nivel: url.searchParams.get("nivel") || ""
    };

    sendJson(response, 200, {
      items: listInternalAlerts(filters).filter((alert) => userCanAccessAlert(currentUser, alert))
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/alerts/generate") {
    if (!requireAnyPermission(response, currentUser, ["gestionar_alertas", "configurar_alertas", "generar_tareas_fiscales", "gestionar_calendarios"])) {
      return;
    }

    const summary = generateInternalAlerts(currentUser.id);
    sendJson(response, 201, {
      ...summary,
      items: summary.items.filter((alert) => userCanAccessAlert(currentUser, alert))
    });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/alerts\/[^/]+\/status$/.test(url.pathname)) {
    if (!requireAnyPermission(response, currentUser, ["ver_alertas", "gestionar_alertas", "generar_tareas_fiscales", "gestionar_calendarios"])) {
      return;
    }

    Promise.resolve()
      .then(async () => {
        const alertId = url.pathname.split("/")[3];
        const alert = getInternalAlertById(alertId);
        if (!alert) {
          sendJson(response, 404, { error: "Alerta no encontrada." });
          return;
        }
        if (!userCanAccessAlert(currentUser, alert)) {
          sendJson(response, 403, { error: "No tienes acceso a esta alerta." });
          return;
        }
        const payload = await readJsonBody(request);
        const result = updateInternalAlertStatus(alertId, payload.estado, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => sendApiError(response, error, "No fue posible actualizar la alerta."));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/tasks") {
    if (!requireAnyPermission(response, currentUser, ["crear_tarea_manual", "crear_tarea_recurrente", "gestionar_calendarios", "generar_tareas_fiscales"])) {
      return;
    }

    Promise.resolve()
      .then(async () => {
        const payload = await readJsonBody(request);
        if (!requireCompanyAccess(response, currentUser, payload?.empresaId)) {
          return;
        }
        const result = createManualTask(payload, currentUser.id);
        sendJson(response, 201, result);
      })
      .catch((error) => sendApiError(response, error, "No fue posible crear la tarea."));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/tasks/generate-dian-controls") {
    if (!requireAnyPermission(response, currentUser, ["gestionar_calendarios", "generar_tareas_fiscales"])) {
      return;
    }

    Promise.resolve()
      .then(async () => {
        const payload = await readJsonBody(request);
        if (payload?.companyId && !requireCompanyAccess(response, currentUser, payload.companyId)) {
          return;
        }
        const result = generateDianComplianceTasks(payload || {}, currentUser.id);
        sendJson(response, 201, result);
      })
      .catch((error) => sendApiError(response, error, "No fue posible generar los controles DIAN."));
    return;
  }

  if (request.method === "PATCH" && /^\/api\/tasks\/[^/]+\/status$/.test(url.pathname)) {
    if (!requireAnyPermission(response, currentUser, ["cambiar_estado_tarea", "gestionar_calendarios", "generar_tareas_fiscales"])) {
      return;
    }

    Promise.resolve()
      .then(async () => {
        const taskId = url.pathname.split("/")[3];
        const task = getTaskById(taskId);
        if (!task) {
          sendJson(response, 404, { error: "Tarea no encontrada." });
          return;
        }
        if (!requireTaskAccess(response, currentUser, task)) {
          return;
        }
        if (!requireTaskManagement(response, currentUser, task)) {
          return;
        }
        const payload = await readJsonBody(request);
        const result = updateTaskStatus(taskId, payload.estado, payload, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => sendApiError(response, error, "No fue posible actualizar la tarea."));
    return;
  }

  if (request.method === "PATCH" && /^\/api\/tasks\/[^/]+\/workflow$/.test(url.pathname)) {
    if (!requireAnyPermission(response, currentUser, ["editar_tarea", "cambiar_estado_tarea", "gestionar_calendarios", "generar_tareas_fiscales"])) {
      return;
    }

    Promise.resolve()
      .then(async () => {
        const taskId = url.pathname.split("/")[3];
        const task = getTaskById(taskId);
        if (!task) {
          sendJson(response, 404, { error: "Tarea no encontrada." });
          return;
        }
        if (!requireTaskAccess(response, currentUser, task)) {
          return;
        }
        if (!requireTaskManagement(response, currentUser, task)) {
          return;
        }
        const payload = await readJsonBody(request);
        if (getPrimaryRole(currentUser) === "apprentice" && ["aprobada", "pagada", "completada", "presentada"].includes(String(payload.etapaGestion || "").trim())) {
          sendJson(response, 403, { error: "Tu rol no puede aprobar ni cerrar el flujo final de una tarea." });
          return;
        }
        const result = updateTaskWorkflowStage(taskId, payload.etapaGestion, payload, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => sendApiError(response, error, "No fue posible actualizar el flujo de la tarea."));
    return;
  }

  if (request.method === "PATCH" && /^\/api\/tasks\/[^/]+\/support$/.test(url.pathname)) {
    if (!requireAnyPermission(response, currentUser, ["cargar_evidencia", "aprobar_evidencia", "gestionar_calendarios", "generar_tareas_fiscales"])) {
      return;
    }

    Promise.resolve()
      .then(async () => {
        const taskId = url.pathname.split("/")[3];
        const task = getTaskById(taskId);
        if (!task) {
          sendJson(response, 404, { error: "Tarea no encontrada." });
          return;
        }
        if (!requireTaskAccess(response, currentUser, task)) {
          return;
        }
        if (!requireTaskManagement(response, currentUser, task)) {
          return;
        }
        const payload = await readJsonBody(request);
        const result = updateTaskSupport(taskId, payload, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => sendApiError(response, error, "No fue posible actualizar el soporte de la tarea."));
    return;
  }

  if (request.method === "PATCH" && url.pathname === "/api/tasks/bulk-assign") {
    if (!requireAnyPermission(response, currentUser, ["reasignar_tarea", "gestionar_calendarios", "generar_tareas_fiscales"])) {
      return;
    }

    Promise.resolve()
      .then(async () => {
        const payload = await readJsonBody(request);
        const taskIds = Array.isArray(payload.taskIds) ? payload.taskIds : [];
        for (const taskId of taskIds) {
          const task = getTaskById(taskId);
          if (!task) {
            sendJson(response, 404, { error: `Tarea no encontrada: ${taskId}` });
            return;
          }
          if (!requireTaskAccess(response, currentUser, task)) {
            return;
          }
          if (!requireTaskManagement(response, currentUser, task, "No puedes reasignar tareas fuera de tu equipo o alcance.")) {
            return;
          }
        }
        const result = bulkAssignTasks(taskIds, payload.responsableId, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => sendApiError(response, error, "No fue posible reasignar las tareas."));
    return;
  }

  if (request.method === "PATCH" && /^\/api\/tasks\/[^/]+\/assign$/.test(url.pathname)) {
    if (!requireAnyPermission(response, currentUser, ["reasignar_tarea", "gestionar_calendarios", "generar_tareas_fiscales"])) {
      return;
    }

    Promise.resolve()
      .then(async () => {
        const taskId = url.pathname.split("/")[3];
        const task = getTaskById(taskId);
        if (!task) {
          sendJson(response, 404, { error: "Tarea no encontrada." });
          return;
        }
        if (!requireTaskAccess(response, currentUser, task)) {
          return;
        }
        if (!requireTaskManagement(response, currentUser, task, "No puedes reasignar tareas fuera de tu equipo o alcance.")) {
          return;
        }
        const payload = await readJsonBody(request);
        const result = assignTask(taskId, payload.responsableId, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => sendApiError(response, error, "No fue posible reasignar la tarea."));
    return;
  }

  if (request.method === "PATCH" && /^\/api\/tasks\/[^/]+\/client-block$/.test(url.pathname)) {
    if (!requireAnyPermission(response, currentUser, ["editar_tarea", "reasignar_tarea", "gestionar_calendarios", "generar_tareas_fiscales"])) {
      return;
    }

    Promise.resolve()
      .then(async () => {
        const taskId = url.pathname.split("/")[3];
        const task = getTaskById(taskId);
        if (!task) {
          sendJson(response, 404, { error: "Tarea no encontrada." });
          return;
        }
        if (!requireTaskAccess(response, currentUser, task)) {
          return;
        }
        if (!requireTaskManagement(response, currentUser, task)) {
          return;
        }
        const payload = await readJsonBody(request);
        const result = updateTaskClientBlock(taskId, payload, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => sendApiError(response, error, "No fue posible actualizar el bloqueo por cliente."));
    return;
  }

  if (request.method === "PATCH" && /^\/api\/tasks\/[^/]+\/close$/.test(url.pathname)) {
    if (!requireAnyPermission(response, currentUser, ["ver_tareas_empresa", "gestionar_calendarios", "generar_tareas_fiscales"])) {
      return;
    }

    Promise.resolve()
      .then(async () => {
        const taskId = url.pathname.split("/")[3];
        const task = getTaskById(taskId);
        if (!task) {
          sendJson(response, 404, { error: "Tarea no encontrada." });
          return;
        }
        if (!requireTaskAccess(response, currentUser, task)) {
          return;
        }
        if (!requireTaskManagement(response, currentUser, task)) {
          return;
        }
        if (["junior_accountant", "operativo_medio", "operativo_basico", "apprentice"].includes(getPrimaryRole(currentUser))) {
          sendJson(response, 403, { error: "Tu rol no puede cerrar tareas de forma final." });
          return;
        }
        const payload = await readJsonBody(request);
        const result = closeTask(taskId, payload, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => sendApiError(response, error, "No fue posible cerrar la tarea."));
    return;
  }

  if (request.method === "GET" && /^\/api\/fiscal-tasks\/[^/]+$/.test(url.pathname)) {
    if (!requireAnyPermission(response, currentUser, ["ver_tareas_empresa", "generar_tareas_fiscales", "gestionar_calendarios"])) {
      return;
    }
    const taskId = url.pathname.split("/").at(-1);
    const task = getFiscalTaskById(taskId);

    if (!task) {
      sendJson(response, 404, { error: "Tarea fiscal no encontrada." });
      return;
    }

    if (!requireCompanyAccess(response, currentUser, task.empresaId)) {
      return;
    }

    sendJson(response, 200, task);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/catalogs/ciiu") {
    if (
      !requireAnyPermission(response, currentUser, ["cargar_rut_pdf", "gestionar_obligaciones", "gestionar_calendarios"])
    ) {
      return;
    }
    sendJson(response, 200, {
      items: listCiiuActivities()
    });
    return;
  }

  if (request.method === "GET" && /^\/api\/catalogs\/ciiu\/[^/]+$/.test(url.pathname)) {
    if (
      !requireAnyPermission(response, currentUser, ["cargar_rut_pdf", "gestionar_obligaciones", "gestionar_calendarios"])
    ) {
      return;
    }
    const code = url.pathname.split("/").at(-1);
    const activity = getCiiuActivityByCode(code);

    if (!activity) {
      sendJson(response, 404, { error: "Codigo CIIU no encontrado en catalogo." });
      return;
    }

    sendJson(response, 200, activity);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/companies") {
    if (!requireAnyPermission(response, currentUser, ["ver_empresas_asignadas", "ver_todas_empresas", "ver_mi_empresa"])) {
      return;
    }
    sendJson(response, 200, {
      items: listCompaniesForUser(currentUser)
    });
    return;
  }

  if (request.method === "GET" && /^\/api\/companies\/[^/]+\/fiscal-tasks$/.test(url.pathname)) {
    const companyId = url.pathname.split("/")[3];
    if (!requireCompanyAccess(response, currentUser, companyId)) {
      return;
    }
    sendJson(response, 200, {
      items: listCompanyFiscalTasks(companyId)
    });
    return;
  }

  if (request.method === "GET" && /^\/api\/companies\/[^/]+$/.test(url.pathname)) {
    const companyId = url.pathname.split("/").at(-1);
    if (!requirePermission(response, currentUser, "ver_detalle_empresa", "No tienes permisos para ver el detalle de la empresa.")) {
      return;
    }
    if (!requireCompanyAccess(response, currentUser, companyId)) {
      return;
    }
    const company = getCompanyDetailForUser(companyId, currentUser);

    if (!company) {
      sendJson(response, 404, { error: "Empresa no encontrada." });
      return;
    }

    sendJson(response, 200, company);
    return;
  }

  if (request.method === "GET" && /^\/api\/companies\/[^/]+\/sensitive$/.test(url.pathname)) {
    const companyId = url.pathname.split("/")[3];
    if (!requirePermission(response, currentUser, "ver_datos_sensibles_empresa")) {
      return;
    }
    if (!requireCompanyAccess(response, currentUser, companyId)) {
      return;
    }

    const company = getCompanyDetail(companyId);
    if (!company) {
      sendJson(response, 404, { error: "Empresa no encontrada." });
      return;
    }

    if (!canViewSensitiveCompanyData(currentUser)) {
      sendJson(response, 403, { error: "No tienes permisos para consultar datos sensibles." });
      return;
    }

    sendJson(response, 200, {
      id: company.id,
      razonSocial: company.razonSocial,
      direccionSeccional: company.direccionSeccional || "",
      buzonElectronico: company.buzonElectronico || "",
      datosExtraidosOriginales: company.datosExtraidosOriginales || null,
      datosConfirmadosPorUsuario: company.datosConfirmadosPorUsuario || null,
      metadataExtraccion: company.metadataExtraccion || null
    });
    return;
  }

  if (request.method === "GET" && /^\/api\/companies\/[^/]+\/obligations$/.test(url.pathname)) {
    const companyId = url.pathname.split("/")[3];
    if (!requireCompanyAccess(response, currentUser, companyId)) {
      return;
    }
    sendJson(response, 200, {
      items: listCompanyObligations(companyId)
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/company-obligations") {
    if (!requireAnyPermission(response, currentUser, ["gestionar_obligaciones", "gestionar_calendarios", "generar_tareas_fiscales"])) {
      return;
    }
    sendJson(response, 200, {
      items: listAllCompanyObligations().filter((item) => userCanAccessCompany(currentUser, item.empresaId))
    });
    return;
  }

  if (request.method === "GET" && /^\/api\/rut-uploads\/[^/]+$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "cargar_rut_pdf")) {
      return;
    }
    const extractionId = url.pathname.split("/").at(-1);
    const extraction = getExtraction(extractionId);

    if (!extraction) {
      sendJson(response, 404, { error: "Extraccion no encontrada." });
      return;
    }

    sendJson(response, 200, extraction);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/rut-uploads") {
    if (!requirePermission(response, currentUser, "cargar_rut_pdf")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const body = await readRequestBody(request);
        const contentType = request.headers["content-type"] || "";
        const parts = parseMultipartFormData(body, contentType);
        const filePart = parts.find((part) => part.name === "rutPdf" && part.filename);

        if (!filePart) {
          throw new Error("Debes adjuntar el archivo PDF del RUT.");
        }

        const result = await saveRutUpload({
          fileName: filePart.filename,
          mimeType: filePart.contentType,
          buffer: filePart.body,
          actor: currentUser.id
        });

        sendJson(response, 201, result);
      })
      .catch((error) => {
        sendJson(response, 400, { error: error.message });
      });
    return;
  }

  if (request.method === "POST" && /^\/api\/rut-uploads\/[^/]+\/confirm$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "confirmar_empresa_rut")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const extractionId = url.pathname.split("/")[3];
        const payload = await readJsonBody(request);
        const company = confirmExtractionAndCreateCompany(extractionId, payload, currentUser.id);
        sendJson(response, 201, company);
      })
      .catch((error) => {
        sendJson(response, 400, { error: error.message });
      });
    return;
  }

  if (request.method === "POST" && /^\/api\/companies\/[^/]+\/analyze-obligations$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_obligaciones")) {
      return;
    }
    Promise.resolve()
      .then(() => {
        const companyId = url.pathname.split("/")[3];
        if (!requireCompanyAccess(response, currentUser, companyId)) {
          return;
        }
        const result = analyzeCompanyObligations(companyId, currentUser.id);
        const taskGeneration = generateFiscalTasks(
          {
            companyId,
            anio: getCurrentOperationalYear(),
            incluirVencidas: true
          },
          currentUser.id
        );
        sendJson(response, 200, {
          ...result,
          taskGeneration
        });
      })
      .catch((error) => {
        sendJson(response, 400, { error: error.message });
      });
    return;
  }

  if (request.method === "POST" && /^\/api\/companies\/[^/]+\/manual-obligations$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_obligaciones")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const companyId = url.pathname.split("/")[3];
        if (!requireCompanyAccess(response, currentUser, companyId)) {
          return;
        }
        const payload = await readJsonBody(request);
        const result = createManualCompanyObligation(
          {
            ...payload,
            empresaId: companyId
          },
          currentUser.id
        );
        const taskGeneration =
          result?.estado === "activa"
            ? generateFiscalTasks(
                {
                  companyId,
                  impuestoId: result.impuestoId,
                  anio: getCurrentOperationalYear(),
                  incluirVencidas: true
                },
                currentUser.id
              )
            : null;
        sendJson(response, 201, {
          obligation: result,
          taskGeneration
        });
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "POST" && /^\/api\/company-obligations\/manual\/?$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_obligaciones")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const payload = await readJsonBody(request);
        if (payload?.empresaId && !requireCompanyAccess(response, currentUser, payload.empresaId)) {
          return;
        }
        const result = createManualCompanyObligation(payload, currentUser.id);
        const taskGeneration =
          result?.estado === "activa"
            ? generateFiscalTasks(
                {
                  companyId: result.empresaId,
                  impuestoId: result.impuestoId,
                  anio: getCurrentOperationalYear(),
                  incluirVencidas: true
                },
                currentUser.id
              )
            : null;
        sendJson(response, 201, {
          obligation: result,
          taskGeneration
        });
      })
      .catch((error) => {
        sendJson(response, Number(error?.statusCode || 400), { error: error.message });
      });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/companies\/[^/]+\/approve-review$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "aprobar_empresa")) {
      return;
    }
    Promise.resolve()
      .then(() => {
        const companyId = url.pathname.split("/")[3];
        if (!requireCompanyAccess(response, currentUser, companyId)) {
          return;
        }
        const result = approveCompanyReview(companyId, currentUser.id);
        const obligationAnalysis = analyzeCompanyObligations(companyId, currentUser.id);
        const taskGeneration = generateFiscalTasks(
          {
            companyId,
            anio: getCurrentOperationalYear(),
            incluirVencidas: true
          },
          currentUser.id
        );
        sendJson(response, 200, {
          ...result,
          obligationAnalysis,
          taskGeneration
        });
      })
      .catch((error) => {
        sendJson(response, 400, { error: error.message });
      });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/company-obligations\/[^/]+\/confirm$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_obligaciones")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const obligationId = url.pathname.split("/")[3];
        if (!String(obligationId || "").trim()) {
          sendJson(response, 400, { error: "ID de obligacion requerido." });
          return;
        }
        const obligation = listAllCompanyObligations().find((item) => item.id === obligationId);
        if (!obligation) {
          sendJson(response, 404, { error: "Obligacion no encontrada." });
          return;
        }
        if (!requireCompanyAccess(response, currentUser, obligation.empresaId)) {
          return;
        }
        const payload = await readJsonBody(request);
        const result = confirmCompanyObligation(obligationId, currentUser.id, payload.observaciones || "");
        const taskGeneration = generateFiscalTasks(
          {
            companyId: result.empresaId,
            impuestoId: result.impuestoId,
            anio: getCurrentOperationalYear(),
            incluirVencidas: true
          },
          currentUser.id
        );
        sendJson(response, 200, {
          obligation: result,
          taskGeneration
        });
      })
      .catch((error) => {
        console.error("[company-obligation-action] error:", error);
        sendActionError(response, error);
      });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/company-obligations\/[^/]+\/not-applicable$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_obligaciones")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const obligationId = url.pathname.split("/")[3];
        if (!String(obligationId || "").trim()) {
          sendJson(response, 400, { error: "ID de obligacion requerido." });
          return;
        }
        const obligation = listAllCompanyObligations().find((item) => item.id === obligationId);
        if (!obligation) {
          sendJson(response, 404, { error: "Obligacion no encontrada." });
          return;
        }
        if (!requireCompanyAccess(response, currentUser, obligation.empresaId)) {
          return;
        }
        const payload = await readJsonBody(request);
        const result = markCompanyObligationNotApplicable(obligationId, currentUser.id, payload.observaciones || "");
        sendJson(response, 200, result);
      })
      .catch((error) => {
        console.error("[company-obligation-action] error:", error);
        sendActionError(response, error);
      });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/company-obligations\/[^/]+\/review$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_obligaciones")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const obligationId = url.pathname.split("/")[3];
        if (!String(obligationId || "").trim()) {
          sendJson(response, 400, { error: "ID de obligacion requerido." });
          return;
        }
        const obligation = listAllCompanyObligations().find((item) => item.id === obligationId);
        if (!obligation) {
          sendJson(response, 404, { error: "Obligacion no encontrada." });
          return;
        }
        if (!requireCompanyAccess(response, currentUser, obligation.empresaId)) {
          return;
        }
        const payload = await readJsonBody(request);
        const result = reviewCompanyObligation(obligationId, currentUser.id, payload.observaciones || "");
        sendJson(response, 200, result);
      })
      .catch((error) => {
        console.error("[company-obligation-action] error:", error);
        sendActionError(response, error);
      });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/company-obligations\/[^/]+$/.test(url.pathname)) {
    if (!requirePermission(response, currentUser, "gestionar_obligaciones")) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const obligationId = url.pathname.split("/")[3];
        if (!String(obligationId || "").trim()) {
          sendJson(response, 400, { error: "ID de obligacion requerido." });
          return;
        }
        const obligation = listAllCompanyObligations().find((item) => item.id === obligationId);
        if (!obligation) {
          sendJson(response, 404, { error: "Obligacion no encontrada." });
          return;
        }
        if (!requireCompanyAccess(response, currentUser, obligation.empresaId)) {
          return;
        }
        const payload = await readJsonBody(request);
        const result = updateCompanyObligation(obligationId, payload, currentUser.id);
        sendJson(response, 200, result);
      })
      .catch((error) => {
        console.error("[company-obligation-edit] error:", error);
        sendActionError(response, error);
      });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/bootstrap") {
    sendJson(response, 200, buildBootstrap(currentUser));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/reports/client-summary") {
    if (!requirePermission(response, currentUser, "exportar_reportes")) {
      return;
    }

    try {
      const companyId = String(url.searchParams.get("companyId") || "");
      if (!companyId) {
        sendJson(response, 400, { error: "Debes seleccionar una empresa para generar el reporte." });
        return;
      }

      if (!requireCompanyAccess(response, currentUser, companyId)) {
        return;
      }

      const report = generateClientSummaryReport(companyId);
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${report.fileName}"`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      });
      response.end(report.html);
    } catch (error) {
      sendApiError(response, error, "No se pudo generar el reporte del cliente.");
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/audits") {
    if (!requirePermission(response, currentUser, "ver_auditoria", "No tienes permisos para consultar la auditoria del sistema.")) {
      return;
    }

    sendJson(response, 200, {
      items: buildVisibleAuditEntries(currentUser)
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/users") {
    try {
      sendJson(response, 200, {
        items: listUsers(currentUser)
      });
    } catch (error) {
      sendApiError(response, error);
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/users/supervised") {
    try {
      sendJson(response, 200, {
        items: listSupervisedUsers(currentUser)
      });
    } catch (error) {
      sendApiError(response, error);
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/users") {
    Promise.resolve()
      .then(async () => {
        const payload = await readJsonBody(request);
        const result = createUser(payload, currentUser);
        sendJson(response, 201, result);
      })
      .catch((error) => sendApiError(response, error));
    return;
  }

  if (request.method === "PATCH" && /^\/api\/users\/[^/]+$/.test(url.pathname)) {
    Promise.resolve()
      .then(async () => {
        const userId = url.pathname.split("/")[3];
        const payload = await readJsonBody(request);
        const result = updateUser(userId, payload, currentUser);
        sendJson(response, 200, result);
      })
      .catch((error) => sendApiError(response, error));
    return;
  }

  sendJson(response, 404, {
    error: "Ruta no encontrada."
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `No se pudo iniciar GestorConta API en http://localhost:${port} porque el puerto ${port} ya esta en uso.`
    );
    console.error("Cierra la instancia anterior o cambia el puerto antes de volver a intentarlo.");
    process.exit(1);
  }

  console.error("No se pudo iniciar GestorConta API.", error);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`GestorConta API disponible en http://localhost:${port}`);
});
