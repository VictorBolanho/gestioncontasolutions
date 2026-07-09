# Estado actual del proyecto

Fecha de cierre del estado actual: 2026-05-01

## Fases completadas

- Fase 0 - Fundacion tecnica del sistema
- Fase 1 - Empresa desde PDF RUT con revision humana
- Fase 2 - Motor de impuestos y obligaciones fiscales
- Fase 3 - Calendario fiscal, versionamiento y tareas fiscales preliminares
- Fase 4 - Usuarios, cargos, roles, permisos y seguridad operativa
- Fase 5 - Gestion integral de tareas fiscales y no fiscales

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
- Creacion, activacion y reemplazo de calendarios fiscales.
- Asignacion manual de impuestos a empresas.
- Generacion preliminar de tareas fiscales con no duplicacion.
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
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`

## Archivos principales

- `apps/api/src/server.js`
- `apps/api/src/lib/company-repository.js`
- `apps/api/src/lib/obligations-service.js`
- `apps/api/src/lib/fiscal-calendar-service.js`
- `apps/api/src/lib/rut-extraction.js`
- `apps/api/src/lib/storage.js`
- `apps/web/src/app.js`
- `apps/web/styles.css`
- `packages/domain/company.js`
- `packages/domain/ciiu.js`
- `scripts/reset-dev-data.js`

## Flujo probado

1. Cargar PDF RUT.
2. Revisar datos extraidos.
3. Confirmar y crear empresa.
4. Empresa queda en `pendiente_revision`.
5. Aprobar revision y activar empresa.
6. Analizar obligaciones.
7. Confirmar obligacion, marcar no aplica o dejar en revision.
8. Ir a la vista `Calendario fiscal`.
9. Crear o ajustar impuestos si es necesario.
10. Crear y activar calendarios fiscales.
11. Generar tareas fiscales.
12. Verificar que no se dupliquen obligaciones ni tareas.

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
- Cambiar el calendario de un anio no modifica historicos de anios anteriores.
- No se elimina historico.

## Comandos de trabajo

### Ejecutar API

```powershell
node apps/api/src/server.js
```

O:

```powershell
npm run start:api
```

### Ejecutar frontend

```powershell
node apps/web/server.js
```

O:

```powershell
npm run start:web
```

### Reset desarrollo

```powershell
node scripts/reset-dev-data.js --confirm
```

## Limitaciones actuales

- Persistencia local en JSON, no base de datos real.
- Catalogo CIIU inicial, no completo.
- Extraccion de RUT basada en texto PDF, no OCR completo.
- Catalogo de impuestos editable pero aun sin importacion masiva.
- Calendario fiscal manual, sin importacion automatica DIAN o municipal.
- No existe dashboard real todavia.
- No existe portal cliente todavia.
- Sesiones y usuarios siguen en persistencia local JSON.

## Proxima fase recomendada

Fase 6:

- alertas internas;
- vencimientos proximos;
- notificaciones operativas.
