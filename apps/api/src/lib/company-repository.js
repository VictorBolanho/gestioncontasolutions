import fs from "node:fs";
import path from "node:path";
import {
  COMPANY_STATUS,
  canGenerateOperationalFlow,
  companyIdentityKey,
  createAuditEntry,
  isDuplicateCompanyIdentity,
  validateCompanyDraft
} from "../../../../packages/domain/index.js";
import {
  getAudits,
  getCompanies,
  getDocuments,
  getExtractions,
  getOrganization,
  getUploadsDir,
  saveAudits,
  saveCompanies,
  saveDocuments,
  saveExtractions
} from "./storage.js";
import { listCompanyObligations } from "./obligations-service.js";
import { extractRutDataFromPdf } from "./rut-extraction.js";

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeBoolean(value) {
  return value === true || value === "true";
}

function normalizeResponsibilities(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          const match = item.match(/^(\d{2})\s*-\s*(.+)$/);
          return {
            codigo: match?.[1] || "",
            nombre: (match?.[2] || item).trim(),
            fuenteTexto: item.trim()
          };
        }

        return {
          codigo: String(item.codigo || "").trim(),
          nombre: String(item.nombre || "").trim(),
          fuenteTexto: String(item.fuenteTexto || `${item.codigo || ""} - ${item.nombre || ""}`).trim()
        };
      })
      .filter((item) => item.codigo || item.nombre);
  }

  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const match = item.match(/^(\d{2})\s*-\s*(.+)$/);
      return {
        codigo: match?.[1] || "",
        nombre: (match?.[2] || item).trim(),
        fuenteTexto: item
      };
    });
}

function normalizeRepresentative(payload = {}) {
  return {
    tipoRepresentacion: String(payload.tipoRepresentacion || "").trim(),
    fechaInicioRepresentacion: payload.fechaInicioRepresentacion || "",
    tipoDocumento: String(payload.tipoDocumento || "").trim(),
    numeroIdentificacion: String(payload.numeroIdentificacion || "").replace(/\D/g, ""),
    dv: String(payload.dv || "").replace(/\D/g, ""),
    primerApellido: String(payload.primerApellido || "").trim(),
    segundoApellido: String(payload.segundoApellido || "").trim(),
    primerNombre: String(payload.primerNombre || "").trim(),
    otrosNombres: String(payload.otrosNombres || "").trim(),
    nombreCompleto: String(payload.nombreCompleto || "").trim()
  };
}

function normalizeConfirmedData(payload) {
  const representative = normalizeRepresentative(payload.representanteLegalPrincipal);
  const correoElectronico = String(payload.correoElectronico || payload.email || "").trim();

  return {
    numeroFormulario: String(payload.numeroFormulario || "").trim(),
    concepto: String(payload.concepto || "").trim(),
    nit: String(payload.nit || "").replace(/\D/g, ""),
    dv: String(payload.dv || "").replace(/\D/g, ""),
    direccionSeccional: String(payload.direccionSeccional || "").trim(),
    buzonElectronico: String(payload.buzonElectronico || "").trim(),
    tipoContribuyente: String(payload.tipoContribuyente || "").trim(),
    tipoPersona: String(payload.tipoPersona || "").trim(),
    tipoDocumento: String(payload.tipoDocumento || "").trim(),
    numeroIdentificacion: String(payload.numeroIdentificacion || "").replace(/\D/g, ""),
    razonSocial: String(payload.razonSocial || "").trim(),
    nombreComercial: String(payload.nombreComercial || "").trim(),
    sigla: String(payload.sigla || "").trim(),
    pais: String(payload.pais || "").trim(),
    departamento: String(payload.departamento || "").trim(),
    municipio: String(payload.municipio || "").trim(),
    direccionPrincipal: String(payload.direccionPrincipal || "").trim(),
    correoElectronico,
    email: correoElectronico,
    codigoPostal: String(payload.codigoPostal || "").trim(),
    telefono1: String(payload.telefono1 || "").trim(),
    telefono2: String(payload.telefono2 || "").trim(),
    actividadEconomicaPrincipal: String(payload.actividadEconomicaPrincipal || "").trim(),
    actividadEconomicaPrincipalCodigo: String(
      payload.actividadEconomicaPrincipalCodigo || payload.actividadEconomicaPrincipal || ""
    ).trim(),
    actividadEconomicaPrincipalNombre: String(payload.actividadEconomicaPrincipalNombre || "").trim(),
    actividadEconomicaPrincipalFuente: String(payload.actividadEconomicaPrincipalFuente || "").trim(),
    fechaInicioActividadPrincipal: payload.fechaInicioActividadPrincipal || "",
    actividadEconomicaSecundaria: String(payload.actividadEconomicaSecundaria || "").trim(),
    fechaInicioActividadSecundaria: payload.fechaInicioActividadSecundaria || "",
    otrasActividades: String(payload.otrasActividades || "").trim(),
    numeroEstablecimientos: String(payload.numeroEstablecimientos || "").trim(),
    responsabilidadesTributarias: normalizeResponsibilities(payload.responsabilidadesTributarias),
    responsableIva: normalizeBoolean(payload.responsableIva),
    obligadoLlevarContabilidad: normalizeBoolean(payload.obligadoLlevarContabilidad || payload.obligadoContabilidad),
    obligadoFacturar: normalizeBoolean(payload.obligadoFacturar),
    informanteExogena: normalizeBoolean(payload.informanteExogena),
    agenteRetencionFuente: normalizeBoolean(payload.agenteRetencionFuente),
    informanteBeneficiariosFinales: normalizeBoolean(payload.informanteBeneficiariosFinales),
    regimenTributario: String(payload.regimenTributario || "").trim(),
    regimenTributarioFuente: String(payload.regimenTributarioFuente || "").trim(),
    requiereRevisionRegimen: normalizeBoolean(payload.requiereRevisionRegimen),
    representanteLegalPrincipal: representative,
    fechaGeneracionRut: payload.fechaGeneracionRut || "",
    paginasDetectadas: Number(payload.paginasDetectadas || 0),
    textoExtraidoPreview: String(payload.textoExtraidoPreview || "").trim()
  };
}

function companyView(company) {
  return {
    ...company,
    puedeOperar: canGenerateOperationalFlow(company)
  };
}

export function buildBootstrap() {
  const organization = getOrganization();
  const companies = getCompanies().map(companyView);

  return {
    organization,
    companies
  };
}

export function listCompanies() {
  return getCompanies().map(companyView).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getCompanyDetail(companyId) {
  const companies = getCompanies();
  const documents = getDocuments();
  const company = companies.find((item) => item.id === companyId);

  if (!company) {
    return null;
  }

  return {
    ...companyView(company),
    documentoRut: documents.find((item) => item.id === company.documentoRutId) || null,
    obligacionesFiscales: listCompanyObligations(company.id)
  };
}

function getMissingActivationFields(company, document) {
  const missing = [];

  if (!String(company?.nit || "").trim()) {
    missing.push("NIT");
  }

  if (!String(company?.dv || "").trim()) {
    missing.push("DV");
  }

  if (!String(company?.razonSocial || "").trim()) {
    missing.push("razon social");
  }

  if (!String(company?.tipoContribuyente || "").trim()) {
    missing.push("tipo de contribuyente");
  }

  if (!company?.documentoRutId || !document) {
    missing.push("documento RUT asociado");
  }

  return missing;
}

export function getExtraction(extractionId) {
  const extractions = getExtractions();
  const documents = getDocuments();
  const extraction = extractions.find((item) => item.id === extractionId);

  if (!extraction) {
    return null;
  }

  return {
    ...extraction,
    documento: documents.find((item) => item.id === extraction.documentoId) || null
  };
}

export async function saveRutUpload({ fileName, mimeType, buffer, actor = "usr_admin" }) {
  const extension = path.extname(fileName || "").toLowerCase();
  if (mimeType !== "application/pdf" && extension !== ".pdf") {
    throw new Error("Solo se permiten archivos PDF para el RUT.");
  }

  const documentId = createId("doc");
  const extractionId = createId("ext");
  const storedFileName = `${documentId}.pdf`;
  const relativePath = path.join("uploads", "rut", storedFileName);
  const absolutePath = path.join(getUploadsDir(), storedFileName);

  fs.writeFileSync(absolutePath, buffer);

  const extraction = await extractRutDataFromPdf(buffer);
  const now = new Date().toISOString();

  const documents = getDocuments();
  const extractions = getExtractions();
  const audits = getAudits();
  const organization = getOrganization();

  const documentRecord = {
    id: documentId,
    empresaId: null,
    extractionId,
    tipoDocumento: "rut_pdf",
    nombreArchivo: fileName,
    rutaArchivo: relativePath.replaceAll("\\", "/"),
    mimeType,
    tamanio: buffer.length,
    createdAt: now
  };

  const extractionRecord = {
    id: extractionId,
    estadoExtraccion: extraction.estadoExtraccion,
    textoExtraido: extraction.textoExtraido,
    textoExtraidoPreview: extraction.textoExtraidoPreview || extraction.metadataExtraccion?.textoExtraidoPreview || "",
    mensajeExtraccion: extraction.mensajeExtraccion || null,
    datosExtraidos: clone(extraction.datosExtraidos),
    datosExtraidosOriginales: clone(extraction.datosExtraidosOriginales || extraction.datosExtraidos),
    datosConfirmadosPorUsuario: null,
    metadataExtraccion: clone(extraction.metadataExtraccion || {}),
    createdAt: now,
    confirmedAt: null,
    companyId: null,
    documentoId: documentId,
    errorDetalle: extraction.errorDetalle || null
  };

  documents.push(documentRecord);
  extractions.push(extractionRecord);
  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "cargar_rut_pdf",
      modulo: "empresas",
      recursoTipo: "documento_empresa",
      recursoId: documentId,
      descripcion: `Se cargo un PDF RUT para revision humana: ${fileName}.`,
      valorNuevo: {
        extractionId,
        estadoExtraccion: extractionRecord.estadoExtraccion
      }
    })
  );

  saveDocuments(documents);
  saveExtractions(extractions);
  saveAudits(audits);

  return {
    extractionId,
    documentId,
    estadoExtraccion: extractionRecord.estadoExtraccion,
    mensajeExtraccion: extractionRecord.mensajeExtraccion,
    datosExtraidos: extractionRecord.datosExtraidos,
    textoExtraidoPreview: extractionRecord.textoExtraidoPreview
  };
}

export function confirmExtractionAndCreateCompany(extractionId, payload, actor = "usr_admin") {
  const companies = getCompanies();
  const documents = getDocuments();
  const extractions = getExtractions();
  const audits = getAudits();
  const organization = getOrganization();

  const extraction = extractions.find((item) => item.id === extractionId);
  if (!extraction) {
    throw new Error("La extraccion no existe.");
  }

  if (extraction.companyId) {
    throw new Error("Esta extraccion ya fue confirmada.");
  }

  if (!String(payload.estadoEmpresa || "").trim()) {
    throw new Error("El estado inicial de la empresa es obligatorio.");
  }

  if (!extraction.documentoId) {
    throw new Error("La extraccion no tiene un documento RUT asociado.");
  }

  const confirmedData = normalizeConfirmedData(payload);
  const validation = validateCompanyDraft(confirmedData);
  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  if (isDuplicateCompanyIdentity(companies, confirmedData)) {
    throw new Error("Ya existe una empresa con el mismo NIT y DV.");
  }

  const now = new Date().toISOString();
  const companyId = createId("emp");
  const document = documents.find((item) => item.id === extraction.documentoId);
  const representative = normalizeRepresentative(confirmedData.representanteLegalPrincipal);
  const estadoEmpresa = payload.estadoEmpresa || COMPANY_STATUS.PENDING_REVIEW;

  const company = {
    id: companyId,
    nit: confirmedData.nit,
    dv: confirmedData.dv,
    razonSocial: confirmedData.razonSocial,
    nombreComercial: confirmedData.nombreComercial,
    sigla: confirmedData.sigla,
    numeroFormulario: confirmedData.numeroFormulario,
    concepto: confirmedData.concepto,
    direccionSeccional: confirmedData.direccionSeccional,
    buzonElectronico: confirmedData.buzonElectronico,
    tipoContribuyente: confirmedData.tipoContribuyente,
    tipoPersona: confirmedData.tipoPersona,
    tipoDocumento: confirmedData.tipoDocumento,
    numeroIdentificacion: confirmedData.numeroIdentificacion,
    regimenTributario: confirmedData.regimenTributario,
    regimenTributarioFuente: confirmedData.regimenTributarioFuente,
    requiereRevisionRegimen: confirmedData.requiereRevisionRegimen,
    pais: confirmedData.pais,
    departamento: confirmedData.departamento,
    municipio: confirmedData.municipio,
    direccionPrincipal: confirmedData.direccionPrincipal,
    correoElectronico: confirmedData.correoElectronico,
    email: confirmedData.email,
    codigoPostal: confirmedData.codigoPostal,
    telefono1: confirmedData.telefono1,
    telefono2: confirmedData.telefono2,
    actividadEconomicaPrincipal: confirmedData.actividadEconomicaPrincipal,
    actividadEconomicaPrincipalCodigo: confirmedData.actividadEconomicaPrincipalCodigo,
    actividadEconomicaPrincipalNombre: confirmedData.actividadEconomicaPrincipalNombre,
    actividadEconomicaPrincipalFuente: confirmedData.actividadEconomicaPrincipalFuente,
    fechaInicioActividadPrincipal: confirmedData.fechaInicioActividadPrincipal || null,
    actividadEconomicaSecundaria: confirmedData.actividadEconomicaSecundaria,
    fechaInicioActividadSecundaria: confirmedData.fechaInicioActividadSecundaria || null,
    otrasActividades: confirmedData.otrasActividades,
    numeroEstablecimientos: confirmedData.numeroEstablecimientos,
    responsabilidadesTributarias: confirmedData.responsabilidadesTributarias,
    responsableIva: confirmedData.responsableIva,
    obligadoLlevarContabilidad: confirmedData.obligadoLlevarContabilidad,
    obligadoFacturar: confirmedData.obligadoFacturar,
    informanteExogena: confirmedData.informanteExogena,
    agenteRetencionFuente: confirmedData.agenteRetencionFuente,
    informanteBeneficiariosFinales: confirmedData.informanteBeneficiariosFinales,
    representanteLegalPrincipal: representative,
    representanteLegal: representative.nombreCompleto,
    fechaInscripcionRut: payload.fechaInscripcionRut || null,
    fechaGeneracionRut: confirmedData.fechaGeneracionRut || null,
    estadoEmpresa,
    fechaActivacion: estadoEmpresa === COMPANY_STATUS.ACTIVE ? now : null,
    fechaSuspension: null,
    fechaInactivacion: null,
    fechaArchivado: null,
    motivoCambioEstado: "Creacion inicial desde RUT con revision humana",
    cambiadoPor: actor,
    permiteGenerarTareas: estadoEmpresa === COMPANY_STATUS.ACTIVE,
    permiteGenerarObligaciones: estadoEmpresa === COMPANY_STATUS.ACTIVE,
    visibleEnOperacion: estadoEmpresa === COMPANY_STATUS.ACTIVE,
    createdAt: now,
    updatedAt: now,
    documentoRutId: extraction.documentoId,
    identidadKey: companyIdentityKey(confirmedData),
    datosExtraidosOriginales: clone(extraction.datosExtraidosOriginales || extraction.datosExtraidos || {}),
    datosConfirmadosPorUsuario: clone(confirmedData),
    metadataExtraccion: clone(extraction.metadataExtraccion || {})
  };

  companies.push(company);
  extraction.confirmedAt = now;
  extraction.companyId = companyId;
  extraction.datosConfirmadosPorUsuario = clone(confirmedData);

  if (document) {
    document.empresaId = companyId;
  }

  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "crear_empresa",
      modulo: "empresas",
      recursoTipo: "empresa",
      recursoId: companyId,
      descripcion: `Se creo la empresa ${company.razonSocial} desde RUT con revision humana.`,
      valorNuevo: {
        nit: company.nit,
        dv: company.dv,
        razonSocial: company.razonSocial,
        estadoEmpresa: company.estadoEmpresa,
        documentoRutId: company.documentoRutId
      }
    })
  );

  saveCompanies(companies);
  saveExtractions(extractions);
  saveDocuments(documents);
  saveAudits(audits);

  return getCompanyDetail(companyId);
}

export function approveCompanyReview(companyId, actor = "usr_admin") {
  const companies = getCompanies();
  const documents = getDocuments();
  const audits = getAudits();
  const organization = getOrganization();
  const company = companies.find((item) => item.id === companyId);

  if (!company) {
    throw new Error("Empresa no encontrada.");
  }

  if (![COMPANY_STATUS.PENDING_REVIEW, COMPANY_STATUS.DRAFT].includes(company.estadoEmpresa)) {
    throw new Error("Solo se pueden activar empresas en pendiente de revision o borrador.");
  }

  const document = documents.find((item) => item.id === company.documentoRutId) || null;
  const missing = getMissingActivationFields(company, document);

  if (missing.length > 0) {
    throw new Error(`No se puede activar la empresa. Faltan campos obligatorios: ${missing.join(", ")}.`);
  }

  const now = new Date().toISOString();
  company.estadoEmpresa = COMPANY_STATUS.ACTIVE;
  company.permiteGenerarTareas = true;
  company.permiteGenerarObligaciones = true;
  company.visibleEnOperacion = true;
  company.fechaActivacion = now;
  company.motivoCambioEstado = "Revision aprobada por usuario";
  company.cambiadoPor = actor;
  company.updatedAt = now;

  audits.push(
    createAuditEntry({
      organizacionId: organization.id,
      usuarioId: actor,
      accion: "aprobar_revision_empresa",
      modulo: "empresas",
      recursoTipo: "empresa",
      recursoId: company.id,
      descripcion: `Se aprobo la revision y se activo la empresa ${company.razonSocial}.`,
      valorNuevo: {
        estadoEmpresa: company.estadoEmpresa,
        fechaActivacion: company.fechaActivacion,
        permiteGenerarTareas: company.permiteGenerarTareas,
        permiteGenerarObligaciones: company.permiteGenerarObligaciones
      }
    })
  );

  saveCompanies(companies);
  saveAudits(audits);

  return getCompanyDetail(company.id);
}
