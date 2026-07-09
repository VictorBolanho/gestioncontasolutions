import {
  COMPANY_STATUS,
  createAuditEntry,
  getCompanyEffectiveTaxProfile,
  NON_OPERATIONAL_COMPANY_STATUSES
} from "../../../../packages/domain/index.js";
import {
  getAudits,
  getCompanies,
  getCompanyObligations,
  getFiscalCalendars,
  getFiscalTasks,
  getInferredTaxRules,
  getOrganization,
  getTaxRules,
  getTaxes,
  saveAudits,
  saveCompanyObligations,
  saveInferredTaxRules,
  saveTaxes
} from "./storage.js";

export const COMPANY_OBLIGATION_STATUS = Object.freeze({
  SUGGESTED: "sugerida",
  ACTIVE: "activa",
  PENDING_REVIEW: "pendiente_revision",
  NOT_APPLICABLE: "no_aplica",
  INACTIVE: "inactiva"
});

const TAX_LEVELS = new Set(["nacional", "departamental", "municipal", "contable", "comercial"]);
const TAX_PERIODICITIES = new Set([
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

const FISCAL_EVENT_CATALOG = Object.freeze({
  tax_rst: Object.freeze({
    defaultKey: "anticipo_bimestral",
    items: Object.freeze({
      anticipo_bimestral: Object.freeze({
        key: "anticipo_bimestral",
        label: "Anticipo bimestral RST",
        periodicidad: "bimestral"
      }),
      declaracion_anual_consolidada: Object.freeze({
        key: "declaracion_anual_consolidada",
        label: "Declaracion anual consolidada RST",
        periodicidad: "anual"
      }),
      consolidada_iva: Object.freeze({
        key: "consolidada_iva",
        label: "Consolidada IVA RST",
        periodicidad: "anual"
      })
    })
  })
});

function createObligationActionError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeBoolean(value) {
  return value === true || value === "true" || value === "on";
}

function inferLegacyTaxDefaults(payload = {}, fallback = {}) {
  const code = normalizeText(payload.codigo || fallback.codigo).toUpperCase();
  const level = normalizeText(payload.nivel || fallback.nivel);

  const inferred = {
    periodicidadDefault: "anual",
    requiereMunicipio: level === "municipal",
    requiereDepartamento: level === "departamental",
    aplicaPorNit: false,
    aplicaPorDv: false
  };

  if (code === "RET_FTE") {
    inferred.periodicidadDefault = "mensual";
    inferred.aplicaPorNit = true;
  } else if (code === "GMF") {
    inferred.periodicidadDefault = "semanal";
    inferred.aplicaPorNit = false;
  } else if (code === "IVA") {
    inferred.periodicidadDefault = "bimestral";
    inferred.aplicaPorNit = true;
  } else if (code === "ICA") {
    inferred.periodicidadDefault = "bimestral";
    inferred.requiereMunicipio = true;
    inferred.aplicaPorNit = true;
  } else if (code === "RST") {
    inferred.periodicidadDefault = "bimestral";
    inferred.aplicaPorNit = true;
  } else if (code === "CONSUMO" || code === "CARBONO") {
    inferred.periodicidadDefault = "bimestral";
    inferred.aplicaPorNit = true;
  } else if (code === "GAS_ACPM") {
    inferred.periodicidadDefault = "mensual";
    inferred.aplicaPorNit = true;
  } else if (code === "RENTA_ORD" || code === "PATRIMONIO" || code === "EXOGENA") {
    inferred.periodicidadDefault = "anual";
    inferred.aplicaPorNit = true;
  }

  return inferred;
}

function normalizeTaxRecord(payload = {}, fallback = {}) {
  const inferred = inferLegacyTaxDefaults(payload, fallback);
  return {
    id: payload.id || fallback.id,
    codigo: normalizeText(payload.codigo || fallback.codigo),
    nombre: normalizeText(payload.nombre || fallback.nombre),
    nivel: normalizeText(payload.nivel || fallback.nivel),
    descripcion: normalizeText(payload.descripcion || fallback.descripcion),
    periodicidadDefault: normalizeText(payload.periodicidadDefault || fallback.periodicidadDefault || inferred.periodicidadDefault),
    requiereMunicipio: normalizeBoolean(
      payload.requiereMunicipio !== undefined
        ? payload.requiereMunicipio
        : fallback.requiereMunicipio !== undefined
          ? fallback.requiereMunicipio
          : inferred.requiereMunicipio
    ),
    requiereDepartamento: normalizeBoolean(
      payload.requiereDepartamento !== undefined
        ? payload.requiereDepartamento
        : fallback.requiereDepartamento !== undefined
          ? fallback.requiereDepartamento
          : inferred.requiereDepartamento
    ),
    aplicaPorNit: normalizeBoolean(
      payload.aplicaPorNit !== undefined ? payload.aplicaPorNit : fallback.aplicaPorNit !== undefined ? fallback.aplicaPorNit : inferred.aplicaPorNit
    ),
    aplicaPorDv: normalizeBoolean(
      payload.aplicaPorDv !== undefined ? payload.aplicaPorDv : fallback.aplicaPorDv !== undefined ? fallback.aplicaPorDv : inferred.aplicaPorDv
    ),
    enteAdministrador: normalizeText(payload.enteAdministrador || fallback.enteAdministrador || "DIAN"),
    fuenteNormativa: normalizeText(payload.fuenteNormativa || fallback.fuenteNormativa),
    estado: normalizeText(payload.estado || fallback.estado || "activo"),
    createdAt: payload.createdAt || fallback.createdAt,
    updatedAt: payload.updatedAt || fallback.updatedAt
  };
}

function validateTaxRecord(tax, existingTaxes, currentTaxId = null) {
  const errors = [];

  if (!tax.codigo) {
    errors.push("El codigo del impuesto es obligatorio.");
  }

  if (!tax.nombre) {
    errors.push("El nombre del impuesto es obligatorio.");
  }

  if (!tax.nivel || !TAX_LEVELS.has(tax.nivel)) {
    errors.push("El nivel del impuesto es obligatorio.");
  }

  if (!tax.periodicidadDefault || !TAX_PERIODICITIES.has(tax.periodicidadDefault)) {
    errors.push("La periodicidad default del impuesto es obligatoria.");
  }

  if (!tax.estado) {
    errors.push("El estado del impuesto es obligatorio.");
  }

  const normalizedCode = tax.codigo.toLowerCase();
  const duplicated = existingTaxes.some(
    (item) => item.id !== currentTaxId && normalizeText(item.codigo).toLowerCase() === normalizedCode
  );

  if (duplicated) {
    errors.push("Ya existe un impuesto con el mismo codigo.");
  }

  if (errors.length > 0) {
    throw createObligationActionError(errors.join(" "), 400);
  }
}

function normalizeFiscalEventKey(value) {
  return normalizeText(value).toLowerCase();
}

function getFiscalEventCatalog(taxId) {
  return FISCAL_EVENT_CATALOG[normalizeText(taxId)] || null;
}

function resolveFiscalEvent(taxId, eventKey = "") {
  const catalog = getFiscalEventCatalog(taxId);
  const normalizedKey = normalizeFiscalEventKey(eventKey || catalog?.defaultKey);
  if (!catalog || !normalizedKey) {
    return {
      key: normalizedKey,
      label: "",
      periodicidad: ""
    };
  }

  const matched = catalog.items[normalizedKey];
  if (!matched) {
    return {
      key: normalizedKey,
      label: "",
      periodicidad: ""
    };
  }

  return {
    key: matched.key,
    label: matched.label,
    periodicidad: matched.periodicidad || ""
  };
}

function createObligationKey(empresaId, impuestoId, codigoResponsabilidadRut, municipioAplicacion, eventoFiscalClave = "") {
  return [
    empresaId,
    impuestoId,
    codigoResponsabilidadRut || "sin_codigo",
    municipioAplicacion || "sin_municipio",
    normalizeFiscalEventKey(eventoFiscalClave) || "sin_evento"
  ].join("|");
}

function isOperationallyBlocked(company) {
  return NON_OPERATIONAL_COMPANY_STATUSES.has(company.estadoEmpresa);
}

function normalizeObligationStatus(value) {
  return normalizeText(value || COMPANY_OBLIGATION_STATUS.PENDING_REVIEW);
}

function shouldPreventManualDuplicate(existing, payload) {
  const activeLike = new Set([
    COMPANY_OBLIGATION_STATUS.ACTIVE,
    COMPANY_OBLIGATION_STATUS.SUGGESTED,
    COMPANY_OBLIGATION_STATUS.PENDING_REVIEW
  ]);

  return (
    existing.empresaId === payload.empresaId &&
    existing.impuestoId === payload.impuestoId &&
    normalizeText(existing.nivel) === normalizeText(payload.nivel) &&
    normalizeText(existing.departamentoAplicacion) === normalizeText(payload.departamentoAplicacion) &&
    normalizeText(existing.municipioAplicacion) === normalizeText(payload.municipioAplicacion) &&
    normalizeText(existing.periodicidadAplicable || existing.periodicidad) === normalizeText(payload.periodicidadAplicable) &&
    normalizeFiscalEventKey(existing.eventoFiscalClave) === normalizeFiscalEventKey(payload.eventoFiscalClave) &&
    activeLike.has(normalizeObligationStatus(existing.estado))
  );
}

function normalizeMatchText(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function responsibilityCodes(profile) {
  return new Set((profile.responsabilidadesTributarias || []).map((item) => normalizeText(item.codigo)));
}

function profileHasSimilarObligation(existingObligations, companyId, taxId, municipioAplicacion = "", eventoFiscalClave = "") {
  return existingObligations.some(
    (item) =>
      item.empresaId === companyId &&
      item.impuestoId === taxId &&
      normalizeText(item.municipioAplicacion || "") === normalizeText(municipioAplicacion || "") &&
      normalizeFiscalEventKey(item.eventoFiscalClave) === normalizeFiscalEventKey(eventoFiscalClave) &&
      [
        COMPANY_OBLIGATION_STATUS.SUGGESTED,
        COMPANY_OBLIGATION_STATUS.PENDING_REVIEW,
        COMPANY_OBLIGATION_STATUS.ACTIVE
      ].includes(normalizeObligationStatus(item.estado))
  );
}

function matchesInferredCriteria(profile, criterios = {}) {
  const profileTipoPersona = normalizeMatchText(profile.tipoPersona);
  const profileRegimen = normalizeMatchText(profile.regimenTributario);
  const profileCiiu = normalizeText(profile.actividadEconomicaPrincipalCodigo || profile.actividadEconomicaPrincipal);

  if (Array.isArray(criterios.tipoPersonaIn) && criterios.tipoPersonaIn.length > 0) {
    const allowed = criterios.tipoPersonaIn.map((item) => normalizeMatchText(item));
    if (!allowed.includes(profileTipoPersona)) {
      return false;
    }
  }

  if (Array.isArray(criterios.regimenIncludesAny) && criterios.regimenIncludesAny.length > 0) {
    const matchesRegimen = criterios.regimenIncludesAny.some((item) => profileRegimen.includes(normalizeMatchText(item)));
    if (!matchesRegimen) {
      return false;
    }
  }

  if (Array.isArray(criterios.regimenExcludesAny) && criterios.regimenExcludesAny.length > 0) {
    const excluded = criterios.regimenExcludesAny.some((item) => profileRegimen.includes(normalizeMatchText(item)));
    if (excluded) {
      return false;
    }
  }

  if (criterios.municipioRequired && !normalizeText(profile.municipio)) {
    return false;
  }

  if (criterios.departamentoRequired && !normalizeText(profile.departamento)) {
    return false;
  }

  if (Array.isArray(criterios.boolFlagsAny) && criterios.boolFlagsAny.length > 0) {
    const hasAny = criterios.boolFlagsAny.some((flag) => profile[flag] === true);
    if (!hasAny) {
      return false;
    }
  }

  if (Array.isArray(criterios.boolFlagsAll) && criterios.boolFlagsAll.length > 0) {
    const hasAll = criterios.boolFlagsAll.every((flag) => profile[flag] === true);
    if (!hasAll) {
      return false;
    }
  }

  if (Array.isArray(criterios.responsabilidadRutIn) && criterios.responsabilidadRutIn.length > 0) {
    const codes = responsibilityCodes(profile);
    const hasResponsibility = criterios.responsabilidadRutIn.some((code) => codes.has(normalizeText(code)));
    if (!hasResponsibility) {
      return false;
    }
  }

  if (Array.isArray(criterios.ciiuPrefixes) && criterios.ciiuPrefixes.length > 0) {
    const matchesCiiu = criterios.ciiuPrefixes.some((prefix) => profileCiiu.startsWith(normalizeText(prefix)));
    if (!matchesCiiu) {
      return false;
    }
  }

  return true;
}

function hasPresentedHistoryForObligation(obligationId) {
  return getFiscalTasks().some(
    (task) =>
      task.obligacionFiscalEmpresaId === obligationId &&
      (
        normalizeText(task.estadoPresentacion) !== "pendiente_presentacion" ||
        normalizeText(task.estadoGeneral) === "completada"
      )
  );
}

function canPropagatePeriodicityToObligation(obligation, previousPeriodicity) {
  const currentPeriodicity = normalizeText(obligation.periodicidadAplicable || obligation.periodicidad);
  if (!currentPeriodicity || currentPeriodicity !== normalizeText(previousPeriodicity)) {
    return false;
  }

  return !hasPresentedHistoryForObligation(obligation.id);
}

export function previewTaxUpdateImpact(taxId, payload = {}) {
  const taxes = getTaxes();
  const tax = taxes.find((item) => item.id === taxId);

  if (!tax) {
    throw createObligationActionError("Impuesto no encontrado.", 404);
  }

  const current = normalizeTaxRecord(tax, tax);
  const next = normalizeTaxRecord(
    {
      ...tax,
      ...payload,
      id: tax.id,
      createdAt: tax.createdAt,
      updatedAt: tax.updatedAt
    },
    tax
  );

  const obligations = getCompanyObligations().filter((item) => item.impuestoId === taxId);
  const companies = getCompanies();
  const activeCalendars = getFiscalCalendars().filter(
    (calendar) => calendar.impuestoId === taxId && normalizeText(calendar.estado) === "activo"
  );
  const periodicityChanged = normalizeText(current.periodicidadDefault) !== normalizeText(next.periodicidadDefault);

  const eligibleObligations = periodicityChanged
    ? obligations.filter((item) => canPropagatePeriodicityToObligation(item, current.periodicidadDefault))
    : [];
  const blockedObligations = periodicityChanged
    ? obligations.filter(
        (item) =>
          normalizeText(item.periodicidadAplicable || item.periodicidad) === normalizeText(current.periodicidadDefault) &&
          hasPresentedHistoryForObligation(item.id)
      )
    : [];
  const affectedCompanies = new Set(eligibleObligations.map((item) => item.empresaId));
  const blockedCompanies = new Set(blockedObligations.map((item) => item.empresaId));

  return {
    taxId: current.id,
    taxName: current.nombre,
    periodicityChanged,
    previousPeriodicity: current.periodicidadDefault,
    nextPeriodicity: next.periodicidadDefault,
    affectedCompaniesCount: affectedCompanies.size,
    affectedObligationsCount: eligibleObligations.length,
    blockedCompaniesCount: blockedCompanies.size,
    blockedObligationsCount: blockedObligations.length,
    activeCalendarsCount: activeCalendars.length,
    affectedCompanies: Array.from(affectedCompanies)
      .map((companyId) => companies.find((item) => item.id === companyId)?.razonSocial)
      .filter(Boolean),
    notes: {
      taxRulesDriven: true,
      calendarsRequireSeparateReview: activeCalendars.length > 0
    }
  };
}

function propagateTaxPeriodicityToEligibleObligations(tax, previousTax, actor = "usr_admin") {
  const obligations = getCompanyObligations();
  const audits = getAudits();
  const organization = getOrganization();
  const impacted = [];

  for (const obligation of obligations) {
    if (obligation.impuestoId !== tax.id) {
      continue;
    }

    if (!canPropagatePeriodicityToObligation(obligation, previousTax.periodicidadDefault)) {
      continue;
    }

    const previous = {
      periodicidad: obligation.periodicidad,
      periodicidadAplicable: obligation.periodicidadAplicable,
      updatedAt: obligation.updatedAt
    };

    obligation.periodicidadAplicable = tax.periodicidadDefault;
    obligation.periodicidad = tax.periodicidadDefault;
    obligation.updatedAt = new Date().toISOString();
    impacted.push(obligation.id);

    audits.push(
      createAuditEntry({
        organizacionId: organization.id,
        usuarioId: actor,
        accion: "propagar_periodicidad_impuesto_a_obligacion",
        modulo: "obligaciones_fiscales",
        recursoTipo: "obligacion_fiscal_empresa",
        recursoId: obligation.id,
        descripcion: `La periodicidad del impuesto ${tax.nombre} se propago a una obligacion de empresa sin historial presentado.`,
        valorAnterior: previous,
        valorNuevo: {
          periodicidad: obligation.periodicidad,
          periodicidadAplicable: obligation.periodicidadAplicable,
          updatedAt: obligation.updatedAt
        }
      })
    );
  }

  if (impacted.length > 0) {
    saveCompanyObligations(obligations);
    saveAudits(audits);
  }

  return impacted;
}

function buildRuleBasedObligation({ company, profile, tax, rule, responsibility }) {
  const now = new Date().toISOString();
  const fiscalEvent = resolveFiscalEvent(tax.id);
  return {
    id: createId("obl"),
    empresaId: company.id,
    impuestoId: tax.id,
    nombreObligacion: tax.nombre,
    nivel: tax.nivel,
    aplica: true,
    motivoAplicacion: `Se detecto la responsabilidad RUT ${responsibility.codigo} y coincide con la regla ${rule.nombreRegla}.`,
    fuenteDeteccion: "motor_reglas_rut",
    periodicidad: "pendiente_revision",
    periodicidadAplicable: fiscalEvent.periodicidad || tax.periodicidadDefault || "",
    eventoFiscalClave: fiscalEvent.key,
    eventoFiscal: fiscalEvent.label,
    responsabilidadRutOrigen: responsibility.nombre,
    codigoResponsabilidadRut: responsibility.codigo,
    municipioAplicacion: profile.municipio || "",
    departamentoAplicacion: profile.departamento || "",
    fechaInicioAplicacion: company.fechaGeneracionRut || now,
    fechaFinAplicacion: null,
    estado: COMPANY_OBLIGATION_STATUS.SUGGESTED,
    requiereConfirmacion: true,
    confirmadoPorUsuario: false,
    observaciones: "Obligacion sugerida por motor de reglas. Requiere validacion humana.",
    createdAt: now,
    updatedAt: now
  };
}

function buildIcaObligation({ company, profile, tax }) {
  const now = new Date().toISOString();
  return {
    id: createId("obl"),
    empresaId: company.id,
    impuestoId: tax.id,
    nombreObligacion: tax.nombre,
    nivel: tax.nivel,
    aplica: true,
    motivoAplicacion: "La empresa tiene municipio y actividad economica principal confirmados, por lo que ICA debe revisarse manualmente.",
    fuenteDeteccion: "motor_reglas_municipales",
    periodicidad: "pendiente_revision",
    periodicidadAplicable: tax.periodicidadDefault || "",
    eventoFiscalClave: "",
    eventoFiscal: "",
    responsabilidadRutOrigen: "",
    codigoResponsabilidadRut: "",
    municipioAplicacion: profile.municipio || "",
    departamentoAplicacion: profile.departamento || "",
    fechaInicioAplicacion: company.fechaGeneracionRut || now,
    fechaFinAplicacion: null,
    estado: COMPANY_OBLIGATION_STATUS.PENDING_REVIEW,
    requiereConfirmacion: true,
    confirmadoPorUsuario: false,
    observaciones: "Posible ICA detectado por ubicacion y actividad. No activar automaticamente.",
    createdAt: now,
    updatedAt: now
  };
}

function buildMatrixObligation({ company, profile, tax, rule }) {
  const now = new Date().toISOString();
  const initialStatus = normalizeObligationStatus(rule.estadoInicial || COMPANY_OBLIGATION_STATUS.SUGGESTED);
  const fiscalEvent = resolveFiscalEvent(tax.id, rule.eventoFiscalClave);
  const matchedResponsibility =
    (profile.responsabilidadesTributarias || []).find((item) =>
      (rule.criterios?.responsabilidadRutIn || []).includes(normalizeText(item.codigo))
    ) || null;

  return {
    id: createId("obl"),
    empresaId: company.id,
    impuestoId: tax.id,
    nombreObligacion: tax.nombre,
    nivel: tax.nivel,
    aplica: initialStatus !== COMPANY_OBLIGATION_STATUS.NOT_APPLICABLE,
    motivoAplicacion: rule.descripcion,
    fuenteDeteccion: rule.fuenteDeteccion || "matriz_deducida_2026",
    periodicidad:
      initialStatus === COMPANY_OBLIGATION_STATUS.PENDING_REVIEW
        ? "pendiente_revision"
        : fiscalEvent.periodicidad || tax.periodicidadDefault || "",
    periodicidadAplicable: fiscalEvent.periodicidad || tax.periodicidadDefault || "",
    eventoFiscalClave: fiscalEvent.key,
    eventoFiscal: fiscalEvent.label,
    responsabilidadRutOrigen: matchedResponsibility?.nombre || "",
    codigoResponsabilidadRut: matchedResponsibility?.codigo || "",
    municipioAplicacion: profile.municipio || "",
    departamentoAplicacion: profile.departamento || "",
    fechaInicioAplicacion: company.fechaGeneracionRut || now,
    fechaFinAplicacion: null,
    estado: initialStatus,
    requiereConfirmacion: initialStatus !== COMPANY_OBLIGATION_STATUS.ACTIVE,
    confirmadoPorUsuario: false,
    observaciones: `Sugerencia deducida por matriz 2026. Regla: ${rule.nombreRegla}.`,
    createdAt: now,
    updatedAt: now
  };
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function normalizeInferredRuleRecord(payload = {}, fallback = {}) {
  return {
    id: payload.id || fallback.id,
    impuestoId: normalizeText(payload.impuestoId || fallback.impuestoId),
    eventoFiscalClave: normalizeFiscalEventKey(payload.eventoFiscalClave || fallback.eventoFiscalClave),
    nombreRegla: normalizeText(payload.nombreRegla || fallback.nombreRegla),
    descripcion: normalizeText(payload.descripcion || fallback.descripcion),
    estado: normalizeText(payload.estado || fallback.estado || "activo"),
    accionSugerida: normalizeText(payload.accionSugerida || fallback.accionSugerida || "sugerir"),
    estadoInicial: normalizeText(payload.estadoInicial || fallback.estadoInicial || COMPANY_OBLIGATION_STATUS.PENDING_REVIEW),
    fuenteDeteccion: normalizeText(payload.fuenteDeteccion || fallback.fuenteDeteccion || "matriz_deducida_2026"),
    criterios: {
      tipoPersonaIn: normalizeStringArray(payload.criterios?.tipoPersonaIn ?? fallback.criterios?.tipoPersonaIn),
      regimenIncludesAny: normalizeStringArray(payload.criterios?.regimenIncludesAny ?? fallback.criterios?.regimenIncludesAny),
      regimenExcludesAny: normalizeStringArray(payload.criterios?.regimenExcludesAny ?? fallback.criterios?.regimenExcludesAny),
      ciiuPrefixes: normalizeStringArray(payload.criterios?.ciiuPrefixes ?? fallback.criterios?.ciiuPrefixes),
      boolFlagsAny: normalizeStringArray(payload.criterios?.boolFlagsAny ?? fallback.criterios?.boolFlagsAny),
      boolFlagsAll: normalizeStringArray(payload.criterios?.boolFlagsAll ?? fallback.criterios?.boolFlagsAll),
      responsabilidadRutIn: normalizeStringArray(payload.criterios?.responsabilidadRutIn ?? fallback.criterios?.responsabilidadRutIn),
      municipioRequired:
        payload.criterios?.municipioRequired !== undefined
          ? normalizeBoolean(payload.criterios?.municipioRequired)
          : normalizeBoolean(fallback.criterios?.municipioRequired),
      departamentoRequired:
        payload.criterios?.departamentoRequired !== undefined
          ? normalizeBoolean(payload.criterios?.departamentoRequired)
          : normalizeBoolean(fallback.criterios?.departamentoRequired)
    }
  };
}

function validateInferredRuleRecord(rule, taxes) {
  const errors = [];
  const tax = taxes.find((item) => item.id === rule.impuestoId);

  if (!rule.impuestoId || !tax) {
    errors.push("El impuesto asociado es obligatorio.");
  }

  if (!rule.nombreRegla) {
    errors.push("El nombre de la regla es obligatorio.");
  }

  if (!rule.descripcion) {
    errors.push("La descripcion de la regla es obligatoria.");
  }

  if (!["activo", "inactivo"].includes(rule.estado)) {
    errors.push("El estado de la regla es invalido.");
  }

  if (
    ![
      COMPANY_OBLIGATION_STATUS.SUGGESTED,
      COMPANY_OBLIGATION_STATUS.PENDING_REVIEW,
      COMPANY_OBLIGATION_STATUS.ACTIVE,
      COMPANY_OBLIGATION_STATUS.NOT_APPLICABLE
    ].includes(rule.estadoInicial)
  ) {
    errors.push("El estado inicial de la obligacion es invalido.");
  }

  if (rule.eventoFiscalClave && !resolveFiscalEvent(rule.impuestoId, rule.eventoFiscalClave).label) {
    errors.push("El evento fiscal configurado para la regla no es valido.");
  }

  if (errors.length > 0) {
    throw createObligationActionError(errors.join(" "), 400);
  }
}

function shouldSkipRuleBasedTax(profile, tax) {
  const regimen = normalizeMatchText(profile.regimenTributario);

  if (tax.codigo === "RENTA_ORD" && regimen.includes("simple")) {
    return true;
  }

  return false;
}

export function listTaxes() {
  return getTaxes().map((item) => normalizeTaxRecord(item, item));
}

export function listTaxRules() {
  return getTaxRules();
}

export function listInferredTaxRules() {
  return getInferredTaxRules().map((item) => normalizeInferredRuleRecord(item, item));
}

export function createInferredTaxRule(payload, actor = "usr_admin") {
  const taxes = getTaxes();
  const inferredRules = getInferredTaxRules();
  const organization = getOrganization();
  const audits = getAudits();
  const rule = normalizeInferredRuleRecord(
    {
      ...payload,
      id: createId("irule")
    },
    {}
  );

  validateInferredRuleRecord(rule, taxes);
  inferredRules.push(rule);
  saveInferredTaxRules(inferredRules);

  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "crear_regla_deducida",
      modulo: "obligaciones_fiscales",
      recursoTipo: "regla_deducida",
      recursoId: rule.id,
      descripcion: `Se creo la regla deducida ${rule.nombreRegla}.`,
      valorNuevo: rule
    })
  );
  saveAudits(audits);

  return rule;
}

export function updateInferredTaxRule(ruleId, payload, actor = "usr_admin") {
  const taxes = getTaxes();
  const inferredRules = getInferredTaxRules();
  const rule = inferredRules.find((item) => item.id === ruleId);

  if (!rule) {
    throw createObligationActionError("Regla deducida no encontrada.", 404);
  }

  const previous = normalizeInferredRuleRecord(rule, rule);
  const next = normalizeInferredRuleRecord(
    {
      ...rule,
      ...payload
    },
    rule
  );

  validateInferredRuleRecord(next, taxes);
  Object.assign(rule, next);
  saveInferredTaxRules(inferredRules);

  const organization = getOrganization();
  const audits = getAudits();
  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "actualizar_regla_deducida",
      modulo: "obligaciones_fiscales",
      recursoTipo: "regla_deducida",
      recursoId: rule.id,
      descripcion: `Se actualizo la regla deducida ${rule.nombreRegla}.`,
      valorAnterior: previous,
      valorNuevo: normalizeInferredRuleRecord(rule, rule)
    })
  );
  saveAudits(audits);

  return normalizeInferredRuleRecord(rule, rule);
}

export function createTax(payload, actor = "usr_admin") {
  const taxes = getTaxes();
  const organization = getOrganization();
  const audits = getAudits();
  const now = new Date().toISOString();
  const tax = normalizeTaxRecord(
    {
      ...payload,
      id: createId("tax"),
      createdAt: now,
      updatedAt: now
    },
    {}
  );

  validateTaxRecord(tax, taxes);
  taxes.push(tax);
  saveTaxes(taxes);
  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "crear_impuesto",
      modulo: "impuestos",
      recursoTipo: "impuesto",
      recursoId: tax.id,
      descripcion: `Se creo el impuesto ${tax.nombre}.`,
      valorNuevo: tax
    })
  );
  saveAudits(audits);

  return normalizeTaxRecord(tax, tax);
}

export function updateTax(taxId, payload, actor = "usr_admin") {
  const taxes = getTaxes();
  const tax = taxes.find((item) => item.id === taxId);

  if (!tax) {
    throw createObligationActionError("Impuesto no encontrado.", 404);
  }

  const previous = normalizeTaxRecord(tax, tax);
  const next = normalizeTaxRecord(
    {
      ...tax,
      ...payload,
      id: tax.id,
      createdAt: tax.createdAt,
      updatedAt: new Date().toISOString()
    },
    tax
  );

  validateTaxRecord(next, taxes, tax.id);
  Object.assign(tax, next);
  saveTaxes(taxes);

  let propagatedObligationIds = [];
  if (payload?.aplicarCambiosAEmpresas === true && normalizeText(previous.periodicidadDefault) !== normalizeText(next.periodicidadDefault)) {
    propagatedObligationIds = propagateTaxPeriodicityToEligibleObligations(next, previous, actor);
  }

  const organization = getOrganization();
  const audits = getAudits();
  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "actualizar_impuesto",
      modulo: "impuestos",
      recursoTipo: "impuesto",
      recursoId: tax.id,
      descripcion: `Se actualizo el impuesto ${tax.nombre}.`,
      valorAnterior: previous,
      valorNuevo: {
        ...normalizeTaxRecord(tax, tax),
        propagatedObligationsCount: propagatedObligationIds.length
      }
    })
  );
  saveAudits(audits);

  return {
    ...normalizeTaxRecord(tax, tax),
    propagation: {
      propagatedObligationsCount: propagatedObligationIds.length
    }
  };
}

export function listCompanyObligations(companyId) {
  const taxes = getTaxes();
  return getCompanyObligations()
    .filter((item) => item.empresaId === companyId)
    .map((item) => ({
      ...item,
      eventoFiscalClave: normalizeFiscalEventKey(item.eventoFiscalClave),
      eventoFiscal: normalizeText(item.eventoFiscal) || resolveFiscalEvent(item.impuestoId, item.eventoFiscalClave).label,
      impuesto: taxes.find((tax) => tax.id === item.impuestoId) || null
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAllCompanyObligations() {
  const taxes = getTaxes();
  return getCompanyObligations()
    .map((item) => ({
      ...item,
      eventoFiscalClave: normalizeFiscalEventKey(item.eventoFiscalClave),
      eventoFiscal: normalizeText(item.eventoFiscal) || resolveFiscalEvent(item.impuestoId, item.eventoFiscalClave).label,
      impuesto: taxes.find((tax) => tax.id === item.impuestoId) || null
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function analyzeCompanyObligations(companyId, actor = "usr_admin") {
  const companies = getCompanies();
  const company = companies.find((item) => item.id === companyId);

  if (!company) {
    throw new Error("Empresa no encontrada.");
  }

  if (isOperationallyBlocked(company)) {
    throw new Error("La empresa no esta operativa y no debe generar nuevas obligaciones.");
  }

  const organization = getOrganization();
  const taxes = getTaxes();
  const rules = getTaxRules().filter((item) => item.estado === "activo");
  const obligations = getCompanyObligations();
  const audits = getAudits();
  const profile = getCompanyEffectiveTaxProfile(company);
  const now = new Date().toISOString();
  const created = [];
  const existingKeys = new Set(
    obligations
      .filter((item) => item.empresaId === company.id)
      .map((item) =>
        createObligationKey(
          item.empresaId,
          item.impuestoId,
          item.codigoResponsabilidadRut,
          item.municipioAplicacion,
          item.eventoFiscalClave
        )
      )
  );

  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "analizar_obligaciones",
      modulo: "obligaciones_fiscales",
      recursoTipo: "empresa",
      recursoId: company.id,
      descripcion: `Se ejecuto el motor de obligaciones para la empresa ${company.razonSocial}.`,
      valorNuevo: {
        source: profile.source,
        estadoEmpresa: profile.estadoEmpresa,
        responsabilidades: profile.responsabilidadesTributarias.map((item) => item.codigo)
      }
    })
  );

  for (const responsibility of profile.responsabilidadesTributarias) {
    const matchedRules = rules.filter((rule) => rule.codigoResponsabilidadRut === responsibility.codigo);

    for (const rule of matchedRules) {
      const tax = taxes.find((item) => item.id === rule.impuestoId && item.estado === "activo");
      if (!tax) {
        continue;
      }

      if (shouldSkipRuleBasedTax(profile, tax)) {
        continue;
      }

      const fiscalEvent = resolveFiscalEvent(tax.id);
      const key = createObligationKey(company.id, tax.id, responsibility.codigo, profile.municipio || "", fiscalEvent.key);
      if (existingKeys.has(key)) {
        continue;
      }

      const obligation = buildRuleBasedObligation({
        company,
        profile,
        tax,
        rule,
        responsibility
      });

      obligations.push(obligation);
      existingKeys.add(key);
      created.push(obligation);
      audits.push(
        createAuditEntry({
          organizacionId: organization.id,
          usuarioId: actor,
          accion: "crear_obligacion_sugerida",
          modulo: "obligaciones_fiscales",
          recursoTipo: "obligacion_fiscal_empresa",
          recursoId: obligation.id,
          descripcion: `Se sugirio la obligacion ${obligation.nombreObligacion} para ${company.razonSocial}.`,
          valorNuevo: {
            empresaId: company.id,
            impuestoId: obligation.impuestoId,
            codigoResponsabilidadRut: obligation.codigoResponsabilidadRut,
            estado: obligation.estado
          }
        })
      );
    }
  }

  for (const rule of listInferredTaxRules().filter((item) => item.estado === "activo")) {
    if (!matchesInferredCriteria(profile, rule.criterios || {})) {
      continue;
    }

    const tax = taxes.find((item) => item.id === rule.impuestoId && item.estado === "activo");
    if (!tax) {
      continue;
    }

    const fiscalEvent = resolveFiscalEvent(tax.id, rule.eventoFiscalClave);
    if (profileHasSimilarObligation(obligations, company.id, tax.id, profile.municipio || "", fiscalEvent.key)) {
      continue;
    }

    const obligation = buildMatrixObligation({
      company,
      profile,
      tax,
      rule
    });

    obligations.push(obligation);
    created.push(obligation);
    audits.push(
      createAuditEntry({
        organizacionId: organization.id,
        usuarioId: actor,
        accion: "crear_obligacion_deducida",
        modulo: "obligaciones_fiscales",
        recursoTipo: "obligacion_fiscal_empresa",
        recursoId: obligation.id,
        descripcion: `La matriz deducida 2026 sugirio ${obligation.nombreObligacion} para ${company.razonSocial}.`,
        valorNuevo: {
          empresaId: company.id,
          impuestoId: obligation.impuestoId,
          estado: obligation.estado,
          fuenteDeteccion: obligation.fuenteDeteccion
        }
      })
    );
  }

  if (profile.municipio && profile.departamento && (profile.actividadEconomicaPrincipalCodigo || profile.actividadEconomicaPrincipal)) {
    const icaTax = taxes.find((item) => item.codigo === "ICA" && item.estado === "activo");
    if (icaTax) {
      const key = createObligationKey(company.id, icaTax.id, "", profile.municipio, "");
      if (!existingKeys.has(key)) {
        const icaObligation = buildIcaObligation({ company, profile, tax: icaTax });
        obligations.push(icaObligation);
        existingKeys.add(key);
        created.push(icaObligation);
        audits.push(
          createAuditEntry({
            organizacionId: organization.id,
            usuarioId: actor,
            accion: "crear_obligacion_sugerida",
            modulo: "obligaciones_fiscales",
            recursoTipo: "obligacion_fiscal_empresa",
            recursoId: icaObligation.id,
            descripcion: `Se sugirio revision de ICA para ${company.razonSocial}.`,
            valorNuevo: {
              empresaId: company.id,
              impuestoId: icaObligation.impuestoId,
              estado: icaObligation.estado,
              municipioAplicacion: icaObligation.municipioAplicacion
            }
          })
        );
      }
    }
  }

  saveCompanyObligations(obligations);
  saveAudits(audits);

  return {
    analyzedAt: now,
    createdCount: created.length,
    items: listCompanyObligations(company.id)
  };
}

export function createManualCompanyObligation(payload, actor = "usr_admin") {
  const companies = getCompanies();
  const taxes = getTaxes();
  const obligations = getCompanyObligations();
  const audits = getAudits();
  const organization = getOrganization();

  const empresaId = normalizeText(payload.empresaId);
  const company = companies.find((item) => item.id === empresaId);
  if (!company) {
    throw createObligationActionError("Empresa no encontrada.", 404);
  }

  if (isOperationallyBlocked(company)) {
    throw createObligationActionError("La empresa no esta operativa para asignar impuestos manualmente.", 400);
  }

  const impuestoId = normalizeText(payload.impuestoId);
  const tax = taxes.find((item) => item.id === impuestoId);
  if (!tax) {
    throw createObligationActionError("Impuesto no encontrado.", 404);
  }

  const nivel = normalizeText(payload.nivel || tax.nivel);
  const departamentoAplicacion = normalizeText(payload.departamento || payload.departamentoAplicacion);
  const municipioAplicacion = normalizeText(payload.municipioCiudad || payload.municipioAplicacion || payload.municipio);
  const fiscalEvent = resolveFiscalEvent(impuestoId, payload.eventoFiscalClave);
  const periodicidadAplicable = normalizeText(payload.periodicidadAplicable || fiscalEvent.periodicidad || tax.periodicidadDefault);
  const estado = normalizeObligationStatus(payload.estado);

  if (!periodicidadAplicable) {
    throw createObligationActionError("La periodicidad aplicable es obligatoria.", 400);
  }

  if (nivel === "municipal" && !municipioAplicacion) {
    throw createObligationActionError("Municipio / Ciudad es obligatorio para impuestos municipales.", 400);
  }

  if (nivel === "departamental" && !departamentoAplicacion) {
    throw createObligationActionError("El departamento es obligatorio para impuestos departamentales.", 400);
  }

  const normalizedPayload = {
    empresaId,
    impuestoId,
    nivel,
    departamentoAplicacion,
    municipioAplicacion,
    periodicidadAplicable,
    eventoFiscalClave: fiscalEvent.key
  };

  const duplicated = obligations.some((item) => shouldPreventManualDuplicate(item, normalizedPayload));
  if (duplicated) {
    throw createObligationActionError(
      "Ya existe una obligacion activa o en proceso para la misma empresa, impuesto, ubicacion y periodicidad.",
      400
    );
  }

  const now = new Date().toISOString();
  const obligation = {
    id: createId("obl"),
    empresaId,
    impuestoId,
    nombreObligacion: tax.nombre,
    nivel,
    aplica: estado !== COMPANY_OBLIGATION_STATUS.NOT_APPLICABLE,
    motivoAplicacion: normalizeText(payload.motivo) || "Asignacion manual de impuesto a empresa.",
    fuenteDeteccion: "manual_usuario",
    periodicidad: periodicidadAplicable,
    periodicidadAplicable,
    eventoFiscalClave: fiscalEvent.key,
    eventoFiscal: fiscalEvent.label,
    responsabilidadRutOrigen: "",
    codigoResponsabilidadRut: "",
    municipioAplicacion,
    departamentoAplicacion,
    fechaInicioAplicacion: normalizeText(payload.fechaInicioAplicacion) || company.fechaGeneracionRut || now,
    fechaFinAplicacion: normalizeText(payload.fechaFinAplicacion) || null,
    estado,
    requiereConfirmacion: estado !== COMPANY_OBLIGATION_STATUS.ACTIVE,
    confirmadoPorUsuario: estado === COMPANY_OBLIGATION_STATUS.ACTIVE ? actor : null,
    observaciones: normalizeText(payload.observaciones),
    createdAt: now,
    updatedAt: now
  };

  obligations.push(obligation);
  saveCompanyObligations(obligations);

  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "crear_obligacion_manual",
      modulo: "obligaciones_fiscales",
      recursoTipo: "obligacion_fiscal_empresa",
      recursoId: obligation.id,
      descripcion: `Se asigno manualmente el impuesto ${tax.nombre} a ${company.razonSocial}.`,
      valorNuevo: {
        empresaId: company.id,
        impuestoId: tax.id,
        nivel,
        municipioAplicacion,
        departamentoAplicacion,
        eventoFiscalClave: fiscalEvent.key,
        eventoFiscal: fiscalEvent.label,
        periodicidadAplicable,
        estado
      }
    })
  );
  saveAudits(audits);

  return listCompanyObligations(company.id).find((item) => item.id === obligation.id) || obligation;
}

export function updateCompanyObligation(obligationId, payload = {}, actor = "usr_admin") {
  const obligations = getCompanyObligations();
  const companies = getCompanies();
  const taxes = getTaxes();
  const audits = getAudits();
  const organization = getOrganization();
  const obligation = obligations.find((item) => item.id === obligationId);

  if (!obligation) {
    throw createObligationActionError("No se encontro la obligacion fiscal de la empresa.", 404);
  }

  const company = companies.find((item) => item.id === obligation.empresaId);
  if (!company) {
    throw createObligationActionError("La empresa asociada a la obligacion no existe.", 404);
  }

  const taxId = normalizeText(payload.impuestoId || obligation.impuestoId);
  const tax = taxes.find((item) => item.id === taxId);
  if (!tax) {
    throw createObligationActionError("Impuesto no encontrado.", 404);
  }

  const nivel = normalizeText(payload.nivel || obligation.nivel || tax.nivel);
  const departamentoAplicacion = normalizeText(payload.departamento || payload.departamentoAplicacion || obligation.departamentoAplicacion);
  const municipioAplicacion = normalizeText(
    payload.municipioCiudad || payload.municipioAplicacion || payload.municipio || obligation.municipioAplicacion
  );
  const fiscalEvent = resolveFiscalEvent(taxId, payload.eventoFiscalClave || obligation.eventoFiscalClave);
  const periodicidadAplicable = normalizeText(
    payload.periodicidadAplicable || fiscalEvent.periodicidad || obligation.periodicidadAplicable || obligation.periodicidad || tax.periodicidadDefault
  );
  const estado = normalizeObligationStatus(payload.estado || obligation.estado);

  if (!periodicidadAplicable) {
    throw createObligationActionError("La periodicidad aplicable es obligatoria.", 400);
  }

  if (nivel === "municipal" && !municipioAplicacion) {
    throw createObligationActionError("Municipio / Ciudad es obligatorio para impuestos municipales.", 400);
  }

  if (nivel === "departamental" && !departamentoAplicacion) {
    throw createObligationActionError("El departamento es obligatorio para impuestos departamentales.", 400);
  }

  const duplicated = obligations.some(
    (item) =>
      item.id !== obligationId &&
      shouldPreventManualDuplicate(item, {
        empresaId: obligation.empresaId,
        impuestoId: taxId,
        nivel,
        departamentoAplicacion,
        municipioAplicacion,
        periodicidadAplicable,
        eventoFiscalClave: fiscalEvent.key
      })
  );

  if (duplicated) {
    throw createObligationActionError(
      "Ya existe una obligacion activa o en proceso para la misma empresa, impuesto, ubicacion y periodicidad.",
      400
    );
  }

  const previous = { ...obligation };
  const now = new Date().toISOString();

  obligation.impuestoId = taxId;
  obligation.nombreObligacion = tax.nombre;
  obligation.nivel = nivel;
  obligation.departamentoAplicacion = departamentoAplicacion;
  obligation.municipioAplicacion = municipioAplicacion;
  obligation.periodicidadAplicable = periodicidadAplicable;
  obligation.periodicidad = periodicidadAplicable;
  obligation.eventoFiscalClave = fiscalEvent.key;
  obligation.eventoFiscal = fiscalEvent.label;
  obligation.estado = estado;
  obligation.aplica = estado !== COMPANY_OBLIGATION_STATUS.NOT_APPLICABLE;
  obligation.requiereConfirmacion = estado !== COMPANY_OBLIGATION_STATUS.ACTIVE;
  obligation.confirmadoPorUsuario = estado === COMPANY_OBLIGATION_STATUS.ACTIVE ? actor : null;
  obligation.motivoAplicacion = normalizeText(payload.motivo || obligation.motivoAplicacion);
  obligation.observaciones = normalizeText(payload.observaciones || obligation.observaciones);
  obligation.fechaInicioAplicacion = normalizeText(payload.fechaInicioAplicacion || obligation.fechaInicioAplicacion);
  obligation.updatedAt = now;

  saveCompanyObligations(obligations);

  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "editar_obligacion_empresa",
      modulo: "obligaciones_fiscales",
      recursoTipo: "obligacion_fiscal_empresa",
      recursoId: obligation.id,
      descripcion: `Se edito la obligacion ${obligation.nombreObligacion} de ${company.razonSocial}.`,
      valorAnterior: previous,
      valorNuevo: {
        impuestoId: obligation.impuestoId,
        nivel: obligation.nivel,
        departamentoAplicacion: obligation.departamentoAplicacion,
        municipioAplicacion: obligation.municipioAplicacion,
        eventoFiscalClave: obligation.eventoFiscalClave,
        eventoFiscal: obligation.eventoFiscal,
        periodicidadAplicable: obligation.periodicidadAplicable,
        estado: obligation.estado,
        motivoAplicacion: obligation.motivoAplicacion,
        observaciones: obligation.observaciones,
        updatedAt: obligation.updatedAt
      }
    })
  );
  saveAudits(audits);

  return listCompanyObligations(company.id).find((item) => item.id === obligation.id) || obligation;
}

function updateObligationStatus(obligationId, nextStatus, actor, extra = {}) {
  const obligations = getCompanyObligations();
  const companies = getCompanies();
  const taxes = getTaxes();
  const obligation = obligations.find((item) => item.id === obligationId);
  const action = extra.auditAction || "obligacion_desconocida";

  if (!obligation) {
    throw createObligationActionError("No se encontro la obligacion fiscal de la empresa.", 404);
  }

  const company = companies.find((item) => item.id === obligation.empresaId);
  if (!company) {
    throw createObligationActionError("La empresa asociada a la obligacion no existe.", 404);
  }

  if (nextStatus === COMPANY_OBLIGATION_STATUS.ACTIVE && company.estadoEmpresa !== COMPANY_STATUS.ACTIVE) {
    throw createObligationActionError("La empresa debe estar activa antes de confirmar obligaciones.", 400);
  }

  const organization = getOrganization();
  const audits = getAudits();
  const previous = { ...obligation };
  const now = new Date().toISOString();
  obligation.estado = nextStatus;
  obligation.aplica = extra.aplica ?? obligation.aplica;
  obligation.requiereConfirmacion = extra.requiereConfirmacion ?? (nextStatus !== COMPANY_OBLIGATION_STATUS.ACTIVE);
  obligation.confirmadoPorUsuario = extra.confirmadoPorUsuario ?? null;
  obligation.observaciones = extra.observaciones ?? obligation.observaciones;
  if (!normalizeText(obligation.periodicidadAplicable || obligation.periodicidad)) {
    const tax = taxes.find((item) => item.id === obligation.impuestoId);
    const fiscalEvent = resolveFiscalEvent(obligation.impuestoId, obligation.eventoFiscalClave);
    if (fiscalEvent.periodicidad || tax?.periodicidadDefault) {
      obligation.periodicidadAplicable = fiscalEvent.periodicidad || tax.periodicidadDefault;
      obligation.periodicidad = fiscalEvent.periodicidad || tax.periodicidadDefault;
    }
  }
  obligation.updatedAt = now;

  saveCompanyObligations(obligations);

  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: extra.auditAction,
      modulo: "obligaciones_fiscales",
      recursoTipo: "obligacion_fiscal_empresa",
      recursoId: obligation.id,
      descripcion: extra.description,
      valorAnterior: {
        estado: previous.estado,
        confirmadoPorUsuario: previous.confirmadoPorUsuario,
        aplica: previous.aplica,
        requiereConfirmacion: previous.requiereConfirmacion
      },
      valorNuevo: {
        estado: obligation.estado,
        confirmadoPorUsuario: obligation.confirmadoPorUsuario,
        aplica: obligation.aplica,
        requiereConfirmacion: obligation.requiereConfirmacion,
        observaciones: obligation.observaciones,
        updatedAt: obligation.updatedAt
      }
    })
  );
  saveAudits(audits);

  return obligation;
}

export function confirmCompanyObligation(obligationId, actor = "usr_admin", observaciones = "") {
  if (!String(obligationId || "").trim()) {
    throw createObligationActionError("ID de obligacion requerido.", 400);
  }

  return updateObligationStatus(obligationId, COMPANY_OBLIGATION_STATUS.ACTIVE, actor, {
    aplica: true,
    requiereConfirmacion: false,
    confirmadoPorUsuario: actor,
    observaciones,
    auditAction: "confirmar_obligacion",
    description: "Se confirmo manualmente una obligacion fiscal sugerida."
  });
}

export function markCompanyObligationNotApplicable(obligationId, actor = "usr_admin", observaciones = "") {
  if (!String(obligationId || "").trim()) {
    throw createObligationActionError("ID de obligacion requerido.", 400);
  }

  return updateObligationStatus(obligationId, COMPANY_OBLIGATION_STATUS.NOT_APPLICABLE, actor, {
    aplica: false,
    requiereConfirmacion: false,
    confirmadoPorUsuario: actor,
    observaciones,
    auditAction: "obligacion_no_aplica",
    description: "Se marco una obligacion fiscal como no aplica."
  });
}

export function reviewCompanyObligation(obligationId, actor = "usr_admin", observaciones = "") {
  if (!String(obligationId || "").trim()) {
    throw createObligationActionError("ID de obligacion requerido.", 400);
  }

  return updateObligationStatus(obligationId, COMPANY_OBLIGATION_STATUS.PENDING_REVIEW, actor, {
    requiereConfirmacion: true,
    confirmadoPorUsuario: null,
    observaciones,
    auditAction: "obligacion_en_revision",
    description: "Se envio una obligacion fiscal a revision."
  });
}
