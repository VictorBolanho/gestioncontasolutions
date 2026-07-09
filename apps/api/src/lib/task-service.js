import {
  COMPANY_STATUS,
  TASK_FISCAL_WORKFLOW_STAGES,
  TASK_GENERAL_STATUS,
  TASK_OPERATIONAL_STATUS,
  TASK_PRIORITIES,
  TASK_TYPES,
  createAuditEntry
} from "../../../../packages/domain/index.js";
import {
  getAudits,
  getCompanies,
  getCompanyObligations,
  getFiscalCalendars,
  getFiscalTasks,
  getOrganization,
  getTaxes,
  getUsers,
  saveAudits,
  saveFiscalTasks
} from "./storage.js";
import { canUserAccessCompany, sanitizeUser } from "./auth-service.js";

const CLOSED_STATUSES = new Set([
  TASK_OPERATIONAL_STATUS.PRESENTED,
  TASK_OPERATIONAL_STATUS.COMPLETED,
  TASK_OPERATIONAL_STATUS.CANCELED,
  TASK_OPERATIONAL_STATUS.NOT_APPLICABLE
]);
const DIAN_CONTROL_TASK_TYPE = "cumplimiento_dian";
const DIAN_CONTROL_ORIGIN = "sistema_dian";
const WORKFLOW_MANAGED_TASK_TYPES = new Set(["fiscal", DIAN_CONTROL_TASK_TYPE]);
const DIGITAL_CONTROL_KEYS = Object.freeze({
  RUT: "rut_actualizacion",
  FACTURACION: "facturacion_electronica",
  EXOGENA: "informacion_exogena",
  DOCUMENTO_SOPORTE: "documento_soporte_no_obligados",
  NOMINA: "nomina_electronica",
  FIRMA: "firma_electronica"
});

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createTaskError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function normalizeTaskSupport(support = {}) {
  return {
    numeroFormulario: normalizeText(support.numeroFormulario),
    numeroAcuse: normalizeText(support.numeroAcuse),
    numeroReciboPago: normalizeText(support.numeroReciboPago),
    referenciaSoporte: normalizeText(support.referenciaSoporte),
    fechaPresentacionReal: normalizeDate(support.fechaPresentacionReal),
    fechaPagoReal: normalizeDate(support.fechaPagoReal),
    observacionSoporte: normalizeText(support.observacionSoporte)
  };
}

function normalizeClientBlock(block = {}) {
  const estado = normalizeText(block.estado || (block.activo ? "abierto" : ""));
  return {
    estado: estado === "cerrado" ? "cerrado" : estado === "abierto" ? "abierto" : "",
    activo: estado === "abierto" || block.activo === true,
    motivo: normalizeText(block.motivo),
    solicitadoA: normalizeText(block.solicitadoA),
    fechaBloqueo: normalizeDate(block.fechaBloqueo),
    fechaResolucion: normalizeDate(block.fechaResolucion),
    actualizadoPor: normalizeText(block.actualizadoPor)
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(baseDate, days) {
  const date = new Date(baseDate);
  if (Number.isNaN(date.getTime())) {
    return today();
  }
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function addMonths(baseDate, months) {
  const date = new Date(`${baseDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = date.getUTCDate();
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDayOfTargetMonth = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDayOfTargetMonth));
  return next.toISOString().slice(0, 10);
}

function dateDiffInDays(fromDate, toDate) {
  const from = new Date(`${fromDate}T00:00:00Z`);
  const to = new Date(`${toDate}T00:00:00Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return null;
  }

  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function recurrenceStepMonths(periodicity) {
  const normalized = normalizeText(periodicity);
  const steps = {
    mensual: 1,
    bimestral: 2,
    trimestral: 3,
    cuatrimestral: 4,
    semestral: 6,
    anual: 12
  };

  return steps[normalized] || 0;
}

function buildRecurringDueDates({ fechaVencimiento, periodicidad, repetirHasta }) {
  const normalizedPeriodicity = normalizeText(periodicidad || "unica_vez");
  const startDate = normalizeDate(fechaVencimiento);
  const endDate = normalizeDate(repetirHasta);
  if (!startDate) {
    return [];
  }

  if (["", "ocasional", "unica_vez", "personalizada"].includes(normalizedPeriodicity)) {
    return [startDate];
  }

  if (!endDate) {
    throw createTaskError("Debes indicar hasta cuando se repite la tarea.", 400);
  }

  if (endDate < startDate) {
    throw createTaskError("La fecha final de repeticion no puede ser anterior al primer vencimiento.", 400);
  }

  const dates = [];
  if (normalizedPeriodicity === "semanal") {
    let current = startDate;
    while (current && current <= endDate) {
      dates.push(current);
      current = addDays(`${current}T00:00:00Z`, 7);
    }
    return dates;
  }

  const monthStep = recurrenceStepMonths(normalizedPeriodicity);
  if (!monthStep) {
    return [startDate];
  }

  let current = startDate;
  while (current && current <= endDate) {
    dates.push(current);
    current = addMonths(current, monthStep);
  }

  return dates;
}

function getTaskStatus(task) {
  return normalizeText(task.estadoOperativo || task.estadoGeneral || TASK_OPERATIONAL_STATUS.PENDING);
}

function isWorkflowManagedTask(task) {
  return WORKFLOW_MANAGED_TASK_TYPES.has(normalizeText(task?.tipoTarea));
}

function allowedWorkflowStagesForTask(task) {
  if (!isWorkflowManagedTask(task)) {
    return [];
  }

  if (task?.tipoTarea === DIAN_CONTROL_TASK_TYPE) {
    return [
      "pendiente_preparacion",
      "en_preparacion",
      "preparada",
      "en_revision",
      "aprobada",
      "completada",
      "cancelada",
      "no_aplica"
    ];
  }

  if (task?.cumplimientoFiscal === "pago") {
    return [
      "pendiente_preparacion",
      "en_preparacion",
      "preparada",
      "en_revision",
      "aprobada",
      "pagada",
      "cancelada",
      "no_aplica"
    ];
  }

  return [
    "pendiente_preparacion",
    "en_preparacion",
    "preparada",
    "en_revision",
    "aprobada",
    "presentada",
    "cancelada",
    "no_aplica"
  ];
}

function defaultWorkflowStageForTask(task, status = getTaskStatus(task)) {
  if (!isWorkflowManagedTask(task)) {
    return "";
  }

  if (status === TASK_OPERATIONAL_STATUS.CANCELED) {
    return "cancelada";
  }

  if (status === TASK_OPERATIONAL_STATUS.NOT_APPLICABLE) {
    return "no_aplica";
  }

  if (status === TASK_OPERATIONAL_STATUS.PRESENTED) {
    return "presentada";
  }

  if (status === TASK_OPERATIONAL_STATUS.COMPLETED) {
    if (task?.tipoTarea === DIAN_CONTROL_TASK_TYPE) {
      return "completada";
    }
    return task?.cumplimientoFiscal === "pago" ? "pagada" : "completada";
  }

  if (status === TASK_OPERATIONAL_STATUS.IN_PROGRESS) {
    return "en_preparacion";
  }

  return "pendiente_preparacion";
}

function resolveWorkflowStage(task, requestedStage = "", status = getTaskStatus(task)) {
  if (!isWorkflowManagedTask(task)) {
    return "";
  }

  const normalizedStage = normalizeText(requestedStage);
  const allowedStages = allowedWorkflowStagesForTask(task);
  if (!normalizedStage) {
    return defaultWorkflowStageForTask(task, status);
  }

  if (!TASK_FISCAL_WORKFLOW_STAGES.includes(normalizedStage) || !allowedStages.includes(normalizedStage)) {
    throw createTaskError("La etapa de trabajo no es valida para esta tarea.", 400);
  }

  return normalizedStage;
}

function setTaskStatus(task, status, actor) {
  const now = new Date().toISOString();
  task.estadoOperativo = status;
  task.estadoGeneral = status;
  task.updatedAt = now;
  task.actualizadoPor = actor;

  if (isWorkflowManagedTask(task)) {
    if (CLOSED_STATUSES.has(status)) {
      task.etapaGestion = defaultWorkflowStageForTask(task, status);
    } else if (status === TASK_OPERATIONAL_STATUS.IN_PROGRESS) {
      const currentStage = normalizeText(task.etapaGestion);
      if (!currentStage || currentStage === "pendiente_preparacion") {
        task.etapaGestion = "en_preparacion";
      }
    } else if (!normalizeText(task.etapaGestion)) {
      task.etapaGestion = defaultWorkflowStageForTask(task, status);
    }
  }

  if (CLOSED_STATUSES.has(status)) {
    task.closedAt = task.closedAt || now;
    task.closedBy = task.closedBy || actor;
  }
}

function taskCompany(task, companies) {
  return companies.find((company) => company.id === task.empresaId) || null;
}

function taskResponsible(task, users) {
  return users.find((user) => user.id === task.responsableId) || null;
}

function taskSupervisor(task, users, responsible = null) {
  const supervisorId = normalizeText(task.supervisorId || responsible?.supervisorId);
  return users.find((user) => user.id === supervisorId) || null;
}

function taskObligation(task, obligations) {
  return obligations.find((obligation) => obligation.id === task.obligacionFiscalEmpresaId) || null;
}

function taskCalendar(task, calendars) {
  return calendars.find((calendar) => calendar.id === task.calendarioFiscalId) || null;
}

function taskTax(task, taxes, obligation) {
  return taxes.find((tax) => tax.id === (task.impuestoId || obligation?.impuestoId)) || null;
}

function normalizeComparableLabel(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(de|del|la|el)\b/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function buildFiscalTaskDisplayTitle(task, obligation, calendar) {
  const milestone =
    task.cumplimientoFiscal === "declaracion"
      ? "Declaracion"
      : task.cumplimientoFiscal === "pago"
        ? "Pago"
        : "Cumplimiento";
  const eventLabel = obligation?.eventoFiscal || task.eventoFiscal || calendar?.eventoFiscal || "";
  const normalizedEvent = normalizeComparableLabel(eventLabel);
  const normalizedCuota = normalizeComparableLabel(calendar?.nombreCuota || task.nombreCuota || "");
  const cuotaLooksDuplicated =
    normalizedEvent &&
    normalizedCuota &&
    (normalizedEvent === normalizedCuota ||
      normalizedEvent.includes(normalizedCuota) ||
      normalizedCuota.includes(normalizedEvent));
  const cuotaLabel = cuotaLooksDuplicated ? "" : calendar?.nombreCuota || task.nombreCuota || "";
  return [milestone, obligation?.nombreObligacion || task.impuestoNombre || "Obligacion fiscal", eventLabel, cuotaLabel, `${task.periodo} ${task.anio}`]
    .filter(Boolean)
    .join(" - ");
}

function assertResponsibleCanAccessCompany(responsableId, empresaId) {
  const normalizedResponsibleId = normalizeText(responsableId);
  if (!normalizedResponsibleId) {
    return "";
  }

  const responsible = getUsers().find((user) => user.id === normalizedResponsibleId);
  if (!responsible) {
    throw createTaskError("Responsable no encontrado.", 404);
  }

  const normalizedRole = normalizeText(responsible.role);
  const canWorkTaskWithoutFullCompanyAssignment = normalizedRole === "apprentice";
  if (!canWorkTaskWithoutFullCompanyAssignment && !canUserAccessCompany(responsible, empresaId)) {
    throw createTaskError("El responsable seleccionado no tiene acceso a la empresa de la tarea.", 403);
  }

  return normalizedResponsibleId;
}

function auditTask(action, task, actor, description, previous = null) {
  const audits = getAudits();
  const organization = getOrganization();
  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: action,
      modulo: "tareas",
      recursoTipo: "tarea",
      recursoId: task.id,
      descripcion: description,
      valorAnterior: previous ? clone(previous) : undefined,
      valorNuevo: clone(task)
    })
  );
  saveAudits(audits);
}

function normalizeTaskRecord(task = {}) {
  const status = getTaskStatus(task);
  const tipoTarea = normalizeText(task.tipoTarea || "fiscal");
  const origen = normalizeText(task.origen || (tipoTarea === "fiscal" ? "calendario_fiscal" : "manual_gerente"));
  const supervisorId = normalizeText(task.supervisorId);

  return {
    ...task,
    tipoTarea,
    origen,
    estadoOperativo: status,
    estadoGeneral: status,
    etapaGestion: resolveWorkflowStage(task, task.etapaGestion, status),
    prioridad: normalizeText(task.prioridad || "media"),
    responsableId: normalizeText(task.responsableId),
    supervisorId,
    observaciones: normalizeText(task.observaciones),
    soporteFiscal: normalizeTaskSupport(task.soporteFiscal),
    bloqueoCliente: normalizeClientBlock(task.bloqueoCliente || task.bloqueoPorCliente),
    evidencias: Array.isArray(task.evidencias) ? task.evidencias : [],
    fechaVencimiento: normalizeDate(task.fechaVencimiento),
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || task.createdAt || new Date().toISOString()
  };
}

function normalizeAndPersistExistingTasks() {
  const tasks = getFiscalTasks();
  const obligations = getCompanyObligations();
  const calendars = getFiscalCalendars();
  let changed = false;
  const normalized = tasks.map((task) => {
    const next = normalizeTaskRecord(task);
    if (next.tipoTarea === "fiscal") {
      const obligation = taskObligation(next, obligations);
      const calendar = taskCalendar(next, calendars);
      const expectedTitle = buildFiscalTaskDisplayTitle(next, obligation, calendar);
      if (expectedTitle && next.titulo !== expectedTitle) {
        next.titulo = expectedTitle;
      }
    }
    if (JSON.stringify(next) !== JSON.stringify(task)) {
      changed = true;
    }
    return next;
  });

  if (changed) {
    saveFiscalTasks(normalized);
  }

  return normalized;
}

function applyOverdueStatuses(tasks, actor = "system") {
  const currentDate = today();
  let changed = false;
  const audits = getAudits();
  const organization = getOrganization();

  for (const task of tasks) {
    const status = getTaskStatus(task);
    if (!task.fechaVencimiento || CLOSED_STATUSES.has(status) || status === TASK_OPERATIONAL_STATUS.OVERDUE) {
      continue;
    }

    if (String(task.fechaVencimiento) < currentDate) {
      const previous = clone(task);
      setTaskStatus(task, TASK_OPERATIONAL_STATUS.OVERDUE, actor);
      changed = true;
      audits.push(
        createAuditEntry({
          organizacionId: organization.id,
          usuarioId: actor,
          accion: "marcar_tarea_vencida",
          modulo: "tareas",
          recursoTipo: "tarea",
          recursoId: task.id,
          descripcion: `La tarea ${task.titulo || task.id} quedo vencida automaticamente.`,
          valorAnterior: previous,
          valorNuevo: clone(task)
        })
      );
    }
  }

  if (changed) {
    saveFiscalTasks(tasks);
    saveAudits(audits);
  }

  return tasks;
}

function getCurrentTasks() {
  return applyOverdueStatuses(normalizeAndPersistExistingTasks());
}

function responsibilityCodes(company) {
  return Array.isArray(company?.responsabilidadesTributarias)
    ? company.responsabilidadesTributarias.map((item) => normalizeText(item?.codigo))
    : [];
}

function companyHasObligation(companyId, predicate) {
  return getCompanyObligations().some((item) => item.empresaId === companyId && predicate(item));
}

function createDianControlTaskKey({ empresaId, controlKey, periodo, anio }) {
  return [empresaId, controlKey, periodo, String(anio)].join("|");
}

function buildDianControlDefinitions(company) {
  const codes = new Set(responsibilityCodes(company));
  const isJuridica = normalizeText(company?.tipoPersona).toLowerCase().includes("juridica");
  const controls = [];

  controls.push({
    key: DIGITAL_CONTROL_KEYS.RUT,
    titulo: "Verificar actualizacion del RUT",
    descripcion:
      "Control preventivo para confirmar que correo, responsabilidades, actividad economica y representacion legal sigan alineados con el RUT vigente ante la DIAN.",
    prioridad: "media",
    diasVencimiento: 10,
    periodo: "control_rut"
  });

  if (
    company?.obligadoFacturar ||
    codes.has("52") ||
    codes.has("16") ||
    companyHasObligation(company.id, (item) => item.impuestoId === "tax_facturacion_electronica")
  ) {
    controls.push({
      key: DIGITAL_CONTROL_KEYS.FACTURACION,
      titulo: "Validar habilitacion de facturacion electronica",
      descripcion:
        "Revisar habilitacion, numeracion autorizada, correo del RUT y operacion vigente de facturacion electronica segun lineamientos DIAN.",
      prioridad: "alta",
      diasVencimiento: 5,
      periodo: "control_facturacion"
    });
    controls.push({
      key: DIGITAL_CONTROL_KEYS.DOCUMENTO_SOPORTE,
      titulo: "Validar documento soporte con no obligados a facturar",
      descripcion:
        "Controlar si la empresa debe generar y conservar documento soporte en adquisiciones a no obligados a facturar para costos, deducciones e IVA descontable.",
      prioridad: "alta",
      diasVencimiento: 7,
      periodo: "control_documento_soporte"
    });
  }

  if (
    company?.informanteExogena ||
    codes.has("14") ||
    companyHasObligation(company.id, (item) => item.impuestoId === "tax_exogena")
  ) {
    controls.push({
      key: DIGITAL_CONTROL_KEYS.EXOGENA,
      titulo: "Validar presentacion de informacion exogena",
      descripcion:
        "Revisar topes, obligacion vigente, formato y cronograma DIAN para presentacion de informacion exogena.",
      prioridad: "alta",
      diasVencimiento: 6,
      periodo: "control_exogena"
    });
  }

  if (isJuridica && company?.obligadoLlevarContabilidad) {
    controls.push({
      key: DIGITAL_CONTROL_KEYS.NOMINA,
      titulo: "Validar si aplica nomina electronica",
      descripcion:
        "Revisar si la empresa debe transmitir documento soporte de pago de nomina electronica y sus notas de ajuste conforme a la DIAN.",
      prioridad: "media",
      diasVencimiento: 8,
      periodo: "control_nomina"
    });
  }

  if (
    codes.has("14") ||
    codes.has("52") ||
    company?.obligadoFacturar ||
    company?.informanteExogena
  ) {
    controls.push({
      key: DIGITAL_CONTROL_KEYS.FIRMA,
      titulo: "Verificar mecanismo de firma electronica",
      descripcion:
        "Confirmar que la empresa o su representante cuenta con firma electronica y acceso operativo a servicios DIAN/MUISCA para tramites y transmisiones.",
      prioridad: "media",
      diasVencimiento: 9,
      periodo: "control_firma"
    });
  }

  return controls;
}

export function buildTaskView(task) {
  const companies = getCompanies();
  const users = getUsers();
  const obligations = getCompanyObligations();
  const calendars = getFiscalCalendars();
  const taxes = getTaxes();
  const obligation = taskObligation(task, obligations);
  const company = taskCompany(task, companies);
  const responsible = taskResponsible(task, users);
  const supervisor = taskSupervisor(task, users, responsible);
  const calendar = taskCalendar(task, calendars);
  const tax = taskTax(task, taxes, obligation);

  return {
    ...normalizeTaskRecord(task),
    empresa: company
      ? {
          id: company.id,
          razonSocial: company.razonSocial,
          nit: company.nit,
          dv: company.dv,
          estadoEmpresa: company.estadoEmpresa
        }
      : null,
    responsable: responsible
      ? {
          id: responsible.id,
          nombreCompleto: responsible.nombreCompleto,
          email: responsible.email,
          cargo: responsible.cargo
        }
      : null,
    supervisor: supervisor ? sanitizeUser(supervisor) : null,
    obligacionFiscal: obligation || null,
    calendarioFiscal: calendar || null,
    impuesto: tax || null,
    impuestoNombre: tax?.nombre || task.impuestoNombre || obligation?.nombreObligacion || ""
  };
}

export function listTasks(filters = {}) {
  const normalizedFilters = {
    ...filters,
    estado: normalizeText(filters.estado),
    empresaId: normalizeText(filters.empresaId || filters.companyId),
    responsableId: normalizeText(filters.responsableId),
    tipoTarea: normalizeText(filters.tipoTarea),
    vencidas: normalizeText(filters.vencidas),
    proximas: normalizeText(filters.proximas)
  };
  const nextSevenDays = new Date();
  nextSevenDays.setUTCDate(nextSevenDays.getUTCDate() + 7);
  const limitDate = nextSevenDays.toISOString().slice(0, 10);
  const currentDate = today();

  return getCurrentTasks()
    .map(buildTaskView)
    .filter((task) => {
      if (normalizedFilters.estado && getTaskStatus(task) !== normalizedFilters.estado) return false;
      if (normalizedFilters.empresaId && task.empresaId !== normalizedFilters.empresaId) return false;
      if (normalizedFilters.responsableId && task.responsableId !== normalizedFilters.responsableId) return false;
      if (normalizedFilters.tipoTarea && task.tipoTarea !== normalizedFilters.tipoTarea) return false;
      if (normalizedFilters.vencidas === "true" && getTaskStatus(task) !== TASK_OPERATIONAL_STATUS.OVERDUE) return false;
      if (
        normalizedFilters.proximas === "true" &&
        (!task.fechaVencimiento ||
          task.fechaVencimiento < currentDate ||
          task.fechaVencimiento > limitDate ||
          CLOSED_STATUSES.has(getTaskStatus(task)))
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => String(a.fechaVencimiento || "").localeCompare(String(b.fechaVencimiento || "")) || b.createdAt.localeCompare(a.createdAt));
}

export function getTaskById(taskId) {
  const task = getCurrentTasks().find((item) => item.id === taskId);
  return task ? buildTaskView(task) : null;
}

export function listCompanyTasks(companyId) {
  return listTasks({ empresaId: companyId });
}

export function listTaskResponsibles() {
  return getUsers()
    .filter((user) => normalizeText(user.estado || "activo") === "activo")
    .map((user) => ({
      id: user.id,
      nombreCompleto: user.nombreCompleto || [user.nombre, user.apellido].filter(Boolean).join(" "),
      email: user.email,
      cargo: user.cargo || ""
    }))
    .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, "es"));
}

export function listTaskResponsiblesForUser(currentUser) {
  const actorId = normalizeText(currentUser?.id);
  const actorRole = normalizeText(currentUser?.role || currentUser?.primaryRole || currentUser?.roles?.[0]);
  const supervisedUserIds = new Set(Array.isArray(currentUser?.supervisedUsers) ? currentUser.supervisedUsers : []);

  return listTaskResponsibles().filter((user) => {
    if (["owner", "administrador", "gerente"].includes(actorRole)) {
      return true;
    }

    if (["senior_accountant", "supervisor"].includes(actorRole)) {
      return user.id === actorId || supervisedUserIds.has(user.id);
    }

    return user.id === actorId;
  });
}

export function createManualTask(payload, actor = "usr_admin") {
  const companies = getCompanies();
  const company = companies.find((item) => item.id === normalizeText(payload.empresaId));
  if (!company) {
    throw createTaskError("Empresa no encontrada.", 404);
  }

  if (company.estadoEmpresa !== COMPANY_STATUS.ACTIVE) {
    throw createTaskError("Solo se pueden crear tareas para empresas activas.", 400);
  }

  const tipoTarea = normalizeText(payload.tipoTarea || "operativa");
  if (!TASK_TYPES.includes(tipoTarea) || tipoTarea === "fiscal") {
    throw createTaskError("El tipo de tarea manual no es valido.", 400);
  }

  const prioridad = normalizeText(payload.prioridad || "media");
  if (!TASK_PRIORITIES.includes(prioridad)) {
    throw createTaskError("La prioridad no es valida.", 400);
  }

  const titulo = normalizeText(payload.titulo);
  const fechaVencimiento = normalizeDate(payload.fechaVencimiento);
  if (!titulo || !fechaVencimiento) {
    throw createTaskError("El titulo y la fecha de vencimiento son obligatorios.", 400);
  }

  const periodicidadProgramada = normalizeText(payload.periodicidadProgramada || payload.periodicidad || "unica_vez");
  const repetirHasta = normalizeDate(payload.repetirHasta);
  const recurringDueDates = buildRecurringDueDates({
    fechaVencimiento,
    periodicidad: periodicidadProgramada,
    repetirHasta
  });
  if (!recurringDueDates.length) {
    throw createTaskError("No fue posible calcular los vencimientos de la tarea.", 400);
  }

  const now = new Date().toISOString();
  const responsableId = assertResponsibleCanAccessCompany(payload.responsableId, company.id);
  const responsibleUser = getUsers().find((user) => user.id === responsableId) || null;
  const baseFechaLimiteInterna = normalizeDate(payload.fechaLimiteInterna);
  const internalOffsetDays = baseFechaLimiteInterna ? dateDiffInDays(fechaVencimiento, baseFechaLimiteInterna) : null;
  const tasks = getCurrentTasks();
  const serieId = recurringDueDates.length > 1 ? createId("serie") : "";
  const createdTasks = recurringDueDates.map((dueDate, index) => ({
    id: createId("task"),
    empresaId: company.id,
    tipoTarea,
    origen: "manual_gerente",
    titulo,
    descripcion: normalizeText(payload.descripcion),
    periodo: normalizeText(payload.periodo),
    anio: payload.anio ? Number(payload.anio) : Number(dueDate.slice(0, 4)),
    fechaVencimiento: dueDate,
    fechaLimiteInterna: internalOffsetDays === null ? "" : addDays(`${dueDate}T00:00:00Z`, internalOffsetDays),
    estadoOperativo: TASK_OPERATIONAL_STATUS.PENDING,
    estadoGeneral: TASK_OPERATIONAL_STATUS.PENDING,
    prioridad,
    responsableId,
    supervisorId: normalizeText(payload.supervisorId || responsibleUser?.supervisorId),
    observaciones: normalizeText(payload.observaciones),
    soporteFiscal: normalizeTaskSupport(payload.soporteFiscal),
    evidencias: [],
    createdAt: now,
    updatedAt: now,
    creadoPor: actor,
    actualizadoPor: actor,
    periodicidadProgramada,
    repetirHasta,
    serieProgramadaId: serieId,
    ordenEnSerie: index + 1
  }));

  tasks.push(...createdTasks);
  saveFiscalTasks(tasks);
  createdTasks.forEach((task) => {
    auditTask(
      "crear_tarea_manual",
      task,
      actor,
      recurringDueDates.length > 1
        ? `Se creo una ocurrencia de tarea recurrente para ${company.razonSocial}.`
        : `Se creo una tarea manual para ${company.razonSocial}.`
    );
  });

  return {
    createdCount: createdTasks.length,
    periodicidadProgramada,
    serieProgramadaId: serieId,
    createdItems: createdTasks.map((task) => buildTaskView(task))
  };
}

export function generateDianComplianceTasks({ companyId, responsableId = "" } = {}, actor = "usr_admin") {
  const organization = getOrganization();
  const audits = getAudits();
  const companies = getCompanies();
  const tasks = getCurrentTasks();
  const currentYear = Number(today().slice(0, 4));
  const duplicateKeys = new Set(
    tasks
      .filter((task) => task.tipoTarea === DIAN_CONTROL_TASK_TYPE && task.controlKey)
      .map((task) =>
        createDianControlTaskKey({
          empresaId: task.empresaId,
          controlKey: task.controlKey,
          periodo: task.periodo,
          anio: task.anio
        })
      )
  );
  const createdTasks = [];
  const omitted = [];
  const duplicates = [];

  const targetCompanies = companyId ? companies.filter((item) => item.id === companyId) : companies;
  if (companyId && targetCompanies.length === 0) {
    throw createTaskError("Empresa no encontrada.", 404);
  }

  for (const company of targetCompanies) {
    if (company.estadoEmpresa !== COMPANY_STATUS.ACTIVE) {
      omitted.push({ empresaId: company.id, codigo: "empresa_no_activa", reason: "La empresa no esta activa." });
      continue;
    }

    const controls = buildDianControlDefinitions(company);
    for (const control of controls) {
      const taskKey = createDianControlTaskKey({
        empresaId: company.id,
        controlKey: control.key,
        periodo: control.periodo,
        anio: currentYear
      });

      if (duplicateKeys.has(taskKey)) {
        duplicates.push({ empresaId: company.id, codigo: "control_duplicado", controlKey: control.key });
        continue;
      }

      const now = new Date().toISOString();
      const resolvedResponsibleId = assertResponsibleCanAccessCompany(responsableId, company.id) || "";
      const responsibleUser = getUsers().find((user) => user.id === resolvedResponsibleId) || null;
      const task = {
        id: createId("task"),
        empresaId: company.id,
        tipoTarea: DIAN_CONTROL_TASK_TYPE,
        origen: DIAN_CONTROL_ORIGIN,
        controlKey: control.key,
        titulo: control.titulo,
        descripcion: control.descripcion,
        periodo: control.periodo,
        anio: currentYear,
        fechaVencimiento: addDays(now, control.diasVencimiento),
        fechaLimiteInterna: addDays(now, Math.max(1, control.diasVencimiento - 2)),
        estadoOperativo: TASK_OPERATIONAL_STATUS.PENDING,
        estadoGeneral: TASK_OPERATIONAL_STATUS.PENDING,
        prioridad: control.prioridad,
        responsableId: resolvedResponsibleId,
        supervisorId: normalizeText(responsibleUser?.supervisorId),
        observaciones: "",
        soporteFiscal: normalizeTaskSupport(),
        evidencias: [],
        createdAt: now,
        updatedAt: now,
        creadoPor: actor,
        actualizadoPor: actor
      };

      tasks.push(task);
      duplicateKeys.add(taskKey);
      createdTasks.push(task);
      audits.push(
        createAuditEntry({
          organizacionId: organization.id,
          usuarioId: actor,
          accion: "generar_control_dian",
          modulo: "tareas",
          recursoTipo: "tarea",
          recursoId: task.id,
          descripcion: `Se genero el control DIAN ${control.titulo} para ${company.razonSocial}.`,
          valorNuevo: clone(task)
        })
      );
    }
  }

  saveFiscalTasks(tasks);
  saveAudits(audits);

  return {
    generatedAt: new Date().toISOString(),
    createdCount: createdTasks.length,
    omittedCount: omitted.length,
    duplicateCount: duplicates.length,
    createdItems: createdTasks.map((task) => buildTaskView(task)),
    omitted,
    duplicates
  };
}

function updateTask(taskId, actor, updater, auditAction, auditDescription) {
  const tasks = getCurrentTasks();
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    throw createTaskError("Tarea no encontrada.", 404);
  }

  const previous = clone(task);
  updater(task);
  task.updatedAt = new Date().toISOString();
  task.actualizadoPor = actor;
  saveFiscalTasks(tasks);
  auditTask(auditAction, task, actor, auditDescription || `Se actualizo la tarea ${task.titulo || task.id}.`, previous);
  return buildTaskView(task);
}

export function updateTaskStatus(taskId, status, payload = {}, actor = "usr_admin") {
  const normalizedStatus = normalizeText(status);
  if (!TASK_GENERAL_STATUS.includes(normalizedStatus)) {
    throw createTaskError("El estado de tarea no es valido.", 400);
  }

  return updateTask(
    taskId,
    actor,
    (task) => {
      if (normalizedStatus === TASK_OPERATIONAL_STATUS.IN_PROGRESS && !task.responsableId) {
        task.responsableId = actor;
      }
      task.observaciones = normalizeText(payload.observaciones ?? task.observaciones);
      setTaskStatus(task, normalizedStatus, actor);
    },
    "cambiar_estado_tarea",
    `Se cambio el estado de la tarea a ${normalizedStatus}.`
  );
}

export function updateTaskWorkflowStage(taskId, workflowStage, payload = {}, actor = "usr_admin") {
  return updateTask(
    taskId,
    actor,
    (task) => {
      if (!isWorkflowManagedTask(task)) {
        throw createTaskError("La tarea no maneja flujo de trabajo detallado.", 400);
      }

      const nextStage = resolveWorkflowStage(task, workflowStage, getTaskStatus(task));
      task.observaciones = normalizeText(payload.observaciones ?? task.observaciones);
      task.etapaGestion = nextStage;

      if (nextStage === "cancelada") {
        setTaskStatus(task, TASK_OPERATIONAL_STATUS.CANCELED, actor);
        return;
      }

      if (nextStage === "no_aplica") {
        setTaskStatus(task, TASK_OPERATIONAL_STATUS.NOT_APPLICABLE, actor);
        return;
      }

      if (nextStage === "presentada") {
        setTaskStatus(task, TASK_OPERATIONAL_STATUS.PRESENTED, actor);
        return;
      }

      if (nextStage === "pagada" || nextStage === "completada") {
        setTaskStatus(task, TASK_OPERATIONAL_STATUS.COMPLETED, actor);
        return;
      }

      const dueDate = normalizeDate(task.fechaVencimiento);
      const isPastDue = dueDate && dueDate < today();
      setTaskStatus(task, isPastDue ? TASK_OPERATIONAL_STATUS.OVERDUE : TASK_OPERATIONAL_STATUS.IN_PROGRESS, actor);
      task.etapaGestion = nextStage;
    },
    "actualizar_flujo_tarea",
    `Se actualizo la etapa de trabajo a ${normalizeText(workflowStage)}.`
  );
}

export function updateTaskSupport(taskId, payload = {}, actor = "usr_admin") {
  return updateTask(
    taskId,
    actor,
    (task) => {
      task.soporteFiscal = normalizeTaskSupport({
        ...task.soporteFiscal,
        ...payload
      });
      task.observaciones = normalizeText(payload.observaciones ?? task.observaciones);
    },
    "actualizar_soporte_tarea",
    "Se actualizo el soporte operativo de la tarea."
  );
}

export function assignTask(taskId, responsableId, actor = "usr_admin") {
  return updateTask(
    taskId,
    actor,
    (task) => {
      const normalizedResponsibleId = assertResponsibleCanAccessCompany(responsableId, task.empresaId);
      task.responsableId = normalizedResponsibleId;
      const responsibleUser = getUsers().find((user) => user.id === normalizedResponsibleId) || null;
      task.supervisorId = normalizeText(responsibleUser?.supervisorId);
    },
    "reasignar_tarea",
    "Se actualizo el responsable de la tarea."
  );
}

export function bulkAssignTasks(taskIds = [], responsableId, actor = "usr_admin") {
  const normalizedTaskIds = Array.from(new Set((Array.isArray(taskIds) ? taskIds : []).map(normalizeText).filter(Boolean)));
  if (!normalizedTaskIds.length) {
    throw createTaskError("Debes seleccionar al menos una tarea para reasignar.", 400);
  }

  if (normalizedTaskIds.length > 200) {
    throw createTaskError("Puedes reasignar maximo 200 tareas por operacion.", 400);
  }

  const tasks = getCurrentTasks();
  const updatedItems = [];
  const skipped = [];

  for (const taskId of normalizedTaskIds) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      skipped.push({ taskId, reason: "Tarea no encontrada." });
      continue;
    }

    if (CLOSED_STATUSES.has(getTaskStatus(task))) {
      skipped.push({ taskId, reason: "La tarea ya esta cerrada." });
      continue;
    }

    const previous = clone(task);
    task.responsableId = assertResponsibleCanAccessCompany(responsableId, task.empresaId);
    const responsibleUser = getUsers().find((user) => user.id === task.responsableId) || null;
    task.supervisorId = normalizeText(responsibleUser?.supervisorId);
    task.updatedAt = new Date().toISOString();
    task.actualizadoPor = actor;
    updatedItems.push({ task, previous });
  }

  if (!updatedItems.length) {
    throw createTaskError("No habia tareas abiertas para reasignar.", 400);
  }

  saveFiscalTasks(tasks);
  updatedItems.forEach(({ task, previous }) => {
    auditTask(
      "reasignar_tareas_masivo",
      task,
      actor,
      "Se reasigno la tarea desde una operacion masiva.",
      previous
    );
  });

  return {
    updatedCount: updatedItems.length,
    skippedCount: skipped.length,
    skipped,
    items: updatedItems.map(({ task }) => buildTaskView(task))
  };
}

export function updateTaskClientBlock(taskId, payload = {}, actor = "usr_admin") {
  const requestedStatus = normalizeText(payload.estado);
  const blocked = payload.activo === false || requestedStatus === "cerrado"
    ? false
    : payload.activo === true || requestedStatus === "abierto";
  return updateTask(
    taskId,
    actor,
    (task) => {
      task.bloqueoCliente = normalizeClientBlock({
        ...task.bloqueoCliente,
        estado: blocked ? "abierto" : "cerrado",
        activo: blocked,
        motivo: blocked ? payload.motivo : task.bloqueoCliente?.motivo,
        solicitadoA: blocked ? payload.solicitadoA : task.bloqueoCliente?.solicitadoA,
        fechaBloqueo: blocked ? today() : task.bloqueoCliente?.fechaBloqueo,
        fechaResolucion: blocked ? "" : today(),
        actualizadoPor: actor
      });

      const note = normalizeText(payload.observaciones || payload.motivo);
      if (note) {
        task.observaciones = normalizeText(task.observaciones)
          ? `${normalizeText(task.observaciones)} | Cliente: ${note}`
          : `Cliente: ${note}`;
      }
    },
    blocked ? "bloquear_tarea_por_cliente" : "resolver_bloqueo_cliente_tarea",
    blocked
      ? "Se marco la tarea como bloqueada por informacion o pago del cliente."
      : "Se resolvio el bloqueo por cliente de la tarea."
  );
}

export function closeTask(taskId, payload = {}, actor = "usr_admin") {
  const status = normalizeText(payload.estado || TASK_OPERATIONAL_STATUS.COMPLETED);
  if (![TASK_OPERATIONAL_STATUS.PRESENTED, TASK_OPERATIONAL_STATUS.COMPLETED].includes(status)) {
    throw createTaskError("Solo se puede cerrar una tarea como presentada o completada.", 400);
  }

  return updateTask(
    taskId,
    actor,
    (task) => {
      task.observaciones = normalizeText(payload.observaciones ?? task.observaciones);
      setTaskStatus(task, status, actor);
    },
    "cerrar_tarea",
    `Se cerro la tarea como ${status}.`
  );
}
