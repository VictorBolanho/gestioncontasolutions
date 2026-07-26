# Guia de migracion desde JSON a PostgreSQL

## Flujo recomendado

1. Mantener `STORAGE_DRIVER=json`.
2. Crear la base PostgreSQL destino.
3. Aplicar migraciones:

```powershell
npm run db:migrate
```

4. Ejecutar validacion sin escritura:

```powershell
npm run db:migrate-json:dry-run
```

5. Revisar conteos e incidencias.
6. Si no hay errores, ejecutar:

```powershell
npm run db:migrate-json
```

7. Probar el sistema en entorno controlado con `STORAGE_DRIVER=database`.

## Garantias actuales

- no borra los JSON originales;
- el `dry-run` no escribe en la base;
- valida referencias criticas antes de migrar;
- usa un orden controlado de entidades.
