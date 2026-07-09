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
- generacion preliminar de tareas fiscales;
- control de no duplicacion;
- auditoria de calendario y tareas.

### Fase 4 - Usuarios, cargos, roles y permisos

Estado: completada.

Objetivo propuesto:

- usuarios internos;
- roles y permisos;
- empresas asignadas;
- seguridad operativa;
- base para panel general de tareas.

## Fases posteriores

### Fase 5

Estado: completada.

Incluye:

- gestion integral de tareas fiscales y no fiscales;
- creacion manual de tareas;
- estados operativos transversales;
- asignacion y reasignacion de responsables;
- seguimiento, cierre y filtros operativos;
- auditoria de cambios de estado, reasignaciones y cierre.

### Fases 6 y 7

- alertas internas;
- correos;
- dashboard gerencial e indicadores.

### Fases 8 a 10

- configuracion general;
- portal cliente;
- solicitudes de documentos e informacion.

### Fase 11

- auditoria ampliada;
- seguridad;
- respaldos;
- preparacion SaaS multi-organizacion.
