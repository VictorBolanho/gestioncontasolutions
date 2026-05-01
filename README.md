# GestorConta

Sistema operativo, contable y tributario para la gestion de empresas cliente, construido por fases sobre una base modular con API propia, frontend web y reglas de dominio compartidas.

Los documentos funcionales y visuales base del proyecto son:

- `fases del desarrollo.txt`
- `plan visual corporativo.txt`

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

## Limpieza de datos de desarrollo

Reset seguro del ambiente local:

```powershell
node scripts/reset-dev-data.js --confirm
```

O con script:

```powershell
npm run reset:dev-data
```

Reglas del reset:

- no se ejecuta automaticamente;
- requiere `--confirm`;
- se bloquea si `NODE_ENV=production`;
- limpia empresas, documentos, extracciones, auditorias, obligaciones y PDFs locales;
- conserva `organization.json`;
- conserva `taxes.json`, `tax-rules.json` y el catalogo CIIU.

## Endpoints principales disponibles

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

## Flujo probado actual

1. Cargar PDF RUT.
2. Revisar datos extraidos.
3. Confirmar y crear empresa.
4. La empresa queda en `pendiente_revision`.
5. Aprobar revision y activar empresa.
6. Analizar obligaciones.
7. Confirmar obligacion, marcar no aplica o dejar en revision.
8. Verificar que no se dupliquen obligaciones.

## Reglas importantes

- El analisis tributario usa `getCompanyEffectiveTaxProfile(company)`.
- `datosExtraidosOriginales` se conservan para auditoria y comparacion.
- `datosConfirmadosPorUsuario` son la fuente operativa prioritaria.
- Empresas `suspendida`, `inactiva` o `archivada` no generan nuevas obligaciones.
- Para confirmar una obligacion, la empresa debe estar `activa`.
- Marcar `no_aplica` o `pendiente_revision` en obligaciones se permite en empresa activa o en revision.
- No se elimina historico funcional.

## Limitaciones actuales

- Persistencia local en JSON, no base de datos real.
- Catalogo CIIU inicial, no completo.
- Extraccion RUT basada en texto PDF, no OCR completo.
- No existe calendario fiscal todavia.
- No existen tareas fiscales todavia.
- No existe dashboard real todavia.
- No existe autenticacion real todavia.
- No existe portal cliente todavia.

## Que queda pendiente

Siguiente fase recomendada:

- Fase 3: calendario fiscal, versionamiento y generacion de tareas fiscales.

Fase 3 todavia no esta implementada.
