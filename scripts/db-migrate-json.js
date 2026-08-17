import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COLLECTION_ORDER } from "../apps/api/src/db/entity-definitions.js";
import { saveCollectionToDatabase } from "../apps/api/src/db/database-storage.js";
import { validateMigrationData } from "../apps/api/src/db/migration-validation.js";
import { closePgPool } from "../apps/api/src/db/postgres-client.js";
import { resolveConfiguredDataDirectory } from "../apps/api/src/lib/data-directory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = resolveConfiguredDataDirectory(path.join(__dirname, "..", "apps", "api", "data"));

const fileMap = Object.freeze({
  organization: "organization.json",
  companies: "companies.json",
  documents: "documents.json",
  extractions: "extractions.json",
  audits: "audits.json",
  taxes: "taxes.json",
  taxRules: "tax-rules.json",
  inferredTaxRules: "inferred-tax-rules.json",
  companyObligations: "company-obligations.json",
  fiscalCalendars: "fiscal-calendars.json",
  fiscalCalendarVersions: "fiscal-calendar-versions.json",
  fiscalTasks: "fiscal-tasks.json",
  internalAlerts: "internal-alerts.json",
  users: "users.json",
  sessions: "sessions.json"
});

function countEntries(value) {
  return Array.isArray(value) ? value.length : value && typeof value === "object" ? 1 : 0;
}

async function readSourceData() {
  const result = {};
  for (const collectionName of COLLECTION_ORDER) {
    const fileName = fileMap[collectionName];
    const raw = await fs.readFile(path.join(dataDir, fileName), "utf8");
    result[collectionName] = JSON.parse(raw);
  }
  return result;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const sourceData = await readSourceData();
  const { data, issues } = validateMigrationData(sourceData);
  const beforeCounts = Object.fromEntries(COLLECTION_ORDER.map((name) => [name, countEntries(data[name])]));

  console.log("[ok] Validacion de estructura JSON completada.");
  console.log(JSON.stringify({ beforeCounts, issues }, null, 2));

  if (issues.length > 0) {
    throw new Error(`Se detectaron ${issues.length} incidencias de integridad en el origen JSON.`);
  }

  if (dryRun) {
    console.log("[ok] Dry-run completado sin escribir en PostgreSQL.");
    return;
  }

  for (const collectionName of COLLECTION_ORDER) {
    try {
      await saveCollectionToDatabase(collectionName, data[collectionName]);
    } catch (error) {
      throw new Error(`No se pudo importar la coleccion ${collectionName}.`, { cause: error });
    }
  }

  const afterCounts = beforeCounts;
  console.log("[ok] Migracion JSON -> PostgreSQL completada.");
  console.log(JSON.stringify({ beforeCounts, afterCounts }, null, 2));
}

main()
  .catch((error) => {
    console.error(`[fail] ${error.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await closePgPool();
  });
