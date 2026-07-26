# Roadmap de implementacion

## Estado por fases

### Fase 0 - Fundacion tecnica del sistema

Estado: completada.

Incluye:

- estructura modular del proyecto;
- API base;
- frontend base;
- dominio compartido;
- reglas transversales;
- tema visual ContaSolutions.

### Fase 1 - Empresa desde PDF RUT con revision humana

Estado: completada.

Incluye:

- carga de PDF RUT;
- extraccion estructurada;
- revision humana;
- creacion de empresa;
- validacion de duplicados;
- activacion de empresa luego de revision;
- persistencia local y auditoria.

### Fase 2 - Motor de impuestos y obligaciones fiscales

Estado: completada.

Incluye:

- catalogo base de impuestos;
- reglas por responsabilidades RUT;
- analisis de obligaciones sugeridas;
- control de no duplicacion;
- aprobacion, no aplica y revision de obligaciones;
- auditoria de acciones.

### Fase 3 - Calendario fiscal, versionamiento y generacion de tareas fiscales

Estado: completada.

Incluye:

- vista separada de calendario fiscal;
- navegacion limpia por secciones fiscales;
- impuestos editables y utilizables por calendarios;
- periodicidad controlada;
- criterios DIAN por ultimo digito, DV, rangos y fechas fijas;
- asignacion manual de impuestos a empresas;
- calendario operativo por fechas;
- calendarios versionados;
- generacion de tareas fiscales;
- control de no duplicacion;
- auditoria de calendario y tareas.

### Fase 4 - Usuarios, cargos, roles y permisos

Estado: completada.

Incluye:

- usuarios internos;
- roles y permisos;
- empresas asignadas;
- seguridad operativa;
- base para panel general de tareas.

### Fase 5 - Gestion integral de tareas fiscales y no fiscales

Estado: completada.

Incluye:

- gestion integral de tareas fiscales y no fiscales;
- creacion manual de tareas;
- estados operativos transversales;
- asignacion y reasignacion de responsables;
- seguimiento, cierre y filtros operativos;
- auditoria de cambios de estado, reasignaciones y cierre.

### Fase 6 - Alertas internas y vencimientos

Estado: completada.

Incluye:

- alertas internas por tareas vencidas o proximas a vencer;
- estados `no_leida`, `leida`, `atendida` y `descartada`;
- motivo opcional en atencion y descarte;
- filtros por empresa, responsable, tipo, nivel y estado;
- reconciliacion unica de alertas vigente para listado y dashboard;
- visibilidad por rol y alcance compartida entre tareas, alertas y dashboard;
- auditoria de lectura, atencion, descarte y rechazo de transicion invalida;
- cobertura operativa oficial desde tarea fiscal, no desde obligacion directa.

## Fases posteriores

### Fase 7 - Dashboard gerencial, reportes e indicadores

Estado: completada.

Incluye:

- dashboard gerencial filtrable por fecha, empresa, responsable, estado, impuesto, riesgo, periodo y vista;
- indicadores de cumplimiento, vencimientos, riesgo y carga operativa por alcance visible;
- endpoints seccionales para resumen, vencimientos, cumplimiento, riesgo, carga y alertas gerenciales;
- reportes gerenciales consistentes con el dashboard y exportacion CSV por permisos;
- deteccion de huecos operativos como obligaciones activas sin tarea fiscal y tareas proximas sin responsable;
- mantenimiento de una unica fuente de verdad basada en tareas visibles y alertas reconciliadas.

### Fase 8 - Base de datos y persistencia real

Estado: en progreso.

Avance actual:

- driver seleccionable `json` o `database`;
- infraestructura inicial de PostgreSQL;
- migraciones SQL versionadas y rollback inicial;
- semillas tecnicas y demo para base de datos;
- script de migracion desde JSON con `dry-run`;
- capa de persistencia transicional sin romper Fases 1 a 7.

Pendiente de cierre:

- validar operacion real sobre PostgreSQL con una base disponible;
- reforzar pruebas reales de transaccion, concurrencia e idempotencia;
- completar la integracion operacional definitiva de servicios sobre base de datos;
- preparar el corte controlado de JSON hacia `database` como modo principal.

### Fase 9

Estado: pendiente.

- portal cliente;
- acceso limitado por empresa;
- visualizacion compartida y carga de soportes.

### Fase 10

Estado: pendiente.

- solicitudes de documentos e informacion al cliente;
- trazabilidad de entrega, revision y aprobacion.

### Fase 11

Estado: pendiente.

- auditoria ampliada;
- seguridad;
- respaldos;
- preparacion SaaS multi-organizacion.
