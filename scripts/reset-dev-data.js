import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultAudits,
  defaultCompanyObligations,
  defaultCompanies,
  defaultDocuments,
  defaultExtractions,
  defaultFiscalCalendars,
  defaultFiscalCalendarVersions,
  defaultFiscalTasks,
  defaultInferredTaxRules,
  defaultInternalAlerts,
  defaultOrganization,
  defaultSessions,
  defaultTaxRules,
  defaultTaxes,
  defaultUsers
} from "../apps/api/src/data/seed-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "apps", "api", "data");
const uploadsDir = path.join(dataDir, "uploads", "rut");

const files = {
  organization: path.join(dataDir, "organization.json"),
  companies: path.join(dataDir, "companies.json"),
  documents: path.join(dataDir, "documents.json"),
  extractions: path.join(dataDir, "extractions.json"),
  audits: path.join(dataDir, "audits.json"),
  taxes: path.join(dataDir, "taxes.json"),
  taxRules: path.join(dataDir, "tax-rules.json"),
  inferredTaxRules: path.join(dataDir, "inferred-tax-rules.json"),
  companyObligations: path.join(dataDir, "company-obligations.json"),
  fiscalCalendars: path.join(dataDir, "fiscal-calendars.json"),
  fiscalCalendarVersions: path.join(dataDir, "fiscal-calendar-versions.json"),
  fiscalTasks: path.join(dataDir, "fiscal-tasks.json"),
  internalAlerts: path.join(dataDir, "internal-alerts.json"),
  users: path.join(dataDir, "users.json"),
  sessions: path.join(dataDir, "sessions.json")
};

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function removeUploadFiles(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  return fs
    .readdirSync(directoryPath)
    .filter((entry) => entry !== ".gitkeep")
    .map((entry) => {
      const absolutePath = path.join(directoryPath, entry);
      const stats = fs.statSync(absolutePath);

      if (stats.isDirectory()) {
        fs.rmSync(absolutePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(absolutePath);
      }

      return entry;
    });
}

function buildResetUsers() {
  if (cleanMode) {
    const owner = defaultUsers[0];
    return [
      {
        ...owner,
        empresasAsignadas: [],
        supervisedUsers: [],
        supervisorId: ""
      }
    ];
  }

  if (keepDemoSeeds) {
    return defaultUsers;
  }

  return defaultUsers.map((user) => ({
    ...user,
    empresasAsignadas: []
  }));
}

const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";
const confirmed = process.argv.includes("--confirm");
const keepDemoSeeds = process.argv.includes("--keep-demo-seeds");
const cleanMode = process.argv.includes("--clean");

console.warn("");
console.warn("[reset-dev-data] Advertencia: este script limpiara datos locales de desarrollo.");
console.warn(
  "[reset-dev-data] Se reiniciaran empresas, documentos, extracciones, auditorias, obligaciones, tareas fiscales, usuarios, sesiones y PDFs en uploads/rut."
);
console.warn("[reset-dev-data] Por defecto dejara el ambiente limpio, sin empresas demo ni datos de prueba.");
if (cleanMode) {
  console.warn("[reset-dev-data] Modo clean: conservara solo el owner inicial y catalogos tecnicos.");
}
console.warn("");

if (isProduction) {
  console.error("[reset-dev-data] Cancelado: no se permite ejecutar este script con NODE_ENV=production.");
  process.exit(1);
}

if (!confirmed) {
  console.error("[reset-dev-data] Cancelado: ejecuta nuevamente con --confirm para continuar.");
  process.exit(1);
}

ensureDirectory(dataDir);
ensureDirectory(uploadsDir);

writeJson(files.organization, defaultOrganization);
writeJson(files.companies, keepDemoSeeds && !cleanMode ? defaultCompanies : []);
writeJson(files.documents, keepDemoSeeds && !cleanMode ? defaultDocuments : []);
writeJson(files.extractions, keepDemoSeeds && !cleanMode ? defaultExtractions : []);
writeJson(files.audits, keepDemoSeeds && !cleanMode ? defaultAudits : []);
writeJson(files.taxes, defaultTaxes);
writeJson(files.taxRules, defaultTaxRules);
writeJson(files.inferredTaxRules, defaultInferredTaxRules);
writeJson(files.companyObligations, keepDemoSeeds && !cleanMode ? defaultCompanyObligations : []);
writeJson(files.fiscalCalendars, cleanMode ? [] : defaultFiscalCalendars);
writeJson(files.fiscalCalendarVersions, keepDemoSeeds && !cleanMode ? defaultFiscalCalendarVersions : []);
writeJson(files.fiscalTasks, keepDemoSeeds && !cleanMode ? defaultFiscalTasks : []);
writeJson(files.internalAlerts, keepDemoSeeds && !cleanMode ? defaultInternalAlerts : []);
writeJson(files.users, buildResetUsers());
writeJson(files.sessions, defaultSessions);

const removedUploads = removeUploadFiles(uploadsDir);

console.log("[reset-dev-data] Datos locales reiniciados correctamente.");
console.log(`[reset-dev-data] Archivos eliminados de uploads/rut: ${removedUploads.length}`);
console.log("[reset-dev-data] organization.json se conservo con la semilla base.");
console.log("[reset-dev-data] taxes.json, tax-rules.json e inferred-tax-rules.json se conservaron como catalogos base.");
if (cleanMode) {
  console.log("[reset-dev-data] fiscal-calendars.json, companies.json, fiscal-tasks.json y company-obligations.json quedaron vacios.");
  console.log("[reset-dev-data] users.json conserva solo al owner demo inicial.");
} else {
  console.log("[reset-dev-data] fiscal-calendars.json se restauro con semillas base de prueba.");
  console.log("[reset-dev-data] users.json se restauro a usuarios semilla y sessions.json quedo vacio.");
}
if (keepDemoSeeds && !cleanMode) {
  console.log("[reset-dev-data] Se restauraron tambien las semillas demo base.");
}
