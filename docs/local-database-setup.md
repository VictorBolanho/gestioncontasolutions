# Guia local de base de datos

## Variables

Configura `.env` local desde `.env.example`:

- `STORAGE_DRIVER`
- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

## Comandos

```powershell
npm run db:migrate
npm run db:migrate:rollback
npm run db:seed
npm run db:seed:demo
npm run db:migrate-json:dry-run
npm run db:migrate-json
npm run test:db
```

## Nota

En `STORAGE_DRIVER=database` debes aplicar migraciones antes de iniciar la API.
