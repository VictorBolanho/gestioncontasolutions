import { rollbackLastMigration } from "../apps/api/src/db/migrations.js";
import { closePgPool } from "../apps/api/src/db/postgres-client.js";

async function main() {
  const rolledBack = await rollbackLastMigration();
  if (!rolledBack) {
    console.log("[ok] No hay migraciones aplicadas para revertir.");
    return;
  }

  console.log(`[ok] Migracion revertida: ${rolledBack}`);
}

main()
  .catch((error) => {
    console.error(`[fail] ${error.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await closePgPool();
  });
