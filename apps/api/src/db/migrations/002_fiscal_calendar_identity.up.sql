ALTER TABLE fiscal_calendars
  ADD COLUMN IF NOT EXISTS organizacion_id TEXT,
  ADD COLUMN IF NOT EXISTS pais TEXT,
  ADD COLUMN IF NOT EXISTS tipo_contribuyente TEXT,
  ADD COLUMN IF NOT EXISTS regimen TEXT,
  ADD COLUMN IF NOT EXISTS tipo_pago TEXT,
  ADD COLUMN IF NOT EXISTS numero_cuota INTEGER,
  ADD COLUMN IF NOT EXISTS nombre_cuota TEXT;

UPDATE fiscal_calendars
SET
  organizacion_id = COALESCE(
    NULLIF(BTRIM(payload ->> 'organizacionId'), ''),
    (SELECT MIN(id) FROM organizations HAVING COUNT(*) = 1)
  ),
  pais = COALESCE(NULLIF(BTRIM(payload ->> 'pais'), ''), 'COLOMBIA'),
  tipo_contribuyente = NULLIF(BTRIM(payload ->> 'tipoContribuyente'), ''),
  regimen = NULLIF(BTRIM(payload ->> 'regimen'), ''),
  tipo_pago = NULLIF(BTRIM(payload ->> 'tipoPago'), ''),
  numero_cuota = CASE
    WHEN COALESCE(payload ->> 'numeroCuota', '') ~ '^[0-9]+$'
      THEN (payload ->> 'numeroCuota')::INTEGER
    ELSE NULL
  END,
  nombre_cuota = NULLIF(BTRIM(payload ->> 'nombreCuota'), '');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM fiscal_calendars WHERE organizacion_id IS NULL OR BTRIM(organizacion_id) = '') THEN
    RAISE EXCEPTION
      'No se puede definir la identidad fiscal: hay calendarios sin organizacion y no existe una organizacion de respaldo.';
  END IF;
END $$;

ALTER TABLE fiscal_calendars
  ALTER COLUMN organizacion_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fiscal_calendars_organization_fk'
      AND conrelid = 'fiscal_calendars'::regclass
  ) THEN
    ALTER TABLE fiscal_calendars
      ADD CONSTRAINT fiscal_calendars_organization_fk
      FOREIGN KEY (organizacion_id)
      REFERENCES organizations(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END $$;

DROP INDEX IF EXISTS fiscal_calendars_unique_scope;

CREATE UNIQUE INDEX fiscal_calendars_unique_scope
ON fiscal_calendars (
  organizacion_id,
  impuesto_id,
  anio,
  LOWER(BTRIM(periodo)),
  LOWER(BTRIM(periodicidad)),
  LOWER(BTRIM(nivel)),
  LOWER(BTRIM(COALESCE(pais, 'COLOMBIA'))),
  LOWER(BTRIM(COALESCE(municipio_ciudad, ''))),
  LOWER(BTRIM(COALESCE(departamento, ''))),
  LOWER(BTRIM(COALESCE(criterio_vencimiento, ''))),
  LOWER(BTRIM(COALESCE(ultimo_digito_nit, ''))),
  LOWER(BTRIM(COALESCE(rango_ultimos_digitos_nit, ''))),
  LOWER(BTRIM(COALESCE(digito_verificacion, ''))),
  LOWER(BTRIM(COALESCE(tipo_contribuyente, ''))),
  LOWER(BTRIM(COALESCE(regimen, ''))),
  LOWER(BTRIM(COALESCE(evento_fiscal_clave, ''))),
  LOWER(BTRIM(COALESCE(tipo_pago, ''))),
  (
    CASE
      WHEN numero_cuota IS NOT NULL THEN 'numero:' || numero_cuota::TEXT
      WHEN NULLIF(BTRIM(nombre_cuota), '') IS NOT NULL THEN 'nombre:' || LOWER(BTRIM(nombre_cuota))
      ELSE ''
    END
  ),
  COALESCE(version, 1)
)
WHERE deleted_at IS NULL;
