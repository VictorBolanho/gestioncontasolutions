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
  defaultTaxRules,
  defaultTaxes,
  defaultUsers
} from "../data/seed-data.js";
import { validateMigrationData } from "./migration-validation.js";
import {
  saveCollectionToDatabaseWithClient,
  syncStaticSecurityData
} from "./database-storage.js";
import { withPgTransaction } from "./postgres-client.js";

function normalizeText(value) {
  return String(value ?? "").trim();
}

export function normalizeSeedCalendars(calendars, organizationId) {
  const normalizedOrganizationId = normalizeText(organizationId);
  if (!normalizedOrganizationId) {
    throw new Error("La organizacion activa del seed no tiene un identificador valido.");
  }
  if (!Array.isArray(calendars) || calendars.length === 0) {
    throw new Error("El seed debe contener calendarios fiscales.");
  }
  return calendars.map((calendar) => {
    if (!calendar || typeof calendar !== "object" || Array.isArray(calendar)) {
      throw new Error("El seed contiene un calendario fiscal invalido.");
    }
    const explicitOrganizationId = normalizeText(calendar.organizacionId);
    if (explicitOrganizationId && explicitOrganizationId !== normalizedOrganizationId) {
      throw new Error(
        `El calendario ${calendar.id || "<sin-id>"} pertenece a una organizacion distinta.`
      );
    }
    return { ...calendar, organizacionId: normalizedOrganizationId };
  });
}

async function getSingleActiveOrganization(client) {
  const result = await client.query(`
    SELECT id, nombre, estado, payload
    FROM organizations
    WHERE estado = 'activa' AND deleted_at IS NULL
    ORDER BY id
    FOR SHARE
  `);
  if (result.rowCount !== 1) {
    throw new Error(
      "El seed requiere exactamente una organizacion activa. Ejecuta primero db:init:deployment y no uses el seed con varias organizaciones."
    );
  }
  const row = result.rows[0];
  return {
    ...(row.payload && typeof row.payload === "object" ? row.payload : {}),
    id: row.id,
    nombre: row.nombre,
    estado: row.estado
  };
}

function assertValidSeedData(data) {
  const validation = validateMigrationData(data);
  if (validation.issues.length > 0) {
    throw new Error(`El seed no supero la validacion previa: ${validation.issues.join(" | ")}`);
  }
  return validation.data;
}

async function applyCollections(client, entries, saveCollection) {
  for (const [collectionName, value] of entries) {
    await saveCollection(client, collectionName, value);
  }
}

export async function seedTechnicalData({
  transaction = withPgTransaction,
  loadOrganization = getSingleActiveOrganization,
  saveCollection = saveCollectionToDatabaseWithClient,
  syncSecurity = syncStaticSecurityData,
  calendars: sourceCalendars = defaultFiscalCalendars
} = {}) {
  return transaction(async (client) => {
    const organization = await loadOrganization(client);
    const calendars = normalizeSeedCalendars(sourceCalendars, organization.id);
    const data = assertValidSeedData({
      organization,
      companies: [],
      documents: [],
      extractions: [],
      taxes: defaultTaxes,
      taxRules: defaultTaxRules,
      inferredTaxRules: defaultInferredTaxRules,
      users: [],
      companyObligations: [],
      fiscalCalendars: calendars,
      fiscalCalendarVersions: [],
      fiscalTasks: [],
      internalAlerts: [],
      audits: [],
      sessions: []
    });
    await applyCollections(client, [
      ["taxes", data.taxes],
      ["taxRules", data.taxRules],
      ["inferredTaxRules", data.inferredTaxRules],
      ["fiscalCalendars", data.fiscalCalendars]
    ], saveCollection);
    await syncSecurity(client);

    return {
      roles: ROLES.length,
      permissions: ALL_PERMISSIONS.length,
      rolePermissions: Object.values(ROLE_PERMISSIONS).reduce((total, permissions) => total + permissions.length, 0),
      roleLabels: Object.keys(ROLE_LABELS).length,
      taxes: data.taxes.length,
      taxRules: data.taxRules.length,
      inferredTaxRules: data.inferredTaxRules.length,
      fiscalCalendars: data.fiscalCalendars.length
    };
  });
}

export async function seedDemoData({
  transaction = withPgTransaction,
  loadOrganization = getSingleActiveOrganization,
  saveCollection = saveCollectionToDatabaseWithClient,
  calendars: sourceCalendars = defaultFiscalCalendars
} = {}) {
  return transaction(async (client) => {
    const organization = await loadOrganization(client);
    const calendars = normalizeSeedCalendars(sourceCalendars, organization.id);
    const data = assertValidSeedData({
      organization,
      companies: defaultCompanies,
      documents: defaultDocuments,
      extractions: defaultExtractions,
      taxes: defaultTaxes,
      taxRules: defaultTaxRules,
      inferredTaxRules: defaultInferredTaxRules,
      users: defaultUsers,
      companyObligations: [],
      fiscalCalendars: calendars,
      fiscalCalendarVersions: [],
      fiscalTasks: [],
      internalAlerts: [],
      audits: [],
      sessions: []
    });
    await applyCollections(client, [
      ["companies", data.companies],
      ["documents", data.documents],
      ["extractions", data.extractions],
      ["taxes", data.taxes],
      ["taxRules", data.taxRules],
      ["inferredTaxRules", data.inferredTaxRules],
      ["fiscalCalendars", data.fiscalCalendars],
      ["users", data.users],
      ["companyObligations", data.companyObligations],
      ["fiscalCalendarVersions", data.fiscalCalendarVersions],
      ["fiscalTasks", data.fiscalTasks],
      ["internalAlerts", data.internalAlerts],
      ["audits", data.audits],
      ["sessions", data.sessions]
    ], saveCollection);

    return {
      users: data.users.length,
      companies: data.companies.length,
      documents: data.documents.length,
      extractions: data.extractions.length,
      taxes: data.taxes.length,
      taxRules: data.taxRules.length,
      inferredTaxRules: data.inferredTaxRules.length,
      fiscalCalendars: data.fiscalCalendars.length
    };
  });
}
