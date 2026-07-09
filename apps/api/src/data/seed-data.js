import crypto from "node:crypto";
import { COMPANY_STATUS, DEFAULT_THEME } from "../../../../packages/domain/index.js";
import { defaultInferredTaxRules } from "./inferred-tax-matrix.js";

const DEV_SEED_PASSWORD = String(process.env.DEV_SEED_PASSWORD || "dev-only-local-not-for-production").trim();

function buildSeedCredentials(seedKey) {
  const passwordSalt = crypto.createHash("sha256").update(`seed-salt:${seedKey}`).digest("hex").slice(0, 16);
  const passwordHash = crypto.createHash("sha256").update(`${passwordSalt}:${DEV_SEED_PASSWORD}`).digest("hex");
  return {
    passwordSalt,
    passwordHash
  };
}

export const defaultOrganization = {
  id: "org_contasolutions",
  nombre: "ContaSolutions",
  estado: "activa",
  temaVisual: DEFAULT_THEME
};

export const defaultUsers = [
  {
    id: "usr_admin",
    nombre: "Demo",
    apellido: "Owner",
    nombreCompleto: "Demo Owner",
    email: "owner.demo@example.test",
    cargo: "Super admin",
    estado: "activo",
    roles: ["owner"],
    permisos: [],
    empresasAsignadas: [],
    supervisedUsers: ["usr_senior"],
    supervisorId: "",
    ...buildSeedCredentials("usr_admin"),
    ultimoLoginAt: null,
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-05-01T09:00:00.000Z"
  },
  {
    id: "usr_senior",
    nombre: "Demo",
    apellido: "Senior",
    nombreCompleto: "Demo Senior",
    email: "senior.demo@example.test",
    cargo: "Contador senior",
    estado: "activo",
    roles: ["senior_accountant"],
    permisos: [],
    empresasAsignadas: ["emp_acme"],
    supervisedUsers: ["usr_junior_paula", "usr_junior_sara", "usr_apprentice_camila"],
    supervisorId: "usr_admin",
    ...buildSeedCredentials("usr_senior"),
    ultimoLoginAt: null,
    createdAt: "2026-05-01T09:05:00.000Z",
    updatedAt: "2026-05-01T09:05:00.000Z"
  },
  {
    id: "usr_junior_paula",
    nombre: "Demo",
    apellido: "Junior Alpha",
    nombreCompleto: "Demo Junior Alpha",
    email: "junior.alpha@example.test",
    cargo: "Contadora junior",
    estado: "activo",
    roles: ["junior_accountant"],
    permisos: [],
    empresasAsignadas: ["emp_acme"],
    supervisedUsers: [],
    supervisorId: "usr_senior",
    ...buildSeedCredentials("usr_junior_paula"),
    ultimoLoginAt: null,
    createdAt: "2026-05-01T09:10:00.000Z",
    updatedAt: "2026-05-01T09:10:00.000Z"
  },
  {
    id: "usr_junior_sara",
    nombre: "Demo",
    apellido: "Junior Beta",
    nombreCompleto: "Demo Junior Beta",
    email: "junior.beta@example.test",
    cargo: "Contadora junior",
    estado: "activo",
    roles: ["junior_accountant"],
    permisos: [],
    empresasAsignadas: ["emp_acme"],
    supervisedUsers: [],
    supervisorId: "usr_senior",
    ...buildSeedCredentials("usr_junior_sara"),
    ultimoLoginAt: null,
    createdAt: "2026-05-01T09:15:00.000Z",
    updatedAt: "2026-05-01T09:15:00.000Z"
  },
  {
    id: "usr_apprentice_camila",
    nombre: "Demo",
    apellido: "Apprentice",
    nombreCompleto: "Demo Apprentice",
    email: "apprentice.demo@example.test",
    cargo: "Aprendiz contable",
    estado: "activo",
    roles: ["apprentice"],
    permisos: [],
    empresasAsignadas: [],
    supervisedUsers: [],
    supervisorId: "usr_senior",
    ...buildSeedCredentials("usr_apprentice_camila"),
    ultimoLoginAt: null,
    createdAt: "2026-05-01T09:20:00.000Z",
    updatedAt: "2026-05-01T09:20:00.000Z"
  }
];

export const defaultSessions = [];

export const defaultInternalAlerts = [];

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
    periodicidadDefault: "anual",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: true,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_retencion_fuente",
    codigo: "RET_FTE",
    nombre: "Retencion en la fuente",
    nivel: "nacional",
    descripcion: "Obligacion asociada a practicar o declarar retencion en la fuente.",
    periodicidadDefault: "mensual",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: true,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_gmf",
    codigo: "GMF",
    nombre: "Gravamen a los movimientos financieros",
    nivel: "nacional",
    descripcion: "Obligacion de declaracion y pago semanal del GMF segun calendario vigente DIAN.",
    periodicidadDefault: "semanal",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: false,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_exogena",
    codigo: "EXOGENA",
    nombre: "Informacion exogena",
    nivel: "nacional",
    descripcion: "Reporte de informacion exogena ante la DIAN.",
    periodicidadDefault: "anual",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: true,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_facturacion_electronica",
    codigo: "FACT_ELEC",
    nombre: "Facturacion electronica",
    nivel: "nacional",
    descripcion: "Obligacion relacionada con facturacion electronica y documentos asociados.",
    periodicidadDefault: "mensual",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: false,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_contabilidad",
    codigo: "CONTABILIDAD",
    nombre: "Obligacion de llevar contabilidad",
    nivel: "contable",
    descripcion: "Obligacion de llevar contabilidad conforme a la responsabilidad registrada.",
    periodicidadDefault: "anual",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: false,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_iva",
    codigo: "IVA",
    nombre: "Impuesto sobre las ventas - IVA",
    nivel: "nacional",
    descripcion: "Obligacion relacionada con IVA.",
    periodicidadDefault: "bimestral",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: true,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_beneficiarios_finales",
    codigo: "BENEF_FINAL",
    nombre: "Reporte de beneficiarios finales",
    nivel: "nacional",
    descripcion: "Obligacion de reporte de beneficiarios finales.",
    periodicidadDefault: "anual",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: false,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_ica",
    codigo: "ICA",
    nombre: "Impuesto de Industria y Comercio - ICA",
    nivel: "municipal",
    descripcion: "Obligacion municipal potencial sujeta a validacion manual.",
    periodicidadDefault: "bimestral",
    requiereMunicipio: true,
    requiereDepartamento: false,
    aplicaPorNit: true,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_rst",
    codigo: "RST",
    nombre: "Regimen Simple de Tributacion",
    nivel: "nacional",
    descripcion: "Impuesto para contribuyentes acogidos al regimen simple.",
    periodicidadDefault: "bimestral",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: true,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_consumo",
    codigo: "CONSUMO",
    nombre: "Impuesto nacional al consumo",
    nivel: "nacional",
    descripcion: "Impuesto nacional al consumo segun actividad u obligacion aplicable.",
    periodicidadDefault: "bimestral",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: true,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_carbono",
    codigo: "CARBONO",
    nombre: "Impuesto nacional al carbono",
    nivel: "nacional",
    descripcion: "Impuesto nacional al carbono con vencimientos periodicos segun norma vigente.",
    periodicidadDefault: "bimestral",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: true,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_gasolina_acpm",
    codigo: "GAS_ACPM",
    nombre: "Gasolina y ACPM",
    nivel: "nacional",
    descripcion: "Obligacion asociada a gasolina y ACPM.",
    periodicidadDefault: "mensual",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: true,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_patrimonio",
    codigo: "PATRIMONIO",
    nombre: "Impuesto al patrimonio",
    nivel: "nacional",
    descripcion: "Impuesto al patrimonio segun regimen y topes aplicables.",
    periodicidadDefault: "anual",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: true,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_rub",
    codigo: "RUB",
    nombre: "Registro Unico de Beneficiarios Finales",
    nivel: "nacional",
    descripcion: "Actualizacion del Registro Unico de Beneficiarios Finales.",
    periodicidadDefault: "anual",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: false,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_activos_exterior",
    codigo: "ACT_EXT",
    nombre: "Activos en el exterior",
    nivel: "nacional",
    descripcion: "Declaracion anual de activos en el exterior.",
    periodicidadDefault: "anual",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: true,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_precios_transferencia",
    codigo: "PRECIOS_TRANSF",
    nombre: "Precios de transferencia",
    nivel: "nacional",
    descripcion: "Declaracion informativa y documentacion comprobatoria de precios de transferencia.",
    periodicidadDefault: "anual",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: false,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_iva_exterior",
    codigo: "IVA_EXT",
    nombre: "IVA prestadores de servicios desde el exterior",
    nivel: "nacional",
    descripcion: "Declaracion y pago bimestral de IVA para prestadores de servicios desde el exterior.",
    periodicidadDefault: "bimestral",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: false,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_pes",
    codigo: "PES",
    nombre: "Presencia Economica Significativa",
    nivel: "nacional",
    descripcion: "Pagos anticipados bimestrales y declaracion anual de PES.",
    periodicidadDefault: "bimestral",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: false,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_plasticos",
    codigo: "PLASTICOS",
    nombre: "Productos plasticos de un solo uso",
    nivel: "nacional",
    descripcion: "Presentacion y pago del impuesto a productos plasticos de un solo uso.",
    periodicidadDefault: "bimestral",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: false,
    aplicaPorDv: false,
    estado: "activo"
  },
  {
    id: "tax_ultraprocesados",
    codigo: "ULTRAPROC",
    nombre: "Bebidas y comestibles ultraprocesados",
    nivel: "nacional",
    descripcion: "Presentacion y pago de bebidas ultraprocesadas azucaradas y productos comestibles ultraprocesados.",
    periodicidadDefault: "bimestral",
    requiereMunicipio: false,
    requiereDepartamento: false,
    aplicaPorNit: false,
    aplicaPorDv: false,
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

export { defaultInferredTaxRules };

export const defaultCompanyObligations = [];

const SEED_NOW = "2026-05-01T00:00:00.000Z";
const DIAN_DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

function seedDate(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function createSeedCalendar(base) {
  return {
    pais: "COLOMBIA",
    departamento: "",
    municipioCiudad: "",
    municipio: "",
    ultimoDigitoNit: "",
    rangoUltimosDigitosNit: "",
    digitoVerificacion: "",
    tipoContribuyente: "",
    regimen: "",
    numeroCuota: null,
    nombreCuota: "",
    eventoFiscalClave: "",
    eventoFiscal: "",
    tipoPago: "declaracion_y_pago",
    requiereDeclaracion: true,
    requierePago: true,
    fuenteCalendario: "semilla_local",
    version: 1,
    estado: "activo",
    createdAt: SEED_NOW,
    updatedAt: SEED_NOW,
    creadoPor: "usr_admin",
    actualizadoPor: "usr_admin",
    ...base
  };
}

function buildPerDigitCalendars({
  idPrefix,
  impuestoId,
  anio,
  periodo,
  periodicidad,
  nivel = "nacional",
  criterioVencimiento = "ultimo_digito_nit",
  startDate,
  endDate,
  dueYear,
  dueMonth,
  dueDays,
  tipoContribuyente = "",
  regimen = "",
  eventoFiscalClave = "",
  eventoFiscal = "",
  numeroCuota = null,
  nombreCuota = "",
  tipoPago = "declaracion_y_pago",
  departamento = "",
  municipioCiudad = "",
  fuenteCalendario = "semilla_local"
}) {
  return DIAN_DIGITS.map((digit, index) =>
    createSeedCalendar({
      id: `${idPrefix}_${digit}`,
      impuestoId,
      anio,
      periodo,
      periodicidad,
      nivel,
      departamento,
      municipioCiudad,
      municipio: municipioCiudad,
      criterioVencimiento,
      ultimoDigitoNit: criterioVencimiento === "ultimo_digito_nit" ? digit : "",
      tipoContribuyente,
      regimen,
      eventoFiscalClave,
      eventoFiscal,
      numeroCuota,
      nombreCuota,
      tipoPago,
      fuenteCalendario,
      fechaInicioPeriodo: startDate,
      fechaFinPeriodo: endDate,
      fechaVencimiento: seedDate(dueYear, dueMonth, dueDays[index])
    })
  );
}

function buildRangeCalendars({
  idPrefix,
  impuestoId,
  anio,
  periodo,
  periodicidad,
  startDate,
  endDate,
  dueYear,
  dueMonth,
  ranges,
  dueDays,
  tipoContribuyente = "persona natural",
  eventoFiscalClave = "",
  eventoFiscal = "",
  nombreCuota = "Declaracion y pago",
  fuenteCalendario = "semilla_local"
}) {
  return ranges.map((range, index) =>
    createSeedCalendar({
      id: `${idPrefix}_${range.replace(/[^0-9]/g, "")}`,
      impuestoId,
      anio,
      periodo,
      periodicidad,
      nivel: "nacional",
      criterioVencimiento: "dos_ultimos_digitos_nit",
      rangoUltimosDigitosNit: range,
      tipoContribuyente,
      eventoFiscalClave,
      eventoFiscal,
      nombreCuota,
      fuenteCalendario,
      fechaInicioPeriodo: startDate,
      fechaFinPeriodo: endDate,
      fechaVencimiento: seedDate(dueYear, dueMonth, dueDays[index])
    })
  );
}

function buildFixedCalendars({
  idPrefix,
  impuestoId,
  anio,
  periodicidad,
  entries,
  tipoPago = "declaracion_y_pago",
  nombreCuota = "",
  fuenteCalendario = "semilla_local"
}) {
  return entries.map((entry, index) =>
    createSeedCalendar({
      id: `${idPrefix}_${index + 1}`,
      impuestoId,
      anio,
      periodo: entry.periodo,
      periodicidad,
      nivel: "nacional",
      criterioVencimiento: "independiente_nit",
      eventoFiscalClave: entry.eventoFiscalClave || "",
      eventoFiscal: entry.eventoFiscal || "",
      nombreCuota: entry.nombreCuota || nombreCuota,
      tipoPago: entry.tipoPago || tipoPago,
      fuenteCalendario: entry.fuenteCalendario || fuenteCalendario,
      fechaInicioPeriodo: entry.fechaInicioPeriodo || "",
      fechaFinPeriodo: entry.fechaFinPeriodo || "",
      fechaVencimiento: entry.fechaVencimiento
    })
  );
}

function firstSaturdayOfYear(year) {
  const date = new Date(Date.UTC(year, 0, 1));
  while (date.getUTCDay() !== 6) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date;
}

function formatDateUtc(date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function buildWeeklyGmfCalendars(year) {
  const firstWeekStart = firstSaturdayOfYear(year);
  const firstSaturdayNextYear = firstSaturdayOfYear(year + 1);
  const entries = [];
  let weekStart = new Date(firstWeekStart.getTime());
  let weekIndex = 1;

  while (weekStart < firstSaturdayNextYear) {
    const weekEnd = addUtcDays(weekStart, 6);
    const dueDate = addUtcDays(weekEnd, 4);
    const periodLabel = `semana-${String(weekIndex).padStart(2, "0")}`;

    entries.push({
      periodo: periodLabel,
      fechaInicioPeriodo: formatDateUtc(weekStart),
      fechaFinPeriodo: formatDateUtc(weekEnd),
      fechaVencimiento: formatDateUtc(dueDate),
      nombreCuota: `Semana ${String(weekIndex).padStart(2, "0")}`
    });

    weekStart = addUtcDays(weekStart, 7);
    weekIndex += 1;
  }

  return buildFixedCalendars({
    idPrefix: `cal_gmf_${year}`,
    impuestoId: "tax_gmf",
    anio: year,
    periodicidad: "semanal",
    entries
  });
}

const IVA_BIMESTRAL_2026 = [
  {
    idPrefix: "cal_iva_2026_ene_feb",
    periodo: "enero-febrero",
    startDate: "2026-01-01",
    endDate: "2026-02-28",
    dueYear: 2026,
    dueMonth: 3,
    dueDays: [10, 11, 12, 13, 16, 17, 18, 19, 20, 24]
  },
  {
    idPrefix: "cal_iva_2026_mar_abr",
    periodo: "marzo-abril",
    startDate: "2026-03-01",
    endDate: "2026-04-30",
    dueYear: 2026,
    dueMonth: 5,
    dueDays: [12, 13, 14, 15, 19, 20, 21, 22, 25, 26]
  },
  {
    idPrefix: "cal_iva_2026_may_jun",
    periodo: "mayo-junio",
    startDate: "2026-05-01",
    endDate: "2026-06-30",
    dueYear: 2026,
    dueMonth: 7,
    dueDays: [9, 10, 13, 14, 15, 16, 17, 21, 22, 23]
  },
  {
    idPrefix: "cal_iva_2026_jul_ago",
    periodo: "julio-agosto",
    startDate: "2026-07-01",
    endDate: "2026-08-31",
    dueYear: 2026,
    dueMonth: 9,
    dueDays: [12, 13, 14, 18, 19, 20, 21, 24, 25, 26]
  },
  {
    idPrefix: "cal_iva_2026_sep_oct",
    periodo: "septiembre-octubre",
    startDate: "2026-09-01",
    endDate: "2026-10-31",
    dueYear: 2026,
    dueMonth: 11,
    dueDays: [11, 12, 13, 17, 18, 19, 20, 23, 24, 25]
  },
  {
    idPrefix: "cal_iva_2026_nov_dic",
    periodo: "noviembre-diciembre",
    startDate: "2026-11-01",
    endDate: "2026-12-31",
    dueYear: 2027,
    dueMonth: 1,
    dueDays: [13, 14, 15, 18, 19, 20, 21, 22, 25, 26]
  }
];

const IVA_CUATRIMESTRAL_2026 = [
  {
    idPrefix: "cal_iva4_2026_ene_abr",
    periodo: "enero-abril",
    startDate: "2026-01-01",
    endDate: "2026-04-30",
    dueYear: 2026,
    dueMonth: 5,
    dueDays: [12, 13, 14, 15, 19, 20, 21, 22, 25, 26]
  },
  {
    idPrefix: "cal_iva4_2026_may_ago",
    periodo: "mayo-agosto",
    startDate: "2026-05-01",
    endDate: "2026-08-31",
    dueYear: 2026,
    dueMonth: 9,
    dueDays: [9, 10, 13, 14, 15, 16, 17, 21, 22, 23]
  },
  {
    idPrefix: "cal_iva4_2026_sep_dic",
    periodo: "septiembre-diciembre",
    startDate: "2026-09-01",
    endDate: "2026-12-31",
    dueYear: 2027,
    dueMonth: 1,
    dueDays: [13, 14, 15, 18, 19, 20, 21, 22, 25, 26]
  }
];

const RETENCION_MENSUAL_2026 = [
  { idPrefix: "cal_ret_2026_ene", periodo: "enero", startDate: "2026-01-01", endDate: "2026-01-31", dueYear: 2026, dueMonth: 3, dueDays: [10, 11, 12, 13, 16, 17, 18, 19, 20, 24] },
  { idPrefix: "cal_ret_2026_feb", periodo: "febrero", startDate: "2026-02-01", endDate: "2026-02-28", dueYear: 2026, dueMonth: 4, dueDays: [13, 14, 15, 16, 20, 21, 22, 23, 24, 27] },
  { idPrefix: "cal_ret_2026_mar", periodo: "marzo", startDate: "2026-03-01", endDate: "2026-03-31", dueYear: 2026, dueMonth: 5, dueDays: [12, 13, 14, 15, 19, 20, 21, 22, 25, 26] },
  { idPrefix: "cal_ret_2026_abr", periodo: "abril", startDate: "2026-04-01", endDate: "2026-04-30", dueYear: 2026, dueMonth: 6, dueDays: [9, 10, 13, 14, 15, 16, 17, 21, 22, 23] },
  { idPrefix: "cal_ret_2026_may", periodo: "mayo", startDate: "2026-05-01", endDate: "2026-05-31", dueYear: 2026, dueMonth: 7, dueDays: [12, 13, 14, 15, 19, 20, 21, 22, 25, 26] },
  { idPrefix: "cal_ret_2026_jun", periodo: "junio", startDate: "2026-06-01", endDate: "2026-06-30", dueYear: 2026, dueMonth: 8, dueDays: [12, 13, 14, 15, 19, 20, 21, 22, 25, 26] },
  { idPrefix: "cal_ret_2026_jul", periodo: "julio", startDate: "2026-07-01", endDate: "2026-07-31", dueYear: 2026, dueMonth: 9, dueDays: [10, 11, 12, 16, 17, 18, 19, 22, 23, 24] },
  { idPrefix: "cal_ret_2026_ago", periodo: "agosto", startDate: "2026-08-01", endDate: "2026-08-31", dueYear: 2026, dueMonth: 10, dueDays: [9, 10, 13, 14, 15, 16, 17, 21, 22, 23] },
  { idPrefix: "cal_ret_2026_sep", periodo: "septiembre", startDate: "2026-09-01", endDate: "2026-09-30", dueYear: 2026, dueMonth: 11, dueDays: [11, 12, 13, 17, 18, 19, 20, 23, 24, 25] },
  { idPrefix: "cal_ret_2026_oct", periodo: "octubre", startDate: "2026-10-01", endDate: "2026-10-31", dueYear: 2026, dueMonth: 12, dueDays: [9, 10, 11, 14, 15, 16, 17, 18, 21, 22] },
  { idPrefix: "cal_ret_2026_nov", periodo: "noviembre", startDate: "2026-11-01", endDate: "2026-11-30", dueYear: 2027, dueMonth: 1, dueDays: [13, 14, 15, 18, 19, 20, 21, 22, 25, 26] }
];

const RST_ANTICIPO_2026 = [
  {
    idPrefix: "cal_rst_2026_ene_feb",
    periodo: "enero-febrero",
    startDate: "2026-01-01",
    endDate: "2026-02-28",
    dueYear: 2026,
    dueMonth: 5,
    dueDays: [12, 13, 14, 15, 19, 20, 21, 22, 25, 26]
  },
  {
    idPrefix: "cal_rst_2026_mar_abr",
    periodo: "marzo-abril",
    startDate: "2026-03-01",
    endDate: "2026-04-30",
    dueYear: 2026,
    dueMonth: 6,
    dueDays: [10, 11, 12, 16, 17, 18, 19, 22, 23, 24]
  },
  {
    idPrefix: "cal_rst_2026_may_jun",
    periodo: "mayo-junio",
    startDate: "2026-05-01",
    endDate: "2026-06-30",
    dueYear: 2026,
    dueMonth: 7,
    dueDays: [9, 10, 13, 14, 15, 16, 17, 21, 22, 23]
  },
  {
    idPrefix: "cal_rst_2026_jul_ago",
    periodo: "julio-agosto",
    startDate: "2026-07-01",
    endDate: "2026-08-31",
    dueYear: 2026,
    dueMonth: 9,
    dueDays: [12, 13, 14, 18, 19, 20, 21, 24, 25, 26]
  },
  {
    idPrefix: "cal_rst_2026_sep_oct",
    periodo: "septiembre-octubre",
    startDate: "2026-09-01",
    endDate: "2026-10-31",
    dueYear: 2026,
    dueMonth: 11,
    dueDays: [11, 12, 13, 17, 18, 19, 20, 23, 24, 25]
  },
  {
    idPrefix: "cal_rst_2026_nov_dic",
    periodo: "noviembre-diciembre",
    startDate: "2026-11-01",
    endDate: "2026-12-31",
    dueYear: 2027,
    dueMonth: 1,
    dueDays: [13, 14, 15, 18, 19, 20, 21, 22, 25, 26]
  }
];

const RST_DECLARACION_ANUAL_2026 = {
  idPrefix: "cal_rst_2026_anual",
  periodo: "anual",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  dueYear: 2026,
  dueMonth: 4,
  dueDays: [20, 20, 21, 21, 22, 22, 23, 23, 24, 24]
};

const RST_IVA_CONSOLIDADA_2026 = {
  idPrefix: "cal_rst_iva_2026_anual",
  periodo: "anual",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  dueYear: 2026,
  dueMonth: 2,
  dueDays: [16, 16, 17, 17, 18, 18, 19, 19, 20, 20]
};

export const defaultFiscalCalendars = [
  ...buildWeeklyGmfCalendars(2026),
  ...RETENCION_MENSUAL_2026.flatMap((entry) =>
    buildPerDigitCalendars({
      idPrefix: entry.idPrefix,
      impuestoId: "tax_retencion_fuente",
      anio: 2026,
      periodo: entry.periodo,
      periodicidad: "mensual",
      startDate: entry.startDate,
      endDate: entry.endDate,
      dueYear: entry.dueYear,
      dueMonth: entry.dueMonth,
      dueDays: entry.dueDays,
      fuenteCalendario: "DIAN"
    })
  ),
  ...RST_ANTICIPO_2026.flatMap((entry) =>
    buildPerDigitCalendars({
      idPrefix: entry.idPrefix,
      impuestoId: "tax_rst",
      anio: 2026,
      periodo: entry.periodo,
      periodicidad: "bimestral",
      startDate: entry.startDate,
      endDate: entry.endDate,
      dueYear: entry.dueYear,
      dueMonth: entry.dueMonth,
      dueDays: entry.dueDays,
      fuenteCalendario: "DIAN",
      eventoFiscalClave: "anticipo_bimestral",
      eventoFiscal: "Anticipo bimestral RST",
      tipoPago: "anticipo",
      nombreCuota: "Anticipo bimestral RST"
    })
  ),
  ...buildPerDigitCalendars({
    idPrefix: RST_DECLARACION_ANUAL_2026.idPrefix,
    impuestoId: "tax_rst",
    anio: 2026,
    periodo: RST_DECLARACION_ANUAL_2026.periodo,
    periodicidad: "anual",
    startDate: RST_DECLARACION_ANUAL_2026.startDate,
    endDate: RST_DECLARACION_ANUAL_2026.endDate,
    dueYear: RST_DECLARACION_ANUAL_2026.dueYear,
    dueMonth: RST_DECLARACION_ANUAL_2026.dueMonth,
    dueDays: RST_DECLARACION_ANUAL_2026.dueDays,
    fuenteCalendario: "DIAN",
    eventoFiscalClave: "declaracion_anual_consolidada",
    eventoFiscal: "Declaracion anual consolidada RST",
    tipoPago: "declaracion_y_pago",
    nombreCuota: "Declaracion anual consolidada RST"
  }),
  ...buildPerDigitCalendars({
    idPrefix: RST_IVA_CONSOLIDADA_2026.idPrefix,
    impuestoId: "tax_rst",
    anio: 2026,
    periodo: RST_IVA_CONSOLIDADA_2026.periodo,
    periodicidad: "anual",
    startDate: RST_IVA_CONSOLIDADA_2026.startDate,
    endDate: RST_IVA_CONSOLIDADA_2026.endDate,
    dueYear: RST_IVA_CONSOLIDADA_2026.dueYear,
    dueMonth: RST_IVA_CONSOLIDADA_2026.dueMonth,
    dueDays: RST_IVA_CONSOLIDADA_2026.dueDays,
    fuenteCalendario: "DIAN",
    eventoFiscalClave: "consolidada_iva",
    eventoFiscal: "Consolidada de IVA RST",
    tipoPago: "declaracion_y_pago",
    nombreCuota: "Consolidada de IVA RST"
  }),
  ...IVA_BIMESTRAL_2026.flatMap((entry) =>
    buildPerDigitCalendars({
      idPrefix: entry.idPrefix,
      impuestoId: "tax_iva",
      anio: 2026,
      periodo: entry.periodo,
      periodicidad: "bimestral",
      startDate: entry.startDate,
      endDate: entry.endDate,
      dueYear: entry.dueYear,
      dueMonth: entry.dueMonth,
      dueDays: entry.dueDays
      ,
      fuenteCalendario: "DIAN"
    })
  ),
  ...IVA_BIMESTRAL_2026.flatMap((entry) =>
    buildPerDigitCalendars({
      idPrefix: entry.idPrefix.replace("cal_iva_", "cal_consumo_"),
      impuestoId: "tax_consumo",
      anio: 2026,
      periodo: entry.periodo,
      periodicidad: "bimestral",
      startDate: entry.startDate,
      endDate: entry.endDate,
      dueYear: entry.dueYear,
      dueMonth: entry.dueMonth,
      dueDays: entry.dueDays
      ,
      fuenteCalendario: "DIAN"
    })
  ),
  ...IVA_CUATRIMESTRAL_2026.flatMap((entry) =>
    buildPerDigitCalendars({
      idPrefix: entry.idPrefix,
      impuestoId: "tax_iva",
      anio: 2026,
      periodo: entry.periodo,
      periodicidad: "cuatrimestral",
      startDate: entry.startDate,
      endDate: entry.endDate,
      dueYear: entry.dueYear,
      dueMonth: entry.dueMonth,
      dueDays: entry.dueDays,
      fuenteCalendario: "DIAN"
    })
  ),
  ...buildPerDigitCalendars({
    idPrefix: "cal_renta_juridica_2026_cuota1",
    impuestoId: "tax_renta_ordinario",
    anio: 2026,
    periodo: "anual",
    periodicidad: "anual",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    dueYear: 2026,
    dueMonth: 5,
    dueDays: [12, 13, 14, 15, 19, 20, 21, 22, 25, 26],
    tipoContribuyente: "persona juridica",
    numeroCuota: 1,
    nombreCuota: "Declaracion y pago 1a cuota",
    tipoPago: "cuota",
    fuenteCalendario: "DIAN"
  }),
  ...buildPerDigitCalendars({
    idPrefix: "cal_renta_juridica_2026_cuota2",
    impuestoId: "tax_renta_ordinario",
    anio: 2026,
    periodo: "anual",
    periodicidad: "anual",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    dueYear: 2026,
    dueMonth: 7,
    dueDays: [9, 10, 13, 14, 15, 16, 17, 21, 22, 23],
    tipoContribuyente: "persona juridica",
    numeroCuota: 2,
    nombreCuota: "Pago 2a cuota",
    tipoPago: "cuota",
    fuenteCalendario: "DIAN"
  }),
  ...buildPerDigitCalendars({
    idPrefix: "cal_renta_gc_2026_cuota1",
    impuestoId: "tax_renta_ordinario",
    anio: 2026,
    periodo: "anual",
    periodicidad: "anual",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    dueYear: 2026,
    dueMonth: 2,
    dueDays: [10, 11, 12, 13, 16, 17, 18, 19, 20, 23],
    tipoContribuyente: "gran contribuyente",
    numeroCuota: 1,
    nombreCuota: "Pago 1a cuota",
    tipoPago: "cuota",
    fuenteCalendario: "DIAN"
  }),
  ...buildPerDigitCalendars({
    idPrefix: "cal_renta_gc_2026_cuota2",
    impuestoId: "tax_renta_ordinario",
    anio: 2026,
    periodo: "anual",
    periodicidad: "anual",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    dueYear: 2026,
    dueMonth: 4,
    dueDays: [13, 14, 15, 16, 20, 21, 22, 23, 24, 27],
    tipoContribuyente: "gran contribuyente",
    numeroCuota: 2,
    nombreCuota: "Declaracion y pago 2a cuota",
    tipoPago: "cuota",
    fuenteCalendario: "DIAN"
  }),
  ...buildPerDigitCalendars({
    idPrefix: "cal_renta_gc_2026_cuota3",
    impuestoId: "tax_renta_ordinario",
    anio: 2026,
    periodo: "anual",
    periodicidad: "anual",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    dueYear: 2026,
    dueMonth: 6,
    dueDays: [10, 11, 12, 16, 17, 18, 19, 22, 23, 24],
    tipoContribuyente: "gran contribuyente",
    numeroCuota: 3,
    nombreCuota: "Pago 3a cuota",
    tipoPago: "cuota",
    fuenteCalendario: "DIAN"
  }),
  ...buildRangeCalendars({
    idPrefix: "cal_renta_nat_2026_ago",
    impuestoId: "tax_renta_ordinario",
    anio: 2026,
    periodo: "anual",
    periodicidad: "anual",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    dueYear: 2026,
    dueMonth: 8,
    ranges: ["01-02", "03-04", "05-06", "07-08", "09-10", "11-12", "13-14", "15-16", "17-18", "19-20", "21-22", "23-24", "25-26"],
    dueDays: [12, 13, 14, 18, 19, 20, 21, 24, 25, 26, 27, 28, 31],
    fuenteCalendario: "DIAN"
  }),
  ...buildRangeCalendars({
    idPrefix: "cal_renta_nat_2026_sep",
    impuestoId: "tax_renta_ordinario",
    anio: 2026,
    periodo: "anual",
    periodicidad: "anual",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    dueYear: 2026,
    dueMonth: 9,
    ranges: ["27-28", "29-30", "31-32", "33-34", "35-36", "37-38", "39-40", "41-42", "43-44", "45-46", "47-48", "49-50", "51-52", "53-54", "55-56", "57-58", "59-60", "61-62", "63-64", "65-66"],
    dueDays: [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28],
    fuenteCalendario: "DIAN"
  }),
  ...buildRangeCalendars({
    idPrefix: "cal_renta_nat_2026_oct",
    impuestoId: "tax_renta_ordinario",
    anio: 2026,
    periodo: "anual",
    periodicidad: "anual",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    dueYear: 2026,
    dueMonth: 10,
    ranges: ["67-68", "69-70", "71-72", "73-74", "75-76", "77-78", "79-80", "81-82", "83-84", "85-86", "87-88", "89-90", "91-92", "93-94", "95-96", "97-98", "99-00"],
    dueDays: [1, 2, 5, 6, 7, 8, 9, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26],
    fuenteCalendario: "DIAN"
  }),
  ...buildFixedCalendars({
    idPrefix: "cal_carbono_2026",
    impuestoId: "tax_carbono",
    anio: 2026,
    periodicidad: "bimestral",
    fuenteCalendario: "DIAN",
    entries: [
      { periodo: "enero-febrero", fechaInicioPeriodo: "2026-01-01", fechaFinPeriodo: "2026-02-28", fechaVencimiento: "2026-03-13" },
      { periodo: "marzo-abril", fechaInicioPeriodo: "2026-03-01", fechaFinPeriodo: "2026-04-30", fechaVencimiento: "2026-05-15" },
      { periodo: "mayo-junio", fechaInicioPeriodo: "2026-05-01", fechaFinPeriodo: "2026-06-30", fechaVencimiento: "2026-07-14" },
      { periodo: "julio-agosto", fechaInicioPeriodo: "2026-07-01", fechaFinPeriodo: "2026-08-31", fechaVencimiento: "2026-09-14" },
      { periodo: "septiembre-octubre", fechaInicioPeriodo: "2026-09-01", fechaFinPeriodo: "2026-10-31", fechaVencimiento: "2026-11-17" },
      { periodo: "noviembre-diciembre", fechaInicioPeriodo: "2026-11-01", fechaFinPeriodo: "2026-12-31", fechaVencimiento: "2027-01-18" }
    ]
  }),
  ...buildFixedCalendars({
    idPrefix: "cal_iva_ext_2026",
    impuestoId: "tax_iva_exterior",
    anio: 2026,
    periodicidad: "bimestral",
    fuenteCalendario: "DIAN",
    entries: [
      { periodo: "enero-febrero", fechaInicioPeriodo: "2026-01-01", fechaFinPeriodo: "2026-02-28", fechaVencimiento: "2026-03-13" },
      { periodo: "marzo-abril", fechaInicioPeriodo: "2026-03-01", fechaFinPeriodo: "2026-04-30", fechaVencimiento: "2026-05-15" },
      { periodo: "mayo-junio", fechaInicioPeriodo: "2026-05-01", fechaFinPeriodo: "2026-06-30", fechaVencimiento: "2026-07-14" },
      { periodo: "julio-agosto", fechaInicioPeriodo: "2026-07-01", fechaFinPeriodo: "2026-08-31", fechaVencimiento: "2026-09-14" },
      { periodo: "septiembre-octubre", fechaInicioPeriodo: "2026-09-01", fechaFinPeriodo: "2026-10-31", fechaVencimiento: "2026-11-17" },
      { periodo: "noviembre-diciembre", fechaInicioPeriodo: "2026-11-01", fechaFinPeriodo: "2026-12-31", fechaVencimiento: "2027-01-18" }
    ]
  }),
  ...buildFixedCalendars({
    idPrefix: "cal_gas_acpm_2026",
    impuestoId: "tax_gasolina_acpm",
    anio: 2026,
    periodicidad: "mensual",
    fuenteCalendario: "DIAN",
    entries: [
      { periodo: "enero", fechaInicioPeriodo: "2026-01-01", fechaFinPeriodo: "2026-01-31", fechaVencimiento: "2026-02-13" },
      { periodo: "febrero", fechaInicioPeriodo: "2026-02-01", fechaFinPeriodo: "2026-02-28", fechaVencimiento: "2026-03-13" },
      { periodo: "marzo", fechaInicioPeriodo: "2026-03-01", fechaFinPeriodo: "2026-03-31", fechaVencimiento: "2026-04-16" },
      { periodo: "abril", fechaInicioPeriodo: "2026-04-01", fechaFinPeriodo: "2026-04-30", fechaVencimiento: "2026-05-15" },
      { periodo: "mayo", fechaInicioPeriodo: "2026-05-01", fechaFinPeriodo: "2026-05-31", fechaVencimiento: "2026-06-16" },
      { periodo: "junio", fechaInicioPeriodo: "2026-06-01", fechaFinPeriodo: "2026-06-30", fechaVencimiento: "2026-07-14" },
      { periodo: "julio", fechaInicioPeriodo: "2026-07-01", fechaFinPeriodo: "2026-07-31", fechaVencimiento: "2026-08-18" },
      { periodo: "agosto", fechaInicioPeriodo: "2026-08-01", fechaFinPeriodo: "2026-08-31", fechaVencimiento: "2026-09-14" },
      { periodo: "septiembre", fechaInicioPeriodo: "2026-09-01", fechaFinPeriodo: "2026-09-30", fechaVencimiento: "2026-10-15" },
      { periodo: "octubre", fechaInicioPeriodo: "2026-10-01", fechaFinPeriodo: "2026-10-31", fechaVencimiento: "2026-11-17" },
      { periodo: "noviembre", fechaInicioPeriodo: "2026-11-01", fechaFinPeriodo: "2026-11-30", fechaVencimiento: "2026-12-15" },
      { periodo: "diciembre", fechaInicioPeriodo: "2026-12-01", fechaFinPeriodo: "2026-12-31", fechaVencimiento: "2027-01-18" }
    ]
  }),
  ...buildFixedCalendars({
    idPrefix: "cal_rub_2026",
    impuestoId: "tax_rub",
    anio: 2026,
    periodicidad: "anual",
    fuenteCalendario: "DIAN",
    entries: [
      {
        periodo: "anual",
        fechaInicioPeriodo: "2026-01-01",
        fechaFinPeriodo: "2026-12-31",
        fechaVencimiento: "2026-04-23",
        nombreCuota: "Actualizacion anual",
        tipoPago: "solo_declaracion"
      }
    ]
  }),
  createSeedCalendar({
    id: "cal_ica_bogota_2026_bim1",
    impuestoId: "tax_ica",
    anio: 2026,
    periodo: "enero-febrero",
    periodicidad: "bimestral",
    nivel: "municipal",
    departamento: "Bogota D.C.",
    municipioCiudad: "Bogota D.C.",
    municipio: "Bogota D.C.",
    criterioVencimiento: "independiente_nit",
    fechaInicioPeriodo: "2026-01-01",
    fechaFinPeriodo: "2026-02-28",
    fechaVencimiento: "2026-03-20"
  }),
  ...buildFixedCalendars({
    idPrefix: "cal_plasticos_2026",
    impuestoId: "tax_plasticos",
    anio: 2026,
    periodicidad: "bimestral",
    fuenteCalendario: "DIAN",
    entries: [
      { periodo: "enero-febrero", fechaInicioPeriodo: "2026-01-01", fechaFinPeriodo: "2026-02-28", fechaVencimiento: "2026-03-13" },
      { periodo: "marzo-abril", fechaInicioPeriodo: "2026-03-01", fechaFinPeriodo: "2026-04-30", fechaVencimiento: "2026-05-15" },
      { periodo: "mayo-junio", fechaInicioPeriodo: "2026-05-01", fechaFinPeriodo: "2026-06-30", fechaVencimiento: "2026-07-14" },
      { periodo: "julio-agosto", fechaInicioPeriodo: "2026-07-01", fechaFinPeriodo: "2026-08-31", fechaVencimiento: "2026-09-14" },
      { periodo: "septiembre-octubre", fechaInicioPeriodo: "2026-09-01", fechaFinPeriodo: "2026-10-31", fechaVencimiento: "2026-11-17" },
      { periodo: "noviembre-diciembre", fechaInicioPeriodo: "2026-11-01", fechaFinPeriodo: "2026-12-31", fechaVencimiento: "2027-01-18" }
    ]
  }),
  ...buildFixedCalendars({
    idPrefix: "cal_ultraprocesados_2026",
    impuestoId: "tax_ultraprocesados",
    anio: 2026,
    periodicidad: "bimestral",
    fuenteCalendario: "DIAN",
    entries: [
      { periodo: "enero-febrero", fechaInicioPeriodo: "2026-01-01", fechaFinPeriodo: "2026-02-28", fechaVencimiento: "2026-03-13" },
      { periodo: "marzo-abril", fechaInicioPeriodo: "2026-03-01", fechaFinPeriodo: "2026-04-30", fechaVencimiento: "2026-05-15" },
      { periodo: "mayo-junio", fechaInicioPeriodo: "2026-05-01", fechaFinPeriodo: "2026-06-30", fechaVencimiento: "2026-07-14" },
      { periodo: "julio-agosto", fechaInicioPeriodo: "2026-07-01", fechaFinPeriodo: "2026-08-31", fechaVencimiento: "2026-09-14" },
      { periodo: "septiembre-octubre", fechaInicioPeriodo: "2026-09-01", fechaFinPeriodo: "2026-10-31", fechaVencimiento: "2026-11-17" },
      { periodo: "noviembre-diciembre", fechaInicioPeriodo: "2026-11-01", fechaFinPeriodo: "2026-12-31", fechaVencimiento: "2027-01-18" }
    ]
  }),
  ...buildFixedCalendars({
    idPrefix: "cal_pes_2026",
    impuestoId: "tax_pes",
    anio: 2026,
    periodicidad: "bimestral",
    fuenteCalendario: "DIAN",
    entries: [
      { periodo: "enero-febrero", fechaInicioPeriodo: "2026-01-01", fechaFinPeriodo: "2026-02-28", fechaVencimiento: "2026-03-13" },
      { periodo: "marzo-abril", fechaInicioPeriodo: "2026-03-01", fechaFinPeriodo: "2026-04-30", fechaVencimiento: "2026-05-15" },
      { periodo: "mayo-junio", fechaInicioPeriodo: "2026-05-01", fechaFinPeriodo: "2026-06-30", fechaVencimiento: "2026-07-14" },
      { periodo: "julio-agosto", fechaInicioPeriodo: "2026-07-01", fechaFinPeriodo: "2026-08-31", fechaVencimiento: "2026-09-14" },
      { periodo: "septiembre-octubre", fechaInicioPeriodo: "2026-09-01", fechaFinPeriodo: "2026-10-31", fechaVencimiento: "2026-11-17" },
      { periodo: "noviembre-diciembre", fechaInicioPeriodo: "2026-11-01", fechaFinPeriodo: "2026-12-31", fechaVencimiento: "2027-01-18" }
    ]
  })
];

export const defaultFiscalCalendarVersions = [];

export const defaultFiscalTasks = [];
