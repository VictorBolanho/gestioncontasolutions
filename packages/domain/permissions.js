export const LEGACY_ROLE_ALIASES = Object.freeze({
  gerente: "owner",
  supervisor: "senior_accountant",
  operativo_medio: "junior_accountant",
  operativo_basico: "junior_accountant"
});

export const ROLES = Object.freeze([
  "owner",
  "senior_accountant",
  "junior_accountant",
  "apprentice",
  "cliente",
  "solo_lectura",
  "administrador",
  "gerente",
  "supervisor",
  "operativo_medio",
  "operativo_basico"
]);

export const ROLE_PRIORITY = Object.freeze([
  "owner",
  "administrador",
  "gerente",
  "senior_accountant",
  "supervisor",
  "junior_accountant",
  "operativo_medio",
  "operativo_basico",
  "apprentice",
  "solo_lectura",
  "cliente"
]);

export const ROLE_LABELS = Object.freeze({
  owner: "Dueña / Gerente",
  senior_accountant: "Contador senior",
  junior_accountant: "Contador junior",
  apprentice: "Aprendiz / Practicante",
  administrador: "Administrador del sistema",
  gerente: "Gerente",
  supervisor: "Supervisor / Jefe de area",
  operativo_medio: "Analista contable",
  operativo_basico: "Auxiliar contable",
  cliente: "Cliente",
  solo_lectura: "Solo lectura"
});

export const PERMISSION_ALIASES = Object.freeze({
  ver_tareas: ["ver_tareas_empresa"],
  ver_tareas_empresa: ["ver_tareas"],
  ver_obligaciones_cliente: ["ver_obligaciones"],
  ver_documentos_compartidos: ["ver_documentos_cliente"],
  descargar_documentos_compartidos: ["ver_documentos_cliente"],
  gestionar_impuestos: ["ver_obligaciones", "gestionar_obligaciones", "ver_calendarios", "gestionar_calendarios"],
  ver_extraccion_rut: ["cargar_rut_pdf"],
  editar_datos_extraidos_rut: ["cargar_rut_pdf"],
  crear_calendario: ["gestionar_calendarios"],
  editar_calendario: ["gestionar_calendarios"],
  activar_calendario: ["gestionar_calendarios"],
  reemplazar_calendario: ["gestionar_calendarios"],
  anular_calendario: ["gestionar_calendarios"],
  editar_obligacion: ["gestionar_obligaciones"],
  confirmar_obligacion: ["gestionar_obligaciones"],
  marcar_obligacion_no_aplica: ["gestionar_obligaciones"],
  crear_tarea_manual: ["ver_tareas"],
  crear_tarea_recurrente: ["crear_tarea_manual"],
  editar_tarea: ["ver_tareas"],
  reasignar_tarea: ["ver_tareas"],
  cambiar_estado_tarea: ["ver_tareas"],
  cerrar_tarea: ["ver_tareas"],
  rechazar_tarea: ["ver_tareas"],
  cargar_evidencia: ["ver_tareas"],
  ver_evidencia: ["ver_tareas"],
  aprobar_evidencia: ["ver_tareas"],
  ver_dashboard_supervisor: ["ver_dashboard_usuario"],
  ver_dashboard_general: ["ver_dashboard_supervisor", "ver_dashboard_usuario"],
  asignar_roles: ["editar_usuarios"],
  asignar_empresas_usuario: ["editar_usuarios"],
  ver_permisos_sensibles: ["asignar_permisos"],
  configurar_parametros_sistema: ["editar_configuracion"],
  configurar_roles_permisos: ["editar_configuracion"],
  configurar_portal_cliente: ["editar_configuracion"],
  configurar_correo: ["editar_configuracion"],
  configurar_identidad_visual: ["editar_configuracion"],
  ver_logs_sistema: ["ver_auditoria"],
  ver_respaldos: ["ver_auditoria"],
  ejecutar_respaldo: ["ver_auditoria"]
});

const BASE_PERMISSIONS = Object.freeze([
  "ver_todas_empresas",
  "ver_empresas_asignadas",
  "ver_detalle_empresa",
  "ver_datos_sensibles_empresa",
  "ver_contacto_empresa",
  "crear_empresa",
  "editar_empresa",
  "aprobar_empresa",
  "desactivar_empresa",
  "archivar_empresa",
  "reactivar_empresa",
  "cargar_rut_pdf",
  "ver_extraccion_rut",
  "editar_datos_extraidos_rut",
  "confirmar_empresa_rut",
  "descargar_rut",
  "ver_obligaciones",
  "analizar_obligaciones",
  "gestionar_obligaciones",
  "crear_obligacion_manual",
  "editar_obligacion",
  "confirmar_obligacion",
  "marcar_obligacion_no_aplica",
  "ver_calendarios",
  "gestionar_calendarios",
  "crear_calendario",
  "editar_calendario",
  "activar_calendario",
  "reemplazar_calendario",
  "anular_calendario",
  "generar_tareas_fiscales",
  "ver_tareas",
  "crear_tarea_manual",
  "crear_tarea_recurrente",
  "editar_tarea",
  "reasignar_tarea",
  "cambiar_estado_tarea",
  "cerrar_tarea",
  "rechazar_tarea",
  "cargar_evidencia",
  "ver_evidencia",
  "aprobar_evidencia",
  "ver_alertas",
  "gestionar_alertas",
  "configurar_alertas",
  "ver_dashboard_general",
  "ver_dashboard_supervisor",
  "ver_dashboard_usuario",
  "ver_reportes",
  "exportar_reportes",
  "ver_indicadores_equipo",
  "ver_modulo_usuarios",
  "crear_usuarios",
  "editar_usuarios",
  "desactivar_usuarios",
  "asignar_roles",
  "asignar_permisos",
  "asignar_empresas_usuario",
  "ver_permisos_sensibles",
  "ver_configuracion",
  "editar_configuracion",
  "configurar_correo",
  "configurar_portal_cliente",
  "configurar_roles_permisos",
  "configurar_parametros_sistema",
  "ver_portal_cliente",
  "ver_mi_empresa",
  "ver_obligaciones_cliente",
  "ver_pagos_pendientes_cliente",
  "cargar_soporte_pago",
  "ver_documentos_compartidos",
  "descargar_documentos_compartidos",
  "responder_solicitud_cliente",
  "actualizar_contacto_cliente",
  "crear_solicitud_documento",
  "enviar_solicitud_documento",
  "ver_solicitudes_documento",
  "revisar_documento_cliente",
  "aprobar_documento_cliente",
  "rechazar_documento_cliente",
  "cargar_documento_cliente",
  "ver_documentos_cliente",
  "ver_auditoria",
  "ver_logs_sistema",
  "ver_respaldos",
  "ejecutar_respaldo",

  // Compatibilidad con el vocabulario legado del sistema actual.
  "ver_documentos_empresa",
  "ver_tareas_empresa",
  "gestionar_impuestos",
  "registrar_pago",
  "configurar_identidad_visual"
]);

function expandPermission(permission, visited = new Set()) {
  const normalized = String(permission || "").trim();
  if (!normalized || visited.has(normalized)) {
    return [];
  }

  visited.add(normalized);
  const aliases = PERMISSION_ALIASES[normalized] || [];
  return [normalized, ...aliases.flatMap((alias) => expandPermission(alias, visited))];
}

function expandPermissions(permissions = []) {
  return Array.from(new Set(permissions.flatMap((permission) => expandPermission(permission)))).sort();
}

const ROLE_PERMISSION_INPUT = Object.freeze({
  owner: BASE_PERMISSIONS,
  senior_accountant: [
    "ver_empresas_asignadas",
    "ver_detalle_empresa",
    "ver_contacto_empresa",
    "cargar_rut_pdf",
    "ver_extraccion_rut",
    "editar_datos_extraidos_rut",
    "confirmar_empresa_rut",
    "ver_obligaciones",
    "analizar_obligaciones",
    "gestionar_obligaciones",
    "confirmar_obligacion",
    "marcar_obligacion_no_aplica",
    "ver_calendarios",
    "gestionar_calendarios",
    "generar_tareas_fiscales",
    "ver_tareas",
    "crear_tarea_manual",
    "crear_tarea_recurrente",
    "reasignar_tarea",
    "cambiar_estado_tarea",
    "cerrar_tarea",
    "rechazar_tarea",
    "cargar_evidencia",
    "ver_evidencia",
    "aprobar_evidencia",
    "ver_alertas",
    "gestionar_alertas",
    "ver_dashboard_supervisor",
    "ver_reportes",
    "ver_solicitudes_documento",
    "crear_solicitud_documento",
    "enviar_solicitud_documento",
    "revisar_documento_cliente",
    "aprobar_documento_cliente",
    "rechazar_documento_cliente"
  ],
  junior_accountant: [
    "ver_empresas_asignadas",
    "ver_detalle_empresa",
    "cargar_rut_pdf",
    "ver_extraccion_rut",
    "editar_datos_extraidos_rut",
    "confirmar_empresa_rut",
    "ver_obligaciones",
    "analizar_obligaciones",
    "gestionar_obligaciones",
    "crear_obligacion_manual",
    "ver_calendarios",
    "ver_tareas",
    "crear_tarea_manual",
    "cambiar_estado_tarea",
    "cargar_evidencia",
    "ver_evidencia",
    "ver_alertas",
    "ver_dashboard_usuario",
    "ver_solicitudes_documento",
    "crear_solicitud_documento",
    "revisar_documento_cliente"
  ],
  apprentice: [
    "ver_tareas",
    "cambiar_estado_tarea",
    "cargar_evidencia",
    "ver_evidencia",
    "ver_alertas",
    "ver_dashboard_usuario",
    "ver_solicitudes_documento",
    "ver_documentos_cliente"
  ],
  cliente: [
    "ver_portal_cliente",
    "ver_mi_empresa",
    "ver_obligaciones_cliente",
    "ver_pagos_pendientes_cliente",
    "cargar_soporte_pago",
    "ver_documentos_compartidos",
    "descargar_documentos_compartidos",
    "responder_solicitud_cliente",
    "actualizar_contacto_cliente",
    "cargar_documento_cliente",
    "ver_documentos_cliente"
  ],
  operativo_basico: [
    "ver_empresas_asignadas",
    "ver_detalle_empresa",
    "cargar_rut_pdf",
    "ver_extraccion_rut",
    "ver_tareas",
    "crear_tarea_manual",
    "cambiar_estado_tarea",
    "cargar_evidencia",
    "ver_evidencia",
    "ver_alertas",
    "ver_dashboard_usuario",
    "ver_solicitudes_documento"
  ],
  operativo_medio: [
    "ver_empresas_asignadas",
    "ver_detalle_empresa",
    "cargar_rut_pdf",
    "ver_extraccion_rut",
    "editar_datos_extraidos_rut",
    "confirmar_empresa_rut",
    "ver_obligaciones",
    "analizar_obligaciones",
    "gestionar_obligaciones",
    "crear_obligacion_manual",
    "ver_calendarios",
    "ver_tareas",
    "crear_tarea_manual",
    "cambiar_estado_tarea",
    "cargar_evidencia",
    "ver_evidencia",
    "ver_alertas",
    "ver_dashboard_usuario",
    "ver_solicitudes_documento",
    "crear_solicitud_documento",
    "revisar_documento_cliente"
  ],
  supervisor: [
    "ver_empresas_asignadas",
    "ver_detalle_empresa",
    "ver_contacto_empresa",
    "cargar_rut_pdf",
    "ver_extraccion_rut",
    "editar_datos_extraidos_rut",
    "confirmar_empresa_rut",
    "ver_obligaciones",
    "analizar_obligaciones",
    "gestionar_obligaciones",
    "confirmar_obligacion",
    "marcar_obligacion_no_aplica",
    "ver_calendarios",
    "gestionar_calendarios",
    "generar_tareas_fiscales",
    "ver_tareas",
    "crear_tarea_manual",
    "crear_tarea_recurrente",
    "reasignar_tarea",
    "cambiar_estado_tarea",
    "cerrar_tarea",
    "rechazar_tarea",
    "cargar_evidencia",
    "ver_evidencia",
    "aprobar_evidencia",
    "ver_alertas",
    "gestionar_alertas",
    "ver_dashboard_supervisor",
    "ver_reportes",
    "ver_solicitudes_documento",
    "crear_solicitud_documento",
    "enviar_solicitud_documento",
    "revisar_documento_cliente",
    "aprobar_documento_cliente",
    "rechazar_documento_cliente"
  ],
  gerente: BASE_PERMISSIONS,
  administrador: BASE_PERMISSIONS,
  solo_lectura: [
    "ver_empresas_asignadas",
    "ver_detalle_empresa",
    "ver_obligaciones",
    "ver_calendarios",
    "ver_tareas",
    "ver_alertas",
    "ver_dashboard_usuario",
    "ver_reportes",
    "ver_solicitudes_documento",
    "ver_documentos_cliente"
  ]
});

export const ROLE_PERMISSIONS = Object.freeze(
  Object.fromEntries(
    Object.entries(ROLE_PERMISSION_INPUT).map(([role, permissions]) => [role, expandPermissions(permissions)])
  )
);

export const ALL_PERMISSIONS = Object.freeze(
  Array.from(new Set([...BASE_PERMISSIONS, ...Object.values(ROLE_PERMISSIONS).flatMap((permissions) => permissions)])).sort()
);

export const SENSITIVE_PERMISSIONS = Object.freeze([
  "ver_todas_empresas",
  "ver_contacto_empresa",
  "ver_datos_sensibles_empresa",
  "descargar_rut",
  "crear_usuarios",
  "editar_usuarios",
  "asignar_roles",
  "asignar_permisos",
  "asignar_empresas_usuario",
  "ver_permisos_sensibles",
  "registrar_pago",
  "exportar_reportes",
  "desactivar_empresa",
  "archivar_empresa",
  "reactivar_empresa",
  "editar_configuracion",
  "configurar_roles_permisos",
  "configurar_parametros_sistema",
  "ejecutar_respaldo"
]);

export const MODULE_PERMISSION_RULES = Object.freeze({
  dashboard: ["ver_dashboard_general", "ver_dashboard_supervisor", "ver_dashboard_usuario", "ver_indicadores_equipo"],
  empresas: ["ver_todas_empresas", "ver_empresas_asignadas", "ver_detalle_empresa", "ver_mi_empresa"],
  rut: ["cargar_rut_pdf", "ver_extraccion_rut", "editar_datos_extraidos_rut", "confirmar_empresa_rut", "descargar_rut"],
  obligaciones: ["ver_obligaciones", "gestionar_obligaciones", "ver_obligaciones_cliente"],
  calendarios: ["ver_calendarios", "gestionar_calendarios", "generar_tareas_fiscales"],
  tareas: ["ver_tareas", "crear_tarea_manual", "crear_tarea_recurrente", "cambiar_estado_tarea"],
  alertas: ["ver_alertas", "gestionar_alertas"],
  usuarios: ["ver_modulo_usuarios"],
  reportes: ["ver_reportes", "exportar_reportes"],
  configuracion: ["ver_configuracion", "editar_configuracion", "configurar_parametros_sistema"],
  auditoria: ["ver_auditoria", "ver_logs_sistema"],
  respaldos: ["ver_respaldos", "ejecutar_respaldo"],
  portal_cliente: ["ver_portal_cliente"],
  solicitudes_documento: [
    "ver_solicitudes_documento",
    "crear_solicitud_documento",
    "enviar_solicitud_documento",
    "revisar_documento_cliente",
    "aprobar_documento_cliente",
    "rechazar_documento_cliente",
    "cargar_documento_cliente",
    "ver_documentos_cliente"
  ]
});

export const APP_MENU_ITEMS = Object.freeze([
  { key: "portal-home", id: "portal-cliente", label: "Portal cliente", icon: "chart", module: "portal_cliente" },
  { key: "dashboard-reports", id: "dashboard", label: "Dashboard", icon: "chart", module: "dashboard" },
  { key: "rut-upload", id: "rut", label: "Empresas", icon: "building2", module: "empresas" },
  { key: "rut-documents", id: "rut", label: "RUT", icon: "uploadCloud", module: "rut" },
  { key: "tax-management", id: "fiscal-calendar", fiscalTab: "obligations", label: "Obligaciones", icon: "receipt", module: "obligaciones" },
  { key: "fiscal-companies", id: "fiscal-calendar", fiscalTab: "companies", label: "Empresas fiscales", icon: "landmark", module: "empresas" },
  { key: "fiscal-calendars", id: "fiscal-calendar", fiscalTab: "calendars", label: "Calendarios", icon: "calendar", module: "calendarios" },
  { key: "fiscal-tasks", id: "fiscal-calendar", fiscalTab: "operational", label: "Tareas", icon: "clipboard", module: "tareas" },
  { key: "fiscal-alerts", id: "fiscal-calendar", fiscalTab: "alerts", label: "Alertas", icon: "check", module: "alertas" },
  { key: "users-admin", id: "users", label: "Usuarios", icon: "users", module: "usuarios" },
  { key: "reports-view", id: "reportes", label: "Reportes", icon: "chart", module: "reportes" },
  { key: "config-view", id: "configuracion", label: "Configuracion", icon: "settings", module: "configuracion" },
  { key: "audit-view", id: "auditoria", label: "Auditoria", icon: "fileText", module: "auditoria" },
  { key: "backup-view", id: "respaldos", label: "Respaldos", icon: "settings", module: "respaldos" }
]);

export function normalizeRole(role) {
  const normalized = String(role || "").trim();
  return LEGACY_ROLE_ALIASES[normalized] || normalized;
}

export function normalizeUserRoles(roles = []) {
  return Array.from(
    new Set(
      (Array.isArray(roles) ? roles : [roles])
        .map((role) => normalizeRole(role))
        .filter(Boolean)
    )
  );
}

function normalizeRoles(roles = []) {
  return normalizeUserRoles(roles);
}

export function getPrimaryRole(user) {
  const roles = normalizeRoles(user?.roles);
  return ROLE_PRIORITY.find((role) => roles.includes(role)) || roles[0] || "";
}

export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[normalizeRole(role)] || [];
}

export function getEffectivePermissions(user) {
  const rolePermissions = normalizeRoles(user?.roles).flatMap((role) => getRolePermissions(role));
  const directPermissions = Array.isArray(user?.permisos) ? user.permisos.map((permission) => String(permission || "").trim()) : [];
  return expandPermissions([...rolePermissions, ...directPermissions]);
}

export function hasPermission(user, permission) {
  const normalized = String(permission || "").trim();
  if (!normalized) {
    return false;
  }

  return getEffectivePermissions(user).includes(normalized);
}

export function canAccessCompany(user, companyId) {
  const normalizedCompanyId = String(companyId || "").trim();
  if (!user || !normalizedCompanyId) {
    return false;
  }

  if (hasPermission(user, "ver_todas_empresas")) {
    return true;
  }

  return Array.isArray(user.empresasAsignadas) && user.empresasAsignadas.includes(normalizedCompanyId);
}

export function canViewSensitiveCompanyData(user) {
  return hasPermission(user, "ver_datos_sensibles_empresa");
}

export function canAccessModule(user, moduleName) {
  const permissions = MODULE_PERMISSION_RULES[String(moduleName || "").trim()];
  if (!permissions?.length) {
    return false;
  }

  return permissions.some((permission) => hasPermission(user, permission));
}

export function getVisibleMenuItems(user) {
  const primaryRole = getPrimaryRole(user);
  const isClient = primaryRole === "cliente";
  return APP_MENU_ITEMS.filter((item) => {
    if (isClient) {
      return item.module === "portal_cliente";
    }

    return canAccessModule(user, item.module);
  }).map((item) => ({ ...item }));
}

export function getDefaultViewForUser(user) {
  const primaryRole = getPrimaryRole(user);
  if (primaryRole === "cliente") {
    return "portal-cliente";
  }

  if (canAccessModule(user, "dashboard")) {
    return "dashboard";
  }

  if (canAccessModule(user, "empresas") || canAccessModule(user, "rut")) {
    return "rut";
  }

  if (canAccessModule(user, "calendarios") || canAccessModule(user, "obligaciones") || canAccessModule(user, "tareas")) {
    return "fiscal-calendar";
  }

  if (canAccessModule(user, "usuarios")) {
    return "users";
  }

  return "rut";
}

export function getDashboardVariantForUser(user) {
  if (hasPermission(user, "ver_dashboard_general")) {
    return "general";
  }

  if (hasPermission(user, "ver_dashboard_supervisor")) {
    return "supervisor";
  }

  if (hasPermission(user, "ver_dashboard_usuario")) {
    return "usuario";
  }

  return "sin_dashboard";
}

export function canConfigureVisualIdentity(user) {
  return hasPermission(user, "configurar_identidad_visual") || hasPermission(user, "editar_configuracion");
}
