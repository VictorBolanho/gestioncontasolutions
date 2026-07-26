import fs from "node:fs";
import path from "node:path";
import { COLLECTION_ORDER } from "../apps/api/src/db/entity-definitions.js";
import { exportCollectionsFromDatabase } from "../apps/api/src/db/database-storage.js";
import { validateMigrationData } from "../apps/api/src/db/migration-validation.js";
import { closePgPool, withPgClient } from "../apps/api/src/db/postgres-client.js";

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

function fail(message) {
  throw new Error(message);
}

function canonical(value) {
  if (Array.isArray(value)) {
    return value.map(canonical);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])])
    );
  }
  return value;
}

function keyOf(collectionName, item) {
  return collectionName === "sessions" ? String(item?.token || "") : String(item?.id || "");
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

async function readSourceData() {
  const raw = {};
  for (const collectionName of COLLECTION_ORDER) {
    raw[collectionName] = JSON.parse(
      fs.readFileSync(path.join("apps", "api", "data", fileMap[collectionName]), "utf8")
    );
  }
  return raw;
}

async function getTableCounts() {
  return withPgClient(async (client) => {
    const result = {};
    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    for (const { table_name: tableName } of rows) {
      const count = await client.query(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`);
      result[tableName] = Number(count.rows[0].count);
    }
    return result;
  });
}

async function main() {
  if (String(process.env.NODE_ENV || "").trim().toLowerCase() !== "test") {
    fail("Define NODE_ENV=test. La reconciliacion se niega a ejecutarse fuera de pruebas.");
  }
  if (!String(process.env.DATABASE_URL || "").trim()) {
    fail("Define DATABASE_URL con la base PostgreSQL temporal ya migrada.");
  }
  if (String(process.env.GESTORCONTA_ALLOW_TEST_DATABASE || "").trim() !== "full-reconciliation") {
    fail("Define GESTORCONTA_ALLOW_TEST_DATABASE=full-reconciliation.");
  }

  const sourceValidation = validateMigrationData(await readSourceData());
  const source = sourceValidation.data;
  const target = await exportCollectionsFromDatabase();
  const targetValidation = validateMigrationData(target);
  const differences = [];
  const collections = {};

  for (const collectionName of COLLECTION_ORDER) {
    const sourceItems = collectionName === "organization" ? [source[collectionName]] : source[collectionName];
    const targetItems = collectionName === "organization" ? [target[collectionName]] : target[collectionName];
    const sourceMap = new Map(sourceItems.map((item) => [keyOf(collectionName, item), item]));
    const targetMap = new Map(targetItems.map((item) => [keyOf(collectionName, item), item]));
    const missingIds = [...sourceMap.keys()].filter((id) => !targetMap.has(id));
    const extraIds = [...targetMap.keys()].filter((id) => !sourceMap.has(id));
    const changedRecords = [...sourceMap.keys()].filter(
      (id) =>
        targetMap.has(id) &&
        JSON.stringify(canonical(sourceMap.get(id))) !== JSON.stringify(canonical(targetMap.get(id)))
    );

    collections[collectionName] = {
      json: sourceItems.length,
      postgres: targetItems.length,
      missingIds: missingIds.length,
      extraIds: extraIds.length,
      changedRecords: changedRecords.length
    };
    if (
      sourceItems.length !== targetItems.length ||
      missingIds.length > 0 ||
      extraIds.length > 0 ||
      changedRecords.length > 0
    ) {
      differences.push(collectionName);
    }
  }

  const tableCounts = await getTableCounts();
  console.log(`COLLECTION_RECONCILIATION=${JSON.stringify(collections)}`);
  console.log(`TABLE_COUNTS=${JSON.stringify(tableCounts)}`);
  console.log(`SOURCE_RELATION_ISSUES=${sourceValidation.issues.length}`);
  console.log(`POSTGRES_RELATION_ISSUES=${targetValidation.issues.length}`);
  console.log(`COLLECTION_DIFFERENCES=${differences.length}`);

  if (sourceValidation.issues.length > 0 || targetValidation.issues.length > 0 || differences.length > 0) {
    fail(`La reconciliacion detecto diferencias en: ${differences.join(", ") || "relaciones"}.`);
  }
}

main()
  .catch((error) => {
    console.error(`[fail] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePgPool();
  });
