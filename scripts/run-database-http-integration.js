import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { TEST_USERS } from "./test-credentials.js";

const port = Number(process.env.PORT || 46123);
const apiBaseUrl = `http://127.0.0.1:${port}`;

if (String(process.env.NODE_ENV || "").trim().toLowerCase() !== "test") {
  throw new Error("Define NODE_ENV=test para ejecutar la integracion HTTP.");
}
if (String(process.env.STORAGE_DRIVER || "").trim() !== "database") {
  throw new Error("Define STORAGE_DRIVER=database para ejecutar la integracion HTTP.");
}
if (!String(process.env.DATABASE_URL || "").trim()) {
  throw new Error("Define DATABASE_URL hacia una base temporal.");
}
if (process.env.DATABASE_URL !== process.env.GESTORCONTA_TEMP_DATABASE_URL) {
  throw new Error("DATABASE_URL no coincide con la base temporal creada por el orquestador.");
}

function waitForExit(child) {
  return new Promise((resolve) => child.once("exit", resolve));
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) {
    return;
  }
  const exited = waitForExit(child);
  child.kill();
  await Promise.race([
    exited,
    new Promise((resolve) =>
      setTimeout(() => {
        if (child.exitCode === null) {
          child.kill("SIGKILL");
        }
        resolve();
      }, 3000)
    )
  ]);
}

async function waitForApi(child) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`La API termino antes de iniciar (codigo ${child.exitCode}).`);
    }
    try {
      const response = await fetch(`${apiBaseUrl}/health`, { signal: AbortSignal.timeout(750) });
      if (response.ok) {
        return;
      }
    } catch {
      // La API continua iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("La API no quedo disponible.");
}

function runHarness(stateFile) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/database-http-integration-test.js"], {
      cwd: process.cwd(),
      env: { ...process.env, API_BASE_URL: apiBaseUrl, INTEGRATION_STATE_FILE: stateFile },
      stdio: "inherit",
      shell: false
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`El harness HTTP termino con codigo ${code}.`));
      }
    });
  });
}

async function verifyPersistence(state) {
  const loginResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_USERS.owner.email, password: TEST_USERS.owner.password })
  });
  assert.equal(loginResponse.status, 200, "No fue posible autenticar tras reiniciar la API.");
  const { token } = await loginResponse.json();
  const headers = { Authorization: `Bearer ${token}` };
  for (const [label, pathname] of [
    ["empresa", `/api/companies/${state.companyId}`],
    ["calendario", `/api/fiscal-calendars/${state.calendarId}`]
  ]) {
    const response = await fetch(`${apiBaseUrl}${pathname}`, { headers });
    assert.equal(response.status, 200, `${label} no persistio tras reiniciar la API.`);
  }
  const tasksResponse = await fetch(`${apiBaseUrl}/api/tasks`, { headers });
  assert.equal(tasksResponse.status, 200);
  const tasks = await tasksResponse.json();
  assert.ok(tasks.items.some((item) => item.id === state.taskId), "La tarea no persistio tras reiniciar la API.");
  console.log("[ok] Persistencia confirmada tras reinicio: empresa, calendario y tarea.");
}

async function main() {
  const stateFile = path.join(os.tmpdir(), `gestorconta-http-state-${process.pid}-${Date.now()}.json`);
  const apiEnv = { ...process.env, PORT: String(port) };
  let api;

  try {
    api = spawn(process.execPath, ["apps/api/src/server.js"], {
      cwd: process.cwd(),
      env: apiEnv,
      stdio: "inherit",
      shell: false
    });
    await waitForApi(api);
    console.log(`[ok] API database temporal disponible en ${apiBaseUrl}.`);
    await runHarness(stateFile);
    await stopChild(api);
    api = spawn(process.execPath, ["apps/api/src/server.js"], {
      cwd: process.cwd(),
      env: apiEnv,
      stdio: "inherit",
      shell: false
    });
    await waitForApi(api);
    await verifyPersistence(JSON.parse(await fs.readFile(stateFile, "utf8")));
  } finally {
    await stopChild(api);
    await fs.rm(stateFile, { force: true });
    console.log("[ok] API database temporal detenida.");
  }
}

main().catch((error) => {
  console.error(`[fail] ${error.message}`);
  process.exit(1);
});
