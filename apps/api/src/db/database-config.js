import path from "node:path";
import { fileURLToPath } from "node:url";

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

function normalizeInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getStorageDriver() {
  return String(process.env.STORAGE_DRIVER || "json").trim().toLowerCase() || "json";
}

export function getDatabaseConfig() {
  const sslEnabled = normalizeBool(process.env.DB_SSL, false);

  return {
    driver: getStorageDriver(),
    autoInit: normalizeBool(process.env.DB_AUTO_INIT, false),
    migrationsTable: String(process.env.DB_MIGRATIONS_TABLE || "schema_migrations").trim() || "schema_migrations",
    connectionString: String(process.env.DATABASE_URL || "").trim(),
    host: String(process.env.DB_HOST || "127.0.0.1").trim(),
    port: normalizeInt(process.env.DB_PORT, 5432),
    database: String(process.env.DB_NAME || "gestorconta").trim(),
    user: String(process.env.DB_USER || "postgres").trim(),
    password: String(process.env.DB_PASSWORD || "").trim(),
    ssl: sslEnabled ? { rejectUnauthorized: normalizeBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, false) } : false,
    poolMax: normalizeInt(process.env.DB_POOL_MAX, 10),
    poolIdleMs: normalizeInt(process.env.DB_POOL_IDLE_MS, 10000),
    poolConnectionTimeoutMs: normalizeInt(process.env.DB_POOL_CONNECTION_TIMEOUT_MS, 10000),
    projectRoot,
    migrationsDir: path.join(projectRoot, "apps", "api", "src", "db", "migrations")
  };
}

export function assertDatabaseDriverEnabled() {
  if (getStorageDriver() !== "database") {
    throw new Error("El driver actual no es database. Define STORAGE_DRIVER=database para usar PostgreSQL.");
  }
}
