const COMPANY_STATES = new Set(["borrador", "pendiente_revision", "activa", "suspendida", "inactiva", "archivada"]);
const USER_STATES = new Set(["activo", "inactivo"]);
const OBLIGATION_STATES = new Set([
  "sugerida",
  "activa",
  "confirmada",
  "pendiente_revision",
  "no_aplica",
  "inactiva",
  "suspendida_por_empresa",
  "inactiva_por_empresa"
]);
const CALENDAR_STATES = new Set(["borrador", "validado", "activo", "reemplazado", "anulado"]);
const TASK_STATES = new Set(["pendiente", "en_proceso", "presentada", "completada", "vencida", "cancelada", "no_aplica"]);
const ALERT_LEVELS = new Set(["informativa", "preventiva", "critica"]);
const ALERT_STATES = new Set(["no_leida", "leida", "atendida", "descartada"]);

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeIdentityText(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeNullableInteger(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? String(parsed) : `invalid:${normalizeText(value)}`;
}

function calendarInstallmentKey(calendar) {
  const number = normalizeNullableInteger(calendar?.numeroCuota);
  if (number) {
    return `numero:${number}`;
  }
  const name = normalizeIdentityText(calendar?.nombreCuota);
  return name ? `nombre:${name}` : "";
}

export function buildFiscalCalendarIdentityParts(calendar, organizationId = "") {
  return [
    normalizeText(calendar?.organizacionId || organizationId),
    normalizeText(calendar?.impuestoId),
    normalizeNullableInteger(calendar?.anio),
    normalizeIdentityText(calendar?.periodo),
    normalizeIdentityText(calendar?.periodicidad),
    normalizeIdentityText(calendar?.nivel),
    normalizeIdentityText(calendar?.pais || "COLOMBIA"),
    normalizeIdentityText(calendar?.municipioCiudad || calendar?.municipio),
    normalizeIdentityText(calendar?.departamento),
    normalizeIdentityText(calendar?.criterioVencimiento),
    normalizeIdentityText(calendar?.ultimoDigitoNit),
    normalizeIdentityText(calendar?.rangoUltimosDigitosNit),
    normalizeIdentityText(calendar?.digitoVerificacion),
    normalizeIdentityText(calendar?.tipoContribuyente),
    normalizeIdentityText(calendar?.regimen),
    normalizeIdentityText(calendar?.eventoFiscalClave),
    normalizeIdentityText(calendar?.tipoPago),
    calendarInstallmentKey(calendar),
    normalizeNullableInteger(calendar?.version || 1)
  ];
}

export function buildFiscalCalendarIdentityKey(calendar, organizationId = "") {
  return buildFiscalCalendarIdentityParts(calendar, organizationId).join("|");
}

function addRequiredIssue(issues, collectionName, item, fields) {
  const missing = fields.filter((field) => {
    const value = item?.[field];
    return value === null || value === undefined || normalizeText(value) === "";
  });
  if (missing.length > 0) {
    issues.push(`${collectionName} ${item?.id || "<sin-id>"} tiene campos obligatorios faltantes: ${missing.join(", ")}.`);
  }
}

function addCheckIssue(issues, collectionName, item, field, allowed) {
  if (!allowed.has(normalizeText(item?.[field]))) {
    issues.push(
      `${collectionName} ${item?.id || "<sin-id>"} viola CHECK ${field}: ${normalizeText(item?.[field]) || "<vacio>"}.`
    );
  }
}

function findDuplicateIssues(items, collectionName, keyBuilder) {
  const grouped = new Map();
  for (const item of items || []) {
    const key = keyBuilder(item);
    grouped.set(key, [...(grouped.get(key) || []), item?.id || "<sin-id>"]);
  }
  return [...grouped.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([key, ids]) => `${collectionName} colisiona en una restriccion unica (${ids.join(", ")}): ${key}.`);
}

function isIsoDate(value) {
  const normalized = normalizeText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return false;
  }
  const date = new Date(`${normalized}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === normalized;
}

export function prepareMigrationData(sourceData) {
  const organizationId = normalizeText(sourceData?.organization?.id);
  return {
    ...sourceData,
    fiscalCalendars: (sourceData?.fiscalCalendars || []).map((calendar) => ({
      ...calendar,
      organizacionId: normalizeText(calendar?.organizacionId) || organizationId
    }))
  };
}

export function validateMigrationData(sourceData) {
  const data = prepareMigrationData(sourceData);
  const issues = [];
  const organizationId = normalizeText(data?.organization?.id);
  const companies = data.companies || [];
  const users = data.users || [];
  const taxes = data.taxes || [];
  const documents = data.documents || [];
  const extractions = data.extractions || [];
  const obligations = data.companyObligations || [];
  const calendars = data.fiscalCalendars || [];
  const calendarVersions = data.fiscalCalendarVersions || [];
  const tasks = data.fiscalTasks || [];
  const alerts = data.internalAlerts || [];
  const audits = data.audits || [];
  const sessions = data.sessions || [];

  addRequiredIssue(issues, "organization", data.organization, ["id", "nombre", "estado"]);
  companies.forEach((item) => {
    addRequiredIssue(issues, "companies", item, ["id", "nit", "dv", "razonSocial", "estadoEmpresa"]);
    addCheckIssue(issues, "companies", item, "estadoEmpresa", COMPANY_STATES);
  });
  users.forEach((item) => {
    addRequiredIssue(issues, "users", item, ["id", "email", "estado"]);
    addCheckIssue(issues, "users", item, "estado", USER_STATES);
  });
  documents.forEach((item) => addRequiredIssue(issues, "documents", item, ["id", "tipoDocumento"]));
  extractions.forEach((item) =>
    addRequiredIssue(issues, "extractions", item, ["id", "estadoExtraccion"])
  );
  taxes.forEach((item) => addRequiredIssue(issues, "taxes", item, ["id", "codigo", "nombre", "nivel", "estado"]));
  (data.taxRules || []).forEach((item) =>
    addRequiredIssue(issues, "taxRules", item, ["id", "codigoResponsabilidadRut", "estado"])
  );
  (data.inferredTaxRules || []).forEach((item) =>
    addRequiredIssue(issues, "inferredTaxRules", item, ["id", "estado"])
  );
  obligations.forEach((item) => {
    addRequiredIssue(issues, "companyObligations", item, ["id", "empresaId", "impuestoId", "estado"]);
    addCheckIssue(issues, "companyObligations", item, "estado", OBLIGATION_STATES);
  });
  calendars.forEach((item) => {
    addRequiredIssue(issues, "fiscalCalendars", item, [
      "id",
      "organizacionId",
      "impuestoId",
      "anio",
      "periodo",
      "periodicidad",
      "nivel",
      "estado",
      "fechaVencimiento"
    ]);
    addCheckIssue(issues, "fiscalCalendars", item, "estado", CALENDAR_STATES);
    if (!Number.isInteger(Number(item?.anio))) {
      issues.push(`fiscalCalendars ${item?.id || "<sin-id>"} tiene anio invalido.`);
    }
    if (item?.version !== undefined && item?.version !== null && !Number.isInteger(Number(item.version))) {
      issues.push(`fiscalCalendars ${item?.id || "<sin-id>"} tiene version invalida.`);
    }
    if (!isIsoDate(item?.fechaVencimiento)) {
      issues.push(`fiscalCalendars ${item?.id || "<sin-id>"} tiene fechaVencimiento invalida.`);
    }
  });
  calendarVersions.forEach((item) =>
    addRequiredIssue(issues, "fiscalCalendarVersions", item, ["id", "calendarioFiscalId", "version"])
  );
  tasks.forEach((item) => {
    addRequiredIssue(issues, "fiscalTasks", item, ["id", "empresaId", "tipoTarea"]);
    const state = item?.estadoOperativo || item?.estadoGeneral;
    if (!TASK_STATES.has(normalizeText(state))) {
      issues.push(`fiscalTasks ${item?.id || "<sin-id>"} viola CHECK estado_operativo: ${normalizeText(state) || "<vacio>"}.`);
    }
  });
  alerts.forEach((item) => {
    addRequiredIssue(issues, "internalAlerts", item, ["id", "tipo", "nivel", "estado"]);
    addCheckIssue(issues, "internalAlerts", item, "nivel", ALERT_LEVELS);
    addCheckIssue(issues, "internalAlerts", item, "estado", ALERT_STATES);
  });
  audits.forEach((item) => addRequiredIssue(issues, "audits", item, ["id"]));
  sessions.forEach((item) => addRequiredIssue(issues, "sessions", item, ["token"]));

  const ids = {
    companies: new Set(companies.map((item) => item.id)),
    users: new Set(users.map((item) => item.id)),
    taxes: new Set(taxes.map((item) => item.id)),
    documents: new Set(documents.map((item) => item.id)),
    extractions: new Set(extractions.map((item) => item.id)),
    obligations: new Set(obligations.map((item) => item.id)),
    calendars: new Set(calendars.map((item) => item.id)),
    tasks: new Set(tasks.map((item) => item.id))
  };
  const requireReference = (collection, item, field, targetSet) => {
    const value = normalizeText(item?.[field]);
    if (value && !targetSet.has(value)) {
      issues.push(`${collection} ${item?.id || "<sin-id>"} referencia ${field} inexistente: ${value}.`);
    }
  };

  users.forEach((item) => requireReference("users", item, "supervisorId", ids.users));
  companies.forEach((item) => requireReference("companies", item, "documentoRutId", ids.documents));
  documents.forEach((item) => {
    requireReference("documents", item, "empresaId", ids.companies);
    requireReference("documents", item, "extractionId", ids.extractions);
  });
  extractions.forEach((item) => {
    requireReference("extractions", item, "empresaId", ids.companies);
    requireReference("extractions", item, "documentoId", ids.documents);
  });
  (data.taxRules || []).forEach((item) =>
    requireReference("taxRules", item, "impuestoId", ids.taxes)
  );
  (data.inferredTaxRules || []).forEach((item) =>
    requireReference("inferredTaxRules", item, "impuestoId", ids.taxes)
  );
  obligations.forEach((item) => {
    requireReference("companyObligations", item, "empresaId", ids.companies);
    requireReference("companyObligations", item, "impuestoId", ids.taxes);
    requireReference("companyObligations", item, "confirmadoPorUsuario", ids.users);
  });
  calendars.forEach((item) => {
    requireReference("fiscalCalendars", item, "impuestoId", ids.taxes);
    if (item.organizacionId !== organizationId) {
      issues.push(`fiscalCalendars ${item.id || "<sin-id>"} referencia organizacionId inexistente: ${item.organizacionId}.`);
    }
  });
  calendarVersions.forEach((item) => {
    requireReference("fiscalCalendarVersions", item, "calendarioFiscalId", ids.calendars);
    requireReference("fiscalCalendarVersions", item, "cambiadoPor", ids.users);
  });
  tasks.forEach((item) => {
    requireReference("fiscalTasks", item, "empresaId", ids.companies);
    requireReference("fiscalTasks", item, "responsableId", ids.users);
    requireReference("fiscalTasks", item, "supervisorId", ids.users);
    requireReference("fiscalTasks", item, "obligacionFiscalEmpresaId", ids.obligations);
    requireReference("fiscalTasks", item, "calendarioFiscalId", ids.calendars);
    requireReference("fiscalTasks", item, "impuestoId", ids.taxes);
  });
  alerts.forEach((item) => {
    requireReference("internalAlerts", item, "tareaId", ids.tasks);
    requireReference("internalAlerts", item, "empresaId", ids.companies);
    requireReference("internalAlerts", item, "responsableId", ids.users);
  });
  audits.forEach((item) => {
    requireReference("audits", item, "usuarioId", ids.users);
    const auditOrganizationId = normalizeText(item?.organizacionId);
    if (auditOrganizationId && auditOrganizationId !== organizationId) {
      issues.push(`audits ${item.id || "<sin-id>"} referencia organizacionId inexistente: ${auditOrganizationId}.`);
    }
  });
  sessions.forEach((item) => requireReference("sessions", item, "userId", ids.users));

  const idCollections = {
    companies,
    users,
    taxes,
    documents,
    extractions,
    companyObligations: obligations,
    fiscalCalendars: calendars,
    fiscalCalendarVersions: calendarVersions,
    fiscalTasks: tasks,
    internalAlerts: alerts,
    audits,
    sessions
  };
  for (const [name, items] of Object.entries(idCollections)) {
    issues.push(...findDuplicateIssues(items, `${name}.id`, (item) => normalizeText(item?.id || item?.token)));
  }
  issues.push(...findDuplicateIssues(users, "users.email", (item) => normalizeIdentityText(item?.email)));
  issues.push(...findDuplicateIssues(taxes, "taxes.codigo", (item) => normalizeIdentityText(item?.codigo)));
  issues.push(
    ...findDuplicateIssues(companies, "companies.nit_dv", (item) => `${normalizeText(item?.nit)}|${normalizeText(item?.dv)}`)
  );
  issues.push(
    ...findDuplicateIssues(calendars, "fiscal_calendars_unique_scope", (item) =>
      buildFiscalCalendarIdentityKey(item, organizationId)
    )
  );
  issues.push(
    ...findDuplicateIssues(
      documents.filter((item) => normalizeText(item?.extractionId)),
      "documents.extraction_id",
      (item) => normalizeText(item?.extractionId)
    )
  );
  issues.push(
    ...findDuplicateIssues(
      extractions.filter((item) => normalizeText(item?.documentoId)),
      "document_extractions.documento_id",
      (item) => normalizeText(item?.documentoId)
    )
  );
  issues.push(
    ...findDuplicateIssues(
      obligations.filter((item) =>
        new Set(["activa", "confirmada", "pendiente_revision", "sugerida"]).has(normalizeText(item?.estado))
      ),
      "company_obligations_active_unique",
      (item) =>
        [
          normalizeText(item?.empresaId),
          normalizeText(item?.impuestoId),
          normalizeText(item?.periodicidadAplicable || item?.periodicidad),
          normalizeText(item?.municipioAplicacion),
          normalizeText(item?.departamentoAplicacion),
          normalizeText(item?.eventoFiscalClave)
        ].join("|")
    )
  );
  issues.push(
    ...findDuplicateIssues(
      tasks.filter((item) => normalizeText(item?.tipoTarea) === "fiscal"),
      "fiscal_tasks_unique_operational_scope",
      (item) =>
        [
          normalizeText(item?.empresaId),
          normalizeText(item?.obligacionFiscalEmpresaId),
          normalizeText(item?.calendarioFiscalId),
          normalizeText(item?.periodo),
          normalizeNullableInteger(item?.anio) || "0",
          normalizeText(item?.cumplimientoFiscal || "general")
        ].join("|")
    )
  );
  issues.push(
    ...findDuplicateIssues(
      alerts.filter((item) => normalizeText(item?.conditionHash)),
      "alerts_condition_unique",
      (item) => normalizeText(item?.conditionHash)
    )
  );

  return { data, issues };
}
