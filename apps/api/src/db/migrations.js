import fs from "node:fs/promises";
import path from "node:path";
import { getDatabaseConfig } from "./database-config.js";
import { withPgClient, withPgTransaction } from "./postgres-client.js";

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
  const files = await loadMigrationFiles();

  return withPgTransaction(async (client) => {
    await ensureMigrationsTable(client);
    const applied = new Set(await getAppliedMigrationNames(client));
    const tableName = quoteIdentifier(getDatabaseConfig().migrationsTable);
    const appliedNow = [];

    for (const file of files) {
      if (applied.has(file.name)) {
        continue;
      }

      const sql = await fs.readFile(file.upPath, "utf8");
      await client.query(sql);
      await client.query(`INSERT INTO ${tableName} (name) VALUES ($1)`, [file.name]);
      appliedNow.push(file.name);
    }

    return appliedNow;
  });
}

export async function rollbackLastMigration() {
  const files = await loadMigrationFiles();
  const byName = new Map(files.map((file) => [file.name, file]));

  return withPgTransaction(async (client) => {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrationNames(client);
    const lastApplied = applied[applied.length - 1];
    if (!lastApplied) {
      return null;
    }

    const migration = byName.get(lastApplied);
    if (!migration) {
      throw new Error(`No se encontro el archivo de rollback para la migracion ${lastApplied}.`);
    }

    const downSql = await fs.readFile(migration.downPath, "utf8");
    await client.query(downSql);
    await client.query(`DELETE FROM ${quoteIdentifier(getDatabaseConfig().migrationsTable)} WHERE name = $1`, [lastApplied]);
    return lastApplied;
  });
}
