DROP INDEX IF EXISTS fiscal_calendars_unique_scope;

ALTER TABLE fiscal_calendars
  DROP CONSTRAINT IF EXISTS fiscal_calendars_organization_fk;

ALTER TABLE fiscal_calendars
  DROP COLUMN IF EXISTS organizacion_id,
  DROP COLUMN IF EXISTS pais,
  DROP COLUMN IF EXISTS tipo_contribuyente,
  DROP COLUMN IF EXISTS regimen,
  DROP COLUMN IF EXISTS tipo_pago,
  DROP COLUMN IF EXISTS numero_cuota,
  DROP COLUMN IF EXISTS nombre_cuota;

-- El rollback conserva la identidad corregida sobre payload JSONB. Esto permite
-- revertir las columnas proyectadas sin perder calendarios ni reintroducir la
-- restriccion anterior, que no podia representar cuotas o contribuyentes.
CREATE UNIQUE INDEX fiscal_calendars_unique_scope
ON fiscal_calendars (
  COALESCE(NULLIF(BTRIM(payload ->> 'organizacionId'), ''), ''),
  impuesto_id,
  anio,
  LOWER(BTRIM(periodo)),
  LOWER(BTRIM(periodicidad)),
  LOWER(BTRIM(nivel)),
  LOWER(BTRIM(COALESCE(NULLIF(payload ->> 'pais', ''), 'COLOMBIA'))),
  LOWER(BTRIM(COALESCE(municipio_ciudad, ''))),
  LOWER(BTRIM(COALESCE(departamento, ''))),
  LOWER(BTRIM(COALESCE(criterio_vencimiento, ''))),
  LOWER(BTRIM(COALESCE(ultimo_digito_nit, ''))),
  LOWER(BTRIM(COALESCE(rango_ultimos_digitos_nit, ''))),
  LOWER(BTRIM(COALESCE(digito_verificacion, ''))),
  LOWER(BTRIM(COALESCE(payload ->> 'tipoContribuyente', ''))),
  LOWER(BTRIM(COALESCE(payload ->> 'regimen', ''))),
  LOWER(BTRIM(COALESCE(evento_fiscal_clave, ''))),
  LOWER(BTRIM(COALESCE(payload ->> 'tipoPago', ''))),
  (
    CASE
      WHEN COALESCE(payload ->> 'numeroCuota', '') ~ '^[0-9]+$'
        THEN 'numero:' || ((payload ->> 'numeroCuota')::INTEGER)::TEXT
      WHEN NULLIF(BTRIM(payload ->> 'nombreCuota'), '') IS NOT NULL
        THEN 'nombre:' || LOWER(BTRIM(payload ->> 'nombreCuota'))
      ELSE ''
    END
  ),
  COALESCE(version, 1)
)
WHERE deleted_at IS NULL;
