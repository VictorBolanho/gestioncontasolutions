export const COMPANY_STATUS = Object.freeze({
  DRAFT: "borrador",
  PENDING_REVIEW: "pendiente_revision",
  ACTIVE: "activa",
  SUSPENDED: "suspendida",
  INACTIVE: "inactiva",
  ARCHIVED: "archivada"
});

export const EXTRACTION_STATUS = Object.freeze({
  SUCCESS: "exitosa",
  PARTIAL: "parcial",
  REQUIRES_REVIEW: "requiere_revision",
  ERROR: "error"
});

export const NON_OPERATIONAL_COMPANY_STATUSES = new Set([
  COMPANY_STATUS.SUSPENDED,
  COMPANY_STATUS.INACTIVE,
  COMPANY_STATUS.ARCHIVED
]);

export function isOperationalCompany(status) {
  return !NON_OPERATIONAL_COMPANY_STATUSES.has(status);
}

export function canGenerateOperationalFlow(company) {
  return Boolean(
    company &&
      company.permiteGenerarTareas !== false &&
      company.permiteGenerarObligaciones !== false &&
      isOperationalCompany(company.estadoEmpresa)
  );
}

export function getCompanyOperationalBlockReason(company) {
  if (!company) {
    return "Empresa no encontrada.";
  }

  if (NON_OPERATIONAL_COMPANY_STATUSES.has(company.estadoEmpresa)) {
    return "La empresa no esta operativa y no debe generar nuevas tareas ni automatismos.";
  }

  if (company.permiteGenerarTareas === false) {
    return "La empresa tiene bloqueada la generacion de tareas.";
  }

  if (company.permiteGenerarObligaciones === false) {
    return "La empresa tiene bloqueada la generacion de obligaciones.";
  }

  return null;
}

export function createCompanyStatusHistory(company, nextStatus, actor) {
  return {
    empresaId: company.id,
    estadoAnterior: company.estadoEmpresa,
    estadoNuevo: nextStatus,
    fechaCambio: new Date().toISOString(),
    cambiadoPor: actor
  };
}

export function normalizeNit(value) {
  return String(value || "").replace(/\D/g, "");
}

export function normalizeDv(value) {
  return String(value || "").replace(/\D/g, "");
}

export function companyIdentityKey({ nit, dv }) {
  return `${normalizeNit(nit)}-${normalizeDv(dv)}`;
}

export function isDuplicateCompanyIdentity(companies, candidate) {
  const candidateKey = companyIdentityKey(candidate);
  return companies.some((company) => companyIdentityKey(company) === candidateKey);
}

export function validateCompanyDraft(payload) {
  const errors = [];
  const nit = normalizeNit(payload.nit);
  const dv = normalizeDv(payload.dv);

  if (!nit) {
    errors.push("El NIT es obligatorio.");
  }

  if (!dv) {
    errors.push("El DV es obligatorio.");
  }

  if (!String(payload.razonSocial || "").trim()) {
    errors.push("La razon social es obligatoria.");
  }

  if (!String(payload.tipoContribuyente || "").trim()) {
    errors.push("El tipo de contribuyente es obligatorio.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function normalizeTextValue(value) {
  return String(value || "").trim();
}

function normalizeResponsibilities(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return {
            codigo: "",
            nombre: item.trim(),
            fuenteTexto: item.trim()
          };
        }

        return {
          codigo: String(item.codigo || "").trim(),
          nombre: String(item.nombre || "").trim(),
          fuenteTexto: String(item.fuenteTexto || "").trim()
        };
      })
      .filter((item) => item.codigo || item.nombre || item.fuenteTexto);
  }

  return [];
}

function getConfirmedCompanySource(company) {
  if (!company) {
    return {};
  }

  if (company.datosConfirmadosPorUsuario && typeof company.datosConfirmadosPorUsuario === "object") {
    return company.datosConfirmadosPorUsuario;
  }

  return company;
}

export function getCompanyEffectiveTaxProfile(company) {
  const source = getConfirmedCompanySource(company);

  return {
    source: company?.datosConfirmadosPorUsuario ? "datos_confirmados_por_usuario" : "empresa_confirmada",
    nit: normalizeNit(source.nit || company?.nit),
    dv: normalizeDv(source.dv || company?.dv),
    razonSocial: normalizeTextValue(source.razonSocial || company?.razonSocial),
    tipoContribuyente: normalizeTextValue(source.tipoContribuyente || company?.tipoContribuyente),
    tipoPersona: normalizeTextValue(source.tipoPersona || company?.tipoPersona),
    regimenTributario: normalizeTextValue(source.regimenTributario || company?.regimenTributario),
    actividadEconomicaPrincipal: normalizeTextValue(
      source.actividadEconomicaPrincipal || source.actividadEconomicaPrincipalCodigo || company?.actividadEconomicaPrincipal
    ),
    actividadEconomicaPrincipalCodigo: normalizeTextValue(
      source.actividadEconomicaPrincipalCodigo || source.actividadEconomicaPrincipal || company?.actividadEconomicaPrincipalCodigo
    ),
    actividadEconomicaPrincipalNombre: normalizeTextValue(
      source.actividadEconomicaPrincipalNombre || company?.actividadEconomicaPrincipalNombre
    ),
    actividadEconomicaPrincipalFuente: normalizeTextValue(
      source.actividadEconomicaPrincipalFuente || company?.actividadEconomicaPrincipalFuente
    ),
    responsabilidadesTributarias: normalizeResponsibilities(
      source.responsabilidadesTributarias || company?.responsabilidadesTributarias
    ),
    responsableIva: source.responsableIva ?? company?.responsableIva ?? false,
    obligadoLlevarContabilidad:
      source.obligadoLlevarContabilidad ?? company?.obligadoLlevarContabilidad ?? false,
    obligadoFacturar: source.obligadoFacturar ?? company?.obligadoFacturar ?? false,
    informanteExogena: source.informanteExogena ?? company?.informanteExogena ?? false,
    agenteRetencionFuente: source.agenteRetencionFuente ?? company?.agenteRetencionFuente ?? false,
    informanteBeneficiariosFinales:
      source.informanteBeneficiariosFinales ?? company?.informanteBeneficiariosFinales ?? false,
    pais: normalizeTextValue(source.pais || company?.pais),
    departamento: normalizeTextValue(source.departamento || company?.departamento),
    municipio: normalizeTextValue(source.municipio || company?.municipio),
    estadoEmpresa: normalizeTextValue(source.estadoEmpresa || company?.estadoEmpresa),
    permiteGenerarObligaciones: company?.permiteGenerarObligaciones !== false,
    permiteGenerarTareas: company?.permiteGenerarTareas !== false
  };
}
