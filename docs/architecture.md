# Arquitectura actual

## Resumen

GestorConta esta organizado como una solucion modular con separacion explicita entre API, frontend y dominio compartido. La implementacion actual cubre Fase 0, Fase 1 y Fase 2.

## Capas del sistema

### `apps/api`

Servidor HTTP en Node nativo responsable de:

- exponer `/health` y rutas `/api/...`;
- recibir PDFs RUT;
- persistir datos locales en JSON;
- crear empresas;
- aprobar revision de empresa;
- analizar obligaciones fiscales;
- actualizar estados de obligaciones;
- registrar auditoria.

### `apps/web`

Frontend web con servidor estatico responsable de:

- cargar el flujo de Fase 1;
- mostrar revision humana del RUT;
- listar empresas;
- mostrar detalle de empresa;
- mostrar obligaciones sugeridas;
- ejecutar acciones de aprobacion y actualizacion de obligaciones;
- aplicar la identidad visual ContaSolutions.

### `packages/domain`

Dominio compartido entre backend y frontend. Centraliza:

- estados de empresa;
- reglas operativas;
- helpers de validacion;
- perfil tributario efectivo;
- catalogo CIIU;
- tema visual por defecto;
- utilidades de auditoria.

## Persistencia actual

La persistencia actual es local y basada en archivos JSON dentro de `apps/api/data`.

Archivos principales:

- `organization.json`
- `companies.json`
- `documents.json`
- `extractions.json`
- `audits.json`
- `taxes.json`
- `tax-rules.json`
- `company-obligations.json`

Tambien existe almacenamiento local de PDFs en:

- `apps/api/data/uploads/rut`

Esta capa es temporal y esta preparada para migrar a una base de datos real sin reescribir el dominio ni el flujo principal.

## Regla de perfil tributario efectivo

El motor de obligaciones y cualquier analisis tributario futuro deben usar:

- `getCompanyEffectiveTaxProfile(company)`

Prioridad de fuente:

1. `datosConfirmadosPorUsuario`
2. campos confirmados persistidos en la empresa
3. `datosExtraidosOriginales` solo para auditoria, comparacion y trazabilidad

Esto evita que Fase 2 y fases futuras se basen en texto extraido no validado por usuario.

## Separacion entre datos extraidos y datos confirmados

Cada empresa creada desde RUT conserva:

- `datosExtraidosOriginales`
- `datosConfirmadosPorUsuario`
- `metadataExtraccion`

Uso esperado:

- `datosExtraidosOriginales`: snapshot de extraccion del PDF
- `datosConfirmadosPorUsuario`: fuente operativa validada
- `metadataExtraccion`: confianza por campo, trazabilidad tecnica y preview

## Estado de empresa y reglas operativas

Estados relevantes:

- `borrador`
- `pendiente_revision`
- `activa`
- `suspendida`
- `inactiva`
- `archivada`

Reglas actuales:

- empresas `suspendida`, `inactiva` o `archivada` no generan nuevas obligaciones;
- la empresa creada desde RUT inicia en `pendiente_revision`, salvo decision manual distinta;
- una empresa debe ser aprobada y activada antes de confirmar obligaciones;
- la aprobacion de revision activa banderas operativas y deja la empresa lista para calendario en Fase 3.

## Relacion entre empresa, RUT, obligaciones y auditoria

### Empresa

Entidad principal creada desde revision humana del RUT.

### Documento RUT

Cada empresa puede quedar asociada a un documento tipo `rut_pdf`.

### Extraccion

Cada documento puede tener una extraccion con:

- estado de extraccion;
- texto extraido;
- preview;
- datos estructurados;
- metadata tecnica.

### Obligacion fiscal empresa

Relacion generada por Fase 2 a partir del perfil tributario efectivo de la empresa.

Contiene:

- impuesto base;
- nivel;
- estado;
- fuente de deteccion;
- motivo de aplicacion;
- responsabilidad RUT origen;
- ubicacion aplicable;
- confirmacion o revision humana.

### Auditoria

Se registran eventos relevantes como:

- carga de RUT;
- creacion de empresa;
- aprobacion de revision;
- analisis de obligaciones;
- creacion de obligacion sugerida;
- confirmacion de obligacion;
- obligacion no aplica;
- obligacion en revision.

## Preparacion futura para base de datos real

La arquitectura actual separa:

- servicios de negocio;
- contratos de dominio;
- persistencia JSON;
- UI.

Esto permite reemplazar la persistencia local por:

- PostgreSQL;
- ORM o repositorios;
- almacenamiento real de archivos;
- autenticacion/autorizacion real;

sin rehacer la logica central.

## Preparacion futura para SaaS

La base ya contempla:

- organizacion como raiz funcional;
- tema visual por organizacion;
- reglas transversales centralizadas;
- capacidad de evolucionar a multi-tenant.

Lo pendiente para una base SaaS real incluye:

- autenticacion por organizacion;
- aislamiento de datos por tenant;
- configuracion por organizacion;
- portal cliente;
- observabilidad y seguridad avanzada.
