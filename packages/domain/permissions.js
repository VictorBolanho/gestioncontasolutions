export const ROLES = Object.freeze([
  "cliente",
  "operativo_basico",
  "operativo_medio",
  "supervisor",
  "gerente",
  "administrador",
  "solo_lectura"
]);

export const SENSITIVE_PERMISSIONS = Object.freeze([
  "ver_todas_empresas",
  "ver_contacto_empresa",
  "ver_datos_sensibles_empresa",
  "descargar_documentos_empresa",
  "descargar_rut",
  "crear_usuarios",
  "editar_usuarios",
  "asignar_permisos",
  "registrar_pago",
  "exportar_reportes",
  "ver_dashboard_general",
  "desactivar_empresa",
  "archivar_empresa",
  "reactivar_empresa",
  "configurar_identidad_visual"
]);

export function hasPermission(user, permission) {
  return Boolean(user?.permisos?.includes(permission));
}

export function canAccessCompany(user, companyId) {
  if (!user) {
    return false;
  }

  if (hasPermission(user, "ver_todas_empresas")) {
    return true;
  }

  return Boolean(user.empresasAsignadas?.includes(companyId));
}

export function canConfigureVisualIdentity(user) {
  return hasPermission(user, "configurar_identidad_visual");
}

