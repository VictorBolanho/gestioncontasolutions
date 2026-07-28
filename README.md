# GestorConta

Sistema operativo, contable y tributario para la gestion de empresas cliente, construido por fases sobre una base modular con API propia, frontend web y reglas de dominio compartidas.

Los documentos funcionales y visuales base del proyecto son:

- `docs/planning/fases-del-desarrollo.txt`
- `docs/planning/plan-visual-corporativo.txt`
- `docs/database-architecture.md`
- `docs/json-to-database-migration.md`
- `docs/local-database-setup.md`
- `docs/backup-restore-initial.md`

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

### Fase 6 - Alertas internas y vencimientos

Estado: completada.

Incluye:

- alertas internas por tareas vencidas o proximas a vencer;
- estados `no_leida`, `leida`, `atendida` y `descartada`;
- motivo opcional al atender o descartar;
- filtros por empresa, responsable, tipo, nivel y estado;
- reconciliacion unica de alertas para listado y dashboard;
- visibilidad compartida por rol y alcance autorizado;
- auditoria de lectura, atencion, descarte y rechazo de transicion invalida;
- integracion real con dashboard operativo.

### Fase 7 - Dashboard gerencial, reportes e indicadores

Estado: completada.

Incluye:

- dashboard gerencial filtrable por fecha, empresa, responsable, estado, impuesto, riesgo, periodo y vista;
- indicadores consolidados de cumplimiento, vencimientos, riesgo y carga operativa;
- endpoints seccionales para resumen, vencimientos, cumplimiento, riesgo, carga y alertas gerenciales;
- reportes gerenciales consistentes con el dashboard y protegidos por permisos;
- exportacion CSV de reportes gerenciales;
- uso de tareas y alertas reconciliadas como fuente unica de verdad;
- deteccion de huecos operativos como obligaciones activas sin tarea fiscal o tareas proximas sin responsable.

### Fase 8 - Base de datos y persistencia real

Estado: en progreso.

Avance actual:

- driver seleccionable `json` o `database`;
- infraestructura PostgreSQL inicial;
- migraciones SQL versionadas;
- semillas tecnicas y demo para base de datos;
- script de migracion desde JSON con `dry-run`;
- capa de persistencia preparada para transicion progresiva.

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

## Drivers de almacenamiento

Modo actual seguro:

```powershell
STORAGE_DRIVER=json
```

Modo de base de datos:

```powershell
STORAGE_DRIVER=database
```

En modo `database` debes aplicar migraciones antes de iniciar la API.

## Comandos de base de datos

```powershell
npm run db:migrate
npm run db:migrate:rollback
npm run db:seed
npm run db:seed:demo
npm run db:migrate-json:dry-run
npm run db:migrate-json
npm run test:db
```

## Entorno y credenciales de desarrollo

`NODE_ENV` es obligatorio y sólo acepta `development`, `test` o `production`. La aplicación no asume un entorno cuando la variable está ausente.

Las semillas demo están desactivadas por defecto. Para habilitarlas localmente se requieren ambas variables:

```powershell
$env:NODE_ENV = "development"
$env:ALLOW_DEMO_SEEDS = "true"
$env:DEV_SEED_PASSWORD = "<valor local no versionado>"
npm run dev:api
```

- `DEV_SEED_PASSWORD` no tiene valor predeterminado.
- `ALLOW_DEMO_SEEDS=true` está prohibido con `NODE_ENV=production`.
- En producción no se generan usuarios demo y la API exige un administrador activo creado de forma segura.
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
- Las cuentas demo de prueba requieren `DEV_SEED_PASSWORD`; no existe una clave predeterminada en el código.
- No publiques ni reutilices estos valores fuera de ambientes locales o de prueba.

## Primer administrador PostgreSQL

Después de aplicar migraciones y la semilla técnica, el primer owner de
producción se crea con un comando independiente:

```powershell
$env:NODE_ENV = "production"
$env:STORAGE_DRIVER = "database"
$env:BOOTSTRAP_ADMIN_EMAIL = "<correo entregado por el gestor de secretos>"
$env:BOOTSTRAP_ADMIN_NAME = "<nombre completo>"
$env:BOOTSTRAP_ADMIN_PASSWORD = "<contraseña robusta no versionada>"
npm run db:bootstrap-admin
```

El comando no acepta credenciales por argumentos. Obtiene un bloqueo
transaccional de PostgreSQL, exige exactamente una organización activa y el rol
`owner`, y crea usuario, asignación de rol y auditoría en una sola transacción.
Si ya existe un owner activo termina correctamente sin crear otro. No imprime
la contraseña, su hash ni la conexión a PostgreSQL.

La contraseña debe tener entre 14 y 256 caracteres, con mayúscula, minúscula,
número y símbolo, sin espacios ni el usuario del correo. Elimina estas tres
variables del proceso y rota el secreto si pudo quedar expuesto después de
completar el bootstrap.

## URL de API del frontend

En producción el frontend usa `/api` bajo su mismo origen. El reverse proxy debe
enviar esa ruta a la API; no se admite `WEB_API_ORIGIN` en producción. Esto
mantiene cookies, CSRF y `credentials: include` como tráfico same-origin.

Para ejecutar API y web en puertos separados durante desarrollo:

```powershell
$env:NODE_ENV = "development"
$env:WEB_API_ORIGIN = "http://127.0.0.1:4000"
$env:FRONTEND_CSP_CONNECT_SOURCES = "http://127.0.0.1:4000"
npm run dev:web
```

El origen solo procede del entorno del proceso; no se acepta desde query
strings, `localStorage` ni otras entradas controlables por el navegador.

## Límites de lectura HTTP

La API valida `Content-Length`, cuenta los bytes realmente recibidos y aplica timeout también a transferencias fragmentadas:

- `HTTP_BODY_MAX_BYTES`: techo global.
- `HTTP_JSON_MAX_BYTES`: cuerpos JSON generales.
- `HTTP_LOGIN_MAX_BYTES`: login.
- `HTTP_MULTIPART_MAX_BYTES`: cargas PDF RUT.
- `HTTP_BODY_TIMEOUT_MS`: tiempo máximo para completar la lectura.

Los cuerpos excesivos responden `413` y las lecturas agotadas responden `408`.

## Seguridad HTTP, CORS y proxies

La API usa una lista exacta de orígenes CORS. En `development` permite
`http://127.0.0.1:3000` y `http://localhost:3000`; cualquier origen adicional
debe declararse, separado por comas:

```powershell
$env:CORS_ALLOWED_ORIGINS = "https://app.example.com"
```

En `production`, `CORS_ALLOWED_ORIGINS` es obligatorio y debe contener al menos
una URL HTTP/HTTPS sin ruta, consulta, fragmento ni credenciales. El valor
especial `null` no está permitido. Los clientes servidor-a-servidor sin
cabecera `Origin` continúan admitidos.

API y frontend envían CSP, protección contra framing, `nosniff`, política de
referencia y una `Permissions-Policy` restrictiva. El frontend sólo permite
scripts y estilos propios, sin `unsafe-inline` ni `unsafe-eval`. La
personalización visual modifica las propiedades de la regla `:root` de la hoja
CSS propia, sin crear atributos de estilo inline. En desarrollo, si el frontend
llama a una API de otro origen, declara ese origen en:

```powershell
$env:FRONTEND_CSP_CONNECT_SOURCES = "https://api.example.com"
```

HSTS sólo se emite con `NODE_ENV=production` y `HTTPS_CONFIRMED=true`. Activa
esa confirmación únicamente cuando el dominio completo se entregue siempre por
HTTPS, incluido el tramo público hasta el proxy:

```powershell
$env:HTTPS_CONFIRMED = "true"
$env:HSTS_MAX_AGE_SECONDS = "31536000"
$env:HSTS_INCLUDE_SUBDOMAINS = "false"
```

No habilites subdominios hasta confirmar que todos soportan HTTPS. El máximo
aceptado para `HSTS_MAX_AGE_SECONDS` es 63072000.

Por defecto la dirección del cliente es la conexión directa
`request.socket.remoteAddress`; las cabeceras `Forwarded` y
`X-Forwarded-For` se ignoran. Para un reverse proxy de producción, declara
exclusivamente las direcciones IP de cada proxy confiable, en orden
independiente y separadas por comas:

```powershell
$env:TRUSTED_PROXY_ADDRESSES = "10.0.0.10,10.0.0.11"
```

El proxy debe reemplazar o anexar correctamente la cadena reenviada. GestorConta
valida la cadena completa desde la conexión más cercana y usa como cliente el
primer salto no confiable; una entrada malformada hace que se ignore toda la
cadena. No se admiten rangos CIDR ni confianza automática.

El login conserva límites progresivos independientes por identidad normalizada
y dirección de origen, además del máximo de operaciones KDF concurrentes. Los
contadores tienen duración y tamaño acotados y se limpian bajo demanda. Este
almacenamiento en memoria protege una sola instancia; varias réplicas requerirán
un backend compartido para aplicar los límites de forma consistente.

## Sesión del navegador y CSRF

El frontend no recibe ni persiste el token de sesión. El login web solicita
explícitamente modo `cookie` y la API responde con una cookie `HttpOnly`,
`Path=/`, `SameSite` explícito y vencimiento alineado con la sesión del
servidor. JavaScript sólo conserva en memoria un token CSRF derivado de la
sesión. Al recargar, `/api/auth/session` restaura usuario y CSRF desde la cookie.

En `development` y `test` la cookie se llama `gestorconta_session` y funciona
sobre HTTP local sin `Secure`. En `production`:

- la API no arranca sin `HTTPS_CONFIRMED=true`;
- la cookie se llama `__Host-gestorconta_session`;
- `Secure`, `HttpOnly`, `Path=/` y ausencia de `Domain` son obligatorios;
- `AUTH_CSRF_SECRET` debe contener un secreto aleatorio no versionado de al
  menos 32 caracteres.

Configuración mínima:

```powershell
$env:NODE_ENV = "production"
$env:HTTPS_CONFIRMED = "true"
$env:AUTH_CSRF_SECRET = "<secreto aleatorio no versionado de 32 o más caracteres>"
$env:AUTH_COOKIE_SAME_SITE = "Lax"
```

`AUTH_COOKIE_SAME_SITE` acepta `Lax`, `Strict` o `None`. Usa `None` únicamente
cuando frontend y API sean realmente cross-site; sólo se admite con la cookie
`Secure` de producción. Si son orígenes distintos pero pertenecen al mismo
site, normalmente `Lax` es suficiente.

Las operaciones no seguras autenticadas por cookie requieren simultáneamente:

- un `Origin` presente en `CORS_ALLOWED_ORIGINS`;
- `X-CSRF-Token` válido y ligado a la sesión.

La API conserva Bearer únicamente para pruebas y clientes programáticos sin
`Origin`. Esos clientes hacen login sin `X-Auth-Mode` y reciben el token en la
respuesta; el frontend nunca usa ese flujo. Presentar cookie y Bearer a la vez
se rechaza como ambiguo. Bearer no usa CSRF, pero mantiene autenticación,
permisos y limitación de login.

Tras un reverse proxy, la seguridad de la cookie no se deduce de
`X-Forwarded-Proto`: esa cabecera se ignora. `HTTPS_CONFIRMED=true` es una
declaración operativa explícita de que el acceso público es HTTPS de extremo a
extremo o termina en un proxy confiable incluido en `TRUSTED_PROXY_ADDRESSES`.
El proxy debe eliminar cabeceras reenviadas suministradas por el cliente.

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
16. Generar o reconciliar alertas internas.
17. Revisar dashboard operativo y gerencial.
18. Exportar reportes gerenciales segun permisos.
19. Verificar que no se dupliquen tareas ni alertas.

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
- Las alertas fiscales siguen naciendo desde la tarea fiscal, no desde la obligacion directa.
- Cambiar un calendario de un anio no modifica historicos ni tareas ya generadas de anios anteriores.
- No se elimina historico funcional.
- Toda ruta `/api` excepto login, meta y health requiere sesion.
- Los usuarios sin `ver_todas_empresas` solo ven empresas asignadas.
- La gestion de usuarios exige permisos de administracion.
- Los reportes gerenciales requieren `ver_reportes` y la exportacion CSV exige `exportar_reportes`.

## Limitaciones actuales

- La persistencia operativa por defecto sigue en JSON mientras se cierra la transicion a PostgreSQL.
- Catalogo CIIU inicial, no completo.
- Extraccion RUT basada en texto PDF, no OCR completo.
- Catalogo de impuestos editable, pero aun sin importacion masiva.
- Calendario fiscal manual y semilla base; sin importacion DIAN/municipal automatizada.
- Ya existe dashboard operativo y gerencial conectado a tareas y alertas reconciliadas.
- No existe portal cliente todavia.
- El envio real de correo sigue fuera del alcance actual.
- El proyecto no define scripts formales de `lint` ni `build` todavia.
- Las pruebas de integracion real contra PostgreSQL requieren un entorno con base de datos disponible.

## Que queda pendiente

Siguiente prioridad:

- continuar Fase 8 hasta cerrar la integracion operacional completa con PostgreSQL antes de abrir Fase 9.
