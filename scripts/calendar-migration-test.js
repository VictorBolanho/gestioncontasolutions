import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { COLLECTION_ORDER } from "../apps/api/src/db/entity-definitions.js";
import {
  buildFiscalCalendarIdentityKey,
  validateMigrationData
} from "../apps/api/src/db/migration-validation.js";
import { resolveConfiguredDataDirectory } from "../apps/api/src/lib/data-directory.js";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");
const dataDir = resolveConfiguredDataDirectory(path.join(projectRoot, "apps", "api", "data"));
const migrationsDir = path.join(projectRoot, "apps", "api", "src", "db", "migrations");

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

function baseCalendar(overrides = {}) {
  return {
    id: "fcal_test_1",
    impuestoId: "tax_test",
    anio: 2026,
    periodo: "anual",
    periodicidad: "anual",
    nivel: "nacional",
    pais: "COLOMBIA",
    criterioVencimiento: "ultimo_digito_nit",
    ultimoDigitoNit: "1",
    tipoContribuyente: "persona juridica",
    regimen: "",
    tipoPago: "cuota",
    numeroCuota: 1,
    nombreCuota: "Declaracion y pago 1a cuota",
    fechaVencimiento: "2026-05-12",
    version: 1,
    estado: "activo",
    ...overrides
  };
}

function minimalData(calendars) {
  return {
    organization: { id: "org_test", nombre: "Test", estado: "activa" },
    companies: [],
    documents: [],
    extractions: [],
    audits: [],
    taxes: [{ id: "tax_test", codigo: "TEST", nombre: "Impuesto test", nivel: "nacional", estado: "activo" }],
    taxRules: [],
    inferredTaxRules: [],
    companyObligations: [],
    fiscalCalendars: calendars,
    fiscalCalendarVersions: [],
    fiscalTasks: [],
    internalAlerts: [],
    users: [],
    sessions: []
  };
}

async function readOperationalSource() {
  const data = {};
  for (const collectionName of COLLECTION_ORDER) {
    data[collectionName] = JSON.parse(
      await fs.readFile(path.join(dataDir, fileMap[collectionName]), "utf8")
    );
  }
  return data;
}

test("la identidad diferencia tipos de contribuyente", () => {
  const legalEntity = baseCalendar();
  const largeTaxpayer = baseCalendar({
    id: "fcal_test_2",
    tipoContribuyente: "gran contribuyente"
  });
  assert.notEqual(
    buildFiscalCalendarIdentityKey(legalEntity, "org_test"),
    buildFiscalCalendarIdentityKey(largeTaxpayer, "org_test")
  );
  assert.deepEqual(validateMigrationData(minimalData([legalEntity, largeTaxpayer])).issues, []);
});

test("la identidad diferencia varias cuotas del mismo impuesto y periodo", () => {
  const first = baseCalendar();
  const second = baseCalendar({
    id: "fcal_test_2",
    numeroCuota: 2,
    nombreCuota: "Pago 2a cuota",
    fechaVencimiento: "2026-07-09"
  });
  assert.notEqual(
    buildFiscalCalendarIdentityKey(first, "org_test"),
    buildFiscalCalendarIdentityKey(second, "org_test")
  );
  assert.deepEqual(validateMigrationData(minimalData([first, second])).issues, []);
});

test("el nombre de cuota es fallback cuando no existe numero", () => {
  const first = baseCalendar({ numeroCuota: "", nombreCuota: "Anticipo inicial" });
  const second = baseCalendar({
    id: "fcal_test_2",
    numeroCuota: "",
    nombreCuota: "Saldo final",
    fechaVencimiento: "2026-07-09"
  });
  assert.notEqual(
    buildFiscalCalendarIdentityKey(first, "org_test"),
    buildFiscalCalendarIdentityKey(second, "org_test")
  );
});

test("un duplicado real se rechaza aunque cambie solo la fecha", () => {
  const original = baseCalendar();
  const duplicate = baseCalendar({
    id: "fcal_test_duplicate",
    fechaVencimiento: "2026-05-13"
  });
  const { issues } = validateMigrationData(minimalData([original, duplicate]));
  assert.equal(issues.filter((issue) => issue.includes("fiscal_calendars_unique_scope")).length, 1);
});

test("el dry-run detecta claves foraneas, CHECK y campos obligatorios", () => {
  const invalid = baseCalendar({
    impuestoId: "tax_missing",
    estado: "estado_invalido",
    fechaVencimiento: ""
  });
  const { issues } = validateMigrationData(minimalData([invalid]));
  assert.ok(issues.some((issue) => issue.includes("campos obligatorios faltantes")));
  assert.ok(issues.some((issue) => issue.includes("viola CHECK estado")));
  assert.ok(issues.some((issue) => issue.includes("impuestoId inexistente")));
  assert.ok(issues.some((issue) => issue.includes("fechaVencimiento invalida")));
});

test("los 536 calendarios operativos tienen identidad unica corregida", async () => {
  const source = await readOperationalSource();
  const { data, issues } = validateMigrationData(source);
  assert.equal(data.fiscalCalendars.length, 536);
  assert.deepEqual(issues, []);
  const keys = new Set(
    data.fiscalCalendars.map((calendar) =>
      buildFiscalCalendarIdentityKey(calendar, data.organization.id)
    )
  );
  assert.equal(keys.size, 536);
  assert.ok(data.fiscalCalendars.every((calendar) => calendar.organizacionId === data.organization.id));
});

test("la migracion 002 tiene up y rollback data-preserving", async () => {
  const up = await fs.readFile(path.join(migrationsDir, "002_fiscal_calendar_identity.up.sql"), "utf8");
  const down = await fs.readFile(path.join(migrationsDir, "002_fiscal_calendar_identity.down.sql"), "utf8");
  assert.match(up, /ADD COLUMN IF NOT EXISTS organizacion_id/i);
  assert.match(up, /tipo_contribuyente/i);
  assert.match(up, /numero_cuota/i);
  assert.match(up, /CREATE UNIQUE INDEX fiscal_calendars_unique_scope/i);
  assert.match(down, /DROP COLUMN IF EXISTS organizacion_id/i);
  assert.match(down, /payload ->> 'tipoContribuyente'/i);
  assert.match(down, /CREATE UNIQUE INDEX fiscal_calendars_unique_scope/i);
});
