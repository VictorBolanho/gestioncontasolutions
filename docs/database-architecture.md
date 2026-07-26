# Arquitectura de persistencia - Fase 8

## Objetivo

Introducir PostgreSQL sin romper la logica estable de las Fases 1 a 7 y sin eliminar de inmediato la persistencia JSON local.

## Motor elegido

- PostgreSQL

Justificacion:

- relaciones fuertes entre usuarios, empresas, obligaciones, calendarios, tareas, alertas y auditoria;
- soporte nativo de transacciones, restricciones, indices y claves foraneas;
- coincide con la preferencia tecnica definida para Fase 8.

## Estrategia de transicion

La aplicacion reconoce:

- `STORAGE_DRIVER=json`
- `STORAGE_DRIVER=database`

Reglas:

- solo un driver activo a la vez;
- JSON sigue siendo el modo operativo por defecto;
- PostgreSQL se introduce con migraciones versionadas;
- no se escriben ambos drivers simultaneamente.

## Capa de persistencia

Se mantuvo la API publica de `apps/api/src/lib/storage.js`.

Implementaciones actuales:

- `apps/api/src/lib/storage-json-driver.js`
- `apps/api/src/db/database-storage.js`
- `apps/api/src/db/database-storage-bridge.js`
- `apps/api/src/db/database-storage-worker.js`

## Modelo relacional

Tablas principales:

- `organizations`
- `roles`
- `permissions`
- `role_permissions`
- `users`
- `user_roles`
- `user_permissions`
- `company_assignments`
- `supervisor_assignments`
- `companies`
- `documents`
- `document_extractions`
- `taxes`
- `tax_rules`
- `inferred_tax_rules`
- `company_obligations`
- `fiscal_calendars`
- `fiscal_calendar_versions`
- `fiscal_tasks`
- `alerts`
- `audit_logs`
- `sessions`
- `system_configurations`

## Compatibilidad operativa

Las tablas principales combinan:

- columnas relacionales clave;
- `payload JSONB` con la forma actual del registro.

Esto permite aplicar integridad en la base sin romper la forma de los objetos que consumen hoy los servicios.

## Restricciones destacadas

- `companies(nit, dv)` unico
- `users.email` unico
- `taxes.codigo` unico
- indice unico operacional para obligaciones vigentes
- indice unico operacional para tareas fiscales
- indice unico por `condition_hash` en alertas

## Riesgos conocidos en esta etapa

- el bridge sincronico de PostgreSQL prioriza compatibilidad sobre rendimiento;
- la migracion completa a repositorios async nativos sigue pendiente;
- las pruebas de integracion real requieren una base PostgreSQL disponible.
