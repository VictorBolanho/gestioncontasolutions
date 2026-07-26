import {
  ALL_PERMISSIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  ROLES
} from "../../../../packages/domain/permissions.js";
import {
  defaultCompanies,
  defaultDocuments,
  defaultExtractions,
  defaultFiscalCalendars,
  defaultInferredTaxRules,
  defaultOrganization,
  defaultTaxRules,
  defaultTaxes,
  defaultUsers
} from "../data/seed-data.js";
import { saveCollectionToDatabase, syncStaticSecurityData } from "./database-storage.js";

export async function seedTechnicalData() {
  await saveCollectionToDatabase("organization", defaultOrganization);
  await saveCollectionToDatabase("taxes", defaultTaxes);
  await saveCollectionToDatabase("taxRules", defaultTaxRules);
  await saveCollectionToDatabase("inferredTaxRules", defaultInferredTaxRules);
  await saveCollectionToDatabase("fiscalCalendars", defaultFiscalCalendars);
  const { withPgTransaction } = await import("./postgres-client.js");
  await withPgTransaction(async (client) => {
    await syncStaticSecurityData(client);
  });

  return {
    roles: ROLES.length,
    permissions: ALL_PERMISSIONS.length,
    rolePermissions: Object.values(ROLE_PERMISSIONS).reduce((total, permissions) => total + permissions.length, 0),
    roleLabels: Object.keys(ROLE_LABELS).length,
    taxes: defaultTaxes.length,
    taxRules: defaultTaxRules.length,
    inferredTaxRules: defaultInferredTaxRules.length,
    fiscalCalendars: defaultFiscalCalendars.length
  };
}

export async function seedDemoData() {
  await saveCollectionToDatabase("organization", defaultOrganization);
  await saveCollectionToDatabase("companies", defaultCompanies);
  await saveCollectionToDatabase("documents", defaultDocuments);
  await saveCollectionToDatabase("extractions", defaultExtractions);
  await saveCollectionToDatabase("taxes", defaultTaxes);
  await saveCollectionToDatabase("taxRules", defaultTaxRules);
  await saveCollectionToDatabase("inferredTaxRules", defaultInferredTaxRules);
  await saveCollectionToDatabase("fiscalCalendars", defaultFiscalCalendars);
  await saveCollectionToDatabase("users", defaultUsers);
  await saveCollectionToDatabase("companyObligations", []);
  await saveCollectionToDatabase("fiscalCalendarVersions", []);
  await saveCollectionToDatabase("fiscalTasks", []);
  await saveCollectionToDatabase("internalAlerts", []);
  await saveCollectionToDatabase("audits", []);
  await saveCollectionToDatabase("sessions", []);

  return {
    users: defaultUsers.length,
    companies: defaultCompanies.length,
    documents: defaultDocuments.length,
    extractions: defaultExtractions.length,
    taxes: defaultTaxes.length,
    taxRules: defaultTaxRules.length,
    inferredTaxRules: defaultInferredTaxRules.length,
    fiscalCalendars: defaultFiscalCalendars.length
  };
}
