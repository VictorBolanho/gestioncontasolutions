import crypto from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");
const operationalDataDir = path.join(projectRoot, "apps", "api", "data");
const expectedJsonFileCount = 15;
const isolatedDemoSeedPassword = crypto.randomBytes(32).toString("hex");

const commandsBeforeServices = [
  ["node", ["--test", "scripts/calendar-migration-test.js"]],
  ["node", ["--test", "scripts/auth-security-test.js"]],
  ["node", ["--test", "scripts/security-hardening-test.js"]],
  ["node", ["--test", "scripts/security-network-test.js"]],
  ["node", ["--test", "scripts/browser-session-security-test.js"]],
  ["node", ["--test", "scripts/web-deployment-security-test.js"]],
  ["node", ["--test", "scripts/async-postgres-infrastructure-test.js"]],
  ["node", ["--test", "scripts/seed-atomicity-test.js"]],
  ["node", ["scripts/db-migrate-json.js", "--dry-run"]],
  ["node", ["scripts/test-db.js"]],
  ["node", ["scripts/reset-dev-data.js", "--confirm", "--clean"]]
];

const commandsWithServices = [
  ["node", ["scripts/clean-onboarding-test.js"]],
  ["node", ["scripts/reset-dev-data.js", "--confirm", "--keep-demo-seeds"]],
  ["node", ["scripts/module-access-test.js"]],
  ["node", ["scripts/role-permissions-test.js"]],
  ["node", ["scripts/alerts-consistency-test.js"]],
  ["node", ["scripts/alerts-filters-permissions-test.js"]],
  ["node", ["scripts/alerts-phase6-closure-test.js"]],
  ["node", ["scripts/dashboard-phase7-test.js"]],
  ["node", ["scripts/smoke-test.js"]],
  ["node", ["scripts/browser-session-http-test.js"]]
];

function hashBuffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function listOperationalJsonFiles() {
  const entries = await fs.readdir(operationalDataDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  if (files.length !== expectedJsonFileCount) {
    throw new Error(
      `Se esperaban ${expectedJsonFileCount} JSON operativos y se encontraron ${files.length}. Pruebas canceladas.`
    );
  }
  return files;
}

async function hashOperationalJsonFiles(fileNames) {
  return new Map(
    await Promise.all(
      fileNames.map(async (fileName) => [
        fileName,
        hashBuffer(await fs.readFile(path.join(operationalDataDir, fileName)))
      ])
    )
  );
}

function countHashChanges(before, after) {
  let changes = 0;
  for (const [fileName, hash] of before) {
    if (after.get(fileName) !== hash) {
      changes += 1;
    }
  }
  return changes;
}

async function establishTemporaryStorage(fileNames) {
  const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), "gestorconta-tests-"));
  const dataDir = path.join(testRoot, "data");
  const uploadsDir = path.join(dataDir, "uploads", "rut");

  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    for (const fileName of fileNames) {
      await fs.copyFile(path.join(operationalDataDir, fileName), path.join(dataDir, fileName));
    }

    const probePath = path.join(dataDir, ".storage-probe");
    await fs.writeFile(probePath, "isolated-test-storage", { flag: "wx" });
    await fs.unlink(probePath);

    const copiedFiles = (await fs.readdir(dataDir))
      .filter((fileName) => fileName.endsWith(".json"))
      .sort();
    if (copiedFiles.length !== fileNames.length || copiedFiles.some((fileName, index) => fileName !== fileNames[index])) {
      throw new Error("La copia de fixtures JSON al almacenamiento temporal quedo incompleta.");
    }

    return { testRoot, dataDir };
  } catch (error) {
    await fs.rm(testRoot, { recursive: true, force: true }).catch(() => {});
    throw new Error(`No se pudo establecer el almacenamiento temporal: ${error.message}`);
  }
}

function runCommand(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env,
      stdio: "inherit",
      shell: false
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} fallo con codigo ${code ?? "sin codigo"}${signal ? ` (${signal})` : ""}.`));
    });
  });
}

async function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function startService(scriptPath, env) {
  const child = spawn(process.execPath, [scriptPath], {
    cwd: projectRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false
  });
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  return child;
}

async function waitForService(url, child, label) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`${label} termino antes de quedar disponible (codigo ${child.exitCode}).`);
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(750) });
      if (response.ok) {
        return;
      }
    } catch {
      // El servicio todavia esta iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${label} no quedo disponible en el tiempo esperado.`);
}

async function stopService(child) {
  if (!child || child.exitCode !== null) {
    return;
  }

  const exited = new Promise((resolve) => child.once("exit", resolve));
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

function buildTestEnvironment(testRoot, dataDir, apiPort, webPort) {
  const env = {
    ...process.env,
    NODE_ENV: "test",
    ALLOW_DEMO_SEEDS: "true",
    DEV_SEED_PASSWORD: isolatedDemoSeedPassword,
    STORAGE_DRIVER: "json",
    GESTORCONTA_TEST_ROOT: testRoot,
    GESTORCONTA_DATA_DIR: dataDir,
    GESTORCONTA_REQUIRE_TEMP_DATA_DIR: "1",
    API_BASE_URL: `http://127.0.0.1:${apiPort}`,
    WEB_BASE_URL: `http://127.0.0.1:${webPort}`,
    WEB_API_ORIGIN: `http://127.0.0.1:${apiPort}`,
    CORS_ALLOWED_ORIGINS: `http://127.0.0.1:${webPort}`,
    FRONTEND_CSP_CONNECT_SOURCES: `http://127.0.0.1:${apiPort}`
  };

  delete env.DATABASE_URL;
  delete env.TEST_DATABASE_URL;
  delete env.GESTORCONTA_ALLOW_TEST_DATABASE;
  return env;
}

async function main() {
  const fileNames = await listOperationalJsonFiles();
  const hashesBefore = await hashOperationalJsonFiles(fileNames);
  let temporaryStorage;
  let apiProcess;
  let webProcess;
  let failure;

  try {
    temporaryStorage = await establishTemporaryStorage(fileNames);
    const [apiPort, webPort] = await Promise.all([findAvailablePort(), findAvailablePort()]);
    const baseEnv = buildTestEnvironment(temporaryStorage.testRoot, temporaryStorage.dataDir, apiPort, webPort);

    for (const [command, args] of commandsBeforeServices) {
      await runCommand(command, args, baseEnv);
    }

    apiProcess = startService("apps/api/src/server.js", { ...baseEnv, PORT: String(apiPort) });
    webProcess = startService("apps/web/server.js", { ...baseEnv, PORT: String(webPort) });
    await Promise.all([
      waitForService(`${baseEnv.API_BASE_URL}/health`, apiProcess, "GestorConta API de prueba"),
      waitForService(baseEnv.WEB_BASE_URL, webProcess, "GestorConta Web de prueba")
    ]);

    for (const [command, args] of commandsWithServices) {
      await runCommand(command, args, baseEnv);
    }
  } catch (error) {
    failure = error;
  } finally {
    await Promise.all([stopService(apiProcess), stopService(webProcess)]);

    try {
      const hashesAfter = await hashOperationalJsonFiles(fileNames);
      const hashChanges = countHashChanges(hashesBefore, hashesAfter);
      console.log(`OPERATIONAL_JSON_HASH_CHANGES=${hashChanges}`);
      if (hashChanges !== 0) {
        throw new Error(`${hashChanges} JSON operativos cambiaron durante npm test.`);
      }
    } catch (error) {
      failure = failure ? new AggregateError([failure, error], "Fallaron pruebas y verificacion de integridad.") : error;
    }

    if (temporaryStorage?.testRoot) {
      try {
        await fs.rm(temporaryStorage.testRoot, { recursive: true, force: true });
        await fs.access(temporaryStorage.testRoot)
          .then(() => {
            throw new Error("El directorio temporal sigue existiendo despues de la limpieza.");
          })
          .catch((error) => {
            if (error?.code !== "ENOENT") {
              throw error;
            }
          });
        console.log("[ok] Directorio temporal de pruebas eliminado.");
      } catch (error) {
        failure = failure ? new AggregateError([failure, error], "Fallaron pruebas y limpieza temporal.") : error;
      }
    }
  }

  if (failure) {
    throw failure;
  }
  console.log("[done] Suite general completada con almacenamiento JSON aislado.");
}

main().catch((error) => {
  console.error(`[fail] ${error.message}`);
  process.exit(1);
});
