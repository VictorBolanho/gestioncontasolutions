import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultFiscalCalendars,
  defaultInternalAlerts,
  defaultTaxRules,
  defaultTaxes
} from "../apps/api/src/data/seed-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "apps", "api", "data");

const files = {
  audits: path.join(dataDir, "audits.json"),
  taxes: path.join(dataDir, "taxes.json"),
  taxRules: path.join(dataDir, "tax-rules.json"),
  companyObligations: path.join(dataDir, "company-obligations.json"),
  fiscalCalendars: path.join(dataDir, "fiscal-calendars.json"),
  fiscalCalendarVersions: path.join(dataDir, "fiscal-calendar-versions.json"),
  fiscalTasks: path.join(dataDir, "fiscal-tasks.json"),
  internalAlerts: path.join(dataDir, "internal-alerts.json")
};

const FISCAL_MODULES = new Set(["impuestos", "obligaciones_fiscales", "calendario_fiscal", "alertas"]);
const FISCAL_RESOURCE_TYPES = new Set([
  "impuesto",
  "obligacion_fiscal_empresa",
  "calendario_fiscal",
  "tarea_fiscal",
  "alerta"
]);

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function isFiscalAudit(audit) {
  return FISCAL_MODULES.has(String(audit?.modulo || "")) || FISCAL_RESOURCE_TYPES.has(String(audit?.recursoTipo || ""));
}

const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";
const confirmed = process.argv.includes("--confirm");
const keepCalendarSeeds = process.argv.includes("--keep-calendar-seeds");

console.warn("");
console.warn("[reset-fiscal-data] Advertencia: este script limpiara solo la parte fiscal de desarrollo.");
console.warn("[reset-fiscal-data] Se reiniciaran impuestos, reglas, obligaciones, calendarios, versiones, tareas fiscales y auditorias fiscales.");
console.warn("[reset-fiscal-data] Las empresas, documentos RUT, extracciones y organization.json se conservaran.");
console.warn("");

if (isProduction) {
  console.error("[reset-fiscal-data] Cancelado: no se permite ejecutar este script con NODE_ENV=production.");
  process.exit(1);
}

if (!confirmed) {
  console.error("[reset-fiscal-data] Cancelado: ejecuta nuevamente con --confirm para continuar.");
  process.exit(1);
}

ensureDirectory(dataDir);

const audits = readJson(files.audits, []);
const preservedAudits = Array.isArray(audits) ? audits.filter((audit) => !isFiscalAudit(audit)) : [];

writeJson(files.audits, preservedAudits);
writeJson(files.taxes, defaultTaxes);
writeJson(files.taxRules, defaultTaxRules);
writeJson(files.companyObligations, []);
writeJson(files.fiscalCalendars, keepCalendarSeeds ? defaultFiscalCalendars : []);
writeJson(files.fiscalCalendarVersions, []);
writeJson(files.fiscalTasks, []);
writeJson(files.internalAlerts, defaultInternalAlerts);

console.log("[reset-fiscal-data] Datos fiscales reiniciados correctamente.");
console.log("[reset-fiscal-data] Se conservaron empresas, documentos, extracciones y organization.json.");
console.log("[reset-fiscal-data] taxes.json y tax-rules.json se restauraron a su catalogo base.");
console.log(
  keepCalendarSeeds
    ? "[reset-fiscal-data] fiscal-calendars.json se restauro con semillas base."
    : "[reset-fiscal-data] fiscal-calendars.json quedo vacio para reconstruir el calendario desde cero."
);
console.log(`[reset-fiscal-data] Auditorias fiscales eliminadas: ${Math.max(0, audits.length - preservedAudits.length)}`);
