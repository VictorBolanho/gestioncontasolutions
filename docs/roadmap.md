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

Estado: siguiente fase.

Objetivo propuesto:

- calendario fiscal versionado;
- relacion calendario-empresa-obligacion;
- generacion controlada de tareas fiscales;
- preparacion para recordatorios y seguimiento operativo.

Fase 3 todavia no esta implementada.

## Fases posteriores

### Fases 4 y 5

- usuarios, cargos, roles y permisos;
- gestion integral de tareas fiscales y no fiscales.

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
