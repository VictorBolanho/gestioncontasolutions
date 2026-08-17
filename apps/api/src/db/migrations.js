import fs from "node:fs/promises";
import path from "node:path";
import { getDatabaseConfig } from "./database-config.js";
import { runPgTransaction, withPgClient } from "./postgres-client.js";

const MIGRATION_ADVISORY_LOCK_KEY = 347_202_608;

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

async function ensureMigrationsTable(client) {
  const tableName = quoteIdentifier(getDatabaseConfig().migrationsTable);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function loadMigrationFiles() {
  const config = getDatabaseConfig();
  const entries = await fs.readdir(config.migrationsDir);
  return entries
    .filter((entry) => entry.endsWith(".up.sql"))
    .sort()
    .map((entry) => ({
      name: entry.replace(/\.up\.sql$/i, ""),
      upPath: path.join(config.migrationsDir, entry),
      downPath: path.join(config.migrationsDir, entry.replace(/\.up\.sql$/i, ".down.sql"))
    }));
}

async function getAppliedMigrationNames(client) {
  const tableName = quoteIdentifier(getDatabaseConfig().migrationsTable);
  const { rows } = await client.query(`SELECT name FROM ${tableName} ORDER BY id`);
  return rows.map((row) => row.name);
}

export async function checkMigrationReadiness(client) {
  const config = getDatabaseConfig();
  const tableExists = await client.query("SELECT to_regclass($1) AS table_name", [
    config.migrationsTable
  ]);
  if (!tableExists.rows[0]?.table_name) {
    return { ready: false, pendingCount: null };
  }
  const files = await loadMigrationFiles();
  const applied = new Set(await getAppliedMigrationNames(client));
  const pendingCount = files.filter((file) => !applied.has(file.name)).length;
  return { ready: pendingCount === 0, pendingCount };
}

async function withMigrationLock(callback) {
  return withPgClient(async (client) => {
    const timeoutMs = getDatabaseConfig().migrationLockTimeoutMs;
    let locked = false;
    let primaryError;
    try {
      await client.query("SELECT set_config('lock_timeout', $1, false)", [String(timeoutMs)]);
      await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_ADVISORY_LOCK_KEY]);
      locked = true;
      return await callback(client);
    } catch (error) {
      primaryError = error;
      throw error;
    } finally {
      if (locked) {
        try {
          await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_ADVISORY_LOCK_KEY]);
        } catch (unlockError) {
          if (!primaryError) {
            throw unlockError;
          }
        }
      }
      await client.query("SELECT set_config('lock_timeout', '0', false)").catch(() => {});
    }
  });
}

export async function listMigrations() {
  return withPgClient(async (client) => {
    await ensureMigrationsTable(client);
    const files = await loadMigrationFiles();
    const applied = new Set(await getAppliedMigrationNames(client));
    return files.map((file) => ({
      ...file,
      applied: applied.has(file.name)
    }));
  });
}

export async function applyPendingMigrations() {
  return withMigrationLock(async (client) => {
    const files = await loadMigrationFiles();
    return runPgTransaction(client, async (transactionClient) => {
      await ensureMigrationsTable(transactionClient);
      const applied = new Set(await getAppliedMigrationNames(transactionClient));
      const tableName = quoteIdentifier(getDatabaseConfig().migrationsTable);
      const appliedNow = [];

      for (const file of files) {
        if (applied.has(file.name)) {
          continue;
        }

        const sql = await fs.readFile(file.upPath, "utf8");
        await transactionClient.query(sql);
        await transactionClient.query(`INSERT INTO ${tableName} (name) VALUES ($1)`, [file.name]);
        appliedNow.push(file.name);
      }

      return appliedNow;
    });
  });
}

export async function rollbackLastMigration() {
  const files = await loadMigrationFiles();
  const byName = new Map(files.map((file) => [file.name, file]));

  return withMigrationLock(async (client) => {
    return runPgTransaction(client, async (transactionClient) => {
      await ensureMigrationsTable(transactionClient);
      const applied = await getAppliedMigrationNames(transactionClient);
      const lastApplied = applied[applied.length - 1];
      if (!lastApplied) {
        return null;
      }

      const migration = byName.get(lastApplied);
      if (!migration) {
        throw new Error(`No se encontro el archivo de rollback para la migracion ${lastApplied}.`);
      }

      const downSql = await fs.readFile(migration.downPath, "utf8");
      await transactionClient.query(downSql);
      await transactionClient.query(
        `DELETE FROM ${quoteIdentifier(getDatabaseConfig().migrationsTable)} WHERE name = $1`,
        [lastApplied]
      );
      return lastApplied;
    });
  });
}
