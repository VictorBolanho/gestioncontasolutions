# Piloto permanente en Ubuntu Server

Esta guía opera una sola instancia de GestorConta en una mini PC Intel N95 con
8 GB de RAM y SSD de 256 GB. El piloto admite una organización y baja
concurrencia; no es multi-tenant ni horizontal.

## Perímetro y persistencia

`compose.production.yml` es independiente de `compose.test.yml`. Sólo Nginx
publica un puerto (`443` por defecto) hacia la LAN mediante una red de borde.
API, frontend y PostgreSQL permanecen en una red Docker interna; PostgreSQL no
publica `5432`. Nginx es el único servicio conectado a ambas redes.

Los datos sobreviven a recreaciones en dos volúmenes nombrados:

- `gestorconta-production_postgres-data`: PostgreSQL;
- `gestorconta-production_uploads-data`: PDF RUT privados.

Nginx termina TLS y enruta `/api`, `/health` y `/ready` hacia la API. El
certificado y los secretos se montan desde archivos locales de sólo lectura. No
se pasan secretos en argumentos, imágenes ni `.env.production`.

## Requisitos

- Ubuntu Server 26.04, Docker Engine 29 y Docker Compose 2.40;
- Git y OpenSSL;
- DNS local o nombre estable para la mini PC;
- certificado TLS cuya SAN cubra ese nombre o IP y sea confiable por los clientes.

El cortafuegos debe permitir sólo SSH desde la red administrativa y el puerto
HTTPS elegido desde la LAN. No habilitar 3000, 4000 ni 5432.

## Preparación inicial y secretos

```bash
git clone https://github.com/VictorBolanho/gestioncontasolutions.git gestorconta
cd gestorconta
git switch desarrollo-fases-0-2
cp .env.production.example .env.production
install -d -m 700 secrets backups
chmod 600 .env.production
```

Editar `.env.production`: definir origen, puerto, correo y nombre del owner y
las rutas del certificado. No escribir contraseñas allí. Generar secretos sin
imprimirlos ni guardarlos en el historial:

```bash
umask 077
openssl rand -base64 48 > secrets/postgres_password
openssl rand -base64 48 > secrets/auth_csrf_secret
install -m 600 /ruta/segura/certificado.crt secrets/tls.crt
install -m 600 /ruta/segura/clave.key secrets/tls.key
read -rsp 'Contraseña inicial del owner: ' OWNER_PASSWORD; echo
printf '%s' "$OWNER_PASSWORD" > secrets/bootstrap_admin_password
unset OWNER_PASSWORD
```

La contraseña del owner requiere 14–256 caracteres, mayúscula, minúscula,
número y símbolo, sin espacios ni el usuario del correo. `read -s` evita
pantalla e historial; `umask 077` restringe los archivos.

## Primer arranque controlado

```bash
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker compose --env-file .env.production -f compose.production.yml build
docker compose --env-file .env.production -f compose.production.yml up -d postgres
docker compose --env-file .env.production -f compose.production.yml run --rm migrate
docker compose --env-file .env.production -f compose.production.yml run --rm initialize
docker compose --env-file .env.production -f compose.production.yml --profile tools run --rm bootstrap
rm -f secrets/bootstrap_admin_password
docker compose --env-file .env.production -f compose.production.yml up -d api web proxy
```

El orden es `migrate → db:init:deployment → db:bootstrap-admin → up`. No ejecuta
`db:seed`, `db:seed:demo`, `db:migrate-json` ni crea usuarios demo. El bootstrap
es idempotente y se niega a crear un segundo owner activo.

```bash
docker compose --env-file .env.production -f compose.production.yml ps
curl --fail --silent --show-error "$PUBLIC_ORIGIN/health"
curl --fail --silent --show-error "$PUBLIC_ORIGIN/ready"
```

## Límites para 8 GB

Los servicios permanentes tienen máximos cercanos a 3.5 GB: PostgreSQL 1.5 GB,
API 1.5 GB, frontend 256 MB y Nginx 128 MB. Los jobs usan 768 MB sólo durante
su ejecución. PostgreSQL limita conexiones a 30 y la API usa un pool de 8. Esto
deja margen para Ubuntu, caché, Docker y picos transitorios.

```bash
docker stats --no-stream
df -h /
docker system df
```

Alertar al 80 % de disco. No usar `docker system prune --volumes`.

## Backup verificado

El backup consistente incluye base y uploads. Los comandos no imprimen nombres
de documentos:

```bash
umask 077
stamp=$(date -u +%Y%m%dT%H%M%SZ)
db_user=$(sed -n 's/^POSTGRES_USER=//p' .env.production)
db_name=$(sed -n 's/^POSTGRES_DB=//p' .env.production)
docker compose --env-file .env.production -f compose.production.yml exec -T postgres \
  pg_dump -U "$db_user" -d "$db_name" -Fc > "backups/database-$stamp.dump"
docker run --rm -v gestorconta-production_uploads-data:/source:ro \
  -v "$PWD/backups:/backup" alpine:3.22 \
  sh -c "cd /source && tar -czf /backup/uploads-$stamp.tar.gz ."
sha256sum "backups/database-$stamp.dump" "backups/uploads-$stamp.tar.gz" \
  > "backups/manifest-$stamp.sha256"
unset db_user db_name
```

Copiar y cifrar el conjunto fuera de la mini PC. Probar restauración en otro
host o proyecto Compose aislado; nunca usar producción como prueba.

## Restore operativo

Programar ventana, verificar hashes y conservar los volúmenes anteriores:

1. detener `proxy`, `web` y `api`;
2. crear snapshot o copia de ambos volúmenes actuales;
3. restaurar con `pg_restore --clean --if-exists` en PostgreSQL vacío;
4. restaurar el tar en un volumen de uploads nuevo;
5. ejecutar `migrate` e `initialize`;
6. iniciar servicios y validar `/ready`, login, conteos y hashes;
7. conservar copias anteriores hasta la aceptación funcional.

No ejecutar un restore sin procedimiento ensayado y una copia recuperable del
estado previo.

## Actualización

Crear y verificar backup antes de actualizar:

```bash
git fetch origin
git status --short
git pull --ff-only origin desarrollo-fases-0-2
docker compose --env-file .env.production -f compose.production.yml build
docker compose --env-file .env.production -f compose.production.yml run --rm migrate
docker compose --env-file .env.production -f compose.production.yml run --rm initialize
docker compose --env-file .env.production -f compose.production.yml up -d api web proxy
docker compose --env-file .env.production -f compose.production.yml ps
curl --fail --silent --show-error "$PUBLIC_ORIGIN/ready"
```

`git pull --ff-only` evita merges. No repetir bootstrap ni seeds en una
actualización normal.

## Rollback

Un rollback de aplicación no revierte automáticamente el esquema. Si la versión
anterior es compatible con las migraciones aplicadas, reconstruir el commit
conocido desde una rama operativa. Si no lo es, detener tráfico y restaurar el
backup completo previo.

`npm run db:migrate:rollback` revierte sólo la última migración y se usa
únicamente tras revisar su SQL, confirmar compatibilidad y tener backup
verificado. Nunca encadenar rollbacks ni ejecutarlos durante el arranque.

## Salud y diagnóstico

```bash
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs --tail=100 api web proxy postgres
curl --fail --silent --show-error "$PUBLIC_ORIGIN/health"
curl --fail --silent --show-error "$PUBLIC_ORIGIN/ready"
```

Los logs no deben incluir secretos, tokens, dumps ni nombres de documentos.
`/health` indica proceso vivo; `/ready` valida PostgreSQL y migraciones.
