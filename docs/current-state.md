# Estado actual del proyecto

Fecha de cierre del estado actual: 2026-05-01

## Fases completadas

- Fase 0 - Fundacion tecnica del sistema
- Fase 1 - Empresa desde PDF RUT con revision humana
- Fase 2 - Motor de impuestos y obligaciones fiscales

## Funcionalidades funcionando

- API y frontend separados y ejecutables.
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
- Auditoria de eventos clave.
- Reset seguro de datos locales de desarrollo.

## Endpoints disponibles

- `GET /health`
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
- `GET /api/tax-rules`

## Archivos principales

- `apps/api/src/server.js`
- `apps/api/src/lib/company-repository.js`
- `apps/api/src/lib/obligations-service.js`
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
8. Verificar que no se dupliquen obligaciones.

## Reglas importantes

- El motor de obligaciones usa `getCompanyEffectiveTaxProfile(company)`.
- `datosConfirmadosPorUsuario` tiene prioridad sobre `datosExtraidosOriginales`.
- `datosExtraidosOriginales` se conservan solo para trazabilidad.
- Empresas `suspendida`, `inactiva` o `archivada` no generan nuevas obligaciones.
- Confirmar una obligacion requiere empresa `activa`.
- Marcar `no_aplica` o `pendiente_revision` se permite sin activar automaticamente la obligacion.
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
- No existe calendario fiscal todavia.
- No existen tareas fiscales todavia.
- No existe dashboard real todavia.
- No existe autenticacion real todavia.
- No existe portal cliente todavia.

## Proxima fase recomendada

Fase 3:

- calendario fiscal;
- versionamiento;
- generacion de tareas fiscales.

Fase 3 todavia no esta implementada.
