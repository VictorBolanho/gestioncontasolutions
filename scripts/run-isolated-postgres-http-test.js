import crypto from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { Client } from "pg";

const image = "postgres:18-alpine";
const suffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
const containerName = `gestorconta-temp-test-postgres-${suffix}`;
const volumeName = `gestorconta-temp-test-pgdata-${suffix}`;
const databaseName = "gestorconta_temp_test";
const databaseUser = "gestorconta_temp_user";
const databasePassword = `gestorconta-temp-password-${crypto.randomBytes(12).toString("hex")}`;
const resourceLabel = "com.gestorconta.purpose=temporary-isolated-postgres-test";
let containerCreated = false;
let volumeCreated = false;

if (String(process.env.DATABASE_URL || "").trim()) {
  throw new Error("Esta prueba rechaza DATABASE_URL heredada; crea y usa exclusivamente su propia base temporal.");
}
if (String(process.env.NODE_ENV || "").trim() && String(process.env.NODE_ENV).trim().toLowerCase() !== "test") {
  throw new Error("NODE_ENV heredado no es test.");
}
if (String(process.env.STORAGE_DRIVER || "").trim() && String(process.env.STORAGE_DRIVER).trim() !== "database") {
  throw new Error("STORAGE_DRIVER heredado no es database.");
}

function run(command, args, { env, capture = false, allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: env || process.env,
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      shell: false
    });
    let stdout = "";
    let stderr = "";
    if (capture) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
    }
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0 || allowFailure) {
        resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
      } else {
        reject(new Error(`${command} ${args.join(" ")} termino con codigo ${code}: ${stderr.trim()}`));
      }
    });
  });
}

async function waitForHealthy() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = await run(
      "docker",
      ["inspect", "--format", "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}", containerName],
      { capture: true }
    );
    if (result.stdout === "healthy") {
      console.log("[ok] PostgreSQL temporal esta saludable.");
      return;
    }
    if (result.stdout === "unhealthy" || result.stdout === "exited" || result.stdout === "dead") {
      throw new Error(`El contenedor temporal quedo en estado ${result.stdout}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("PostgreSQL temporal no quedo saludable dentro del plazo.");
}

async function readExpectedCounts() {
  const [users, calendars] = await Promise.all([
    fs.readFile("apps/api/data/users.json", "utf8").then(JSON.parse),
    fs.readFile("apps/api/data/fiscal-calendars.json", "utf8").then(JSON.parse)
  ]);
  if (!Array.isArray(users) || !Array.isArray(calendars)) {
    throw new Error("Los origenes JSON de usuarios o calendarios no son arreglos.");
  }
  return { users: users.length, calendars: calendars.length };
}

async function verifyImportedCounts(databaseUrl, expected) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const users = Number((await client.query("SELECT COUNT(*) AS count FROM users")).rows[0].count);
    const calendars = Number(
      (await client.query("SELECT COUNT(*) AS count FROM fiscal_calendars")).rows[0].count
    );
    if (users !== expected.users || calendars !== expected.calendars) {
      throw new Error(
        `Conteos importados incorrectos: users ${users}/${expected.users}, fiscal_calendars ${calendars}/${expected.calendars}.`
      );
    }
    console.log(`IMPORTED_COUNTS=${JSON.stringify({ users, fiscalCalendars: calendars })}`);
  } finally {
    await client.end();
  }
}

async function cleanup() {
  if (containerCreated) {
    await run("docker", ["rm", "-f", containerName], { allowFailure: true });
  }
  if (volumeCreated) {
    await run("docker", ["volume", "rm", "-f", volumeName], { allowFailure: true });
  }
  const [container, volume] = await Promise.all([
    run("docker", ["container", "inspect", containerName], { capture: true, allowFailure: true }),
    run("docker", ["volume", "inspect", volumeName], { capture: true, allowFailure: true })
  ]);
  if (container.code === 0 || volume.code === 0) {
    throw new Error("No se pudo confirmar la eliminacion del contenedor o volumen temporal.");
  }
  console.log("[ok] Contenedor y volumen temporales eliminados.");
}

async function main() {
  const expected = await readExpectedCounts();
  let primaryError;
  try {
    await run("docker", ["volume", "create", "--label", resourceLabel, volumeName]);
    volumeCreated = true;
    await run("docker", [
      "run",
      "--detach",
      "--name",
      containerName,
      "--label",
      resourceLabel,
      "--mount",
      `type=volume,source=${volumeName},target=/var/lib/postgresql`,
      "--env",
      `POSTGRES_DB=${databaseName}`,
      "--env",
      `POSTGRES_USER=${databaseUser}`,
      "--env",
      `POSTGRES_PASSWORD=${databasePassword}`,
      "--publish",
      "127.0.0.1::5432",
      "--health-cmd",
      `pg_isready -U ${databaseUser} -d ${databaseName}`,
      "--health-interval",
      "1s",
      "--health-timeout",
      "3s",
      "--health-retries",
      "30",
      image
    ]);
    containerCreated = true;
    await waitForHealthy();
    const portResult = await run("docker", ["port", containerName, "5432/tcp"], { capture: true });
    const match = portResult.stdout.match(/127\.0\.0\.1:(\d+)$/);
    if (!match) {
      throw new Error(`No se pudo determinar un puerto local exclusivo: ${portResult.stdout}`);
    }
    const databaseUrl =
      `postgresql://${encodeURIComponent(databaseUser)}:${encodeURIComponent(databasePassword)}` +
      `@127.0.0.1:${match[1]}/${databaseName}`;
    const testEnv = {
      ...process.env,
      NODE_ENV: "test",
      STORAGE_DRIVER: "database",
      DATABASE_URL: databaseUrl,
      TEST_DATABASE_URL: databaseUrl,
      GESTORCONTA_TEMP_DATABASE_URL: databaseUrl,
      EXPECTED_IMPORTED_CALENDAR_COUNT: String(expected.calendars)
    };

    await run(process.execPath, ["scripts/db-migrate.js"], { env: testEnv });
    await run(process.execPath, ["scripts/db-migrate-json.js"], { env: testEnv });
    await verifyImportedCounts(databaseUrl, expected);
    await run(process.execPath, ["scripts/postgres-calendar-migration-test.js"], {
      env: { ...testEnv, GESTORCONTA_ALLOW_TEST_DATABASE: "isolated-schema" }
    });
    await run(process.execPath, ["scripts/postgres-full-reconciliation-test.js"], {
      env: { ...testEnv, GESTORCONTA_ALLOW_TEST_DATABASE: "full-reconciliation" }
    });
    await run(process.execPath, ["scripts/run-database-http-integration.js"], { env: testEnv });
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    try {
      await cleanup();
    } catch (cleanupError) {
      if (primaryError) {
        console.error(`[fail] Limpieza adicional: ${cleanupError.message}`);
        process.exitCode = 1;
      } else {
        throw cleanupError;
      }
    }
  }
}

main().catch((error) => {
  console.error(`[fail] ${error.message}`);
  process.exitCode = 1;
});
