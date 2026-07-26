# Estado actual del proyecto

Fecha de cierre del estado actual: 2026-07-10

## Fases completadas

- Fase 0 - Fundacion tecnica del sistema
- Fase 1 - Empresa desde PDF RUT con revision humana
- Fase 2 - Motor de impuestos y obligaciones fiscales
- Fase 3 - Calendario fiscal, versionamiento y tareas fiscales preliminares
- Fase 4 - Usuarios, cargos, roles, permisos y seguridad operativa
- Fase 5 - Gestion integral de tareas fiscales y no fiscales
- Fase 6 - Alertas internas, vencimientos y sincronizacion operativa
- Fase 7 - Dashboard gerencial, reportes e indicadores

## Fase en progreso

- Fase 8 - Base de datos y persistencia real

## Funcionalidades funcionando

- API y frontend separados y ejecutables.
- Inicio de sesion con token y cierre de sesion.
- Carga de PDF RUT.
- Extraccion de texto PDF basada en parser de texto.
- Revision humana previa a creacion de empresa.
- Creacion de empresa con validacion de NIT + DV.
- Persistencia local en JSON.
- Documento RUT asociado a la empresa.
- Activacion manual de empresa luego de revision.
- Catalogo CIIU base reutilizable.
- Analisis de obligaciones sugeridas desde perfil tributario efectivo.
- Confirmacion, no aplica y revision de obligaciones.
- Vista separada de `Calendario fiscal`.
- Creacion y edicion manual de impuestos.
- Navegacion por secciones:
  - catalogo de impuestos
  - calendario fiscal versionado
  - asignacion de impuestos a empresas
  - calendario operativo
  - alertas fiscales
- Creacion, activacion y reemplazo de calendarios fiscales.
- Asignacion manual de impuestos a empresas.
- Generacion de tareas fiscales sin duplicacion.
- Regeneracion de tareas al activar obligaciones o calendarios aplicables.
- Reprogramacion de tareas abiertas cuando un calendario activo es reemplazado.
- Tareas fiscales visibles en el detalle de empresa.
- Auditoria de eventos clave.
- Usuarios internos persistidos en JSON.
- Roles base y permisos efectivos por rol.
- Filtro de empresas por asignacion de usuario.
- Administracion basica de usuarios.
- Reset seguro de datos locales de desarrollo.
- Panel general de tareas fiscales y no fiscales.
- Creacion manual de tareas no fiscales.
- Asignacion y reasignacion de responsables.
- Cambios de estado operativo: pendiente, en proceso, presentada, completada, vencida, cancelada y no aplica.
- Cierre operativo de tareas.
- Filtros por empresa, responsable, estado, vencimiento y tipo de tarea.
- Alertas internas por tareas vencidas o proximas a vencer.
- Estados de alerta `no_leida`, `leida`, `atendida` y `descartada`.
- Motivo opcional al atender o descartar alertas.
- Filtros de alertas por empresa, responsable, tipo, nivel y estado.
- Trazabilidad de generacion, lectura, atencion, descarte y rechazo de transicion invalida.
- Dashboard operativo conectado a alertas reconciliadas y visibles segun rol.
- Dashboard gerencial filtrable por fecha, empresa, responsable, estado, impuesto, riesgo, periodo y vista.
- Indicadores de cumplimiento, vencimientos, riesgo y carga operativa calculados sobre tareas visibles.
- Reportes gerenciales consistentes con el dashboard y exportacion CSV protegida por permisos.
- Alertas gerenciales para huecos operativos como obligaciones activas sin tarea fiscal o tareas proximas sin responsable.
- Driver de persistencia seleccionable por `STORAGE_DRIVER=json|database`.
- Capa JSON original aislada en `storage-json-driver.js` para una transicion reversible.
- Infraestructura inicial de PostgreSQL con pool, configuracion por entorno y worker dedicado.
- Esquema relacional versionado con migraciones SQL y rollback controlado.
- Semillas tecnicas y demo preparadas para modo `database`.
- Script de migracion desde JSON con validacion, conteos y `dry-run`.

## Endpoints disponibles

- `GET /health`
- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET /api/bootstrap`
- `POST /api/rut-uploads`
- `GET /api/rut-uploads/:id`
- `POST /api/rut-uploads/:id/confirm`
- `GET /api/companies`
- `GET /api/companies/:id`
- `PATCH /api/companies/:id/approve-review`
- `POST /api/companies/:id/analyze-obligations`
- `GET /api/companies/:id/obligations`
- `PATCH /api/company-obligations/:id/confirm`
- `PATCH /api/company-obligations/:id/not-applicable`
- `PATCH /api/company-obligations/:id/review`
- `PATCH /api/company-obligations/:id`
- `GET /api/taxes`
- `POST /api/taxes`
- `PATCH /api/taxes/:id`
- `GET /api/tax-rules`
- `GET /api/fiscal-calendars`
- `POST /api/fiscal-calendars`
- `GET /api/fiscal-calendars/:id`
- `PATCH /api/fiscal-calendars/:id`
- `PATCH /api/fiscal-calendars/:id/activate`
- `PATCH /api/fiscal-calendars/:id/cancel`
- `POST /api/fiscal-calendars/:id/replace`
- `POST /api/fiscal-calendars/generate-tasks`
- `GET /api/fiscal-tasks`
- `GET /api/fiscal-tasks/:id`
- `GET /api/companies/:id/fiscal-tasks`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id/status`
- `PATCH /api/tasks/:id/assign`
- `PATCH /api/tasks/:id/close`
- `GET /api/task-responsibles`
- `GET /api/alerts`
- `POST /api/alerts/generate`
- `PATCH /api/alerts/:id/status`
- `GET /api/dashboard`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/deadlines`
- `GET /api/dashboard/compliance`
- `GET /api/dashboard/risk`
- `GET /api/dashboard/workload`
- `GET /api/dashboard/manager-alerts`
- `GET /api/reports/management/types`
- `GET /api/reports/management`
- `GET /api/reports/management/export`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`

## Servicios y archivos principales

- `apps/api/src/server.js`
- `apps/api/src/lib/obligations-service.js`
- `apps/api/src/lib/fiscal-calendar-service.js`
- `apps/api/src/lib/task-service.js`
- `apps/api/src/lib/alert-service.js`
- `apps/api/src/lib/alert-access.js`
- `apps/api/src/lib/access-control.js`
- `apps/api/src/lib/dashboard-service.js`
- `apps/api/src/lib/client-report-service.js`
- `apps/api/src/lib/storage.js`
- `apps/api/src/lib/storage-json-driver.js`
- `apps/api/src/db/database-config.js`
- `apps/api/src/db/postgres-client.js`
- `apps/api/src/db/entity-definitions.js`
- `apps/api/src/db/database-storage.js`
- `apps/api/src/db/database-storage-worker.js`
- `apps/api/src/db/database-storage-bridge.js`
- `apps/api/src/db/migrations.js`
- `apps/api/src/db/seed.js`
- `apps/web/src/app.js`
- `apps/web/styles.css`
- `packages/domain/index.js`
- `packages/domain/permissions.js`
- `scripts/alerts-consistency-test.js`
- `scripts/alerts-filters-permissions-test.js`
- `scripts/alerts-phase6-closure-test.js`
- `scripts/db-migrate.js`
- `scripts/db-migrate-rollback.js`
- `scripts/db-seed.js`
- `scripts/db-reset-test.js`
- `scripts/db-migrate-json.js`
- `scripts/test-db.js`
- `scripts/smoke-test.js`

## Flujo validado de Fase 6 y 7

1. Cargar PDF RUT.
2. Revisar datos extraidos.
3. Confirmar y crear empresa.
4. Aprobar revision y activar empresa.
5. Analizar obligaciones.
6. Confirmar o activar obligaciones aplicables.
7. Activar calendario fiscal compatible cuando exista.
8. Generar tarea fiscal desde la combinacion obligacion activa + calendario activo.
9. Reprogramar o cerrar tarea cuando el calendario activo se reemplaza.
10. Reconciliar alertas vigentes desde tareas abiertas.
11. Consultar el mismo conjunto reconciliado desde `GET /api/alerts` y `GET /api/dashboard`.
12. Gestionar estados de alerta segun permisos y alcance del usuario.
13. Consumir indicadores gerenciales y reportes desde el mismo universo visible de tareas y alertas.
14. Exportar reportes CSV sin recalculos paralelos en frontend.

## Reglas importantes

- El motor de obligaciones usa `getCompanyEffectiveTaxProfile(company)`.
- `datosConfirmadosPorUsuario` tiene prioridad sobre `datosExtraidosOriginales`.
- `datosExtraidosOriginales` se conservan solo para trazabilidad.
- Empresas `suspendida`, `inactiva` o `archivada` no generan nuevas obligaciones.
- Empresas no activas no generan tareas fiscales.
- Confirmar una obligacion requiere empresa `activa`.
- Marcar `no_aplica` o `pendiente_revision` se permite sin activar automaticamente la obligacion.
- El calendario fiscal es un modulo separado del flujo RUT.
- La periodicidad del calendario se controla por lista, no como texto libre.
- `municipioCiudad` es el campo visual principal para ciudad/municipio, manteniendo compatibilidad con `municipio`.
- La obligacion fiscal de empresa define la periodicidad aplicable real.
- La tarea fiscal se genera con el calendario realmente aplicable por impuesto, ubicacion y criterio de vencimiento.
- Las alertas fiscales e internas nacen desde tareas; no existe una generacion paralela directa desde obligaciones.
- `conditionHash` identifica la condicion operativa por tarea, tipo de alerta, nivel y fecha de vencimiento.
- Una alerta `atendida` o `descartada` no reaparece para la misma condicion.
- Un cambio real de vencimiento puede crear una nueva condicion y, por tanto, una nueva alerta.
- `GET /api/alerts`, cambio de estado y dashboard respetan la misma visibilidad por rol y empresa.
- `GET /api/dashboard`, sus endpoints seccionales y `GET /api/reports/management` respetan la misma visibilidad por rol y empresa.
- `leida` requiere acceso visible a la alerta; `atendida` y `descartada` requieren `gestionar_alertas`.
- El dashboard excluye alertas terminales de sus indicadores activos.
- La exportacion CSV gerencial exige `exportar_reportes`.
- La aplicacion arranca en un unico modo de persistencia definido por `STORAGE_DRIVER`.
- En modo `database`, la API requiere migraciones aplicadas antes de operar.

## Pruebas y validaciones ejecutadas

Validaciones de sintaxis:

- `node --check apps/api/src/lib/access-control.js`
- `node --check apps/api/src/lib/alert-access.js`
- `node --check apps/api/src/lib/alert-service.js`
- `node --check apps/api/src/lib/dashboard-service.js`
- `node --check apps/api/src/lib/fiscal-calendar-service.js`
- `node --check apps/api/src/lib/task-service.js`
- `node --check apps/api/src/server.js`
- `node --check apps/web/src/app.js`
- `node --check scripts/alerts-phase6-closure-test.js`
- `node --check scripts/dashboard-phase7-test.js`
- `node --check scripts/clean-onboarding-test.js`
- `node --check scripts/role-permissions-test.js`
- `node --check apps/api/src/lib/storage.js`
- `node --check apps/api/src/lib/storage-json-driver.js`
- `node --check apps/api/src/db/database-config.js`
- `node --check apps/api/src/db/postgres-client.js`
- `node --check apps/api/src/db/entity-definitions.js`
- `node --check apps/api/src/db/database-storage.js`
- `node --check apps/api/src/db/database-storage-worker.js`
- `node --check apps/api/src/db/database-storage-bridge.js`
- `node --check apps/api/src/db/migrations.js`
- `node --check apps/api/src/db/seed.js`
- `node --check scripts/db-migrate.js`
- `node --check scripts/db-migrate-rollback.js`
- `node --check scripts/db-seed.js`
- `node --check scripts/db-reset-test.js`
- `node --check scripts/db-migrate-json.js`
- `node --check scripts/test-db.js`
- `node --check scripts/run-all-tests.js`

Pruebas funcionales ejecutadas en secuencia:

- `node scripts/clean-onboarding-test.js`
- `node scripts/module-access-test.js`
- `node scripts/role-permissions-test.js`
- `node scripts/alerts-consistency-test.js`
- `node scripts/alerts-filters-permissions-test.js`
- `node scripts/alerts-phase6-closure-test.js`
- `node scripts/dashboard-phase7-test.js`
- `node scripts/smoke-test.js`
- `node scripts/test-db.js`
- `node scripts/db-migrate-json.js --dry-run`

Notas de validacion:

- El proyecto no define scripts de `lint` ni `build` en `package.json`.
- Las pruebas se ejecutan en secuencia porque comparten y restauran datasets JSON de desarrollo.
- Al finalizar la validacion se restablecen semillas demo con `node scripts/reset-dev-data.js --confirm --keep-demo-seeds`.

## Limitaciones actuales

- La persistencia operativa por defecto sigue en JSON mientras se cierra la transicion a PostgreSQL.
- Catalogo CIIU inicial, no completo.
- Extraccion de RUT basada en texto PDF, no OCR completo.
- Catalogo de impuestos editable pero aun sin importacion masiva.
- Calendario fiscal manual, sin importacion automatica DIAN o municipal.
- No hay envio real de correos ni notificaciones externas todavia.
- No existe portal cliente todavia.
- Las pruebas de integracion real contra PostgreSQL requieren una base disponible por entorno.

## Proxima fase recomendada

Fase 8:

- validar la operacion real sobre PostgreSQL con una base disponible;
- convertir la capa transicional en integracion operacional completa;
- ampliar pruebas reales de transaccion, concurrencia y recuperacion;
- cerrar el corte controlado de JSON hacia base de datos.
