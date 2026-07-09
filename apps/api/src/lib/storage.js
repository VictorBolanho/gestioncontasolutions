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
} from "../data/seed-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../../data");
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

function ensureFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
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
  ensureFile(files.fiscalCalendars, defaultFiscalCalendars);
  const currentItems = readJson(files.fiscalCalendars);
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
    writeJson(files.fiscalCalendars, nextItems);
  }
}

function syncCompanyObligationMetadata() {
  ensureFile(files.companyObligations, defaultCompanyObligations);
  const obligations = readJson(files.companyObligations);
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
    writeJson(files.companyObligations, nextItems);
  }
}

function syncInferredRuleMetadata() {
  ensureFile(files.inferredTaxRules, defaultInferredTaxRules);
  const rules = readJson(files.inferredTaxRules);
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
    writeJson(files.inferredTaxRules, nextRules);
  }
}

function syncDefaultUserAssignments() {
  const users = getUsers();
  const companies = getCompanies();
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
    saveUsers(users);
  }
}

export function ensureStorage() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });

  ensureFile(files.organization, defaultOrganization);
  ensureFile(files.companies, defaultCompanies);
  ensureFile(files.documents, defaultDocuments);
  ensureFile(files.extractions, defaultExtractions);
  ensureFile(files.audits, defaultAudits);
  ensureSeedEntries(files.taxes, defaultTaxes);
  ensureSeedEntries(files.taxRules, defaultTaxRules);
  ensureSeedEntries(files.inferredTaxRules, defaultInferredTaxRules);
  syncInferredRuleMetadata();
  ensureFile(files.companyObligations, defaultCompanyObligations);
  syncCompanyObligationMetadata();
  ensureSeedEntries(files.fiscalCalendars, defaultFiscalCalendars);
  syncFiscalCalendarSeedMetadata();
  ensureFile(files.fiscalCalendarVersions, defaultFiscalCalendarVersions);
  ensureFile(files.fiscalTasks, defaultFiscalTasks);
  ensureFile(files.internalAlerts, defaultInternalAlerts);
  // Users should be seeded only when the file does not exist, so manual cleanup
  // or admin-only test setups are preserved across API restarts.
  ensureFile(files.users, defaultUsers);
  ensureFile(files.sessions, defaultSessions);
  syncDefaultUserAssignments();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

export function getOrganization() {
  return readJson(files.organization);
}

export function getCompanies() {
  return readJson(files.companies);
}

export function saveCompanies(companies) {
  writeJson(files.companies, companies);
}

export function getDocuments() {
  return readJson(files.documents);
}

export function saveDocuments(documents) {
  writeJson(files.documents, documents);
}

export function getExtractions() {
  return readJson(files.extractions);
}

export function saveExtractions(extractions) {
  writeJson(files.extractions, extractions);
}

export function getAudits() {
  return readJson(files.audits);
}

export function saveAudits(audits) {
  writeJson(files.audits, audits);
}

export function getUploadsDir() {
  return uploadsDir;
}

export function getTaxes() {
  return readJson(files.taxes);
}

export function saveTaxes(taxes) {
  writeJson(files.taxes, taxes);
}

export function getTaxRules() {
  return readJson(files.taxRules);
}

export function saveTaxRules(taxRules) {
  writeJson(files.taxRules, taxRules);
}

export function getInferredTaxRules() {
  return readJson(files.inferredTaxRules);
}

export function saveInferredTaxRules(inferredTaxRules) {
  writeJson(files.inferredTaxRules, inferredTaxRules);
}

export function getCompanyObligations() {
  return readJson(files.companyObligations);
}

export function saveCompanyObligations(companyObligations) {
  writeJson(files.companyObligations, companyObligations);
}

export function getFiscalCalendars() {
  return readJson(files.fiscalCalendars);
}

export function saveFiscalCalendars(fiscalCalendars) {
  writeJson(files.fiscalCalendars, fiscalCalendars);
}

export function getFiscalCalendarVersions() {
  return readJson(files.fiscalCalendarVersions);
}

export function saveFiscalCalendarVersions(fiscalCalendarVersions) {
  writeJson(files.fiscalCalendarVersions, fiscalCalendarVersions);
}

export function getFiscalTasks() {
  return readJson(files.fiscalTasks);
}

export function saveFiscalTasks(fiscalTasks) {
  writeJson(files.fiscalTasks, fiscalTasks);
}

export function getInternalAlerts() {
  return readJson(files.internalAlerts);
}

export function saveInternalAlerts(internalAlerts) {
  writeJson(files.internalAlerts, internalAlerts);
}

export function getUsers() {
  return readJson(files.users);
}

export function saveUsers(users) {
  writeJson(files.users, users);
}

export function getSessions() {
  return readJson(files.sessions);
}

export function saveSessions(sessions) {
  writeJson(files.sessions, sessions);
}
