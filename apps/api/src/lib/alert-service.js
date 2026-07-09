import { createAuditEntry } from "../../../../packages/domain/index.js";
import {
  getAudits,
  getInternalAlerts,
  getOrganization,
  saveAudits,
  saveInternalAlerts
} from "./storage.js";
import { listTasks } from "./task-service.js";

const ALERT_TYPES = Object.freeze({
  UPCOMING: "proxima_vencer",
  OVERDUE: "vencida"
});

const ALERT_STATUS = Object.freeze({
  UNREAD: "no_leida",
  READ: "leida",
  ATTENDED: "atendida"
});

const CLOSED_TASK_STATUSES = new Set(["presentada", "completada", "cancelada", "no_aplica"]);

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

function alertKey(alert) {
  return `${alert.tareaId}:${alert.tipo}`;
}

function normalizeAlert(alert = {}) {
  return {
    ...alert,
    estado: alert.estado || ALERT_STATUS.UNREAD,
    nivel: alert.nivel || "informativa",
    tipo: alert.tipo || ALERT_TYPES.UPCOMING,
    tareaId: alert.tareaId || alert.taskId || "",
    empresaId: alert.empresaId || "",
    responsableId: alert.responsableId || "",
    fechaVencimiento: alert.fechaVencimiento || "",
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

function reconcileAlerts(alerts, tasks, actor) {
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  let changed = false;

  for (const alert of alerts) {
    const task = taskMap.get(alert.tareaId);
    const draft = task ? buildAlertDraft(task) : null;
    const isActive = alert.estado !== ALERT_STATUS.ATTENDED;

    if (!draft && isActive) {
      const previous = closeAlert(alert, actor, "La tarea ya no requiere una alerta activa.");
      auditAlert("cerrar_alerta_automatica", alert, actor, "La alerta se cerro automaticamente.", previous);
      changed = true;
      continue;
    }

    if (!draft) {
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
      alert.responsableId !== (task.responsableId || "");

    if (!requiresUpdate) {
      continue;
    }

    const previous = clone(alert);
    alert.tipo = nextType;
    alert.nivel = nextLevel;
    alert.mensaje = nextMessage;
    alert.fechaVencimiento = task.fechaVencimiento;
    alert.responsableId = task.responsableId || "";
    alert.updatedAt = new Date().toISOString();
    alert.actualizadaPor = actor;
    delete alert.motivoCierreAutomatico;
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

export function generateInternalAlerts(actor = "system") {
  const tasks = listTasks();
  const alerts = normalizeAndPersistAlerts();
  const reconciled = reconcileAlerts(alerts, tasks, actor);
  const existingKeys = new Set(alerts.map(alertKey));
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creadaPor: actor
    };

    if (existingKeys.has(alertKey(nextAlert))) {
      continue;
    }

    alerts.push(nextAlert);
    existingKeys.add(alertKey(nextAlert));
    createdAlerts.push(nextAlert);
    auditAlert("generar_alerta_interna", nextAlert, actor, `Se genero una alerta ${nextAlert.tipo} para la tarea ${task.titulo || task.id}.`);
  }

  if (createdAlerts.length > 0 || reconciled) {
    saveInternalAlerts(alerts);
  }

  return {
    createdCount: createdAlerts.length,
    items: createdAlerts.map((alert) => buildAlertView(alert, tasks.find((task) => task.id === alert.tareaId)))
  };
}

export function listInternalAlerts(filters = {}) {
  generateInternalAlerts("system");
  const tasks = listTasks();
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const status = String(filters.estado || "").trim();
  const type = String(filters.tipo || "").trim();
  const level = String(filters.nivel || "").trim();

  return normalizeAndPersistAlerts()
    .filter((alert) => {
      if (status && alert.estado !== status) return false;
      if (type && alert.tipo !== type) return false;
      if (level && alert.nivel !== level) return false;
      return true;
    })
    .map((alert) => buildAlertView(alert, taskMap.get(alert.tareaId) || null))
    .sort((left, right) => {
      return String(left.estado).localeCompare(String(right.estado)) ||
        String(left.fechaVencimiento || "").localeCompare(String(right.fechaVencimiento || "")) ||
        String(right.createdAt || "").localeCompare(String(left.createdAt || ""));
    });
}

export function getInternalAlertById(alertId) {
  const tasks = listTasks();
  const alert = normalizeAndPersistAlerts().find((item) => item.id === alertId);
  return alert ? buildAlertView(alert, tasks.find((task) => task.id === alert.tareaId) || null) : null;
}

export function updateInternalAlertStatus(alertId, status, actor = "system") {
  const normalizedStatus = String(status || "").trim();
  if (![ALERT_STATUS.READ, ALERT_STATUS.ATTENDED].includes(normalizedStatus)) {
    throw createAlertError("El estado de alerta no es valido.", 400);
  }

  const alerts = normalizeAndPersistAlerts();
  const alert = alerts.find((item) => item.id === alertId);
  if (!alert) {
    throw createAlertError("Alerta no encontrada.", 404);
  }

  const previous = clone(alert);
  alert.estado = normalizedStatus;
  alert.updatedAt = new Date().toISOString();
  alert.actualizadaPor = actor;

  if (normalizedStatus === ALERT_STATUS.READ) {
    alert.leidaAt = alert.leidaAt || alert.updatedAt;
    alert.leidaPor = alert.leidaPor || actor;
  }

  if (normalizedStatus === ALERT_STATUS.ATTENDED) {
    alert.atendidaAt = alert.atendidaAt || alert.updatedAt;
    alert.atendidaPor = alert.atendidaPor || actor;
  }

  saveInternalAlerts(alerts);
  auditAlert(
    normalizedStatus === ALERT_STATUS.ATTENDED ? "atender_alerta_interna" : "marcar_alerta_leida",
    alert,
    actor,
    normalizedStatus === ALERT_STATUS.ATTENDED ? "Se atendio la alerta interna." : "Se marco la alerta interna como leida.",
    previous
  );

  const task = listTasks().find((item) => item.id === alert.tareaId) || null;
  return buildAlertView(alert, task);
}
