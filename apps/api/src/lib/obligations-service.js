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
  getOrganization,
  getTaxRules,
  getTaxes,
  saveAudits,
  saveCompanyObligations
} from "./storage.js";

export const COMPANY_OBLIGATION_STATUS = Object.freeze({
  SUGGESTED: "sugerida",
  ACTIVE: "activa",
  PENDING_REVIEW: "pendiente_revision",
  NOT_APPLICABLE: "no_aplica",
  INACTIVE: "inactiva"
});

function createObligationActionError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createObligationKey(empresaId, impuestoId, codigoResponsabilidadRut, municipioAplicacion) {
  return [
    empresaId,
    impuestoId,
    codigoResponsabilidadRut || "sin_codigo",
    municipioAplicacion || "sin_municipio"
  ].join("|");
}

function isOperationallyBlocked(company) {
  return NON_OPERATIONAL_COMPANY_STATUSES.has(company.estadoEmpresa);
}

function buildRuleBasedObligation({ company, profile, tax, rule, responsibility }) {
  const now = new Date().toISOString();
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

export function listTaxes() {
  return getTaxes();
}

export function listTaxRules() {
  return getTaxRules();
}

export function listCompanyObligations(companyId) {
  const taxes = getTaxes();
  return getCompanyObligations()
    .filter((item) => item.empresaId === companyId)
    .map((item) => ({
      ...item,
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
      .map((item) => createObligationKey(item.empresaId, item.impuestoId, item.codigoResponsabilidadRut, item.municipioAplicacion))
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

      const key = createObligationKey(company.id, tax.id, responsibility.codigo, profile.municipio || "");
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

  if (profile.municipio && profile.departamento && (profile.actividadEconomicaPrincipalCodigo || profile.actividadEconomicaPrincipal)) {
    const icaTax = taxes.find((item) => item.codigo === "ICA" && item.estado === "activo");
    if (icaTax) {
      const key = createObligationKey(company.id, icaTax.id, "", profile.municipio);
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

function updateObligationStatus(obligationId, nextStatus, actor, extra = {}) {
  const obligations = getCompanyObligations();
  const companies = getCompanies();
  const obligation = obligations.find((item) => item.id === obligationId);
  const action = extra.auditAction || "obligacion_desconocida";

  console.log("[company-obligation-action] action:", action);
  console.log("[company-obligation-action] obligationId:", obligationId);
  console.log("[company-obligation-action] found:", Boolean(obligation));

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
