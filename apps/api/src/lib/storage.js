import { getStorageDriver } from "../db/database-config.js";
import {
  ensureDatabaseStorageSync,
  getCollectionFromDatabaseSync,
  saveCollectionToDatabaseSync
} from "../db/database-storage-bridge.js";
import {
  ensureJsonStorage,
  getAuditsFromJson,
  getCompaniesFromJson,
  getCompanyObligationsFromJson,
  getDocumentsFromJson,
  getExtractionsFromJson,
  getFiscalCalendarsFromJson,
  getFiscalCalendarVersionsFromJson,
  getFiscalTasksFromJson,
  getInferredTaxRulesFromJson,
  getInternalAlertsFromJson,
  getOrganizationFromJson,
  getSessionsFromJson,
  getTaxRulesFromJson,
  getTaxesFromJson,
  getUploadsDirFromJson,
  getUsersFromJson,
  saveAuditsToJson,
  saveCompaniesToJson,
  saveCompanyObligationsToJson,
  saveDocumentsToJson,
  saveExtractionsToJson,
  saveFiscalCalendarsToJson,
  saveFiscalCalendarVersionsToJson,
  saveFiscalTasksToJson,
  saveInferredTaxRulesToJson,
  saveInternalAlertsToJson,
  saveOrganizationToJson,
  saveSessionsToJson,
  saveTaxRulesToJson,
  saveTaxesToJson,
  saveUsersToJson
} from "./storage-json-driver.js";

function useDatabaseDriver() {
  return getStorageDriver() === "database";
}

function readCollection(collectionName, jsonGetter) {
  if (useDatabaseDriver()) {
    return getCollectionFromDatabaseSync(collectionName);
  }
  return jsonGetter();
}

function writeCollection(collectionName, value, jsonSaver) {
  if (useDatabaseDriver()) {
    saveCollectionToDatabaseSync(collectionName, value);
    return;
  }
  jsonSaver(value);
}

export function ensureStorage() {
  if (useDatabaseDriver()) {
    ensureDatabaseStorageSync();
    return;
  }

  ensureJsonStorage();
}

export function getOrganization() {
  return readCollection("organization", getOrganizationFromJson);
}

export function saveOrganization(organization) {
  writeCollection("organization", organization, saveOrganizationToJson);
}

export function getCompanies() {
  return readCollection("companies", getCompaniesFromJson);
}

export function saveCompanies(companies) {
  writeCollection("companies", companies, saveCompaniesToJson);
}

export function getDocuments() {
  return readCollection("documents", getDocumentsFromJson);
}

export function saveDocuments(documents) {
  writeCollection("documents", documents, saveDocumentsToJson);
}

export function getExtractions() {
  return readCollection("extractions", getExtractionsFromJson);
}

export function saveExtractions(extractions) {
  writeCollection("extractions", extractions, saveExtractionsToJson);
}

export function getAudits() {
  return readCollection("audits", getAuditsFromJson);
}

export function saveAudits(audits) {
  writeCollection("audits", audits, saveAuditsToJson);
}

export function getUploadsDir() {
  return getUploadsDirFromJson();
}

export function getTaxes() {
  return readCollection("taxes", getTaxesFromJson);
}

export function saveTaxes(taxes) {
  writeCollection("taxes", taxes, saveTaxesToJson);
}

export function getTaxRules() {
  return readCollection("taxRules", getTaxRulesFromJson);
}

export function saveTaxRules(taxRules) {
  writeCollection("taxRules", taxRules, saveTaxRulesToJson);
}

export function getInferredTaxRules() {
  return readCollection("inferredTaxRules", getInferredTaxRulesFromJson);
}

export function saveInferredTaxRules(inferredTaxRules) {
  writeCollection("inferredTaxRules", inferredTaxRules, saveInferredTaxRulesToJson);
}

export function getCompanyObligations() {
  return readCollection("companyObligations", getCompanyObligationsFromJson);
}

export function saveCompanyObligations(companyObligations) {
  writeCollection("companyObligations", companyObligations, saveCompanyObligationsToJson);
}

export function getFiscalCalendars() {
  return readCollection("fiscalCalendars", getFiscalCalendarsFromJson);
}

export function saveFiscalCalendars(fiscalCalendars) {
  writeCollection("fiscalCalendars", fiscalCalendars, saveFiscalCalendarsToJson);
}

export function getFiscalCalendarVersions() {
  return readCollection("fiscalCalendarVersions", getFiscalCalendarVersionsFromJson);
}

export function saveFiscalCalendarVersions(fiscalCalendarVersions) {
  writeCollection("fiscalCalendarVersions", fiscalCalendarVersions, saveFiscalCalendarVersionsToJson);
}

export function getFiscalTasks() {
  return readCollection("fiscalTasks", getFiscalTasksFromJson);
}

export function saveFiscalTasks(fiscalTasks) {
  writeCollection("fiscalTasks", fiscalTasks, saveFiscalTasksToJson);
}

export function getInternalAlerts() {
  return readCollection("internalAlerts", getInternalAlertsFromJson);
}

export function saveInternalAlerts(internalAlerts) {
  writeCollection("internalAlerts", internalAlerts, saveInternalAlertsToJson);
}

export function getUsers() {
  return readCollection("users", getUsersFromJson);
}

export function saveUsers(users) {
  writeCollection("users", users, saveUsersToJson);
}

export function getSessions() {
  return readCollection("sessions", getSessionsFromJson);
}

export function saveSessions(sessions) {
  writeCollection("sessions", sessions, saveSessionsToJson);
}
