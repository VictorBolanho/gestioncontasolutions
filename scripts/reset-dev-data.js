import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultAudits,
  defaultCompanyObligations,
  defaultCompanies,
  defaultDocuments,
  defaultExtractions,
  defaultOrganization,
  defaultTaxRules,
  defaultTaxes
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
  companyObligations: path.join(dataDir, "company-obligations.json")
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

const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";
const confirmed = process.argv.includes("--confirm");
const keepDemoSeeds = process.argv.includes("--keep-demo-seeds");

console.warn("");
console.warn("[reset-dev-data] Advertencia: este script limpiara datos locales de desarrollo.");
console.warn("[reset-dev-data] Se reiniciaran empresas, documentos, extracciones, auditorias, obligaciones y PDFs en uploads/rut.");
console.warn("[reset-dev-data] Por defecto dejara el ambiente limpio, sin empresas demo ni datos de prueba.");
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
writeJson(files.companies, keepDemoSeeds ? defaultCompanies : []);
writeJson(files.documents, keepDemoSeeds ? defaultDocuments : []);
writeJson(files.extractions, keepDemoSeeds ? defaultExtractions : []);
writeJson(files.audits, keepDemoSeeds ? defaultAudits : []);
writeJson(files.taxes, defaultTaxes);
writeJson(files.taxRules, defaultTaxRules);
writeJson(files.companyObligations, keepDemoSeeds ? defaultCompanyObligations : []);

const removedUploads = removeUploadFiles(uploadsDir);

console.log("[reset-dev-data] Datos locales reiniciados correctamente.");
console.log(`[reset-dev-data] Archivos eliminados de uploads/rut: ${removedUploads.length}`);
console.log("[reset-dev-data] organization.json se conservo con la semilla base.");
console.log("[reset-dev-data] taxes.json y tax-rules.json se conservaron como catalogos base.");
if (keepDemoSeeds) {
  console.log("[reset-dev-data] Se restauraron tambien las semillas demo base.");
}
