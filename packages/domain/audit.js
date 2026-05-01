export function createAuditEntry({
  organizacionId,
  usuarioId,
  accion,
  modulo,
  recursoTipo,
  recursoId,
  descripcion,
  valorAnterior = null,
  valorNuevo = null
}) {
  return {
    id: `audit_${Date.now()}`,
    organizacionId,
    usuarioId,
    tipoUsuario: "interno",
    accion,
    modulo,
    recursoTipo,
    recursoId,
    descripcion,
    valorAnterior,
    valorNuevo,
    fecha: new Date().toISOString()
  };
}

