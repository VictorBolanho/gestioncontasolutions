import crypto from "node:crypto";
import { Pool } from "pg";
import { getDatabaseConfig } from "./database-config.js";

const ISOLATION_LEVELS = new Set([
  "READ COMMITTED",
  "REPEATABLE READ",
  "SERIALIZABLE"
]);
const RETRYABLE_TRANSACTION_CODES = new Set(["40001", "40P01"]);
const CONNECTION_FAILURE_CODES = new Set(["08003", "08006", "57P01", "57P02", "57P03"]);
const SAFE_ERROR_MESSAGES = Object.freeze({
  "40001": "La transaccion encontro un conflicto de concurrencia.",
  "40P01": "La transaccion no pudo completarse por un conflicto de bloqueos.",
  "55P03": "No fue posible obtener un bloqueo dentro del tiempo permitido.",
  "57014": "La operacion de base de datos excedio el tiempo permitido.",
  "57P01": "La conexion con la base de datos se interrumpio."
});

export class PostgresOperationError extends Error {
  constructor(message, { code = "", retryable = false, cause } = {}) {
    super(message, { cause });
    this.name = "PostgresOperationError";
    this.code = String(code || "");
    this.retryable = Boolean(retryable);
  }
}

function isPostgresError(error) {
  return /^[0-9A-Z]{5}$/.test(String(error?.code || ""));
}

export function normalizePostgresError(error, fallbackMessage = "No se pudo completar la operacion de base de datos.") {
  if (error instanceof PostgresOperationError) {
    return error;
  }
  if (!isPostgresError(error)) {
    return error;
  }
  const code = String(error.code);
  return new PostgresOperationError(SAFE_ERROR_MESSAGES[code] || fallbackMessage, {
    code,
    retryable: RETRYABLE_TRANSACTION_CODES.has(code),
    cause: error
  });
}

function buildPoolOptions(config) {
  const shared = {
    ssl: config.ssl,
    max: config.poolMax,
    idleTimeoutMillis: config.poolIdleMs,
    connectionTimeoutMillis: config.poolConnectionTimeoutMs,
    statement_timeout: config.statementTimeoutMs
  };
  if (config.connectionString) {
    return { ...shared, connectionString: config.connectionString };
  }
  return {
    ...shared,
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password
  };
}

function safePoolErrorLog(logger, error) {
  logger(
    JSON.stringify({
      event: "postgres_pool_error",
      code: String(error?.code || "unknown").slice(0, 20),
      category: "database_connection"
    })
  );
}

function configurationFingerprint(config) {
  const safeShape = {
    connection: config.connectionString
      ? crypto.createHash("sha256").update(config.connectionString).digest("hex")
      : [config.host, config.port, config.database, config.user],
    ssl: config.ssl,
    poolMax: config.poolMax,
    poolIdleMs: config.poolIdleMs,
    poolConnectionTimeoutMs: config.poolConnectionTimeoutMs,
    statementTimeoutMs: config.statementTimeoutMs
  };
  return crypto.createHash("sha256").update(JSON.stringify(safeShape)).digest("hex");
}

function validateTransactionOptions(options, config) {
  const isolationLevel = String(options.isolationLevel || "READ COMMITTED").trim().toUpperCase();
  if (!ISOLATION_LEVELS.has(isolationLevel)) {
    throw new Error(`Nivel de aislamiento no soportado: ${isolationLevel || "<vacio>"}.`);
  }
  const timeoutMs = options.timeoutMs ?? config.transactionTimeoutMs;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 600000) {
    throw new Error("El timeout transaccional debe estar entre 100 y 600000 ms.");
  }
  const maxAttempts = options.maxAttempts ?? 1;
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 5) {
    throw new Error("maxAttempts debe estar entre 1 y 5.");
  }
  if (maxAttempts > 1 && options.idempotent !== true) {
    throw new Error("Los reintentos requieren marcar la operacion como idempotente.");
  }
  return { isolationLevel, timeoutMs, maxAttempts, idempotent: options.idempotent === true };
}

async function rollbackPreservingOriginal(client, originalError, logger) {
  try {
    await client.query("ROLLBACK");
  } catch (rollbackError) {
    safePoolErrorLog(logger, rollbackError);
    Object.defineProperty(originalError, "rollbackError", {
      value: normalizePostgresError(rollbackError, "El rollback de base de datos fallo."),
      enumerable: false,
      configurable: true
    });
  }
}

export function createPostgresClientManager({
  configProvider = getDatabaseConfig,
  PoolClass = Pool,
  logger = console.error
} = {}) {
  let pool;
  let config;
  let fingerprint = "";
  let state = "open";
  let closePromise;

  function assertOpen() {
    if (state !== "open") {
      throw new PostgresOperationError("El pool PostgreSQL se esta cerrando o ya fue cerrado.", {
        code: "POOL_CLOSED"
      });
    }
  }

  function getPool() {
    assertOpen();
    if (!pool) {
      config = configProvider();
      fingerprint = configurationFingerprint(config);
      const created = new PoolClass(buildPoolOptions(config));
      created.on("error", (error) => safePoolErrorLog(logger, error));
      pool = created;
    }
    return pool;
  }

  function getConfig() {
    if (!config) {
      getPool();
    }
    return config;
  }

  async function withClient(callback) {
    assertOpen();
    let client;
    try {
      client = await getPool().connect();
    } catch (error) {
      throw normalizePostgresError(error, "No fue posible obtener una conexion PostgreSQL.");
    }
    let releaseError;
    try {
      return await callback(client);
    } catch (error) {
      const normalized = normalizePostgresError(error);
      if (CONNECTION_FAILURE_CODES.has(String(normalized?.code || ""))) {
        releaseError = error;
      }
      throw normalized;
    } finally {
      // pg retira del pool los clientes cuya conexion ya no es reutilizable.
      client.release(releaseError);
    }
  }

  async function runTransaction(client, callback, options = {}) {
    const validated = validateTransactionOptions(options, getConfig());
    await client.query("BEGIN");
    try {
      await client.query(`SET TRANSACTION ISOLATION LEVEL ${validated.isolationLevel}`);
      await client.query("SELECT set_config('statement_timeout', $1, true)", [
        String(validated.timeoutMs)
      ]);
      await client.query("SELECT set_config('idle_in_transaction_session_timeout', $1, true)", [
        String(validated.timeoutMs)
      ]);
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await rollbackPreservingOriginal(client, error, logger);
      throw normalizePostgresError(error);
    }
  }

  async function withTransaction(callback, options = {}) {
    const validated = validateTransactionOptions(options, getConfig());
    let attempt = 0;
    while (attempt < validated.maxAttempts) {
      attempt += 1;
      try {
        return await withClient((client) => runTransaction(client, callback, validated));
      } catch (error) {
        const normalized = normalizePostgresError(error);
        const canRetry =
          validated.idempotent &&
          attempt < validated.maxAttempts &&
          RETRYABLE_TRANSACTION_CODES.has(String(normalized?.code || ""));
        if (!canRetry) {
          throw normalized;
        }
        await new Promise((resolve) => setTimeout(resolve, 10 * attempt));
      }
    }
    throw new PostgresOperationError("La transaccion no pudo completarse.");
  }

  async function healthCheck() {
    assertOpen();
    const startedAt = Date.now();
    try {
      await withClient((client) => client.query("SELECT 1"));
    } catch (error) {
      if (!CONNECTION_FAILURE_CODES.has(String(error?.code || ""))) {
        throw error;
      }
      await withClient((client) => client.query("SELECT 1"));
    }
    return { ok: true, latencyMs: Date.now() - startedAt };
  }

  function metrics() {
    if (!pool) {
      return { total: 0, idle: 0, waiting: 0, state, configuration: "" };
    }
    return {
      total: Number(pool.totalCount || 0),
      idle: Number(pool.idleCount || 0),
      waiting: Number(pool.waitingCount || 0),
      state,
      configuration: fingerprint
    };
  }

  async function close() {
    if (closePromise) {
      return closePromise;
    }
    state = "closing";
    closePromise = (async () => {
      const activePool = pool;
      try {
        if (activePool) {
          await activePool.end();
        }
      } finally {
        state = "closed";
      }
    })();
    return closePromise;
  }

  return Object.freeze({
    getPool,
    withClient,
    runTransaction,
    withTransaction,
    healthCheck,
    metrics,
    close,
    get state() {
      return state;
    }
  });
}

const defaultManager = createPostgresClientManager();

export function getPgPool() {
  return defaultManager.getPool();
}

export function getPgPoolMetrics() {
  return defaultManager.metrics();
}

export function healthCheckPgPool() {
  return defaultManager.healthCheck();
}

export function closePgPool() {
  return defaultManager.close();
}

export function withPgClient(fn) {
  return defaultManager.withClient(fn);
}

export function runPgTransaction(client, fn, options = {}) {
  return defaultManager.runTransaction(client, fn, options);
}

export function withPgTransaction(fn, options = {}) {
  return defaultManager.withTransaction(fn, options);
}
