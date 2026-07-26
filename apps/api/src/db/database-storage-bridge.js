import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerPath = path.join(__dirname, "database-storage-worker.js");

function runWorker(operation, input = {}) {
  const result = spawnSync(process.execPath, [workerPath, operation], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: process.env,
    maxBuffer: 1024 * 1024 * 20
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    let parsed;
    try {
      parsed = JSON.parse(String(result.stderr || "{}"));
    } catch {
      parsed = { error: String(result.stderr || "Error desconocido del worker de base de datos.") };
    }
    throw new Error(parsed.error || "Error desconocido del worker de base de datos.");
  }

  const payload = JSON.parse(String(result.stdout || "{}"));
  return payload.result;
}

export function ensureDatabaseStorageSync() {
  runWorker("ensureStorage");
}

export function getCollectionFromDatabaseSync(collectionName) {
  return runWorker("getCollection", { collectionName });
}

export function saveCollectionToDatabaseSync(collectionName, value) {
  runWorker("saveCollection", { collectionName, value });
}

export function exportCollectionsFromDatabaseSync() {
  return runWorker("exportCollections");
}
