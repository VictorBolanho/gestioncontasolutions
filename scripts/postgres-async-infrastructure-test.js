import assert from "node:assert/strict";
import { applyPendingMigrations, checkMigrationReadiness } from "../apps/api/src/db/migrations.js";
import {
  getPgPoolMetrics,
  healthCheckPgPool,
  withPgClient,
  withPgTransaction
} from "../apps/api/src/db/postgres-client.js";
import { createStorageProvider } from "../apps/api/src/lib/storage-provider.js";

if (process.env.NODE_ENV !== "test" || process.env.STORAGE_DRIVER !== "database") {
  throw new Error("La prueba requiere NODE_ENV=test y STORAGE_DRIVER=database.");
}
if (!process.env.GESTORCONTA_TEMP_DATABASE_URL || process.env.DATABASE_URL !== process.env.GESTORCONTA_TEMP_DATABASE_URL) {
  throw new Error("La prueba solo admite la DATABASE_URL temporal creada por el orquestador.");
}

const provider = createStorageProvider({ driver: "database" });
try {
  await provider.start();
  const [first, second] = await Promise.all([
    applyPendingMigrations(),
    applyPendingMigrations()
  ]);
  assert.equal(first.length + second.length, 2);
  const readiness = await withPgClient(checkMigrationReadiness);
  assert.deepEqual(readiness, { ready: true, pendingCount: 0 });
  assert.deepEqual(await provider.readiness(), { ready: true });

  await withPgTransaction(async (client) => {
    await client.query("CREATE TEMP TABLE phase0_commit_probe (id integer)");
    await client.query("INSERT INTO phase0_commit_probe VALUES (1)");
  });
  await assert.rejects(
    withPgTransaction(async (client) => {
      await client.query(
        "INSERT INTO organizations (id, nombre, estado, payload) VALUES ('rollback_probe', 'x', 'activa', '{}')"
      );
      throw new Error("rollback esperado");
    }),
    /rollback esperado/
  );
  const rollback = await withPgClient((client) =>
    client.query("SELECT COUNT(*)::int AS count FROM organizations WHERE id = 'rollback_probe'")
  );
  assert.equal(rollback.rows[0].count, 0);
  assert.equal(getPgPoolMetrics().total >= 1, true);

  await assert.rejects(
    withPgClient(async (victim) => {
      const terminated = new Promise((resolve) => victim.once("error", resolve));
      const victimPid = (await victim.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
      await withPgClient((killer) => killer.query("SELECT pg_terminate_backend($1)", [victimPid]));
      throw await terminated;
    }),
    (error) => error.code === "57P01"
  );
  assert.equal((await healthCheckPgPool()).ok, true);
  console.log("POSTGRES_ASYNC_PHASE0=ok");
} finally {
  await provider.close();
}
