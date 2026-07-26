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
  defaultDemoUsers
} from "../data/seed-data.js";
import { resolveConfiguredDataDirectory } from "./data-directory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = resolveConfiguredDataDirectory(path.resolve(__dirname, "../../data"));
const uploadsDir = path.join(dataDir, "uploads", "rut");

export const jsonStorageFiles = Object.freeze({
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
});

function ensureFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function assertProductionAdministratorExists() {
  if (String(process.env.NODE_ENV || "").trim().toLowerCase() !== "production") {
    return;
  }
  const users = readJson(jsonStorageFiles.users);
  const hasActiveAdministrator = Array.isArray(users) && users.some((user) => {
    const roles = Array.isArray(user?.roles) ? user.roles : [user?.role].filter(Boolean);
    return user?.estado === "activo" && roles.some((role) => ["owner", "administrador", "gerente"].includes(role));
  });
  if (!hasActiveAdministrator) {
    throw new Error(
      "Arranque detenido: NODE_ENV=production requiere al menos un usuario administrador activo creado de forma segura."
    );
  }
}

function ensureSeedEntries(filePath, seedItems, getKey = (item) => item?.id) {
  ensureFile(filePath, seedItems);
  const currentItems = readJson(filePath);
  if (!Array.isArray(currentItems) || !Array.isArray(seedItems)) {
    return;
  }

  const existingKeys = new Set(currentItems.map((item) => getKey(item)).filter(Boolean));
  const missingItems = seedItems.filter((item) => {
    const key = getKey(item);
    return key && !existingKeys.has(key);
  });

  if (missingItems.length > 0) {
    writeJson(filePath, [...currentItems, ...missingItems]);
  }
}

function syncFiscalCalendarSeedMetadata() {
  ensureFile(jsonStorageFiles.fiscalCalendars, defaultFiscalCalendars);
  const currentItems = readJson(jsonStorageFiles.fiscalCalendars);
  if (!Array.isArray(currentItems)) {
    return;
  }

  const seedCalendarMap = new Map(defaultFiscalCalendars.map((item) => [item.id, item]));
  let changed = false;

  const nextItems = currentItems.map((item) => {
    const seedCalendar = seedCalendarMap.get(item?.id);
    if (!seedCalendar) {
      return item;
    }

    const nextItem = { ...item };

    if ((item.fuenteCalendario === "semilla_local" || !item.fuenteCalendario) && seedCalendar.fuenteCalendario === "DIAN") {
      changed = true;
      nextItem.fuenteCalendario = "DIAN";
    }

    if ((!item.eventoFiscalClave && seedCalendar.eventoFiscalClave) || (!item.eventoFiscal && seedCalendar.eventoFiscal)) {
      changed = true;
      nextItem.eventoFiscalClave = item.eventoFiscalClave || seedCalendar.eventoFiscalClave || "";
      nextItem.eventoFiscal = item.eventoFiscal || seedCalendar.eventoFiscal || "";
    }

    return nextItem;
  });

  if (changed) {
    writeJson(jsonStorageFiles.fiscalCalendars, nextItems);
  }
}

function syncCompanyObligationMetadata() {
  ensureFile(jsonStorageFiles.companyObligations, defaultCompanyObligations);
  const obligations = readJson(jsonStorageFiles.companyObligations);
  if (!Array.isArray(obligations)) {
    return;
  }

  let changed = false;
  const nextItems = obligations.map((item) => {
    if (item?.impuestoId !== "tax_rst" || item?.eventoFiscalClave) {
      return item;
    }

    changed = true;
    return {
      ...item,
      eventoFiscalClave: "anticipo_bimestral",
      eventoFiscal: item?.eventoFiscal || "Anticipo bimestral RST"
    };
  });

  if (changed) {
    writeJson(jsonStorageFiles.companyObligations, nextItems);
  }
}

function syncInferredRuleMetadata() {
  ensureFile(jsonStorageFiles.inferredTaxRules, defaultInferredTaxRules);
  const rules = readJson(jsonStorageFiles.inferredTaxRules);
  if (!Array.isArray(rules)) {
    return;
  }

  let changed = false;
  const nextRules = rules.map((rule) => {
    if (rule?.id === "matrix_rst_regimen_simple" && rule?.estado !== "inactivo") {
      changed = true;
      return {
        ...rule,
        estado: "inactivo"
      };
    }

    return rule;
  });

  if (changed) {
    writeJson(jsonStorageFiles.inferredTaxRules, nextRules);
  }
}

function syncDefaultUserAssignments() {
  const users = getUsersFromJson();
  const companies = getCompaniesFromJson();
  const availableCompanyIds = companies.map((company) => company.id).filter(Boolean);

  if (availableCompanyIds.length === 0) {
    return;
  }

  let changed = false;
  for (const user of users) {
    if (!["usr_senior", "usr_junior_paula", "usr_junior_sara"].includes(user.id)) {
      continue;
    }

    const currentAssignments = Array.isArray(user.empresasAsignadas) ? user.empresasAsignadas : [];
    const validAssignments = currentAssignments.filter((companyId) => availableCompanyIds.includes(companyId));

    if (validAssignments.length === 0) {
      user.empresasAsignadas = [...availableCompanyIds];
      changed = true;
    }
  }

  if (changed) {
    saveUsersToJson(users);
  }
}

export function ensureJsonStorage() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });

  ensureFile(jsonStorageFiles.organization, defaultOrganization);
  ensureFile(jsonStorageFiles.companies, defaultCompanies);
  ensureFile(jsonStorageFiles.documents, defaultDocuments);
  ensureFile(jsonStorageFiles.extractions, defaultExtractions);
  ensureFile(jsonStorageFiles.audits, defaultAudits);
  ensureSeedEntries(jsonStorageFiles.taxes, defaultTaxes);
  ensureSeedEntries(jsonStorageFiles.taxRules, defaultTaxRules);
  ensureSeedEntries(jsonStorageFiles.inferredTaxRules, defaultInferredTaxRules);
  syncInferredRuleMetadata();
  ensureFile(jsonStorageFiles.companyObligations, defaultCompanyObligations);
  syncCompanyObligationMetadata();
  ensureSeedEntries(jsonStorageFiles.fiscalCalendars, defaultFiscalCalendars);
  syncFiscalCalendarSeedMetadata();
  ensureFile(jsonStorageFiles.fiscalCalendarVersions, defaultFiscalCalendarVersions);
  ensureFile(jsonStorageFiles.fiscalTasks, defaultFiscalTasks);
  ensureFile(jsonStorageFiles.internalAlerts, defaultInternalAlerts);
  ensureFile(jsonStorageFiles.users, defaultDemoUsers);
  ensureFile(jsonStorageFiles.sessions, defaultSessions);
  assertProductionAdministratorExists();
  syncDefaultUserAssignments();
}

export function getUploadsDirFromJson() {
  return uploadsDir;
}

export function getOrganizationFromJson() {
  return readJson(jsonStorageFiles.organization);
}

export function saveOrganizationToJson(organization) {
  writeJson(jsonStorageFiles.organization, organization);
}

export function getCompaniesFromJson() {
  return readJson(jsonStorageFiles.companies);
}

export function saveCompaniesToJson(companies) {
  writeJson(jsonStorageFiles.companies, companies);
}

export function getDocumentsFromJson() {
  return readJson(jsonStorageFiles.documents);
}

export function saveDocumentsToJson(documents) {
  writeJson(jsonStorageFiles.documents, documents);
}

export function getExtractionsFromJson() {
  return readJson(jsonStorageFiles.extractions);
}

export function saveExtractionsToJson(extractions) {
  writeJson(jsonStorageFiles.extractions, extractions);
}

export function getAuditsFromJson() {
  return readJson(jsonStorageFiles.audits);
}

export function saveAuditsToJson(audits) {
  writeJson(jsonStorageFiles.audits, audits);
}

export function getTaxesFromJson() {
  return readJson(jsonStorageFiles.taxes);
}

export function saveTaxesToJson(taxes) {
  writeJson(jsonStorageFiles.taxes, taxes);
}

export function getTaxRulesFromJson() {
  return readJson(jsonStorageFiles.taxRules);
}

export function saveTaxRulesToJson(taxRules) {
  writeJson(jsonStorageFiles.taxRules, taxRules);
}

export function getInferredTaxRulesFromJson() {
  return readJson(jsonStorageFiles.inferredTaxRules);
}

export function saveInferredTaxRulesToJson(inferredTaxRules) {
  writeJson(jsonStorageFiles.inferredTaxRules, inferredTaxRules);
}

export function getCompanyObligationsFromJson() {
  return readJson(jsonStorageFiles.companyObligations);
}

export function saveCompanyObligationsToJson(companyObligations) {
  writeJson(jsonStorageFiles.companyObligations, companyObligations);
}

export function getFiscalCalendarsFromJson() {
  return readJson(jsonStorageFiles.fiscalCalendars);
}

export function saveFiscalCalendarsToJson(fiscalCalendars) {
  writeJson(jsonStorageFiles.fiscalCalendars, fiscalCalendars);
}

export function getFiscalCalendarVersionsFromJson() {
  return readJson(jsonStorageFiles.fiscalCalendarVersions);
}

export function saveFiscalCalendarVersionsToJson(fiscalCalendarVersions) {
  writeJson(jsonStorageFiles.fiscalCalendarVersions, fiscalCalendarVersions);
}

export function getFiscalTasksFromJson() {
  return readJson(jsonStorageFiles.fiscalTasks);
}

export function saveFiscalTasksToJson(fiscalTasks) {
  writeJson(jsonStorageFiles.fiscalTasks, fiscalTasks);
}

export function getInternalAlertsFromJson() {
  return readJson(jsonStorageFiles.internalAlerts);
}

export function saveInternalAlertsToJson(internalAlerts) {
  writeJson(jsonStorageFiles.internalAlerts, internalAlerts);
}

export function getUsersFromJson() {
  return readJson(jsonStorageFiles.users);
}

export function saveUsersToJson(users) {
  writeJson(jsonStorageFiles.users, users);
}

export function getSessionsFromJson() {
  return readJson(jsonStorageFiles.sessions);
}

export function saveSessionsToJson(sessions) {
  writeJson(jsonStorageFiles.sessions, sessions);
}
