import {
  COMPANY_STATUS,
  canAccessCompany,
  createAuditEntry,
  getCompanyEffectiveTaxProfile,
  hasPermission,
  NON_OPERATIONAL_COMPANY_STATUSES
} from "../../../../packages/domain/index.js";
import {
  getAudits,
  getCompanies,
  getCompanyObligations,
  getFiscalCalendars,
  getFiscalCalendarVersions,
  getFiscalTasks,
  getOrganization,
  getTaxes,
  getUsers,
  saveAudits,
  saveFiscalCalendars,
  saveFiscalCalendarVersions,
  saveFiscalTasks
} from "./storage.js";
import { buildTaskView as buildUnifiedTaskView, getTaskById, listCompanyTasks, listTasks } from "./task-service.js";

export const FISCAL_CALENDAR_STATUS = Object.freeze({
  DRAFT: "borrador",
  VALIDATED: "validado",
  ACTIVE: "activo",
  REPLACED: "reemplazado",
  CANCELED: "anulado"
});

export const FISCAL_TASK_GENERAL_STATUS = Object.freeze({
  PENDING: "pendiente",
  IN_PROGRESS: "en_proceso",
  PRESENTED: "presentada",
  OVERDUE: "vencida",
  COMPLETED: "completada",
  CANCELED: "cancelada",
  NOT_APPLICABLE: "no_aplica"
});

const CLOSED_TASK_STATUSES = new Set([
  FISCAL_TASK_GENERAL_STATUS.PRESENTED,
  FISCAL_TASK_GENERAL_STATUS.COMPLETED,
  FISCAL_TASK_GENERAL_STATUS.CANCELED,
  FISCAL_TASK_GENERAL_STATUS.NOT_APPLICABLE
]);

const CALENDAR_PERIODICITIES = new Set([
  "semanal",
  "mensual",
  "bimestral",
  "trimestral",
  "cuatrimestral",
  "semestral",
  "anual",
  "ocasional",
  "unica_vez",
  "personalizada"
]);

const CALENDAR_LEVELS = new Set(["nacional", "departamental", "municipal", "contable", "comercial"]);
const CALENDAR_SOURCE_TYPES = new Set(["manual", "DIAN", "municipio", "importado_excel", "otro", "semilla_local"]);
const CALENDAR_DUE_CRITERIA = new Set([
  "fijo",
  "ultimo_digito_nit",
  "dos_ultimos_digitos_nit",
  "digito_verificacion",
  "independiente_nit",
  "personalizado"
]);
const CALENDAR_PAYMENT_TYPES = new Set([
  "declaracion_y_pago",
  "solo_declaracion",
  "solo_pago",
  "anticipo",
  "cuota"
]);

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createFiscalError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeMatchValue(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .toLowerCase()
    .trim();
}

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function subtractCalendarDays(dateValue, days) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getLastNitDigit(nit) {
  const normalized = String(nit || "").replace(/\D/g, "");
  return normalized ? normalized.at(-1) : "";
}

function getLastTwoNitDigits(nit) {
  const normalized = String(nit || "").replace(/\D/g, "");
  return normalized.length >= 2 ? normalized.slice(-2) : normalized;
}

function normalizeNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  return normalized || "";
}

function normalizeFiscalEventKey(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeFiscalCalendarRecord(calendar = {}) {
  const municipioCiudad = normalizeText(calendar.municipioCiudad || calendar.municipio);
  return {
    ...calendar,
    impuestoId: normalizeText(calendar.impuestoId),
    anio: Number(calendar.anio),
    periodo: normalizeText(calendar.periodo),
    periodicidad: normalizeText(calendar.periodicidad),
    nivel: normalizeText(calendar.nivel),
    pais: normalizeText(calendar.pais || "COLOMBIA"),
    departamento: normalizeNullableText(calendar.departamento),
    municipioCiudad,
    municipio: municipioCiudad,
    criterioVencimiento: normalizeText(calendar.criterioVencimiento || "independiente_nit"),
    ultimoDigitoNit: normalizeNullableText(calendar.ultimoDigitoNit),
    rangoUltimosDigitosNit: normalizeNullableText(calendar.rangoUltimosDigitosNit),
    digitoVerificacion: normalizeNullableText(calendar.digitoVerificacion),
    tipoContribuyente: normalizeNullableText(calendar.tipoContribuyente),
    regimen: normalizeNullableText(calendar.regimen),
    eventoFiscalClave: normalizeFiscalEventKey(calendar.eventoFiscalClave),
    eventoFiscal: normalizeNullableText(calendar.eventoFiscal),
    fechaInicioPeriodo: normalizeDate(calendar.fechaInicioPeriodo),
    fechaFinPeriodo: normalizeDate(calendar.fechaFinPeriodo),
    fechaVencimiento: normalizeDate(calendar.fechaVencimiento),
    fuenteCalendario: normalizeText(calendar.fuenteCalendario || "manual"),
    version: Number(calendar.version || 1),
    estado: normalizeText(calendar.estado || FISCAL_CALENDAR_STATUS.DRAFT),
    numeroCuota: normalizeNumber(calendar.numeroCuota),
    nombreCuota: normalizeNullableText(calendar.nombreCuota),
    tipoPago: normalizeText(calendar.tipoPago || "declaracion_y_pago"),
    requiereDeclaracion:
      calendar.requiereDeclaracion === undefined ? true : Boolean(calendar.requiereDeclaracion),
    requierePago: calendar.requierePago === undefined ? true : Boolean(calendar.requierePago),
    createdAt: calendar.createdAt,
    updatedAt: calendar.updatedAt,
    creadoPor: calendar.creadoPor,
    actualizadoPor: calendar.actualizadoPor
  };
}

function parseNitRange(value) {
  const raw = normalizeText(value);
  if (!raw) {
    return null;
  }

  const match = raw.match(/^(\d{1,2})\s*[-/]\s*(\d{1,2})$/);
  if (!match) {
    return null;
  }

  const start = Number(match[1]);
  const end = Number(match[2]);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }

  return { start, end, wraps: end < start };
}

function matchesWrappedNitRange(range, numericLastTwo) {
  if (!range) {
    return false;
  }

  if (!range.wraps) {
    return numericLastTwo >= range.start && numericLastTwo <= range.end;
  }

  return numericLastTwo >= range.start || numericLastTwo <= range.end;
}

function buildCalendarBusinessKey(calendar) {
  return [
    calendar.impuestoId,
    calendar.anio,
    calendar.periodo,
    calendar.periodicidad,
    calendar.nivel,
    normalizeMatchValue(calendar.departamento),
    normalizeMatchValue(calendar.municipioCiudad || calendar.municipio),
    calendar.criterioVencimiento,
    calendar.ultimoDigitoNit,
    calendar.rangoUltimosDigitosNit,
    calendar.digitoVerificacion,
    normalizeMatchValue(calendar.tipoContribuyente),
    normalizeMatchValue(calendar.regimen),
    normalizeFiscalEventKey(calendar.eventoFiscalClave),
    calendar.numeroCuota ?? "",
    normalizeMatchValue(calendar.nombreCuota),
    calendar.tipoPago
  ].join("|");
}

function dedupeCalendarsByBusinessKey(calendars) {
  const map = new Map();

  for (const calendar of calendars) {
    const key = buildCalendarBusinessKey(calendar);
    const existing = map.get(key);
    if (!existing || Number(calendar.version || 1) > Number(existing.version || 1)) {
      map.set(key, calendar);
    }
  }

  return Array.from(map.values());
}

function calculateCalendarSpecificity(calendar) {
  let score = 0;

  if (calendar.tipoContribuyente) score += 4;
  if (calendar.regimen) score += 3;
  if (calendar.departamento) score += 2;
  if (calendar.municipioCiudad || calendar.municipio) score += 3;
  if (calendar.ultimoDigitoNit) score += 4;
  if (calendar.rangoUltimosDigitosNit) score += 5;
  if (calendar.digitoVerificacion) score += 4;
  if (calendar.numeroCuota !== null && calendar.numeroCuota !== undefined && calendar.numeroCuota !== "") score += 2;
  if (calendar.nombreCuota) score += 1;
  if (calendar.tipoPago && calendar.tipoPago !== "declaracion_y_pago") score += 1;

  return score;
}

function selectBestMatchingCalendars(calendars) {
  if (calendars.length <= 1) {
    return calendars;
  }

  const deduped = dedupeCalendarsByBusinessKey(calendars);
  if (deduped.length <= 1) {
    return deduped;
  }

  const ranked = deduped
    .map((calendar) => ({ calendar, score: calculateCalendarSpecificity(calendar) }))
    .sort((left, right) => right.score - left.score);

  const bestScore = ranked[0]?.score ?? 0;
  return ranked.filter((item) => item.score === bestScore).map((item) => item.calendar);
}

function hasProtectedCalendarChanges(currentCalendar, nextCalendar) {
  const fields = [
    "impuestoId",
    "anio",
    "periodo",
    "periodicidad",
    "nivel",
    "departamento",
    "municipioCiudad",
    "criterioVencimiento",
    "ultimoDigitoNit",
    "rangoUltimosDigitosNit",
    "digitoVerificacion",
    "tipoContribuyente",
    "regimen",
    "fechaInicioPeriodo",
    "fechaFinPeriodo",
    "fechaVencimiento",
    "numeroCuota",
    "nombreCuota",
    "tipoPago",
    "requiereDeclaracion",
    "requierePago"
  ];

  return fields.some((field) => String(currentCalendar[field] ?? "") !== String(nextCalendar[field] ?? ""));
}

function buildCalendarView(calendar, taxes) {
  const normalized = normalizeFiscalCalendarRecord(calendar);
  return {
    ...normalized,
    impuesto: taxes.find((item) => item.id === normalized.impuestoId) || null
  };
}

function buildTaskView(task, taxes) {
  return {
    ...task,
    impuesto: taxes.find((item) => item.id === task.impuestoId) || null
  };
}

function auditAndSave(audits, entry) {
  audits.push(entry);
  saveAudits(audits);
}

function normalizeCalendarPayload(payload = {}) {
  return normalizeFiscalCalendarRecord({
    impuestoId: normalizeText(payload.impuestoId),
    anio: Number(payload.anio),
    periodo: normalizeText(payload.periodo),
    periodicidad: normalizeText(payload.periodicidad),
    nivel: normalizeText(payload.nivel),
    pais: normalizeText(payload.pais || "COLOMBIA"),
    departamento: normalizeText(payload.departamento),
    municipioCiudad: normalizeText(payload.municipioCiudad || payload.municipio),
    municipio: normalizeText(payload.municipioCiudad || payload.municipio),
    criterioVencimiento: normalizeText(payload.criterioVencimiento || "independiente_nit"),
    ultimoDigitoNit: normalizeText(payload.ultimoDigitoNit),
    rangoUltimosDigitosNit: normalizeText(payload.rangoUltimosDigitosNit),
    digitoVerificacion: normalizeText(payload.digitoVerificacion),
    tipoContribuyente: normalizeText(payload.tipoContribuyente),
    regimen: normalizeText(payload.regimen),
    eventoFiscalClave: normalizeFiscalEventKey(payload.eventoFiscalClave),
    eventoFiscal: normalizeText(payload.eventoFiscal),
    numeroCuota: payload.numeroCuota,
    nombreCuota: normalizeText(payload.nombreCuota),
    tipoPago: normalizeText(payload.tipoPago || "declaracion_y_pago"),
    requiereDeclaracion:
      payload.requiereDeclaracion === undefined ? true : payload.requiereDeclaracion === true || payload.requiereDeclaracion === "true",
    requierePago:
      payload.requierePago === undefined ? true : payload.requierePago === true || payload.requierePago === "true",
    fechaInicioPeriodo: normalizeDate(payload.fechaInicioPeriodo),
    fechaFinPeriodo: normalizeDate(payload.fechaFinPeriodo),
    fechaVencimiento: normalizeDate(payload.fechaVencimiento),
    fuenteCalendario: normalizeText(payload.fuenteCalendario || "manual"),
    version: Number(payload.version || 1),
    estado: normalizeText(payload.estado || FISCAL_CALENDAR_STATUS.DRAFT)
  });
}

function validateCalendarPayload(payload, taxes) {
  const errors = [];
  const tax = taxes.find((item) => item.id === payload.impuestoId);

  if (!payload.impuestoId || !tax) {
    errors.push("El impuesto es obligatorio y debe existir.");
  }

  if (!Number.isInteger(payload.anio) || payload.anio < 2000) {
    errors.push("El anio es obligatorio.");
  }

  if (!payload.periodo) {
    errors.push("El periodo es obligatorio.");
  }

  if (!payload.periodicidad || !CALENDAR_PERIODICITIES.has(payload.periodicidad)) {
    errors.push("La periodicidad es obligatoria.");
  }

  if (!payload.nivel || !CALENDAR_LEVELS.has(payload.nivel)) {
    errors.push("El nivel es obligatorio.");
  }

  if (!payload.fechaVencimiento) {
    errors.push("La fecha de vencimiento es obligatoria.");
  }

  if (!payload.criterioVencimiento || !CALENDAR_DUE_CRITERIA.has(payload.criterioVencimiento)) {
    errors.push("El criterio de vencimiento es obligatorio.");
  }

  if (!payload.fuenteCalendario || !CALENDAR_SOURCE_TYPES.has(payload.fuenteCalendario)) {
    errors.push("La fuente del calendario es obligatoria.");
  }

  if (!payload.tipoPago || !CALENDAR_PAYMENT_TYPES.has(payload.tipoPago)) {
    errors.push("El tipo de pago es obligatorio.");
  }

  if ((payload.nivel === "municipal" || tax?.requiereMunicipio) && !payload.municipioCiudad) {
    errors.push("Municipio / Ciudad es obligatorio para calendarios municipales.");
  }

  if ((payload.nivel === "departamental" || tax?.requiereDepartamento) && !payload.departamento) {
    errors.push("El departamento es obligatorio para calendarios departamentales.");
  }

  if (payload.criterioVencimiento === "ultimo_digito_nit" && !payload.ultimoDigitoNit) {
    errors.push("El ultimo digito del NIT es obligatorio para este criterio.");
  }

  if (payload.criterioVencimiento === "dos_ultimos_digitos_nit" && !payload.rangoUltimosDigitosNit) {
    errors.push("El rango de ultimos digitos del NIT es obligatorio para este criterio.");
  }

  if (payload.criterioVencimiento === "digito_verificacion" && !payload.digitoVerificacion) {
    errors.push("El digito de verificacion es obligatorio para este criterio.");
  }

  if (errors.length > 0) {
    throw createFiscalError(errors.join(" "), 400);
  }
}

function createCalendarVersionRecord({
  calendarId,
  version,
  actor,
  estadoAnterior,
  estadoNuevo,
  motivoCambio,
  snapshotAnterior,
  snapshotNuevo
}) {
  return {
    id: createId("fcv"),
    calendarioFiscalId: calendarId,
    version,
    motivoCambio,
    fechaCambio: new Date().toISOString(),
    cambiadoPor: actor,
    estadoAnterior,
    estadoNuevo,
    snapshotAnterior: clone(snapshotAnterior),
    snapshotNuevo: clone(snapshotNuevo)
  };
}

function createTaskKey(task) {
  return [
    task.empresaId,
    task.obligacionFiscalEmpresaId,
    task.calendarioFiscalId,
    task.periodo,
    String(task.anio),
    String(task.cumplimientoFiscal || "general")
  ].join("|");
}

function normalizeFiscalMilestone(value) {
  const normalized = normalizeText(value);
  return normalized || "general";
}

function normalizeComparableLabel(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(de|del|la|el)\b/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function buildFiscalTaskTitle(variant, obligation, calendar) {
  const eventLabel = obligation.eventoFiscal || calendar.eventoFiscal || "";
  const normalizedEvent = normalizeComparableLabel(eventLabel);
  const normalizedCuota = normalizeComparableLabel(calendar.nombreCuota);
  const cuotaLooksDuplicated =
    normalizedEvent &&
    normalizedCuota &&
    (normalizedEvent === normalizedCuota ||
      normalizedEvent.includes(normalizedCuota) ||
      normalizedCuota.includes(normalizedEvent));
  const cuotaLabel = cuotaLooksDuplicated ? "" : calendar.nombreCuota || "";
  return [
    variant.tituloPrefijo,
    obligation.nombreObligacion,
    eventLabel,
    cuotaLabel,
    `${calendar.periodo} ${calendar.anio}`
  ]
    .filter(Boolean)
    .join(" - ");
}

function taskMilestonesFromPaymentType(tipoPago, requiereDeclaracion = true, requierePago = true) {
  const normalizedTipoPago = normalizeText(tipoPago || "declaracion_y_pago");

  if (normalizedTipoPago === "solo_declaracion") {
    return ["declaracion"];
  }

  if (["solo_pago", "anticipo", "cuota"].includes(normalizedTipoPago)) {
    return ["pago"];
  }

  const milestones = [];
  if (requiereDeclaracion !== false) {
    milestones.push("declaracion");
  }
  if (requierePago !== false) {
    milestones.push("pago");
  }

  return milestones.length ? milestones : ["general"];
}

function existingTaskKeys(task) {
  const baseTask = {
    empresaId: task.empresaId,
    obligacionFiscalEmpresaId: task.obligacionFiscalEmpresaId,
    calendarioFiscalId: task.calendarioFiscalId,
    periodo: task.periodo,
    anio: task.anio
  };
  const keys = new Set();
  const explicitMilestone = normalizeFiscalMilestone(task.cumplimientoFiscal);
  keys.add(createTaskKey({ ...baseTask, cumplimientoFiscal: explicitMilestone }));

  if (!task.cumplimientoFiscal && task.tipoTarea === "fiscal") {
    const milestones = taskMilestonesFromPaymentType(
      task.tipoPago,
      task.estadoPresentacion !== "no_aplica",
      task.estadoPago !== "no_aplica"
    );
    for (const milestone of milestones) {
      keys.add(createTaskKey({ ...baseTask, cumplimientoFiscal: milestone }));
    }
  }

  return Array.from(keys);
}

function buildFiscalTaskVariants(calendar) {
  return taskMilestonesFromPaymentType(
    calendar.tipoPago,
    calendar.requiereDeclaracion,
    calendar.requierePago
  ).map((milestone) => ({
    cumplimientoFiscal: milestone,
    tituloPrefijo:
      milestone === "declaracion"
        ? "Declaracion"
        : milestone === "pago"
          ? "Pago"
          : "Cumplimiento",
    descripcion:
      milestone === "declaracion"
        ? "Preparar, revisar y presentar la declaracion correspondiente."
        : milestone === "pago"
          ? "Gestionar y confirmar el pago correspondiente."
          : "Gestionar el cumplimiento fiscal correspondiente."
  }));
}

function syncTaskFieldsWithCalendar(task, calendar, obligation, actor) {
  const variant = buildFiscalTaskVariants(calendar).find(
    (item) => normalizeFiscalMilestone(item.cumplimientoFiscal) === normalizeFiscalMilestone(task.cumplimientoFiscal)
  );

  task.calendarioFiscalId = calendar.id;
  task.versionCalendario = calendar.version;
  task.periodo = calendar.periodo;
  task.anio = calendar.anio;
  task.fechaInicioPeriodo = calendar.fechaInicioPeriodo;
  task.fechaFinPeriodo = calendar.fechaFinPeriodo;
  task.fechaVencimiento = calendar.fechaVencimiento;
  task.fechaLimiteInterna = subtractCalendarDays(calendar.fechaVencimiento, 3);
  task.nombreCuota = calendar.nombreCuota || "";
  task.numeroCuota = calendar.numeroCuota ?? null;
  task.tipoPago = calendar.tipoPago || "declaracion_y_pago";
  task.eventoFiscalClave = normalizeFiscalEventKey(obligation.eventoFiscalClave || calendar.eventoFiscalClave);
  task.eventoFiscal = obligation.eventoFiscal || calendar.eventoFiscal || "";
  task.titulo = buildFiscalTaskTitle(
    variant || {
      cumplimientoFiscal: normalizeFiscalMilestone(task.cumplimientoFiscal),
      tituloPrefijo:
        normalizeFiscalMilestone(task.cumplimientoFiscal) === "declaracion"
          ? "Declaracion"
          : normalizeFiscalMilestone(task.cumplimientoFiscal) === "pago"
            ? "Pago"
            : "Cumplimiento",
      descripcion: "Gestionar el cumplimiento fiscal correspondiente."
    },
    obligation,
    calendar
  );
  task.descripcion = `Tarea fiscal generada desde la obligacion ${obligation.nombreObligacion}${obligation.eventoFiscal ? ` (${obligation.eventoFiscal})` : ""}.${variant ? ` ${variant.descripcion}` : ""}`.trim();

  if (taskStatus(task) === FISCAL_TASK_GENERAL_STATUS.OVERDUE && calendar.fechaVencimiento >= today()) {
    const reopenedStatus = reopenTaskStatus(task);
    task.estadoOperativo = reopenedStatus;
    task.estadoGeneral = reopenedStatus;
    delete task.closedAt;
    delete task.closedBy;
  }

  task.updatedAt = new Date().toISOString();
  task.actualizadoPor = actor;
}

function markTaskAsNotApplicable(task, actor) {
  task.estadoOperativo = FISCAL_TASK_GENERAL_STATUS.NOT_APPLICABLE;
  task.estadoGeneral = FISCAL_TASK_GENERAL_STATUS.NOT_APPLICABLE;
  task.estadoPresentacion = "no_aplica";
  task.estadoPago = "no_aplica";
  task.updatedAt = new Date().toISOString();
  task.actualizadoPor = actor;
  task.closedAt = task.closedAt || task.updatedAt;
  task.closedBy = task.closedBy || actor;
}

function synchronizeTasksForCalendarReplacement(previousCalendar, nextCalendar, actor = "usr_admin") {
  const tasks = getFiscalTasks();
  const obligations = getCompanyObligations();
  const organization = getOrganization();
  const audits = getAudits();
  const nextVariants = new Set(
    buildFiscalTaskVariants(nextCalendar).map((variant) => normalizeFiscalMilestone(variant.cumplimientoFiscal))
  );
  let reprogrammedCount = 0;
  let closedCount = 0;
  let changed = false;

  for (const task of tasks) {
    if (task.tipoTarea !== "fiscal" || task.calendarioFiscalId !== previousCalendar.id || isTaskClosed(task)) {
      continue;
    }

    const obligation = obligations.find((item) => item.id === task.obligacionFiscalEmpresaId);
    if (!obligation || !isObligationActive(obligation)) {
      continue;
    }

    const previous = clone(task);
    const milestone = normalizeFiscalMilestone(task.cumplimientoFiscal);

    if (nextVariants.has(milestone)) {
      syncTaskFieldsWithCalendar(task, nextCalendar, obligation, actor);
      audits.push(
        createAuditEntry({
          organizacionId: organization.id,
          usuarioId: actor,
          accion: "reprogramar_tarea_fiscal_por_reemplazo_calendario",
          modulo: "calendario_fiscal",
          recursoTipo: "tarea_fiscal",
          recursoId: task.id,
          descripcion: `Se reprogramo una tarea fiscal por reemplazo del calendario ${previousCalendar.id}.`,
          valorAnterior: previous,
          valorNuevo: clone(task)
        })
      );
      reprogrammedCount += 1;
      changed = true;
      continue;
    }

    markTaskAsNotApplicable(task, actor);
    audits.push(
      createAuditEntry({
        organizacionId: organization.id,
        usuarioId: actor,
        accion: "cerrar_tarea_fiscal_por_reemplazo_calendario",
        modulo: "calendario_fiscal",
        recursoTipo: "tarea_fiscal",
        recursoId: task.id,
        descripcion: `La tarea fiscal dejo de aplicar despues del reemplazo del calendario ${previousCalendar.id}.`,
        valorAnterior: previous,
        valorNuevo: clone(task)
      })
    );
    closedCount += 1;
    changed = true;
  }

  if (changed) {
    saveFiscalTasks(tasks);
    saveAudits(audits);
  }

  return {
    reprogrammedCount,
    closedCount
  };
}

function isObligationActive(obligation) {
  return normalizeText(obligation?.estado) === "activa";
}

function taskStatus(task) {
  return normalizeText(task?.estadoOperativo || task?.estadoGeneral || FISCAL_TASK_GENERAL_STATUS.PENDING);
}

function isTaskClosed(task) {
  return CLOSED_TASK_STATUSES.has(taskStatus(task));
}

function reopenTaskStatus(task) {
  const workflowStage = normalizeText(task?.etapaGestion);
  if (["en_preparacion", "preparada", "en_revision", "aprobada", "pagada"].includes(workflowStage)) {
    return FISCAL_TASK_GENERAL_STATUS.IN_PROGRESS;
  }

  return FISCAL_TASK_GENERAL_STATUS.PENDING;
}

function isCompanyTaskBlocked(company) {
  return NON_OPERATIONAL_COMPANY_STATUSES.has(company.estadoEmpresa) || company.estadoEmpresa !== COMPANY_STATUS.ACTIVE;
}

function canUserOwnFiscalTasks(user, companyId) {
  if (!user || String(user.estado || "activo").trim() !== "activo") {
    return false;
  }

  if (!canAccessCompany(user, companyId)) {
    return false;
  }

  return hasPermission(user, "ver_tareas_empresa");
}

function getCompanyDefaultResponsible(companyId, preferredResponsibleId = "") {
  const users = getUsers().filter((user) => canUserOwnFiscalTasks(user, companyId));
  if (users.length === 0) {
    return "";
  }

  if (preferredResponsibleId) {
    const preferred = users.find((user) => user.id === preferredResponsibleId);
    if (preferred) {
      return preferred.id;
    }
  }

  const rolePriority = ["supervisor", "operativo_medio", "operativo_basico", "gerente", "administrador"];
  const sorted = users.sort((left, right) => {
    const leftScore = rolePriority.findIndex((role) => left.roles?.includes(role));
    const rightScore = rolePriority.findIndex((role) => right.roles?.includes(role));
    const normalizedLeft = leftScore === -1 ? Number.MAX_SAFE_INTEGER : leftScore;
    const normalizedRight = rightScore === -1 ? Number.MAX_SAFE_INTEGER : rightScore;

    if (normalizedLeft !== normalizedRight) {
      return normalizedLeft - normalizedRight;
    }

    return String(left.nombreCompleto || left.nombre || "").localeCompare(
      String(right.nombreCompleto || right.nombre || ""),
      "es"
    );
  });

  return sorted[0]?.id || "";
}

function matchesCalendarToCompany(calendar, company, profile, obligation) {
  const obligationPeriodicity = normalizeText(obligation.periodicidadAplicable || obligation.periodicidad);

  if (calendar.impuestoId !== obligation.impuestoId) {
    return false;
  }

  if (normalizeText(calendar.estado) !== FISCAL_CALENDAR_STATUS.ACTIVE) {
    return false;
  }

  if (obligationPeriodicity && obligationPeriodicity !== "pendiente_revision" && normalizeText(calendar.periodicidad) !== obligationPeriodicity) {
    return false;
  }

  if (calendar.nivel === "departamental") {
    const calendarDepartamento = normalizeMatchValue(calendar.departamento);
    const obligationDepartamento = normalizeMatchValue(
      obligation.departamentoAplicacion || profile.departamento || company.departamento
    );

    if (!calendarDepartamento || calendarDepartamento !== obligationDepartamento) {
      return false;
    }
  }

  if (calendar.nivel === "municipal") {
    const calendarMunicipio = normalizeMatchValue(calendar.municipioCiudad || calendar.municipio);
    const obligationMunicipio = normalizeMatchValue(obligation.municipioAplicacion || profile.municipio || company.municipio);
    const calendarDepartamento = normalizeMatchValue(calendar.departamento);
    const obligationDepartamento = normalizeMatchValue(
      obligation.departamentoAplicacion || profile.departamento || company.departamento
    );

    if (!calendarMunicipio || calendarMunicipio !== obligationMunicipio) {
      return false;
    }

    if (calendarDepartamento && calendarDepartamento !== obligationDepartamento) {
      return false;
    }
  }

  if (calendar.tipoContribuyente && normalizeMatchValue(calendar.tipoContribuyente) !== normalizeMatchValue(profile.tipoContribuyente)) {
    return false;
  }

  if (calendar.regimen && normalizeMatchValue(calendar.regimen) !== normalizeMatchValue(profile.regimenTributario)) {
    return false;
  }

  if (normalizeFiscalEventKey(calendar.eventoFiscalClave) || normalizeFiscalEventKey(obligation.eventoFiscalClave)) {
    if (normalizeFiscalEventKey(calendar.eventoFiscalClave) !== normalizeFiscalEventKey(obligation.eventoFiscalClave)) {
      return false;
    }
  }

  const lastDigit = getLastNitDigit(profile.nit || company.nit);
  const lastTwoDigits = getLastTwoNitDigits(profile.nit || company.nit);
  const dv = String(profile.dv || company.dv || "");

  if (calendar.criterioVencimiento === "ultimo_digito_nit" && calendar.ultimoDigitoNit && calendar.ultimoDigitoNit !== lastDigit) {
    return false;
  }

  if (calendar.criterioVencimiento === "dos_ultimos_digitos_nit") {
    const range = parseNitRange(calendar.rangoUltimosDigitosNit);
    const numericLastTwo = Number(lastTwoDigits);

    if (!range || Number.isNaN(numericLastTwo) || !matchesWrappedNitRange(range, numericLastTwo)) {
      return false;
    }
  }

  if (calendar.criterioVencimiento === "digito_verificacion" && calendar.digitoVerificacion && calendar.digitoVerificacion !== dv) {
    return false;
  }

  if (calendar.criterioVencimiento === "independiente_nit" || calendar.criterioVencimiento === "fijo") {
    return true;
  }

  if (!calendar.criterioVencimiento && calendar.ultimoDigitoNit && calendar.ultimoDigitoNit !== lastDigit) {
    return false;
  }

  if (!calendar.criterioVencimiento && calendar.digitoVerificacion && calendar.digitoVerificacion !== dv) {
    return false;
  }

  return true;
}

export function listFiscalCalendars() {
  const taxes = getTaxes();
  return getFiscalCalendars()
    .map((calendar) => buildCalendarView(calendar, taxes))
    .sort((a, b) => String(b.anio).localeCompare(String(a.anio)) || b.createdAt.localeCompare(a.createdAt));
}

export function getFiscalCalendarById(calendarId) {
  const taxes = getTaxes();
  const calendar = getFiscalCalendars().find((item) => item.id === calendarId);
  return calendar ? buildCalendarView(calendar, taxes) : null;
}

export function createFiscalCalendar(payload, actor = "usr_admin") {
  const taxes = getTaxes();
  const organization = getOrganization();
  const audits = getAudits();
  const calendars = getFiscalCalendars();
  const normalized = normalizeCalendarPayload(payload);
  validateCalendarPayload(normalized, taxes);

  const now = new Date().toISOString();
  const calendar = {
    id: createId("fcal"),
    ...normalized,
    createdAt: now,
    updatedAt: now,
    creadoPor: actor,
    actualizadoPor: actor
  };

  calendars.push(calendar);
  saveFiscalCalendars(calendars);

  auditAndSave(
    audits,
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "crear_calendario_fiscal",
      modulo: "calendario_fiscal",
      recursoTipo: "calendario_fiscal",
      recursoId: calendar.id,
      descripcion: `Se creo el calendario fiscal ${calendar.periodo} ${calendar.anio}.`,
      valorNuevo: {
        impuestoId: calendar.impuestoId,
        estado: calendar.estado,
        version: calendar.version
      }
    })
  );

  return getFiscalCalendarById(calendar.id);
}

export function updateFiscalCalendar(calendarId, payload, actor = "usr_admin") {
  const taxes = getTaxes();
  const calendars = getFiscalCalendars();
  const calendar = calendars.find((item) => item.id === calendarId);

  if (!calendar) {
    throw createFiscalError("Calendario fiscal no encontrado.", 404);
  }

  const previous = clone(calendar);
  const next = {
    ...calendar,
    ...normalizeCalendarPayload({
      ...calendar,
      ...payload,
      version: calendar.version
    }),
    id: calendar.id,
    createdAt: calendar.createdAt,
    creadoPor: calendar.creadoPor,
    updatedAt: new Date().toISOString(),
    actualizadoPor: actor
  };

  validateCalendarPayload(next, taxes);

  if (
    normalizeText(calendar.estado) === FISCAL_CALENDAR_STATUS.ACTIVE &&
    hasProtectedCalendarChanges(normalizeFiscalCalendarRecord(previous), normalizeFiscalCalendarRecord(next))
  ) {
    throw createFiscalError(
      "Este calendario ya esta activo. Usa reemplazo para crear una nueva version sin afectar el historico.",
      400
    );
  }

  Object.assign(calendar, next);
  saveFiscalCalendars(calendars);

  const organization = getOrganization();
  const audits = getAudits();
  auditAndSave(
    audits,
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "actualizar_calendario_fiscal",
      modulo: "calendario_fiscal",
      recursoTipo: "calendario_fiscal",
      recursoId: calendar.id,
      descripcion: `Se actualizo el calendario fiscal ${calendar.periodo} ${calendar.anio}.`,
      valorAnterior: previous,
      valorNuevo: clone(calendar)
    })
  );

  return getFiscalCalendarById(calendar.id);
}

export function activateFiscalCalendar(calendarId, actor = "usr_admin") {
  const calendars = getFiscalCalendars();
  const calendar = calendars.find((item) => item.id === calendarId);

  if (!calendar) {
    throw createFiscalError("Calendario fiscal no encontrado.", 404);
  }

  if (![FISCAL_CALENDAR_STATUS.DRAFT, FISCAL_CALENDAR_STATUS.VALIDATED].includes(calendar.estado)) {
    throw createFiscalError("Solo se pueden activar calendarios en borrador o validados.", 400);
  }

  const previous = clone(calendar);
  calendar.estado = FISCAL_CALENDAR_STATUS.ACTIVE;
  calendar.updatedAt = new Date().toISOString();
  calendar.actualizadoPor = actor;
  saveFiscalCalendars(calendars);

  const organization = getOrganization();
  const audits = getAudits();
  auditAndSave(
    audits,
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "activar_calendario_fiscal",
      modulo: "calendario_fiscal",
      recursoTipo: "calendario_fiscal",
      recursoId: calendar.id,
      descripcion: `Se activo el calendario fiscal ${calendar.periodo} ${calendar.anio}.`,
      valorAnterior: { estado: previous.estado },
      valorNuevo: { estado: calendar.estado }
    })
  );

  const taskGeneration = generateFiscalTasks(
    {
      impuestoId: calendar.impuestoId,
      anio: calendar.anio,
      incluirVencidas: true
    },
    actor
  );

  return {
    ...getFiscalCalendarById(calendar.id),
    taskGeneration
  };
}

export function cancelFiscalCalendar(calendarId, actor = "usr_admin") {
  const calendars = getFiscalCalendars();
  const calendar = calendars.find((item) => item.id === calendarId);

  if (!calendar) {
    throw createFiscalError("Calendario fiscal no encontrado.", 404);
  }

  const previous = clone(calendar);
  calendar.estado = FISCAL_CALENDAR_STATUS.CANCELED;
  calendar.updatedAt = new Date().toISOString();
  calendar.actualizadoPor = actor;
  saveFiscalCalendars(calendars);

  const organization = getOrganization();
  const audits = getAudits();
  auditAndSave(
    audits,
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "anular_calendario_fiscal",
      modulo: "calendario_fiscal",
      recursoTipo: "calendario_fiscal",
      recursoId: calendar.id,
      descripcion: `Se anulo el calendario fiscal ${calendar.periodo} ${calendar.anio}.`,
      valorAnterior: { estado: previous.estado },
      valorNuevo: { estado: calendar.estado }
    })
  );

  return getFiscalCalendarById(calendar.id);
}

export function deleteFiscalCalendar(calendarId, actor = "usr_admin") {
  const calendars = getFiscalCalendars();
  const calendarIndex = calendars.findIndex((item) => item.id === calendarId);

  if (calendarIndex === -1) {
    throw createFiscalError("Calendario fiscal no encontrado.", 404);
  }

  const calendar = calendars[calendarIndex];
  const tasks = getFiscalTasks().filter((item) => item.calendarioFiscalId === calendarId);

  if (tasks.length > 0) {
    throw createFiscalError(
      "No se puede eliminar el calendario porque ya tiene tareas fiscales generadas. Usa anular o reemplazar.",
      400
    );
  }

  calendars.splice(calendarIndex, 1);
  saveFiscalCalendars(calendars);

  const organization = getOrganization();
  const audits = getAudits();
  auditAndSave(
    audits,
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "eliminar_calendario_fiscal",
      modulo: "calendario_fiscal",
      recursoTipo: "calendario_fiscal",
      recursoId: calendarId,
      descripcion: `Se elimino el calendario fiscal ${calendar.periodo} ${calendar.anio}.`,
      valorAnterior: clone(calendar),
      valorNuevo: null
    })
  );

  return {
    deleted: true,
    calendarId
  };
}

export function replaceFiscalCalendar(calendarId, payload, actor = "usr_admin") {
  const taxes = getTaxes();
  const calendars = getFiscalCalendars();
  const versions = getFiscalCalendarVersions();
  const calendar = calendars.find((item) => item.id === calendarId);

  if (!calendar) {
    throw createFiscalError("Calendario fiscal no encontrado.", 404);
  }

  const replacement = normalizeCalendarPayload({
    ...calendar,
    ...payload,
    version: calendar.version + 1
  });
  validateCalendarPayload(replacement, taxes);

  const previous = clone(calendar);
  calendar.estado = FISCAL_CALENDAR_STATUS.REPLACED;
  calendar.updatedAt = new Date().toISOString();
  calendar.actualizadoPor = actor;

  const now = new Date().toISOString();
  const nextCalendar = {
    id: createId("fcal"),
    ...replacement,
    createdAt: now,
    updatedAt: now,
    creadoPor: actor,
    actualizadoPor: actor
  };

  calendars.push(nextCalendar);
  versions.push(
    createCalendarVersionRecord({
      calendarId: calendar.id,
      version: nextCalendar.version,
      actor,
      estadoAnterior: previous.estado,
      estadoNuevo: nextCalendar.estado,
      motivoCambio: normalizeText(payload.motivoCambio) || "Reemplazo de calendario fiscal",
      snapshotAnterior: previous,
      snapshotNuevo: nextCalendar
    })
  );

  saveFiscalCalendars(calendars);
  saveFiscalCalendarVersions(versions);

  const organization = getOrganization();
  const audits = getAudits();
  auditAndSave(
    audits,
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "reemplazar_calendario_fiscal",
      modulo: "calendario_fiscal",
      recursoTipo: "calendario_fiscal",
      recursoId: nextCalendar.id,
      descripcion: `Se reemplazo el calendario fiscal ${previous.periodo} ${previous.anio}.`,
      valorAnterior: previous,
      valorNuevo: nextCalendar
    })
  );

  const taskSynchronization = synchronizeTasksForCalendarReplacement(previous, nextCalendar, actor);
  const taskGeneration = generateFiscalTasks(
    {
      impuestoId: nextCalendar.impuestoId,
      anio: nextCalendar.anio,
      incluirVencidas: true
    },
    actor
  );

  return {
    replaced: getFiscalCalendarById(calendar.id),
    replacement: getFiscalCalendarById(nextCalendar.id),
    taskSynchronization,
    taskGeneration
  };
}

export function listFiscalTasks() {
  return listTasks({ tipoTarea: "fiscal" });
}

export function listApplicableActiveCalendarsForObligation(company, obligation) {
  if (!company || !obligation) {
    return [];
  }

  const profile = getCompanyEffectiveTaxProfile(company);
  const calendars = getFiscalCalendars().filter((calendar) => matchesCalendarToCompany(calendar, company, profile, obligation));
  return selectBestMatchingCalendars(calendars).map((calendar) => getFiscalCalendarById(calendar.id) || buildCalendarView(calendar, getTaxes()));
}

export function getFiscalTaskById(taskId) {
  const task = getTaskById(taskId);
  return task?.tipoTarea === "fiscal" ? task : null;
}

export function listCompanyFiscalTasks(companyId) {
  return listCompanyTasks(companyId).filter((task) => task.tipoTarea === "fiscal");
}

export function generateFiscalTasks(
  { companyId, anio, impuestoId, incluirVencidas = false, responsableId = "", fechaCorte = "" } = {},
  actor = "usr_admin"
) {
  const organization = getOrganization();
  const audits = getAudits();
  const companies = getCompanies();
  const obligations = getCompanyObligations();
  const calendars = getFiscalCalendars();
  const tasks = getFiscalTasks();
  const taxes = getTaxes();
  const duplicateKeys = new Set(tasks.flatMap((task) => existingTaskKeys(task)));
  const createdTasks = [];
  const omitted = [];
  const duplicates = [];
  const effectiveCutoffDate = normalizeDate(fechaCorte) || today();
  const allowOverdueGeneration = incluirVencidas === true || incluirVencidas === "true";

  const targetCompanies = companyId ? companies.filter((item) => item.id === companyId) : companies;
  if (companyId && targetCompanies.length === 0) {
    throw createFiscalError("Empresa no encontrada.", 404);
  }

  for (const company of targetCompanies) {
    if (isCompanyTaskBlocked(company)) {
      const reason = `La empresa ${company.razonSocial} no esta activa para generar tareas fiscales.`;
      omitted.push({ tipo: "empresa", codigo: "empresa_no_activa", empresaId: company.id, reason });
      audits.push(
        createAuditEntry({
          organizacionId: organization.id,
          usuarioId: actor,
          accion: "omitir_generacion_tareas_por_empresa",
          modulo: "calendario_fiscal",
          recursoTipo: "empresa",
          recursoId: company.id,
          descripcion: reason
        })
      );
      continue;
    }

    const profile = getCompanyEffectiveTaxProfile(company);
    const activeObligations = obligations.filter((item) => item.empresaId === company.id);

    for (const obligation of activeObligations) {
      if (!isObligationActive(obligation)) {
        const reason = `La obligacion ${obligation.nombreObligacion} no esta activa.`;
        omitted.push({
          tipo: "obligacion",
          codigo: "obligacion_no_activa",
          empresaId: company.id,
          obligacionFiscalEmpresaId: obligation.id,
          reason
        });
        audits.push(
          createAuditEntry({
            organizacionId: organization.id,
            usuarioId: actor,
            accion: "omitir_generacion_tareas_por_obligacion",
            modulo: "calendario_fiscal",
            recursoTipo: "obligacion_fiscal_empresa",
            recursoId: obligation.id,
            descripcion: reason
          })
        );
        continue;
      }

      const applicableCalendars = calendars.filter((calendar) => matchesCalendarToCompany(calendar, company, profile, obligation));
      const filteredCalendars = applicableCalendars.filter((calendar) => {
        if (impuestoId && calendar.impuestoId !== impuestoId) {
          return false;
        }

        if (anio && Number(calendar.anio) !== Number(anio)) {
          return false;
        }

        return true;
      });

      const selectedCalendars = selectBestMatchingCalendars(filteredCalendars);
      if (selectedCalendars.length === 0) {
        const activeCalendarsForTax = calendars.filter(
          (calendar) =>
            calendar.impuestoId === obligation.impuestoId &&
            normalizeText(calendar.estado) === FISCAL_CALENDAR_STATUS.ACTIVE
        );
        const reasonCode =
          obligation.nivel === "municipal" && activeCalendarsForTax.length > 0
            ? "municipio_no_coincide"
            : "calendario_no_encontrado";
        const reason =
          reasonCode === "municipio_no_coincide"
            ? `Existe calendario activo para ${obligation.nombreObligacion}, pero no coincide el municipio / ciudad.`
            : obligation.nivel === "municipal"
              ? `No existe calendario municipal activo para ${obligation.nombreObligacion}.`
              : `No existe calendario activo aplicable para ${obligation.nombreObligacion}.`;

        omitted.push({
          tipo: "calendario",
          codigo: reasonCode,
          empresaId: company.id,
          obligacionFiscalEmpresaId: obligation.id,
          reason
        });
        audits.push(
          createAuditEntry({
            organizacionId: organization.id,
            usuarioId: actor,
            accion: "omitir_generacion_tareas_por_calendario",
            modulo: "calendario_fiscal",
            recursoTipo: "obligacion_fiscal_empresa",
            recursoId: obligation.id,
            descripcion: reason
          })
        );
        continue;
      }

      for (const calendar of selectedCalendars) {
        if (!allowOverdueGeneration && calendar.fechaVencimiento && calendar.fechaVencimiento < effectiveCutoffDate) {
          const reason = `Se omite la tarea fiscal historica ${obligation.nombreObligacion} porque ya estaba vencida al ${effectiveCutoffDate}.`;
          omitted.push({
            tipo: "calendario",
            codigo: "calendario_vencido",
            empresaId: company.id,
            obligacionFiscalEmpresaId: obligation.id,
            calendarioFiscalId: calendar.id,
            reason
          });
          audits.push(
            createAuditEntry({
              organizacionId: organization.id,
              usuarioId: actor,
              accion: "omitir_generacion_tareas_historicas",
              modulo: "calendario_fiscal",
              recursoTipo: "calendario_fiscal",
              recursoId: calendar.id,
              descripcion: reason
            })
          );
          continue;
        }

        const tax = taxes.find((item) => item.id === obligation.impuestoId) || null;
        const now = new Date().toISOString();
        const responsibleForTask = getCompanyDefaultResponsible(company.id, responsableId);
        const variants = buildFiscalTaskVariants(calendar);

        for (const variant of variants) {
          const draftTask = {
            empresaId: company.id,
            obligacionFiscalEmpresaId: obligation.id,
            calendarioFiscalId: calendar.id,
            periodo: calendar.periodo,
            anio: calendar.anio,
            cumplimientoFiscal: variant.cumplimientoFiscal
          };
          const taskKey = createTaskKey(draftTask);

          if (duplicateKeys.has(taskKey)) {
            duplicates.push({
              empresaId: company.id,
              obligacionFiscalEmpresaId: obligation.id,
              calendarioFiscalId: calendar.id,
              codigo: "tarea_duplicada",
              reason: `Tarea fiscal duplicada evitada para ${variant.cumplimientoFiscal}.`
            });
            audits.push(
              createAuditEntry({
                organizacionId: organization.id,
                usuarioId: actor,
                accion: "evitar_tarea_fiscal_duplicada",
                modulo: "calendario_fiscal",
                recursoTipo: "tarea_fiscal",
                recursoId: taskKey,
                descripcion: `Se evito una tarea fiscal duplicada para ${company.razonSocial}.`
              })
            );
            continue;
          }

          const task = {
            id: createId("ftask"),
            empresaId: company.id,
            tipoTarea: "fiscal",
            obligacionFiscalEmpresaId: obligation.id,
            impuestoId: obligation.impuestoId,
            calendarioFiscalId: calendar.id,
            cumplimientoFiscal: variant.cumplimientoFiscal,
            titulo: buildFiscalTaskTitle(variant, obligation, calendar),
            descripcion: `Tarea fiscal generada desde la obligacion ${obligation.nombreObligacion}${obligation.eventoFiscal ? ` (${obligation.eventoFiscal})` : ""}. ${variant.descripcion}`,
            anio: calendar.anio,
            periodo: calendar.periodo,
            fechaInicioPeriodo: calendar.fechaInicioPeriodo,
            fechaFinPeriodo: calendar.fechaFinPeriodo,
            fechaVencimiento: calendar.fechaVencimiento,
            fechaLimiteInterna: subtractCalendarDays(calendar.fechaVencimiento, 3),
            estadoOperativo: FISCAL_TASK_GENERAL_STATUS.PENDING,
            estadoGeneral: FISCAL_TASK_GENERAL_STATUS.PENDING,
            estadoLiquidacion: "pendiente_liquidacion",
            estadoPresentacion:
              variant.cumplimientoFiscal === "pago" ? "no_aplica" : "pendiente_presentacion",
            estadoPago:
              variant.cumplimientoFiscal === "declaracion" ? "no_aplica" : "pendiente_pago",
            prioridad: "alta",
            responsableId: responsibleForTask,
            observaciones: "",
            evidencias: [],
            origen: "calendario_fiscal",
            versionCalendario: calendar.version,
            nombreCuota: calendar.nombreCuota || "",
            numeroCuota: calendar.numeroCuota ?? null,
            tipoPago: calendar.tipoPago || "declaracion_y_pago",
            eventoFiscalClave: normalizeFiscalEventKey(obligation.eventoFiscalClave || calendar.eventoFiscalClave),
            eventoFiscal: obligation.eventoFiscal || calendar.eventoFiscal || "",
            createdAt: now,
            updatedAt: now,
            impuestoNombre: tax?.nombre || obligation.nombreObligacion
          };

          tasks.push(task);
          duplicateKeys.add(taskKey);
          createdTasks.push(task);
          audits.push(
            createAuditEntry({
              organizacionId: organization.id,
              usuarioId: actor,
              accion: "generar_tarea_fiscal",
              modulo: "calendario_fiscal",
              recursoTipo: "tarea_fiscal",
              recursoId: task.id,
              descripcion: `Se genero una tarea fiscal de ${variant.cumplimientoFiscal} para ${company.razonSocial}.`,
              valorNuevo: {
                empresaId: company.id,
                obligacionFiscalEmpresaId: obligation.id,
                calendarioFiscalId: calendar.id,
                cumplimientoFiscal: task.cumplimientoFiscal,
                fechaVencimiento: task.fechaVencimiento,
                responsableId: task.responsableId
              }
            })
          );
        }
      }
    }
  }

  saveFiscalTasks(tasks);
  saveAudits(audits);

  return {
    generatedAt: new Date().toISOString(),
    createdCount: createdTasks.length,
    omittedCount: omitted.length,
    duplicateCount: duplicates.length,
    createdItems: createdTasks.map((task) => buildUnifiedTaskView(task)),
    omitted,
    duplicates
  };
}
