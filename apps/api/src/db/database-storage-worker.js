import fs from "node:fs";
import {
  ensureDatabaseStorage,
  exportCollectionsFromDatabase,
  getCollectionFromDatabase,
  saveCollectionToDatabase
} from "./database-storage.js";
import { closePgPool } from "./postgres-client.js";

async function readStdin() {
  return new Promise((resolve, reject) => {
    let buffer = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      buffer += chunk;
    });
    process.stdin.on("end", () => resolve(buffer));
    process.stdin.on("error", reject);
  });
}

function writePayload(payload) {
  process.stdout.write(JSON.stringify(payload));
}

async function main() {
  const operation = String(process.argv[2] || "").trim();
  const rawInput = await readStdin();
  const input = rawInput ? JSON.parse(rawInput) : {};

  if (operation === "ensureStorage") {
    await ensureDatabaseStorage();
    writePayload({ ok: true });
    return;
  }

  if (operation === "getCollection") {
    const result = await getCollectionFromDatabase(input.collectionName);
    writePayload({ ok: true, result });
    return;
  }

  if (operation === "saveCollection") {
    await saveCollectionToDatabase(input.collectionName, input.value);
    writePayload({ ok: true });
    return;
  }

  if (operation === "exportCollections") {
    const result = await exportCollectionsFromDatabase();
    writePayload({ ok: true, result });
    return;
  }

  throw new Error(`Operacion de worker no soportada: ${operation || "<vacia>"}`);
}

main()
  .catch((error) => {
    fs.writeSync(process.stderr.fd, JSON.stringify({
      ok: false,
      error: error.message,
      stack: error.stack
    }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePgPool();
  });
