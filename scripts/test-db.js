import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { resolveConfiguredDataDirectory } from "../apps/api/src/lib/data-directory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const migrationsDir = path.join(projectRoot, "apps", "api", "src", "db", "migrations");
const dataDir = resolveConfiguredDataDirectory(path.join(projectRoot, "apps", "api", "data"));

function pass(message) {
  console.log(`[ok] ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function runNodeScript(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: projectRoot,
      stdio: "pipe",
      shell: false
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${args.join(" ")} fallo con codigo ${code}.\n${stdout}${stderr}`.trim()));
    });
  });
}

async function main() {
  const entries = await fs.readdir(migrationsDir);
  const upMigrations = entries.filter((entry) => entry.endsWith(".up.sql")).sort();

  if (upMigrations.length === 0) {
    fail("No existen migraciones SQL para PostgreSQL.");
  }
  pass("Existen migraciones versionadas");

  for (const upMigration of upMigrations) {
    const downMigration = upMigration.replace(/\.up\.sql$/i, ".down.sql");
    if (!entries.includes(downMigration)) {
      fail(`Falta rollback para ${upMigration}.`);
    }
  }
  pass("Cada migracion tiene rollback");

  const envExamplePath = path.join(projectRoot, ".env.example");
  const envExample = await fs.readFile(envExamplePath, "utf8");
  if (!envExample.includes("STORAGE_DRIVER=") || !envExample.includes("DATABASE_URL=")) {
    fail(".env.example no documenta variables esenciales de base de datos.");
  }
  pass(".env.example documenta el driver y la conexion");

  const jsonFiles = [
    "companies.json",
    "users.json",
    "fiscal-calendars.json",
    "fiscal-tasks.json",
    "internal-alerts.json"
  ];

  const counts = {};
  for (const fileName of jsonFiles) {
    const raw = await fs.readFile(path.join(dataDir, fileName), "utf8");
    const parsed = JSON.parse(raw);
    counts[fileName] = Array.isArray(parsed) ? parsed.length : 1;
  }

  if (!Number.isFinite(counts["fiscal-calendars.json"]) || counts["fiscal-calendars.json"] <= 0) {
    fail("Las semillas JSON no estan disponibles para migracion.");
  }
  pass("Las semillas JSON base siguen disponibles");

  const dryRunResult = await runNodeScript(["scripts/db-migrate-json.js", "--dry-run"]);
  if (!dryRunResult.stdout.includes("Dry-run completado sin escribir en PostgreSQL.")) {
    fail("La simulacion de migracion JSON no reporto finalizacion correcta.");
  }
  pass("La simulacion de migracion JSON funciona en dry-run");

  console.log("[done] Validacion base de Fase 8 completada.");
}

main().catch((error) => {
  console.error(`[fail] ${error.message}`);
  process.exit(1);
});
