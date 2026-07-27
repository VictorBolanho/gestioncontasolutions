# Arquitectura actual

## Alcance organizacional actual

GestorConta admite actualmente una sola organización operativa. Los permisos separan usuarios por rol, supervisión y empresas asignadas, pero el esquema todavía no implementa aislamiento multitenant entre organizaciones.

Antes de admitir una segunda organización deben agregarse, como mínimo:

- `organizacion_id` obligatorio en usuarios, empresas, sesiones y entidades operativas;
- claves foráneas, índices y restricciones de unicidad con alcance organizacional;
- filtrado obligatorio por organización en repositorios y servicios;
- pruebas negativas de acceso cruzado entre organizaciones.

Hasta completar ese trabajo, desplegar varias organizaciones en la misma instancia o base de datos está fuera del alcance soportado.

## Perímetro HTTP y despliegue

La API aplica CORS mediante una allowlist exacta y conserva como fuente de red
la dirección del socket. Sólo interpreta `Forwarded` o `X-Forwarded-For` si el
salto directo figura en `TRUSTED_PROXY_ADDRESSES`; valida todos los saltos y
descarta por completo una cadena malformada. La lista admite direcciones IPv4 e
IPv6 concretas, no rangos CIDR. El reverse proxy debe sanear las cabeceras
recibidas del exterior y construir una cadena consistente.

API y frontend aplican cabeceras defensivas. La CSP del frontend sólo permite
recursos propios y orígenes de conexión declarados; no depende de ejecución
inline. HSTS requiere simultáneamente `NODE_ENV=production` y la confirmación
operativa `HTTPS_CONFIRMED=true`, porque la aplicación no puede inferir por sí
sola que todo el dominio público está servido exclusivamente por HTTPS.

La protección de login mantiene cuotas progresivas separadas por identidad y
dirección de origen. Sus contadores viven en memoria, tienen ventana y capacidad
máximas y se limpian bajo demanda. Por tanto, esta protección sólo es consistente
dentro de una instancia. Antes de desplegar múltiples réplicas se necesita un
backend compartido para los contadores y bloqueos; esta etapa no incorpora Redis
ni otro servicio adicional.

## Resumen

GestorConta esta organizado como una solucion modular con separacion explicita entre API, frontend y dominio compartido. La implementacion actual cubre Fase 0, Fase 1, Fase 2 y Fase 3.

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
- administrar impuestos;
- administrar calendarios fiscales;
- generar tareas fiscales preliminares;
- registrar auditoria.

### `apps/web`

Frontend web con servidor estatico responsable de:

- cargar el flujo de Fase 1;
- mostrar revision humana del RUT;
- listar empresas;
- mostrar detalle de empresa;
- mostrar obligaciones sugeridas;
- mostrar tareas fiscales generadas en detalle de empresa;
- separar la vista `Calendario fiscal` del flujo `Empresas desde RUT`;
- crear y editar impuestos;
- crear y activar calendarios fiscales;
- ejecutar acciones de aprobacion y actualizacion de obligaciones;
- aplicar la identidad visual ContaSolutions.

### `packages/domain`

Dominio compartido entre backend y frontend. Centraliza:

- estados de empresa;
- reglas operativas;
- helpers de validacion;
- perfil tributario efectivo;
- catalogo CIIU;
- catalogos y estados fiscales;
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
- `fiscal-calendars.json`
- `fiscal-calendar-versions.json`
- `fiscal-tasks.json`

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
- empresas no activas no generan tareas fiscales.

## Relacion entre empresa, RUT, obligaciones, calendario y auditoria

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

### Calendario fiscal

Entidad versionable que define:

- impuesto;
- periodicidad real del periodo;
- criterio de vencimiento;
- filtros por NIT, DV, regimen, tipo de contribuyente o ubicacion;
- fecha de vencimiento;
- version y estado.

Regla central:

- el impuesto no guarda fechas;
- las fechas viven en el calendario fiscal.

### Impuesto

Concepto tributario estable. Se administra como catalogo editable y puede existir aun cuando no venga directamente del RUT.

### Obligacion fiscal empresa

Relacion entre empresa e impuesto. Puede venir del motor de reglas del RUT o de una asignacion manual de usuario.

Campos operativos clave:

- `periodicidadAplicable`
- `municipioAplicacion`
- `departamentoAplicacion`
- `fuenteDeteccion`
- `estado`

Regla:

- la periodicidad del impuesto es sugerida;
- la periodicidad de la obligacion de empresa es la que manda para buscar calendario aplicable.

### Tarea fiscal preliminar

Entidad generada desde:

`Impuesto -> ObligacionFiscalEmpresa -> CalendarioFiscal -> TareaFiscal`

Contiene:

- empresa;
- obligacion fiscal origen;
- calendario aplicado;
- fecha de vencimiento;
- fecha limite interna;
- version de calendario usada;
- estados base para evolucionar en Fase 5.

### Auditoria

Se registran eventos relevantes como:

- carga de RUT;
- creacion de empresa;
- aprobacion de revision;
- analisis de obligaciones;
- creacion de obligacion sugerida;
- confirmacion de obligacion;
- obligacion no aplica;
- obligacion en revision;
- creacion y activacion de calendario fiscal;
- reemplazo o anulacion de calendario;
- generacion u omision de tareas fiscales.

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

La preparacion actual tambien deja lista una futura importacion de calendarios desde DIAN, municipios o archivos Excel/CSV/JSON, sin cambiar el modelo principal.

## Vista fiscal actual

El frontend separa el modulo fiscal del flujo RUT y lo organiza en cuatro secciones:

- Catalogo de impuestos
- Calendario fiscal versionado
- Asignacion de impuestos a empresas
- Calendario operativo

Esto evita mezclar formularios de empresa con configuracion de calendario y deja lista la evolucion de Fase 4 en adelante.

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
