# Despliegue controlado de pruebas con PostgreSQL

La configuración de referencia usa Docker Compose y un reverse proxy. Es portable a
cualquier hosting que ejecute contenedores; el repositorio no selecciona actualmente
un proveedor PaaS. El proxy debe terminar TLS externamente y publicar frontend y API
en el mismo origen: `/` se dirige a `web` y `/api`, `/health` y `/ready` a `api`.

## Requisitos y secretos

Crear un archivo local `.env` (ignorado por Git) con, como mínimo:

- `POSTGRES_PASSWORD`
- `AUTH_CSRF_SECRET` aleatorio de 32 o más caracteres
- `PUBLIC_ORIGIN`, URL HTTPS pública sin ruta
- `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME` y
  `BOOTSTRAP_ADMIN_PASSWORD`, sólo mientras se ejecuta el bootstrap

Opcionales: `POSTGRES_DB`, `POSTGRES_USER`, `PUBLIC_HTTP_PORT`, `DB_POOL_MAX`,
`HTTP_SHUTDOWN_TIMEOUT_MS` y `TRUSTED_PROXY_ADDRESSES`. Compose usa por defecto la
IP fija `172.31.240.10` asignada a su proxy; en otro hosting la variable debe contener
exclusivamente las IP directas de proxies confiables. No se debe versionar `.env`,
un volcado, un certificado ni datos operativos.

## Construcción e inicio

```powershell
docker compose --env-file .env -f compose.test.yml build
docker compose --env-file .env -f compose.test.yml run --rm migrate
docker compose --env-file .env -f compose.test.yml run --rm initialize
docker compose --env-file .env -f compose.test.yml --profile tools run --rm bootstrap
docker compose --env-file .env -f compose.test.yml up -d
```

El orden obligatorio es `migrate → initialize → bootstrap → up`. `db:seed` no forma
parte del arranque normal del piloto: carga catalogos tecnicos y 536 calendarios sobre
exactamente una organizacion activa. `db:seed:demo` carga fixtures demo de forma
atomica; `db:migrate-json` importa las 15 colecciones de una instalacion existente.

Las migraciones usan advisory lock y son idempotentes. `db:init:deployment` crea la
organización técnica sólo si no existe ninguna y sincroniza roles/permisos sin borrar
organizaciones ni cargar calendarios o datos demo. El bootstrap es separado, exige
producción y PostgreSQL y no altera nada cuando ya existe un owner activo. Después de
usarlo, retirar sus tres variables del gestor de secretos.

Comprobar `GET /health` para liveness y `GET /ready` para conexión y migraciones. El
orquestador sólo debe enviar tráfico cuando `/ready` responda 200. SIGTERM drena HTTP,
marca la API no-ready y cierra el pool PostgreSQL.

El proxy incluido escucha HTTP interno en el puerto 8080. En el hosting, un balanceador
HTTPS debe apuntar a ese puerto. `HTTPS_CONFIRMED=true` declara esa terminación TLS; no
exponga el puerto sin HTTPS en un ambiente accesible. Como el navegador usa `/api` en
el mismo origen, conserva la cookie `__Host-gestorconta_session`, `Secure`, `HttpOnly`,
`SameSite=Lax`, CORS exacto y CSRF sin configuración cross-site.

## Persistencia de PDF RUT

Compose monta el volumen nombrado `uploads-data` exclusivamente en `uploads-init` y
`api`, en `/app/apps/api/data/uploads`. El job `uploads-init` crea `uploads/rut`, asigna
el volumen al UID/GID no privilegiado `10001:10001` y aplica permisos `0750`; la API
despues se ejecuta con ese usuario. Web y Nginx no montan el volumen y Nginx no publica
ninguna ruta de archivos. Los documentos siguen bajo el control de acceso de la API.

`.dockerignore` y `.gitignore` excluyen el directorio completo de uploads y todos los
PDF, por lo que un documento local no se incorpora a la imagen ni a Git.

## Backup y restauración conjunta

Crear un directorio local ignorado y hacer un volcado en formato custom:

```powershell
New-Item -ItemType Directory -Force exports | Out-Null
docker compose --env-file .env -f compose.test.yml exec -T postgres pg_dump -U gestorconta -d gestorconta -Fc -f /tmp/gestorconta.dump
docker compose --env-file .env -f compose.test.yml cp postgres:/tmp/gestorconta.dump exports/gestorconta.dump
docker compose --env-file .env -f compose.test.yml exec -T postgres rm -f /tmp/gestorconta.dump
docker run --rm -v gestorconta-test_uploads-data:/source:ro -v "${PWD}/exports:/backup" alpine:3.22 sh -c "cd /source && tar -czf /backup/gestorconta-uploads.tar.gz ."
```

Si se personalizan `POSTGRES_USER` o `POSTGRES_DB`, sustituirlos en el comando. Guardar
el archivo cifrado fuera del host y probar periódicamente la restauración. Para una
base y volumen temporales independientes:

```powershell
docker compose --env-file .env -f compose.test.yml exec -T postgres createdb -U gestorconta gestorconta_restore
docker compose --env-file .env -f compose.test.yml cp exports/gestorconta.dump postgres:/tmp/gestorconta.dump
docker compose --env-file .env -f compose.test.yml exec -T postgres pg_restore -U gestorconta -d gestorconta_restore /tmp/gestorconta.dump
docker compose --env-file .env -f compose.test.yml exec -T postgres psql -U gestorconta -d gestorconta_restore -c "SELECT COUNT(*) FROM schema_migrations;"
docker compose --env-file .env -f compose.test.yml exec -T postgres rm -f /tmp/gestorconta.dump
docker volume create gestorconta-uploads-restore-test
docker run --rm -v gestorconta-uploads-restore-test:/restore -v "${PWD}/exports:/backup:ro" alpine:3.22 sh -c "cd /restore && tar -xzf /backup/gestorconta-uploads.tar.gz"
docker run --rm -v gestorconta-uploads-restore-test:/restore:ro alpine:3.22 sh -c "test -d /restore/rut && find /restore/rut -type f -print"
```

La prueba de restauracion debe comparar conteos y hashes de archivos, verificar las
migraciones de la base restaurada y eliminar exclusivamente la base y el volumen
temporales creados. No muestres nombres o contenidos de documentos reales en logs.

La restauración sobre el nombre operativo requiere ventana de mantenimiento, detener
la API, verificar el backup y conservar el volumen anterior hasta validar `/ready`,
login y conteos. Nunca restaurar sobre producción como prueba.

## Reinicio, actualización y reversión

Antes de actualizar, crear y verificar un backup. Construir la nueva imagen, ejecutar
los jobs `migrate` e `initialize`, iniciar servicios y esperar readiness. Reiniciar `api` no elimina
datos porque PostgreSQL usa el volumen `postgres-data`. Una reversión de aplicación no
implica rollback automático de esquema: los rollbacks son explícitos y sólo se hacen
tras revisar compatibilidad y backup.

## Limitación conocida

El piloto admite una organizacion, una instancia y baja concurrencia. Autenticación y sesiones usan el pool asíncrono persistente. Empresas, calendarios,
obligaciones, tareas, alertas, dashboard y reportes conservan temporalmente el bridge
síncrono; el rate limiter permanece en memoria y TLS termina externamente. Las
latencias y el bloqueo del proceso impiden considerarla lista para carga, multiples
instancias o producción.
