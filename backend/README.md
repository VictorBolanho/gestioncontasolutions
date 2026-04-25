# ContaSolutions Backend - Produccion

Backend profesional para la plataforma SaaS interna de ContaSolutions, construido por fases y preparado para crecer a entorno real.

## Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT
- Joi
- Winston
- Docker
- Jest
- ESLint

## Capacidades implementadas

- Autenticacion JWT con roles y permisos
- CRUD de empresas
- Responsabilidades tributarias
- Tareas, calendario y alertas
- Dashboard ejecutivo
- Reportes y exportacion CSV
- Auditoria automatica
- Scheduler interno para alertas y vencimientos
- Health checks operativos

## Arquitectura

```text
backend/
  src/
    config/                    # Entorno, logs, base de datos, scheduler
    constants/                 # Roles, permisos y catalogos
    middlewares/               # Auth, permisos, validacion, errores, seguridad
    modules/
      auth/
      audit-logs/
      calendar/
      companies/
      dashboard/
      notifications/
      reports/
      roles/
      tasks/
      tax-responsibilities/
      users/
      common/
    routes/
    scripts/
    utils/
    app.js
    server.js
```

## Seguridad y hardening

- `helmet`
- CORS configurable por lista de orígenes
- `express-mongo-sanitize`
- `xss-clean`
- `compression`
- rate limit global y por modulo
- `requestId` por petición
- logs estructurados de acceso y errores

## Variables de entorno

1. Copia `.env.example` a `.env`
2. Ajusta valores de producción antes de desplegar

Variables importantes:

- `NODE_ENV`
- `PORT`
- `API_PREFIX`
- `CLIENT_URL`
- `CLIENT_URLS`
- `MONGODB_URI`
- `JWT_SECRET`
- `LOG_LEVEL`
- `RATE_LIMIT_*`
- `INTERNAL_SCHEDULER_ENABLED`
- `ALERTS_CRON`
- `OVERDUE_SYNC_CRON`

## Desarrollo local

```bash
npm install
npm run seed
npm run dev
```

## Calidad

```bash
npm run lint
npm test
```

## Health checks

### Basico

- `GET /health`

### Detallado

- `GET /health/details`

Incluye:

- estado de base de datos
- uptime
- uso de memoria
- version de Node
- entorno

## Scheduler interno

El backend incluye scheduler interno para:

- procesar alertas automaticas
- sincronizar tareas y obligaciones vencidas

Comandos operativos:

```bash
npm run alerts:process
```

En producción, además del scheduler interno, puedes mover estos procesos a un worker dedicado si el volumen crece.

## Docker

### Levantar API + Mongo

```bash
docker compose up --build
```

### Servicios definidos

- `api`
- `mongo`

Archivos:

- [`Dockerfile`](</c:/Users/victor/Documents/2026/Proyectos/Gestioncontasolutions/backend/Dockerfile>)
- [`docker-compose.yml`](</c:/Users/victor/Documents/2026/Proyectos/Gestioncontasolutions/backend/docker-compose.yml>)

## CI

Se incluyó pipeline básico en GitHub Actions:

- instala dependencias
- ejecuta lint
- ejecuta tests

Archivo:

- [ci.yml](</c:/Users/victor/Documents/2026/Proyectos/Gestioncontasolutions/backend/.github/workflows/ci.yml>)

## Endpoints principales

### Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/register`

### Companies

- `GET /api/v1/companies`
- `GET /api/v1/companies/:companyId`
- `POST /api/v1/companies`
- `POST /api/v1/companies/with-responsibilities`
- `PATCH /api/v1/companies/:companyId`
- `DELETE /api/v1/companies/:companyId`

### Tax Responsibilities

- `GET /api/v1/tax-responsibilities`
- `GET /api/v1/tax-responsibilities/:responsibilityId`
- `POST /api/v1/tax-responsibilities`
- `PATCH /api/v1/tax-responsibilities/:responsibilityId`
- `DELETE /api/v1/tax-responsibilities/:responsibilityId`

### Tasks

- `GET /api/v1/tasks`
- `GET /api/v1/tasks/counters`
- `GET /api/v1/tasks/:taskId`
- `POST /api/v1/tasks`
- `PATCH /api/v1/tasks/:taskId`
- `DELETE /api/v1/tasks/:taskId`

### Calendar

- `GET /api/v1/calendar/events`

### Dashboard

- `GET /api/v1/dashboard/overview`
- `GET /api/v1/dashboard/workload`
- `GET /api/v1/dashboard/compliance`

### Reports

- `GET /api/v1/reports/tasks`
- `GET /api/v1/reports/companies`
- `GET /api/v1/reports/export/csv`

## Permisos relevantes

- `dashboard.view`
- `reports.view`
- `reports.export`
- `tasks.view`
- `tasks.create`
- `tasks.edit`
- `tasks.delete`
- `tasks.assign`
- `companies.view`
- `companies.create`
- `companies.edit`
- `companies.delete`

## Recomendaciones de produccion

- Usa MongoDB con replica set para soportar transacciones correctamente.
- Ejecuta la API detrás de un reverse proxy con TLS.
- Configura `CLIENT_URLS` con los dominios autorizados reales.
- Cambia `JWT_SECRET` por un secreto fuerte y rotado.
- Desactiva `autoIndex` en producción y administra índices por migración si el volumen crece.
- Si el tráfico aumenta, separa scheduler, API y workers.
