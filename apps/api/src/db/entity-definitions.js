function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeOptionalUserReference(value) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = normalizeText(value);
  return normalized && normalized.toLowerCase() !== "system" ? normalized : null;
}

function toNullableInt(value) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toJson(value) {
  return value ?? null;
}

export const COLLECTION_ORDER = Object.freeze([
  "organization",
  "companies",
  "documents",
  "extractions",
  "taxes",
  "taxRules",
  "inferredTaxRules",
  "users",
  "companyObligations",
  "fiscalCalendars",
  "fiscalCalendarVersions",
  "fiscalTasks",
  "internalAlerts",
  "audits",
  "sessions"
]);

export const COLLECTION_DEFINITIONS = Object.freeze({
  organization: {
    mode: "singleton",
    table: "organizations",
    idField: "id",
    orderBy: "updated_at NULLS LAST, id",
    columns: {
      id: (item) => normalizeText(item?.id),
      nombre: (item) => normalizeText(item?.nombre),
      estado: (item) => normalizeText(item?.estado),
      payload: toJson,
      created_at: (item) => normalizeText(item?.createdAt) || null,
      updated_at: (item) => normalizeText(item?.updatedAt) || null
    }
  },
  users: {
    mode: "collection",
    table: "users",
    idField: "id",
    orderBy: "created_at NULLS LAST, id",
    columns: {
      id: (item) => normalizeText(item?.id),
      email: (item) => normalizeText(item?.email).toLowerCase(),
      estado: (item) => normalizeText(item?.estado || item?.status || "activo"),
      primary_role: (item) => normalizeText(item?.primaryRole || item?.roles?.[0] || ""),
      supervisor_id: (item) => normalizeText(item?.supervisorId) || null,
      password_salt: (item) => normalizeText(item?.passwordSalt) || null,
      password_hash: (item) => normalizeText(item?.passwordHash) || null,
      ultimo_login_at: (item) => normalizeText(item?.ultimoLoginAt) || null,
      created_at: (item) => normalizeText(item?.createdAt) || null,
      updated_at: (item) => normalizeText(item?.updatedAt) || null,
      payload: toJson
    }
  },
  companies: {
    mode: "collection",
    table: "companies",
    idField: "id",
    orderBy: "created_at NULLS LAST, id",
    columns: {
      id: (item) => normalizeText(item?.id),
      nit: (item) => normalizeText(item?.nit),
      dv: (item) => normalizeText(item?.dv),
      razon_social: (item) => normalizeText(item?.razonSocial),
      estado_empresa: (item) => normalizeText(item?.estadoEmpresa),
      documento_rut_id: (item) => normalizeText(item?.documentoRutId) || null,
      created_at: (item) => normalizeText(item?.createdAt) || null,
      updated_at: (item) => normalizeText(item?.updatedAt) || null,
      payload: toJson
    }
  },
  documents: {
    mode: "collection",
    table: "documents",
    idField: "id",
    orderBy: "created_at NULLS LAST, id",
    columns: {
      id: (item) => normalizeText(item?.id),
      empresa_id: (item) => normalizeText(item?.empresaId) || null,
      extraction_id: (item) => normalizeText(item?.extractionId) || null,
      tipo_documento: (item) => normalizeText(item?.tipoDocumento),
      mime_type: (item) => normalizeText(item?.mimeType) || null,
      ruta_archivo: (item) => normalizeText(item?.rutaArchivo) || null,
      created_at: (item) => normalizeText(item?.createdAt) || null,
      payload: toJson
    }
  },
  extractions: {
    mode: "collection",
    table: "document_extractions",
    idField: "id",
    orderBy: "created_at NULLS LAST, id",
    columns: {
      id: (item) => normalizeText(item?.id),
      empresa_id: (item) => normalizeText(item?.empresaId) || null,
      documento_id: (item) => normalizeText(item?.documentoId) || null,
      estado_extraccion: (item) => normalizeText(item?.estadoExtraccion),
      created_at: (item) => normalizeText(item?.createdAt) || null,
      confirmed_at: (item) => normalizeText(item?.confirmedAt) || null,
      payload: toJson
    }
  },
  taxes: {
    mode: "collection",
    table: "taxes",
    idField: "id",
    orderBy: "nombre, id",
    columns: {
      id: (item) => normalizeText(item?.id),
      codigo: (item) => normalizeText(item?.codigo),
      nombre: (item) => normalizeText(item?.nombre),
      nivel: (item) => normalizeText(item?.nivel),
      estado: (item) => normalizeText(item?.estado),
      periodicidad_default: (item) => normalizeText(item?.periodicidadDefault) || null,
      payload: toJson
    }
  },
  taxRules: {
    mode: "collection",
    table: "tax_rules",
    idField: "id",
    orderBy: "id",
    columns: {
      id: (item) => normalizeText(item?.id),
      codigo_responsabilidad_rut: (item) => normalizeText(item?.codigoResponsabilidadRut),
      impuesto_id: (item) => normalizeText(item?.impuestoId) || null,
      estado: (item) => normalizeText(item?.estado),
      accion_sugerida: (item) => normalizeText(item?.accionSugerida) || null,
      payload: toJson
    }
  },
  inferredTaxRules: {
    mode: "collection",
    table: "inferred_tax_rules",
    idField: "id",
    orderBy: "id",
    columns: {
      id: (item) => normalizeText(item?.id),
      impuesto_id: (item) => normalizeText(item?.impuestoId) || null,
      estado: (item) => normalizeText(item?.estado),
      payload: toJson
    }
  },
  companyObligations: {
    mode: "collection",
    table: "company_obligations",
    idField: "id",
    orderBy: "created_at NULLS LAST, id",
    columns: {
      id: (item) => normalizeText(item?.id),
      empresa_id: (item) => normalizeText(item?.empresaId),
      impuesto_id: (item) => normalizeText(item?.impuestoId),
      estado: (item) => normalizeText(item?.estado),
      nivel: (item) => normalizeText(item?.nivel) || null,
      periodicidad_aplicable: (item) => normalizeText(item?.periodicidadAplicable || item?.periodicidad) || null,
      municipio_aplicacion: (item) => normalizeText(item?.municipioAplicacion) || null,
      departamento_aplicacion: (item) => normalizeText(item?.departamentoAplicacion) || null,
      evento_fiscal_clave: (item) => normalizeText(item?.eventoFiscalClave) || null,
      confirmed_by_user: (item) =>
        normalizeOptionalUserReference(item?.confirmadoPorUsuario),
      created_at: (item) => normalizeText(item?.createdAt) || null,
      updated_at: (item) => normalizeText(item?.updatedAt) || null,
      payload: toJson
    }
  },
  fiscalCalendars: {
    mode: "collection",
    table: "fiscal_calendars",
    idField: "id",
    orderBy: "anio DESC NULLS LAST, periodo, id",
    columns: {
      id: (item) => normalizeText(item?.id),
      organizacion_id: (item) => normalizeText(item?.organizacionId),
      impuesto_id: (item) => normalizeText(item?.impuestoId),
      anio: (item) => toNullableInt(item?.anio),
      periodo: (item) => normalizeText(item?.periodo),
      periodicidad: (item) => normalizeText(item?.periodicidad),
      nivel: (item) => normalizeText(item?.nivel),
      pais: (item) => normalizeText(item?.pais || "COLOMBIA"),
      estado: (item) => normalizeText(item?.estado),
      version: (item) => toNullableInt(item?.version),
      criterio_vencimiento: (item) => normalizeText(item?.criterioVencimiento) || null,
      fecha_vencimiento: (item) => normalizeText(item?.fechaVencimiento) || null,
      municipio_ciudad: (item) => normalizeText(item?.municipioCiudad || item?.municipio) || null,
      departamento: (item) => normalizeText(item?.departamento) || null,
      ultimo_digito_nit: (item) => normalizeText(item?.ultimoDigitoNit) || null,
      rango_ultimos_digitos_nit: (item) => normalizeText(item?.rangoUltimosDigitosNit) || null,
      digito_verificacion: (item) => normalizeText(item?.digitoVerificacion) || null,
      tipo_contribuyente: (item) => normalizeText(item?.tipoContribuyente) || null,
      regimen: (item) => normalizeText(item?.regimen) || null,
      evento_fiscal_clave: (item) => normalizeText(item?.eventoFiscalClave) || null,
      tipo_pago: (item) => normalizeText(item?.tipoPago) || null,
      numero_cuota: (item) => toNullableInt(item?.numeroCuota),
      nombre_cuota: (item) => normalizeText(item?.nombreCuota) || null,
      created_at: (item) => normalizeText(item?.createdAt) || null,
      updated_at: (item) => normalizeText(item?.updatedAt) || null,
      payload: toJson
    }
  },
  fiscalCalendarVersions: {
    mode: "collection",
    table: "fiscal_calendar_versions",
    idField: "id",
    orderBy: "fecha_cambio DESC NULLS LAST, id",
    columns: {
      id: (item) => normalizeText(item?.id),
      calendario_fiscal_id: (item) => normalizeText(item?.calendarioFiscalId),
      version: (item) => toNullableInt(item?.version),
      fecha_cambio: (item) => normalizeText(item?.fechaCambio) || null,
      cambiado_por: (item) => normalizeText(item?.cambiadoPor) || null,
      estado_anterior: (item) => normalizeText(item?.estadoAnterior) || null,
      estado_nuevo: (item) => normalizeText(item?.estadoNuevo) || null,
      payload: toJson
    }
  },
  fiscalTasks: {
    mode: "collection",
    table: "fiscal_tasks",
    idField: "id",
    orderBy: "created_at NULLS LAST, id",
    columns: {
      id: (item) => normalizeText(item?.id),
      empresa_id: (item) => normalizeText(item?.empresaId),
      responsable_id: (item) => normalizeText(item?.responsableId) || null,
      supervisor_id: (item) => normalizeText(item?.supervisorId) || null,
      obligacion_fiscal_empresa_id: (item) => normalizeText(item?.obligacionFiscalEmpresaId) || null,
      calendario_fiscal_id: (item) => normalizeText(item?.calendarioFiscalId) || null,
      impuesto_id: (item) => normalizeText(item?.impuestoId) || null,
      tipo_tarea: (item) => normalizeText(item?.tipoTarea),
      origen: (item) => normalizeText(item?.origen) || null,
      estado_operativo: (item) => normalizeText(item?.estadoOperativo || item?.estadoGeneral),
      etapa_gestion: (item) => normalizeText(item?.etapaGestion) || null,
      estado_pago: (item) => normalizeText(item?.estadoPago) || null,
      periodo: (item) => normalizeText(item?.periodo) || null,
      anio: (item) => toNullableInt(item?.anio),
      fecha_vencimiento: (item) => normalizeText(item?.fechaVencimiento) || null,
      created_at: (item) => normalizeText(item?.createdAt) || null,
      updated_at: (item) => normalizeText(item?.updatedAt) || null,
      payload: toJson
    }
  },
  internalAlerts: {
    mode: "collection",
    table: "alerts",
    idField: "id",
    orderBy: "created_at NULLS LAST, id",
    columns: {
      id: (item) => normalizeText(item?.id),
      tarea_id: (item) => normalizeText(item?.tareaId) || null,
      empresa_id: (item) => normalizeText(item?.empresaId) || null,
      responsable_id: (item) => normalizeText(item?.responsableId) || null,
      tipo: (item) => normalizeText(item?.tipo),
      nivel: (item) => normalizeText(item?.nivel),
      estado: (item) => normalizeText(item?.estado),
      condition_hash: (item) => normalizeText(item?.conditionHash) || null,
      fecha_vencimiento: (item) => normalizeText(item?.fechaVencimiento) || null,
      created_at: (item) => normalizeText(item?.createdAt) || null,
      updated_at: (item) => normalizeText(item?.updatedAt) || null,
      payload: toJson
    }
  },
  audits: {
    mode: "collection",
    table: "audit_logs",
    idField: "id",
    orderBy: "fecha DESC NULLS LAST, id",
    columns: {
      id: (item) => normalizeText(item?.id),
      organizacion_id: (item) => normalizeText(item?.organizacionId) || null,
      usuario_id: (item) => normalizeOptionalUserReference(item?.usuarioId),
      modulo: (item) => normalizeText(item?.modulo) || null,
      accion: (item) => normalizeText(item?.accion) || null,
      recurso_tipo: (item) => normalizeText(item?.recursoTipo) || null,
      recurso_id: (item) => normalizeText(item?.recursoId) || null,
      fecha: (item) => normalizeText(item?.fecha) || normalizeText(item?.createdAt) || null,
      payload: toJson
    }
  },
  sessions: {
    mode: "collection",
    table: "sessions",
    idField: "token",
    orderBy: "created_at NULLS LAST, token",
    columns: {
      token: (item) => normalizeText(item?.token),
      user_id: (item) => normalizeText(item?.userId) || null,
      expires_at: (item) => normalizeText(item?.expiresAt) || null,
      created_at: (item) => normalizeText(item?.createdAt) || null,
      payload: toJson
    }
  }
});
