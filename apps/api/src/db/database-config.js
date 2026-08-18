import path from "node:path";
import { fileURLToPath } from "node:url";
import { runtimeEnvironment } from "../lib/runtime-environment.js";
import { readSecretFromEnvironment } from "../lib/secret-file.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../..");

function normalizeBool(value, fallback = false) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(normalized);
}

function normalizeInt(value, fallback, { name, min, max }) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return fallback;
  }
  if (!/^(0|[1-9][0-9]*)$/.test(raw)) {
    throw new Error(`${name} debe ser un entero entre ${min} y ${max}.`);
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} debe estar entre ${min} y ${max}.`);
  }
  return parsed;
}

export function getStorageDriver() {
  return String(process.env.STORAGE_DRIVER || "json").trim().toLowerCase() || "json";
}

export function getDatabaseConfig() {
  const sslEnabled = normalizeBool(process.env.DB_SSL, false);

  return {
    driver: getStorageDriver(),
    environment: runtimeEnvironment.nodeEnv,
    autoInit: normalizeBool(process.env.DB_AUTO_INIT, false),
    migrationsTable: String(process.env.DB_MIGRATIONS_TABLE || "schema_migrations").trim() || "schema_migrations",
    connectionString: String(process.env.DATABASE_URL || "").trim(),
    host: String(process.env.DB_HOST || "127.0.0.1").trim(),
    port: normalizeInt(process.env.DB_PORT, 5432, { name: "DB_PORT", min: 1, max: 65535 }),
    database: String(process.env.DB_NAME || "gestorconta").trim(),
    user: String(process.env.DB_USER || "postgres").trim(),
    password: readSecretFromEnvironment(process.env, "DB_PASSWORD"),
    ssl: sslEnabled ? { rejectUnauthorized: normalizeBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, false) } : false,
    poolMax: normalizeInt(process.env.DB_POOL_MAX, 10, { name: "DB_POOL_MAX", min: 1, max: 100 }),
    poolIdleMs: normalizeInt(process.env.DB_POOL_IDLE_MS, 10000, {
      name: "DB_POOL_IDLE_MS",
      min: 0,
      max: 600000
    }),
    poolConnectionTimeoutMs: normalizeInt(process.env.DB_POOL_CONNECTION_TIMEOUT_MS, 10000, {
      name: "DB_POOL_CONNECTION_TIMEOUT_MS",
      min: 100,
      max: 120000
    }),
    statementTimeoutMs: normalizeInt(process.env.DB_STATEMENT_TIMEOUT_MS, 30000, {
      name: "DB_STATEMENT_TIMEOUT_MS",
      min: 100,
      max: 600000
    }),
    transactionTimeoutMs: normalizeInt(process.env.DB_TRANSACTION_TIMEOUT_MS, 30000, {
      name: "DB_TRANSACTION_TIMEOUT_MS",
      min: 100,
      max: 600000
    }),
    migrationLockTimeoutMs: normalizeInt(process.env.DB_MIGRATION_LOCK_TIMEOUT_MS, 60000, {
      name: "DB_MIGRATION_LOCK_TIMEOUT_MS",
      min: 100,
      max: 600000
    }),
    projectRoot,
    migrationsDir: path.join(projectRoot, "apps", "api", "src", "db", "migrations")
  };
}

export function assertDatabaseDriverEnabled() {
  if (getStorageDriver() !== "database") {
    throw new Error("El driver actual no es database. Define STORAGE_DRIVER=database para usar PostgreSQL.");
  }
}
