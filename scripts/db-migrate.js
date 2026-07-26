import { applyPendingMigrations } from "../apps/api/src/db/migrations.js";
import { closePgPool } from "../apps/api/src/db/postgres-client.js";

async function main() {
  const applied = await applyPendingMigrations();
  if (applied.length === 0) {
    console.log("[ok] No hay migraciones pendientes.");
    return;
  }

  applied.forEach((name) => console.log(`[ok] Migracion aplicada: ${name}`));
}

main()
  .catch((error) => {
    console.error(`[fail] ${error.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await closePgPool();
  });
