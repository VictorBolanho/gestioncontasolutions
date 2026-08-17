import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getStorageDriver } from "../db/database-config.js";
import { checkMigrationReadiness } from "../db/migrations.js";
import {
  closePgPool,
  withPgClient,
  withPgTransaction
} from "../db/postgres-client.js";
import { resolveConfiguredDataDirectory } from "./data-directory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDataDir = path.resolve(__dirname, "../../data");

export function createStorageProvider({
  driver = getStorageDriver(),
  dataDir = resolveConfiguredDataDirectory(defaultDataDir),
  database = { closePgPool, withPgClient, withPgTransaction }
} = {}) {
  if (!["json", "database"].includes(driver)) {
    throw new Error(`STORAGE_DRIVER no soportado: ${driver || "<vacio>"}.`);
  }

  let state = "created";
  let closePromise;

  async function start() {
    if (state === "started") {
      return;
    }
    if (state !== "created") {
      throw new Error("El proveedor de almacenamiento no puede iniciarse en su estado actual.");
    }
    if (driver === "json") {
      await fs.access(dataDir, fsConstants.R_OK | fsConstants.W_OK);
    }
    state = "started";
  }

  async function readiness() {
    if (state !== "started") {
      return { ready: false };
    }
    try {
      if (driver === "json") {
        await fs.access(dataDir, fsConstants.R_OK | fsConstants.W_OK);
        return { ready: true };
      }
      return await database.withPgClient(async (client) => {
        await client.query("SELECT 1");
        const migrations = await checkMigrationReadiness(client);
        return { ready: migrations.ready };
      });
    } catch {
      return { ready: false };
    }
  }

  async function transaction(callback, options) {
    if (driver !== "database") {
      throw new Error("El driver JSON no ofrece transacciones.");
    }
    if (state !== "started") {
      throw new Error("El proveedor de almacenamiento no esta disponible.");
    }
    return database.withPgTransaction(callback, options);
  }

  async function close() {
    if (closePromise) {
      return closePromise;
    }
    state = "closing";
    closePromise = (async () => {
      try {
        if (driver === "database") {
          await database.closePgPool();
        }
      } finally {
        state = "closed";
      }
    })();
    return closePromise;
  }

  return Object.freeze({
    driver,
    supportsTransactions: driver === "database",
    start,
    readiness,
    transaction,
    close,
    get state() {
      return state;
    }
  });
}
