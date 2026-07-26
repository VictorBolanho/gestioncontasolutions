import { Pool } from "pg";
import { getDatabaseConfig } from "./database-config.js";

let pool;

function buildPoolOptions(config) {
  if (config.connectionString) {
    return {
      connectionString: config.connectionString,
      ssl: config.ssl,
      max: config.poolMax,
      idleTimeoutMillis: config.poolIdleMs,
      connectionTimeoutMillis: config.poolConnectionTimeoutMs
    };
  }

  return {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl,
    max: config.poolMax,
    idleTimeoutMillis: config.poolIdleMs,
    connectionTimeoutMillis: config.poolConnectionTimeoutMs
  };
}

export function getPgPool() {
  if (!pool) {
    pool = new Pool(buildPoolOptions(getDatabaseConfig()));
  }

  return pool;
}

export async function closePgPool() {
  if (pool) {
    const activePool = pool;
    pool = undefined;
    await activePool.end();
  }
}

export async function withPgClient(fn) {
  const client = await getPgPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withPgTransaction(fn) {
  return withPgClient(async (client) => {
    await client.query("BEGIN");
    try {
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}
