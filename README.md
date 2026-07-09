# GestorConta

Sistema operativo, contable y tributario para la gestion de empresas cliente, construido por fases sobre una base modular con API propia, frontend web y reglas de dominio compartidas.

Los documentos funcionales y visuales base del proyecto son:

- `docs/planning/fases-del-desarrollo.txt`
- `docs/planning/plan-visual-corporativo.txt`

## Estado actual del proyecto

### Fase 0 - Fundacion tecnica

Estado: completada.

Incluye:

- estructura `apps/api`, `apps/web`, `packages/domain` y `docs`;
- API base;
- frontend base;
- tema visual ContaSolutions;
- contratos de dominio;
- reglas transversales.

### Fase 1 - Empresa desde PDF RUT

Estado: completada.

Incluye:

- carga PDF RUT;
- extraccion de datos;
- revision humana;
- creacion de empresa;
- validacion de duplicados NIT + DV;
- persistencia local;
- documento RUT asociado;
- auditoria;
- datos avanzados colapsados;
- catalogo CIIU base;
- activacion de empresa luego de revision.

### Fase 2 - Motor de impuestos y obligaciones

Estado: completada.

Incluye:

- catalogo base de impuestos;
- reglas por responsabilidades RUT;
- analisis de obligaciones;
- obligaciones sugeridas;
- ICA en pendiente de revision;
- confirmar obligacion;
- marcar no aplica;
- dejar en revision;
- uso de `getCompanyEffectiveTaxProfile(company)`;
- no duplicacion de obligaciones;
- auditoria.

### Fase 3 - Calendario fiscal, versionamiento y tareas fiscales preliminares

Estado: completada.

Incluye:

- vista separada de `Calendario fiscal`;
- navegacion interna por secciones:
  - catalogo de impuestos
  - calendario fiscal versionado
  - asignacion de impuestos a empresas
  - calendario operativo
- catalogo base de impuestos editable;
- creacion y edicion manual de impuestos;
- periodicidad controlada por lista;
- calendarios fiscales versionados;
- soporte para `municipioCiudad` con compatibilidad hacia `municipio`;
- criterios de vencimiento por NIT, DV, rangos o fecha fija;
- asignacion manual de impuestos a empresas;
- periodicidad aplicable por obligacion de empresa;
- activacion y anulacion de calendarios;
- generacion preliminar de tareas fiscales;
- calendario operativo por fechas;
- no duplicacion de tareas;
- auditoria de calendario y tareas fiscales.

### Fase 4 - Usuarios, cargos, roles, permisos y seguridad operativa

Estado: completada.

Incluye:

- inicio de sesion con token;
- usuarios persistidos en JSON;
- roles base y permisos efectivos por rol;
- acceso filtrado por empresas asignadas;
- proteccion de endpoints por autenticacion y permisos;
- trazabilidad de acciones con usuario real;
- vista inicial de administracion de usuarios;
- cierre de sesion y contexto de usuario en frontend.

### Fase 5 - Gestion integral de tareas fiscales y no fiscales

Estado: completada.

Incluye:

- panel general de tareas fiscales y no fiscales;
- creacion manual de tareas no fiscales;
- estados operativos transversales;
- asignacion y reasignacion de responsables;
- cierre de tareas como presentadas o completadas;
- vencimiento automatico de tareas abiertas vencidas;
- filtros por estado, empresa, responsable, vencimiento y tipo;
- auditoria de generacion, creacion, reasignacion, cambio de estado y cierre.

## Estructura

- `apps/api`: servidor API HTTP en Node nativo.
- `apps/web`: frontend y servidor web estatico.
- `packages/domain`: reglas compartidas de negocio, estados, helpers y catalogos.
- `docs`: arquitectura, roadmap y estado actual.
- `scripts`: utilidades de desarrollo como reseteo de datos locales.

## Como ejecutar

### API

```powershell
node apps/api/src/server.js
```

O con script:

```powershell
npm run start:api
```

### Frontend

```powershell
node apps/web/server.js
```

O con script:

```powershell
npm run start:web
```

## Credenciales de desarrollo y prueba

- Las semillas locales usan `DEV_SEED_PASSWORD` para generar `passwordSalt` y `passwordHash` en tiempo de carga.
- Si `DEV_SEED_PASSWORD` no existe, el proyecto usa el valor local `dev-only-local-not-for-production`.
- Los scripts de prueba aceptan estas variables opcionales:
  - `TEST_ADMIN_EMAIL`
  - `TEST_ADMIN_PASSWORD`
  - `TEST_FISCAL_EMAIL`
  - `TEST_FISCAL_PASSWORD`
  - `TEST_JUNIOR_EMAIL`
  - `TEST_JUNIOR_PASSWORD`
  - `TEST_JUNIOR_BETA_EMAIL`
  - `TEST_JUNIOR_BETA_PASSWORD`
  - `TEST_APPRENTICE_EMAIL`
  - `TEST_APPRENTICE_PASSWORD`
- Si esas variables no existen, los scripts usan cuentas `@example.test` y la misma clave local de desarrollo.
- No publiques ni reutilices estos valores fuera de ambientes locales o de prueba.

## Limpieza de datos de desarrollo

Reset seguro del ambiente local:

```powershell
node scripts/reset-dev-data.js --confirm
```

O con script:

```powershell
npm run reset:dev-data
```

Reset solo de la parte fiscal, conservando empresas ya cargadas:

```powershell
node scripts/reset-fiscal-data.js --confirm
```

O con script:

```powershell
npm run reset:fiscal-data
```

Reglas del reset:

- no se ejecuta automaticamente;
- requiere `--confirm`;
- se bloquea si `NODE_ENV=production`;
- limpia empresas, documentos, extracciones, auditorias, obligaciones y PDFs locales;
- conserva `organization.json`;
- conserva `taxes.json`, `tax-rules.json` y el catalogo CIIU.

Reglas del reset fiscal:

- no se ejecuta automaticamente;
- requiere `--confirm`;
- se bloquea si `NODE_ENV=production`;
- conserva empresas, documentos RUT, extracciones y `organization.json`;
- restaura `taxes.json` y `tax-rules.json` al catalogo base;
- limpia `company-obligations.json`;
- limpia `fiscal-calendar-versions.json`;
- limpia `fiscal-tasks.json`;
- limpia auditorias del modulo fiscal;
- por defecto deja `fiscal-calendars.json` vacio;
- si quieres dejar calendarios semilla base, puedes usar:

```powershell
node scripts/reset-fiscal-data.js --confirm --keep-calendar-seeds
```

## Endpoints principales disponibles

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

## Flujo probado actual

1. Cargar PDF RUT.
2. Revisar datos extraidos.
3. Confirmar y crear empresa.
4. La empresa queda en `pendiente_revision`.
5. Aprobar revision y activar empresa.
6. Analizar obligaciones.
7. Confirmar obligacion, marcar no aplica o dejar en revision.
8. Verificar que no se dupliquen obligaciones.
9. Ir a `Calendario fiscal`.
10. Crear o editar impuestos si es necesario.
11. Crear y activar calendarios fiscales.
12. Generar tareas fiscales preliminares.
13. Crear tareas no fiscales manuales si aplica.
14. Asignar responsable, iniciar, cerrar o cancelar tareas.
15. Iniciar sesion segun rol y validar acceso.
16. Verificar que no se dupliquen tareas.

## Reglas importantes

- El analisis tributario usa `getCompanyEffectiveTaxProfile(company)`.
- `datosExtraidosOriginales` se conservan para auditoria y comparacion.
- `datosConfirmadosPorUsuario` son la fuente operativa prioritaria.
- Empresas `suspendida`, `inactiva` o `archivada` no generan nuevas obligaciones.
- Empresas `suspendida`, `inactiva` o `archivada` no generan tareas fiscales.
- Para confirmar una obligacion, la empresa debe estar `activa`.
- Marcar `no_aplica` o `pendiente_revision` en obligaciones se permite en empresa activa o en revision.
- El calendario fiscal vive en un modulo separado del flujo de RUT.
- El impuesto es el concepto base; el calendario define la fecha y criterio de vencimiento.
- El impuesto es un concepto estable; el calendario cambia por anio, periodo y version.
- La obligacion fiscal de empresa conecta empresa e impuesto.
- La generacion de tareas usa el calendario realmente aplicable, no cualquier calendario del mismo impuesto.
- Cambiar un calendario de un anio no modifica historicos ni tareas ya generadas de anios anteriores.
- No se elimina historico funcional.
- Toda ruta `/api` excepto login, meta y health requiere sesion.
- Los usuarios sin `ver_todas_empresas` solo ven empresas asignadas.
- La gestion de usuarios exige permisos de administracion.

## Limitaciones actuales

- Persistencia local en JSON, no base de datos real.
- Catalogo CIIU inicial, no completo.
- Extraccion RUT basada en texto PDF, no OCR completo.
- Catalogo de impuestos editable, pero aun sin importacion masiva.
- Calendario fiscal manual y semilla base; sin importacion DIAN/municipal automatizada.
- No existe dashboard real todavia.
- No existe portal cliente todavia.
- La persistencia de usuarios y sesiones sigue siendo local en JSON.

## Que queda pendiente

Siguiente fase recomendada:

- Fase 6: alertas internas y vencimientos proximos.
