CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  estado TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  etiqueta TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  nit TEXT NOT NULL,
  dv TEXT NOT NULL,
  razon_social TEXT NOT NULL,
  estado_empresa TEXT NOT NULL CHECK (estado_empresa IN ('borrador', 'pendiente_revision', 'activa', 'suspendida', 'inactiva', 'archivada')),
  documento_rut_id TEXT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL,
  CONSTRAINT companies_nit_dv_unique UNIQUE (nit, dv)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  estado TEXT NOT NULL CHECK (estado IN ('activo', 'inactivo')),
  primary_role TEXT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE SET NULL,
  supervisor_id TEXT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  password_salt TEXT NULL,
  password_hash TEXT NULL,
  ultimo_login_at TIMESTAMPTZ NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id TEXT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, permission_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS company_assignments (
  user_id TEXT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, company_id)
);

CREATE TABLE IF NOT EXISTS supervisor_assignments (
  supervisor_user_id TEXT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  supervised_user_id TEXT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (supervisor_user_id, supervised_user_id),
  CONSTRAINT supervisor_assignments_no_self CHECK (supervisor_user_id <> supervised_user_id)
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NULL REFERENCES companies(id) ON UPDATE CASCADE ON DELETE SET NULL,
  extraction_id TEXT NULL UNIQUE,
  tipo_documento TEXT NOT NULL,
  mime_type TEXT NULL,
  ruta_archivo TEXT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS document_extractions (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NULL REFERENCES companies(id) ON UPDATE CASCADE ON DELETE SET NULL,
  documento_id TEXT NULL UNIQUE REFERENCES documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  estado_extraccion TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NULL,
  confirmed_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS taxes (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  nivel TEXT NOT NULL,
  estado TEXT NOT NULL,
  periodicidad_default TEXT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS tax_rules (
  id TEXT PRIMARY KEY,
  codigo_responsabilidad_rut TEXT NOT NULL,
  impuesto_id TEXT NULL REFERENCES taxes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  estado TEXT NOT NULL,
  accion_sugerida TEXT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS inferred_tax_rules (
  id TEXT PRIMARY KEY,
  impuesto_id TEXT NULL REFERENCES taxes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  estado TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS company_obligations (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES companies(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  impuesto_id TEXT NOT NULL REFERENCES taxes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  estado TEXT NOT NULL CHECK (estado IN ('sugerida', 'activa', 'confirmada', 'pendiente_revision', 'no_aplica', 'inactiva', 'suspendida_por_empresa', 'inactiva_por_empresa')),
  nivel TEXT NULL,
  periodicidad_aplicable TEXT NULL,
  municipio_aplicacion TEXT NULL,
  departamento_aplicacion TEXT NULL,
  evento_fiscal_clave TEXT NULL,
  confirmed_by_user TEXT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS company_obligations_active_unique
ON company_obligations (
  empresa_id,
  impuesto_id,
  COALESCE(periodicidad_aplicable, ''),
  COALESCE(municipio_aplicacion, ''),
  COALESCE(departamento_aplicacion, ''),
  COALESCE(evento_fiscal_clave, '')
)
WHERE deleted_at IS NULL
  AND estado IN ('activa', 'confirmada', 'pendiente_revision', 'sugerida');

CREATE TABLE IF NOT EXISTS fiscal_calendars (
  id TEXT PRIMARY KEY,
  impuesto_id TEXT NOT NULL REFERENCES taxes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  anio INTEGER NOT NULL,
  periodo TEXT NOT NULL,
  periodicidad TEXT NOT NULL,
  nivel TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('borrador', 'validado', 'activo', 'reemplazado', 'anulado')),
  version INTEGER NULL,
  criterio_vencimiento TEXT NULL,
  fecha_vencimiento DATE NULL,
  municipio_ciudad TEXT NULL,
  departamento TEXT NULL,
  ultimo_digito_nit TEXT NULL,
  rango_ultimos_digitos_nit TEXT NULL,
  digito_verificacion TEXT NULL,
  evento_fiscal_clave TEXT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS fiscal_calendars_unique_scope
ON fiscal_calendars (
  impuesto_id,
  anio,
  periodo,
  periodicidad,
  COALESCE(nivel, ''),
  COALESCE(municipio_ciudad, ''),
  COALESCE(departamento, ''),
  COALESCE(criterio_vencimiento, ''),
  COALESCE(ultimo_digito_nit, ''),
  COALESCE(rango_ultimos_digitos_nit, ''),
  COALESCE(digito_verificacion, ''),
  COALESCE(evento_fiscal_clave, ''),
  COALESCE(version, 0)
)
WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS fiscal_calendar_versions (
  id TEXT PRIMARY KEY,
  calendario_fiscal_id TEXT NOT NULL REFERENCES fiscal_calendars(id) ON UPDATE CASCADE ON DELETE CASCADE,
  version INTEGER NOT NULL,
  fecha_cambio TIMESTAMPTZ NULL,
  cambiado_por TEXT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  estado_anterior TEXT NULL,
  estado_nuevo TEXT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fiscal_tasks (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES companies(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  responsable_id TEXT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  supervisor_id TEXT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  obligacion_fiscal_empresa_id TEXT NULL REFERENCES company_obligations(id) ON UPDATE CASCADE ON DELETE SET NULL,
  calendario_fiscal_id TEXT NULL REFERENCES fiscal_calendars(id) ON UPDATE CASCADE ON DELETE SET NULL,
  impuesto_id TEXT NULL REFERENCES taxes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  tipo_tarea TEXT NOT NULL,
  origen TEXT NULL,
  estado_operativo TEXT NOT NULL CHECK (estado_operativo IN ('pendiente', 'en_proceso', 'presentada', 'completada', 'vencida', 'cancelada', 'no_aplica')),
  etapa_gestion TEXT NULL,
  estado_pago TEXT NULL,
  periodo TEXT NULL,
  anio INTEGER NULL,
  fecha_vencimiento DATE NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS fiscal_tasks_unique_operational_scope
ON fiscal_tasks (
  empresa_id,
  COALESCE(obligacion_fiscal_empresa_id, ''),
  COALESCE(calendario_fiscal_id, ''),
  COALESCE(periodo, ''),
  COALESCE(anio, 0),
  COALESCE((payload ->> 'cumplimientoFiscal'), 'general')
)
WHERE deleted_at IS NULL
  AND tipo_tarea = 'fiscal';

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  tarea_id TEXT NULL REFERENCES fiscal_tasks(id) ON UPDATE CASCADE ON DELETE SET NULL,
  empresa_id TEXT NULL REFERENCES companies(id) ON UPDATE CASCADE ON DELETE SET NULL,
  responsable_id TEXT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  nivel TEXT NOT NULL CHECK (nivel IN ('informativa', 'preventiva', 'critica')),
  estado TEXT NOT NULL CHECK (estado IN ('no_leida', 'leida', 'atendida', 'descartada')),
  condition_hash TEXT NULL,
  fecha_vencimiento DATE NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS alerts_condition_unique
ON alerts (condition_hash)
WHERE deleted_at IS NULL
  AND condition_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  organizacion_id TEXT NULL REFERENCES organizations(id) ON UPDATE CASCADE ON DELETE SET NULL,
  usuario_id TEXT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  modulo TEXT NULL,
  accion TEXT NULL,
  recurso_tipo TEXT NULL,
  recurso_id TEXT NULL,
  fecha TIMESTAMPTZ NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS system_configurations (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_primary_role_idx ON users(primary_role);
CREATE INDEX IF NOT EXISTS users_supervisor_idx ON users(supervisor_id);
CREATE INDEX IF NOT EXISTS company_assignments_company_idx ON company_assignments(company_id);
CREATE INDEX IF NOT EXISTS documents_company_idx ON documents(empresa_id);
CREATE INDEX IF NOT EXISTS document_extractions_company_idx ON document_extractions(empresa_id);
CREATE INDEX IF NOT EXISTS tax_rules_impuesto_idx ON tax_rules(impuesto_id);
CREATE INDEX IF NOT EXISTS company_obligations_company_idx ON company_obligations(empresa_id);
CREATE INDEX IF NOT EXISTS company_obligations_tax_idx ON company_obligations(impuesto_id);
CREATE INDEX IF NOT EXISTS fiscal_calendars_tax_idx ON fiscal_calendars(impuesto_id);
CREATE INDEX IF NOT EXISTS fiscal_tasks_company_idx ON fiscal_tasks(empresa_id);
CREATE INDEX IF NOT EXISTS fiscal_tasks_responsable_idx ON fiscal_tasks(responsable_id);
CREATE INDEX IF NOT EXISTS fiscal_tasks_calendar_idx ON fiscal_tasks(calendario_fiscal_id);
CREATE INDEX IF NOT EXISTS alerts_company_idx ON alerts(empresa_id);
CREATE INDEX IF NOT EXISTS alerts_responsable_idx ON alerts(responsable_id);
CREATE INDEX IF NOT EXISTS alerts_task_idx ON alerts(tarea_id);
CREATE INDEX IF NOT EXISTS audit_logs_fecha_idx ON audit_logs(fecha DESC);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
