const API_BASE_URL =
  document.querySelector('meta[name="api-base-url"]')?.getAttribute("content") ||
  `${window.location.protocol}//${window.location.hostname}:4000`;

const NO_TEXT_MESSAGE = "No se pudo extraer texto legible del PDF. Revisa los datos manualmente.";

const COMPANY_STATUS_OPTIONS = [
  { value: "pendiente_revision", label: "Pendiente de revision" },
  { value: "activa", label: "Activa" },
  { value: "borrador", label: "Borrador" }
];

const TAX_LEVEL_OPTIONS = [
  { value: "nacional", label: "Nacional" },
  { value: "departamental", label: "Departamental" },
  { value: "municipal", label: "Municipal" },
  { value: "contable", label: "Contable" },
  { value: "comercial", label: "Comercial" }
];

const PERIODICITY_OPTIONS = [
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "cuatrimestral", label: "Cuatrimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
  { value: "ocasional", label: "Ocasional" },
  { value: "unica_vez", label: "Unica vez" },
  { value: "personalizada", label: "Personalizada" }
];

const CALENDAR_STATE_OPTIONS = [
  { value: "borrador", label: "Borrador" },
  { value: "validado", label: "Validado" },
  { value: "activo", label: "Activo" }
];

const CALENDAR_SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "DIAN", label: "DIAN" },
  { value: "municipio", label: "Municipio" },
  { value: "importado_excel", label: "Importado Excel" },
  { value: "otro", label: "Otro" }
];

const DUE_CRITERIA_OPTIONS = [
  { value: "fijo", label: "Fijo" },
  { value: "ultimo_digito_nit", label: "Ultimo digito NIT" },
  { value: "dos_ultimos_digitos_nit", label: "Dos ultimos digitos NIT" },
  { value: "digito_verificacion", label: "Digito verificacion" },
  { value: "independiente_nit", label: "Independiente NIT" },
  { value: "personalizado", label: "Personalizado" }
];

const PAYMENT_TYPE_OPTIONS = [
  { value: "declaracion_y_pago", label: "Declaracion y pago" },
  { value: "solo_declaracion", label: "Solo declaracion" },
  { value: "solo_pago", label: "Solo pago" },
  { value: "anticipo", label: "Anticipo" },
  { value: "cuota", label: "Cuota" }
];

const FISCAL_EVENT_OPTIONS_BY_TAX = Object.freeze({
  tax_rst: [
    { value: "anticipo_bimestral", label: "Anticipo bimestral RST", periodicidad: "bimestral" },
    { value: "declaracion_anual_consolidada", label: "Declaracion anual consolidada RST", periodicidad: "anual" },
    { value: "consolidada_iva", label: "Consolidada de IVA RST", periodicidad: "anual" }
  ]
});

const TASK_TYPE_OPTIONS = [
  { value: "fiscal", label: "Fiscal" },
  { value: "cumplimiento_dian", label: "Cumplimiento DIAN" },
  { value: "contable", label: "Contable" },
  { value: "administrativa", label: "Administrativa" },
  { value: "operativa", label: "Operativa" },
  { value: "comercial", label: "Comercial" },
  { value: "interna", label: "Interna" },
  { value: "cliente", label: "Cliente" }
];

const MANUAL_TASK_TYPE_OPTIONS = TASK_TYPE_OPTIONS.filter((option) => option.value !== "fiscal");

const TASK_STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "presentada", label: "Presentada" },
  { value: "completada", label: "Completada" },
  { value: "vencida", label: "Vencida" },
  { value: "cancelada", label: "Cancelada" },
  { value: "no_aplica", label: "No aplica" }
];

const TASK_WORKFLOW_OPTIONS = [
  { value: "pendiente_preparacion", label: "Pendiente preparacion" },
  { value: "en_preparacion", label: "En preparacion" },
  { value: "preparada", label: "Preparada" },
  { value: "en_revision", label: "En revision" },
  { value: "aprobada", label: "Aprobada" },
  { value: "presentada", label: "Presentada" },
  { value: "pagada", label: "Pagada" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "no_aplica", label: "No aplica" }
];

const TASK_PRIORITY_OPTIONS = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Critica" }
];

const TASK_SUPPORT_FIELDS = [
  { name: "numeroFormulario", label: "Numero de formulario" },
  { name: "numeroAcuse", label: "Numero de acuse / radicado" },
  { name: "numeroReciboPago", label: "Numero de recibo de pago" },
  { name: "referenciaSoporte", label: "Referencia interna / enlace" },
  { name: "fechaPresentacionReal", label: "Fecha real de presentacion", type: "date" },
  { name: "fechaPagoReal", label: "Fecha real de pago", type: "date" }
];

const ALERT_TYPE_OPTIONS = [
  { value: "proxima_vencer", label: "Proxima a vencer" },
  { value: "vencida", label: "Vencida" }
];

const ALERT_LEVEL_OPTIONS = [
  { value: "informativa", label: "Informativa" },
  { value: "preventiva", label: "Preventiva" },
  { value: "critica", label: "Critica" }
];

const ALERT_STATUS_OPTIONS = [
  { value: "no_leida", label: "Nueva" },
  { value: "leida", label: "Leida" },
  { value: "atendida", label: "Atendida" },
  { value: "descartada", label: "Descartada" }
];

const ROLE_OPTIONS = [
  { value: "owner", label: "Dueña / Gerente" },
  { value: "senior_accountant", label: "Contador senior" },
  { value: "junior_accountant", label: "Contador junior" },
  { value: "apprentice", label: "Aprendiz / Practicante" },
  { value: "solo_lectura", label: "Solo lectura" }
];

const ROLE_DESCRIPTIONS = {
  owner: "Control total sobre usuarios, empresas, reportes, auditoria y reasignaciones globales.",
  senior_accountant: "Gestiona cartera propia y supervisa juniors con revision y aprobacion operativa.",
  junior_accountant: "Opera empresas asignadas, registra avances y ejecuta tareas de cumplimiento.",
  apprentice: "Trabaja tareas puntuales con acceso limitado a informacion minima necesaria.",
  solo_lectura: "Visualiza informacion sin modificar registros."
};

const AUTH_STORAGE_KEY = "gestorconta_auth_token";

const state = {
  authToken: window.localStorage.getItem(AUTH_STORAGE_KEY) || "",
  currentUser: null,
  authMessage: null,
  bootstrap: null,
  companies: [],
  companyObligations: [],
  taxes: [],
  inferredTaxRules: [],
  fiscalCalendars: [],
  fiscalTasks: [],
  internalAlerts: [],
  dashboardData: null,
  dashboardLoading: false,
  dashboardError: null,
  audits: [],
  taskResponsibles: [],
  users: [],
  selectedCompany: null,
  accessDeniedView: "",
  currentExtraction: null,
  rutFlowMode: "create",
  rutTargetCompanyId: "",
  uploadMessage: null,
  saveMessage: null,
  calendarMessage: null,
  userManagementMessage: null,
  fiscalGenerationSummary: null,
  activeView: "rut",
  sidebarActiveKey: "rut-upload",
  fiscalTab: "companies",
  operationalSelectedDate: "",
  editingTaxId: null,
  editingUserId: null,
  fiscalModal: null,
  fiscalFilters: {
    assignmentCompanyId: "",
    calendarYear: String(new Date().getFullYear()),
    calendarTaxId: "",
    generationYear: String(new Date().getFullYear()),
    generationCompanyId: "",
    generationTaxId: "",
    operationalYear: String(new Date().getFullYear()),
    operationalMonth: "",
    operationalCompanyId: "",
    operationalTaxId: "",
    operationalState: "",
    operationalResponsibleId: "",
    operationalDueKind: "",
    operationalTaskType: "",
    operationalClientRisk: "",
    alertCompanyId: "",
    alertResponsibleId: "",
    alertState: "",
    alertType: "",
    alertLevel: ""
  },
  reportFilters: {
    companyId: ""
  },
  showTextModal: false,
  advancedOpen: false
};

const FISCAL_SIDEBAR_KEY_BY_TAB = {
  obligations: "tax-management",
  taxes: "tax-management",
  rules: "tax-management",
  companies: "fiscal-companies",
  assignments: "fiscal-companies",
  calendars: "fiscal-calendars",
  generation: "fiscal-tasks",
  operational: "fiscal-tasks",
  alerts: "fiscal-alerts"
};

function getSidebarActiveKeyForView(view = state.activeView, fiscalTab = state.fiscalTab) {
  if (view === "fiscal-calendar") {
    return FISCAL_SIDEBAR_KEY_BY_TAB[fiscalTab] || "tax-management";
  }

  if (view === "dashboard") {
    return "dashboard-reports";
  }

  if (view === "users") {
    return "users-admin";
  }

  if (view === "portal-cliente") {
    return "portal-home";
  }

  if (view === "reportes") {
    return "reports-view";
  }

  if (view === "configuracion") {
    return "config-view";
  }

  if (view === "auditoria") {
    return "audit-view";
  }

  if (view === "respaldos") {
    return "backup-view";
  }

  return "rut-upload";
}

const FISCAL_SECTION_DEFINITIONS = Object.freeze([
  {
    id: "obligations",
    sidebarKey: "tax-management",
    label: "Obligaciones",
    title: "Obligaciones fiscales",
    description: "Revisa obligaciones detectadas, confirmadas, sugeridas o descartadas sin duplicar navegacion.",
    isVisible: () => getVisibleMenuItems().some((item) => item.key === "tax-management")
  },
  {
    id: "companies",
    sidebarKey: "fiscal-companies",
    label: "Empresas fiscales",
    title: "Empresas fiscales",
    description: "Relaciona cada empresa con los impuestos y obligaciones que tiene asignados.",
    isVisible: () => getVisibleMenuItems().some((item) => item.key === "fiscal-companies")
  },
  {
    id: "calendars",
    sidebarKey: "fiscal-calendars",
    label: "Calendarios",
    title: "Calendario fiscal",
    description: "Consulta vencimientos y calendarios fiscales vigentes sin mezclar tareas ni alertas.",
    isVisible: () => getVisibleMenuItems().some((item) => item.key === "fiscal-calendars")
  },
  {
    id: "operational",
    sidebarKey: "fiscal-tasks",
    label: "Tareas",
    title: "Tareas fiscales",
    description: "Haz seguimiento a las tareas operativas derivadas de obligaciones y calendarios activos.",
    isVisible: () => getVisibleMenuItems().some((item) => item.key === "fiscal-tasks")
  },
  {
    id: "alerts",
    sidebarKey: "fiscal-alerts",
    label: "Alertas",
    title: "Alertas fiscales",
    description: "Visualiza vencimientos proximos, riesgos, inconsistencias y pendientes criticos.",
    isVisible: () => getVisibleMenuItems().some((item) => item.key === "fiscal-alerts")
  }
]);

function normalizeFiscalSectionId(sectionId) {
  if (sectionId === "taxes" || sectionId === "assignments") {
    return "obligations";
  }

  if (sectionId === "generation") {
    return "operational";
  }

  if (sectionId === "rules") {
    return "obligations";
  }

  return sectionId || "obligations";
}

function getVisibleFiscalSections() {
  return FISCAL_SECTION_DEFINITIONS.filter((section) => section.isVisible());
}

function ensureVisibleFiscalSection() {
  const visibleSections = getVisibleFiscalSections();

  if (!visibleSections.length) {
    state.fiscalTab = "";
    return null;
  }

  const normalizedSectionId = normalizeFiscalSectionId(state.fiscalTab);
  const sidebarMatch = visibleSections.find((section) => section.sidebarKey === state.sidebarActiveKey);
  const sectionById = visibleSections.find((section) => section.id === normalizedSectionId);
  const resolvedSection = sectionById || sidebarMatch || visibleSections[0];

  state.fiscalTab = resolvedSection.id;
  return resolvedSection;
}

function getFiscalSectionConfig() {
  return ensureVisibleFiscalSection();
}

function getFiscalSectionIdFromSidebarKey(sidebarKey) {
  return FISCAL_SECTION_DEFINITIONS.find((section) => section.sidebarKey === sidebarKey)?.id || "";
}

const MAIN_SECTIONS = [
  {
    title: "Datos principales",
    fields: [
      { name: "nit", label: "NIT", required: true },
      { name: "dv", label: "DV", required: true },
      { name: "razonSocial", label: "Razon social", required: true, full: true },
      { name: "nombreComercial", label: "Nombre comercial" },
      { name: "tipoContribuyente", label: "Tipo de contribuyente", required: true },
      { name: "tipoPersona", label: "Tipo de persona" },
      { name: "regimenTributario", label: "Regimen tributario" },
      { name: "estadoEmpresa", label: "Estado inicial de empresa", type: "select", required: true }
    ]
  },
  {
    title: "Ubicacion",
    fields: [
      { name: "direccionSeccional", label: "Direccion seccional" },
      { name: "pais", label: "Pais" },
      { name: "departamento", label: "Departamento" },
      { name: "municipio", label: "Municipio" },
      { name: "direccionPrincipal", label: "Direccion principal", full: true },
      { name: "correoElectronico", label: "Correo", type: "email" },
      { name: "telefono1", label: "Telefono 1" },
      { name: "telefono2", label: "Telefono 2" },
      { name: "codigoPostal", label: "Codigo postal" }
    ]
  },
  {
    title: "Actividad economica",
    fields: [
      { name: "actividadEconomicaPrincipalCodigo", label: "Codigo actividad principal" },
      { name: "actividadEconomicaPrincipalNombre", label: "Nombre actividad principal", full: true },
      { name: "fechaInicioActividadPrincipal", label: "Fecha inicio actividad principal", type: "date" },
      { name: "numeroEstablecimientos", label: "Numero de establecimientos" }
    ]
  },
  {
    title: "Representante legal",
    fields: [
      { name: "representanteLegalPrincipal.nombreCompleto", label: "Nombre completo", full: true },
      { name: "representanteLegalPrincipal.tipoDocumento", label: "Tipo de documento" },
      { name: "representanteLegalPrincipal.numeroIdentificacion", label: "Numero de identificacion" },
      { name: "representanteLegalPrincipal.fechaInicioRepresentacion", label: "Fecha inicio representacion", type: "date" }
    ]
  }
];

const ADVANCED_FIELDS = [
  { name: "numeroFormulario", label: "Numero de formulario" },
  { name: "concepto", label: "Concepto" },
  { name: "buzonElectronico", label: "Buzon electronico" },
  { name: "sigla", label: "Sigla" },
  { name: "tipoDocumento", label: "Tipo documento empresa" },
  { name: "numeroIdentificacion", label: "Numero identificacion empresa" },
  { name: "regimenTributarioFuente", label: "Fuente de regimen" }
];

const RESPONSIBILITY_FLAGS = [
  { name: "responsableIva", label: "Responsable IVA" },
  { name: "obligadoFacturar", label: "Obligado a facturar" },
  { name: "obligadoLlevarContabilidad", label: "Obligado a llevar contabilidad" },
  { name: "agenteRetencionFuente", label: "Agente de retencion en la fuente" },
  { name: "informanteExogena", label: "Informante de exogena" },
  { name: "informanteBeneficiariosFinales", label: "Informante beneficiarios finales" }
];

const REQUIRED_FIELDS = ["nit", "dv", "razonSocial", "tipoContribuyente", "estadoEmpresa"];
const SIDEBAR_FLOW_STEPS = [
  {
    id: "step-upload",
    label: "Carga PDF del RUT",
    targetId: "upload-section"
  },
  {
    id: "step-review",
    label: "Revisa lo esencial",
    targetId: "review-section"
  },
  {
    id: "step-confirm",
    label: "Confirma y crea empresa",
    targetId: "confirm-section"
  }
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatStatus(value) {
  return String(value || "").replaceAll("_", " ");
}

function statusClass(status) {
  return `status-badge status-${status}`;
}

function formatDateLabel(value) {
  if (!value) {
    return "No definida";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-CO");
}

function formatStepperStatus(status) {
  const labels = {
    active: "En curso",
    completed: "Completado",
    pending: "Pendiente",
    blocked: "Bloqueado"
  };

  return labels[status] || formatStatus(status);
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty("--color-primary", theme.colorPrimario);
  root.style.setProperty("--color-sidebar", theme.colorSidebar);
  root.style.setProperty("--color-secondary", theme.colorSecundario);
  root.style.setProperty("--color-accent", theme.colorAcento);
  root.style.setProperty("--color-bg", theme.colorFondo);
  root.style.setProperty("--color-surface", theme.colorSuperficie);
  root.style.setProperty("--color-border", theme.colorBorde);
  root.style.setProperty("--color-text", theme.colorTextoPrincipal);
  root.style.setProperty("--color-text-muted", theme.colorTextoSecundario);
}

function getValue(object, path) {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((current, key) => current?.[key], object);
}

function setValue(object, path, value) {
  const keys = String(path || "").split(".").filter(Boolean);
  let current = object;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    current[key] = current[key] || {};
    current = current[key];
  }

  current[keys.at(-1)] = value;
}

function persistAuthToken(token) {
  state.authToken = token || "";
  if (state.authToken) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, state.authToken);
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function currentPermissions() {
  return Array.isArray(state.currentUser?.permisosEfectivos) ? state.currentUser.permisosEfectivos : [];
}

function hasPermission(permission) {
  return currentPermissions().includes(permission);
}

function hasAnyPermission(permissions) {
  return permissions.some((permission) => hasPermission(permission));
}

function primaryRole() {
  return state.currentUser?.primaryRole || state.currentUser?.roles?.[0] || "";
}

function canAccessModule(moduleName) {
  return Boolean(state.currentUser?.moduleAccess?.[moduleName]);
}

function getVisibleMenuItems() {
  const items = Array.isArray(state.currentUser?.visibleMenuItems) ? [...state.currentUser.visibleMenuItems] : [];

  if (!isClientPortalUser() && canAccessModule("portal_cliente") && !items.some((item) => item.key === "portal-home")) {
    items.unshift({
      key: "portal-home",
      id: "portal-cliente",
      label: "Portal cliente",
      icon: "chart",
      module: "portal_cliente"
    });
  }

  return items;
}

function isClientPortalUser() {
  return state.currentUser?.esPortalCliente === true || primaryRole() === "cliente";
}

function canViewSensitiveCompanyData() {
  return state.currentUser?.canViewSensitiveCompanyData === true || hasPermission("ver_datos_sensibles_empresa");
}

function canUseDashboard() {
  return canAccessModule("dashboard") || hasAnyPermission(["ver_dashboard_general", "ver_dashboard_supervisor", "ver_dashboard_usuario"]);
}

function shouldDefaultToDashboard() {
  return state.currentUser?.defaultView === "dashboard";
}

function canAccessView(view) {
  if (!state.currentUser) {
    return false;
  }

  if (view === "portal-cliente") {
    return canAccessModule("portal_cliente");
  }

  if (isClientPortalUser()) {
    return view === "portal-cliente";
  }

  if (view === "dashboard") {
    return canUseDashboard();
  }

  if (view === "users") {
    return canAccessModule("usuarios");
  }

  if (view === "reportes") {
    return canAccessModule("reportes");
  }

  if (view === "configuracion") {
    return canAccessModule("configuracion");
  }

  if (view === "auditoria") {
    return canAccessModule("auditoria");
  }

  if (view === "respaldos") {
    return canAccessModule("respaldos");
  }

  if (view === "rut") {
    return canAccessModule("empresas") || canAccessModule("rut");
  }

  if (view === "fiscal-calendar") {
    return (
      canAccessModule("empresas") ||
      canAccessModule("obligaciones") ||
      canAccessModule("calendarios") ||
      canAccessModule("tareas") ||
      canAccessModule("alertas")
    );
  }

  return false;
}

function canAccessCompany(companyId) {
  if (!state.currentUser) {
    return false;
  }

  if (hasPermission("ver_todas_empresas")) {
    return true;
  }

  return Array.isArray(state.currentUser.empresasAsignadas) && state.currentUser.empresasAsignadas.includes(companyId);
}

function normalizeIdentityValue(value) {
  return String(value || "").replace(/\D/g, "");
}

function findRutMatchedCompany(values = reviewFormValues()) {
  const nit = normalizeIdentityValue(values.nit);
  const dv = normalizeIdentityValue(values.dv);
  if (!nit || !dv) {
    return null;
  }

  return state.companies.find(
    (company) => normalizeIdentityValue(company.nit) === nit && normalizeIdentityValue(company.dv) === dv
  ) || null;
}

async function fetchJson(path, options) {
  try {
    const headers = new Headers(options?.headers || {});
    if (state.authToken) {
      headers.set("Authorization", `Bearer ${state.authToken}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
      if (response.status === 401) {
        persistAuthToken("");
        state.currentUser = null;
      }
      throw new Error(payload?.error || "No fue posible completar la operacion.");
    }

    return payload;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Verifica que el servidor API este encendido.");
    }

    throw error;
  }
}

async function downloadAuthenticatedFile(path, suggestedFileName = "reporte.html") {
  const headers = new Headers();
  if (state.authToken) {
    headers.set("Authorization", `Bearer ${state.authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    const payload = contentType.includes("application/json") ? await response.json() : null;
    throw new Error(payload?.error || "No se pudo descargar el archivo.");
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") || "";
  const matchedName = contentDisposition.match(/filename="([^"]+)"/i);
  const fileName = matchedName?.[1] || suggestedFileName;
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

async function updateObligationWithFallback(editingObligation, payload) {
  try {
    return await fetchJson(`/api/company-obligations/${editingObligation.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const normalizedMessage = String(error?.message || "").toLowerCase();
    const canFallback = normalizedMessage.includes("ruta no encontrada") || normalizedMessage.includes("not found");

    if (!canFallback) {
      throw error;
    }

    const nextStatus = String(payload.estado || editingObligation.estado || "").trim();
    const actionMap = {
      activa: {
        path: `/api/company-obligations/${editingObligation.id}/confirm`,
        successMessage: "Impuesto activado correctamente."
      },
      pendiente_revision: {
        path: `/api/company-obligations/${editingObligation.id}/review`,
        successMessage: "Impuesto enviado a revision correctamente."
      },
      no_aplica: {
        path: `/api/company-obligations/${editingObligation.id}/not-applicable`,
        successMessage: "Impuesto marcado como no aplica."
      }
    };

    const fallbackAction = actionMap[nextStatus];
    if (!fallbackAction) {
      throw error;
    }

    const result = await fetchJson(fallbackAction.path, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        observaciones: payload.observaciones || editingObligation.observaciones || ""
      })
    });

    return {
      ...result,
      __fallbackSuccessMessage: fallbackAction.successMessage
    };
  }
}

async function previewTaxImpact(taxId, payload) {
  return fetchJson(`/api/taxes/${taxId}/impact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

async function loadBootstrap() {
  state.bootstrap = await fetchJson("/api/bootstrap");
  state.companies = state.bootstrap.companies;
  state.currentUser = state.bootstrap.currentUser;
  applyTheme(state.bootstrap.organization.temaVisual);
}

async function refreshCompanies() {
  const response = await fetchJson("/api/companies");
  state.companies = response.items;
}

async function refreshTaxes() {
  const response = await fetchJson("/api/taxes");
  state.taxes = response.items;
}

async function refreshInferredTaxRules() {
  const response = await fetchJson("/api/inferred-tax-rules");
  state.inferredTaxRules = response.items;
}

async function refreshCompanyObligations() {
  const response = await fetchJson("/api/company-obligations");
  state.companyObligations = response.items;
}

async function refreshFiscalCalendars() {
  const response = await fetchJson("/api/fiscal-calendars");
  state.fiscalCalendars = response.items;
}

async function refreshFiscalTasks() {
  const response = await fetchJson("/api/tasks");
  state.fiscalTasks = response.items;
}

async function refreshInternalAlerts() {
  const params = new URLSearchParams();
  if (state.fiscalFilters.alertCompanyId) params.set("empresaId", state.fiscalFilters.alertCompanyId);
  if (state.fiscalFilters.alertResponsibleId) params.set("responsableId", state.fiscalFilters.alertResponsibleId);
  if (state.fiscalFilters.alertState) params.set("estado", state.fiscalFilters.alertState);
  if (state.fiscalFilters.alertType) params.set("tipo", state.fiscalFilters.alertType);
  if (state.fiscalFilters.alertLevel) params.set("nivel", state.fiscalFilters.alertLevel);
  const query = params.toString();
  const response = await fetchJson(`/api/alerts${query ? `?${query}` : ""}`);
  state.internalAlerts = response.items;
}

async function refreshDashboard() {
  state.dashboardLoading = true;
  state.dashboardError = null;
  render();

  try {
    state.dashboardData = await fetchJson("/api/dashboard");
  } catch (error) {
    state.dashboardError = toUserMessage(error, "No se pudo cargar el dashboard.");
  } finally {
    state.dashboardLoading = false;
  }
}

async function refreshAudits() {
  const response = await fetchJson("/api/audits");
  state.audits = response.items;
}

async function refreshTaskResponsibles() {
  const response = await fetchJson("/api/task-responsibles");
  state.taskResponsibles = response.items;
}

async function refreshUsers() {
  const response = await fetchJson("/api/users");
  state.users = response.items;
}

async function loadCompany(companyId) {
  state.selectedCompany = await fetchJson(`/api/companies/${companyId}`);
}

async function refreshSelectedCompany() {
  if (!state.selectedCompany?.id) {
    return;
  }

  state.selectedCompany = await fetchJson(`/api/companies/${state.selectedCompany.id}`);
}

async function refreshCompanyContext() {
  await refreshCompanies();
  await refreshSelectedCompany();
  await refreshCompanyObligations();
}

function getActionErrorMessage(action) {
  const messages = {
    loadCompany: "No se pudo cargar el detalle de la empresa.",
    analyzeObligations: "No se pudo analizar las obligaciones de la empresa.",
    confirmObligation: "No se pudo confirmar la obligacion.",
    notApplicableObligation: "No se pudo marcar la obligacion como no aplica.",
    reviewObligation: "No se pudo enviar la obligacion a revision.",
    approveCompany: "No se pudo activar la empresa.",
    loadCalendars: "No se pudo cargar el calendario fiscal.",
    createCalendar: "No se pudo crear el calendario fiscal.",
    updateCalendar: "No se pudo actualizar el calendario fiscal.",
    activateCalendar: "No se pudo activar el calendario fiscal.",
    deleteCalendar: "No se pudo eliminar el calendario fiscal.",
    generateFiscalTasks: "No se pudieron generar las tareas fiscales.",
    createTax: "No se pudo guardar el impuesto.",
    updateTax: "No se pudo actualizar el impuesto.",
    createInferredRule: "No se pudo guardar la regla deducida.",
    updateInferredRule: "No se pudo actualizar la regla deducida."
  };

  return messages[action] || "No se pudo completar la operacion solicitada.";
}

function toUserMessage(error, fallbackMessage) {
  const baseMessage = String(error?.message || "").trim();
  if (!baseMessage) {
    return fallbackMessage;
  }

  if (baseMessage === "Verifica que el servidor API este encendido.") {
    return `${fallbackMessage} Verifica que el servidor API este encendido.`;
  }

  return baseMessage;
}

function getSidebarFlowState() {
  if (state.selectedCompany?.id) {
    return SIDEBAR_FLOW_STEPS.map((step) => ({
      ...step,
      status: "completed",
      clickable: true
    }));
  }

  if (!state.currentExtraction) {
    return SIDEBAR_FLOW_STEPS.map((step, index) => ({
      ...step,
      status: index === 0 ? "active" : "blocked",
      clickable: index === 0
    }));
  }

  const values = reviewFormValues();
  const summary = computeReviewSummary(values);

  if (summary.isValid) {
    return SIDEBAR_FLOW_STEPS.map((step, index) => ({
      ...step,
      status: index < 2 ? "completed" : "active",
      clickable: true
    }));
  }

  return SIDEBAR_FLOW_STEPS.map((step, index) => ({
    ...step,
    status: index === 0 ? "completed" : index === 1 ? "active" : "pending",
    clickable: index < 2
  }));
}

function renderSidebarStepper() {
  const steps = getSidebarFlowState();

  return `
    <div class="stepper-list" aria-label="Flujo empresas desde RUT">
      ${steps
        .map((step, index) => {
          const marker = step.status === "completed" ? "✓" : String(index + 1);

          return `
            <button
              class="stepper-item stepper-${step.status}"
              type="button"
              data-step-target="${step.targetId}"
              ${step.clickable ? "" : "disabled"}
            >
              <span class="stepper-marker">${escapeHtml(marker)}</span>
              <span class="stepper-copy">
                <span class="stepper-label">${escapeHtml(step.label)}</span>
                <span class="stepper-status">${escapeHtml(formatStepperStatus(step.status))}</span>
              </span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderSidebarNavigation() {
  const items = [
    { id: "rut", label: "Fase 1 · Empresas desde RUT" },
    { id: "fiscal-calendar", label: "Calendario fiscal" }
  ];

  return `
    <nav class="nav-list">
      ${items
        .map(
          (item) => `
            <button class="nav-item ${state.activeView === item.id ? "active" : ""}" data-view="${item.id}" type="button">
              ${escapeHtml(item.label)}
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function renderSidebarNavigationV2Legacy() {
  const items = [
    { id: "rut", label: "Cargue de empresas", caption: "Carga y valida RUT", icon: "↑" },
    { id: "fiscal-calendar", label: "Gestion tributaria", caption: "Impuestos y calendario", icon: "◌" }
  ];

  return `
    <nav class="nav-list nav-list-rich">
      ${items
        .map(
          (item) => `
            <button class="nav-item nav-card ${state.activeView === item.id ? "active" : ""}" data-view="${item.id}" type="button">
              <span class="nav-card-icon">${item.icon}</span>
              <span class="nav-card-copy">
                <span class="nav-card-title">${escapeHtml(item.label)}</span>
                <span class="nav-card-caption">${escapeHtml(item.caption)}</span>
              </span>
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function selectOptions(options, selectedValue) {
  return options
    .map(
      (option) =>
        `<option value="${escapeHtml(option.value)}" ${option.value === selectedValue ? "selected" : ""}>${escapeHtml(option.label)}</option>`
    )
    .join("");
}

function renderSidebarIcon(icon) {
  const icons = {
    building2:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 21V7.5A1.5 1.5 0 0 1 7.5 6H14v15"/><path d="M14 10h3.5A1.5 1.5 0 0 1 19 11.5V21"/><path d="M9 10h1"/><path d="M9 13h1"/><path d="M9 16h1"/><path d="M12 10h1"/><path d="M12 13h1"/><path d="M12 16h1"/><path d="M8 21h8"/></svg>',
    receipt:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3h8l3 3v15l-2.2-1.5L14.5 21 12 19l-2.5 2-2.3-1.5L5 21V6l3-3Z"/><path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>',
    landmark:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 5l9 5.5"/><path d="M5 10v8"/><path d="M9.5 10v8"/><path d="M14.5 10v8"/><path d="M19 10v8"/><path d="M3 21h18"/><path d="M2 10h20"/></svg>',
    users:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><path d="M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M16.5 3.13a4 4 0 0 1 0 7.75"/></svg>',
    clipboard:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="3" width="8" height="4" rx="1.5"/><path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>',
    calendar:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>',
    chart:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-7"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg>',
    eye:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/></svg>',
    uploadCloud:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V8"/><path d="m8.5 11.5 3.5-3.5 3.5 3.5"/><path d="M20 16.5a4.5 4.5 0 0 0-1.3-8.81A6 6 0 0 0 7 8.5 4 4 0 0 0 4 16.5"/></svg>',
    fileText:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/><path d="M9 9h1"/></svg>',
    settings:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v2.5"/><path d="M12 18.5V21"/><path d="m4.93 4.93 1.77 1.77"/><path d="m17.3 17.3 1.77 1.77"/><path d="M3 12h2.5"/><path d="M18.5 12H21"/><path d="m4.93 19.07 1.77-1.77"/><path d="m17.3 6.7 1.77-1.77"/><circle cx="12" cy="12" r="3.5"/></svg>',
    pencil:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="m16.5 3.5 4 4L7 21l-4 1 1-4Z"/></svg>',
    chevronRight:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'
  };

  return icons[icon] || icons.fileText;
}

function renderSidebarNavigationV2() {
  const items = getVisibleMenuItems().map((item) => ({
    ...item,
    active: state.sidebarActiveKey === item.key
  }));

  return `
    <nav class="nav-section nav-list nav-list-rich">
      ${items
        .map(
          (item) => `
            <button
              class="nav-item nav-card ${item.active ? "active" : ""} ${item.id ? "nav-interactive" : "nav-static"}"
              ${item.id ? `data-view="${item.id}"` : ""}
              ${item.key ? `data-sidebar-key="${item.key}"` : ""}
              ${item.fiscalTab ? `data-target-fiscal-tab="${item.fiscalTab}"` : ""}
              ${item.title ? `title="${escapeHtml(item.title)}"` : ""}
              ${item.disabled ? "disabled" : ""}
              type="button"
            >
              <span class="nav-card-icon">${renderSidebarIcon(item.icon)}</span>
              <span class="nav-card-title">${escapeHtml(item.label)}</span>
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function renderAuthView() {
  return `
    <div class="auth-shell">
      <main class="auth-main">
        <section class="auth-hero">
          <div class="auth-hero-copy">
            <div class="eyebrow auth-eyebrow">Fase 4</div>
            <h1 class="auth-title">Acceso corporativo a la operacion contable y fiscal</h1>
            <p class="auth-description">
              Ingresa con tu perfil para trabajar sobre empresas asignadas, gestionar obligaciones y mantener la
              trazabilidad operativa segun tu nivel de permiso.
            </p>
          </div>
          <div class="auth-hero-metrics">
            <article class="auth-metric-card">
              <strong>Control por rol</strong>
              <span>Usuarios internos con permisos efectivos y empresas asignadas.</span>
            </article>
            <article class="auth-metric-card">
              <strong>Seguridad operativa</strong>
              <span>Acceso restringido a impuestos, calendarios, tareas y administracion.</span>
            </article>
          </div>
        </section>
        <section class="auth-grid">
          <section class="panel-card auth-login-card">
            <div class="auth-card-top">
              <div class="auth-card-icon">GC</div>
              <div>
                <div class="eyebrow">Acceso seguro</div>
                <h3 class="section-title">Iniciar sesion</h3>
              </div>
            </div>
            ${messageCard(state.authMessage, /correctamente/i.test(state.authMessage || "") ? "success" : "error")}
            <form id="login-form" class="form-grid compact auth-form">
              <label class="full">
                <span>Correo</span>
                <input name="email" type="email" autocomplete="username" placeholder="usuario@example.test" required />
              </label>
              <label class="full">
                <span>Contrasena</span>
                <input name="password" type="password" autocomplete="current-password" placeholder="Ingresa tu contrasena" required />
              </label>
              <div class="auth-actions">
                <button class="btn btn-primary auth-submit" type="submit">Entrar al sistema</button>
                <p class="auth-help-text">Solicita credenciales de prueba al administrador del sistema.</p>
              </div>
            </form>
          </section>
          <aside class="panel-card auth-side-card">
            <div class="eyebrow">Acceso de prueba</div>
            <h3 class="section-title">Validacion controlada</h3>
            <p class="muted auth-side-copy">
              El ambiente de desarrollo conserva perfiles con alcances diferentes para validar seguridad, roles y flujo operativo
              sin publicar contrasenas visibles en la interfaz.
            </p>
            <div class="auth-security-note">
              <strong>Nota:</strong> esta version ya aplica control de empresas asignadas, permisos por rol y
              autenticacion sin exponer credenciales demo en pantalla.
            </div>
          </aside>
        </section>
      </main>
    </div>
  `;
}

function getEditingTax() {
  return state.taxes.find((item) => item.id === state.editingTaxId) || null;
}

function getEditingObligation() {
  const obligationId = state.fiscalModal?.payload?.obligation?.id;
  if (!obligationId) {
    return null;
  }

  return state.companyObligations.find((item) => item.id === obligationId) || state.fiscalModal?.payload?.obligation || null;
}

function getEditingInferredRule() {
  const ruleId = state.fiscalModal?.payload?.rule?.id;
  if (!ruleId) {
    return state.fiscalModal?.payload?.rule || null;
  }

  return state.inferredTaxRules.find((item) => item.id === ruleId) || state.fiscalModal?.payload?.rule || null;
}

function getEditingTaskSupport() {
  const taskId = state.fiscalModal?.payload?.task?.id;
  if (!taskId) {
    return state.fiscalModal?.payload?.task || null;
  }

  return state.fiscalTasks.find((item) => item.id === taskId) || state.fiscalModal?.payload?.task || null;
}

function openFiscalModal(type, payload = {}) {
  state.fiscalModal = { type, payload };
}

function closeFiscalModal() {
  state.fiscalModal = null;
  state.editingTaxId = null;
}

function selectedAssignmentCompany() {
  const selectedId = state.fiscalFilters.assignmentCompanyId || "";
  return state.companies.find((item) => item.id === selectedId) || null;
}

function companyNameById(companyId) {
  return state.companies.find((item) => item.id === companyId)?.razonSocial || "Empresa no encontrada";
}

function getCompanyObligationBuckets(companyId) {
  const obligations = state.companyObligations.filter((item) => item.empresaId === companyId);
  return {
    all: obligations,
    pending: obligations.filter((item) => item.estado === "sugerida"),
    active: obligations.filter((item) => item.estado === "activa"),
    inReview: obligations.filter((item) => item.estado === "pendiente_revision"),
    notApplicable: obligations.filter((item) => item.estado === "no_aplica")
  };
}

function getCurrentFiscalYear() {
  return Number(state.fiscalFilters.calendarYear || new Date().getFullYear());
}

function formatCriteriaChipList(items = []) {
  return items.length ? items.join(", ") : "No definido";
}

function formatInferredRuleCriteria(rule) {
  const criterios = rule?.criterios || {};
  const segments = [];

  if (criterios.tipoPersonaIn?.length) {
    segments.push(`Tipo persona: ${formatCriteriaChipList(criterios.tipoPersonaIn)}`);
  }

  if (criterios.regimenIncludesAny?.length) {
    segments.push(`Regimen incluye: ${formatCriteriaChipList(criterios.regimenIncludesAny)}`);
  }

  if (criterios.regimenExcludesAny?.length) {
    segments.push(`Regimen excluye: ${formatCriteriaChipList(criterios.regimenExcludesAny)}`);
  }

  if (criterios.ciiuPrefixes?.length) {
    segments.push(`CIIU: ${formatCriteriaChipList(criterios.ciiuPrefixes)}`);
  }

  if (criterios.boolFlagsAny?.length) {
    segments.push(`Flags cualquiera: ${formatCriteriaChipList(criterios.boolFlagsAny)}`);
  }

  if (criterios.boolFlagsAll?.length) {
    segments.push(`Flags todos: ${formatCriteriaChipList(criterios.boolFlagsAll)}`);
  }

  if (criterios.responsabilidadRutIn?.length) {
    segments.push(`Responsabilidades: ${formatCriteriaChipList(criterios.responsabilidadRutIn)}`);
  }

  if (criterios.departamentoRequired) {
    segments.push("Requiere departamento");
  }

  if (criterios.municipioRequired) {
    segments.push("Requiere municipio");
  }

  return segments.length ? segments.join(" | ") : "Regla abierta para completar.";
}

function filterFiscalCalendars() {
  return state.fiscalCalendars.filter((calendar) => {
    const matchesYear = !state.fiscalFilters.calendarYear || String(calendar.anio || "") === String(state.fiscalFilters.calendarYear);
    const matchesTax = !state.fiscalFilters.calendarTaxId || String(calendar.impuestoId || calendar.impuesto?.id || "") === String(state.fiscalFilters.calendarTaxId);
    return matchesYear && matchesTax;
  });
}

function calendarGroupKey(calendar) {
  return [
    calendar.impuestoId || calendar.impuesto?.id || "",
    calendar.anio || "",
    calendar.nivel || "",
    calendar.municipioCiudad || calendar.municipio || "",
    calendar.departamento || ""
  ].join("|");
}

function detailLabelForCalendar(calendar) {
  if (calendar.criterioVencimiento === "ultimo_digito_nit") {
    return calendar.ultimoDigitoNit ? `Ultimo digito ${calendar.ultimoDigitoNit}` : "Ultimo digito";
  }

  if (calendar.criterioVencimiento === "dos_ultimos_digitos_nit") {
    return calendar.rangoUltimosDigitosNit ? `Rango ${calendar.rangoUltimosDigitosNit}` : "Rango";
  }

  if (calendar.criterioVencimiento === "digito_verificacion") {
    return calendar.digitoVerificacion ? `DV ${calendar.digitoVerificacion}` : "Digito verificacion";
  }

  return "Fecha general";
}

function groupFiscalCalendars(calendars) {
  const groups = new Map();

  for (const calendar of calendars) {
    const key = calendarGroupKey(calendar);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        impuestoId: calendar.impuestoId || calendar.impuesto?.id || "",
        impuestoNombre: calendar.impuesto?.nombre || "Impuesto",
        anio: calendar.anio,
        nivel: calendar.nivel || "",
        municipioCiudad: calendar.municipioCiudad || calendar.municipio || "-",
        departamento: calendar.departamento || "",
        estado: calendar.estado,
        items: []
      });
    }

    groups.get(key).items.push(calendar);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      items: group.items.sort((left, right) => {
        const leftDate = String(left.fechaVencimiento || "");
        const rightDate = String(right.fechaVencimiento || "");
        const leftPeriod = String(left.periodo || "");
        const rightPeriod = String(right.periodo || "");
        const leftOrder = left.ultimoDigitoNit === "0" ? 10 : Number(left.ultimoDigitoNit ?? 99);
        const rightOrder = right.ultimoDigitoNit === "0" ? 10 : Number(right.ultimoDigitoNit ?? 99);
        return leftDate.localeCompare(rightDate)
          || leftPeriod.localeCompare(rightPeriod)
          || leftOrder - rightOrder
          || String(left.rangoUltimosDigitosNit || "").localeCompare(String(right.rangoUltimosDigitosNit || ""));
      })
    }))
    .sort((left, right) => {
      return String(left.impuestoNombre).localeCompare(String(right.impuestoNombre))
        || String(left.anio).localeCompare(String(right.anio));
    });
}

function filterOperationalTasks() {
  const today = new Date().toISOString().slice(0, 10);
  const nextSevenDays = new Date();
  nextSevenDays.setUTCDate(nextSevenDays.getUTCDate() + 7);
  const upcomingLimit = nextSevenDays.toISOString().slice(0, 10);

  return state.fiscalTasks.filter((task) => {
    const status = task.estadoOperativo || task.estadoGeneral || "";
    const matchesYear = !state.fiscalFilters.operationalYear || String(task.anio || "") === String(state.fiscalFilters.operationalYear);
    const matchesMonth = !state.fiscalFilters.operationalMonth || String(task.fechaVencimiento || "").slice(5, 7) === state.fiscalFilters.operationalMonth;
    const matchesCompany = !state.fiscalFilters.operationalCompanyId || String(task.empresaId || "") === state.fiscalFilters.operationalCompanyId;
    const matchesTax =
      !state.fiscalFilters.operationalTaxId ||
      String(task.impuestoId || task.impuesto?.id || "") === state.fiscalFilters.operationalTaxId;
    const matchesState = !state.fiscalFilters.operationalState || String(status) === state.fiscalFilters.operationalState;
    const responsibleFilter = state.fiscalFilters.operationalResponsibleId;
    const matchesResponsible =
      !responsibleFilter ||
      (responsibleFilter === "__unassigned" && !task.responsableId) ||
      String(task.responsableId || "") === responsibleFilter;
    const matchesType = !state.fiscalFilters.operationalTaskType || String(task.tipoTarea || "") === state.fiscalFilters.operationalTaskType;
    const matchesDueKind =
      !state.fiscalFilters.operationalDueKind ||
      (state.fiscalFilters.operationalDueKind === "vencidas" && status === "vencida") ||
      (state.fiscalFilters.operationalDueKind === "proximas" &&
        task.fechaVencimiento &&
        task.fechaVencimiento >= today &&
        task.fechaVencimiento <= upcomingLimit &&
        !["presentada", "completada", "cancelada", "no_aplica"].includes(status));
    const clientRiskFilter = state.fiscalFilters.operationalClientRisk;
    const matchesClientRisk =
      !clientRiskFilter ||
      (clientRiskFilter === "bloqueadas_cliente" && isTaskBlockedByClient(task)) ||
      (clientRiskFilter === "pendiente_pago_cliente" && isTaskWaitingForClientPayment(task)) ||
      (clientRiskFilter === "en_revision" && String(task.etapaGestion || "") === "en_revision");
    return matchesYear && matchesMonth && matchesCompany && matchesTax && matchesState && matchesResponsible && matchesType && matchesDueKind && matchesClientRisk;
  });
}

function openOperationalTasks(tasks = []) {
  return tasks.filter((task) => !isTaskClosedStatus(taskStatus(task)));
}

const CALENDAR_WEEKDAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const CALENDAR_MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

function getOperationalCalendarReference() {
  const now = new Date();
  const year = Number(state.fiscalFilters.operationalYear || now.getFullYear()) || now.getFullYear();
  const month = Number(state.fiscalFilters.operationalMonth || String(now.getMonth() + 1).padStart(2, "0")) || now.getMonth() + 1;

  return {
    year,
    month,
    monthKey: String(month).padStart(2, "0"),
    monthLabel: CALENDAR_MONTH_LABELS[month - 1] || `Mes ${month}`
  };
}

function setOperationalCalendarMonth(year, month) {
  const nextDate = new Date(year, month - 1, 1);
  state.fiscalFilters.operationalYear = String(nextDate.getFullYear());
  state.fiscalFilters.operationalMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
  state.operationalSelectedDate = "";
}

function shiftOperationalCalendarMonth(offset) {
  const reference = getOperationalCalendarReference();
  setOperationalCalendarMonth(reference.year, reference.month + offset);
}

function setOperationalCalendarToday() {
  const now = new Date();
  state.fiscalFilters.operationalYear = String(now.getFullYear());
  state.fiscalFilters.operationalMonth = String(now.getMonth() + 1).padStart(2, "0");
  state.operationalSelectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function tasksByDueDate(tasks = []) {
  return tasks.reduce((map, task) => {
    const dueDate = String(task.fechaVencimiento || "").slice(0, 10);
    if (!dueDate) {
      return map;
    }

    if (!map.has(dueDate)) {
      map.set(dueDate, []);
    }

    map.get(dueDate).push(task);
    return map;
  }, new Map());
}

function isTodayDateParts(year, month, day) {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day;
}

function operationalCalendarCellTone(tasks = []) {
  const statuses = tasks.map((task) => taskStatus(task));
  if (statuses.includes("vencida")) {
    return "calendar-month-cell-overdue";
  }
  if (statuses.some((status) => ["pendiente", "en_proceso", "pendiente_preparacion", "en_preparacion", "en_revision"].includes(status))) {
    return "calendar-month-cell-pending";
  }
  if (statuses.some((status) => ["presentada", "completada", "pagada", "aprobada"].includes(status))) {
    return "calendar-month-cell-complete";
  }
  return "";
}

function operationalTaskDotTone(task) {
  if (task.tipoTarea === "cumplimiento_dian") {
    return "task-dot-dian";
  }
  if (task.tipoTarea === "fiscal") {
    return "task-dot-fiscal";
  }
  return "task-dot-manual";
}

function buildOperationalCalendarGrid(reference) {
  const firstDayUtc = new Date(Date.UTC(reference.year, reference.month - 1, 1));
  const daysInMonth = new Date(Date.UTC(reference.year, reference.month, 0)).getUTCDate();
  const firstWeekday = (firstDayUtc.getUTCDay() + 6) % 7;
  const previousMonthDays = new Date(Date.UTC(reference.year, reference.month - 1, 0)).getUTCDate();
  const cells = [];

  for (let offset = firstWeekday - 1; offset >= 0; offset -= 1) {
    const day = previousMonthDays - offset;
    const prevMonth = reference.month === 1 ? 12 : reference.month - 1;
    const prevYear = reference.month === 1 ? reference.year - 1 : reference.year;
    cells.push({
      dateKey: `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      year: prevYear,
      month: prevMonth,
      currentMonth: false
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      dateKey: `${reference.year}-${reference.monthKey}-${String(day).padStart(2, "0")}`,
      day,
      year: reference.year,
      month: reference.month,
      currentMonth: true
    });
  }

  const trailingCells = Math.ceil(cells.length / 7) * 7 - cells.length;
  for (let day = 1; day <= trailingCells; day += 1) {
    const nextMonth = reference.month === 12 ? 1 : reference.month + 1;
    const nextYear = reference.month === 12 ? reference.year + 1 : reference.year;
    cells.push({
      dateKey: `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      year: nextYear,
      month: nextMonth,
      currentMonth: false
    });
  }

  return cells;
}

function resolveOperationalSelectedDate(reference, groupedTasks) {
  const explicit = String(state.operationalSelectedDate || "");
  if (explicit.startsWith(`${reference.year}-${reference.monthKey}-`)) {
    return explicit;
  }

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (todayKey.startsWith(`${reference.year}-${reference.monthKey}-`)) {
    return todayKey;
  }

  const firstTaskDate = Array.from(groupedTasks.keys()).find((dateKey) => dateKey.startsWith(`${reference.year}-${reference.monthKey}-`));
  return firstTaskDate || `${reference.year}-${reference.monthKey}-01`;
}

function renderOperationalMonthCalendar(tasks = []) {
  const reference = getOperationalCalendarReference();
  const groupedTasks = tasksByDueDate(tasks);
  const firstDayUtc = new Date(Date.UTC(reference.year, reference.month - 1, 1));
  const daysInMonth = new Date(Date.UTC(reference.year, reference.month, 0)).getUTCDate();
  const firstWeekday = (firstDayUtc.getUTCDay() + 6) % 7;
  const cells = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push('<div class="calendar-month-cell calendar-month-cell-empty" aria-hidden="true"></div>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${reference.year}-${reference.monthKey}-${String(day).padStart(2, "0")}`;
    const dayTasks = (groupedTasks.get(dateKey) || []).slice().sort((left, right) =>
      String(left.fechaVencimiento || "").localeCompare(String(right.fechaVencimiento || "")) || taskCompanyName(left).localeCompare(taskCompanyName(right), "es")
    );
    const toneClass = operationalCalendarCellTone(dayTasks);
    const todayClass = isTodayDateParts(reference.year, reference.month, day) ? "calendar-month-cell-today" : "";

    cells.push(`
      <article class="calendar-month-cell ${toneClass} ${todayClass}">
        <div class="calendar-month-cell-header">
          <span class="calendar-month-day-number">${escapeHtml(String(day))}</span>
          ${dayTasks.length ? `<span class="calendar-month-count" title="${escapeHtml(`${dayTasks.length} responsabilidades o tareas`)}">${escapeHtml(String(dayTasks.length))}</span>` : ""}
        </div>
        <div class="calendar-month-cell-body">
          ${
            dayTasks.length
              ? dayTasks
                  .slice(0, 3)
                  .map(
                    (task) => `
                      <div class="calendar-month-task-pill" title="${escapeHtml(`${taskCompanyName(task)} · ${taskDetailLabel(task)}`)}">
                        <span class="calendar-month-task-dot ${operationalTaskDotTone(task)}"></span>
                        <span class="calendar-month-task-text">${escapeHtml(taskDetailLabel(task))}</span>
                      </div>
                    `
                  )
                  .join("")
              : '<span class="calendar-month-empty-label">Sin novedades</span>'
          }
          ${dayTasks.length > 3 ? `<span class="calendar-month-more">+${escapeHtml(String(dayTasks.length - 3))} mas</span>` : ""}
        </div>
      </article>
    `);
  }

  return `
    <section class="calendar-month-panel">
      <div class="calendar-month-header">
        <div>
          <div class="eyebrow">Vista mensual</div>
          <h4 class="section-title">${escapeHtml(`${reference.monthLabel} ${reference.year}`)}</h4>
        </div>
        <div class="calendar-month-legend">
          <span><i class="calendar-legend-dot task-dot-fiscal"></i> Fiscal</span>
          <span><i class="calendar-legend-dot task-dot-dian"></i> DIAN</span>
          <span><i class="calendar-legend-dot task-dot-manual"></i> Manual</span>
        </div>
      </div>
      <div class="calendar-month-weekdays">
        ${CALENDAR_WEEKDAY_LABELS.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
      </div>
      <div class="calendar-month-grid">
        ${cells.join("")}
      </div>
    </section>
  `;
}

function renderOperationalAgenda(tasks = []) {
  const groupedTasks = Array.from(tasksByDueDate(tasks).entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([dateKey, dayTasks]) => ({
      dateKey,
      dayTasks: dayTasks
        .slice()
        .sort((left, right) => String(left.fechaVencimiento || "").localeCompare(String(right.fechaVencimiento || "")) || taskCompanyName(left).localeCompare(taskCompanyName(right), "es"))
    }));

  if (!groupedTasks.length) {
    return '<div class="table-card"><div class="empty-inline-state">No hay responsabilidades para los filtros seleccionados.</div></div>';
  }

  return `
    <div class="calendar-operational-list">
      ${groupedTasks
        .map(
          ({ dateKey, dayTasks }) => `
            <section class="calendar-day-block">
              <div class="calendar-day-block-top">
                <h4>${escapeHtml(formatDateLabel(dateKey))}</h4>
                <span class="calendar-day-badge">${escapeHtml(dayTasks.length === 1 ? "1 responsabilidad" : `${dayTasks.length} responsabilidades`)}</span>
              </div>
              <div class="calendar-day-list">
                ${dayTasks
                  .map(
                    (task) => `
                      <article class="calendar-day-item calendar-day-item-rich">
                        <div class="calendar-day-main">
                          <div class="calendar-day-title-row">
                            <span class="calendar-month-task-dot ${operationalTaskDotTone(task)}"></span>
                            <strong>${escapeHtml(task.titulo || "Tarea")}</strong>
                          </div>
                          <div class="muted table-subtext">${escapeHtml(taskCompanyName(task))} · ${escapeHtml(taskDetailLabel(task))}</div>
                        </div>
                        <div>${escapeHtml(taskTypeLabel(task.tipoTarea))}</div>
                        <div>${taskResponsibleSelect(task)}</div>
                        <div><span class="${statusClass(taskStatus(task))}">${escapeHtml(formatStatus(taskStatus(task)))}</span></div>
                        <div><div class="calendar-row-actions">${taskActionButtons(task)}</div></div>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
        )
        .join("")}
    </div>
  `;
}

function renderOperationalMonthCalendarV2(tasks = []) {
  const reference = getOperationalCalendarReference();
  const groupedTasks = tasksByDueDate(tasks);
  const selectedDate = resolveOperationalSelectedDate(reference, groupedTasks);
  const cells = buildOperationalCalendarGrid(reference).map((cell) => {
    const dayTasks = (groupedTasks.get(cell.dateKey) || []).slice().sort((left, right) =>
      String(left.fechaVencimiento || "").localeCompare(String(right.fechaVencimiento || "")) || taskCompanyName(left).localeCompare(taskCompanyName(right), "es")
    );
    const toneClass = cell.currentMonth ? operationalCalendarCellTone(dayTasks) : "calendar-month-cell-outside";
    const todayClass = isTodayDateParts(cell.year, cell.month, cell.day) ? "calendar-month-cell-today" : "";
    const selectedClass = selectedDate === cell.dateKey ? "calendar-month-cell-selected" : "";

    return `
      <button
        class="calendar-month-cell ${toneClass} ${todayClass} ${selectedClass}"
        type="button"
        data-action="calendar-select-day"
        data-date="${cell.dateKey}"
      >
        <div class="calendar-month-cell-header">
          <span class="calendar-month-day-number">${escapeHtml(String(cell.day))}</span>
        </div>
        <div class="calendar-month-cell-body">
          ${
            dayTasks.length
              ? `
                <div class="calendar-month-dots">
                  ${dayTasks
                    .slice(0, 4)
                    .map((task) => `<span class="calendar-month-task-dot ${operationalTaskDotTone(task)}"></span>`)
                    .join("")}
                </div>
              `
              : ""
          }
          ${dayTasks.length ? `<span class="calendar-month-marker ${dayTasks.length > 9 ? "calendar-month-marker-count" : ""}">${dayTasks.length > 9 ? escapeHtml(String(dayTasks.length)) : ""}</span>` : ""}
        </div>
      </button>
    `;
  });

  return `
    <section class="calendar-month-panel calendar-month-panel-v2">
      <div class="calendar-toolbar">
        <div class="calendar-toolbar-left">
          <label class="calendar-toolbar-select">
            <select data-action="calendar-change-year">
              ${Array.from({ length: 7 }, (_, index) => String(reference.year - 2 + index))
                .map((year) => `<option value="${year}" ${year === String(reference.year) ? "selected" : ""}>${escapeHtml(year)}</option>`)
                .join("")}
            </select>
          </label>
          <button class="calendar-toolbar-nav" type="button" data-action="calendar-prev-month" aria-label="Mes anterior">‹</button>
          <label class="calendar-toolbar-select">
            <select data-action="calendar-change-month">
              ${CALENDAR_MONTH_LABELS.map(
                (label, index) =>
                  `<option value="${String(index + 1).padStart(2, "0")}" ${index + 1 === reference.month ? "selected" : ""}>${escapeHtml(label.slice(0, 3))}</option>`
              ).join("")}
            </select>
          </label>
          <button class="calendar-toolbar-nav" type="button" data-action="calendar-next-month" aria-label="Mes siguiente">›</button>
          <label class="calendar-toolbar-select calendar-toolbar-view">
            <select disabled>
              <option selected>Dia de inicio</option>
            </select>
          </label>
        </div>
        <div class="calendar-toolbar-right">
          <button class="calendar-toolbar-today" type="button" data-action="calendar-today">Hoy</button>
        </div>
      </div>
      <div class="calendar-month-weekdays calendar-month-weekdays-v2">
        ${CALENDAR_WEEKDAY_LABELS.map((label) => `<span>${escapeHtml(label.toUpperCase())}</span>`).join("")}
      </div>
      <div class="calendar-month-grid calendar-month-grid-v2">
        ${cells.join("")}
      </div>
    </section>
  `;
}

function renderOperationalAgendaV2(tasks = []) {
  const reference = getOperationalCalendarReference();
  const groupedTasks = tasksByDueDate(tasks);
  const selectedDate = resolveOperationalSelectedDate(reference, groupedTasks);
  const selectedTasks = (groupedTasks.get(selectedDate) || []).slice().sort((left, right) =>
    String(left.fechaVencimiento || "").localeCompare(String(right.fechaVencimiento || "")) || taskCompanyName(left).localeCompare(taskCompanyName(right), "es")
  );

  if (!tasks.length) {
    return '<div class="table-card"><div class="empty-inline-state">No hay responsabilidades para los filtros seleccionados.</div></div>';
  }

  return `
    <div class="calendar-operational-list">
      <section class="calendar-day-block calendar-day-block-v2">
        <div class="calendar-day-block-top">
          <h4>${escapeHtml(formatDateLabel(selectedDate))}</h4>
          <span class="calendar-day-badge">${escapeHtml(selectedTasks.length === 1 ? "1 responsabilidad" : `${selectedTasks.length} responsabilidades`)}</span>
        </div>
        <div class="calendar-day-list">
          ${
            selectedTasks.length
              ? selectedTasks
                  .map(
                    (task) => `
                      <article class="calendar-day-item calendar-day-item-rich">
                        <div class="calendar-day-main">
                          <div class="calendar-day-title-row">
                            <span class="calendar-month-task-dot ${operationalTaskDotTone(task)}"></span>
                            <strong>${escapeHtml(task.titulo || "Tarea")}</strong>
                          </div>
                          <div class="muted table-subtext">${escapeHtml(taskCompanyName(task))} · ${escapeHtml(taskDetailLabel(task))}</div>
                        </div>
                        <div>${escapeHtml(taskTypeLabel(task.tipoTarea))}</div>
                        <div>${taskResponsibleSelect(task)}</div>
                        <div><span class="${statusClass(taskStatus(task))}">${escapeHtml(formatStatus(taskStatus(task)))}</span></div>
                        <div><div class="calendar-row-actions">${taskActionButtons(task)}</div></div>
                      </article>
                    `
                  )
                  .join("")
              : '<div class="empty-inline-state">No hay responsabilidades en el dia seleccionado.</div>'
          }
        </div>
      </section>
    </div>
  `;
}

function taskCompanyName(task) {
  return task.empresa?.razonSocial || state.companies.find((company) => company.id === task.empresaId)?.razonSocial || task.empresaId || "-";
}

function taskResponsibleName(task) {
  return task.responsable?.nombreCompleto || state.taskResponsibles.find((user) => user.id === task.responsableId)?.nombreCompleto || "Sin responsable";
}

function taskResponsibleSelect(task) {
  if (isTaskClosedStatus(taskStatus(task))) {
    return escapeHtml(taskResponsibleName(task));
  }

  return `
    <select class="table-select" data-action="assign-task" data-task-id="${escapeHtml(task.id)}" aria-label="Responsable de ${escapeHtml(task.titulo || "tarea")}">
      <option value="" ${!task.responsableId ? "selected" : ""}>Sin responsable</option>
      ${state.taskResponsibles
        .map(
          (user) =>
            `<option value="${escapeHtml(user.id)}" ${user.id === task.responsableId ? "selected" : ""}>${escapeHtml(user.nombreCompleto)}</option>`
        )
        .join("")}
    </select>
  `;
}

function taskStatus(task) {
  return task.estadoOperativo || task.estadoGeneral || "pendiente";
}

function isWorkflowManagedTask(task) {
  return task?.tipoTarea === "fiscal" || task?.tipoTarea === "cumplimiento_dian";
}

function taskWorkflowStage(task) {
  return String(task?.etapaGestion || "").trim();
}

function taskWorkflowOptions(task) {
  if (!isWorkflowManagedTask(task)) {
    return [];
  }

  if (task.tipoTarea === "cumplimiento_dian") {
    return TASK_WORKFLOW_OPTIONS.filter((option) =>
      ["pendiente_preparacion", "en_preparacion", "preparada", "en_revision", "aprobada", "completada", "cancelada", "no_aplica"].includes(option.value)
    );
  }

  if (task.cumplimientoFiscal === "pago") {
    return TASK_WORKFLOW_OPTIONS.filter((option) =>
      ["pendiente_preparacion", "en_preparacion", "preparada", "en_revision", "aprobada", "pagada", "cancelada", "no_aplica"].includes(option.value)
    );
  }

  return TASK_WORKFLOW_OPTIONS.filter((option) =>
    ["pendiente_preparacion", "en_preparacion", "preparada", "en_revision", "aprobada", "presentada", "cancelada", "no_aplica"].includes(option.value)
  );
}

function taskWorkflowLabel(task) {
  const stage = taskWorkflowStage(task);
  return taskWorkflowOptions(task).find((option) => option.value === stage)?.label || formatStatus(stage || "-");
}

function taskTypeLabel(value) {
  return TASK_TYPE_OPTIONS.find((option) => option.value === value)?.label || formatStatus(value || "-");
}

function obligationLabel(obligation) {
  const base = obligation?.nombreObligacion || obligation?.impuesto?.nombre || "Obligacion";
  return [base, obligation?.eventoFiscal].filter(Boolean).join(" - ");
}

function fiscalEventOptionsForTax(taxId) {
  return FISCAL_EVENT_OPTIONS_BY_TAX[String(taxId || "").trim()] || [];
}

function eventOptionPeriodicity(eventOptions, eventKey) {
  return eventOptions.find((option) => option.value === eventKey)?.periodicidad || "";
}

function taskOriginLabel(task) {
  if (task.origen === "calendario_fiscal") {
    return "Generada desde calendario fiscal";
  }

  if (task.origen === "sistema_dian") {
    return "Control sugerido por reglas DIAN";
  }

  return "Creada manualmente";
}

function taskPriorityLabel(value) {
  return TASK_PRIORITY_OPTIONS.find((option) => option.value === value)?.label || formatStatus(value || "media");
}

function isTaskClosedStatus(status) {
  return ["presentada", "completada", "cancelada", "no_aplica"].includes(status);
}

function taskDetailLabel(task) {
  if (task.tipoTarea === "fiscal") {
    const base =
      obligationLabel(task.obligacionFiscal) || task.impuesto?.nombre || task.impuestoNombre || "Obligacion fiscal";
    const milestone =
      task.cumplimientoFiscal === "declaracion"
        ? "Declaracion"
        : task.cumplimientoFiscal === "pago"
          ? "Pago"
          : "";
    return [base, milestone].filter(Boolean).join(" - ");
  }

  return taskTypeLabel(task.tipoTarea);
}

function refreshManualObligationEventFields(form) {
  if (!form) {
    return;
  }

  const taxSelect = form.querySelector('[data-role="manual-obligation-tax"]');
  const eventSelect = form.querySelector('[data-role="manual-obligation-event"]');
  const periodicitySelect = form.querySelector('[data-role="manual-obligation-periodicity"]');
  if (!taxSelect || !eventSelect || !periodicitySelect) {
    return;
  }

  const options = fiscalEventOptionsForTax(taxSelect.value);
  const previousEvent = eventSelect.value;

  if (!options.length) {
    eventSelect.innerHTML = '<option value="">Evento general</option>';
    eventSelect.disabled = true;
    return;
  }

  eventSelect.disabled = false;
  eventSelect.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");

  const hasPrevious = options.some((option) => option.value === previousEvent);
  eventSelect.value = hasPrevious ? previousEvent : options[0].value;

  const matched = options.find((option) => option.value === eventSelect.value);
  if (matched?.periodicidad) {
    periodicitySelect.value = matched.periodicidad;
  }
}

function taskPeriodLabel(task) {
  return [task.anio, task.periodo, task.nombreCuota].filter(Boolean).join(" - ") || "-";
}

function taskSupportSummary(task) {
  const support = task?.soporteFiscal || {};
  const parts = [];
  if (support.numeroFormulario) {
    parts.push(`Formulario ${support.numeroFormulario}`);
  }
  if (support.numeroAcuse) {
    parts.push(`Acuse ${support.numeroAcuse}`);
  }
  if (support.numeroReciboPago) {
    parts.push(`Recibo ${support.numeroReciboPago}`);
  }
  return parts.join(" | ");
}

function isTaskBlockedByClient(task) {
  const clientBlock = task?.bloqueoCliente || task?.bloqueoPorCliente || {};
  const paymentStatus = String(task?.estadoPago || "");
  const observations = String(task?.observaciones || "").toLowerCase();

  return Boolean(
    clientBlock.estado === "abierto" ||
      clientBlock.activo === true ||
      ["enviado_al_cliente", "no_pagado_por_cliente", "sin_soporte_pago"].includes(paymentStatus) ||
      (observations.includes("cliente") && observations.includes("bloque"))
  );
}

function isTaskWaitingForClientPayment(task) {
  return ["enviado_al_cliente", "pendiente_pago", "no_pagado_por_cliente", "sin_soporte_pago"].includes(String(task?.estadoPago || ""));
}

function alertTypeLabel(value) {
  return ALERT_TYPE_OPTIONS.find((option) => option.value === value)?.label || formatStatus(value || "-");
}

function alertLevelLabel(value) {
  return ALERT_LEVEL_OPTIONS.find((option) => option.value === value)?.label || formatStatus(value || "-");
}

function alertStatusLabel(value) {
  return ALERT_STATUS_OPTIONS.find((option) => option.value === value)?.label || formatStatus(value || "-");
}

function isClosedAlert(alert) {
  return ["atendida", "descartada"].includes(String(alert?.estado || ""));
}

function clearAlertFilters() {
  state.fiscalFilters.alertCompanyId = "";
  state.fiscalFilters.alertResponsibleId = "";
  state.fiscalFilters.alertState = "";
  state.fiscalFilters.alertType = "";
  state.fiscalFilters.alertLevel = "";
}

function renderTaskActionIcon(icon) {
  const icons = {
    play:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 6.8c0-1 1.1-1.63 1.98-1.1l8.14 4.88c.85.52.85 1.76 0 2.28l-8.14 4.88A1.28 1.28 0 0 1 8 16.66z"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg>',
    x:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    file:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>',
    lock:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    unlock:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.2-2.4"/></svg>'
  };

  return icons[icon] || icons.check;
}

function taskActionButtons(task) {
  const status = taskStatus(task);
  const buttons = [];

  if (isTaskClosedStatus(status)) {
    return '<span class="table-actions-empty">Sin acciones</span>';
  }

  if (status === "pendiente") {
    buttons.push(`
      <button
        class="table-action-icon table-action-icon-view"
        type="button"
        data-action="task-status"
        data-task-id="${escapeHtml(task.id)}"
        data-task-status="en_proceso"
        title="Iniciar tarea"
        aria-label="Iniciar tarea"
      >
        ${renderTaskActionIcon("play")}
      </button>
    `);
  }

  buttons.push(`
    <button
      class="table-action-icon table-action-icon-view"
      type="button"
      data-action="open-task-support"
      data-task-id="${escapeHtml(task.id)}"
      title="Registrar soporte"
      aria-label="Registrar soporte de tarea"
    >
      ${renderTaskActionIcon("file")}
    </button>
  `);

  const blockedByClient = isTaskBlockedByClient(task);
  buttons.push(`
    <button
      class="table-action-icon ${blockedByClient ? "table-action-icon-success" : "table-action-icon-warning"}"
      type="button"
      data-action="task-client-block"
      data-task-id="${escapeHtml(task.id)}"
      data-client-block-active="${blockedByClient ? "false" : "true"}"
      title="${blockedByClient ? "Resolver bloqueo cliente" : "Bloquear por cliente"}"
      aria-label="${blockedByClient ? "Resolver bloqueo por cliente" : "Marcar tarea bloqueada por cliente"}"
    >
      ${renderTaskActionIcon(blockedByClient ? "unlock" : "lock")}
    </button>
  `);

  const doneStatus = task.tipoTarea === "fiscal" && task.cumplimientoFiscal === "pago" ? "completada" : task.tipoTarea === "fiscal" ? "presentada" : "completada";
  const doneLabel =
    task.tipoTarea === "fiscal" && task.cumplimientoFiscal === "pago"
      ? "Marcar como pagada"
      : task.tipoTarea === "fiscal"
        ? "Marcar como presentada"
        : "Marcar como completada";
  buttons.push(`
    <button
      class="table-action-icon table-action-icon-success"
      type="button"
      data-action="task-close"
      data-task-id="${escapeHtml(task.id)}"
      data-task-status="${doneStatus}"
      title="${doneLabel}"
      aria-label="${doneLabel}"
    >
      ${renderTaskActionIcon("check")}
    </button>
  `);
  buttons.push(`
    <button
      class="table-action-icon table-action-icon-danger"
      type="button"
      data-action="task-status"
      data-task-id="${escapeHtml(task.id)}"
      data-task-status="cancelada"
      title="Cancelar tarea"
      aria-label="Cancelar tarea"
    >
      ${renderTaskActionIcon("x")}
    </button>
  `);

  return buttons.join("");
}

function calendarForm() {
  const activeTaxes = state.taxes.filter((tax) => tax.estado !== "inactivo");
  const editingCalendar = state.fiscalModal?.payload?.calendar || null;
  return `
    <form id="fiscal-calendar-form" class="modal-form-stack">
      <div class="form-grid compact">
        <label>
          <span>Impuesto</span>
          <select name="impuestoId" required>
            <option value="">Selecciona un impuesto</option>
            ${activeTaxes
              .map(
                (tax) =>
                  `<option value="${escapeHtml(tax.id)}" ${tax.id === editingCalendar?.impuestoId ? "selected" : ""}>${escapeHtml(tax.nombre)}</option>`
              )
              .join("")}
          </select>
        </label>
        <label>
          <span>Anio</span>
          <input name="anio" type="number" min="2020" value="${escapeHtml(editingCalendar?.anio || state.fiscalFilters.calendarYear)}" required />
        </label>
        <label>
          <span>Periodo</span>
          <input name="periodo" type="text" placeholder="enero-febrero" required value="${escapeHtml(editingCalendar?.periodo || "")}" />
        </label>
        <label>
          <span>Periodicidad</span>
          <select name="periodicidad" required>
            ${selectOptions(PERIODICITY_OPTIONS, editingCalendar?.periodicidad || "bimestral")}
          </select>
        </label>
        <label>
          <span>Nivel</span>
          <select name="nivel" required>
            ${selectOptions(TAX_LEVEL_OPTIONS, editingCalendar?.nivel || "nacional")}
          </select>
        </label>
        <label>
          <span>Departamento</span>
          <input name="departamento" type="text" placeholder="Bogota D.C." value="${escapeHtml(editingCalendar?.departamento || "")}" />
        </label>
        <label>
          <span>Municipio / Ciudad</span>
          <input name="municipioCiudad" type="text" placeholder="Bogota D.C." value="${escapeHtml(editingCalendar?.municipioCiudad || editingCalendar?.municipio || "")}" />
        </label>
        <label>
          <span>Criterio de vencimiento</span>
          <select name="criterioVencimiento" required>
            ${selectOptions(DUE_CRITERIA_OPTIONS, editingCalendar?.criterioVencimiento || "independiente_nit")}
          </select>
        </label>
        <label>
          <span>Fecha vencimiento</span>
          <input name="fechaVencimiento" type="date" required value="${escapeHtml(editingCalendar?.fechaVencimiento || "")}" />
        </label>
        <label>
          <span>Estado inicial</span>
          <select name="estado">
            ${selectOptions(CALENDAR_STATE_OPTIONS, editingCalendar?.estado || "borrador")}
          </select>
        </label>
      </div>
      <details class="advanced-panel">
        <summary>Campos avanzados</summary>
        <div class="form-grid compact">
          <label>
            <span>Tipo contribuyente</span>
            <input name="tipoContribuyente" type="text" placeholder="Persona juridica" value="${escapeHtml(editingCalendar?.tipoContribuyente || "")}" />
          </label>
          <label>
            <span>Regimen</span>
            <input name="regimen" type="text" placeholder="Regimen ordinario" value="${escapeHtml(editingCalendar?.regimen || "")}" />
          </label>
          <label>
            <span>Digito verificacion</span>
            <input name="digitoVerificacion" type="text" maxlength="2" value="${escapeHtml(editingCalendar?.digitoVerificacion || "")}" />
          </label>
          <label>
            <span>Ultimo digito NIT</span>
            <input name="ultimoDigitoNit" type="text" maxlength="1" value="${escapeHtml(editingCalendar?.ultimoDigitoNit || "")}" />
          </label>
          <label>
            <span>Rango ultimos digitos NIT</span>
            <input name="rangoUltimosDigitosNit" type="text" placeholder="01-02" value="${escapeHtml(editingCalendar?.rangoUltimosDigitosNit || "")}" />
          </label>
          <label>
            <span>Numero cuota</span>
            <input name="numeroCuota" type="number" min="1" value="${escapeHtml(editingCalendar?.numeroCuota || "")}" />
          </label>
          <label>
            <span>Nombre cuota</span>
            <input name="nombreCuota" type="text" placeholder="Cuota 1" value="${escapeHtml(editingCalendar?.nombreCuota || "")}" />
          </label>
          <label>
            <span>Tipo pago</span>
            <select name="tipoPago">
              ${selectOptions(PAYMENT_TYPE_OPTIONS, editingCalendar?.tipoPago || "declaracion_y_pago")}
            </select>
          </label>
          <label>
            <span>Fecha inicio periodo</span>
            <input name="fechaInicioPeriodo" type="date" value="${escapeHtml(editingCalendar?.fechaInicioPeriodo || "")}" />
          </label>
          <label>
            <span>Fecha fin periodo</span>
            <input name="fechaFinPeriodo" type="date" value="${escapeHtml(editingCalendar?.fechaFinPeriodo || "")}" />
          </label>
          <label class="full">
            <span>Fuente calendario</span>
            <select name="fuenteCalendario">
              ${selectOptions(CALENDAR_SOURCE_OPTIONS, editingCalendar?.fuenteCalendario || "manual")}
            </select>
          </label>
          <label class="checkbox-inline">
            <input name="requiereDeclaracion" type="checkbox" ${editingCalendar?.requiereDeclaracion === false ? "" : "checked"} />
            <span>Requiere declaracion</span>
          </label>
          <label class="checkbox-inline">
            <input name="requierePago" type="checkbox" ${editingCalendar?.requierePago === false ? "" : "checked"} />
            <span>Requiere pago</span>
          </label>
        </div>
      </details>
      <div class="button-row compact">
        <button class="btn btn-primary" type="submit">${editingCalendar ? "Actualizar calendario" : "Guardar calendario"}</button>
      </div>
    </form>
  `;
}

function taxForm() {
  const editingTax = getEditingTax();

  return `
    <form id="tax-form" class="form-grid compact">
      <label>
        <span>Codigo</span>
        <input name="codigo" type="text" required value="${escapeHtml(editingTax?.codigo || "")}" />
      </label>
      <label class="full">
        <span>Nombre</span>
        <input name="nombre" type="text" required value="${escapeHtml(editingTax?.nombre || "")}" />
      </label>
      <label>
        <span>Nivel</span>
        <select name="nivel" required>
          ${selectOptions(TAX_LEVEL_OPTIONS, editingTax?.nivel || "nacional")}
        </select>
      </label>
      <label>
        <span>Periodicidad default</span>
        <select name="periodicidadDefault" required>
          ${selectOptions(PERIODICITY_OPTIONS, editingTax?.periodicidadDefault || "anual")}
        </select>
      </label>
      <label>
        <span>Estado</span>
        <select name="estado" required>
          <option value="activo" ${editingTax?.estado !== "inactivo" ? "selected" : ""}>Activo</option>
          <option value="inactivo" ${editingTax?.estado === "inactivo" ? "selected" : ""}>Inactivo</option>
        </select>
      </label>
      <label class="full">
        <span>Descripcion</span>
        <input name="descripcion" type="text" value="${escapeHtml(editingTax?.descripcion || "")}" />
      </label>
      <label class="checkbox-inline">
        <input name="requiereMunicipio" type="checkbox" ${editingTax?.requiereMunicipio ? "checked" : ""} />
        <span>Requiere municipio / ciudad</span>
      </label>
      <label class="checkbox-inline">
        <input name="requiereDepartamento" type="checkbox" ${editingTax?.requiereDepartamento ? "checked" : ""} />
        <span>Requiere departamento</span>
      </label>
      <label class="checkbox-inline">
        <input name="aplicaPorNit" type="checkbox" ${editingTax?.aplicaPorNit ? "checked" : ""} />
        <span>Aplica por NIT</span>
      </label>
      <label class="checkbox-inline">
        <input name="aplicaPorDv" type="checkbox" ${editingTax?.aplicaPorDv ? "checked" : ""} />
        <span>Aplica por DV</span>
      </label>
      <div class="button-row full compact">
        <button class="btn btn-primary" type="submit">${editingTax ? "Actualizar impuesto" : "Crear impuesto"}</button>
        ${
          editingTax
            ? '<button class="btn btn-secondary" type="button" data-action="cancel-tax-edit">Cancelar edicion</button>'
            : ""
        }
      </div>
    </form>
  `;
}

function inferredRuleForm() {
  const editingRule = getEditingInferredRule();
  const criterios = editingRule?.criterios || {};

  return `
    <form id="inferred-rule-form" class="modal-form-stack">
      <div class="form-grid compact">
        <label class="full">
          <span>Nombre de la regla</span>
          <input name="nombreRegla" type="text" required value="${escapeHtml(editingRule?.nombreRegla || "")}" />
        </label>
        <label class="full">
          <span>Descripcion</span>
          <input
            name="descripcion"
            type="text"
            required
            placeholder="Ejemplo: sugiere RST a empresas con regimen SIMPLE."
            value="${escapeHtml(editingRule?.descripcion || "")}"
          />
        </label>
        <label>
          <span>Impuesto asociado</span>
          <select name="impuestoId" required>
            <option value="">Selecciona un impuesto</option>
            ${state.taxes
              .filter((tax) => tax.estado !== "inactivo" || tax.id === editingRule?.impuestoId)
              .map(
                (tax) =>
                  `<option value="${tax.id}" ${tax.id === editingRule?.impuestoId ? "selected" : ""}>${escapeHtml(tax.nombre)}</option>`
              )
              .join("")}
          </select>
        </label>
        <label>
          <span>Estado de la regla</span>
          <select name="estado" required>
            <option value="activo" ${editingRule?.estado !== "inactivo" ? "selected" : ""}>Activo</option>
            <option value="inactivo" ${editingRule?.estado === "inactivo" ? "selected" : ""}>Inactivo</option>
          </select>
        </label>
        <label>
          <span>Estado inicial sugerido</span>
          <select name="estadoInicial" required>
            <option value="sugerida" ${editingRule?.estadoInicial === "sugerida" ? "selected" : ""}>Sugerida</option>
            <option value="pendiente_revision" ${
              editingRule?.estadoInicial !== "sugerida" && editingRule?.estadoInicial !== "activa" && editingRule?.estadoInicial !== "no_aplica"
                ? "selected"
                : ""
            }>Pendiente de revision</option>
            <option value="activa" ${editingRule?.estadoInicial === "activa" ? "selected" : ""}>Activa</option>
            <option value="no_aplica" ${editingRule?.estadoInicial === "no_aplica" ? "selected" : ""}>No aplica</option>
          </select>
        </label>
        <label>
          <span>Accion sugerida</span>
          <input name="accionSugerida" type="text" value="${escapeHtml(editingRule?.accionSugerida || "sugerir")}" />
        </label>
        <label>
          <span>Fuente deteccion</span>
          <input name="fuenteDeteccion" type="text" value="${escapeHtml(editingRule?.fuenteDeteccion || "matriz_deducida_2026")}" />
        </label>
      </div>
      <details class="advanced-panel" open>
        <summary>Criterios deducidos</summary>
        <div class="advanced-content">
          <div class="form-grid compact">
            <label>
              <span>Tipo persona</span>
              <input name="tipoPersonaIn" type="text" placeholder="juridica, natural" value="${escapeHtml((criterios.tipoPersonaIn || []).join(", "))}" />
            </label>
            <label>
              <span>Regimen incluye</span>
              <input name="regimenIncludesAny" type="text" placeholder="simple, ordinario" value="${escapeHtml((criterios.regimenIncludesAny || []).join(", "))}" />
            </label>
            <label>
              <span>Regimen excluye</span>
              <input name="regimenExcludesAny" type="text" placeholder="simple" value="${escapeHtml((criterios.regimenExcludesAny || []).join(", "))}" />
            </label>
            <label>
              <span>Prefijos CIIU</span>
              <input name="ciiuPrefixes" type="text" placeholder="561, 562, 563" value="${escapeHtml((criterios.ciiuPrefixes || []).join(", "))}" />
            </label>
            <label>
              <span>Flags cualquiera</span>
              <input name="boolFlagsAny" type="text" placeholder="responsableIva, obligadoFacturar" value="${escapeHtml((criterios.boolFlagsAny || []).join(", "))}" />
            </label>
            <label>
              <span>Flags todos</span>
              <input name="boolFlagsAll" type="text" placeholder="informanteExogena" value="${escapeHtml((criterios.boolFlagsAll || []).join(", "))}" />
            </label>
            <label class="full">
              <span>Responsabilidades RUT</span>
              <input name="responsabilidadRutIn" type="text" placeholder="05, 07, 48" value="${escapeHtml((criterios.responsabilidadRutIn || []).join(", "))}" />
            </label>
            <label class="checkbox-inline">
              <input name="municipioRequired" type="checkbox" ${criterios.municipioRequired ? "checked" : ""} />
              <span>Requiere municipio confirmado</span>
            </label>
            <label class="checkbox-inline">
              <input name="departamentoRequired" type="checkbox" ${criterios.departamentoRequired ? "checked" : ""} />
              <span>Requiere departamento confirmado</span>
            </label>
          </div>
        </div>
      </details>
      <div class="button-row compact">
        <button class="btn btn-primary" type="submit">${editingRule ? "Guardar regla" : "Crear regla"}</button>
      </div>
    </form>
  `;
}

function calendarByNitForm() {
  const activeTaxes = state.taxes.filter((tax) => tax.estado !== "inactivo");
  const rows = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  return `
    <form id="calendar-by-nit-form" class="modal-form-stack">
      <div class="form-grid compact">
        <label>
          <span>Impuesto</span>
          <select name="impuestoId" required>
            <option value="">Selecciona un impuesto</option>
            ${activeTaxes.map((tax) => `<option value="${tax.id}">${escapeHtml(tax.nombre)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Anio</span>
          <input name="anio" type="number" min="2020" value="${escapeHtml(state.fiscalFilters.calendarYear)}" required />
        </label>
        <label>
          <span>Periodo</span>
          <input name="periodo" type="text" placeholder="enero-febrero" required />
        </label>
        <label>
          <span>Periodicidad</span>
          <select name="periodicidad" required>
            ${selectOptions(PERIODICITY_OPTIONS, "bimestral")}
          </select>
        </label>
      </div>
      <div class="matrix-card">
        <div class="matrix-header">
          <strong>Ultimo digito</strong>
          <strong>Fecha vencimiento</strong>
        </div>
        ${rows
          .map(
            (digit) => `
              <div class="matrix-row">
                <span>${digit}</span>
                <input type="date" name="nitDate_${digit}" />
              </div>
            `
          )
          .join("")}
      </div>
      <div class="button-row compact">
        <button class="btn btn-primary" type="submit">Guardar calendario por NIT</button>
      </div>
    </form>
  `;
}

function calendarByRangeForm() {
  return `
    <form id="calendar-by-range-form" class="modal-form-stack">
      <div class="form-grid compact">
        <label>
          <span>Impuesto</span>
          <select name="impuestoId" required>
            <option value="">Selecciona un impuesto</option>
            ${state.taxes
              .filter((tax) => tax.estado !== "inactivo")
              .map((tax) => `<option value="${tax.id}">${escapeHtml(tax.nombre)}</option>`)
              .join("")}
          </select>
        </label>
        <label>
          <span>Anio</span>
          <input name="anio" type="number" min="2020" value="${escapeHtml(state.fiscalFilters.calendarYear)}" required />
        </label>
        <label>
          <span>Periodo</span>
          <input name="periodo" type="text" placeholder="enero-junio" required />
        </label>
        <label>
          <span>Periodicidad</span>
          <select name="periodicidad" required>
            ${selectOptions(PERIODICITY_OPTIONS, "anual")}
          </select>
        </label>
      </div>
      <div class="range-builder">
        ${[1, 2, 3, 4, 5]
          .map(
            (index) => `
              <div class="range-row">
                <input name="rangeFrom_${index}" type="text" placeholder="01" />
                <input name="rangeTo_${index}" type="text" placeholder="02" />
                <input name="rangeDate_${index}" type="date" />
              </div>
            `
          )
          .join("")}
      </div>
      <div class="button-row compact">
        <button class="btn btn-primary" type="submit">Guardar calendario por rango</button>
      </div>
    </form>
  `;
}

function generationForm() {
  return `
    <form id="generation-form" class="form-grid compact">
      <label>
        <span>Anio</span>
        <input name="anio" type="number" min="2020" value="${escapeHtml(state.fiscalFilters.generationYear)}" />
      </label>
      <label>
        <span>Empresa</span>
        <select name="companyId">
          <option value="">Todas las empresas activas</option>
          ${state.companies
            .map(
              (company) =>
                `<option value="${company.id}" ${company.id === state.fiscalFilters.generationCompanyId ? "selected" : ""}>${escapeHtml(company.razonSocial)}</option>`
            )
            .join("")}
        </select>
      </label>
      <label>
        <span>Impuesto</span>
        <select name="taxId">
          <option value="">Todos los impuestos</option>
          ${state.taxes
            .map(
              (tax) =>
                `<option value="${tax.id}" ${tax.id === state.fiscalFilters.generationTaxId ? "selected" : ""}>${escapeHtml(tax.nombre)}</option>`
            )
            .join("")}
        </select>
      </label>
      <div class="button-row compact full">
        <button class="btn btn-primary" type="submit">Generar tareas fiscales</button>
      </div>
    </form>
  `;
}

function taskForm() {
  return `
    <form id="task-form" class="modal-form-stack">
      <div class="form-grid compact">
        <label class="full">
          <span>Titulo</span>
          <input name="titulo" type="text" required placeholder="Ej. Preparar cierre contable mensual" />
        </label>
        <label>
          <span>Empresa</span>
          <select name="empresaId" required>
            <option value="">Selecciona una empresa</option>
            ${state.companies
              .map((company) => `<option value="${company.id}">${escapeHtml(company.razonSocial)}</option>`)
              .join("")}
          </select>
        </label>
        <label>
          <span>Tipo</span>
          <select name="tipoTarea" required>
            ${selectOptions(MANUAL_TASK_TYPE_OPTIONS, "operativa")}
          </select>
        </label>
        <label>
          <span>Responsable</span>
          <select name="responsableId">
            <option value="">Sin asignar</option>
            ${state.taskResponsibles
              .map((user) => `<option value="${user.id}">${escapeHtml(user.nombreCompleto)}</option>`)
              .join("")}
          </select>
        </label>
        <label>
          <span>Prioridad</span>
          <select name="prioridad">
            ${selectOptions(TASK_PRIORITY_OPTIONS, "media")}
          </select>
        </label>
        <label>
          <span>Periodo</span>
          <input name="periodo" type="text" placeholder="mayo 2026" />
        </label>
        <label>
          <span>Fecha vencimiento</span>
          <input name="fechaVencimiento" type="date" required />
        </label>
        <label>
          <span>Periodicidad</span>
          <select name="periodicidadProgramada">
            ${selectOptions(
              PERIODICITY_OPTIONS.filter((option) => !["personalizada", "ocasional"].includes(option.value)),
              "unica_vez"
            )}
          </select>
        </label>
        <label>
          <span>Repetir hasta</span>
          <input name="repetirHasta" type="date" />
        </label>
        <label class="full users-helper-field">
          <span>Como funciona la repeticion</span>
          <small>Si eliges mensual y la fecha de vencimiento es el dia 1, el sistema creara una tarea el dia 1 de cada mes hasta la fecha final indicada.</small>
        </label>
        <label class="full">
          <span>Descripcion</span>
          <input name="descripcion" type="text" placeholder="Detalle operativo de la tarea" />
        </label>
        <label class="full">
          <span>Observaciones</span>
          <input name="observaciones" type="text" placeholder="Notas internas" />
        </label>
      </div>
      <div class="button-row compact">
        <button class="btn btn-primary" type="submit">Crear tarea</button>
      </div>
    </form>
  `;
}

function taskSupportForm() {
  const task = getEditingTaskSupport();
  const support = task?.soporteFiscal || {};
  if (!task) {
    return `
      <div class="empty-inline-state">
        No se encontro la tarea seleccionada.
      </div>
    `;
  }

  return `
    <form id="task-support-form" class="modal-form-stack">
      <div class="summary-list-card">
        <div><strong>Tarea:</strong> ${escapeHtml(task.titulo || "Tarea")}</div>
        <div><strong>Empresa:</strong> ${escapeHtml(taskCompanyName(task))}</div>
        <div><strong>Detalle:</strong> ${escapeHtml(taskDetailLabel(task))}</div>
      </div>
      <div class="form-grid compact">
        ${TASK_SUPPORT_FIELDS.map((field) => {
          const rawValue = support[field.name] || "";
          const value = field.type === "date" ? String(rawValue).slice(0, 10) : rawValue;
          return `
            <label>
              <span>${escapeHtml(field.label)}</span>
              <input name="${field.name}" type="${field.type || "text"}" value="${escapeHtml(value)}" />
            </label>
          `;
        }).join("")}
        <label class="full">
          <span>Observacion de soporte</span>
          <input
            name="observacionSoporte"
            type="text"
            placeholder="Ej. Presentada por MUISCA y pendiente de comprobante bancario"
            value="${escapeHtml(support.observacionSoporte || "")}"
          />
        </label>
      </div>
      <div class="button-row compact">
        <button class="btn btn-primary" type="submit">Guardar soporte</button>
      </div>
    </form>
  `;
}

function fiscalSummarySection() {
  const currentYear = getCurrentFiscalYear();
  const activeTaxes = state.taxes.filter((item) => item.estado === "activo").length;
  const activeCompanies = state.companies.filter((item) => item.estadoEmpresa === "activa").length;
  const assignedObligations = state.companyObligations.filter((item) => !["inactiva", "no_aplica"].includes(item.estado)).length;
  const activeCalendars = state.fiscalCalendars.filter(
    (item) => item.estado === "activo" && Number(item.anio || 0) === currentYear
  ).length;

  return `
    <section class="stats-grid fiscal-stats-grid">
      <article class="stat-card">
        <div class="eyebrow">Impuestos activos</div>
        <div class="stat-value">${escapeHtml(String(activeTaxes))}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Empresas activas</div>
        <div class="stat-value">${escapeHtml(String(activeCompanies))}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Calendarios activos del año</div>
        <div class="stat-value">${escapeHtml(String(activeCalendars))}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Tareas fiscales generadas</div>
        <div class="stat-value">${escapeHtml(String(state.fiscalTasks.length))}</div>
      </article>
    </section>
  `;
}

function fiscalTabButtons() {
  const tabs = [
    { id: "taxes", label: "Catalogo de impuestos" },
    { id: "assignments", label: "Asignacion a empresas" },
    { id: "calendars", label: "Calendario por año" },
    { id: "generation", label: "Generacion de tareas" },
    { id: "operational", label: "Calendario operativo" }
  ];

  return `
    <div class="tab-row">
      ${tabs
        .map(
          (tab) => `
            <button
              class="tab-button ${state.fiscalTab === tab.id ? "active" : ""}"
              type="button"
              data-fiscal-tab="${tab.id}"
            >
              ${escapeHtml(tab.label)}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderFiscalSummary() {
  const summary = state.fiscalGenerationSummary;
  if (!summary) {
    return "";
  }

  return `
    <div class="review-summary-card">
      <strong>Generacion completada:</strong>
      <span>${escapeHtml(String(summary.createdCount || 0))} tareas creadas, ${escapeHtml(
        String(summary.omittedCount || 0)
      )} omitidas y ${escapeHtml(String(summary.duplicateCount || 0))} duplicados evitados.</span>
    </div>
  `;
}

function taxesSection() {
  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Catálogo de impuestos</div>
          <h3 class="section-title">Conceptos tributarios base</h3>
        </div>
        <button class="btn btn-primary" type="button" data-action="open-tax-modal">Nuevo impuesto</button>
      </div>
      <p class="muted">
        Administra los impuestos base. Estos conceptos no cambian cada año; lo que cambia son sus fechas de presentacion.
      </p>
      <div class="table-card calendar-table-card">
        <table>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Nivel</th>
              <th>Periodicidad sugerida</th>
              <th>Estado</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            ${state.taxes
              .map(
                (tax) => `
                  <tr>
                    <td>${escapeHtml(tax.codigo)}</td>
                    <td>${escapeHtml(tax.nombre)}</td>
                    <td>${escapeHtml(tax.nivel)}</td>
                    <td>${escapeHtml(formatStatus(tax.periodicidadDefault || "-"))}</td>
                    <td><span class="${statusClass(tax.estado)}">${escapeHtml(formatStatus(tax.estado))}</span></td>
                    <td>
                      <div class="button-row compact">
                        <button class="btn btn-secondary table-action" type="button" data-action="edit-tax" data-tax-id="${tax.id}">Editar</button>
                        <button
                          class="btn btn-secondary table-action"
                          type="button"
                          data-action="toggle-tax-state"
                          data-tax-id="${tax.id}"
                          data-next-state="${tax.estado === "activo" ? "inactivo" : "activo"}"
                        >
                          ${tax.estado === "activo" ? "Inactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function assignmentForm() {
  const editingObligation = getEditingObligation();
  const companyId = editingObligation?.empresaId || state.fiscalFilters.assignmentCompanyId || "";
  const selectedTaxId = editingObligation?.impuestoId || "";
  const eventOptions = fiscalEventOptionsForTax(selectedTaxId);
  const selectedEventKey = editingObligation?.eventoFiscalClave || eventOptions[0]?.value || "";
  const defaultPeriodicity =
    editingObligation?.periodicidadAplicable ||
    editingObligation?.periodicidad ||
    eventOptionPeriodicity(eventOptions, selectedEventKey) ||
    "bimestral";
  return `
    <form id="manual-obligation-form" class="form-grid compact">
      <label>
        <span>Empresa</span>
        <select name="empresaId" required ${editingObligation ? "disabled" : ""}>
          <option value="">Selecciona una empresa</option>
          ${state.companies
            .map(
              (company) =>
                `<option value="${company.id}" ${company.id === companyId ? "selected" : ""}>${escapeHtml(company.razonSocial)}</option>`
            )
            .join("")}
        </select>
      </label>
      <label>
        <span>Impuesto</span>
        <select name="impuestoId" required data-role="manual-obligation-tax">
          <option value="">Selecciona un impuesto</option>
          ${state.taxes
            .filter((tax) => tax.estado !== "inactivo")
            .map(
              (tax) =>
                `<option value="${tax.id}" ${tax.id === (editingObligation?.impuestoId || "") ? "selected" : ""}>${escapeHtml(tax.nombre)}</option>`
            )
            .join("")}
        </select>
      </label>
      <label>
        <span>Evento fiscal</span>
        <select name="eventoFiscalClave" data-role="manual-obligation-event">
          ${
            eventOptions.length
              ? selectOptions(eventOptions, selectedEventKey)
              : '<option value="">Evento general</option>'
          }
        </select>
      </label>
      <label>
        <span>Nivel</span>
        <select name="nivel" required>
          ${selectOptions(TAX_LEVEL_OPTIONS, editingObligation?.nivel || "municipal")}
        </select>
      </label>
      <label>
        <span>Periodicidad aplicable</span>
        <select name="periodicidadAplicable" required data-role="manual-obligation-periodicity">
          ${selectOptions(PERIODICITY_OPTIONS, defaultPeriodicity)}
        </select>
      </label>
      <label>
        <span>Departamento</span>
        <input name="departamento" type="text" placeholder="Bogota D.C." value="${escapeHtml(editingObligation?.departamentoAplicacion || "")}" />
      </label>
      <label>
        <span>Municipio / Ciudad</span>
        <input name="municipioCiudad" type="text" placeholder="Bogota D.C." value="${escapeHtml(editingObligation?.municipioAplicacion || "")}" />
      </label>
      <label>
        <span>Fecha inicio aplicacion</span>
        <input name="fechaInicioAplicacion" type="date" value="${escapeHtml(editingObligation?.fechaInicioAplicacion || "").slice(0, 10)}" />
      </label>
      <label>
        <span>Estado</span>
        <select name="estado" required>
          ${selectOptions(
            [
              { value: "sugerida", label: "Sugerida" },
              { value: "pendiente_revision", label: "Pendiente revision" },
              { value: "activa", label: "Activa" },
              { value: "no_aplica", label: "No aplica" },
              { value: "inactiva", label: "Inactiva" }
            ],
            editingObligation?.estado || "pendiente_revision"
          )}
        </select>
      </label>
      <label class="full">
        <span>Motivo</span>
        <input
          name="motivo"
          type="text"
          placeholder="Asignacion manual por validacion tributaria"
          value="${escapeHtml(editingObligation?.motivoAplicacion || "")}"
        />
      </label>
      <label class="full">
        <span>Observaciones</span>
        <input name="observaciones" type="text" placeholder="Notas internas" value="${escapeHtml(editingObligation?.observaciones || "")}" />
      </label>
      <div class="button-row full compact">
        <button class="btn btn-primary" type="submit">${editingObligation ? "Guardar cambios" : "Asignar impuesto a empresa"}</button>
      </div>
    </form>
  `;
}

function assignmentsSection() {
  const assignmentCompany = selectedAssignmentCompany();
  const companyOptions = state.companies
    .map(
      (company) =>
        `<option value="${company.id}" ${company.id === (assignmentCompany?.id || "") ? "selected" : ""}>${escapeHtml(company.razonSocial)}</option>`
    )
    .join("");
  const obligations = assignmentCompany
    ? state.companyObligations.filter((item) => item.empresaId === assignmentCompany.id)
    : [];

  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Asignacion de impuestos</div>
          <h3 class="section-title">Asignacion de impuestos a empresas</h3>
        </div>
        <button class="btn btn-primary" type="button" data-action="open-assignment-modal">Asignar impuesto</button>
      </div>
      <p class="muted">
        Asigna manualmente impuestos a una empresa cuando el motor del RUT no los detecte o cuando se trate de impuestos municipales o departamentales.
      </p>
      ${renderAppFilterCard({
        title: "Filtros de asignacion",
        description: "Selecciona una empresa para revisar o ampliar los impuestos aplicables dentro de su gestion fiscal.",
        fields: `
          <label class="app-filter-field app-filter-field-tax">
            <span class="app-filter-label">Empresa</span>
            <select class="app-filter-select" data-filter="assignmentCompanyId">
              <option value="">Selecciona una empresa</option>
              ${companyOptions}
            </select>
          </label>
        `,
        gridClass: "app-filter-grid app-filter-grid-single"
      })}
      <div class="table-card calendar-table-card">
        <table>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Impuesto</th>
              <th>Nivel</th>
              <th>Periodicidad aplicable</th>
              <th>Estado</th>
              <th>Fuente</th>
            </tr>
          </thead>
          <tbody>
            ${obligations
              .map(
                (item) => `
                  <tr class="${state.selectedCompany?.id === item.empresaId ? "user-row-selected" : ""}">
                    <td>${escapeHtml(assignmentCompany?.razonSocial || "-")}</td>
                    <td>${escapeHtml(obligationLabel(item) || "-")}</td>
                    <td>${escapeHtml(item.nivel || "-")}</td>
                    <td>${escapeHtml(formatStatus(item.periodicidadAplicable || item.periodicidad || "-"))}</td>
                    <td><span class="${statusClass(item.estado)}">${escapeHtml(formatStatus(item.estado))}</span></td>
                    <td>${escapeHtml(item.fuenteDeteccion || "-")}</td>
                  </tr>
                `
              )
              .join("") || '<tr><td colspan="6" class="muted">Selecciona una empresa para ver que impuestos le corresponden y ampliar sus obligaciones.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function operationalCalendarSection() {
  const filteredTasks = filterOperationalTasks();
  const sortedTasks = filteredTasks
    .slice()
    .sort((a, b) => String(a.fechaVencimiento || "").localeCompare(String(b.fechaVencimiento || "")) || taskCompanyName(a).localeCompare(taskCompanyName(b), "es"));
  const calendarReference = getOperationalCalendarReference();
  const monthTasks = sortedTasks.filter(
    (task) =>
      String(task.fechaVencimiento || "").slice(0, 4) === String(calendarReference.year)
      && String(task.fechaVencimiento || "").slice(5, 7) === calendarReference.monthKey
  );
  const overdueCount = sortedTasks.filter((task) => taskStatus(task) === "vencida").length;
  const pendingCount = sortedTasks.filter((task) =>
    ["pendiente", "en_proceso", "pendiente_preparacion", "en_preparacion", "en_revision"].includes(taskStatus(task))
  ).length;
  const dianCount = sortedTasks.filter((task) => task.tipoTarea === "cumplimiento_dian").length;
  const assignableTasks = openOperationalTasks(sortedTasks);

  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Panel de tareas</div>
          <h3 class="section-title">Gestion integral de tareas</h3>
        </div>
        <div class="button-row">
          <button class="btn btn-secondary" type="button" data-action="generate-dian-controls">Generar controles DIAN</button>
          <button class="btn btn-primary" type="button" data-action="open-task-modal">Crear tarea manual</button>
        </div>
      </div>
      <p class="muted">
        Controla tareas fiscales generadas desde calendario y tareas manuales no fiscales sin mezclar este flujo con el cargue del RUT.
      </p>
      <div class="dashboard-mini-grid">
        <article class="dashboard-mini-card">
          <div class="dashboard-mini-copy">
            <strong>${escapeHtml(String(monthTasks.length))}</strong>
            <span>Responsabilidades en ${escapeHtml(calendarReference.monthLabel)}</span>
          </div>
        </article>
        <article class="dashboard-mini-card">
          <div class="dashboard-mini-copy">
            <strong>${escapeHtml(String(pendingCount))}</strong>
            <span>Pendientes o en gestion</span>
          </div>
        </article>
        <article class="dashboard-mini-card">
          <div class="dashboard-mini-copy">
            <strong>${escapeHtml(String(overdueCount))}</strong>
            <span>Vencidas segun filtro actual</span>
          </div>
        </article>
        <article class="dashboard-mini-card">
          <div class="dashboard-mini-copy">
            <strong>${escapeHtml(String(dianCount))}</strong>
            <span>Controles DIAN visibles</span>
          </div>
        </article>
      </div>
      <div class="operations-action-strip">
        <div>
          <div class="eyebrow">Accion masiva del equipo</div>
          <strong>${escapeHtml(String(assignableTasks.length))}</strong>
          <span class="muted">tareas abiertas coinciden con los filtros actuales.</span>
        </div>
        <label class="inline-filter operations-action-control">
          <span>Asignar visibles a</span>
          <select id="bulk-responsible-select">
            <option value="">Selecciona contador</option>
            ${state.taskResponsibles
              .map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.nombreCompleto)}</option>`)
              .join("")}
          </select>
        </label>
        <button class="btn btn-primary" type="button" data-action="bulk-assign-visible" ${assignableTasks.length ? "" : "disabled"}>
          Reasignar filtradas
        </button>
      </div>
      ${renderAppFilterCard({
        title: "Filtros operativos",
        description: "Refina la bandeja por tipo, empresa, impuesto, responsable, estado y riesgo operativo sin salir del calendario.",
        fields: `
          <label class="app-filter-field">
            <span class="app-filter-label">Tipo</span>
            <select class="app-filter-select" data-filter="operationalTaskType">
              <option value="">Todos</option>
              ${TASK_TYPE_OPTIONS.map(
                (option) =>
                  `<option value="${option.value}" ${option.value === state.fiscalFilters.operationalTaskType ? "selected" : ""}>${escapeHtml(option.label)}</option>`
              ).join("")}
            </select>
          </label>
          <label class="app-filter-field">
            <span class="app-filter-label">Empresa</span>
            <select class="app-filter-select" data-filter="operationalCompanyId">
              <option value="">Todas</option>
              ${state.companies
                .map(
                  (company) =>
                    `<option value="${company.id}" ${company.id === state.fiscalFilters.operationalCompanyId ? "selected" : ""}>${escapeHtml(company.razonSocial)}</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="app-filter-field">
            <span class="app-filter-label">Impuesto</span>
            <select class="app-filter-select" data-filter="operationalTaxId">
              <option value="">Todos</option>
              ${state.taxes
                .map(
                  (tax) =>
                    `<option value="${tax.id}" ${tax.id === state.fiscalFilters.operationalTaxId ? "selected" : ""}>${escapeHtml(tax.nombre)}</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="app-filter-field">
            <span class="app-filter-label">Responsable</span>
            <select class="app-filter-select" data-filter="operationalResponsibleId">
              <option value="">Todos</option>
              <option value="__unassigned" ${state.fiscalFilters.operationalResponsibleId === "__unassigned" ? "selected" : ""}>Sin responsable</option>
              ${state.taskResponsibles
                .map(
                  (user) =>
                    `<option value="${user.id}" ${user.id === state.fiscalFilters.operationalResponsibleId ? "selected" : ""}>${escapeHtml(user.nombreCompleto)}</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="app-filter-field">
            <span class="app-filter-label">Estado</span>
            <select class="app-filter-select" data-filter="operationalState">
              <option value="">Todos</option>
              ${TASK_STATUS_OPTIONS.map(
                (option) =>
                  `<option value="${option.value}" ${option.value === state.fiscalFilters.operationalState ? "selected" : ""}>${escapeHtml(option.label)}</option>`
              ).join("")}
            </select>
          </label>
          <label class="app-filter-field">
            <span class="app-filter-label">Vencimiento</span>
            <select class="app-filter-select" data-filter="operationalDueKind">
              <option value="">Todos</option>
              <option value="vencidas" ${state.fiscalFilters.operationalDueKind === "vencidas" ? "selected" : ""}>Vencidas</option>
              <option value="proximas" ${state.fiscalFilters.operationalDueKind === "proximas" ? "selected" : ""}>Proximas 7 dias</option>
            </select>
          </label>
          <label class="app-filter-field">
            <span class="app-filter-label">Cliente / revision</span>
            <select class="app-filter-select" data-filter="operationalClientRisk">
              <option value="">Todos</option>
              <option value="bloqueadas_cliente" ${state.fiscalFilters.operationalClientRisk === "bloqueadas_cliente" ? "selected" : ""}>Bloqueadas por cliente</option>
              <option value="pendiente_pago_cliente" ${state.fiscalFilters.operationalClientRisk === "pendiente_pago_cliente" ? "selected" : ""}>Pago o soporte cliente</option>
              <option value="en_revision" ${state.fiscalFilters.operationalClientRisk === "en_revision" ? "selected" : ""}>En revision</option>
            </select>
          </label>
        `,
        gridClass: "app-filter-grid app-filter-grid-wide"
      })}
      ${renderOperationalMonthCalendarV2(monthTasks)}
      <section class="calendar-agenda-panel">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Agenda por fecha</div>
            <h4 class="section-title">Detalle de responsabilidades visibles</h4>
            <p class="muted">Cada dia muestra las tareas y responsabilidades detectadas para que no pierdas el contexto operativo.</p>
          </div>
        </div>
        ${renderOperationalAgendaV2(sortedTasks)}
      </section>
    </section>
  `;
}

function alertsSection() {
  const unreadCount = state.internalAlerts.filter((alert) => alert.estado === "no_leida").length;
  const criticalCount = state.internalAlerts.filter((alert) => alert.nivel === "critica" && !isClosedAlert(alert)).length;
  const dianAlertCount = state.internalAlerts.filter(
    (alert) => !isClosedAlert(alert) && alert.tarea?.tipoTarea === "cumplimiento_dian"
  ).length;
  const visibleCompanies = state.companies
    .slice()
    .sort((left, right) => String(left.razonSocial || "").localeCompare(String(right.razonSocial || ""), "es"));
  const visibleResponsibles = state.taskResponsibles
    .slice()
    .sort((left, right) => String(left.nombreCompleto || "").localeCompare(String(right.nombreCompleto || ""), "es"));
  const canManageAlerts = hasPermission("gestionar_alertas");
  const canReadAlerts = hasAnyPermission(["ver_alertas", "gestionar_alertas"]);

  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Alertas internas</div>
          <h3 class="section-title">Vencimientos y tareas por atender</h3>
        </div>
        <button class="btn btn-primary" type="button" data-action="generate-alerts">Actualizar alertas</button>
      </div>
      <p class="muted">
        Alertas internas generadas desde tareas proximas a vencer o vencidas. No se envian correos externos todavia.
      </p>
      <div class="summary-grid">
        <article class="summary-list-card">
          <strong>${escapeHtml(String(unreadCount))}</strong>
          <span>Nuevas visibles para tu usuario</span>
        </article>
        <article class="summary-list-card">
          <strong>${escapeHtml(String(criticalCount))}</strong>
          <span>Criticas sin atender</span>
        </article>
        <article class="summary-list-card">
          <strong>${escapeHtml(String(dianAlertCount))}</strong>
          <span>Controles DIAN con alerta</span>
        </article>
      </div>
      ${renderAppFilterCard({
        title: "Filtros de alertas",
        description: "Filtra por empresa, responsable, tipo, prioridad y estado sin salir del alcance visible de tu usuario.",
        fields: `
          <label class="app-filter-field">
            <span class="app-filter-label">Empresa</span>
            <select class="app-filter-select" data-filter="alertCompanyId">
              <option value="">Todas</option>
              ${visibleCompanies
                .map(
                  (company) =>
                    `<option value="${company.id}" ${company.id === state.fiscalFilters.alertCompanyId ? "selected" : ""}>${escapeHtml(company.razonSocial || company.id)}</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="app-filter-field">
            <span class="app-filter-label">Responsable</span>
            <select class="app-filter-select" data-filter="alertResponsibleId">
              <option value="">Todos</option>
              ${visibleResponsibles
                .map(
                  (user) =>
                    `<option value="${user.id}" ${user.id === state.fiscalFilters.alertResponsibleId ? "selected" : ""}>${escapeHtml(user.nombreCompleto || user.email || user.id)}</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="app-filter-field">
            <span class="app-filter-label">Estado</span>
            <select class="app-filter-select" data-filter="alertState">
              <option value="">Todos</option>
              ${ALERT_STATUS_OPTIONS.map(
                (option) =>
                  `<option value="${option.value}" ${option.value === state.fiscalFilters.alertState ? "selected" : ""}>${escapeHtml(option.label)}</option>`
              ).join("")}
            </select>
          </label>
          <label class="app-filter-field">
            <span class="app-filter-label">Tipo</span>
            <select class="app-filter-select" data-filter="alertType">
              <option value="">Todos</option>
              ${ALERT_TYPE_OPTIONS.map(
                (option) =>
                  `<option value="${option.value}" ${option.value === state.fiscalFilters.alertType ? "selected" : ""}>${escapeHtml(option.label)}</option>`
              ).join("")}
            </select>
          </label>
          <label class="app-filter-field">
            <span class="app-filter-label">Prioridad</span>
            <select class="app-filter-select" data-filter="alertLevel">
              <option value="">Todos</option>
              ${ALERT_LEVEL_OPTIONS.map(
                (option) =>
                  `<option value="${option.value}" ${option.value === state.fiscalFilters.alertLevel ? "selected" : ""}>${escapeHtml(option.label)}</option>`
              ).join("")}
            </select>
          </label>
        `,
        actions: `
          <button class="btn btn-secondary app-filter-button" type="button" data-action="clear-alert-filters">
            Limpiar filtros
          </button>
        `,
        gridClass: "app-filter-grid app-filter-grid-wide"
      })}
      <div class="table-card calendar-table-card">
        <table>
          <thead>
            <tr>
              <th>Nivel</th>
              <th>Tipo</th>
              <th>Tarea</th>
              <th>Empresa</th>
              <th>Responsable</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${state.internalAlerts
              .map(
                (alert) => `
                  <tr>
                    <td><span class="${statusClass(alert.nivel)}">${escapeHtml(alertLevelLabel(alert.nivel))}</span></td>
                    <td>${escapeHtml(alertTypeLabel(alert.tipo))}</td>
                    <td>
                      <strong>${escapeHtml(alert.tarea?.titulo || alert.mensaje || "Alerta interna")}</strong>
                      <div class="muted table-subtext">${escapeHtml(alert.mensaje || "Revisa la tarea asociada.")}</div>
                    </td>
                    <td>${escapeHtml(alert.tarea?.empresa?.razonSocial || alert.empresaId || "-")}</td>
                    <td>${escapeHtml(alert.tarea?.responsable?.nombreCompleto || alert.responsableId || "Sin responsable")}</td>
                    <td>${escapeHtml(formatDateLabel(alert.fechaVencimiento))}</td>
                    <td>
                      <span class="${statusClass(alert.estado)}">${escapeHtml(alertStatusLabel(alert.estado))}</span>
                      ${
                        alert.motivoEstado
                          ? `<div class="muted table-subtext">${escapeHtml(alert.motivoEstado)}</div>`
                          : ""
                      }
                    </td>
                    <td>
                      <div class="calendar-row-actions">
                        ${
                          canReadAlerts && alert.estado === "no_leida"
                            ? `<button class="btn btn-secondary table-action" type="button" data-action="alert-status" data-alert-id="${escapeHtml(alert.id)}" data-alert-status="leida">Marcar leida</button>`
                            : ""
                        }
                        ${
                          canManageAlerts && !isClosedAlert(alert)
                            ? `<button class="btn btn-secondary table-action" type="button" data-action="alert-status" data-alert-id="${escapeHtml(alert.id)}" data-alert-status="atendida">Atendida</button>`
                            : ""
                        }
                        ${
                          canManageAlerts && !isClosedAlert(alert)
                            ? `<button class="btn btn-secondary table-action" type="button" data-action="alert-status" data-alert-id="${escapeHtml(alert.id)}" data-alert-status="descartada">Descartar</button>`
                            : '<span class="muted">Sin acciones</span>'
                        }
                      </div>
                    </td>
                  </tr>
                `
              )
              .join("") || '<tr><td colspan="8" class="muted">No hay alertas internas para los filtros seleccionados.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function fiscalCalendarsSection() {
  const groupedCalendars = groupFiscalCalendars(filterFiscalCalendars());
  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Calendario por año</div>
          <h3 class="section-title">Fechas de vencimiento por impuesto y anio</h3>
        </div>
      </div>
      <p class="muted">
        Configura las fechas de vencimiento de cada impuesto por anio, periodo, municipio y criterio del NIT, sin afectar anios anteriores.
      </p>
      ${renderFiscalCalendarFiltersCard()}
      <div class="calendar-group-list">
        ${groupedCalendars
          .map(
            (group) => `
              <details class="calendar-group-card">
                <summary class="calendar-group-summary">
                  <div class="calendar-group-primary">
                    <strong>${escapeHtml(group.impuestoNombre)}</strong>
                    <span class="calendar-group-meta">
                      ${escapeHtml(String(group.anio || ""))} · ${escapeHtml(group.periodo)} · ${escapeHtml(formatStatus(group.criterioVencimiento || "independiente_nit"))}
                    </span>
                  </div>
                  <div class="calendar-group-secondary">
                    <span class="calendar-group-chip">${escapeHtml(group.items.length === 1 ? "1 vencimiento" : `${group.items.length} vencimientos`)}</span>
                    <span class="${statusClass(group.estado)}">${escapeHtml(formatStatus(group.estado))}</span>
                    <span class="calendar-group-version">V${escapeHtml(String(group.version || 1))}</span>
                  </div>
                </summary>
                <div class="calendar-group-body">
                  <div class="calendar-group-context">
                    <span><strong>Municipio / Ciudad:</strong> ${escapeHtml(group.municipioCiudad || "-")}</span>
                    <span><strong>Periodicidad:</strong> ${escapeHtml(formatStatus(group.periodicidad || "-"))}</span>
                    ${group.nombreCuota ? `<span><strong>Cuota:</strong> ${escapeHtml(group.nombreCuota)}</span>` : ""}
                  </div>
                  <div class="table-card calendar-detail-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Ultimo digito / regla</th>
                          <th>Fecha vencimiento</th>
                          <th>Estado</th>
                          <th>Version</th>
                          <th>Accion</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${group.items
                          .map(
                            (calendar) => `
                              <tr>
                                <td>${escapeHtml(detailLabelForCalendar(calendar))}</td>
                                <td>${escapeHtml(formatDateLabel(calendar.fechaVencimiento))}</td>
                                <td><span class="${statusClass(calendar.estado)}">${escapeHtml(formatStatus(calendar.estado))}</span></td>
                                <td>${escapeHtml(String(calendar.version || 1))}</td>
                                <td>
                                  <div class="calendar-row-actions">
                                    ${
                                      ["borrador", "validado"].includes(calendar.estado)
                                        ? `<button class="btn btn-secondary table-action" type="button" data-action="activate-calendar" data-calendar-id="${calendar.id}">Activar</button>`
                                        : ""
                                    }
                                    <button class="btn btn-danger table-action" type="button" data-action="delete-calendar" data-calendar-id="${calendar.id}">Eliminar</button>
                                  </div>
                                </td>
                              </tr>
                            `
                          )
                          .join("")}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            `
          )
          .join("") || '<div class="table-card"><div class="empty-inline-state">No hay calendarios para los filtros seleccionados.</div></div>'}
      </div>
    </section>
  `;
}

function fiscalCalendarsSectionGuided() {
  const groupedCalendars = groupFiscalCalendars(filterFiscalCalendars());

  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Calendario por anio</div>
          <h3 class="section-title">Fechas de vencimiento por impuesto y anio</h3>
        </div>
      </div>
      <p class="muted">
        El impuesto es un concepto estable. Aqui ves sus fechas de vencimiento para el anio seleccionado sin afectar historicos anteriores.
      </p>
      ${taxesCatalogCompactSection()}
      ${renderFiscalCalendarFiltersCard()}
      <div class="calendar-group-list">
        ${groupedCalendars
          .map((group) => {
            const distinctPeriods = new Set(group.items.map((item) => item.periodo || "-")).size;
            const activeCount = group.items.filter((item) => item.estado === "activo").length;

            return `
              <details class="calendar-group-card">
                <summary class="calendar-group-summary">
                  <div class="calendar-group-primary">
                    <strong>${escapeHtml(group.impuestoNombre)}</strong>
                    <span class="calendar-group-meta">
                      ${escapeHtml(String(group.anio || ""))} · ${escapeHtml(formatStatus(group.nivel || "nacional"))}
                    </span>
                  </div>
                  <div class="calendar-group-secondary">
                    <span class="calendar-group-chip">${escapeHtml(distinctPeriods === 1 ? "1 periodo" : `${distinctPeriods} periodos`)}</span>
                    <span class="calendar-group-chip">${escapeHtml(group.items.length === 1 ? "1 fecha" : `${group.items.length} fechas`)}</span>
                    <span class="calendar-group-chip">${escapeHtml(activeCount === 1 ? "1 activa" : `${activeCount} activas`)}</span>
                  </div>
                </summary>
                <div class="calendar-group-body">
                  <div class="calendar-group-context">
                    <span><strong>Municipio / Ciudad:</strong> ${escapeHtml(group.municipioCiudad || "-")}</span>
                    <span><strong>Departamento:</strong> ${escapeHtml(group.departamento || "-")}</span>
                    <span><strong>Logica:</strong> Cambiar fechas del proximo anio no modifica tareas ni cumplimientos del anio anterior.</span>
                  </div>
                  <div class="table-card calendar-detail-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Periodo</th>
                          <th>Criterio</th>
                          <th>Ultimo digito / regla</th>
                          <th>Fecha vencimiento</th>
                          <th>Estado</th>
                          <th>Version</th>
                          <th>Accion</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${group.items
                          .map(
                            (calendar) => `
                              <tr>
                                <td>${escapeHtml(calendar.periodo || "-")}</td>
                                <td>${escapeHtml(formatStatus(calendar.criterioVencimiento || "independiente_nit"))}</td>
                                <td>${escapeHtml(detailLabelForCalendar(calendar))}</td>
                                <td>${escapeHtml(formatDateLabel(calendar.fechaVencimiento))}</td>
                                <td><span class="${statusClass(calendar.estado)}">${escapeHtml(formatStatus(calendar.estado))}</span></td>
                                <td>V${escapeHtml(String(calendar.version || 1))}</td>
                                <td>
                                  <div class="calendar-row-actions">
                                    ${
                                      ["borrador", "validado"].includes(calendar.estado)
                                        ? `<button class="btn btn-secondary table-action" type="button" data-action="activate-calendar" data-calendar-id="${calendar.id}">Activar</button>`
                                        : ""
                                    }
                                    <button class="btn btn-secondary table-action" type="button" data-action="edit-calendar" data-calendar-id="${calendar.id}">Editar</button>
                                    <button class="btn btn-danger table-action" type="button" data-action="delete-calendar" data-calendar-id="${calendar.id}">Eliminar</button>
                                  </div>
                                </td>
                              </tr>
                            `
                          )
                          .join("")}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            `;
          })
          .join("") || '<div class="table-card"><div class="empty-inline-state">No hay calendarios para los filtros seleccionados.</div></div>'}
      </div>
    </section>
  `;
}

function renderAppFilterCard({
  eyebrow = "Filtros",
  title = "Filtros",
  description = "",
  fields = "",
  actions = "",
  gridClass = "app-filter-grid"
} = {}) {
  return `
    <section class="app-filter-card">
      <div class="app-filter-header">
        <div class="eyebrow">${escapeHtml(eyebrow)}</div>
        <h4 class="app-filter-title">${escapeHtml(title)}</h4>
        <p class="muted app-filter-description">
          ${escapeHtml(description)}
        </p>
      </div>
      <div class="${gridClass}">
        ${fields}
        ${actions
          ? `
            <div class="app-filter-actions">
              ${actions}
            </div>
          `
          : ""}
      </div>
    </section>
  `;
}

function renderFiscalCalendarFiltersCard() {
  return renderAppFilterCard({
    eyebrow: "Calendario fiscal",
    title: "Filtros del calendario",
    description: "Consulta vencimientos por anio e impuesto y crea nuevos calendarios sin salir de esta vista.",
    gridClass: "app-filter-grid app-filter-grid-calendar",
    fields: `
        <label class="app-filter-field app-filter-field-year">
          <span class="app-filter-label">Anio</span>
          <input
            class="app-filter-input"
            data-filter="calendarYear"
            type="number"
            min="2020"
            value="${escapeHtml(state.fiscalFilters.calendarYear)}"
          />
        </label>
        <label class="app-filter-field app-filter-field-tax">
          <span class="app-filter-label">Impuesto</span>
          <select class="app-filter-select" data-filter="calendarTaxId">
            <option value="">Todos</option>
            ${state.taxes
              .map(
                (tax) =>
                  `<option value="${tax.id}" ${tax.id === state.fiscalFilters.calendarTaxId ? "selected" : ""}>${escapeHtml(tax.nombre)}</option>`
              )
              .join("")}
          </select>
        </label>
      `,
    actions: `
          <button class="btn btn-primary app-filter-button" type="button" data-action="open-calendar-modal">Crear calendario</button>
          <button class="btn btn-secondary" type="button" data-action="open-calendar-nit-modal">Cargar fechas por NIT</button>
          <button class="btn btn-secondary" type="button" data-action="open-calendar-range-modal">Cargar fechas por rango</button>
    `
  });
}

function generationSection() {
  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Generacion de tareas</div>
          <h3 class="section-title">Generacion de tareas fiscales</h3>
        </div>
        <button class="btn btn-primary" type="button" data-action="open-generation-modal">Generar tareas fiscales</button>
      </div>
      <p class="muted">
        Genera tareas fiscales para empresas activas con obligaciones activas y calendario aplicable.
      </p>
      <div class="summary-list-card">
        <div><strong>Empresa activa</strong> + <strong>Obligacion activa</strong> + <strong>Calendario fiscal aplicable</strong> = <strong>Tarea fiscal</strong></div>
      </div>
      ${renderFiscalSummary()}
    </section>
  `;
}

function renderFiscalModal() {
  if (!state.fiscalModal) {
    return "";
  }

  const modalMap = {
    tax: {
      eyebrow: "Catálogo de impuestos",
      title: getEditingTax() ? "Editar impuesto" : "Nuevo impuesto",
      description: "Crea o ajusta conceptos tributarios base sin abrir formularios largos en la vista principal.",
      content: taxForm()
    },
    assignment: {
      eyebrow: "Asignacion a empresas",
      title: getEditingObligation() ? "Editar impuesto de la empresa" : "Asignar impuesto a empresa",
      description: getEditingObligation()
        ? "Ajusta el impuesto, su estado y su periodicidad sin perder el contexto de la empresa seleccionada."
        : "Define que impuesto le corresponde a la empresa y con que periodicidad operara.",
      content: assignmentForm()
    },
    calendar: {
      eyebrow: "Calendario por año",
      title: state.fiscalModal?.payload?.calendar ? "Editar calendario" : "Crear calendario",
      description: state.fiscalModal?.payload?.calendar
        ? "Ajusta este registro sin romper historicos. Si ya estaba activo, el sistema te exigira versionar el cambio."
        : "Registra una fecha de vencimiento puntual para un impuesto en un anio y periodo concretos.",
      content: calendarForm()
    },
    "calendar-nit": {
      eyebrow: "Calendario por año",
      title: "Cargar fechas por NIT",
      description: "Registra una fecha por cada ultimo digito del NIT para crear el calendario anual completo.",
      content: calendarByNitForm()
    },
    "calendar-range": {
      eyebrow: "Calendario por año",
      title: "Cargar fechas por rango",
      description: "Define rangos de dos ultimos digitos del NIT y su fecha de vencimiento correspondiente.",
      content: calendarByRangeForm()
    },
    generation: {
      eyebrow: "Generacion de tareas",
      title: "Generar tareas fiscales",
      description: "Filtra por anio, empresa o impuesto y genera tareas solo cuando exista un calendario aplicable.",
      content: generationForm()
    },
    task: {
      eyebrow: "Panel de tareas",
      title: "Crear tarea manual",
      description: "Registra una tarea no fiscal para una empresa activa y asignala al responsable operativo.",
      content: taskForm()
    },
    "task-support": {
      eyebrow: "Panel de tareas",
      title: "Registrar soporte de tarea",
      description: "Guarda formulario, acuse, recibo y notas operativas para dejar trazabilidad por cada obligacion.",
      content: taskSupportForm()
    },
    "inferred-rule": {
      eyebrow: "Matriz deducida",
      title: getEditingInferredRule() ? "Editar regla deducida" : "Nueva regla deducida",
      description: "Administra reglas que sugieren impuestos a partir del RUT, el regimen, el CIIU y otros datos confirmados.",
      content: inferredRuleForm()
    }
  };

  const modal = modalMap[state.fiscalModal.type];
  if (!modal) {
    return "";
  }

  return `
    <div class="fiscal-modal-backdrop" id="fiscal-modal-backdrop">
      <section class="fiscal-modal-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(modal.title)}">
        <div class="panel-header">
          <div>
            <div class="eyebrow">${escapeHtml(modal.eyebrow)}</div>
            <h3 class="section-title">${escapeHtml(modal.title)}</h3>
            <p class="muted">${escapeHtml(modal.description)}</p>
          </div>
          <button class="btn btn-secondary" type="button" data-action="close-fiscal-modal">Cerrar</button>
        </div>
        ${modal.content}
      </section>
    </div>
  `;
}

function fiscalCalendarView() {
  let activeSection = fiscalCalendarsSectionGuided();

  if (state.fiscalTab === "taxes") {
    activeSection = taxesSection();
  } else if (state.fiscalTab === "assignments") {
    activeSection = assignmentsSection();
  } else if (state.fiscalTab === "generation") {
    activeSection = generationSection();
  } else if (state.fiscalTab === "operational") {
    activeSection = operationalCalendarSection();
  }

  return `
    ${fiscalSummarySection()}
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Calendario fiscal</div>
          <h3 class="section-title">Calendario fiscal</h3>
          <p class="muted">Administra impuestos, calendarios versionados y vencimientos fiscales.</p>
        </div>
      </div>
      ${fiscalTabButtons()}
    </section>
    ${messageCard(
      state.calendarMessage,
      /correctamente|creadas|completada/i.test(state.calendarMessage || "") &&
        !/no se pudo|error|verifica/i.test(state.calendarMessage || "")
        ? "success"
        : /no se pudo|error|verifica/i.test(state.calendarMessage || "")
          ? "error"
          : "info"
    )}
    ${activeSection}
    ${renderFiscalModal()}
  `;
}

function companyDetailSectionSimple() {
  if (!state.selectedCompany) {
    return `
      <section class="panel-card rut-detail-card">
        <div class="rut-detail-header">
          <div class="rut-detail-title-block">
            <div class="eyebrow">Detalle de empresa</div>
            <h3 class="section-title">Selecciona una empresa del listado</h3>
            <p class="rut-detail-summary">
              Aqui veras el detalle documental, el estado operativo y la informacion principal extraida desde el RUT.
            </p>
          </div>
        </div>
      </section>
    `;
  }

  const company = state.selectedCompany;
  const detailStatus = escapeHtml(formatStatus(company.estadoEmpresa));
  const commercialName = company.nombreComercial ? escapeHtml(company.nombreComercial) : "Sin nombre comercial";
  const nitWithDv = `${escapeHtml(company.nit || "No registrado")}${company.dv ? `-${escapeHtml(company.dv)}` : ""}`;
  const location = escapeHtml([company.pais, company.departamento, company.municipio].filter(Boolean).join(" / ") || "No registrada");
  const email = escapeHtml(company.correoElectronico || company.email || "No registrado");
  const phone = escapeHtml(company.telefono1 || "No registrado");
  const activityCode = escapeHtml(company.actividadEconomicaPrincipalCodigo || company.actividadEconomicaPrincipal || "No registrado");
  const activityDescription = escapeHtml(company.actividadEconomicaPrincipalNombre || "No registrada");
  const responsibilities = (company.responsabilidadesTributarias || [])
    .map(
      (item) => `
        <span class="user-table-pill rut-responsibility-pill">
          ${escapeHtml([item.codigo, item.descripcion].filter(Boolean).join(" - ") || "Responsabilidad")}
        </span>
      `
    )
    .join("");
  const openDianControls = countOpenDianControls(company);
  const canApproveCompany =
    hasPermission("aprobar_empresa") && (company.estadoEmpresa === "pendiente_revision" || company.estadoEmpresa === "borrador");
  const canSeeContactData = hasPermission("ver_contacto_empresa") || canViewSensitiveCompanyData();
  const canSeeSensitiveData = canViewSensitiveCompanyData();
  const companyStatusNotice =
    company.estadoEmpresa === "pendiente_revision"
      ? {
          tone: "info",
          text: "Esta empresa aun no esta activa. Aprueba la revision para habilitarla operativamente."
        }
      : company.estadoEmpresa === "activa"
        ? {
            tone: "success",
            text: "Empresa activa. La gestion de impuestos y responsabilidades se realiza desde el modulo Calendario fiscal."
          }
        : null;
  const detailMessageTone =
    /correctamente/i.test(state.saveMessage || "") && !/no se pudo|verifica|error/i.test(state.saveMessage || "")
      ? "success"
      : /no se pudo|verifica|error/i.test(state.saveMessage || "")
        ? "error"
        : "info";

  return `
    <section class="panel-card rut-detail-card">
      <div class="rut-detail-header">
        <div class="rut-detail-title-block">
          <div class="eyebrow">Detalle de empresa</div>
          <h3 class="section-title">${escapeHtml(company.razonSocial)}</h3>
          <p class="rut-detail-summary">${commercialName} - NIT ${nitWithDv}</p>
        </div>
        <div class="${statusClass(company.estadoEmpresa)}">${detailStatus}</div>
      </div>
      ${messageCard(state.saveMessage, detailMessageTone)}
      ${companyStatusNotice ? messageCard(companyStatusNotice.text, companyStatusNotice.tone) : ""}
      <div class="rut-detail-grid">
        <section class="rut-detail-section">
          <div class="rut-detail-section-title">${renderSidebarIcon("building2")}<span>Identificacion</span></div>
          <div class="rut-detail-list">
            <div><strong>Estado actual</strong><span class="${statusClass(company.estadoEmpresa)}">${detailStatus}</span></div>
            <div><strong>NIT + DV</strong><span>${nitWithDv}</span></div>
            <div><strong>Tipo contribuyente</strong><span>${escapeHtml(company.tipoContribuyente || "No registrado")}</span></div>
            <div><strong>Tipo persona</strong><span>${escapeHtml(company.tipoPersona || "No registrado")}</span></div>
            <div><strong>Regimen</strong><span>${escapeHtml(company.regimenTributario || "No registrado")}</span></div>
          </div>
        </section>
        <section class="rut-detail-section">
          <div class="rut-detail-section-title">${renderSidebarIcon("users")}<span>Ubicacion y contacto</span></div>
          <div class="rut-detail-list">
            <div><strong>Ubicacion</strong><span>${location}</span></div>
            <div><strong>Direccion principal</strong><span>${canSeeContactData ? escapeHtml(company.direccionPrincipal || "No registrada") : "Restringido por permisos"}</span></div>
            <div><strong>Correo</strong><span>${canSeeContactData ? email : "Restringido por permisos"}</span></div>
            <div><strong>Telefono</strong><span>${canSeeContactData ? phone : "Restringido por permisos"}</span></div>
          </div>
        </section>
        <section class="rut-detail-section">
          <div class="rut-detail-section-title">${renderSidebarIcon("fileText")}<span>Actividad economica</span></div>
          <div class="rut-detail-list">
            <div><strong>Codigo CIIU</strong><span>${activityCode}</span></div>
            <div><strong>Descripcion</strong><span>${activityDescription}</span></div>
            <div><strong>Representante legal</strong><span>${escapeHtml(company.representanteLegalPrincipal?.nombreCompleto || company.representanteLegal || "No registrado")}</span></div>
            <div><strong>Documento RUT</strong><span>${company.documentoRut ? escapeHtml(company.documentoRut?.nombreArchivo || "Documento disponible") : "Restringido por permisos"}</span></div>
          </div>
        </section>
        ${
          canSeeSensitiveData
            ? `
              <section class="rut-detail-section rut-detail-section-wide">
                <div class="rut-detail-section-title">${renderSidebarIcon("settings")}<span>Datos sensibles</span></div>
                <div class="rut-detail-list">
                  <div><strong>Buzon electronico</strong><span>${escapeHtml(company.buzonElectronico || "No registrado")}</span></div>
                  <div><strong>Direccion seccional</strong><span>${escapeHtml(company.direccionSeccional || "No registrada")}</span></div>
                </div>
              </section>
            `
            : ""
        }
        <section class="rut-detail-section rut-detail-section-wide">
          <div class="rut-detail-section-title">${renderSidebarIcon("check")}<span>Responsabilidades RUT</span></div>
          <div class="rut-detail-badges">
            ${responsibilities || `<span class="user-table-text">No se registraron responsabilidades extraidas.</span>`}
          </div>
        </section>
        <section class="rut-detail-section rut-detail-section-wide">
          <div class="rut-detail-section-title">${renderSidebarIcon("settings")}<span>Controles DIAN sugeridos</span></div>
          <div class="rut-detail-badges">
            ${renderDianComplianceBadges(company)}
          </div>
          <p class="muted" style="margin-top: 10px;">Controles abiertos detectados: ${escapeHtml(String(openDianControls))}</p>
        </section>
      </div>
      <div class="detail-grid detail-grid-legacy">
        <div class="detail-item"><strong>Estado actual</strong><span class="${statusClass(company.estadoEmpresa)}">${escapeHtml(formatStatus(company.estadoEmpresa))}</span></div>
        <div class="detail-item"><strong>NIT + DV</strong><span>${escapeHtml(company.nit)}-${escapeHtml(company.dv || "")}</span></div>
        <div class="detail-item"><strong>Tipo contribuyente</strong><span>${escapeHtml(company.tipoContribuyente || "No registrado")}</span></div>
        <div class="detail-item"><strong>Tipo persona</strong><span>${escapeHtml(company.tipoPersona || "No registrado")}</span></div>
        <div class="detail-item"><strong>Regimen</strong><span>${escapeHtml(company.regimenTributario || "No registrado")}</span></div>
        <div class="detail-item"><strong>Ubicacion</strong><span>${escapeHtml([company.pais, company.departamento, company.municipio].filter(Boolean).join(" / ") || "No registrada")}</span></div>
        <div class="detail-item"><strong>Direccion principal</strong><span>${canSeeContactData ? escapeHtml(company.direccionPrincipal || "No registrada") : "Restringido por permisos"}</span></div>
        <div class="detail-item"><strong>Correo / Telefono</strong><span>${canSeeContactData ? escapeHtml([company.correoElectronico || company.email, company.telefono1].filter(Boolean).join(" / ") || "No registrado") : "Restringido por permisos"}</span></div>
        <div class="detail-item"><strong>Actividad principal</strong><span>${escapeHtml(
          [company.actividadEconomicaPrincipalCodigo || company.actividadEconomicaPrincipal, company.actividadEconomicaPrincipalNombre]
            .filter(Boolean)
            .join(" · ") || "No registrada"
        )}</span></div>
        <div class="detail-item"><strong>Responsabilidades extraidas</strong><span>${escapeHtml((company.responsabilidadesTributarias || []).map((item) => item.codigo).join(", ") || "No registradas")}</span></div>
        <div class="detail-item"><strong>Representante legal</strong><span>${escapeHtml(company.representanteLegalPrincipal?.nombreCompleto || company.representanteLegal || "No registrado")}</span></div>
        <div class="detail-item"><strong>Documento RUT</strong><span>${company.documentoRut ? escapeHtml(company.documentoRut?.nombreArchivo || "Documento disponible") : "Restringido por permisos"}</span></div>
        <div class="detail-item"><strong>Controles DIAN abiertos</strong><span>${escapeHtml(String(openDianControls))}</span></div>
      </div>
      ${
        canApproveCompany
          ? `<div class="button-row">
              <button class="btn btn-primary" type="button" data-action="approve-company" data-company-id="${company.id}">
                Aprobar revision y activar empresa
              </button>
            </div>`
          : ""
      }
      <div class="summary-list-card rut-next-step-card">
        <strong>Siguiente paso:</strong>
        <span>Desde Calendario fiscal podras revisar los impuestos que el sistema detecto, agregar nuevos impuestos y ajustar calendarios por anio sin afectar historicos.</span>
      </div>
    </section>
  `;
}

function fiscalSummarySectionV2() {
  const currentYear = getCurrentFiscalYear();
  const activeTaxes = state.taxes.filter((item) => item.estado === "activo").length;
  const activeCompanies = state.companies.filter((item) => item.estadoEmpresa === "activa").length;
  const detectedObligations = state.companyObligations.filter((item) => !["inactiva", "no_aplica"].includes(item.estado)).length;
  const activeCalendars = state.fiscalCalendars.filter(
    (item) => item.estado === "activo" && Number(item.anio || 0) === currentYear
  ).length;

  return `
    <section class="stats-grid fiscal-stats-grid">
      <article class="stat-card">
        <div class="eyebrow">Impuestos base</div>
        <div class="stat-value">${escapeHtml(String(activeTaxes))}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Empresas activas</div>
        <div class="stat-value">${escapeHtml(String(activeCompanies))}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Obligaciones detectadas</div>
        <div class="stat-value">${escapeHtml(String(detectedObligations))}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Calendarios activos ${escapeHtml(String(currentYear))}</div>
        <div class="stat-value">${escapeHtml(String(activeCalendars))}</div>
      </article>
    </section>
  `;
}

function fiscalTabButtonsV2() {
  const tabs = ensureVisibleFiscalTab();

  if (!tabs.length) {
    return "";
  }

  return `
    <div class="tab-row">
      ${tabs
        .map(
          (tab) => `
            <button
              class="tab-button ${state.fiscalTab === tab.id ? "active" : ""}"
              type="button"
              data-fiscal-tab="${tab.id}"
            >
              ${escapeHtml(tab.label)}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function taxesCatalogCompactSection() {
  return `
    <details class="advanced-panel fiscal-catalog-panel">
      <summary>Catalogo base de impuestos</summary>
      <div class="advanced-content">
        <div class="panel-header no-border">
          <div>
            <h4 class="section-title compact">Impuestos base del sistema</h4>
            <p class="muted">Aqui solo administras los conceptos base. Las fechas del anio se ajustan en el calendario anual.</p>
          </div>
          <button class="btn btn-primary" type="button" data-action="open-tax-modal">Nuevo impuesto</button>
        </div>
        <div class="table-card calendar-table-card">
          <table>
            <thead>
              <tr>
                <th>Impuesto</th>
                <th>Nivel</th>
                <th>Ente</th>
                <th>Periodicidad sugerida</th>
                <th>Estado</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              ${state.taxes
                .map(
                  (tax) => `
                    <tr>
                      <td>
                        <strong>${escapeHtml(tax.nombre)}</strong>
                        <div class="muted table-subtext">${escapeHtml(tax.codigo)}</div>
                      </td>
                      <td>${escapeHtml(formatStatus(tax.nivel || "-"))}</td>
                      <td>${escapeHtml(tax.enteAdministrador || "DIAN")}</td>
                      <td>${escapeHtml(formatStatus(tax.periodicidadDefault || "-"))}</td>
                      <td><span class="${statusClass(tax.estado)}">${escapeHtml(formatStatus(tax.estado))}</span></td>
                      <td>
                        <div class="button-row compact">
                          <button class="btn btn-secondary table-action" type="button" data-action="edit-tax" data-tax-id="${tax.id}">Editar</button>
                          <button
                            class="btn btn-secondary table-action"
                            type="button"
                            data-action="toggle-tax-state"
                            data-tax-id="${tax.id}"
                            data-next-state="${tax.estado === "activo" ? "inactivo" : "activo"}"
                          >
                            ${tax.estado === "activo" ? "Inactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  `;
}

function inferredRulesSection() {
  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Matriz deducida</div>
          <h3 class="section-title">Reglas deducidas de impuestos</h3>
          <p class="muted">Aqui administras las inferencias que convierten el RUT y el perfil fiscal de una empresa en impuestos sugeridos o en revision.</p>
        </div>
        <button class="btn btn-primary" type="button" data-action="open-inferred-rule-modal">Nueva regla</button>
      </div>
      <div class="table-card calendar-table-card">
        <table>
          <thead>
            <tr>
              <th>Regla</th>
              <th>Impuesto</th>
              <th>Criterios</th>
              <th>Estado inicial</th>
              <th>Estado</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            ${state.inferredTaxRules.length
              ? state.inferredTaxRules
                  .map((rule) => {
                    const tax = state.taxes.find((item) => item.id === rule.impuestoId);
                    return `
                      <tr>
                        <td>
                          <strong>${escapeHtml(rule.nombreRegla || "Regla deducida")}</strong>
                          <div class="muted table-subtext">${escapeHtml(rule.descripcion || "Sin descripcion")}</div>
                        </td>
                        <td>${escapeHtml(tax?.nombre || rule.impuestoId || "No encontrado")}</td>
                        <td><div class="muted table-subtext">${escapeHtml(formatInferredRuleCriteria(rule))}</div></td>
                        <td><span class="${statusClass(rule.estadoInicial)}">${escapeHtml(formatStatus(rule.estadoInicial))}</span></td>
                        <td><span class="${statusClass(rule.estado)}">${escapeHtml(formatStatus(rule.estado))}</span></td>
                        <td>
                          <div class="button-row compact">
                            <button class="btn btn-secondary table-action" type="button" data-action="edit-inferred-rule" data-rule-id="${rule.id}">
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  })
                  .join("")
              : '<tr><td colspan="6" class="muted">Todavia no hay reglas deducidas configuradas.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function companyTaxManagementSection() {
  const assignmentCompany = selectedAssignmentCompany();
  const obligations = assignmentCompany
    ? state.companyObligations.filter((item) => item.empresaId === assignmentCompany.id)
    : [];

  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Empresas e impuestos</div>
          <h3 class="section-title">Gestion tributaria por empresa</h3>
        </div>
        <button class="btn btn-primary" type="button" data-action="open-assignment-modal">Asignar impuesto</button>
      </div>
      <p class="muted">
        Primero seleccionas una empresa. Luego puedes ver que responsabilidades detecto el sistema con base en su RUT, confirmar las que aplican y agregar manualmente impuestos municipales o nuevos tributos.
      </p>
      <div class="table-card calendar-table-card">
        <table>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Estado</th>
              <th>NIT</th>
              <th>Municipio</th>
              <th>Responsabilidades RUT</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            ${state.companies
              .map(
                (company) => `
                  <tr class="${state.selectedCompany?.id === company.id ? "user-row-selected" : ""}">
                    <td>${escapeHtml(company.razonSocial)}</td>
                    <td><span class="${statusClass(company.estadoEmpresa)}">${escapeHtml(formatStatus(company.estadoEmpresa))}</span></td>
                    <td>${escapeHtml(`${company.nit || ""}-${company.dv || ""}`)}</td>
                    <td>${escapeHtml(company.municipio || "-")}</td>
                    <td>
                      <div class="user-table-copy">
                        <span>${escapeHtml((company.responsabilidadesTributarias || []).map((item) => item.codigo).join(", ") || "Sin datos")}</span>
                        ${renderCompanyDianSummary(company, { compact: true })}
                      </div>
                    </td>
                    <td><button class="btn btn-secondary table-action ${assignmentCompany?.id === company.id ? "table-action-active" : ""}" type="button" data-manage-company-id="${company.id}">Abrir gestion</button></td>
                  </tr>
                `
              )
              .join("") || '<tr><td colspan="6" class="muted">Todavia no hay empresas creadas.</td></tr>'}
          </tbody>
        </table>
      </div>
      ${
        assignmentCompany
          ? `
            <section class="obligations-section selected-company-panel">
              <div class="panel-header section-top">
                <div>
                  <div class="eyebrow">Empresa seleccionada</div>
                  <h4 class="section-title">${escapeHtml(assignmentCompany.razonSocial)}</h4>
                </div>
                <div class="button-row compact no-margin">
                  <button class="btn btn-secondary" type="button" data-action="analyze-obligations" data-company-id="${assignmentCompany.id}">
                    Analizar segun RUT
                  </button>
                  <button class="btn btn-primary" type="button" data-action="open-assignment-modal">
                    Agregar impuesto manual
                  </button>
                </div>
              </div>
              <p class="muted">
                Aqui ves los impuestos o responsabilidades que le aplican a esta empresa. Puedes confirmar, dejar en revision, marcar no aplica o agregar un impuesto manual si la norma lo exige.
              </p>
              ${
                obligations.length
                  ? `<div class="obligation-list">
                      ${obligations
                        .map(
                          (item) => `
                            <article class="obligation-card">
                              <div class="obligation-top">
                                <div>
                                  <strong>${escapeHtml(obligationLabel(item))}</strong>
                                  <div class="muted">${escapeHtml(
                                    [
                                      item.impuesto?.nombre || "",
                                      item.periodicidadAplicable || item.periodicidad || "",
                                      item.municipioAplicacion || ""
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")
                                  )}</div>
                                </div>
                                <span class="${statusClass(item.estado)}">${escapeHtml(formatStatus(item.estado))}</span>
                              </div>
                              <div class="obligation-meta">
                                <div><strong>Nivel:</strong> ${escapeHtml(item.nivel || "-")}</div>
                                <div><strong>Fuente:</strong> ${escapeHtml(item.fuenteDeteccion || "-")}</div>
                                <div><strong>Motivo:</strong> ${escapeHtml(item.motivoAplicacion || "-")}</div>
                                <div><strong>Responsabilidad RUT:</strong> ${escapeHtml(
                                  [item.codigoResponsabilidadRut, item.responsabilidadRutOrigen].filter(Boolean).join(" · ") || "-"
                                )}</div>
                              </div>
                              <div class="button-row compact">
                                <button class="btn btn-secondary" type="button" data-action="confirm-obligation" data-obligation-id="${item.id}" ${
                                  assignmentCompany.estadoEmpresa !== "activa" ? "disabled" : ""
                                }>
                                  Confirmar
                                </button>
                                <button class="btn btn-secondary" type="button" data-action="not-applicable-obligation" data-obligation-id="${item.id}">
                                  Marcar no aplica
                                </button>
                                <button class="btn btn-secondary" type="button" data-action="review-obligation" data-obligation-id="${item.id}">
                                  Dejar en revision
                                </button>
                              </div>
                            </article>
                          `
                        )
                        .join("")}
                    </div>`
                  : `<p class="muted">Esta empresa aun no tiene impuestos gestionados. Puedes analizar segun RUT o asignar uno manualmente.</p>`
              }
            </section>
          `
          : `<div class="summary-list-card" style="margin-top: 18px;"><strong>Selecciona una empresa</strong><span>Haz clic en gestionar para revisar sus responsabilidades, confirmar impuestos o agregar nuevos.</span></div>`
      }
    </section>
  `;
}

function renderManagedObligationSummaryCards(items) {
  if (!items.length) {
    return `<p class="muted">Todavia no hay impuestos gestionados para esta empresa.</p>`;
  }

  return `
    <div class="managed-summary-grid">
      ${items
        .map(
          (item) => `
            <article class="managed-summary-card managed-summary-card-clickable">
              <div class="managed-summary-top">
                <strong>${escapeHtml(obligationLabel(item))}</strong>
                <span class="${statusClass(item.estado)}">${escapeHtml(formatStatus(item.estado))}</span>
              </div>
              <div class="muted">${escapeHtml(
                [item.periodicidadAplicable || item.periodicidad || "", item.municipioAplicacion || item.departamentoAplicacion || ""]
                  .filter(Boolean)
                  .join(" · ") || "Configurado"
              )}</div>
              <div class="button-row compact no-margin">
                <button class="btn btn-secondary" type="button" data-action="edit-obligation" data-obligation-id="${item.id}">
                  Abrir y modificar
                </button>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function companyTaxManagementSectionV2() {
  const assignmentCompany = selectedAssignmentCompany();
  const selectedBuckets = assignmentCompany ? getCompanyObligationBuckets(assignmentCompany.id) : null;
  const pendingItems = selectedBuckets?.pending || [];
  const managedItems = selectedBuckets ? [...selectedBuckets.active, ...selectedBuckets.inReview] : [];
  const detailMessageTone =
    /correctamente|no aplica|revision/i.test(state.saveMessage || "") && !/no se pudo|verifica|error/i.test(state.saveMessage || "")
      ? "success"
      : /no se pudo|verifica|error/i.test(state.saveMessage || "")
        ? "error"
        : "info";

  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Empresas</div>
          <h3 class="section-title">Gestion tributaria por empresa</h3>
        </div>
      </div>
      <p class="muted">
        Selecciona una empresa para revisar los impuestos detectados por el sistema, ajustar los que aplican y dejar listo el calendario del anio vigente.
      </p>
      <div class="table-card calendar-table-card">
        <table>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Estado</th>
              <th>NIT</th>
              <th>Municipio</th>
              <th>Responsabilidades RUT</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            ${state.companies
              .map(
                (company) => `
                  <tr>
                    <td>${escapeHtml(company.razonSocial)}</td>
                    <td><span class="${statusClass(company.estadoEmpresa)}">${escapeHtml(formatStatus(company.estadoEmpresa))}</span></td>
                    <td>${escapeHtml(`${company.nit || ""}-${company.dv || ""}`)}</td>
                    <td>${escapeHtml(company.municipio || "-")}</td>
                    <td>${escapeHtml((company.responsabilidadesTributarias || []).map((item) => item.codigo).join(", ") || "Sin datos")}</td>
                    <td><button class="btn btn-secondary table-action" type="button" data-manage-company-id="${company.id}">Abrir gestion</button></td>
                  </tr>
                `
              )
              .join("") || '<tr><td colspan="6" class="muted">Todavia no hay empresas creadas.</td></tr>'}
          </tbody>
        </table>
      </div>
      ${
        assignmentCompany
          ? `
            <section class="obligations-section selected-company-panel">
              <div class="panel-header section-top">
                <div>
                  <div class="eyebrow">Empresa seleccionada</div>
                  <h4 class="section-title">${escapeHtml(assignmentCompany.razonSocial)}</h4>
                </div>
                <div class="button-row compact no-margin">
                  <button class="btn btn-secondary" type="button" data-action="back-to-companies">Volver</button>
                  <button class="btn btn-secondary" type="button" data-action="analyze-obligations" data-company-id="${assignmentCompany.id}">
                    Analizar segun RUT
                  </button>
                  <button class="btn btn-primary" type="button" data-action="open-assignment-modal">
                    Agregar impuesto manual
                  </button>
                </div>
              </div>
              ${messageCard(state.saveMessage, detailMessageTone)}
              ${
                pendingItems.length
                  ? `
                    <p class="muted">
                      Revisa los impuestos pendientes y, cuando ya esten aceptados o en revision, podras seguir abriendolos desde el resumen para ajustarlos.
                    </p>
                    <div class="obligation-list pending-obligation-list">
                      ${pendingItems
                        .map(
                          (item) => `
                            <article class="obligation-card obligation-card-focus">
                              <div class="obligation-top">
                                <div>
                                  <strong>${escapeHtml(obligationLabel(item))}</strong>
                                  <div class="muted">${escapeHtml(
                                    [item.impuesto?.nombre || "", item.periodicidadAplicable || item.periodicidad || "", item.municipioAplicacion || ""]
                                      .filter(Boolean)
                                      .join(" · ")
                                  )}</div>
                                </div>
                                <span class="${statusClass(item.estado)}">${escapeHtml(formatStatus(item.estado))}</span>
                              </div>
                              <div class="obligation-meta">
                                <div><strong>Nivel:</strong> ${escapeHtml(item.nivel || "-")}</div>
                                <div><strong>Motivo:</strong> ${escapeHtml(item.motivoAplicacion || "-")}</div>
                                <div><strong>Responsabilidad RUT:</strong> ${escapeHtml(
                                  [item.codigoResponsabilidadRut, item.responsabilidadRutOrigen].filter(Boolean).join(" · ") || "-"
                                )}</div>
                              </div>
                              <div class="button-row compact">
                                <button class="btn btn-secondary" type="button" data-action="edit-obligation" data-obligation-id="${item.id}">
                                  Modificar
                                </button>
                                <button class="btn btn-secondary" type="button" data-action="confirm-obligation" data-obligation-id="${item.id}" ${
                                  assignmentCompany.estadoEmpresa !== "activa" ? "disabled" : ""
                                }>
                                  Confirmar
                                </button>
                                <button class="btn btn-secondary" type="button" data-action="not-applicable-obligation" data-obligation-id="${item.id}">
                                  Marcar no aplica
                                </button>
                                <button class="btn btn-secondary" type="button" data-action="review-obligation" data-obligation-id="${item.id}">
                                  Dejar en revision
                                </button>
                              </div>
                            </article>
                          `
                        )
                        .join("")}
                    </div>
                  `
                  : `
                    <div class="summary-list-card managed-summary-header">
                      <strong>Gestion terminada</strong>
                      <span>Ya no hay impuestos pendientes por revisar en esta empresa. Aqui solo ves el resumen de impuestos activos y en revision.</span>
                    </div>
                  `
              }
              <section class="managed-summary-section">
                <div class="section-heading">
                  <h4>Resumen de impuestos gestionados</h4>
                  <span class="managed-count">${escapeHtml(String(managedItems.length))} activos o en revision</span>
                </div>
                ${renderManagedObligationSummaryCards(managedItems)}
              </section>
            </section>
          `
          : `<div class="summary-list-card" style="margin-top: 18px;"><strong>Selecciona una empresa</strong><span>Haz clic en Abrir gestion para revisar sus impuestos y responsabilidades.</span></div>`
      }
    </section>
  `;
}

function obligationsManagementSection() {
  const selectedCompanyId = state.fiscalFilters.assignmentCompanyId || "";
  const visibleObligations = state.companyObligations
    .filter((item) => !selectedCompanyId || item.empresaId === selectedCompanyId)
    .sort((a, b) => {
      const companyCompare = companyNameById(a.empresaId).localeCompare(companyNameById(b.empresaId), "es");
      if (companyCompare !== 0) {
        return companyCompare;
      }

      return obligationLabel(a).localeCompare(obligationLabel(b), "es");
    });
  const counts = {
    suggested: visibleObligations.filter((item) => item.estado === "sugerida").length,
    inReview: visibleObligations.filter((item) => item.estado === "pendiente_revision").length,
    active: visibleObligations.filter((item) => item.estado === "activa").length,
    notApplicable: visibleObligations.filter((item) => item.estado === "no_aplica").length
  };

  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Obligaciones</div>
          <h3 class="section-title">Obligaciones fiscales detectadas</h3>
        </div>
        <button class="btn btn-primary" type="button" data-action="open-assignment-modal">Agregar obligacion manual</button>
      </div>
      <p class="muted">
        Consulta obligaciones sugeridas, activas, en revision o descartadas. Desde aqui puedes ajustarlas sin repetir navegacion global.
      </p>
      <div class="stats-grid fiscal-stats-grid">
        <article class="stat-card">
          <div class="eyebrow">Sugeridas</div>
          <div class="stat-value">${escapeHtml(String(counts.suggested))}</div>
        </article>
        <article class="stat-card">
          <div class="eyebrow">En revision</div>
          <div class="stat-value">${escapeHtml(String(counts.inReview))}</div>
        </article>
        <article class="stat-card">
          <div class="eyebrow">Activas</div>
          <div class="stat-value">${escapeHtml(String(counts.active))}</div>
        </article>
        <article class="stat-card">
          <div class="eyebrow">No aplica</div>
          <div class="stat-value">${escapeHtml(String(counts.notApplicable))}</div>
        </article>
      </div>
      ${renderAppFilterCard({
        title: "Filtros de obligaciones",
        description: "Selecciona una empresa para concentrarte en sus obligaciones detectadas, activas o pendientes de revision.",
        fields: `
          <label class="app-filter-field app-filter-field-tax">
            <span class="app-filter-label">Empresa</span>
            <select class="app-filter-select" data-filter="assignmentCompanyId">
              <option value="">Todas las empresas</option>
              ${state.companies
                .map(
                  (company) =>
                    `<option value="${company.id}" ${company.id === selectedCompanyId ? "selected" : ""}>${escapeHtml(company.razonSocial)}</option>`
                )
                .join("")}
            </select>
          </label>
        `,
        gridClass: "app-filter-grid app-filter-grid-single"
      })}
      <div class="table-card calendar-table-card">
        <table>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Obligacion</th>
              <th>Estado</th>
              <th>Fuente</th>
              <th>Periodicidad</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            ${
              visibleObligations.length
                ? visibleObligations
                    .map(
                      (item) => `
                        <tr>
                          <td>${escapeHtml(companyNameById(item.empresaId))}</td>
                          <td>
                            <strong>${escapeHtml(obligationLabel(item))}</strong>
                            <div class="muted table-subtext">${escapeHtml([item.nivel, item.municipioAplicacion].filter(Boolean).join(" · ") || "Sin contexto adicional")}</div>
                          </td>
                          <td><span class="${statusClass(item.estado)}">${escapeHtml(formatStatus(item.estado))}</span></td>
                          <td>${escapeHtml(item.fuenteDeteccion || item.motivoAplicacion || "-")}</td>
                          <td>${escapeHtml(formatStatus(item.periodicidadAplicable || item.periodicidad || "-"))}</td>
                          <td>
                            <div class="button-row compact">
                              <button class="btn btn-secondary table-action" type="button" data-action="edit-obligation" data-obligation-id="${item.id}">
                                Modificar
                              </button>
                              <button class="btn btn-secondary table-action" type="button" data-action="confirm-obligation" data-obligation-id="${item.id}">
                                Confirmar
                              </button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")
                : '<tr><td colspan="6" class="muted">No hay obligaciones visibles para los filtros seleccionados.</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function fiscalConfigurationSection() {
  if (!hasAnyPermission(["gestionar_impuestos", "editar_configuracion", "configurar_parametros_sistema"])) {
    return "";
  }

  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Configuracion fiscal</div>
          <h3 class="section-title">Motor y catalogos internos</h3>
          <p class="muted">Las reglas deducidas y el catalogo base quedan como configuracion tecnica, fuera del flujo operativo diario.</p>
        </div>
      </div>
    </section>
    ${taxesSection()}
    ${inferredRulesSection()}
  `;
}

function fiscalCalendarViewV2() {
  const currentSection = getFiscalSectionConfig();
  if (!currentSection) {
    return accessDeniedSection();
  }

  let activeSection = obligationsManagementSection();

  if (currentSection.id === "companies") {
    activeSection = companyTaxManagementSectionV2();
  } else if (currentSection.id === "calendars") {
    activeSection = fiscalCalendarsSectionGuided();
  } else if (currentSection.id === "operational") {
    activeSection = operationalCalendarSection();
  } else if (currentSection.id === "alerts") {
    activeSection = alertsSection();
  }

  return `
    ${fiscalSummarySectionV2()}
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Modulo fiscal</div>
          <h3 class="section-title">${escapeHtml(currentSection.title)}</h3>
          <p class="muted">${escapeHtml(currentSection.description)}</p>
        </div>
      </div>
    </section>
    ${messageCard(
      state.calendarMessage,
      /correctamente|creadas|completada/i.test(state.calendarMessage || "") &&
        !/no se pudo|error|verifica/i.test(state.calendarMessage || "")
        ? "success"
        : /no se pudo|error|verifica/i.test(state.calendarMessage || "")
          ? "error"
          : "info"
    )}
    ${activeSection}
    ${renderFiscalModal()}
  `;
}

function renderFiscalTaskRows(tasks) {
  if (!tasks.length) {
    return `<p class="muted">Todavia no hay tareas fiscales generadas para esta empresa.</p>`;
  }

  return `
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Titulo</th>
            <th>Impuesto</th>
            <th>Periodo</th>
            <th>Vencimiento</th>
            <th>Limite interna</th>
            <th>Estado</th>
            <th>Origen</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>
          ${tasks
            .map(
              (task) => `
                <tr>
                  <td>${escapeHtml(task.titulo || "Tarea fiscal")}</td>
                  <td>${escapeHtml(task.impuesto?.nombre || task.impuestoNombre || "-")}</td>
                  <td>${escapeHtml([task.anio, task.periodo].filter(Boolean).join(" · "))}</td>
                  <td>${escapeHtml(formatDateLabel(task.fechaVencimiento))}</td>
                  <td>${escapeHtml(formatDateLabel(task.fechaLimiteInterna))}</td>
                  <td><span class="${statusClass(task.estadoGeneral)}">${escapeHtml(formatStatus(task.estadoGeneral))}</span></td>
                  <td>${escapeHtml(task.origen || "-")}</td>
                  <td>${escapeHtml(String(task.versionCalendario || 1))}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function getObligationIdOrMessage(button) {
  const obligationId = String(button.getAttribute("data-obligation-id") || "").trim();

  if (!obligationId) {
    return {
      obligationId: null,
      errorMessage: "No se pudo ejecutar la accion porque la obligacion no tiene ID."
    };
  }

  return {
    obligationId,
    errorMessage: null
  };
}

function defaultRepresentative() {
  return {
    tipoRepresentacion: "",
    fechaInicioRepresentacion: "",
    tipoDocumento: "",
    numeroIdentificacion: "",
    dv: "",
    primerApellido: "",
    segundoApellido: "",
    primerNombre: "",
    otrosNombres: "",
    nombreCompleto: ""
  };
}

function reviewFormValues() {
  const extractionData =
    state.currentExtraction?.datosConfirmadosPorUsuario ||
    state.currentExtraction?.datosExtraidosOriginales ||
    state.currentExtraction?.datosExtraidos ||
    {};

  return {
    numeroFormulario: extractionData.numeroFormulario || "",
    concepto: extractionData.concepto || "",
    nit: extractionData.nit || "",
    dv: extractionData.dv || "",
    direccionSeccional: extractionData.direccionSeccional || "",
    buzonElectronico: extractionData.buzonElectronico || "",
    tipoContribuyente: extractionData.tipoContribuyente || "",
    tipoPersona: extractionData.tipoPersona || "",
    tipoDocumento: extractionData.tipoDocumento || "",
    numeroIdentificacion: extractionData.numeroIdentificacion || "",
    razonSocial: extractionData.razonSocial || "",
    nombreComercial: extractionData.nombreComercial || "",
    sigla: extractionData.sigla || "",
    pais: extractionData.pais || "",
    departamento: extractionData.departamento || "",
    municipio: extractionData.municipio || "",
    direccionPrincipal: extractionData.direccionPrincipal || "",
    correoElectronico: extractionData.correoElectronico || extractionData.email || "",
    codigoPostal: extractionData.codigoPostal || "",
    telefono1: extractionData.telefono1 || "",
    telefono2: extractionData.telefono2 || "",
    actividadEconomicaPrincipal: extractionData.actividadEconomicaPrincipal || "",
    actividadEconomicaPrincipalCodigo:
      extractionData.actividadEconomicaPrincipalCodigo || extractionData.actividadEconomicaPrincipal || "",
    actividadEconomicaPrincipalNombre: extractionData.actividadEconomicaPrincipalNombre || "",
    actividadEconomicaPrincipalFuente: extractionData.actividadEconomicaPrincipalFuente || "",
    fechaInicioActividadPrincipal: extractionData.fechaInicioActividadPrincipal || "",
    numeroEstablecimientos: extractionData.numeroEstablecimientos || "",
    responsabilidadesTributarias: Array.isArray(extractionData.responsabilidadesTributarias)
      ? extractionData.responsabilidadesTributarias
      : [],
    responsableIva: Boolean(extractionData.responsableIva),
    obligadoLlevarContabilidad: Boolean(extractionData.obligadoLlevarContabilidad),
    obligadoFacturar: Boolean(extractionData.obligadoFacturar),
    informanteExogena: Boolean(extractionData.informanteExogena),
    agenteRetencionFuente: Boolean(extractionData.agenteRetencionFuente),
    informanteBeneficiariosFinales: Boolean(extractionData.informanteBeneficiariosFinales),
    regimenTributario: extractionData.regimenTributario || "",
    regimenTributarioFuente: extractionData.regimenTributarioFuente || "",
    representanteLegalPrincipal: {
      ...defaultRepresentative(),
      ...(extractionData.representanteLegalPrincipal || {})
    },
    fechaGeneracionRut: extractionData.fechaGeneracionRut || "",
    paginasDetectadas: extractionData.paginasDetectadas || 0,
    textoExtraidoPreview:
      extractionData.textoExtraidoPreview ||
      state.currentExtraction?.metadataExtraccion?.textoExtraidoPreview ||
      "",
    estadoEmpresa: "pendiente_revision"
  };
}

function messageCard(message, tone = "info") {
  if (!message) {
    return "";
  }

  return `<div class="message-card ${tone}">${escapeHtml(message)}</div>`;
}

function extractionMeta(path) {
  return state.currentExtraction?.metadataExtraccion?.fieldMetadata?.[path] || {};
}

function renderMetaBadges(path) {
  const meta = extractionMeta(path);
  const badges = [];

  if (meta.fuente === "deducido_sistema") {
    badges.push('<span class="field-badge derived">Deducido por sistema</span>');
  }

  if (meta.requiereRevision) {
    badges.push('<span class="field-badge review">Requiere revision</span>');
  }

  if (meta.confianza === "baja") {
    badges.push('<span class="field-badge low">Baja confianza</span>');
  }

  return badges.length ? `<div class="field-badges">${badges.join("")}</div>` : "";
}

function computeReviewSummary(values) {
  const criticalDetected = REQUIRED_FIELDS.filter((field) => {
    const value = getValue(values, field);
    return typeof value === "boolean" ? true : String(value || "").trim().length > 0;
  }).length;

  const metadataFields = state.currentExtraction?.metadataExtraccion?.fieldMetadata || {};
  const requiresReview = Object.values(metadataFields).filter((meta) => meta?.requiereRevision).length;

  return {
    criticalDetected,
    requiresReview,
    isValid: criticalDetected === REQUIRED_FIELDS.length && Boolean(state.currentExtraction?.documento?.id)
  };
}

function renderInputField(field, values) {
  const value = getValue(values, field.name);
  const requiredAttribute = field.required ? "required" : "";
  const classes = field.full ? "full" : "";
  const badges = renderMetaBadges(field.name);

  if (field.type === "select") {
    return `
      <label class="${classes}">
        <span>${escapeHtml(field.label)}</span>
        ${badges}
        <select name="${field.name}" ${requiredAttribute}>
          ${COMPANY_STATUS_OPTIONS.map(
            (option) =>
              `<option value="${option.value}" ${option.value === value ? "selected" : ""}>${escapeHtml(option.label)}</option>`
          ).join("")}
        </select>
      </label>
    `;
  }

  return `
    <label class="${classes}">
      <span>${escapeHtml(field.label)}</span>
      ${badges}
      <input name="${field.name}" type="${field.type || "text"}" value="${escapeHtml(value ?? "")}" ${requiredAttribute} />
    </label>
  `;
}

function renderMainSection(section, values) {
  const pendingCatalogNote =
    section.title === "Actividad economica" && values.actividadEconomicaPrincipalFuente === "pendiente_catalogo"
      ? `<p class="section-note">No se encontro descripcion para este codigo CIIU. Puedes continuar y actualizar el catalogo luego.</p>`
      : "";

  return `
    <section class="review-section">
      <div class="section-heading">
        <h4>${escapeHtml(section.title)}</h4>
      </div>
      ${pendingCatalogNote}
      <div class="form-grid compact">
        ${section.fields.map((field) => renderInputField(field, values)).join("")}
      </div>
    </section>
  `;
}

function renderResponsibilityRows(responsibilities) {
  if (!responsibilities.length) {
    return `<div class="muted">No se detectaron responsabilidades con seguridad.</div>`;
  }

  return responsibilities
    .map(
      (item) => `
        <div class="responsibility-row">
          <strong>${escapeHtml(item.codigo || "--")}</strong>
          <span>${escapeHtml(item.nombre || "")}</span>
        </div>
      `
    )
    .join("");
}

function renderDianComplianceBadges(company) {
  const flags = company?.cumplimientoDian || {};
  const items = [
    { active: flags.requiereActualizacionRut, label: "Actualizar RUT" },
    { active: flags.requiereFacturacionElectronica, label: "Facturacion electronica" },
    { active: flags.requiereInformacionExogena, label: "Informacion exogena" },
    { active: flags.requiereDocumentoSoporteNoObligados, label: "Documento soporte" },
    { active: flags.requiereNominaElectronica, label: "Nomina electronica" },
    { active: flags.requiereFirmaElectronica, label: "Firma electronica" }
  ].filter((item) => item.active);

  if (!items.length) {
    return `<span class="user-table-text">No se detectaron controles DIAN sugeridos con la informacion actual.</span>`;
  }

  return items
    .map((item) => `<span class="user-table-pill rut-responsibility-pill">${escapeHtml(item.label)}</span>`)
    .join("");
}

function countOpenDianControls(company) {
  const tasks = Array.isArray(company?.tareasCumplimientoDian) ? company.tareasCumplimientoDian : [];
  return tasks.filter((task) => !["presentada", "completada", "cancelada", "no_aplica"].includes(String(task?.estadoOperativo || task?.estadoGeneral || ""))).length;
}

function renderCompanyDianSummary(company, options = {}) {
  const { compact = false } = options;
  const flags = company?.cumplimientoDian || {};
  const activeFlags = [
    flags.requiereActualizacionRut ? "RUT" : "",
    flags.requiereFacturacionElectronica ? "Facturacion" : "",
    flags.requiereInformacionExogena ? "Exogena" : "",
    flags.requiereDocumentoSoporteNoObligados ? "Doc. soporte" : "",
    flags.requiereNominaElectronica ? "Nomina" : "",
    flags.requiereFirmaElectronica ? "Firma" : ""
  ].filter(Boolean);
  const openControls = countOpenDianControls(company);

  if (!activeFlags.length && openControls === 0) {
    return compact
      ? `<span class="muted">Sin controles sugeridos</span>`
      : `<div class="muted table-subtext">Sin controles DIAN sugeridos con la informacion actual.</div>`;
  }

  const visibleFlags = compact ? activeFlags.slice(0, 3) : activeFlags.slice(0, 4);
  const hiddenCount = activeFlags.length - visibleFlags.length;

  return `
    <div class="rut-detail-badges">
      ${visibleFlags.map((label) => `<span class="user-table-pill rut-responsibility-pill">${escapeHtml(label)}</span>`).join("")}
      ${hiddenCount > 0 ? `<span class="user-table-pill rut-responsibility-pill">+${escapeHtml(String(hiddenCount))}</span>` : ""}
    </div>
    <div class="muted table-subtext">${escapeHtml(String(openControls))} controles abiertos</div>
  `;
}

function renderFlag(flag, values) {
  const checked = Boolean(values[flag.name]);
  return `
    <label class="checkbox-pill">
      <input name="${flag.name}" type="checkbox" ${checked ? "checked" : ""} />
      <span>${escapeHtml(flag.label)}</span>
      ${renderMetaBadges(flag.name)}
    </label>
  `;
}

function renderAdvancedSection(values) {
  const metadataJson = JSON.stringify(state.currentExtraction?.metadataExtraccion || {}, null, 2);
  return `
    <details class="advanced-panel" ${state.advancedOpen ? "open" : ""}>
      <summary id="advanced-toggle">Datos avanzados</summary>
      <div class="advanced-content">
        <div class="form-grid compact">
          ${ADVANCED_FIELDS.map((field) => renderInputField(field, values)).join("")}
        </div>
        <div class="advanced-block">
          <strong>Metadata tecnica de extraccion</strong>
          <pre>${escapeHtml(metadataJson)}</pre>
        </div>
      </div>
    </details>
  `;
}

function renderDocumentCard(values, summary) {
  const extraction = state.currentExtraction;
  return `
    <section class="review-section document-card">
      <div class="section-heading">
        <h4>Documento RUT</h4>
      </div>
      <div class="document-grid">
        <div><strong>Archivo</strong><span>${escapeHtml(extraction.documento?.nombreArchivo || "Sin archivo")}</span></div>
        <div><strong>Estado de extraccion</strong><span class="${statusClass(extraction.estadoExtraccion)}">${escapeHtml(
          formatStatus(extraction.estadoExtraccion)
        )}</span></div>
        <div><strong>Fecha generacion RUT</strong><span>${escapeHtml(values.fechaGeneracionRut || "No detectada")}</span></div>
        <div><strong>Paginas detectadas</strong><span>${escapeHtml(String(values.paginasDetectadas || 0))}</span></div>
      </div>
      ${
        extraction.mensajeExtraccion
          ? `<p class="message-inline">${escapeHtml(extraction.mensajeExtraccion)}</p>`
          : ""
      }
      <div class="button-row compact">
        <button class="btn btn-secondary" type="button" id="toggle-text-modal">Ver texto extraido</button>
      </div>
      <input type="hidden" name="fechaGeneracionRut" value="${escapeHtml(values.fechaGeneracionRut || "")}" />
      <input type="hidden" name="paginasDetectadas" value="${escapeHtml(String(values.paginasDetectadas || 0))}" />
      <textarea class="hidden-field" name="textoExtraidoPreview">${escapeHtml(values.textoExtraidoPreview || "")}</textarea>
      ${
        !summary.isValid
          ? `<p class="validation-note">Completa los campos obligatorios y verifica que el documento RUT este asociado antes de crear la empresa.</p>`
          : ""
      }
    </section>
  `;
}

function renderTextModal() {
  if (!state.showTextModal || !state.currentExtraction) {
    return "";
  }

  const text = String(state.currentExtraction.textoExtraido || "").trim() || NO_TEXT_MESSAGE;
  return `
    <div class="modal-backdrop" id="text-modal-close">
      <div class="modal-card" role="dialog" aria-modal="true">
        <div class="panel-header modal-header">
          <div>
            <div class="eyebrow">Documento RUT</div>
            <h3 class="section-title">Texto extraido</h3>
          </div>
          <button class="btn btn-secondary" type="button" id="close-text-modal">Cerrar</button>
        </div>
        <pre class="modal-pre">${escapeHtml(text)}</pre>
      </div>
    </div>
  `;
}

function reviewForm() {
  if (!state.currentExtraction) {
    return `
      <section class="panel-card">
        <div class="eyebrow">Revision humana</div>
        <h3 class="section-title">Carga un PDF RUT para iniciar</h3>
        <p class="muted">
          La empresa no se crea automaticamente. Primero se valida el archivo, se almacena el documento,
          se intenta extraer texto y luego un usuario confirma la informacion.
        </p>
      </section>
    `;
  }

  const values = reviewFormValues();
  const summary = computeReviewSummary(values);
  const matchedCompany = findRutMatchedCompany(values);
  const selectedTargetCompany =
    state.companies.find((company) => company.id === state.rutTargetCompanyId) || matchedCompany || null;
  const isUpdateFlow = state.rutFlowMode === "update";

  return `
    <section class="panel-card" id="review-section">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Revision humana</div>
          <h3 class="section-title">${isUpdateFlow ? "Confirma los datos antes de actualizar la empresa" : "Confirma los datos antes de crear la empresa"}</h3>
        </div>
        <div class="${statusClass(state.currentExtraction.estadoExtraccion)}">${escapeHtml(
          formatStatus(state.currentExtraction.estadoExtraccion)
        )}</div>
      </div>
      ${messageCard(state.saveMessage, /Empresa creada|Empresa actualizada/i.test(state.saveMessage || "") ? "success" : "error")}
      <div class="review-summary-card">
        <strong>Extraccion ${escapeHtml(formatStatus(state.currentExtraction.estadoExtraccion))}:</strong>
        <span>${escapeHtml(String(summary.criticalDetected))} campos criticos detectados, ${escapeHtml(String(summary.requiresReview))} requieren revision.</span>
      </div>
      ${
        isUpdateFlow
          ? `
            <div class="review-summary-card">
              <strong>Destino de actualizacion:</strong>
              <span>${
                selectedTargetCompany
                  ? escapeHtml(`${selectedTargetCompany.razonSocial} · NIT ${selectedTargetCompany.nit || ""}${selectedTargetCompany.dv ? `-${selectedTargetCompany.dv}` : ""}`)
                  : "Se intentara ubicar la empresa por NIT y DV del RUT."
              }</span>
            </div>
          `
          : ""
      }
      <div class="review-layout">
        <form id="review-form" class="form-card simplified-form">
          ${MAIN_SECTIONS.map((section) => renderMainSection(section, values)).join("")}
          <input type="hidden" name="actividadEconomicaPrincipal" value="${escapeHtml(values.actividadEconomicaPrincipalCodigo || values.actividadEconomicaPrincipal || "")}" />
          <input type="hidden" name="actividadEconomicaPrincipalFuente" value="${escapeHtml(values.actividadEconomicaPrincipalFuente || "")}" />

          <section class="review-section">
            <div class="section-heading">
              <h4>Responsabilidades tributarias</h4>
            </div>
            <div class="responsibility-list simple-list">
              ${renderResponsibilityRows(values.responsabilidadesTributarias)}
            </div>
            <div class="flags-grid">
              ${RESPONSIBILITY_FLAGS.map((flag) => renderFlag(flag, values)).join("")}
            </div>
            <textarea class="hidden-field" name="responsabilidadesTributarias">${escapeHtml(
              values.responsabilidadesTributarias.map((item) => `${item.codigo || ""} - ${item.nombre || ""}`.trim()).join("\n")
            )}</textarea>
          </section>

          ${renderDocumentCard(values, summary)}
          ${renderAdvancedSection(values)}

          <div class="button-row" id="confirm-section">
            <button class="btn btn-primary" type="submit" ${summary.isValid ? "" : "disabled"}>${isUpdateFlow ? "Confirmar y actualizar empresa" : "Confirmar y crear empresa"}</button>
          </div>
        </form>

        <aside class="form-card helper-card">
          <div class="eyebrow">Resumen</div>
          <h3 class="section-title">Revision guiada</h3>
          <p class="muted">
            Verifica primero NIT, DV, razon social y tipo de contribuyente. Luego confirma ubicacion,
            actividad economica y responsabilidades antes de crear la empresa.
          </p>
          <div class="helper-list">
            <div class="helper-item">Datos obligatorios claros y al frente</div>
            <div class="helper-item">Campos dudosos marcados para revision</div>
            <div class="helper-item">Texto del PDF oculto hasta que lo necesites</div>
            <div class="helper-item">La vigencia del RUT es indefinida; no requiere renovacion periodica</div>
            <div class="helper-item">La DIAN distingue entre inscripcion y actualizacion con verificacion</div>
          </div>
        </aside>
      </div>
      ${renderTextModal()}
    </section>
  `;
}

function uploadSection() {
  const targetOptions = state.companies
    .map(
      (company) =>
        `<option value="${company.id}" ${company.id === state.rutTargetCompanyId ? "selected" : ""}>${escapeHtml(
          `${company.razonSocial} · NIT ${company.nit || ""}${company.dv ? `-${company.dv}` : ""}`
        )}</option>`
    )
    .join("");

  return `
    <section class="panel-card rut-upload-card" id="upload-section">
      <div class="rut-upload-head">
        <div class="rut-upload-icon">${renderSidebarIcon("uploadCloud")}</div>
        <div>
          <h2 class="hero-title small">Carga documental RUT</h2>
        </div>
      </div>
      ${messageCard(state.uploadMessage, state.uploadMessage?.startsWith("PDF cargado") ? "success" : "error")}
      <div class="tab-row" style="margin-bottom: 18px;">
        <button class="tab-button ${state.rutFlowMode === "create" ? "active" : ""}" type="button" data-rut-flow-mode="create">
          Crear desde RUT
        </button>
        <button class="tab-button ${state.rutFlowMode === "update" ? "active" : ""}" type="button" data-rut-flow-mode="update">
          Actualizar RUT existente
        </button>
      </div>
      ${
        state.rutFlowMode === "update"
          ? `
            ${renderAppFilterCard({
              title: "Actualizacion dirigida",
              description: "Si ya conoces la empresa, puedes vincular manualmente el RUT antes de cargar el archivo.",
              fields: `
                <label class="app-filter-field app-filter-field-tax">
                  <span class="app-filter-label">Empresa a actualizar</span>
                  <select class="app-filter-select" id="rut-target-company">
                    <option value="">Detectar por NIT y DV del RUT</option>
                    ${targetOptions}
                  </select>
                </label>
              `,
              gridClass: "app-filter-grid app-filter-grid-single"
            })}
          `
          : ""
      }
      <form id="upload-form" class="upload-row rut-upload-form">
        <input id="rutPdf" name="rutPdf" type="file" accept="application/pdf,.pdf" required />
        <button class="btn btn-primary" type="submit">
          <span class="users-submit-icon">${renderSidebarIcon("uploadCloud")}</span>
          <span>Cargar PDF RUT</span>
        </button>
      </form>
      <div class="review-summary-card" style="margin-top: 18px;">
        <strong>Tenga en cuenta:</strong>
        <span>La inscripcion y la actualizacion pueden hacerse de forma virtual o asistida. Las actualizaciones con verificacion suelen requerir un tratamiento distinto al de la creacion inicial.</span>
      </div>
    </section>
  `;
}

function companiesSection() {
  return `
    <section class="panel-card rut-list-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Empresas</div>
          <h3 class="section-title">Listado de empresas creadas</h3>
          <p class="panel-subtitle">Consulta empresas creadas desde RUT y abre su ficha documental.</p>
        </div>
      </div>
      <div class="table-card users-table-card">
        <table class="users-table rut-documents-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>NIT</th>
              <th>Estado</th>
              <th>Documento RUT</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            ${state.companies
              .map(
                (company) => `
                  <tr class="${state.selectedCompany?.id === company.id ? "user-row-selected" : ""}">
                    <td>
                      <div class="user-table-copy">
                        <strong>${escapeHtml(company.razonSocial)}</strong>
                        <span>${escapeHtml(company.nombreComercial || "Sin nombre comercial")}</span>
                        ${renderCompanyDianSummary(company, { compact: true })}
                      </div>
                    </td>
                    <td>${escapeHtml(company.nit)}-${escapeHtml(company.dv || "")}</td>
                    <td><span class="${statusClass(company.estadoEmpresa)}">${escapeHtml(formatStatus(company.estadoEmpresa))}</span></td>
                    <td><span class="${company.documentoRutId ? "status-badge status-activo" : "status-badge status-pendiente"}">${company.documentoRutId ? "Asociado" : "Pendiente"}</span></td>
                    <td>
                      <div class="users-table-actions">
                        <button
                          class="table-action-icon table-action-icon-view"
                          data-view-company-id="${company.id}"
                          type="button"
                          title="Ver detalle"
                          aria-label="Ver detalle de empresa"
                        >
                          ${renderSidebarIcon("eye")}
                        </button>
                      </div>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderRoleCheckboxes(selectedRoles = []) {
  return ROLE_OPTIONS.map(
    (role) => `
      <label class="checkbox-pill selection-card role-selection-card ${selectedRoles.includes(role.value) ? "selection-card-selected" : ""}">
        <input name="roles" type="radio" value="${escapeHtml(role.value)}" ${selectedRoles.includes(role.value) ? "checked" : ""} />
        <span class="selection-card-check">${renderSidebarIcon("check")}</span>
        <span class="selection-card-icon">${renderSidebarIcon("users")}</span>
        <div class="selection-card-body">
          <span class="selection-card-title">${escapeHtml(role.label)}</span>
          <small class="selection-card-description">${escapeHtml(ROLE_DESCRIPTIONS[role.value] || "Rol operativo del sistema.")}</small>
        </div>
      </label>
    `
  ).join("");
}

function renderCompanyAssignmentCheckboxes(selectedCompanyIds = []) {
  if (!state.companies.length) {
    return `<p class="muted">Todavia no hay empresas disponibles para asignar.</p>`;
  }

  return state.companies
    .map(
      (company) => `
        <label class="checkbox-pill selection-card company-selection-card ${selectedCompanyIds.includes(company.id) ? "selection-card-selected" : ""}">
          <input
            name="empresasAsignadas"
            type="checkbox"
            value="${escapeHtml(company.id)}"
            ${selectedCompanyIds.includes(company.id) ? "checked" : ""}
          />
          <span class="selection-card-check">${renderSidebarIcon("check")}</span>
          <span class="selection-card-icon">${renderSidebarIcon("building2")}</span>
          <div class="selection-card-body">
            <span class="selection-card-title">${escapeHtml(company.razonSocial)}</span>
            <small class="selection-card-description">${escapeHtml(`NIT ${company.nit || "Sin NIT"}${company.dv ? `-${company.dv}` : ""}`)}</small>
          </div>
        </label>
      `
    )
    .join("");
}

function canRoleHaveAssignedCompanies(role) {
  return role !== "apprentice";
}

function roleCanBeSupervisor(role) {
  return role === "owner" || role === "senior_accountant";
}

function roleNeedsSupervisor(role) {
  return role === "junior_accountant" || role === "apprentice";
}

function roleCanBeSupervised(role) {
  return role === "senior_accountant" || roleNeedsSupervisor(role);
}

function roleCanSuperviseRole(supervisorRole, targetRole) {
  if (!supervisorRole || !targetRole || supervisorRole === targetRole) {
    return false;
  }

  if (supervisorRole === "owner") {
    return targetRole !== "owner";
  }

  if (supervisorRole === "senior_accountant") {
    return targetRole === "junior_accountant" || targetRole === "apprentice";
  }

  return false;
}

function getPrimaryRole(user) {
  return user?.role || (Array.isArray(user?.roles) ? user.roles[0] : "") || "";
}

function getRoleLabel(role) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label || role || "Sin rol";
}

function renderSupervisorOptions(selectedRole = "", selectedSupervisorId = "", currentUserId = "") {
  const options = state.users
    .filter((user) => user.id !== currentUserId)
    .filter((user) =>
      selectedRole ? roleCanSuperviseRole(getPrimaryRole(user), selectedRole) : roleCanBeSupervisor(getPrimaryRole(user))
    )
    .sort((left, right) => left.nombreCompleto.localeCompare(right.nombreCompleto, "es"));

  return [
    '<option value="">Sin supervisor directo</option>',
    ...options.map(
      (user) => `
        <option value="${escapeHtml(user.id)}" ${selectedSupervisorId === user.id ? "selected" : ""}>
          ${escapeHtml(`${user.nombreCompleto} · ${getRoleLabel(getPrimaryRole(user))}`)}
        </option>
      `
    )
  ].join("");
}

function renderSupervisedUserCheckboxes(selectedRole = "", selectedUserIds = [], currentUserId = "") {
  const options = state.users
    .filter((user) => user.id !== currentUserId)
    .filter((user) =>
      selectedRole ? roleCanSuperviseRole(selectedRole, getPrimaryRole(user)) : roleCanBeSupervised(getPrimaryRole(user))
    )
    .sort((left, right) => left.nombreCompleto.localeCompare(right.nombreCompleto, "es"));

  if (!options.length) {
    return `<p class="muted">No hay usuarios compatibles para supervisar con este rol.</p>`;
  }

  return options
    .map(
      (user) => `
        <label class="checkbox-pill selection-card company-selection-card ${selectedUserIds.includes(user.id) ? "selection-card-selected" : ""}">
          <input
            name="supervisedUsers"
            type="checkbox"
            value="${escapeHtml(user.id)}"
            ${selectedUserIds.includes(user.id) ? "checked" : ""}
          />
          <span class="selection-card-check">${renderSidebarIcon("check")}</span>
          <span class="selection-card-icon">${renderSidebarIcon("users")}</span>
          <div class="selection-card-body">
            <span class="selection-card-title">${escapeHtml(user.nombreCompleto)}</span>
            <small class="selection-card-description">${escapeHtml(`${getRoleLabel(getPrimaryRole(user))} · ${user.email}`)}</small>
          </div>
        </label>
      `
    )
    .join("");
}

function isRutDocumentsView() {
  return state.sidebarActiveKey === "rut-documents";
}

function rutWorkspaceSection() {
  if (isRutDocumentsView()) {
    return `
      ${uploadSection()}
      ${reviewForm()}
    `;
  }

  return `
    <section class="rut-documents-layout">
      ${companiesSection()}
      ${companyDetailSectionSimple()}
    </section>
  `;
}

function userFormValues() {
  const current =
    state.users.find((user) => user.id === state.editingUserId) || {
      nombre: "",
      apellido: "",
      nombreCompleto: "",
      email: "",
      cargo: "",
      estado: "activo",
      roles: [],
      permisos: [],
      empresasAsignadas: [],
      supervisedUsers: [],
      supervisorId: ""
    };

  return {
    ...current,
    roles: Array.isArray(current.roles) && current.roles.length ? [current.roles[0]] : [],
    supervisedUsers: Array.isArray(current.supervisedUsers) ? current.supervisedUsers : [],
    supervisorId: current.supervisorId || "",
    permisosTexto: Array.isArray(current.permisos) ? current.permisos.join(", ") : ""
  };
}

function usersSection() {
  if (!hasPermission("ver_modulo_usuarios")) {
    return `
      <section class="users-page">
        <div class="eyebrow">Usuarios</div>
        <h3 class="section-title">Modulo restringido</h3>
        <p class="muted">Tu rol no tiene acceso a la administracion de usuarios.</p>
      </section>
    `;
  }

  const values = userFormValues();
  const canEditUsers = hasPermission("editar_usuarios");
  const canCreateUsers = hasPermission("crear_usuarios");
  const canAssignDirectPermissions = hasPermission("asignar_permisos");
  const activeUsers = state.users.filter((user) => user.estado === "activo").length;
  const selectedRole = values.roles?.[0] || "";
  const selectedRoleLabel = getRoleLabel(selectedRole);
  const assignedCompaniesCount = state.users.reduce(
    (total, user) => total + (Array.isArray(user.empresasAsignadas) ? user.empresasAsignadas.length : 0),
    0
  );
  const supervisedLinksCount = state.users.reduce(
    (total, user) => total + (Array.isArray(user.supervisedUsers) ? user.supervisedUsers.length : 0),
    0
  );

  return `
    <section class="users-page">
      <header class="users-page-header">
        <div class="eyebrow">Usuarios</div>
        <h3 class="section-title">Usuarios, roles y permisos</h3>
        <p class="users-page-description">Administra usuarios internos, roles, permisos y empresas asignadas.</p>
      </header>
      <div class="users-summary-grid">
        <article class="users-summary-card">
          <span class="users-summary-label">Usuarios internos</span>
          <strong>${escapeHtml(String(state.users.length))}</strong>
          <span>Base operativa registrada.</span>
        </article>
        <article class="users-summary-card">
          <span class="users-summary-label">Activos</span>
          <strong>${escapeHtml(String(activeUsers))}</strong>
          <span>Perfiles listos para iniciar sesion.</span>
        </article>
        <article class="users-summary-card">
          <span class="users-summary-label">Empresas asignadas</span>
          <strong>${escapeHtml(String(assignedCompaniesCount))}</strong>
          <span>Relaciones activas por cliente.</span>
        </article>
        <article class="users-summary-card">
          <span class="users-summary-label">Supervision activa</span>
          <strong>${escapeHtml(String(supervisedLinksCount))}</strong>
          <span>Vinculos jerarquicos configurados.</span>
        </article>
      </div>
      ${messageCard(
        state.userManagementMessage,
        /correctamente/i.test(state.userManagementMessage || "") && !/no se pudo|error/i.test(state.userManagementMessage || "")
          ? "success"
          : "error"
      )}
      <div class="users-layout">
        <section class="users-list-panel">
          <div class="panel-header">
            <div>
              <div class="eyebrow">Usuarios internos</div>
              <h4 class="section-title">Listado actual</h4>
              <p class="panel-subtitle">Consulta perfiles, estado operativo y acceso asignado sin salir de esta vista.</p>
            </div>
          </div>
          <div class="table-card users-table-card">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Supervisor</th>
                  <th>Alcance</th>
                  <th>Equipo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${state.users
                  .map((user) => {
                    const initials = `${user.nombre?.[0] || ""}${user.apellido?.[0] || ""}`.toUpperCase() || "US";
                    const roleLabel = getRoleLabel(user.role || getPrimaryRole(user));
                    const assignedCompanies = Array.isArray(user.empresasAsignadas) ? user.empresasAsignadas.length : 0;
                    const teamCount = Number(user.supervisedUsersCount || 0);
                    const scopeLabel =
                      user.role === "owner"
                        ? "Acceso total"
                        : user.role === "apprentice"
                          ? "Solo tareas"
                          : `${assignedCompanies} empresa${assignedCompanies === 1 ? "" : "s"}`;

                    return `
                      <tr class="${state.editingUserId === user.id ? "user-row-selected" : ""}">
                        <td>
                          <div class="user-table-identity">
                            <div class="user-table-avatar">${escapeHtml(initials)}</div>
                            <div class="user-table-copy">
                              <strong>${escapeHtml(user.nombreCompleto)}</strong>
                              <span>${escapeHtml(user.email)}</span>
                              <small class="user-table-subline">${escapeHtml(user.cargo || "Sin cargo definido")}</small>
                            </div>
                          </div>
                        </td>
                        <td><span class="user-table-pill">${escapeHtml(roleLabel)}</span></td>
                        <td><span class="user-table-text">${escapeHtml(user.supervisor?.nombreCompleto || "Sin supervisor")}</span></td>
                        <td><span class="user-table-text">${escapeHtml(scopeLabel)}</span></td>
                        <td><span class="user-table-count">${escapeHtml(String(teamCount))}</span></td>
                        <td><span class="${statusClass(user.estado)} users-table-status">${escapeHtml(formatStatus(user.estado))}</span></td>
                        <td>
                          <div class="users-table-actions">
                            ${
                              canEditUsers
                                ? `<button
                                    class="table-action-icon table-action-icon-view"
                                    type="button"
                                    data-edit-user-id="${user.id}"
                                    title="Editar usuario"
                                    aria-label="Editar usuario"
                                  >
                                    ${renderSidebarIcon("pencil")}
                                  </button>`
                                : '<span class="table-actions-empty">Solo lectura</span>'
                            }
                          </div>
                        </td>
                      </tr>
                    `;
                  })
                  .join("") || '<tr><td colspan="7" class="muted">No hay usuarios registrados.</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>
        <section class="users-form-panel">
          <div class="panel-header users-form-header">
            <div class="users-form-header-main">
              <div class="eyebrow">${state.editingUserId ? "Edicion" : "Alta"}</div>
              <h4 class="section-title">${state.editingUserId ? "Editar usuario" : "Crear usuario"}</h4>
            </div>
            <p class="panel-subtitle users-form-header-note">
              ${state.editingUserId ? "Actualiza datos, permisos, supervisor y cartera del perfil seleccionado." : "Registra un nuevo perfil interno con acceso controlado."}
            </p>
          </div>
          ${
            canCreateUsers || canEditUsers
              ? `
                <form id="user-form" class="form-grid compact users-form-grid">
                  <section class="users-form-section full">
                    <div class="users-form-section-header">
                      <div class="users-form-section-icon">${renderSidebarIcon("pencil")}</div>
                      <div>
                        <strong>Informacion basica</strong>
                        <span>Datos de identidad y contacto del usuario interno.</span>
                      </div>
                    </div>
                    <div class="users-form-section-grid users-form-section-grid-basic">
                      <label>
                        <span>Nombre</span>
                        <input name="nombre" value="${escapeHtml(values.nombre || "")}" required />
                      </label>
                      <label>
                        <span>Apellido</span>
                        <input name="apellido" value="${escapeHtml(values.apellido || "")}" />
                      </label>
                      <label class="full">
                        <span>Correo</span>
                        <input name="email" type="email" value="${escapeHtml(values.email || "")}" required />
                      </label>
                      <label class="full">
                        <span>Cargo</span>
                        <input name="cargo" value="${escapeHtml(values.cargo || "")}" />
                      </label>
                    </div>
                  </section>
                  <section class="users-form-section full">
                    <div class="users-form-section-header">
                      <div class="users-form-section-icon">${renderSidebarIcon("settings")}</div>
                      <div>
                        <strong>Acceso y seguridad</strong>
                        <span>Estado del perfil, contrasena y permisos adicionales.</span>
                      </div>
                    </div>
                    <div class="users-form-section-grid users-form-section-grid-access">
                      <label>
                        <span>Estado</span>
                        <select name="estado">
                          <option value="activo" ${values.estado === "activo" ? "selected" : ""}>Activo</option>
                          <option value="inactivo" ${values.estado === "inactivo" ? "selected" : ""}>Inactivo</option>
                        </select>
                      </label>
                      <label>
                        <span>Contrasena ${state.editingUserId ? "(opcional)" : ""}</span>
                        <input name="password" type="password" ${state.editingUserId ? "" : "required"} />
                      </label>
                      <label class="full users-helper-field">
                        <span>Permisos directos adicionales</span>
                        <input
                          name="permisosTexto"
                          value="${escapeHtml(values.permisosTexto || "")}"
                          placeholder="crear_usuarios, exportar_reportes"
                          ${canAssignDirectPermissions ? "" : "readonly"}
                        />
                        <small>
                          ${
                            canAssignDirectPermissions
                              ? "Separar permisos por coma."
                              : "Tu rol puede guardar usuarios, pero no asignar permisos directos."
                          }
                        </small>
                      </label>
                    </div>
                  </section>
                  <section class="users-form-section full">
                    <div class="users-form-section-header">
                      <div class="users-form-section-icon">${renderSidebarIcon("users")}</div>
                      <div>
                        <strong>Roles y permisos</strong>
                        <span>Selecciona un rol principal para definir el alcance operativo del usuario.</span>
                      </div>
                    </div>
                    <div class="users-selection-scroll users-selection-scroll-roles">
                      <div class="flags-grid users-flags-grid users-flags-grid-roles">${renderRoleCheckboxes(values.roles || [])}</div>
                    </div>
                    <p class="users-inline-note">
                      ${selectedRole ? `Rol seleccionado: ${escapeHtml(selectedRoleLabel)}.` : "Selecciona un rol para activar validaciones jerarquicas y de cartera."}
                    </p>
                  </section>
                  <section class="users-form-section full">
                    <div class="users-form-section-header">
                      <div class="users-form-section-icon">${renderSidebarIcon("shield")}</div>
                      <div>
                        <strong>Jerarquia operativa</strong>
                        <span>Configura supervisor directo y equipo a cargo segun el rol del usuario.</span>
                      </div>
                    </div>
                    <div class="users-form-section-grid users-form-section-grid-access">
                      <label>
                        <span>Supervisor directo</span>
                        <select name="supervisorId">
                          ${renderSupervisorOptions(selectedRole, values.supervisorId || "", values.id || state.editingUserId || "")}
                        </select>
                      </label>
                      <div class="users-helper-list">
                        <span>Reglas rapidas</span>
                        <small>${escapeHtml(
                          roleNeedsSupervisor(selectedRole)
                            ? "Este rol debe reportar a un owner o contador senior."
                            : roleCanBeSupervised(selectedRole)
                              ? "Puedes dejar un supervisor o administrarlo directamente desde direccion."
                              : "Este rol opera sin supervisor directo obligatorio."
                        )}</small>
                      </div>
                    </div>
                    <div class="users-selection-scroll users-selection-scroll-companies">
                      <div class="flags-grid users-flags-grid users-flags-grid-companies">${renderSupervisedUserCheckboxes(selectedRole, values.supervisedUsers || [], values.id || state.editingUserId || "")}</div>
                    </div>
                    <p class="users-inline-note">
                      ${escapeHtml(
                        roleCanBeSupervisor(selectedRole)
                          ? "Owner puede supervisar seniors, juniors y aprendices. Senior puede supervisar juniors y aprendices."
                          : "Solo los roles owner y senior pueden administrar usuarios a cargo."
                      )}
                    </p>
                  </section>
                  <section class="users-form-section full">
                    <div class="users-form-section-header">
                      <div class="users-form-section-icon">${renderSidebarIcon("building2")}</div>
                      <div>
                        <strong>Empresas asignadas</strong>
                        <span>Controla a que clientes puede acceder el perfil.</span>
                      </div>
                    </div>
                    <div class="users-selection-scroll users-selection-scroll-companies">
                      <div class="flags-grid users-flags-grid users-flags-grid-companies">${renderCompanyAssignmentCheckboxes(values.empresasAsignadas || [])}</div>
                    </div>
                    <p class="users-inline-note">
                      ${escapeHtml(
                        canRoleHaveAssignedCompanies(selectedRole)
                          ? "Asigna cartera solo cuando el rol deba trabajar directamente sobre empresas."
                          : "Los aprendices no reciben cartera completa; trabajan sobre tareas asignadas."
                      )}
                    </p>
                  </section>
                  <div class="button-row users-form-actions full">
                    <button class="btn btn-primary users-submit-button" type="submit">
                      <span class="users-submit-icon">${renderSidebarIcon("pencil")}</span>
                      <span>${state.editingUserId ? "Guardar usuario" : "Crear usuario"}</span>
                    </button>
                    ${
                      state.editingUserId
                        ? '<button class="btn btn-secondary" id="cancel-user-edit" type="button">Cancelar</button>'
                        : ""
                    }
                  </div>
                </form>
              `
              : `<p class="muted">Tu rol puede consultar usuarios, pero no modificarlos.</p>`
          }
        </section>
      </div>
    </section>
  `;
}

function companyDetailSection() {
  if (!state.selectedCompany) {
    return `
      <section class="panel-card">
        <div class="eyebrow">Detalle de empresa</div>
        <h3 class="section-title">Selecciona una empresa del listado</h3>
        <p class="muted">Aqui veras el detalle basico, el estado operativo y el documento RUT asociado.</p>
      </section>
    `;
  }

  const company = state.selectedCompany;
  const obligations = Array.isArray(company.obligacionesFiscales) ? company.obligacionesFiscales : [];
  const fiscalTasks = Array.isArray(company.tareasFiscales) ? company.tareasFiscales : [];
  const dianControls = Array.isArray(company.tareasCumplimientoDian) ? company.tareasCumplimientoDian : [];
  const openDianControls = countOpenDianControls(company);
  const canApproveCompany =
    hasPermission("aprobar_empresa") && (company.estadoEmpresa === "pendiente_revision" || company.estadoEmpresa === "borrador");
  const canManageObligations = hasPermission("gestionar_obligaciones");
  const companyStatusNotice =
    company.estadoEmpresa === "pendiente_revision"
      ? {
          tone: "info",
          text: "Esta empresa aun no esta activa. Aprueba la revision para habilitarla operativamente."
        }
      : company.estadoEmpresa === "activa"
        ? {
            tone: "success",
            text: "Empresa activa para operacion."
          }
        : null;
  const detailMessageTone =
    /correctamente|no aplica|revision/i.test(state.saveMessage || "") && !/no se pudo|verifica|error/i.test(state.saveMessage || "")
      ? "success"
      : /no se pudo|verifica|error/i.test(state.saveMessage || "")
        ? "error"
        : "info";

  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Detalle de empresa</div>
          <h3 class="section-title">${escapeHtml(company.razonSocial)}</h3>
        </div>
        <div class="${statusClass(company.estadoEmpresa)}">${escapeHtml(formatStatus(company.estadoEmpresa))}</div>
      </div>
      ${messageCard(state.saveMessage, detailMessageTone)}
      ${companyStatusNotice ? messageCard(companyStatusNotice.text, companyStatusNotice.tone) : ""}
      <div class="detail-grid">
        <div class="detail-item"><strong>Estado actual</strong><span class="${statusClass(company.estadoEmpresa)}">${escapeHtml(formatStatus(company.estadoEmpresa))}</span></div>
        <div class="detail-item"><strong>NIT + DV</strong><span>${escapeHtml(company.nit)}-${escapeHtml(company.dv || "")}</span></div>
        <div class="detail-item"><strong>Tipo contribuyente</strong><span>${escapeHtml(company.tipoContribuyente || "No registrado")}</span></div>
        <div class="detail-item"><strong>Tipo persona</strong><span>${escapeHtml(company.tipoPersona || "No registrado")}</span></div>
        <div class="detail-item"><strong>Regimen</strong><span>${escapeHtml(company.regimenTributario || "No registrado")}</span></div>
        <div class="detail-item"><strong>Ubicacion</strong><span>${escapeHtml([company.pais, company.departamento, company.municipio].filter(Boolean).join(" / ") || "No registrada")}</span></div>
        <div class="detail-item"><strong>Direccion principal</strong><span>${escapeHtml(company.direccionPrincipal || "No registrada")}</span></div>
        <div class="detail-item"><strong>Correo / Telefono</strong><span>${escapeHtml([company.correoElectronico || company.email, company.telefono1].filter(Boolean).join(" / ") || "No registrado")}</span></div>
        <div class="detail-item"><strong>Actividad principal</strong><span>${escapeHtml(
          [company.actividadEconomicaPrincipalCodigo || company.actividadEconomicaPrincipal, company.actividadEconomicaPrincipalNombre]
            .filter(Boolean)
            .join(" · ") || "No registrada"
        )}</span></div>
        <div class="detail-item"><strong>Responsabilidades</strong><span>${escapeHtml((company.responsabilidadesTributarias || []).map((item) => item.codigo).join(", ") || "No registradas")}</span></div>
        <div class="detail-item"><strong>Representante legal</strong><span>${escapeHtml(company.representanteLegalPrincipal?.nombreCompleto || company.representanteLegal || "No registrado")}</span></div>
        <div class="detail-item"><strong>Documento RUT</strong><span>${escapeHtml(company.documentoRut?.nombreArchivo || "No asociado")}</span></div>
        <div class="detail-item"><strong>Controles DIAN abiertos</strong><span>${escapeHtml(String(openDianControls))}</span></div>
      </div>
      <section class="panel-card" style="margin-top: 20px;">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Cumplimiento DIAN</div>
            <h4 class="section-title">Controles sugeridos para esta empresa</h4>
          </div>
        </div>
        <div class="rut-detail-badges">
          ${renderDianComplianceBadges(company)}
        </div>
        <p class="muted" style="margin-top: 12px;">
          Se detectaron ${escapeHtml(String(dianControls.length))} controles DIAN generados, ${escapeHtml(String(openDianControls))} abiertos.
        </p>
      </section>
      ${
        canApproveCompany
          ? `<div class="button-row">
              <button class="btn btn-primary" type="button" data-action="approve-company" data-company-id="${company.id}">
                Aprobar revision y activar empresa
              </button>
            </div>`
          : ""
      }
      <section class="obligations-section">
        <div class="panel-header section-top">
          <div>
            <div class="eyebrow">Obligaciones sugeridas</div>
            <h4 class="section-title">Motor de impuestos y obligaciones fiscales</h4>
          </div>
          ${
            canManageObligations
              ? `<button class="btn btn-primary" type="button" data-action="analyze-obligations" data-company-id="${company.id}">
                  Analizar obligaciones
                </button>`
              : ""
          }
        </div>
        ${
          obligations.length
            ? `<div class="obligation-list">
                ${obligations
                  .map(
                    (item) => `
                      <article class="obligation-card">
                        <div class="obligation-top">
                          <div>
                            <strong>${escapeHtml(obligationLabel(item))}</strong>
                            <div class="muted">${escapeHtml(item.impuesto?.nombre || item.nombreObligacion || "")}</div>
                          </div>
                          <span class="${statusClass(item.estado)}">${escapeHtml(formatStatus(item.estado))}</span>
                        </div>
                        <div class="obligation-meta">
                          <div><strong>Nivel:</strong> ${escapeHtml(item.nivel || "-")}</div>
                          <div><strong>Fuente:</strong> ${escapeHtml(item.fuenteDeteccion || "-")}</div>
                          <div><strong>Motivo:</strong> ${escapeHtml(item.motivoAplicacion || "-")}</div>
                          <div><strong>Responsabilidad RUT:</strong> ${escapeHtml(
                            [item.codigoResponsabilidadRut, item.responsabilidadRutOrigen].filter(Boolean).join(" · ") || "-"
                          )}</div>
                        </div>
                        ${
                          canManageObligations
                            ? `<div class="button-row compact">
                                <button class="btn btn-secondary" type="button" data-action="confirm-obligation" data-obligation-id="${item.id}" ${
                                  company.estadoEmpresa !== "activa" ? "disabled" : ""
                                }>
                                  Confirmar
                                </button>
                                <button class="btn btn-secondary" type="button" data-action="not-applicable-obligation" data-obligation-id="${item.id}">
                                  Marcar no aplica
                                </button>
                                <button class="btn btn-secondary" type="button" data-action="review-obligation" data-obligation-id="${item.id}">
                                  Dejar en revision
                                </button>
                              </div>`
                            : ""
                        }
                      </article>
                    `
                  )
                  .join("")}
              </div>`
            : `<p class="muted">Todavia no hay obligaciones sugeridas para esta empresa.</p>`
        }
      </section>
      <section class="obligations-section">
        <div class="panel-header section-top">
          <div>
            <div class="eyebrow">Tareas fiscales generadas</div>
            <h4 class="section-title">Calendario aplicado a la empresa</h4>
          </div>
        </div>
        ${renderFiscalTaskRows(fiscalTasks)}
      </section>
    </section>
  `;
}

function dashboardMetricCard(label, value, caption = "", icon = "chart", tone = "default") {
  return `
    <article class="dashboard-kpi-card dashboard-kpi-${escapeHtml(tone)}">
      <div class="dashboard-kpi-top">
        <span class="dashboard-kpi-icon">${renderSidebarIcon(icon)}</span>
        <span class="dashboard-kpi-label">${escapeHtml(label)}</span>
      </div>
      <div class="dashboard-kpi-value">${escapeHtml(String(value ?? 0))}</div>
      ${caption ? `<p class="dashboard-kpi-caption">${escapeHtml(caption)}</p>` : ""}
    </article>
  `;
}

function dashboardMiniMetricCard(label, value, icon = "chart") {
  return `
    <article class="dashboard-mini-card">
      <span class="dashboard-mini-icon">${renderSidebarIcon(icon)}</span>
      <div class="dashboard-mini-copy">
        <strong class="dashboard-mini-value">${escapeHtml(String(value ?? 0))}</strong>
        <span class="dashboard-mini-label">${escapeHtml(label)}</span>
      </div>
    </article>
  `;
}

function dashboardAlertCard(alert) {
  return `
    <article class="dashboard-alert-card">
      <div class="dashboard-alert-top">
        <span class="dashboard-alert-icon">${renderSidebarIcon("settings")}</span>
        <span class="alert-badge alert-badge-critical">Critica</span>
      </div>
      <strong>${escapeHtml(alert.mensaje || "Alerta critica")}</strong>
      <span>${escapeHtml(alert.empresa || alert.empresaId || "Sin empresa")}</span>
      <small>${escapeHtml(alert.responsable || alert.responsableId || "Sin responsable")} · ${escapeHtml(
        formatDateLabel(alert.fechaVencimiento)
      )}</small>
    </article>
  `;
}

function dashboardRiskCard(item) {
  return `
    <article class="dashboard-risk-card">
      <strong class="dashboard-risk-company-name">${escapeHtml(item.empresa || "-")}</strong>
      <div class="dashboard-risk-summary">
        <span class="${statusClass(item.nivelRiesgo || "bajo")} dashboard-risk-badge">${escapeHtml(
          formatStatus(item.nivelRiesgo || "bajo")
        )}</span>
        <div class="dashboard-risk-stats">
          <span>Vencidas ${escapeHtml(String(item.tareasVencidas || 0))}</span>
          <span>Proximas ${escapeHtml(String(item.tareasProximas || 0))}</span>
          <span>Criticas ${escapeHtml(String(item.alertasCriticas || 0))}</span>
        </div>
      </div>
    </article>
  `;
}

function dashboardWorkloadCard(item, maxLoad) {
  const totalLoad = Number(item.tareasPendientes || 0) + Number(item.tareasEnProceso || 0) + Number(item.tareasVencidas || 0);
  const percentage = maxLoad > 0 ? Math.min(100, Math.round((totalLoad / maxLoad) * 100)) : 0;

  return `
    <article class="dashboard-workload-card">
      <div class="dashboard-workload-head">
        <strong>${escapeHtml(item.usuario || "-")}</strong>
        <span>${escapeHtml(`${percentage}%`)}</span>
      </div>
      <div class="dashboard-workload-bar">
        <span style="width:${percentage}%"></span>
      </div>
      <div class="dashboard-workload-meta">
        <span>${escapeHtml(String(item.tareasPendientes || 0))} pendientes</span>
        <span>${escapeHtml(String(item.tareasEnProceso || 0))} en proceso</span>
        <span>${escapeHtml(String(item.tareasVencidas || 0))} vencidas</span>
      </div>
    </article>
  `;
}

function dashboardOperationCard(label, value, caption = "", tone = "neutral", queue = "") {
  return `
    <button class="dashboard-operation-card dashboard-operation-${escapeHtml(tone)}" type="button" data-action="dashboard-open-task-queue" data-queue="${escapeHtml(queue)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value ?? 0))}</strong>
      ${caption ? `<small>${escapeHtml(caption)}</small>` : ""}
    </button>
  `;
}

function dashboardDaysLabel(days) {
  if (days === null || days === undefined || Number.isNaN(Number(days))) {
    return "Sin fecha";
  }

  const numericDays = Number(days);
  if (numericDays < 0) {
    return `${Math.abs(numericDays)} dias vencida`;
  }

  if (numericDays === 0) {
    return "Vence hoy";
  }

  if (numericDays === 1) {
    return "Vence manana";
  }

  return `Vence en ${numericDays} dias`;
}

function dashboardQueueRows(items, emptyMessage) {
  const rows = Array.isArray(items) ? items : [];
  if (!rows.length) {
    return `<tr><td colspan="6" class="muted">${escapeHtml(emptyMessage)}</td></tr>`;
  }

  return rows
    .map(
      (task) => `
        <tr>
          <td><strong>${escapeHtml(task.titulo || "-")}</strong></td>
          <td>${escapeHtml(task.empresa || "-")}</td>
          <td>${escapeHtml(task.responsable || "Sin responsable")}</td>
          <td>${escapeHtml(formatDateLabel(task.fechaVencimiento))}</td>
          <td>${escapeHtml(dashboardDaysLabel(task.diasParaVencer))}</td>
          <td><span class="${statusClass(task.estado || "pendiente")}">${escapeHtml(formatStatus(task.estado || "pendiente"))}</span></td>
        </tr>
      `
    )
    .join("");
}

function dashboardDetailPanel(title, eyebrow, body, open = false) {
  return `
    <details class="dashboard-detail-panel" ${open ? "open" : ""}>
      <summary class="dashboard-detail-summary">
        <div>
          <div class="eyebrow">${escapeHtml(eyebrow)}</div>
          <strong>${escapeHtml(title)}</strong>
        </div>
        <span class="dashboard-detail-arrow">${renderSidebarIcon("chevronRight")}</span>
      </summary>
      <div class="dashboard-detail-body">
        ${body}
      </div>
    </details>
  `;
}

function dashboardSection() {
  if (state.dashboardLoading) {
    return `<section class="empty-state" style="padding: 32px;">Cargando indicadores gerenciales...</section>`;
  }

  if (state.dashboardError) {
    return messageCard(state.dashboardError, "error");
  }

  const dashboard = state.dashboardData;
  if (!dashboard) {
    return `
      <section class="empty-state" style="padding: 32px;">
        <h3 class="section-title">Dashboard sin cargar</h3>
        <p class="muted">Usa el boton para actualizar los indicadores con datos reales del sistema.</p>
        <button class="btn btn-primary" type="button" data-action="refresh-dashboard">Actualizar dashboard</button>
      </section>
    `;
  }

  const summary = dashboard.summary || {};
  const currentMonth = dashboard.currentMonth || {};
  const compliance = dashboard.compliance || {};
  const operationsCenter = dashboard.operationsCenter || {};
  const operationCounts = operationsCenter.counts || {};
  const operationQueues = operationsCenter.queues || {};
  const riskByCompany = Array.isArray(dashboard.riskByCompany) ? dashboard.riskByCompany : [];
  const workloadByUser = Array.isArray(dashboard.workloadByUser) ? dashboard.workloadByUser : [];
  const criticalAlerts = Array.isArray(dashboard.criticalAlerts) ? dashboard.criticalAlerts : [];
  const topRiskCompanies = riskByCompany.slice(0, 4);
  const topCriticalAlerts = criticalAlerts.slice(0, 3);
  const dashboardVariant = state.currentUser?.dashboardView || "sin_dashboard";
  const myWorkload = workloadByUser.find(
    (item) => String(item.usuarioId || "").trim() === String(state.currentUser?.id || "").trim()
  ) || null;
  const maxWorkload = workloadByUser.reduce((max, item) => {
    const total = Number(item.tareasPendientes || 0) + Number(item.tareasEnProceso || 0) + Number(item.tareasVencidas || 0);
    return Math.max(max, total);
  }, 0);
  const dashboardHeading =
    dashboardVariant === "general"
      ? "Resumen ejecutivo operativo"
      : dashboardVariant === "supervisor"
        ? "Panel de supervision"
        : "Panel personal";
  const dashboardDescription =
    dashboardVariant === "general"
      ? "Datos calculados desde empresas, obligaciones, tareas, alertas y usuarios visibles para tu permiso."
      : dashboardVariant === "supervisor"
        ? "Visibilidad de tu equipo, empresas asignadas y prioridades operativas."
        : "Seguimiento de tus pendientes, alertas visibles y carga actual.";

  return `
    <section class="panel-card dashboard-shell">
      <div class="panel-header dashboard-header">
        <div>
          <h3 class="section-title">${escapeHtml(dashboardHeading)}</h3>
          <p class="muted">${escapeHtml(dashboardDescription)}</p>
        </div>
        <button class="btn btn-primary" type="button" data-action="refresh-dashboard">Actualizar</button>
      </div>

      <section class="dashboard-kpi-grid">
        ${dashboardMetricCard("Empresas activas", summary.empresasActivas, "Base operativa vigente", "building2", "neutral")}
        ${dashboardMetricCard("Obligaciones activas", summary.obligacionesFiscalesActivas, "Carga fiscal actual", "receipt", "neutral")}
        ${dashboardMetricCard("Alertas criticas", summary.alertasCriticas, "Prioridades inmediatas", "settings", "danger")}
        ${dashboardMetricCard("Cumplimiento", `${compliance.porcentajeTareasCompletadas || 0}%`, "Cierre operativo total", "chart", "success")}
      </section>

      <section class="dashboard-module dashboard-module-wide dashboard-operations-module">
        <div class="dashboard-module-header">
          <div>
            <div class="eyebrow">Operacion del equipo</div>
            <h4 class="section-title compact">Bandeja de control diario</h4>
          </div>
          <span class="dashboard-inline-pill">${escapeHtml(String(operationCounts.abiertas || 0))} abiertas</span>
        </div>
        <div class="dashboard-operation-grid">
          ${dashboardOperationCard("Vencidas", operationCounts.vencidas, "Riesgo inmediato", "danger", "vencidas")}
          ${dashboardOperationCard("Vencen hoy", operationCounts.vencenHoy, "Accion del dia", "warning", "hoy")}
          ${dashboardOperationCard("Vencen 3 dias", operationCounts.vencenTresDias, "Prioridad semanal", "warning", "proximas")}
          ${dashboardOperationCard("Sin responsable", operationCounts.sinResponsable, "Requiere asignacion", "danger", "sin_responsable")}
          ${dashboardOperationCard("Bloqueadas cliente", operationCounts.bloqueadasCliente, "Depende del cliente", "warning", "cliente")}
          ${dashboardOperationCard("Pago/soporte cliente", operationCounts.pendientePagoCliente, "Seguimiento externo", "neutral", "pago_cliente")}
        </div>
        <div class="dashboard-queue-layout">
          <div class="dashboard-queue-panel">
            <div class="dashboard-queue-head">
              <strong>Vencidas primero</strong>
              <span>${escapeHtml(String((operationQueues.vencidas || []).length))} visibles</span>
            </div>
            <div class="table-card calendar-table-card dashboard-table-card dashboard-queue-table">
              <table>
                <thead>
                  <tr>
                    <th>Tarea</th>
                    <th>Empresa</th>
                    <th>Responsable</th>
                    <th>Vence</th>
                    <th>Semaforo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${dashboardQueueRows(operationQueues.vencidas, "No hay tareas vencidas abiertas.")}
                </tbody>
              </table>
            </div>
          </div>
          <div class="dashboard-queue-panel">
            <div class="dashboard-queue-head">
              <strong>Proximas acciones</strong>
              <span>${escapeHtml(String((operationQueues.proximas || []).length))} visibles</span>
            </div>
            <div class="table-card calendar-table-card dashboard-table-card dashboard-queue-table">
              <table>
                <thead>
                  <tr>
                    <th>Tarea</th>
                    <th>Empresa</th>
                    <th>Responsable</th>
                    <th>Vence</th>
                    <th>Semaforo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${dashboardQueueRows(operationQueues.proximas, "No hay tareas proximas abiertas.")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section class="dashboard-module dashboard-module-wide">
        <div class="dashboard-module-header">
          <div>
            <div class="eyebrow">Operacion del mes</div>
            <h4 class="section-title compact">Indicadores visuales</h4>
          </div>
        </div>
        <div class="dashboard-mini-grid dashboard-mini-grid-wide">
          ${dashboardMiniMetricCard("Vencidas", currentMonth.tareasVencidas, "settings")}
          ${dashboardMiniMetricCard("Cumplidas", currentMonth.tareasCompletadasPresentadas, "check")}
          ${dashboardMiniMetricCard("Proximas 7 dias", currentMonth.tareasProximasSieteDias, "calendar")}
          ${dashboardMiniMetricCard("Fiscales", currentMonth.obligacionesTareasFiscalesMes, "receipt")}
          ${dashboardMiniMetricCard("Empresas en riesgo", currentMonth.empresasConRiesgoOperativo, "building2")}
          ${dashboardMiniMetricCard("Cumplimiento mes", `${compliance.cumplimientoMesActual || 0}%`, "chart")}
        </div>
      </section>

      <section class="dashboard-module dashboard-module-highlight dashboard-module-wide">
        <div class="dashboard-module-header">
          <div>
            <div class="eyebrow">Riesgos y alertas</div>
            <h4 class="section-title compact">Alertas criticas</h4>
          </div>
          <span class="dashboard-inline-pill">${escapeHtml(String(criticalAlerts.length))} visibles</span>
        </div>
        <div class="dashboard-alert-list dashboard-alert-list-wide">
          ${
            topCriticalAlerts.length
              ? topCriticalAlerts.map((alert) => dashboardAlertCard(alert)).join("")
              : '<div class="summary-list-card"><strong>Sin alertas criticas</strong><span>No hay prioridades inmediatas pendientes.</span></div>'
          }
        </div>
      </section>

      ${
        dashboardVariant !== "usuario"
          ? `
            <section class="dashboard-module dashboard-module-wide">
              <div class="dashboard-module-header">
                <div>
                  <div class="eyebrow">Empresas en riesgo</div>
                  <h4 class="section-title compact">Lectura ejecutiva</h4>
                </div>
              </div>
              <div class="dashboard-risk-grid dashboard-risk-grid-wide">
                ${
                  topRiskCompanies.length
                    ? topRiskCompanies.map((item) => dashboardRiskCard(item)).join("")
                    : '<div class="summary-list-card"><strong>Sin riesgo visible</strong><span>No hay empresas visibles con alertas operativas relevantes.</span></div>'
                }
              </div>
            </section>
          `
          : ""
      }

      <section class="dashboard-module dashboard-module-wide">
        <div class="dashboard-module-header">
          <div>
            <div class="eyebrow">${escapeHtml(dashboardVariant === "usuario" ? "Mi carga" : "Carga por usuario")}</div>
            <h4 class="section-title compact">${escapeHtml(dashboardVariant === "usuario" ? "Mis tareas visibles" : "Distribucion operativa")}</h4>
          </div>
        </div>
        <div class="dashboard-workload-grid dashboard-workload-grid-wide">
          ${
            dashboardVariant === "usuario"
              ? myWorkload
                ? dashboardWorkloadCard(myWorkload, maxWorkload)
                : '<div class="summary-list-card"><strong>Sin carga visible</strong><span>No tienes tareas asignadas visibles en este momento.</span></div>'
              : workloadByUser.length
              ? workloadByUser.map((item) => dashboardWorkloadCard(item, maxWorkload)).join("")
              : '<div class="summary-list-card"><strong>Sin carga visible</strong><span>No hay responsables visibles con tareas asignadas.</span></div>'
          }
        </div>
      </section>

      <section class="dashboard-detail-stack">
        ${
          dashboardVariant !== "usuario"
            ? dashboardDetailPanel(
          "Empresas con riesgo operativo",
          "Detalle",
          `
            <div class="table-card calendar-table-card dashboard-table-card">
              <table>
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Vencidas</th>
                    <th>Proximas</th>
                    <th>Alertas criticas</th>
                    <th>Alertas preventivas</th>
                    <th>Riesgo</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    riskByCompany
                      .map(
                        (item) => `
                          <tr>
                            <td><strong>${escapeHtml(item.empresa || "-")}</strong></td>
                            <td>${escapeHtml(String(item.tareasVencidas || 0))}</td>
                            <td>${escapeHtml(String(item.tareasProximas || 0))}</td>
                            <td>${escapeHtml(String(item.alertasCriticas || 0))}</td>
                            <td>${escapeHtml(String(item.alertasPreventivas || 0))}</td>
                            <td><span class="${statusClass(item.nivelRiesgo || "bajo")} dashboard-risk-badge">${escapeHtml(formatStatus(item.nivelRiesgo || "bajo"))}</span></td>
                          </tr>
                        `
                      )
                      .join("") || '<tr><td colspan="6" class="muted">No hay empresas visibles para calcular riesgo.</td></tr>'
                  }
                </tbody>
              </table>
            </div>
          `,
          true
        )
            : ""
        }

        ${dashboardDetailPanel(
          dashboardVariant === "usuario" ? "Mi carga operativa" : "Carga por usuario",
          "Detalle",
          `
            <div class="table-card calendar-table-card dashboard-table-card">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Empresas asignadas</th>
                    <th>Pendientes</th>
                    <th>En proceso</th>
                    <th>Completadas</th>
                    <th>Vencidas</th>
                    <th>Alertas criticas</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    (dashboardVariant === "usuario" ? workloadByUser.filter((item) => item === myWorkload) : workloadByUser)
                      .map(
                        (item) => `
                          <tr>
                            <td><strong>${escapeHtml(item.usuario || "-")}</strong></td>
                            <td>${escapeHtml(String(item.empresasAsignadas || 0))}</td>
                            <td>${escapeHtml(String(item.tareasPendientes || 0))}</td>
                            <td>${escapeHtml(String(item.tareasEnProceso || 0))}</td>
                            <td>${escapeHtml(String(item.tareasCompletadas || 0))}</td>
                            <td>${escapeHtml(String(item.tareasVencidas || 0))}</td>
                            <td>${escapeHtml(String(item.alertasCriticas || 0))}</td>
                          </tr>
                        `
                      )
                      .join("") || '<tr><td colspan="7" class="muted">No hay carga operativa visible.</td></tr>'
                  }
                </tbody>
              </table>
            </div>
          `
        )}

        ${dashboardDetailPanel(
          dashboardVariant === "usuario" ? "Mis alertas criticas" : "Todas las alertas criticas",
          "Detalle",
          `
            <div class="table-card calendar-table-card dashboard-table-card">
              <table>
                <thead>
                  <tr>
                    <th>Mensaje</th>
                    <th>Empresa</th>
                    <th>Responsable</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    criticalAlerts
                      .map(
                        (alert) => `
                          <tr>
                            <td><strong>${escapeHtml(alert.mensaje || "Alerta critica")}</strong></td>
                            <td>${escapeHtml(alert.empresa || alert.empresaId || "-")}</td>
                            <td>${escapeHtml(alert.responsable || alert.responsableId || "Sin responsable")}</td>
                            <td>${escapeHtml(formatDateLabel(alert.fechaVencimiento))}</td>
                            <td><span class="${statusClass(alert.estado || "no_leida")}">${escapeHtml(alertStatusLabel(alert.estado || "no_leida"))}</span></td>
                          </tr>
                        `
                      )
                      .join("") || '<tr><td colspan="5" class="muted">No hay alertas criticas pendientes.</td></tr>'
                  }
                </tbody>
              </table>
            </div>
          `
        )}
      </section>
    </section>
  `;
}

function accessDeniedSection() {
  return `
    <section class="panel-card">
      <div class="eyebrow">Acceso denegado</div>
      <h3 class="section-title">No tienes permisos para entrar a esta vista.</h3>
      <p class="muted">
        Tu rol actual solo puede acceder a los modulos habilitados por permisos y empresas asignadas.
      </p>
    </section>
  `;
}

function portalClienteSection() {
  const company = state.companies[0] || null;
  const visibleTasks = state.fiscalTasks.filter((task) => task.visibleParaCliente === true || task.tipoTarea === "cliente");
  const visibleObligations = state.companyObligations.slice(0, 6);

  return `
    <section class="panel-card">
      <div class="eyebrow">Portal cliente</div>
      <h3 class="section-title">Seguimiento compartido</h3>
      <p class="muted">Consulta tu empresa, obligaciones visibles y documentos compartidos desde una vista aislada del modulo interno.</p>
    </section>
    <section class="stats-grid fiscal-stats-grid">
      <article class="stat-card">
        <div class="eyebrow">Mi empresa</div>
        <div class="stat-value">${escapeHtml(company?.razonSocial || "Sin empresa asociada")}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Obligaciones visibles</div>
        <div class="stat-value">${escapeHtml(String(visibleObligations.length))}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Tareas visibles</div>
        <div class="stat-value">${escapeHtml(String(visibleTasks.length))}</div>
      </article>
    </section>
    ${
      company
        ? `
          <section class="panel-card">
            <div class="panel-header">
              <div>
                <div class="eyebrow">Mi empresa</div>
                <h3 class="section-title">${escapeHtml(company.razonSocial || "Empresa asignada")}</h3>
              </div>
            </div>
            <div class="detail-grid detail-grid-legacy">
              <div class="detail-item"><strong>NIT</strong><span>${escapeHtml(company.nit || "No registrado")}</span></div>
              <div class="detail-item"><strong>Estado</strong><span class="${statusClass(company.estadoEmpresa)}">${escapeHtml(formatStatus(company.estadoEmpresa))}</span></div>
              <div class="detail-item"><strong>Municipio</strong><span>${escapeHtml(company.municipio || "No registrado")}</span></div>
              <div class="detail-item"><strong>Regimen</strong><span>${escapeHtml(company.regimenTributario || "No registrado")}</span></div>
            </div>
          </section>
        `
        : ""
    }
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Obligaciones</div>
          <h3 class="section-title">Obligaciones visibles</h3>
        </div>
      </div>
      <div class="table-card users-table-card">
        <table>
          <thead>
            <tr>
              <th>Obligacion</th>
              <th>Estado</th>
              <th>Periodo</th>
            </tr>
          </thead>
          <tbody>
            ${
              visibleObligations.length
                ? visibleObligations
                    .map(
                      (item) => `
                        <tr>
                          <td>${escapeHtml(item.nombreObligacion || item.impuestoNombre || "Obligacion")}</td>
                          <td><span class="${statusClass(item.estado)}">${escapeHtml(formatStatus(item.estado))}</span></td>
                          <td>${escapeHtml(item.periodo || item.periodicidad || "-")}</td>
                        </tr>
                      `
                    )
                    .join("")
                : '<tr><td colspan="3" class="muted">No hay obligaciones compartidas para este perfil.</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function roleAwarePlaceholderSection(title, description, highlights = []) {
  return `
    <section class="panel-card">
      <div class="eyebrow">${escapeHtml(title)}</div>
      <h3 class="section-title">${escapeHtml(description)}</h3>
      <p class="muted">Modulo pendiente de implementacion completa. Solo se exponen componentes reales y el resto queda bloqueado para evitar falsas capacidades.</p>
    </section>
    ${
      highlights.length
        ? `
          <section class="stats-grid fiscal-stats-grid">
            ${highlights
              .map(
                (item) => `
                  <article class="stat-card">
                    <div class="eyebrow">${escapeHtml(item.label)}</div>
                    <div class="stat-value">${escapeHtml(item.value)}</div>
                  </article>
                `
              )
              .join("")}
          </section>
        `
        : ""
    }
  `;
}

function reportesSection() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next30Days = new Date(today);
  next30Days.setDate(next30Days.getDate() + 30);

  const companiesById = new Map(state.companies.map((company) => [company.id, company]));
  const operationalCompanies = state.companies.filter((company) => company.estadoEmpresa === "activa");
  const trackedObligations = state.companyObligations.filter((item) => !["no_aplica", "inactiva"].includes(item.estado));
  const activeObligations = trackedObligations.filter((item) => item.estado === "activa");
  const fiscalTasks = state.fiscalTasks.filter((task) => task.tipoTarea === "fiscal");
  const overdueTasks = fiscalTasks.filter((task) => task.estadoOperativo === "vencida");
  const upcomingTasks = fiscalTasks
    .filter((task) => {
      if (!task.fechaVencimiento || task.estadoGeneral === "completada" || task.estadoGeneral === "presentada") {
        return false;
      }
      const dueDate = new Date(`${task.fechaVencimiento}T00:00:00`);
      return !Number.isNaN(dueDate.getTime()) && dueDate >= today && dueDate <= next30Days;
    })
    .sort((a, b) => String(a.fechaVencimiento || "").localeCompare(String(b.fechaVencimiento || "")));
  const criticalAlerts = state.internalAlerts.filter((alert) => alert.nivel === "critica" && !isClosedAlert(alert));

  const companySummaries = operationalCompanies
    .map((company) => {
      const obligations = activeObligations.filter((item) => item.empresaId === company.id);
      const tasks = fiscalTasks.filter((task) => task.empresaId === company.id);
      const overdue = tasks.filter((task) => task.estadoOperativo === "vencida").length;
      const nextDueTask = tasks
        .filter((task) => task.fechaVencimiento && !["completada", "presentada", "cancelada"].includes(task.estadoGeneral))
        .sort((a, b) => String(a.fechaVencimiento || "").localeCompare(String(b.fechaVencimiento || "")))[0];

      return {
        company,
        obligationsCount: obligations.length,
        tasksCount: tasks.length,
        overdueCount: overdue,
        nextDueTask
      };
    })
    .sort((a, b) => {
      if (b.overdueCount !== a.overdueCount) {
        return b.overdueCount - a.overdueCount;
      }
      return b.tasksCount - a.tasksCount;
    });

  const topTaxes = Object.values(
    activeObligations.reduce((accumulator, obligation) => {
      const taxName = obligation.impuesto?.nombre || obligation.nombreObligacion || "Impuesto";
      if (!accumulator[taxName]) {
        accumulator[taxName] = {
          taxName,
          obligationsCount: 0,
          tasksCount: 0
        };
      }

      accumulator[taxName].obligationsCount += 1;
      accumulator[taxName].tasksCount += fiscalTasks.filter((task) => task.impuestoId === obligation.impuestoId).length;
      return accumulator;
    }, {})
  )
    .sort((a, b) => b.tasksCount - a.tasksCount || b.obligationsCount - a.obligationsCount)
    .slice(0, 6);

  const topCompany = companySummaries[0] || null;
  const jamani = companySummaries.find((item) => /jamani/i.test(item.company?.razonSocial || ""));
  const selectedReportCompanyId = state.reportFilters.companyId || operationalCompanies[0]?.id || "";
  const selectedReportCompany = operationalCompanies.find((company) => company.id === selectedReportCompanyId) || null;

  return `
    <section class="panel-card">
      <div class="panel-header section-top">
        <div>
          <div class="eyebrow">Reportes ejecutivos</div>
          <h3 class="section-title">Estado real del portafolio tributario</h3>
        </div>
      </div>
      <p class="muted">
        Este corte consolida empresas activas, obligaciones aplicables, vencimientos y alertas operativas segun la informacion actualmente cargada en el sistema.
      </p>
      ${
        hasPermission("exportar_reportes")
          ? renderAppFilterCard({
              title: "Exportacion de reportes",
              description: "Selecciona la empresa para generar un reporte cliente con el mismo alcance visible en el sistema.",
              fields: `
                <label class="app-filter-field app-filter-field-tax">
                  <span class="app-filter-label">Empresa</span>
                  <select class="app-filter-select" data-report-company-select>
                    ${operationalCompanies
                      .map(
                        (company) => `
                          <option value="${escapeHtml(company.id)}" ${company.id === selectedReportCompanyId ? "selected" : ""}>
                            ${escapeHtml(company.razonSocial)}
                          </option>
                        `
                      )
                      .join("")}
                  </select>
                </label>
              `,
              actions: `
                <button class="btn btn-primary app-filter-button" type="button" data-action="download-client-report" ${selectedReportCompany ? "" : "disabled"}>
                  Generar reporte cliente
                </button>
              `,
              gridClass: "app-filter-grid app-filter-grid-report"
            })
          : ""
      }
      ${
        selectedReportCompany
          ? `<div class="summary-list-card" style="margin-top: 16px;">
              <strong>Empresa seleccionada para exportar:</strong>
              <span>${escapeHtml(selectedReportCompany.razonSocial)}</span>
            </div>`
          : ""
      }
    </section>

    <section class="stats-grid fiscal-stats-grid">
      <article class="stat-card">
        <div class="eyebrow">Empresas activas</div>
        <div class="stat-value">${escapeHtml(String(operationalCompanies.length))}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Obligaciones activas</div>
        <div class="stat-value">${escapeHtml(String(activeObligations.length))}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Vencimientos proximos</div>
        <div class="stat-value">${escapeHtml(String(upcomingTasks.length))}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Tareas vencidas</div>
        <div class="stat-value">${escapeHtml(String(overdueTasks.length))}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Alertas criticas</div>
        <div class="stat-value">${escapeHtml(String(criticalAlerts.length))}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Alcance del usuario</div>
        <div class="stat-value">${escapeHtml(hasPermission("ver_todas_empresas") ? "Global" : "Asignado")}</div>
      </article>
    </section>

    <section class="detail-grid" style="margin-top: 20px;">
      <article class="panel-card">
        <div class="eyebrow">Lectura ejecutiva</div>
        <h4 class="section-title">Resumen del periodo</h4>
        <div class="summary-list-card">
          <strong>Cobertura tributaria:</strong>
          <span>${escapeHtml(`${activeObligations.length} obligaciones activas y ${fiscalTasks.length} tareas fiscales programadas para seguimiento.`)}</span>
        </div>
        <div class="summary-list-card">
          <strong>Prioridad operativa:</strong>
          <span>${escapeHtml(
            topCompany
              ? `${topCompany.company.razonSocial} concentra ${topCompany.overdueCount} vencimientos y ${topCompany.tasksCount} tareas trazables.`
              : "Todavia no hay empresas activas con seguimiento fiscal cargado."
          )}</span>
        </div>
        <div class="summary-list-card">
          <strong>Empresa Jamani:</strong>
          <span>${escapeHtml(
            jamani
              ? `Registra ${jamani.obligationsCount} obligaciones activas y ${jamani.tasksCount} tareas visibles en calendario.`
              : "No se encontro una empresa Jamani activa dentro del alcance actual."
          )}</span>
        </div>
      </article>

      <article class="panel-card">
        <div class="eyebrow">Cobertura por impuesto</div>
        <h4 class="section-title">Impuestos con mayor carga operativa</h4>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Impuesto</th>
                <th>Obligaciones activas</th>
                <th>Tareas programadas</th>
              </tr>
            </thead>
            <tbody>
              ${
                topTaxes.length
                  ? topTaxes
                      .map(
                        (item) => `
                          <tr>
                            <td>${escapeHtml(item.taxName)}</td>
                            <td>${escapeHtml(String(item.obligationsCount))}</td>
                            <td>${escapeHtml(String(item.tasksCount))}</td>
                          </tr>
                        `
                      )
                      .join("")
                  : '<tr><td colspan="3" class="muted">Aun no hay obligaciones activas relacionadas con calendarios.</td></tr>'
              }
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section class="panel-card" style="margin-top: 20px;">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Empresas</div>
          <h4 class="section-title">Cobertura y proximo vencimiento por empresa</h4>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Estado</th>
              <th>Obligaciones activas</th>
              <th>Tareas</th>
              <th>Vencidas</th>
              <th>Proximo vencimiento</th>
            </tr>
          </thead>
          <tbody>
            ${
              companySummaries.length
                ? companySummaries
                    .map(
                      (item) => `
                        <tr>
                          <td>${escapeHtml(item.company.razonSocial)}</td>
                          <td><span class="${statusClass(item.company.estadoEmpresa)}">${escapeHtml(formatStatus(item.company.estadoEmpresa))}</span></td>
                          <td>${escapeHtml(String(item.obligationsCount))}</td>
                          <td>${escapeHtml(String(item.tasksCount))}</td>
                          <td>${escapeHtml(String(item.overdueCount))}</td>
                          <td>${escapeHtml(item.nextDueTask ? formatDateLabel(item.nextDueTask.fechaVencimiento) : "Sin programacion")}</td>
                        </tr>
                      `
                    )
                    .join("")
                : '<tr><td colspan="6" class="muted">Todavia no hay empresas activas para consolidar en reportes.</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel-card" style="margin-top: 20px;">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Agenda fiscal</div>
          <h4 class="section-title">Proximos vencimientos visibles en calendario</h4>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Empresa</th>
              <th>Tarea</th>
              <th>Impuesto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${
              upcomingTasks.length
                ? upcomingTasks
                    .slice(0, 12)
                    .map(
                      (task) => `
                        <tr>
                          <td>${escapeHtml(formatDateLabel(task.fechaVencimiento))}</td>
                          <td>${escapeHtml(companiesById.get(task.empresaId)?.razonSocial || "Empresa")}</td>
                          <td>${escapeHtml(task.titulo || task.descripcion || "Tarea fiscal")}</td>
                          <td>${escapeHtml(task.impuestoNombre || "No definido")}</td>
                          <td><span class="${statusClass(task.estadoOperativo)}">${escapeHtml(formatStatus(task.estadoOperativo))}</span></td>
                        </tr>
                      `
                    )
                    .join("")
                : '<tr><td colspan="5" class="muted">No hay vencimientos proximos dentro de los siguientes 30 dias.</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function configuracionSection() {
  return `
    ${roleAwarePlaceholderSection("Configuracion", "Configuracion global y tecnica del sistema.", [
      { label: "Editar configuracion", value: hasPermission("editar_configuracion") ? "Si" : "No" },
      { label: "Configurar portal", value: hasPermission("configurar_portal_cliente") ? "Si" : "No" },
      { label: "Roles y permisos", value: hasPermission("configurar_roles_permisos") ? "Si" : "No" }
    ])}
    ${fiscalConfigurationSection()}
  `;
}

function auditoriaSection() {
  const items = Array.isArray(state.audits) ? state.audits : [];

  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Auditoria</div>
          <h3 class="section-title">Trazabilidad operativa del sistema</h3>
          <p class="muted">Consulta solo de lectura sobre eventos auditados. Logs tecnicos avanzados siguen pendientes de implementacion.</p>
        </div>
      </div>
    </section>
    <section class="stats-grid fiscal-stats-grid">
      <article class="stat-card">
        <div class="eyebrow">Eventos visibles</div>
        <div class="stat-value">${escapeHtml(String(items.length))}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Ver auditoria</div>
        <div class="stat-value">${hasPermission("ver_auditoria") ? "Si" : "No"}</div>
      </article>
      <article class="stat-card">
        <div class="eyebrow">Ver logs</div>
        <div class="stat-value">${hasPermission("ver_logs_sistema") ? "Si" : "No"}</div>
      </article>
    </section>
    <section class="panel-card" style="margin-top: 20px;">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Eventos</div>
          <h4 class="section-title">Ultimos eventos auditados</h4>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Modulo</th>
              <th>Accion</th>
              <th>Descripcion</th>
            </tr>
          </thead>
          <tbody>
            ${
              items.length
                ? items
                    .map(
                      (item) => `
                        <tr>
                          <td>${escapeHtml(formatDateLabel(item.fecha))}</td>
                          <td>${escapeHtml(item.usuario?.nombreCompleto || item.usuarioId || "Sistema")}</td>
                          <td>${escapeHtml(formatStatus(item.modulo || "-"))}</td>
                          <td>${escapeHtml(formatStatus(item.accion || "-"))}</td>
                          <td>${escapeHtml(item.descripcion || "-")}</td>
                        </tr>
                      `
                    )
                    .join("")
                : '<tr><td colspan="5" class="muted">Todavia no hay eventos auditados visibles para este perfil.</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function respaldosSection() {
  return roleAwarePlaceholderSection("Respaldos", "Continuidad operativa y respaldos del sistema.", [
    { label: "Ver respaldos", value: hasPermission("ver_respaldos") ? "Si" : "No" },
    { label: "Ejecutar respaldo", value: hasPermission("ejecutar_respaldo") ? "Si" : "No" },
    { label: "Rol activo", value: state.currentUser?.primaryRoleLabel || "Usuario" }
  ]);
}

function render() {
  const app = document.querySelector("#app");
  if (!state.currentUser) {
    app.innerHTML = renderAuthView();
    bindEvents();
    return;
  }

  const theme = state.bootstrap?.organization?.temaVisual;
  if (theme) {
    applyTheme(theme);
  }

  const isRutView = state.activeView === "rut";
  const isUsersView = state.activeView === "users";
  const isDashboardView = state.activeView === "dashboard";
  const isPortalView = state.activeView === "portal-cliente";
  const isReportsView = state.activeView === "reportes";
  const isConfigView = state.activeView === "configuracion";
  const isAuditView = state.activeView === "auditoria";
  const isBackupView = state.activeView === "respaldos";
  const showAccessDenied = Boolean(state.accessDeniedView);
  const fiscalSection = state.activeView === "fiscal-calendar" ? getFiscalSectionConfig() : null;
  const rutDocumentsView = isRutView && isRutDocumentsView();
  const pageTitle = showAccessDenied
    ? "Acceso denegado"
    : isPortalView
    ? "Portal cliente"
    : isReportsView
      ? "Reportes"
    : isConfigView
      ? "Configuracion"
    : isAuditView
      ? "Auditoria"
    : isBackupView
      ? "Respaldos"
    : isDashboardView
      ? "Dashboard"
      : isUsersView
        ? "Usuarios y permisos"
        : isRutView
          ? rutDocumentsView
            ? "RUT"
            : "Empresas"
          : fiscalSection?.title || "Calendario fiscal";
  const pageDescription = isUsersView
    ? "Gestion interna de perfiles, roles, permisos y empresas asignadas."
    : showAccessDenied
      ? "Tu sesion no tiene permiso para abrir la vista solicitada."
    : isPortalView
      ? "Vista aislada para clientes con informacion compartida y acciones visibles."
    : isReportsView
      ? "Reportes visibles segun permisos y alcance del rol."
    : isConfigView
      ? "Configuracion separada para administracion y perfiles autorizados."
    : isAuditView
      ? "Consulta de auditoria y trazabilidad para perfiles autorizados."
    : isBackupView
      ? "Continuidad operativa y control de respaldos."
    : isDashboardView
      ? ""
    : isRutView
      ? rutDocumentsView
        ? "Carga y validacion documental del RUT."
        : "Listado y detalle de empresas registradas en el sistema."
      : fiscalSection?.description || "Gestion fiscal operativa y de calendario segun tu alcance.";
  const userRoleLabel = state.currentUser?.primaryRoleLabel || state.currentUser?.roleLabels?.[0] || state.currentUser?.roles?.[0] || "Usuario";
  const quickItems = getVisibleMenuItems().filter((item) => item.id !== "users").slice(0, 3);

  app.innerHTML = `
    <div class="app-shell phase-one">
      <aside class="sidebar">
        <div class="brand-block">
          <div class="brand-name">${escapeHtml(state.bootstrap?.organization?.temaVisual?.nombreComercial || "ContaSolutions")}</div>
          <div class="brand-tagline">${escapeHtml(state.bootstrap?.organization?.temaVisual?.eslogan || "")}</div>
        </div>
        ${renderSidebarNavigationV2()}
        ${
          quickItems.length
            ? `
              <div class="quick-links-shell">
                <div class="quick-links-title">Accesos rapidos</div>
                <div class="quick-list">
                  ${quickItems
                    .map(
                      (item) => `
                        <button
                          class="quick-item quick-card"
                          type="button"
                          data-view="${escapeHtml(item.id)}"
                          data-sidebar-key="${escapeHtml(item.key)}"
                          ${item.fiscalTab ? `data-target-fiscal-tab="${escapeHtml(item.fiscalTab)}"` : ""}
                        >
                          <span class="quick-card-icon">${renderSidebarIcon(item.icon)}</span>
                          <span class="quick-card-copy">
                            <strong>${escapeHtml(item.label)}</strong>
                            <span>${escapeHtml(item.id === "portal-cliente" ? "Acceso compartido" : "Ir al modulo")}</span>
                          </span>
                          <span class="quick-card-arrow">${renderSidebarIcon("chevronRight")}</span>
                        </button>
                      `
                    )
                    .join("")}
                </div>
              </div>
            `
            : ""
        }
        ${isRutView ? `<div class="sidebar-flow-shell"><div class="quick-links-title">Flujo guiado</div>${renderSidebarStepper()}</div>` : ""}
        <div class="sidebar-user-card">
          <div class="sidebar-user-copy">
            <span class="sidebar-user-eyebrow">Sesion activa</span>
            <strong>${escapeHtml(state.currentUser?.nombreCompleto || "Usuario")}</strong>
            <span>${escapeHtml(userRoleLabel)}</span>
          </div>
          <button class="btn btn-secondary" id="logout-button" type="button">Salir</button>
        </div>
      </aside>
      <main class="main-panel">
        <section class="topbar">
          ${pageDescription ? `<div class="search-box">${escapeHtml(pageDescription)}</div>` : `<div></div>`}
          <div class="user-chip">${escapeHtml(state.currentUser?.nombreCompleto || "Usuario")} - ${escapeHtml(userRoleLabel)}</div>
        </section>
        ${
          isDashboardView || isRutView
            ? ""
            : `
              <section class="panel-card">
                <div class="eyebrow">${escapeHtml(isPortalView ? "Portal cliente" : isUsersView ? "Modulo seguridad" : isReportsView || isConfigView || isAuditView || isBackupView ? "Modulo administrativo" : isRutView ? "Modulo operativo" : "Modulo fiscal")}</div>
                <h2 class="hero-title small">${escapeHtml(pageTitle)}</h2>
              </section>
            `
        }
        ${
          showAccessDenied
            ? accessDeniedSection()
            : isPortalView
              ? portalClienteSection()
            : isReportsView
              ? reportesSection()
            : isConfigView
              ? configuracionSection()
            : isAuditView
              ? auditoriaSection()
            : isBackupView
              ? respaldosSection()
            : isDashboardView
            ? dashboardSection()
            : isUsersView
            ? usersSection()
            : isRutView
            ? rutWorkspaceSection()
            : fiscalCalendarViewV2()
        }
      </main>
    </div>
  `;

  bindEvents();
}

function parseResponsibilitiesInput(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d{2})\s*-\s*(.+)$/);
      return {
        codigo: match?.[1] || "",
        nombre: (match?.[2] || line).trim(),
        fuenteTexto: line
      };
    });
}

function formToObject(form) {
  const formData = new FormData(form);
  const payload = {
    representanteLegalPrincipal: {}
  };

  for (const section of MAIN_SECTIONS) {
    for (const field of section.fields) {
      if (field.type === "select") {
        setValue(payload, field.name, formData.get(field.name));
      } else {
        setValue(payload, field.name, formData.get(field.name));
      }
    }
  }

  for (const field of ADVANCED_FIELDS) {
    setValue(payload, field.name, formData.get(field.name));
  }

  for (const flag of RESPONSIBILITY_FLAGS) {
    payload[flag.name] = form.querySelector(`[name="${flag.name}"]`)?.checked || false;
  }

  payload.responsabilidadesTributarias = parseResponsibilitiesInput(formData.get("responsabilidadesTributarias"));
  payload.actividadEconomicaPrincipal = formData.get("actividadEconomicaPrincipal");
  payload.actividadEconomicaPrincipalFuente = formData.get("actividadEconomicaPrincipalFuente");
  payload.fechaGeneracionRut = formData.get("fechaGeneracionRut");
  payload.paginasDetectadas = formData.get("paginasDetectadas");
  payload.textoExtraidoPreview = formData.get("textoExtraidoPreview");

  if (!payload.tipoContribuyente) {
    payload.tipoContribuyente = "Pendiente de revision";
  }

  return payload;
}

function userFormToPayload(form) {
  const formData = new FormData(form);
  const roles = formData.getAll("roles").map((item) => String(item).trim()).filter(Boolean);
  const selectedRole = roles[0] || "";
  const payload = {
    nombre: String(formData.get("nombre") || "").trim(),
    apellido: String(formData.get("apellido") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    cargo: String(formData.get("cargo") || "").trim(),
    estado: String(formData.get("estado") || "activo").trim(),
    password: String(formData.get("password") || ""),
    roles,
    permisos: String(formData.get("permisosTexto") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    empresasAsignadas: formData.getAll("empresasAsignadas").map((item) => String(item).trim()).filter(Boolean),
    supervisorId: String(formData.get("supervisorId") || "").trim(),
    supervisedUsers: formData.getAll("supervisedUsers").map((item) => String(item).trim()).filter(Boolean)
  };

  if (roles.length !== 1) {
    throw new Error("Debes seleccionar exactamente un rol principal.");
  }

  if (!canRoleHaveAssignedCompanies(selectedRole)) {
    payload.empresasAsignadas = [];
  }

  if (roleNeedsSupervisor(selectedRole) && !payload.supervisorId) {
    throw new Error("Este rol requiere un supervisor directo.");
  }

  if (!roleNeedsSupervisor(selectedRole)) {
    payload.supervisorId = "";
  }

  if (!roleCanBeSupervisor(selectedRole)) {
    payload.supervisedUsers = [];
  }

  return payload;
}

function bindSelectionCardInputs() {
  document.querySelectorAll(".selection-card input").forEach((input) => {
    const syncCheckedState = () => {
      const groupInputs = document.querySelectorAll(`.selection-card input[name="${input.name}"]`);
      groupInputs.forEach((groupInput) => {
        groupInput.closest(".selection-card")?.classList.toggle("selection-card-selected", groupInput.checked);
      });
    };

    syncCheckedState();
    input.addEventListener("change", syncCheckedState);
  });
}

function bindEvents() {
  document.querySelector("#login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.authMessage = null;
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetchJson("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password")
        })
      });

      persistAuthToken(response.token);
      state.currentUser = response.user;
      state.accessDeniedView = "";
      state.authMessage = "Sesion iniciada correctamente.";
      await loadAuthenticatedApp();
      return;
    } catch (error) {
      state.authMessage = error.message;
    }

    render();
  });

  document.querySelector("#logout-button")?.addEventListener("click", async () => {
    try {
      await fetchJson("/api/auth/logout", {
        method: "POST"
      });
    } catch {
      // Si la sesion ya expiro, igual limpiamos estado local.
    }

    persistAuthToken("");
    state.currentUser = null;
    state.bootstrap = null;
    state.selectedCompany = null;
    state.accessDeniedView = "";
    state.users = [];
    state.authMessage = null;
    render();
  });

  document.querySelector("#upload-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.uploadMessage = null;
    state.saveMessage = null;
    state.showTextModal = false;
    const input = document.querySelector("#rutPdf");
    const file = input?.files?.[0];

    if (!file) {
      state.uploadMessage = "Debes seleccionar un archivo PDF.";
      render();
      return;
    }

    const formData = new FormData();
    formData.append("rutPdf", file);

    try {
      const extraction = await fetchJson("/api/rut-uploads", {
        method: "POST",
        body: formData
      });

      state.currentExtraction = await fetchJson(`/api/rut-uploads/${extraction.extractionId}`);
      state.uploadMessage = `PDF cargado correctamente. Estado de extraccion: ${state.currentExtraction.estadoExtraccion}.`;
    } catch (error) {
      state.uploadMessage = error.message;
    }

    render();
  });

  document.querySelectorAll("[data-rut-flow-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.rutFlowMode = button.getAttribute("data-rut-flow-mode") || "create";
      if (state.rutFlowMode === "create") {
        state.rutTargetCompanyId = "";
      } else if (state.selectedCompany?.id) {
        state.rutTargetCompanyId = state.selectedCompany.id;
      }
      state.uploadMessage = null;
      state.saveMessage = null;
      render();
    });
  });

  document.querySelector("#rut-target-company")?.addEventListener("change", (event) => {
    state.rutTargetCompanyId = String(event.currentTarget.value || "");
  });

  document.querySelector("#review-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.saveMessage = null;
    const payload = formToObject(event.currentTarget);
    const missing = REQUIRED_FIELDS.filter((field) => !String(getValue(payload, field) || "").trim());

    if (!state.currentExtraction?.documento?.id) {
      missing.push("documentoRut");
    }

    if (missing.length > 0) {
      state.saveMessage = "Completa los campos obligatorios antes de crear la empresa.";
      render();
      return;
    }

    payload.rutFlowMode = state.rutFlowMode;
    const matchedCompany = findRutMatchedCompany(payload);
    const targetCompanyId = state.rutTargetCompanyId || matchedCompany?.id || "";

    if (state.rutFlowMode === "update") {
      if (!targetCompanyId) {
        state.saveMessage = "No se encontro una empresa existente para actualizar. Selecciona una empresa o usa Crear desde RUT.";
        render();
        return;
      }
      payload.existingCompanyId = targetCompanyId;
    }

    try {
      const company = await fetchJson(`/api/rut-uploads/${state.currentExtraction.id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      state.saveMessage =
        state.rutFlowMode === "update"
          ? "Empresa actualizada correctamente desde RUT con revision humana."
          : "Empresa creada correctamente desde RUT con revision humana.";
      state.selectedCompany = company;
      state.currentExtraction = null;
      state.uploadMessage = null;
      state.rutTargetCompanyId = company.id;
      const companiesResponse = await fetchJson("/api/companies");
      state.companies = companiesResponse.items;
    } catch (error) {
      state.saveMessage = error.message;
    }

    render();
  });

  document.querySelector("#toggle-text-modal")?.addEventListener("click", () => {
    state.showTextModal = true;
    render();
  });

  document.querySelector("#close-text-modal")?.addEventListener("click", () => {
    state.showTextModal = false;
    render();
  });

  document.querySelector("#text-modal-close")?.addEventListener("click", (event) => {
    if (event.target.id === "text-modal-close") {
      state.showTextModal = false;
      render();
    }
  });

  document.querySelector("#advanced-toggle")?.parentElement?.addEventListener("toggle", (event) => {
    state.advancedOpen = event.currentTarget.open;
  });

  document.querySelectorAll("[data-view-company-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.saveMessage = null;
        await loadCompany(button.getAttribute("data-view-company-id"));
        state.fiscalFilters.assignmentCompanyId = button.getAttribute("data-view-company-id");
      } catch (error) {
        state.saveMessage = toUserMessage(error, getActionErrorMessage("loadCompany"));
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="analyze-obligations"]').forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.saveMessage = null;
        const result = await fetchJson(`/api/companies/${button.getAttribute("data-company-id")}/analyze-obligations`, {
          method: "POST"
        });
        await refreshFiscalTasks();
        await refreshInternalAlerts();
        await refreshCompanyContext();
        state.saveMessage = `Obligaciones analizadas correctamente. Se detectaron ${result?.createdCount || 0} nuevas obligaciones y ${result?.taskGeneration?.createdCount || 0} tareas quedaron programadas en calendario.`;
      } catch (error) {
        state.saveMessage = toUserMessage(error, getActionErrorMessage("analyzeObligations"));
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="approve-company"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const companyId = button.getAttribute("data-company-id");

      if (!window.confirm("Se activara la empresa y quedara habilitada para operacion. Deseas continuar?")) {
        return;
      }

      try {
        state.saveMessage = null;
        const result = await fetchJson(`/api/companies/${companyId}/approve-review`, {
          method: "PATCH"
        });
        await refreshFiscalTasks();
        await refreshInternalAlerts();
        await refreshCompanyContext();
        state.saveMessage = `Empresa activada correctamente. Se programaron ${result?.taskGeneration?.createdCount || 0} tareas fiscales para el calendario operativo.`;
      } catch (error) {
        state.saveMessage = toUserMessage(error, getActionErrorMessage("approveCompany"));
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="confirm-obligation"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const { obligationId, errorMessage } = getObligationIdOrMessage(button);
      if (!obligationId) {
        state.saveMessage = errorMessage;
        render();
        return;
      }

      try {
        state.saveMessage = null;
        const result = await fetchJson(`/api/company-obligations/${obligationId}/confirm`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        });
        await refreshFiscalTasks();
        await refreshInternalAlerts();
        await refreshCompanyContext();
        state.saveMessage = `Obligacion confirmada correctamente. Se generaron ${result?.taskGeneration?.createdCount || 0} tareas asociadas en calendario.`;
      } catch (error) {
        state.saveMessage = toUserMessage(error, getActionErrorMessage("confirmObligation"));
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="not-applicable-obligation"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const { obligationId, errorMessage } = getObligationIdOrMessage(button);
      if (!obligationId) {
        state.saveMessage = errorMessage;
        render();
        return;
      }

      try {
        state.saveMessage = null;
        await fetchJson(`/api/company-obligations/${obligationId}/not-applicable`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        });
        await refreshCompanyContext();
        state.saveMessage = "Obligacion marcada como no aplica.";
      } catch (error) {
        state.saveMessage = toUserMessage(error, getActionErrorMessage("notApplicableObligation"));
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="review-obligation"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const { obligationId, errorMessage } = getObligationIdOrMessage(button);
      if (!obligationId) {
        state.saveMessage = errorMessage;
        render();
        return;
      }

      try {
        state.saveMessage = null;
        await fetchJson(`/api/company-obligations/${obligationId}/review`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        });
        await refreshCompanyContext();
        state.saveMessage = "Obligacion enviada a revision.";
      } catch (error) {
        state.saveMessage = toUserMessage(error, getActionErrorMessage("reviewObligation"));
      }

      render();
    });
  });

  document.querySelector("[data-report-company-select]")?.addEventListener("change", (event) => {
    state.reportFilters.companyId = event.currentTarget.value;
    render();
  });

  document.querySelector('[data-action="download-client-report"]')?.addEventListener("click", async () => {
    const companyId = state.reportFilters.companyId || state.companies.find((company) => company.estadoEmpresa === "activa")?.id || "";

    if (!companyId) {
      state.saveMessage = "Debes seleccionar una empresa activa para generar el reporte.";
      render();
      return;
    }

    try {
      state.saveMessage = null;
      await downloadAuthenticatedFile(`/api/reports/client-summary?companyId=${encodeURIComponent(companyId)}`, "reporte-cliente.html");
      const company = state.companies.find((item) => item.id === companyId);
      state.saveMessage = `Reporte generado correctamente para ${company?.razonSocial || "la empresa seleccionada"}.`;
    } catch (error) {
      state.saveMessage = toUserMessage(error, "No se pudo generar el reporte del cliente.");
    }

    render();
  });

  document.querySelector("#fiscal-calendar-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.calendarMessage = null;
    state.fiscalGenerationSummary = null;
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const editingCalendarId = state.fiscalModal?.payload?.calendar?.id;

    try {
      await fetchJson(editingCalendarId ? `/api/fiscal-calendars/${editingCalendarId}` : "/api/fiscal-calendars", {
        method: editingCalendarId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      await refreshFiscalCalendars();
      state.calendarMessage = editingCalendarId
        ? "Calendario fiscal actualizado correctamente."
        : "Calendario fiscal creado correctamente.";
      closeFiscalModal();
    } catch (error) {
      state.calendarMessage = toUserMessage(error, getActionErrorMessage(editingCalendarId ? "updateCalendar" : "createCalendar"));
    }

    render();
  });

  document.querySelectorAll('[data-action="activate-calendar"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const calendarId = button.getAttribute("data-calendar-id");

      try {
        state.calendarMessage = null;
        await fetchJson(`/api/fiscal-calendars/${calendarId}/activate`, {
          method: "PATCH"
        });
        await refreshFiscalCalendars();
        state.calendarMessage = "Calendario fiscal activado correctamente.";
      } catch (error) {
        state.calendarMessage = toUserMessage(error, getActionErrorMessage("activateCalendar"));
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="edit-calendar"]').forEach((button) => {
    button.addEventListener("click", () => {
      const calendarId = button.getAttribute("data-calendar-id");
      const calendar = state.fiscalCalendars.find((item) => item.id === calendarId);

      if (!calendar) {
        state.calendarMessage = "No se pudo cargar el calendario seleccionado para editar.";
        render();
        return;
      }

      openFiscalModal("calendar", { calendar });
      render();
    });
  });

  document.querySelectorAll('[data-action="delete-calendar"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const calendarId = button.getAttribute("data-calendar-id");

      if (!calendarId) {
        state.calendarMessage = "No se pudo identificar el calendario fiscal que deseas eliminar.";
        render();
        return;
      }

      if (!window.confirm("Esta accion eliminara solo este registro del calendario fiscal. Deseas continuar?")) {
        return;
      }

      try {
        state.calendarMessage = null;
        await fetchJson(`/api/fiscal-calendars/${calendarId}`, {
          method: "DELETE"
        });
        await refreshFiscalCalendars();
        state.calendarMessage = "Calendario fiscal eliminado correctamente.";
      } catch (error) {
        state.calendarMessage = toUserMessage(error, getActionErrorMessage("deleteCalendar"));
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="generate-fiscal-tasks"]').forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.calendarMessage = null;
        state.fiscalGenerationSummary = null;
        const summary = await fetchJson("/api/fiscal-calendars/generate-tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            companyId: state.fiscalFilters.generationCompanyId || undefined,
            anio: state.fiscalFilters.generationYear || undefined,
            impuestoId: state.fiscalFilters.generationTaxId || undefined
          })
        });
        state.fiscalGenerationSummary = summary;
        state.calendarMessage = "Tareas fiscales generadas correctamente.";
        await refreshFiscalCalendars();
        await refreshFiscalTasks();
        await refreshInternalAlerts();
        await refreshCompanyContext();
        closeFiscalModal();
      } catch (error) {
        state.calendarMessage = toUserMessage(error, getActionErrorMessage("generateFiscalTasks"));
      }

      render();
    });
  });

  document.querySelector("#tax-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.calendarMessage = null;
    const formData = new FormData(event.currentTarget);
    const payload = {
      codigo: formData.get("codigo"),
      nombre: formData.get("nombre"),
      nivel: formData.get("nivel"),
      descripcion: formData.get("descripcion"),
      periodicidadDefault: formData.get("periodicidadDefault"),
      requiereMunicipio: event.currentTarget.querySelector('[name="requiereMunicipio"]')?.checked || false,
      requiereDepartamento: event.currentTarget.querySelector('[name="requiereDepartamento"]')?.checked || false,
      aplicaPorNit: event.currentTarget.querySelector('[name="aplicaPorNit"]')?.checked || false,
      aplicaPorDv: event.currentTarget.querySelector('[name="aplicaPorDv"]')?.checked || false,
      estado: formData.get("estado")
    };

    try {
      if (state.editingTaxId) {
        const currentTax = getEditingTax();
        let shouldPropagate = false;

        if (currentTax && currentTax.periodicidadDefault !== payload.periodicidadDefault) {
          let impact = null;
          try {
            impact = await previewTaxImpact(state.editingTaxId, payload);
          } catch (previewError) {
            const previewMessage = String(previewError?.message || "").toLowerCase();
            if (!previewMessage.includes("ruta no encontrada")) {
              throw previewError;
            }
          }

          if (impact) {
            const impactedNames = (impact.affectedCompanies || []).slice(0, 4).join(", ");
            const impactedSuffix = impact.affectedCompaniesCount > 4 ? "..." : "";
            const historyNote = impact.blockedObligationsCount
              ? `\n${impact.blockedObligationsCount} obligaciones con historial presentado no se tocaran para proteger el historico.`
              : "";
            const calendarNote = impact.activeCalendarsCount
              ? `\nLos calendarios activos (${impact.activeCalendarsCount}) se revisan aparte en Calendario fiscal.`
              : "";

            shouldPropagate = window.confirm(
              [
                `Este impuesto se relaciona con ${impact.affectedCompaniesCount} empresas y ${impact.affectedObligationsCount} obligaciones abiertas que aun no se han marcado como presentadas.`,
                impactedNames ? `Empresas impactadas: ${impactedNames}${impactedSuffix}` : "",
                "Deseas actualizar esas empresas para aplicar la nueva periodicidad en el flujo futuro?",
                historyNote,
                calendarNote
              ]
                .filter(Boolean)
                .join("\n")
            );
          } else {
            shouldPropagate = window.confirm(
              "La periodicidad del impuesto cambio. Deseas guardar el impuesto y propagar la nueva periodicidad a las obligaciones abiertas cuando el servidor lo permita?"
            );
          }

          if (!shouldPropagate) {
            return;
          }
        }

        const response = await fetchJson(`/api/taxes/${state.editingTaxId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...payload,
            aplicarCambiosAEmpresas: shouldPropagate
          })
        });
        state.calendarMessage = response?.propagation?.propagatedObligationsCount
          ? `Impuesto actualizado correctamente. Se propagaron cambios a ${response.propagation.propagatedObligationsCount} obligaciones abiertas.`
          : "Impuesto actualizado correctamente.";
      } else {
        await fetchJson("/api/taxes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        state.calendarMessage = "Impuesto creado correctamente.";
      }

      state.editingTaxId = null;
      await refreshTaxes();
      closeFiscalModal();
    } catch (error) {
      state.calendarMessage = toUserMessage(error, getActionErrorMessage(state.editingTaxId ? "updateTax" : "createTax"));
    }

    render();
  });

  document.querySelectorAll('[data-action="edit-tax"]').forEach((button) => {
    button.addEventListener("click", () => {
      state.editingTaxId = button.getAttribute("data-tax-id");
      openFiscalModal("tax");
      render();
    });
  });

  document.querySelectorAll('[data-action="toggle-tax-state"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const taxId = button.getAttribute("data-tax-id");
      const nextState = button.getAttribute("data-next-state");

      try {
        await fetchJson(`/api/taxes/${taxId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ estado: nextState })
        });
        await refreshTaxes();
        state.calendarMessage = `Impuesto ${nextState === "activo" ? "activado" : "inactivado"} correctamente.`;
      } catch (error) {
        state.calendarMessage = toUserMessage(error, getActionErrorMessage("updateTax"));
      }

      render();
    });
  });

  document.querySelector('[data-action="open-inferred-rule-modal"]')?.addEventListener("click", () => {
    openFiscalModal("inferred-rule");
    render();
  });

  document.querySelectorAll('[data-action="edit-inferred-rule"]').forEach((button) => {
    button.addEventListener("click", () => {
      const ruleId = button.getAttribute("data-rule-id");
      const rule = state.inferredTaxRules.find((item) => item.id === ruleId);

      if (!rule) {
        state.calendarMessage = "No se pudo cargar la regla deducida seleccionada.";
        render();
        return;
      }

      openFiscalModal("inferred-rule", { rule });
      render();
    });
  });

  document.querySelector("#inferred-rule-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.calendarMessage = null;
    const formData = new FormData(event.currentTarget);
    const editingRule = getEditingInferredRule();
    const parseList = (name) =>
      String(formData.get(name) || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    const payload = {
      impuestoId: formData.get("impuestoId"),
      nombreRegla: formData.get("nombreRegla"),
      descripcion: formData.get("descripcion"),
      estado: formData.get("estado"),
      estadoInicial: formData.get("estadoInicial"),
      accionSugerida: formData.get("accionSugerida"),
      fuenteDeteccion: formData.get("fuenteDeteccion"),
      criterios: {
        tipoPersonaIn: parseList("tipoPersonaIn"),
        regimenIncludesAny: parseList("regimenIncludesAny"),
        regimenExcludesAny: parseList("regimenExcludesAny"),
        ciiuPrefixes: parseList("ciiuPrefixes"),
        boolFlagsAny: parseList("boolFlagsAny"),
        boolFlagsAll: parseList("boolFlagsAll"),
        responsabilidadRutIn: parseList("responsabilidadRutIn"),
        municipioRequired: event.currentTarget.querySelector('[name="municipioRequired"]')?.checked || false,
        departamentoRequired: event.currentTarget.querySelector('[name="departamentoRequired"]')?.checked || false
      }
    };

    try {
      if (editingRule?.id) {
        await fetchJson(`/api/inferred-tax-rules/${editingRule.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        state.calendarMessage = "Regla deducida actualizada correctamente.";
      } else {
        await fetchJson("/api/inferred-tax-rules", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        state.calendarMessage = "Regla deducida creada correctamente.";
      }

      await refreshInferredTaxRules();
      closeFiscalModal();
    } catch (error) {
      state.calendarMessage = toUserMessage(error, getActionErrorMessage(editingRule?.id ? "updateInferredRule" : "createInferredRule"));
    }

    render();
  });

  document.querySelectorAll('[data-action="cancel-tax-edit"]').forEach((button) => {
    button.addEventListener("click", () => {
      closeFiscalModal();
      render();
    });
  });

  document.querySelector("#manual-obligation-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.calendarMessage = null;
    const formData = new FormData(event.currentTarget);
    const editingObligation = getEditingObligation();
    const payload = Object.fromEntries(formData.entries());

    if (editingObligation?.empresaId) {
      payload.empresaId = editingObligation.empresaId;
    }

    try {
      const result = editingObligation
        ? await updateObligationWithFallback(editingObligation, payload)
        : await fetchJson(`/api/companies/${payload.empresaId}/manual-obligations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

      if (payload.empresaId) {
        await loadCompany(payload.empresaId);
        state.fiscalFilters.assignmentCompanyId = payload.empresaId;
      }
      await refreshCompanies();
      await refreshCompanyObligations();
      await refreshFiscalTasks();
      await refreshInternalAlerts();
      state.calendarMessage = editingObligation
        ? result?.__fallbackSuccessMessage || "Impuesto de la empresa actualizado correctamente."
        : `Impuesto asignado a la empresa correctamente.${result?.taskGeneration ? ` Se programaron ${result.taskGeneration.createdCount || 0} tareas en calendario.` : ""}`;
      closeFiscalModal();
    } catch (error) {
      state.calendarMessage = toUserMessage(error, editingObligation ? "No se pudo actualizar el impuesto de la empresa." : "No se pudo asignar el impuesto a la empresa.");
    }

    render();
  });

  const manualObligationForm = document.querySelector("#manual-obligation-form");
  if (manualObligationForm) {
    refreshManualObligationEventFields(manualObligationForm);
    manualObligationForm.querySelector('[data-role="manual-obligation-tax"]')?.addEventListener("change", () => {
      refreshManualObligationEventFields(manualObligationForm);
    });
    manualObligationForm.querySelector('[data-role="manual-obligation-event"]')?.addEventListener("change", () => {
      refreshManualObligationEventFields(manualObligationForm);
    });
  }

  document.querySelector("#calendar-by-nit-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.calendarMessage = null;
    const formData = new FormData(event.currentTarget);
    const commonPayload = {
      impuestoId: formData.get("impuestoId"),
      anio: formData.get("anio"),
      periodo: formData.get("periodo"),
      periodicidad: formData.get("periodicidad"),
      nivel: "nacional",
      criterioVencimiento: "ultimo_digito_nit",
      estado: "borrador",
      fuenteCalendario: "manual"
    };

    try {
      for (const digit of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) {
        const dueDate = formData.get(`nitDate_${digit}`);
        if (!dueDate) {
          continue;
        }

        await fetchJson("/api/fiscal-calendars", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...commonPayload,
            ultimoDigitoNit: digit,
            fechaVencimiento: dueDate
          })
        });
      }

      await refreshFiscalCalendars();
      state.calendarMessage = "Calendario por NIT guardado correctamente.";
      closeFiscalModal();
    } catch (error) {
      state.calendarMessage = toUserMessage(error, getActionErrorMessage("createCalendar"));
    }

    render();
  });

  document.querySelector("#calendar-by-range-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.calendarMessage = null;
    const formData = new FormData(event.currentTarget);
    const commonPayload = {
      impuestoId: formData.get("impuestoId"),
      anio: formData.get("anio"),
      periodo: formData.get("periodo"),
      periodicidad: formData.get("periodicidad"),
      nivel: "nacional",
      criterioVencimiento: "dos_ultimos_digitos_nit",
      estado: "borrador",
      fuenteCalendario: "manual"
    };

    try {
      for (const index of [1, 2, 3, 4, 5]) {
        const from = String(formData.get(`rangeFrom_${index}`) || "").trim();
        const to = String(formData.get(`rangeTo_${index}`) || "").trim();
        const dueDate = formData.get(`rangeDate_${index}`);
        if (!from || !to || !dueDate) {
          continue;
        }

        await fetchJson("/api/fiscal-calendars", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...commonPayload,
            rangoUltimosDigitosNit: `${from}-${to}`,
            fechaVencimiento: dueDate
          })
        });
      }

      await refreshFiscalCalendars();
      state.calendarMessage = "Calendario por rango guardado correctamente.";
      closeFiscalModal();
    } catch (error) {
      state.calendarMessage = toUserMessage(error, getActionErrorMessage("createCalendar"));
    }

    render();
  });

  document.querySelector("#generation-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.calendarMessage = null;
    state.fiscalGenerationSummary = null;
    const formData = new FormData(event.currentTarget);

    state.fiscalFilters.generationYear = String(formData.get("anio") || "");
    state.fiscalFilters.generationCompanyId = String(formData.get("companyId") || "");
    state.fiscalFilters.generationTaxId = String(formData.get("taxId") || "");

    try {
      const summary = await fetchJson("/api/fiscal-calendars/generate-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          companyId: state.fiscalFilters.generationCompanyId || undefined,
          anio: state.fiscalFilters.generationYear || undefined,
          impuestoId: state.fiscalFilters.generationTaxId || undefined
        })
      });
      state.fiscalGenerationSummary = summary;
      state.calendarMessage = "Tareas fiscales generadas correctamente.";
      await refreshFiscalTasks();
      await refreshInternalAlerts();
      await refreshCompanyContext();
      closeFiscalModal();
    } catch (error) {
      state.calendarMessage = toUserMessage(error, getActionErrorMessage("generateFiscalTasks"));
    }

    render();
  });

  document.querySelector("#task-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.calendarMessage = null;
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const result = await fetchJson("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const createdCount = Number(result?.createdCount || 1);
      state.calendarMessage =
        createdCount > 1
          ? `Tarea recurrente creada correctamente. Se programaron ${createdCount} ocurrencias.`
          : "Tarea manual creada correctamente.";
      await refreshFiscalTasks();
      await refreshInternalAlerts();
      await refreshCompanyContext();
      closeFiscalModal();
    } catch (error) {
      state.calendarMessage = toUserMessage(error, "No se pudo crear la tarea manual.");
    }

    render();
  });

  document.querySelector("#task-support-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.calendarMessage = null;
    const task = getEditingTaskSupport();

    if (!task?.id) {
      state.calendarMessage = "No se encontro la tarea para guardar soporte.";
      render();
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      await fetchJson(`/api/tasks/${task.id}/support`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      state.calendarMessage = "Soporte de tarea actualizado correctamente.";
      await refreshFiscalTasks();
      await refreshCompanyContext();
      closeFiscalModal();
    } catch (error) {
      state.calendarMessage = toUserMessage(error, "No se pudo guardar el soporte de la tarea.");
    }

    render();
  });

  document.querySelectorAll('[data-action="task-status"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const taskId = button.getAttribute("data-task-id");
      const nextStatus = button.getAttribute("data-task-status");

      try {
        await fetchJson(`/api/tasks/${taskId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ estado: nextStatus })
        });
        state.calendarMessage = "Tarea actualizada correctamente.";
        await refreshFiscalTasks();
        await refreshInternalAlerts();
        await refreshCompanyContext();
      } catch (error) {
        state.calendarMessage = toUserMessage(error, "No se pudo actualizar la tarea.");
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="task-close"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const taskId = button.getAttribute("data-task-id");
      const nextStatus = button.getAttribute("data-task-status");

      try {
        await fetchJson(`/api/tasks/${taskId}/close`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ estado: nextStatus })
        });
        state.calendarMessage = "Tarea cerrada correctamente.";
        await refreshFiscalTasks();
        await refreshInternalAlerts();
        await refreshCompanyContext();
      } catch (error) {
        state.calendarMessage = toUserMessage(error, "No se pudo cerrar la tarea.");
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="assign-task"]').forEach((select) => {
    select.addEventListener("change", async () => {
      const taskId = select.getAttribute("data-task-id");

      try {
        await fetchJson(`/api/tasks/${taskId}/assign`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ responsableId: select.value })
        });
        state.calendarMessage = "Responsable reasignado correctamente.";
        await refreshFiscalTasks();
        await refreshInternalAlerts();
      } catch (error) {
        state.calendarMessage = toUserMessage(error, "No se pudo reasignar la tarea.");
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="bulk-assign-visible"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const responsableId = document.querySelector("#bulk-responsible-select")?.value || "";
      const taskIds = openOperationalTasks(filterOperationalTasks()).map((task) => task.id);

      if (!responsableId) {
        state.calendarMessage = "Selecciona el contador responsable para reasignar las tareas visibles.";
        render();
        return;
      }

      if (!taskIds.length) {
        state.calendarMessage = "No hay tareas abiertas para reasignar con los filtros actuales.";
        render();
        return;
      }

      try {
        const summary = await fetchJson("/api/tasks/bulk-assign", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ responsableId, taskIds })
        });
        state.calendarMessage = `${summary.updatedCount || 0} tareas reasignadas correctamente. ${summary.skippedCount || 0} omitidas.`;
        await refreshFiscalTasks();
        await refreshInternalAlerts();
        await refreshDashboard();
      } catch (error) {
        state.calendarMessage = toUserMessage(error, "No se pudieron reasignar las tareas filtradas.");
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="task-client-block"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const taskId = button.getAttribute("data-task-id");
      const activo = button.getAttribute("data-client-block-active") === "true";
      const motivo = activo ? window.prompt("Motivo del bloqueo por cliente:", "Pendiente informacion o soporte del cliente") : "";

      if (activo && motivo === null) {
        return;
      }

      try {
        await fetchJson(`/api/tasks/${taskId}/client-block`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ activo, motivo })
        });
        state.calendarMessage = activo
          ? "Tarea marcada como bloqueada por cliente correctamente."
          : "Bloqueo por cliente resuelto correctamente.";
        await refreshFiscalTasks();
        await refreshInternalAlerts();
        await refreshDashboard();
      } catch (error) {
        state.calendarMessage = toUserMessage(error, "No se pudo actualizar el bloqueo por cliente.");
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="task-workflow"]').forEach((select) => {
    select.addEventListener("change", async () => {
      const taskId = select.getAttribute("data-task-id");

      try {
        await fetchJson(`/api/tasks/${taskId}/workflow`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ etapaGestion: select.value })
        });
        state.calendarMessage = "Flujo de trabajo actualizado correctamente.";
        await refreshFiscalTasks();
        await refreshInternalAlerts();
        await refreshCompanyContext();
      } catch (error) {
        state.calendarMessage = toUserMessage(error, "No se pudo actualizar el flujo de la tarea.");
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="generate-alerts"]').forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const summary = await fetchJson("/api/alerts/generate", {
          method: "POST"
        });
        state.calendarMessage = `${summary.createdCount || 0} alertas internas nuevas generadas.`;
        await refreshInternalAlerts();
      } catch (error) {
        state.calendarMessage = toUserMessage(error, "No se pudieron actualizar las alertas.");
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="generate-dian-controls"]').forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const summary = await fetchJson("/api/tasks/generate-dian-controls", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            companyId: state.fiscalFilters.operationalCompanyId || undefined,
            responsableId: state.fiscalFilters.operationalResponsibleId && state.fiscalFilters.operationalResponsibleId !== "__unassigned"
              ? state.fiscalFilters.operationalResponsibleId
              : undefined
          })
        });
        state.calendarMessage = `${summary.createdCount || 0} controles DIAN generados. ${summary.duplicateCount || 0} duplicados evitados.`;
        await refreshFiscalTasks();
        await refreshInternalAlerts();
        await refreshCompanyContext();
      } catch (error) {
        state.calendarMessage = toUserMessage(error, "No se pudieron generar los controles DIAN.");
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="alert-status"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const alertId = button.getAttribute("data-alert-id");
      const nextStatus = button.getAttribute("data-alert-status");
      const requiresReason = ["atendida", "descartada"].includes(String(nextStatus || ""));
      const reasonPrompt =
        nextStatus === "descartada"
          ? "Motivo opcional para descartar la alerta:"
          : "Motivo opcional para atender la alerta:";
      const reason = requiresReason ? window.prompt(reasonPrompt, "") : "";

      if (reason === null) {
        return;
      }

      try {
        await fetchJson(`/api/alerts/${alertId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            estado: nextStatus,
            motivo: String(reason || "").trim()
          })
        });
        state.calendarMessage =
          nextStatus === "atendida"
            ? "Alerta atendida correctamente."
            : nextStatus === "descartada"
              ? "Alerta descartada correctamente."
              : "Alerta marcada como leida.";
        await refreshInternalAlerts();
        await refreshDashboard();
      } catch (error) {
        state.calendarMessage = toUserMessage(error, "No se pudo actualizar la alerta.");
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="refresh-dashboard"]').forEach((button) => {
    button.addEventListener("click", async () => {
      await refreshDashboard();
      render();
    });
  });

  document.querySelectorAll('[data-action="dashboard-open-task-queue"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const queue = button.getAttribute("data-queue") || "";
      const currentYear = String(new Date().getFullYear());
      state.activeView = "fiscal-calendar";
      state.fiscalTab = "operational";
      state.sidebarActiveKey = getSidebarActiveKeyForView("fiscal-calendar", "operational");
      state.fiscalModal = null;
      state.calendarMessage = null;
      state.fiscalFilters.operationalYear = currentYear;
      state.fiscalFilters.operationalMonth = "";
      state.fiscalFilters.operationalCompanyId = "";
      state.fiscalFilters.operationalTaxId = "";
      state.fiscalFilters.operationalState = "";
      state.fiscalFilters.operationalResponsibleId = "";
      state.fiscalFilters.operationalDueKind = "";
      state.fiscalFilters.operationalTaskType = "";
      state.fiscalFilters.operationalClientRisk = "";

      if (queue === "vencidas") {
        state.fiscalFilters.operationalDueKind = "vencidas";
      } else if (queue === "hoy" || queue === "proximas") {
        state.fiscalFilters.operationalDueKind = "proximas";
        state.operationalSelectedDate = queue === "hoy" ? new Date().toISOString().slice(0, 10) : "";
      } else if (queue === "sin_responsable") {
        state.fiscalFilters.operationalResponsibleId = "__unassigned";
      } else if (queue === "cliente" || queue === "pago_cliente") {
        state.fiscalFilters.operationalTaskType = "fiscal";
        state.fiscalFilters.operationalClientRisk = queue === "cliente" ? "bloqueadas_cliente" : "pendiente_pago_cliente";
        state.calendarMessage = "Vista de tareas fiscales filtrada para seguimiento al cliente.";
      }

      try {
        await refreshFiscalTasks();
      } catch (error) {
        state.calendarMessage = toUserMessage(error, "No se pudieron cargar las tareas operativas.");
      }

      render();
    });
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", async () => {
      const requestedView = button.getAttribute("data-view");
      const targetFiscalTab = button.getAttribute("data-target-fiscal-tab");
      const targetSidebarKey = button.getAttribute("data-sidebar-key");
      state.activeView = requestedView;
      if (requestedView === "fiscal-calendar") {
        state.fiscalTab = normalizeFiscalSectionId(targetFiscalTab || getFiscalSectionIdFromSidebarKey(targetSidebarKey));
      }

      if (!canAccessView(requestedView)) {
        state.accessDeniedView = requestedView;
        render();
        return;
      }

      state.accessDeniedView = "";
      state.sidebarActiveKey = targetSidebarKey || getSidebarActiveKeyForView(state.activeView, state.fiscalTab);
      state.fiscalModal = null;
      if (state.activeView === "users" && hasPermission("ver_modulo_usuarios")) {
        try {
          await refreshUsers();
        } catch (error) {
          state.userManagementMessage = error.message;
        }
      }
      if (state.activeView === "dashboard") {
        await refreshDashboard();
      }
      if (state.activeView === "auditoria" && canAccessModule("auditoria")) {
        try {
          await refreshAudits();
        } catch (error) {
          state.authMessage = error.message;
        }
      }
      if (state.activeView === "fiscal-calendar" && state.fiscalTab === "alerts") {
        try {
          await refreshInternalAlerts();
        } catch (error) {
          state.calendarMessage = toUserMessage(error, "No se pudieron cargar las alertas.");
        }
      }
      render();
    });
  });

  document.querySelectorAll("[data-edit-user-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.editingUserId = button.getAttribute("data-edit-user-id");
      state.userManagementMessage = null;
      render();
    });
  });

  document.querySelector("#cancel-user-edit")?.addEventListener("click", () => {
    state.editingUserId = null;
    state.userManagementMessage = null;
    render();
  });

  document.querySelector("#user-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.userManagementMessage = null;

    try {
      const payload = userFormToPayload(event.currentTarget);
      if (state.editingUserId) {
        const result = await fetchJson(`/api/users/${state.editingUserId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        if (result?.id && result.id === state.currentUser?.id) {
          state.currentUser = result;
        }
        state.userManagementMessage = "Usuario actualizado correctamente.";
      } else {
        await fetchJson("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        state.userManagementMessage = "Usuario creado correctamente.";
      }

      state.editingUserId = null;
      await refreshUsers();
    } catch (error) {
      state.userManagementMessage = error.message;
    }

    render();
  });

  bindSelectionCardInputs();

  document.querySelectorAll('[data-action="calendar-prev-month"]').forEach((button) => {
    button.addEventListener("click", () => {
      shiftOperationalCalendarMonth(-1);
      render();
    });
  });

  document.querySelectorAll('[data-action="calendar-next-month"]').forEach((button) => {
    button.addEventListener("click", () => {
      shiftOperationalCalendarMonth(1);
      render();
    });
  });

  document.querySelectorAll('[data-action="calendar-today"]').forEach((button) => {
    button.addEventListener("click", () => {
      setOperationalCalendarToday();
      render();
    });
  });

  document.querySelectorAll('[data-action="calendar-select-day"]').forEach((button) => {
    button.addEventListener("click", () => {
      state.operationalSelectedDate = button.getAttribute("data-date") || "";
      render();
    });
  });

  document.querySelectorAll('[data-action="calendar-change-year"]').forEach((select) => {
    select.addEventListener("change", () => {
      const reference = getOperationalCalendarReference();
      setOperationalCalendarMonth(Number(select.value || reference.year), reference.month);
      render();
    });
  });

  document.querySelectorAll('[data-action="calendar-change-month"]').forEach((select) => {
    select.addEventListener("change", () => {
      const reference = getOperationalCalendarReference();
      setOperationalCalendarMonth(reference.year, Number(select.value || reference.month));
      render();
    });
  });

  document.querySelectorAll("[data-fiscal-tab]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.fiscalTab = button.getAttribute("data-fiscal-tab");
      state.sidebarActiveKey = getSidebarActiveKeyForView("fiscal-calendar", state.fiscalTab);
      state.fiscalModal = null;
      if (state.fiscalTab === "alerts") {
        try {
          await refreshInternalAlerts();
        } catch (error) {
          state.calendarMessage = toUserMessage(error, "No se pudieron cargar las alertas.");
        }
      }
      render();
    });
  });

  document.querySelectorAll("[data-manage-company-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const companyId = button.getAttribute("data-manage-company-id");
      state.fiscalFilters.assignmentCompanyId = companyId || "";

      if (companyId) {
        await loadCompany(companyId);
      }

      if (!state.companyObligations.length) {
        await refreshCompanyObligations();
      }

      render();
      document.querySelector(".selected-company-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  document.querySelectorAll('[data-action="back-to-companies"]').forEach((button) => {
    button.addEventListener("click", () => {
      state.fiscalFilters.assignmentCompanyId = "";
      state.saveMessage = null;
      state.fiscalModal = null;
      render();
    });
  });

  document.querySelectorAll('[data-action="clear-alert-filters"]').forEach((button) => {
    button.addEventListener("click", async () => {
      clearAlertFilters();

      try {
        await refreshInternalAlerts();
      } catch (error) {
        state.calendarMessage = toUserMessage(error, "No se pudieron limpiar los filtros de alertas.");
      }

      render();
    });
  });

  document.querySelectorAll("[data-filter]").forEach((control) => {
    control.addEventListener("change", async () => {
      const filterName = control.getAttribute("data-filter");
      state.fiscalFilters[filterName] = control.value;
      if (["alertCompanyId", "alertResponsibleId", "alertState", "alertType", "alertLevel"].includes(filterName)) {
        try {
          await refreshInternalAlerts();
        } catch (error) {
          state.calendarMessage = toUserMessage(error, "No se pudieron filtrar las alertas.");
        }
      }
      render();
    });
  });

  document.querySelectorAll('[data-action="open-tax-modal"]').forEach((button) => {
    button.addEventListener("click", () => {
      state.editingTaxId = null;
      openFiscalModal("tax");
      render();
    });
  });

  document.querySelectorAll('[data-action="open-assignment-modal"]').forEach((button) => {
    button.addEventListener("click", () => {
      openFiscalModal("assignment");
      render();
    });
  });

  document.querySelectorAll('[data-action="edit-obligation"]').forEach((button) => {
    button.addEventListener("click", () => {
      const obligationId = button.getAttribute("data-obligation-id");
      const obligation = state.companyObligations.find((item) => item.id === obligationId);

      if (!obligation) {
        state.calendarMessage = "No se pudo cargar el impuesto seleccionado.";
        render();
        return;
      }

      state.fiscalFilters.assignmentCompanyId = obligation.empresaId || state.fiscalFilters.assignmentCompanyId;
      openFiscalModal("assignment", { obligation });
      render();
    });
  });

  document.querySelectorAll('[data-action="open-calendar-modal"]').forEach((button) => {
    button.addEventListener("click", () => {
      openFiscalModal("calendar");
      render();
    });
  });

  document.querySelectorAll('[data-action="open-calendar-nit-modal"]').forEach((button) => {
    button.addEventListener("click", () => {
      openFiscalModal("calendar-nit");
      render();
    });
  });

  document.querySelectorAll('[data-action="open-calendar-range-modal"]').forEach((button) => {
    button.addEventListener("click", () => {
      openFiscalModal("calendar-range");
      render();
    });
  });

  document.querySelectorAll('[data-action="open-generation-modal"]').forEach((button) => {
    button.addEventListener("click", () => {
      openFiscalModal("generation");
      render();
    });
  });

  document.querySelectorAll('[data-action="open-task-modal"]').forEach((button) => {
    button.addEventListener("click", () => {
      openFiscalModal("task");
      render();
    });
  });

  document.querySelectorAll('[data-action="open-task-support"]').forEach((button) => {
    button.addEventListener("click", () => {
      const taskId = button.getAttribute("data-task-id");
      const task = state.fiscalTasks.find((item) => item.id === taskId);

      if (!task) {
        state.calendarMessage = "No se pudo cargar la tarea seleccionada.";
        render();
        return;
      }

      openFiscalModal("task-support", { task });
      render();
    });
  });

  document.querySelectorAll('[data-action="close-fiscal-modal"]').forEach((button) => {
    button.addEventListener("click", () => {
      closeFiscalModal();
      render();
    });
  });

  document.querySelector("#fiscal-modal-backdrop")?.addEventListener("click", (event) => {
    if (event.target.id === "fiscal-modal-backdrop") {
      closeFiscalModal();
      render();
    }
  });

  document.querySelectorAll("[data-step-target]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }

      const targetId = button.getAttribute("data-step-target");
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}

async function start() {
  const app = document.querySelector("#app");
  app.innerHTML = `<section class="empty-state" style="padding: 32px;">Cargando GestorConta...</section>`;

  try {
    if (!state.authToken) {
      render();
      return;
    }

    await loadAuthenticatedApp();
  } catch (error) {
    persistAuthToken("");
    state.currentUser = null;
    state.authMessage = `Tu sesion no pudo restaurarse. ${error.message}`;
    render();
  }
}

async function loadAuthenticatedApp() {
  await loadBootstrap();

  if (hasAnyPermission(["gestionar_impuestos", "gestionar_obligaciones", "gestionar_calendarios", "ver_obligaciones", "ver_calendarios"])) {
    await refreshTaxes();
    await refreshInferredTaxRules();
  }

  if (hasAnyPermission(["gestionar_obligaciones", "gestionar_calendarios", "generar_tareas_fiscales", "ver_obligaciones", "ver_obligaciones_cliente"])) {
    await refreshCompanyObligations();
  }

  if (hasAnyPermission(["gestionar_calendarios", "generar_tareas_fiscales", "gestionar_obligaciones", "ver_calendarios"])) {
    await refreshFiscalCalendars();
  }

  if (hasAnyPermission(["ver_tareas", "ver_tareas_empresa", "generar_tareas_fiscales", "gestionar_calendarios"])) {
    await refreshTaskResponsibles();
    await refreshFiscalTasks();
  }

  if (hasAnyPermission(["ver_alertas", "gestionar_alertas", "ver_tareas", "ver_tareas_empresa", "generar_tareas_fiscales", "gestionar_calendarios"])) {
    await refreshInternalAlerts();
  }

  if (canAccessModule("auditoria")) {
    await refreshAudits();
  } else {
    state.audits = [];
  }

  if (canAccessModule("usuarios")) {
    await refreshUsers();
  } else {
    state.users = [];
  }

  if (!state.activeView) {
    state.activeView = state.currentUser?.defaultView || (isClientPortalUser() ? "portal-cliente" : "rut");
  }

  if (shouldDefaultToDashboard() && (!state.activeView || state.activeView === "rut")) {
    state.activeView = "dashboard";
  }

  if (state.activeView === "dashboard" && !canUseDashboard()) {
    state.activeView = state.currentUser?.defaultView || "rut";
  }

  if (!["rut", "fiscal-calendar", "users", "dashboard", "portal-cliente", "reportes", "configuracion", "auditoria", "respaldos"].includes(state.activeView)) {
    state.activeView = state.currentUser?.defaultView || "rut";
  }

  if (!canAccessView(state.activeView)) {
    state.activeView = state.currentUser?.defaultView || "rut";
  }

  if (canAccessView(state.activeView)) {
    state.accessDeniedView = "";
  }

  state.sidebarActiveKey = getSidebarActiveKeyForView(state.activeView, state.fiscalTab);

  if (state.activeView === "dashboard" && canUseDashboard()) {
    await refreshDashboard();
    render();
    return;
  }

  render();
}

start();
