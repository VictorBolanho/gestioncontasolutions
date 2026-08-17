# Respaldo y restauracion inicial - Fase 8

Este documento conserva la contingencia del driver JSON. Para el piloto PostgreSQL,
incluido el volumen persistente de PDF RUT, usa `docs/deployment-testing.md`.

## Antes de migrar

Respaldar:

- `apps/api/data/*.json`
- `apps/api/data/uploads/rut`
- `.env` local

## Recuperacion

Si la migracion a PostgreSQL falla:

1. volver a `STORAGE_DRIVER=json`;
2. restaurar los JSON respaldados;
3. conservar la base fallida para analisis;
4. repetir `db:migrate-json:dry-run`.
