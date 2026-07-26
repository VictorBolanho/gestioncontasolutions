import { closePgPool, withPgTransaction } from "../apps/api/src/db/postgres-client.js";
import { applyPendingMigrations } from "../apps/api/src/db/migrations.js";
import { seedTechnicalData } from "../apps/api/src/db/seed.js";

async function main() {
  if (String(process.env.NODE_ENV || "").trim() !== "test") {
    throw new Error("db:reset:test solo debe ejecutarse con NODE_ENV=test.");
  }

  await withPgTransaction(async (client) => {
    await client.query(`
      DO $$
      DECLARE
        item RECORD;
      BEGIN
        FOR item IN
          SELECT tablename
          FROM pg_tables
          WHERE schemaname = 'public'
            AND tablename <> 'schema_migrations'
        LOOP
          EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', item.tablename);
        END LOOP;
      END $$;
    `);
  });

  await applyPendingMigrations();
  await seedTechnicalData();
  console.log("[ok] Base de datos de prueba reiniciada.");
}

main()
  .catch((error) => {
    console.error(`[fail] ${error.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await closePgPool();
  });
