# Reporte Funcional Detallado del Sistema

## 1. Objetivo general

Este sistema administra el ciclo operativo de una firma contable o tributaria desde la seguridad de acceso hasta la gestion de empresas, obligaciones fiscales, calendarios, tareas, alertas y tablero de control.

La implementacion actual cubre estas capas:

- autenticacion y sesiones
- usuarios, roles, permisos y empresas asignadas
- cargue de RUT en PDF con extraccion y revision humana
- creacion o actualizacion de empresas desde RUT
- aprobacion operativa de empresas
- catalogo de impuestos
- reglas tributarias e inferencias
- obligaciones fiscales por empresa
- calendarios fiscales versionados
- generacion de tareas fiscales
- tareas manuales y controles DIAN
- alertas internas
- dashboard operativo
- auditoria transversal de acciones

## 2. Arquitectura funcional

El sistema se divide en dos aplicaciones principales:

- `apps/web`: interfaz operativa usada por el equipo.
- `apps/api`: API HTTP que ejecuta reglas, validaciones, persistencia y auditoria.

La persistencia actual es local en JSON dentro de `apps/api/data`. No usa base de datos relacional todavia. Cada modulo guarda en su propio archivo:

- `users.json`
- `sessions.json`
- `companies.json`
- `documents.json`
- `extractions.json`
- `taxes.json`
- `tax-rules.json`
- `inferred-tax-rules.json`
- `company-obligations.json`
- `fiscal-calendars.json`
- `fiscal-calendar-versions.json`
- `fiscal-tasks.json`
- `internal-alerts.json`
- `audits.json`

## 3. Seguridad, usuarios y acceso

### 3.1 Inicio de sesion

Acciones del sistema:

- recibe correo y contrasena por `POST /api/auth/login`
- busca usuario activo
- valida hash de contrasena
- crea sesion con vigencia temporal
- registra ultimo acceso del usuario
- devuelve token para operar la app

### 3.2 Sesion activa

Acciones del sistema:

- consulta sesion actual por `GET /api/auth/session`
- identifica al usuario desde `Authorization: Bearer ...`
- expone datos sanitizados del usuario
- expone permisos efectivos calculados por roles y permisos directos

### 3.3 Cierre de sesion

Acciones del sistema:

- elimina la sesion activa por `POST /api/auth/logout`
- invalida el token almacenado

### 3.4 Roles disponibles

Roles implementados:

- `cliente`
- `operativo_basico`
- `operativo_medio`
- `supervisor`
- `gerente`
- `administrador`
- `solo_lectura`

### 3.5 Permisos

El sistema no confia solo en el rol mostrado en pantalla. Cada accion valida permisos efectivos antes de ejecutarse.

Permisos relevantes:

- `cargar_rut_pdf`
- `confirmar_empresa_rut`
- `gestionar_obligaciones`
- `aprobar_empresa`
- `gestionar_impuestos`
- `gestionar_calendarios`
- `generar_tareas_fiscales`
- `ver_modulo_usuarios`
- `crear_usuarios`
- `editar_usuarios`
- `asignar_permisos`
- `ver_dashboard_general`
- `ver_todas_empresas`

### 3.6 Acceso por empresa

Acciones del sistema:

- si el usuario tiene `ver_todas_empresas`, puede ver todo
- si no, solo puede operar sobre `empresasAsignadas`
- esta validacion se aplica al consultar empresa, tareas, alertas y responsables

## 4. Gestion de usuarios

### 4.1 Crear usuario

Flujo funcional:

- el usuario con permiso abre modulo de usuarios
- diligencia nombre, correo, cargo, estado, roles, empresas asignadas y contrasena
- opcionalmente asigna permisos directos

Validaciones del sistema:

- nombre obligatorio
- correo obligatorio
- minimo un rol
- estado valido
- roles validos
- empresas asignadas existentes
- correo no duplicado
- contrasena minima de 10 caracteres
- permisos directos solo por usuarios autorizados

Persistencia:

- crea usuario con id unico
- genera `passwordSalt`
- genera `passwordHash`
- guarda en `users.json`
- registra auditoria `crear_usuario`

### 4.2 Editar usuario

Flujo funcional:

- permite cambiar datos generales
- permite cambiar roles
- permite reasignar empresas
- permite redefinir contrasena

Controles especiales:

- un usuario no puede desactivarse a si mismo si esta activo
- un administrador no puede quitarse a si mismo el rol de administrador
- permisos directos sensibles requieren autorizacion

Persistencia:

- actualiza `users.json`
- registra auditoria `actualizar_usuario`

## 5. Cargue de empresas desde RUT

### 5.1 Cargar PDF del RUT

Flujo funcional:

- el usuario sube archivo PDF
- el frontend envia `multipart/form-data` a `POST /api/rut-uploads`
- la API valida que el archivo sea PDF
- guarda el archivo en `apps/api/data/uploads/rut`

Extraccion:

- extrae texto del PDF
- identifica NIT y DV
- identifica razon social
- identifica tipo de contribuyente
- deriva tipo de persona
- deriva regimen tributario
- captura actividad economica principal
- captura responsabilidades tributarias
- deriva flags tributarios
- captura representante legal
- calcula estado de extraccion y confianza

Persistencia:

- crea documento en `documents.json`
- crea extraccion en `extractions.json`
- guarda preview del texto extraido
- registra auditoria `cargar_rut_pdf`

### 5.2 Revision humana del RUT

El sistema no crea empresa automaticamente. Primero exige validacion humana.

Acciones disponibles en pantalla:

- revisar campos principales
- revisar datos avanzados
- corregir manualmente texto o valores
- ajustar actividad economica y nombre CIIU
- verificar responsabilidades
- revisar flags como IVA, facturacion, exogena y contabilidad

### 5.3 Crear empresa desde RUT

Flujo funcional:

- el usuario confirma datos revisados
- el sistema valida borrador de empresa
- si el modo es `create`, exige que no exista otro NIT-DV igual

Datos que guarda en la empresa:

- identificacion tributaria
- datos de contacto
- ubicacion
- regimen
- actividad economica
- responsabilidades
- representante legal
- datos confirmados por usuario
- datos extraidos originales
- metadata de extraccion
- documento RUT asociado

Estado inicial:

- normalmente `pendiente_revision`
- puede quedar `activa` si el flujo lo permite y se envian esos datos

Persistencia:

- guarda empresa en `companies.json`
- enlaza documento con empresa
- marca extraccion como confirmada
- registra auditoria `crear_empresa`

### 5.4 Actualizar empresa existente desde RUT

Flujo funcional:

- el usuario cambia el modo a `Actualizar RUT existente`
- puede seleccionar empresa o dejar deteccion por NIT y DV
- el sistema valida coincidencia de identidad
- evita colision con otra empresa distinta
- reemplaza datos maestros de la empresa con los confirmados en revision

Persistencia:

- actualiza empresa existente
- re-enlaza documento RUT
- registra auditoria `actualizar_empresa_desde_rut`

## 6. Activacion operativa de empresa

Una empresa creada desde RUT no necesariamente queda lista para operar.

### 6.1 Aprobar revision

Flujo funcional:

- un usuario con permiso usa `Aprobar revision y activar empresa`
- la API valida que la empresa este en `pendiente_revision` o `borrador`
- valida campos minimos para activacion

Campos obligatorios para activar:

- NIT
- DV
- razon social
- tipo de contribuyente
- documento RUT asociado

Efectos de activacion:

- estado cambia a `activa`
- habilita generacion de tareas
- habilita generacion de obligaciones
- hace visible la empresa para operacion
- registra fecha de activacion

Persistencia:

- actualiza `companies.json`
- registra auditoria `aprobar_revision_empresa`

## 7. Vista y detalle de empresas

### 7.1 Listado de empresas

El sistema muestra:

- razon social
- nombre comercial
- NIT y DV
- estado
- documento RUT asociado o pendiente
- resumen DIAN compacto

### 7.2 Detalle de empresa

El detalle consolidado muestra:

- datos generales
- datos de contacto
- actividad economica
- responsabilidades RUT
- documento RUT
- obligaciones fiscales
- tareas fiscales
- controles DIAN generados
- numero de controles DIAN abiertos
- banderas de cumplimiento DIAN

## 8. Catalogo de actividades economicas CIIU

Acciones del sistema:

- expone consulta de catalogo por `GET /api/catalogs/ciiu`
- expone busqueda por `GET /api/catalogs/ciiu/search`
- permite enriquecer el codigo CIIU del RUT con nombre descriptivo

Uso funcional:

- mejora calidad de revision humana
- ayuda a reglas tributarias futuras

## 9. Catalogo de impuestos

### 9.1 Crear impuesto

Datos administrados:

- codigo
- nombre
- nivel
- descripcion
- periodicidad default
- si requiere municipio
- si requiere departamento
- si aplica por NIT
- si aplica por DV
- ente administrador
- fuente normativa
- estado

Validaciones:

- codigo unico
- nombre obligatorio
- nivel valido
- periodicidad valida
- estado valido

Persistencia:

- guarda en `taxes.json`
- registra auditoria

### 9.2 Editar impuesto

Acciones del sistema:

- actualiza definicion del impuesto
- permite simular impacto con `POST /api/taxes/:id/impact`
- si cambia periodicidad, estima empresas y obligaciones afectadas

Regla importante:

- la propagacion automatica de periodicidad solo aplica a obligaciones sin historial presentado

## 10. Reglas tributarias

### 10.1 Reglas directas por responsabilidad RUT

El sistema usa `tax-rules.json` para convertir responsabilidades del RUT en obligaciones sugeridas.

Ejemplo de funcionamiento:

- si una responsabilidad coincide con una regla activa
- se busca el impuesto asociado
- se crea obligacion sugerida o pendiente de revision segun el caso

### 10.2 Reglas deducidas

El sistema usa `inferred-tax-rules.json` para inferencias mas amplias.

Criterios posibles:

- tipo de persona
- regimen
- flags booleanos
- responsabilidades RUT
- prefijos CIIU
- ubicacion

Resultado:

- crea obligaciones deducidas con fuente `matriz_deducida_2026`

## 11. Obligaciones fiscales por empresa

### 11.1 Analizar obligaciones automaticamente

Flujo funcional:

- desde una empresa activa se ejecuta `Analizar obligaciones`
- el sistema toma perfil tributario efectivo de la empresa
- evalua reglas directas
- evalua reglas deducidas
- evalua sugerencia especial de ICA por ubicacion y actividad

Validaciones:

- la empresa debe existir
- la empresa no debe estar bloqueada operativamente

Resultado:

- crea obligaciones sugeridas, activas o en revision
- evita duplicados por empresa, impuesto, codigo RUT y municipio
- registra auditoria por analisis y por cada obligacion creada

### 11.2 Crear obligacion manual

Uso:

- sirve cuando el motor no detecta un impuesto
- cubre impuestos municipales, departamentales o casos especiales

Validaciones:

- empresa existente y operativa
- impuesto existente
- municipio obligatorio para nivel municipal
- departamento obligatorio para nivel departamental
- no duplicar obligacion activa o equivalente

Persistencia:

- guarda en `company-obligations.json`
- registra auditoria `crear_obligacion_manual`

### 11.3 Editar obligacion

Acciones del sistema:

- permite cambiar impuesto, nivel, ubicacion, periodicidad, estado, motivo y observaciones
- vuelve a validar duplicados y campos obligatorios
- registra auditoria `editar_obligacion_empresa`

### 11.4 Confirmar, revisar o marcar no aplica

Estados implementados:

- `sugerida`
- `activa`
- `pendiente_revision`
- `no_aplica`
- `inactiva`

Acciones:

- `confirmar_obligacion`
- `obligacion_en_revision`
- `obligacion_no_aplica`

Regla clave:

- para confirmar una obligacion, la empresa debe estar activa

## 12. Calendarios fiscales

### 12.1 Crear calendario

Datos administrados:

- impuesto
- anio
- periodo
- periodicidad
- nivel
- pais
- departamento
- municipio
- criterio de vencimiento
- ultimo digito NIT
- rango de ultimos digitos
- digito de verificacion
- tipo de contribuyente
- regimen
- fecha de vencimiento
- fuente del calendario
- tipo de pago
- numero de cuota
- nombre de cuota

Validaciones:

- impuesto existente
- anio valido
- periodo obligatorio
- periodicidad valida
- nivel valido
- fecha de vencimiento obligatoria
- fuente valida
- tipo de pago valido
- datos adicionales segun criterio y nivel

Persistencia:

- guarda en `fiscal-calendars.json`
- registra auditoria `crear_calendario_fiscal`

### 12.2 Editar calendario

Regla importante:

- si el calendario ya esta activo, no permite cambios estructurales protegidos
- obliga a usar reemplazo para preservar historico

### 12.3 Activar calendario

Acciones del sistema:

- cambia estado de `borrador` o `validado` a `activo`
- registra auditoria

### 12.4 Anular calendario

Acciones del sistema:

- cambia estado a `anulado`
- mantiene historico

### 12.5 Eliminar calendario

Regla importante:

- no se puede eliminar si ya existen tareas fiscales generadas desde ese calendario

### 12.6 Reemplazar calendario

Acciones del sistema:

- marca el anterior como `reemplazado`
- crea una nueva version
- guarda snapshot anterior y nuevo en `fiscal-calendar-versions.json`
- mantiene trazabilidad historica

## 13. Generacion de tareas fiscales

### 13.1 Funcion general

El sistema genera tareas fiscales a partir de:

- empresas activas
- obligaciones activas
- calendarios activos aplicables

### 13.2 Reglas de emparejamiento

El sistema compara:

- impuesto de la obligacion
- periodicidad
- nivel nacional, departamental o municipal
- municipio y departamento
- tipo de contribuyente
- regimen
- ultimo digito de NIT
- rango de ultimos digitos
- digito de verificacion

### 13.3 Omisiones controladas

Puede omitir generacion cuando:

- la empresa no esta activa
- la obligacion no esta activa
- no existe calendario compatible
- el calendario historico ya esta vencido y no se incluyo vencido

### 13.4 Duplicados

Evita generar dos veces la misma tarea por combinacion de:

- empresa
- obligacion
- calendario
- periodo
- anio

### 13.5 Resultado

Cada tarea fiscal guarda:

- empresa
- obligacion
- calendario
- periodo
- anio
- fecha de vencimiento
- fecha limite interna
- prioridad
- estado operativo
- responsable

## 14. Tareas operativas y manuales

### 14.1 Crear tarea manual

Tipos permitidos:

- `cumplimiento_dian`
- `contable`
- `administrativa`
- `operativa`
- `comercial`
- `interna`
- `cliente`

Reglas:

- no permite crear manualmente tipo `fiscal`
- la empresa debe estar activa
- requiere titulo y fecha de vencimiento
- si se asigna responsable, debe tener acceso a la empresa

Persistencia:

- guarda en `fiscal-tasks.json`
- registra auditoria `crear_tarea_manual`

### 14.2 Reasignar tarea

Acciones:

- valida que el responsable exista
- valida que tenga acceso a la empresa
- actualiza responsable
- registra auditoria `reasignar_tarea`

### 14.3 Cambiar estado

Estados:

- `pendiente`
- `en_proceso`
- `presentada`
- `completada`
- `vencida`
- `cancelada`
- `no_aplica`

Acciones:

- si pasa a `en_proceso` y no tenia responsable, asigna al actor
- guarda observaciones
- registra auditoria `cambiar_estado_tarea`

### 14.4 Cerrar tarea

Solo admite cierre como:

- `presentada`
- `completada`

Registra:

- fecha de cierre
- usuario que cerró
- auditoria `cerrar_tarea`

### 14.5 Vencimiento automatico

Cada vez que se listan tareas, el sistema:

- revisa fecha de vencimiento
- si ya vencio y no esta cerrada, la marca como `vencida`
- registra auditoria automatica

## 15. Controles DIAN

### 15.1 Logica de sugerencia

El sistema genera controles DIAN para empresas activas segun su perfil:

- actualizacion RUT
- facturacion electronica
- informacion exogena
- documento soporte con no obligados a facturar
- nomina electronica
- firma electronica

### 15.2 Criterios usados

- responsabilidades tributarias del RUT
- si esta obligada a facturar
- si informa exogena
- si es persona juridica
- si lleva contabilidad
- obligaciones ya existentes relacionadas

### 15.3 Generacion

Flujo:

- desde `Tareas` se usa `Generar controles DIAN`
- la API crea tareas de tipo `cumplimiento_dian`
- evita duplicados por empresa, control, periodo y anio
- asigna prioridad y fechas relativas

Persistencia:

- guarda en `fiscal-tasks.json`
- registra auditoria `generar_control_dian`

### 15.4 Visualizacion

El sistema muestra:

- badges de cumplimiento DIAN en empresa
- resumen compacto en listados
- total de controles DIAN abiertos

## 16. Alertas internas

### 16.1 Generacion

El sistema genera alertas desde tareas.

Casos:

- tarea vencida
- tarea proxima a vencer en 7 dias

### 16.2 Diferenciacion de controles DIAN

Para tareas `cumplimiento_dian`:

- el mensaje nombra explicitamente `control DIAN`
- si vence en 0 a 2 dias, puede escalar a critica

### 16.3 Sincronizacion

Cuando cambia una tarea:

- la alerta puede actualizarse
- puede cerrarse automaticamente si ya no aplica
- puede regenerarse si reaparece la condicion

### 16.4 Estados de alerta

- `no_leida`
- `leida`
- `atendida`

### 16.5 Acciones de usuario

- marcar como leida
- marcar como atendida

Persistencia:

- guarda en `internal-alerts.json`
- registra auditoria por generacion, actualizacion y cierre

## 17. Dashboard operativo

El dashboard consolida informacion visible para el usuario segun sus permisos.

Resumen principal:

- empresas activas
- obligaciones fiscales activas
- tareas pendientes
- tareas en proceso
- tareas completadas o presentadas
- tareas vencidas
- alertas preventivas
- alertas criticas

Vista del mes actual:

- tareas vencidas del mes
- tareas completadas del mes
- tareas proximas siete dias
- tareas fiscales del mes
- empresas con riesgo operativo

Analitica adicional:

- riesgo por empresa
- carga por usuario
- porcentaje de cumplimiento
- top de alertas criticas

## 18. Auditoria

El sistema registra auditoria en casi todas las acciones sensibles.

Ejemplos:

- crear usuario
- actualizar usuario
- cargar RUT
- crear empresa
- actualizar empresa desde RUT
- aprobar empresa
- crear impuesto
- editar impuesto
- crear regla
- analizar obligaciones
- crear obligacion
- confirmar obligacion
- crear calendario
- activar calendario
- reemplazar calendario
- generar tareas fiscales
- crear tarea manual
- reasignar tarea
- generar control DIAN
- generar alerta

Cada auditoria puede guardar:

- organizacion
- usuario actor
- modulo
- tipo de recurso
- id del recurso
- descripcion
- valor anterior
- valor nuevo
- fecha

## 19. Flujo end-to-end recomendado

Orden funcional sugerido para operar el sistema:

1. Crear usuarios y asignar roles y empresas.
2. Cargar PDF RUT.
3. Revisar y corregir extraccion.
4. Crear empresa o actualizar una existente.
5. Aprobar revision y activar empresa.
6. Analizar obligaciones segun RUT y reglas deducidas.
7. Ajustar o crear obligaciones manuales si hace falta.
8. Configurar o validar calendarios fiscales.
9. Generar tareas fiscales.
10. Generar controles DIAN.
11. Asignar responsables y ejecutar tareas.
12. Revisar alertas internas.
13. Monitorear dashboard y riesgo por empresa.

## 20. Limitaciones actuales

La implementacion actual todavia tiene estas fronteras:

- persistencia local en JSON, no multiusuario robusto de alta concurrencia
- no hay envio real de correo o notificaciones externas
- no hay integracion directa con DIAN o MUISCA
- el motor DIAN actual trabaja por heuristicas y reglas internas
- no existe aun un modulo formal de exportacion avanzada de reportes
- no hay bitacora visual completa de versiones de empresa, aunque si hay auditoria

## 21. Conclusión operativa

Hoy el sistema ya cubre un flujo serio de operacion:

- controla acceso
- crea y administra usuarios
- carga y valida RUT
- crea o actualiza empresas
- detecta obligaciones
- administra impuestos
- arma calendarios
- genera tareas fiscales
- genera controles DIAN
- produce alertas
- consolida indicadores

Eso lo convierte en una base funcional para operar clientes tributarios con trazabilidad y revision humana antes de automatizar decisiones sensibles.
