import { createAuditEntry } from "../../../../packages/domain/index.js";
import {
  getAudits,
  getInternalAlerts,
  getOrganization,
  saveAudits,
  saveInternalAlerts
} from "./storage.js";
import { listTasks } from "./task-service.js";
import { canUserAccessAlert } from "./alert-access.js";

export const ALERT_TYPES = Object.freeze({
  UPCOMING: "proxima_vencer",
  OVERDUE: "vencida"
});

export const ALERT_STATUS = Object.freeze({
  UNREAD: "no_leida",
  READ: "leida",
  ATTENDED: "atendida",
  DISMISSED: "descartada"
});

const ACTIVE_ALERT_STATUSES = new Set([ALERT_STATUS.UNREAD, ALERT_STATUS.READ]);
const CLOSED_ALERT_STATUSES = new Set([ALERT_STATUS.ATTENDED, ALERT_STATUS.DISMISSED]);
const CLOSED_TASK_STATUSES = new Set(["presentada", "completada", "cancelada", "no_aplica"]);
const ALERT_STATUS_ALIASES = Object.freeze({
  nueva: ALERT_STATUS.UNREAD,
  cerrada: ALERT_STATUS.DISMISSED
});
const ALERT_STATUS_TRANSITIONS = Object.freeze({
  [ALERT_STATUS.UNREAD]: new Set([ALERT_STATUS.READ, ALERT_STATUS.ATTENDED, ALERT_STATUS.DISMISSED]),
  [ALERT_STATUS.READ]: new Set([ALERT_STATUS.ATTENDED, ALERT_STATUS.DISMISSED]),
  [ALERT_STATUS.ATTENDED]: new Set(),
  [ALERT_STATUS.DISMISSED]: new Set()
});

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createAlertError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysUntil(dateValue) {
  const start = new Date(`${today()}T00:00:00.000Z`);
  const end = new Date(`${dateValue}T00:00:00.000Z`);
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}

function normalizeAlertStatus(value) {
  const normalized = String(value || "").trim();
  return ALERT_STATUS_ALIASES[normalized] || normalized || ALERT_STATUS.UNREAD;
}

function normalizeAlertFilters(filters = {}) {
  const rawStatus = String(filters.estado || "").trim();
  return {
    estado: rawStatus ? normalizeAlertStatus(rawStatus) : "",
    tipo: String(filters.tipo || "").trim(),
    nivel: String(filters.nivel || "").trim(),
    empresaId: String(filters.empresaId || filters.companyId || "").trim(),
    responsableId: String(filters.responsableId || filters.userId || "").trim()
  };
}

function isActiveAlertStatus(status) {
  return ACTIVE_ALERT_STATUSES.has(normalizeAlertStatus(status));
}

function isClosedAlertStatus(status) {
  return CLOSED_ALERT_STATUSES.has(normalizeAlertStatus(status));
}

function alertKey(alert) {
  return `${alert.tareaId}:${alert.tipo}`;
}

function buildAlertConditionHash({ tareaId = "", tipo = "", nivel = "", fechaVencimiento = "" } = {}) {
  return [String(tareaId || "").trim(), String(tipo || "").trim(), String(nivel || "").trim(), String(fechaVencimiento || "").trim()].join("|");
}

function normalizeAlert(alert = {}) {
  const status = normalizeAlertStatus(alert.estado);
  const taskId = alert.tareaId || alert.taskId || "";
  const type = alert.tipo || ALERT_TYPES.UPCOMING;
  const level = alert.nivel || "informativa";
  const dueDate = alert.fechaVencimiento || "";

  return {
    ...alert,
    estado: status,
    nivel: level,
    tipo: type,
    tareaId: taskId,
    empresaId: alert.empresaId || "",
    responsableId: alert.responsableId || "",
    fechaVencimiento: dueDate,
    motivoEstado: alert.motivoEstado || alert.motivoCierreAutomatico || "",
    conditionHash:
      alert.conditionHash ||
      buildAlertConditionHash({
        tareaId: taskId,
        tipo: type,
        nivel: level,
        fechaVencimiento: dueDate
      }),
    createdAt: alert.createdAt || new Date().toISOString(),
    updatedAt: alert.updatedAt || alert.createdAt || new Date().toISOString()
  };
}

function normalizeAndPersistAlerts() {
  const alerts = getInternalAlerts();
  let changed = false;
  const normalized = alerts.map((alert) => {
    const next = normalizeAlert(alert);
    if (JSON.stringify(next) !== JSON.stringify(alert)) {
      changed = true;
    }
    return next;
  });

  if (changed) {
    saveInternalAlerts(normalized);
  }

  return normalized;
}

function closeAlert(alert, actor, reason) {
  const previous = clone(alert);
  alert.estado = ALERT_STATUS.ATTENDED;
  alert.updatedAt = new Date().toISOString();
  alert.actualizadaPor = actor;
  alert.atendidaAt = alert.atendidaAt || alert.updatedAt;
  alert.atendidaPor = alert.atendidaPor || actor;
  alert.motivoEstado = reason;
  alert.motivoCierreAutomatico = reason;
  return previous;
}

function taskStatus(task) {
  return String(task.estadoOperativo || task.estadoGeneral || "pendiente");
}

function shouldSkipTask(task) {
  return !task?.id || !task.fechaVencimiento || CLOSED_TASK_STATUSES.has(taskStatus(task));
}

function isDianComplianceTask(task) {
  return String(task?.tipoTarea || "").trim() === "cumplimiento_dian";
}

function taskDisplayName(task) {
  return String(task?.titulo || task?.id || "tarea").trim();
}

function companyDisplayName(task) {
  return String(task?.empresa?.razonSocial || task?.empresaId || "").trim();
}

function buildAlertDraft(task) {
  if (shouldSkipTask(task)) {
    return null;
  }

  const currentDate = today();
  const dueDate = String(task.fechaVencimiento);
  const isDianTask = isDianComplianceTask(task);
  const taskName = taskDisplayName(task);
  const companyName = companyDisplayName(task);
  const companySuffix = companyName ? ` de ${companyName}` : "";

  if (taskStatus(task) === "vencida" || dueDate < currentDate) {
    return {
      tipo: ALERT_TYPES.OVERDUE,
      nivel: "critica",
      mensaje: isDianTask
        ? `El control DIAN ${taskName}${companySuffix} esta vencido.`
        : `La tarea ${taskName} esta vencida.`
    };
  }

  if (dueDate >= currentDate && dueDate <= addDays(currentDate, 7)) {
    const days = daysUntil(dueDate);
    const duePhrase = days === 0 ? "hoy" : days === 1 ? "manana" : `en ${days} dias`;
    return {
      tipo: ALERT_TYPES.UPCOMING,
      nivel: isDianTask && days <= 2 ? "critica" : "preventiva",
      mensaje: isDianTask
        ? `El control DIAN ${taskName}${companySuffix} vence ${duePhrase}.`
        : `La tarea ${taskName} vence ${duePhrase}.`
    };
  }

  return null;
}

function buildDraftConditionHash(task, draft) {
  return buildAlertConditionHash({
    tareaId: task?.id || "",
    tipo: draft?.tipo || "",
    nivel: draft?.nivel || "",
    fechaVencimiento: task?.fechaVencimiento || ""
  });
}

function reconcileAlerts(alerts, tasks, actor) {
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  let changed = false;

  for (const alert of alerts) {
    const task = taskMap.get(alert.tareaId);
    const draft = task ? buildAlertDraft(task) : null;
    const nextConditionHash = draft ? buildDraftConditionHash(task, draft) : "";
    const isActive = isActiveAlertStatus(alert.estado);
    const isClosed = isClosedAlertStatus(alert.estado);

    if (!draft && isActive) {
      const previous = closeAlert(alert, actor, "La tarea ya no requiere una alerta activa.");
      auditAlert("cerrar_alerta_automatica", alert, actor, "La alerta se cerro automaticamente.", previous);
      changed = true;
      continue;
    }

    if (!draft) {
      continue;
    }

    if (isClosed && alert.conditionHash !== nextConditionHash) {
      continue;
    }

    const nextMessage = draft.mensaje;
    const nextLevel = draft.nivel;
    const nextType = draft.tipo;
    const requiresUpdate =
      alert.tipo !== nextType ||
      alert.nivel !== nextLevel ||
      alert.mensaje !== nextMessage ||
      alert.fechaVencimiento !== task.fechaVencimiento ||
      alert.responsableId !== (task.responsableId || "") ||
      alert.conditionHash !== nextConditionHash;

    if (!requiresUpdate) {
      continue;
    }

    const previous = clone(alert);
    alert.tipo = nextType;
    alert.nivel = nextLevel;
    alert.mensaje = nextMessage;
    alert.fechaVencimiento = task.fechaVencimiento;
    alert.responsableId = task.responsableId || "";
    alert.conditionHash = nextConditionHash;
    alert.updatedAt = new Date().toISOString();
    alert.actualizadaPor = actor;
    if (isActive) {
      delete alert.motivoCierreAutomatico;
    }
    auditAlert("actualizar_alerta_interna", alert, actor, "La alerta se sincronizo con la tarea.", previous);
    changed = true;
  }

  return changed;
}

function buildAlertView(alert, task = null) {
  return {
    ...normalizeAlert(alert),
    tarea: task
      ? {
          id: task.id,
          titulo: task.titulo,
          tipoTarea: task.tipoTarea,
          estadoOperativo: task.estadoOperativo,
          periodo: task.periodo,
          anio: task.anio,
          empresa: task.empresa || null,
          responsable: task.responsable || null,
          obligacionFiscal: task.obligacionFiscal || null,
          impuesto: task.impuesto || null
        }
      : null
  };
}

function auditAlert(action, alert, actor, description, previous = null) {
  const audits = getAudits();
  const organization = getOrganization();
  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: action,
      modulo: "alertas",
      recursoTipo: "alerta",
      recursoId: alert.id,
      descripcion: description,
      valorAnterior: previous ? clone(previous) : undefined,
      valorNuevo: clone(alert)
    })
  );
  saveAudits(audits);
}

function buildAlertViews(alerts, tasks) {
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  return alerts
    .map((alert) => buildAlertView(alert, taskMap.get(alert.tareaId) || null))
    .sort((left, right) => {
      return String(left.estado).localeCompare(String(right.estado)) ||
        String(left.fechaVencimiento || "").localeCompare(String(right.fechaVencimiento || "")) ||
        String(right.createdAt || "").localeCompare(String(left.createdAt || ""));
    });
}

function reconcileAndPersistAlerts(actor = "system") {
  const tasks = listTasks();
  const alerts = normalizeAndPersistAlerts();
  const reconciled = reconcileAlerts(alerts, tasks, actor);
  const activeKeys = new Set(alerts.filter((alert) => isActiveAlertStatus(alert.estado)).map(alertKey));
  const closedConditionHashes = new Set(
    alerts.filter((alert) => isClosedAlertStatus(alert.estado)).map((alert) => alert.conditionHash)
  );
  const createdAlerts = [];

  for (const task of tasks) {
    const draft = buildAlertDraft(task);
    if (!draft) {
      continue;
    }

    const nextAlert = {
      id: createId("alert"),
      tipo: draft.tipo,
      nivel: draft.nivel,
      estado: ALERT_STATUS.UNREAD,
      tareaId: task.id,
      empresaId: task.empresaId,
      responsableId: task.responsableId || "",
      fechaVencimiento: task.fechaVencimiento,
      mensaje: draft.mensaje,
      conditionHash: buildDraftConditionHash(task, draft),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creadaPor: actor
    };

    if (activeKeys.has(alertKey(nextAlert)) || closedConditionHashes.has(nextAlert.conditionHash)) {
      continue;
    }

    alerts.push(nextAlert);
    activeKeys.add(alertKey(nextAlert));
    createdAlerts.push(nextAlert);
    auditAlert("generar_alerta_interna", nextAlert, actor, `Se genero una alerta ${nextAlert.tipo} para la tarea ${task.titulo || task.id}.`);
  }

  if (createdAlerts.length > 0 || reconciled) {
    saveInternalAlerts(alerts);
  }

  return {
    alerts,
    tasks,
    createdAlerts
  };
}

export function canTransitionInternalAlert(currentStatus, nextStatus) {
  const normalizedCurrentStatus = normalizeAlertStatus(currentStatus);
  const normalizedNextStatus = normalizeAlertStatus(nextStatus);

  if (!normalizedCurrentStatus || !normalizedNextStatus) {
    return false;
  }

  if (normalizedCurrentStatus === normalizedNextStatus) {
    return true;
  }

  return (ALERT_STATUS_TRANSITIONS[normalizedCurrentStatus] || new Set()).has(normalizedNextStatus);
}

export function getInternalAlertStatusTransitions(status) {
  const normalizedStatus = normalizeAlertStatus(status);
  return Array.from(ALERT_STATUS_TRANSITIONS[normalizedStatus] || []);
}

export function generateInternalAlerts(actor = "system") {
  const { tasks, createdAlerts } = reconcileAndPersistAlerts(actor);
  return {
    createdCount: createdAlerts.length,
    items: buildAlertViews(createdAlerts, tasks)
  };
}

export function reconcileAndListInternalAlerts(filters = {}, actor = "system") {
  const { alerts, tasks } = reconcileAndPersistAlerts(actor);
  const normalizedFilters = normalizeAlertFilters(filters);

  const filteredAlerts = alerts.filter((alert) => {
    if (normalizedFilters.estado && alert.estado !== normalizedFilters.estado) return false;
    if (normalizedFilters.tipo && alert.tipo !== normalizedFilters.tipo) return false;
    if (normalizedFilters.nivel && alert.nivel !== normalizedFilters.nivel) return false;
    if (normalizedFilters.empresaId && alert.empresaId !== normalizedFilters.empresaId) return false;
    if (normalizedFilters.responsableId && alert.responsableId !== normalizedFilters.responsableId) return false;
    return true;
  });

  return buildAlertViews(filteredAlerts, tasks);
}

export function listInternalAlerts(filters = {}) {
  return reconcileAndListInternalAlerts(filters, "system");
}

export function listCurrentInternalAlerts(actor = "system") {
  return reconcileAndListInternalAlerts({}, actor);
}

export function listInternalAlertsForUser(currentUser, filters = {}, actor = "system") {
  const normalizedFilters = normalizeAlertFilters(filters);

  return reconcileAndListInternalAlerts({}, actor)
    .filter((alert) => canUserAccessAlert(currentUser, alert))
    .filter((alert) => {
      if (normalizedFilters.estado && alert.estado !== normalizedFilters.estado) return false;
      if (normalizedFilters.tipo && alert.tipo !== normalizedFilters.tipo) return false;
      if (normalizedFilters.nivel && alert.nivel !== normalizedFilters.nivel) return false;
      if (normalizedFilters.empresaId && alert.empresaId !== normalizedFilters.empresaId) return false;
      if (normalizedFilters.responsableId && alert.responsableId !== normalizedFilters.responsableId) return false;
      return true;
    });
}

export function getInternalAlertById(alertId) {
  const tasks = listTasks();
  const alert = normalizeAndPersistAlerts().find((item) => item.id === alertId);
  return alert ? buildAlertView(alert, tasks.find((task) => task.id === alert.tareaId) || null) : null;
}

export function updateInternalAlertStatus(alertId, status, actor = "system", options = {}) {
  const normalizedStatus = normalizeAlertStatus(status);
  if (![ALERT_STATUS.READ, ALERT_STATUS.ATTENDED, ALERT_STATUS.DISMISSED].includes(normalizedStatus)) {
    throw createAlertError("El estado de alerta no es valido.", 400);
  }

  const alerts = normalizeAndPersistAlerts();
  const alert = alerts.find((item) => item.id === alertId);
  if (!alert) {
    throw createAlertError("Alerta no encontrada.", 404);
  }

  if (!canTransitionInternalAlert(alert.estado, normalizedStatus)) {
    throw createAlertError("La transicion de estado de la alerta no es valida.", 400);
  }

  const previous = clone(alert);
  alert.estado = normalizedStatus;
  alert.updatedAt = new Date().toISOString();
  alert.actualizadaPor = actor;
  alert.motivoEstado = String(options.motivo || options.observaciones || "").trim();

  if (normalizedStatus === ALERT_STATUS.READ) {
    alert.leidaAt = alert.leidaAt || alert.updatedAt;
    alert.leidaPor = alert.leidaPor || actor;
  }

  if (normalizedStatus === ALERT_STATUS.ATTENDED) {
    alert.atendidaAt = alert.atendidaAt || alert.updatedAt;
    alert.atendidaPor = alert.atendidaPor || actor;
  }

  if (normalizedStatus === ALERT_STATUS.DISMISSED) {
    alert.descartadaAt = alert.descartadaAt || alert.updatedAt;
    alert.descartadaPor = alert.descartadaPor || actor;
  }

  saveInternalAlerts(alerts);

  const action =
    normalizedStatus === ALERT_STATUS.ATTENDED
      ? "atender_alerta_interna"
      : normalizedStatus === ALERT_STATUS.DISMISSED
        ? "descartar_alerta_interna"
        : "marcar_alerta_leida";
  const description =
    normalizedStatus === ALERT_STATUS.ATTENDED
      ? "Se atendio la alerta interna."
      : normalizedStatus === ALERT_STATUS.DISMISSED
        ? "Se descarto la alerta interna."
        : "Se marco la alerta interna como leida.";
  auditAlert(action, alert, actor, description, previous);

  return listCurrentInternalAlerts("system").find((item) => item.id === alert.id) || buildAlertView(alert, null);
}
