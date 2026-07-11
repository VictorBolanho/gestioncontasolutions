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
- `apps/api/src/lib/storage.js`
- `apps/web/src/app.js`
- `apps/web/styles.css`
- `packages/domain/index.js`
- `packages/domain/permissions.js`
- `scripts/alerts-consistency-test.js`
- `scripts/alerts-filters-permissions-test.js`
- `scripts/alerts-phase6-closure-test.js`
- `scripts/smoke-test.js`

## Flujo validado de Fase 6

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
- `leida` requiere acceso visible a la alerta; `atendida` y `descartada` requieren `gestionar_alertas`.
- El dashboard excluye alertas terminales de sus indicadores activos.

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

Pruebas funcionales ejecutadas en secuencia:

- `node scripts/clean-onboarding-test.js`
- `node scripts/module-access-test.js`
- `node scripts/role-permissions-test.js`
- `node scripts/alerts-consistency-test.js`
- `node scripts/alerts-filters-permissions-test.js`
- `node scripts/alerts-phase6-closure-test.js`
- `node scripts/smoke-test.js`

Notas de validacion:

- El proyecto no define scripts de `lint` ni `build` en `package.json`.
- Las pruebas se ejecutan en secuencia porque comparten y restauran datasets JSON de desarrollo.
- Al finalizar la validacion se restablecen semillas demo con `node scripts/reset-dev-data.js --confirm --keep-demo-seeds`.

## Limitaciones actuales

- Persistencia local en JSON, no base de datos real.
- Catalogo CIIU inicial, no completo.
- Extraccion de RUT basada en texto PDF, no OCR completo.
- Catalogo de impuestos editable pero aun sin importacion masiva.
- Calendario fiscal manual, sin importacion automatica DIAN o municipal.
- No hay envio real de correos ni notificaciones externas todavia.
- No existe portal cliente todavia.
- Sesiones y usuarios siguen en persistencia local JSON.

## Proxima fase recomendada

Fase 7:

- consolidar dashboard gerencial y reportes sobre la base operativa ya sincronizada;
- separar indicadores operativos, supervisores y gerenciales en vistas estables;
- definir exportables y reportes de seguimiento sin cambiar la fuente oficial de alertas.
