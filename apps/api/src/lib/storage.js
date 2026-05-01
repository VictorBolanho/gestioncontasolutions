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
  companyObligations: path.join(dataDir, "company-obligations.json")
};

function ensureFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
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
  ensureFile(files.taxes, defaultTaxes);
  ensureFile(files.taxRules, defaultTaxRules);
  ensureFile(files.companyObligations, defaultCompanyObligations);
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

export function getCompanyObligations() {
  return readJson(files.companyObligations);
}

export function saveCompanyObligations(companyObligations) {
  writeJson(files.companyObligations, companyObligations);
}
