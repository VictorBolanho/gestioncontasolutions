import { COMPANY_STATUS, DEFAULT_THEME } from "../../../../packages/domain/index.js";

export const defaultOrganization = {
  id: "org_contasolutions",
  nombre: "ContaSolutions",
  estado: "activa",
  temaVisual: DEFAULT_THEME
};

export const defaultCompanies = [
  {
    id: "emp_acme",
    nit: "900123456",
    dv: "7",
    razonSocial: "Acme SAS",
    nombreComercial: "Acme",
    tipoContribuyente: "persona_juridica",
    tipoPersona: "juridica",
    regimenTributario: "ordinario",
    direccionSeccional: "Bogota",
    email: "contacto@acme.test",
    actividadEconomicaPrincipal: "6201",
    estadoEmpresa: COMPANY_STATUS.ACTIVE,
    fechaInscripcionRut: "2024-01-15",
    fechaGeneracionRut: "2026-04-02",
    fechaActivacion: "2026-04-03",
    fechaSuspension: null,
    fechaInactivacion: null,
    fechaArchivado: null,
    motivoCambioEstado: null,
    cambiadoPor: "usr_admin",
    permiteGenerarTareas: true,
    permiteGenerarObligaciones: true,
    visibleEnOperacion: true,
    createdAt: "2026-04-03T10:00:00.000Z",
    updatedAt: "2026-04-03T10:00:00.000Z",
    documentoRutId: "doc_seed_acme"
  }
];

export const defaultDocuments = [
  {
    id: "doc_seed_acme",
    empresaId: "emp_acme",
    extractionId: "ext_seed_acme",
    tipoDocumento: "rut_pdf",
    nombreArchivo: "acme-rut.pdf",
    rutaArchivo: "seed/acme-rut.pdf",
    mimeType: "application/pdf",
    tamanio: 0,
    createdAt: "2026-04-03T10:00:00.000Z"
  }
];

export const defaultExtractions = [
  {
    id: "ext_seed_acme",
    estadoExtraccion: "exitosa",
    textoExtraido: "Documento semilla de ejemplo",
    datosExtraidos: {
      nit: "900123456",
      dv: "7",
      razonSocial: "Acme SAS",
      nombreComercial: "Acme",
      tipoContribuyente: "persona_juridica",
      tipoPersona: "juridica",
      regimenTributario: "ordinario",
      direccionSeccional: "Bogota",
      email: "contacto@acme.test",
      actividadEconomicaPrincipal: "6201"
    },
    createdAt: "2026-04-03T10:00:00.000Z",
    confirmedAt: "2026-04-03T10:00:00.000Z",
    empresaId: "emp_acme",
    documentoId: "doc_seed_acme"
  }
];

export const defaultAudits = [];

export const defaultTaxes = [
  {
    id: "tax_renta_ordinario",
    codigo: "RENTA_ORD",
    nombre: "Renta y complementarios regimen ordinario",
    nivel: "nacional",
    descripcion: "Obligacion relacionada con renta y complementarios para regimen ordinario.",
    estado: "activo"
  },
  {
    id: "tax_retencion_fuente",
    codigo: "RET_FTE",
    nombre: "Retencion en la fuente",
    nivel: "nacional",
    descripcion: "Obligacion asociada a practicar o declarar retencion en la fuente.",
    estado: "activo"
  },
  {
    id: "tax_exogena",
    codigo: "EXOGENA",
    nombre: "Informacion exogena",
    nivel: "nacional",
    descripcion: "Reporte de informacion exogena ante la DIAN.",
    estado: "activo"
  },
  {
    id: "tax_facturacion_electronica",
    codigo: "FACT_ELEC",
    nombre: "Facturacion electronica",
    nivel: "nacional",
    descripcion: "Obligacion relacionada con facturacion electronica y documentos asociados.",
    estado: "activo"
  },
  {
    id: "tax_contabilidad",
    codigo: "CONTABILIDAD",
    nombre: "Obligacion de llevar contabilidad",
    nivel: "contable",
    descripcion: "Obligacion de llevar contabilidad conforme a la responsabilidad registrada.",
    estado: "activo"
  },
  {
    id: "tax_iva",
    codigo: "IVA",
    nombre: "Impuesto sobre las ventas - IVA",
    nivel: "nacional",
    descripcion: "Obligacion relacionada con IVA.",
    estado: "activo"
  },
  {
    id: "tax_beneficiarios_finales",
    codigo: "BENEF_FINAL",
    nombre: "Reporte de beneficiarios finales",
    nivel: "nacional",
    descripcion: "Obligacion de reporte de beneficiarios finales.",
    estado: "activo"
  },
  {
    id: "tax_ica",
    codigo: "ICA",
    nombre: "Impuesto de Industria y Comercio - ICA",
    nivel: "municipal",
    descripcion: "Obligacion municipal potencial sujeta a validacion manual.",
    estado: "activo"
  }
];

export const defaultTaxRules = [
  {
    id: "rule_renta_05",
    codigoResponsabilidadRut: "05",
    impuestoId: "tax_renta_ordinario",
    nombreRegla: "Responsabilidad 05 genera renta ordinaria",
    descripcion: "Si el RUT tiene responsabilidad 05, sugerir renta y complementarios regimen ordinario.",
    estado: "activo",
    accionSugerida: "sugerir"
  },
  {
    id: "rule_retencion_07",
    codigoResponsabilidadRut: "07",
    impuestoId: "tax_retencion_fuente",
    nombreRegla: "Responsabilidad 07 genera retencion en la fuente",
    descripcion: "Si el RUT tiene responsabilidad 07, sugerir retencion en la fuente.",
    estado: "activo",
    accionSugerida: "sugerir"
  },
  {
    id: "rule_retencion_09",
    codigoResponsabilidadRut: "09",
    impuestoId: "tax_retencion_fuente",
    nombreRegla: "Responsabilidad 09 genera retencion en la fuente",
    descripcion: "Si el RUT tiene responsabilidad 09, sugerir retencion en la fuente.",
    estado: "activo",
    accionSugerida: "sugerir"
  },
  {
    id: "rule_exogena_14",
    codigoResponsabilidadRut: "14",
    impuestoId: "tax_exogena",
    nombreRegla: "Responsabilidad 14 genera informacion exogena",
    descripcion: "Si el RUT tiene responsabilidad 14, sugerir informacion exogena.",
    estado: "activo",
    accionSugerida: "sugerir"
  },
  {
    id: "rule_facturacion_16",
    codigoResponsabilidadRut: "16",
    impuestoId: "tax_facturacion_electronica",
    nombreRegla: "Responsabilidad 16 genera facturacion electronica",
    descripcion: "Si el RUT tiene responsabilidad 16, sugerir facturacion electronica.",
    estado: "activo",
    accionSugerida: "sugerir"
  },
  {
    id: "rule_facturacion_52",
    codigoResponsabilidadRut: "52",
    impuestoId: "tax_facturacion_electronica",
    nombreRegla: "Responsabilidad 52 genera facturacion electronica",
    descripcion: "Si el RUT tiene responsabilidad 52, sugerir facturacion electronica.",
    estado: "activo",
    accionSugerida: "sugerir"
  },
  {
    id: "rule_contabilidad_42",
    codigoResponsabilidadRut: "42",
    impuestoId: "tax_contabilidad",
    nombreRegla: "Responsabilidad 42 genera obligacion contable",
    descripcion: "Si el RUT tiene responsabilidad 42, sugerir obligacion de llevar contabilidad.",
    estado: "activo",
    accionSugerida: "sugerir"
  },
  {
    id: "rule_iva_48",
    codigoResponsabilidadRut: "48",
    impuestoId: "tax_iva",
    nombreRegla: "Responsabilidad 48 genera IVA",
    descripcion: "Si el RUT tiene responsabilidad 48, sugerir IVA.",
    estado: "activo",
    accionSugerida: "sugerir"
  },
  {
    id: "rule_benef_final_55",
    codigoResponsabilidadRut: "55",
    impuestoId: "tax_beneficiarios_finales",
    nombreRegla: "Responsabilidad 55 genera beneficiarios finales",
    descripcion: "Si el RUT tiene responsabilidad 55, sugerir reporte de beneficiarios finales.",
    estado: "activo",
    accionSugerida: "sugerir"
  }
];

export const defaultCompanyObligations = [];
