import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { validateMigrationData } from "../apps/api/src/db/migration-validation.js";
import { resolveConfiguredDataDirectory } from "../apps/api/src/lib/data-directory.js";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");
const dataDir = resolveConfiguredDataDirectory(path.join(projectRoot, "apps", "api", "data"));
const migrationsDir = path.join(projectRoot, "apps", "api", "src", "db", "migrations");
const connectionString = String(process.env.TEST_DATABASE_URL || "").trim();
const safetyFlag = String(process.env.GESTORCONTA_ALLOW_TEST_DATABASE || "").trim();
const schemaName = `gestorconta_calendar_test_${crypto.randomBytes(6).toString("hex")}`;

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function fail(message) {
  throw new Error(message);
}

async function readJson(fileName) {
  return JSON.parse(await fs.readFile(path.join(dataDir, fileName), "utf8"));
}

async function readSourceData() {
  return {
    organization: await readJson("organization.json"),
    companies: await readJson("companies.json"),
    documents: await readJson("documents.json"),
    extractions: await readJson("extractions.json"),
    audits: await readJson("audits.json"),
    taxes: await readJson("taxes.json"),
    taxRules: await readJson("tax-rules.json"),
    inferredTaxRules: await readJson("inferred-tax-rules.json"),
    companyObligations: await readJson("company-obligations.json"),
    fiscalCalendars: await readJson("fiscal-calendars.json"),
    fiscalCalendarVersions: await readJson("fiscal-calendar-versions.json"),
    fiscalTasks: await readJson("fiscal-tasks.json"),
    internalAlerts: await readJson("internal-alerts.json"),
    users: await readJson("users.json"),
    sessions: await readJson("sessions.json")
  };
}

async function insertCalendar(client, calendar) {
  await client.query(
    `
      INSERT INTO fiscal_calendars (
        id, organizacion_id, impuesto_id, anio, periodo, periodicidad, nivel, pais,
        estado, version, criterio_vencimiento, fecha_vencimiento, municipio_ciudad,
        departamento, ultimo_digito_nit, rango_ultimos_digitos_nit,
        digito_verificacion, tipo_contribuyente, regimen, evento_fiscal_clave,
        tipo_pago, numero_cuota, nombre_cuota, payload
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16,
        $17, $18, $19, $20,
        $21, $22, $23, $24
      )
    `,
    [
      calendar.id,
      calendar.organizacionId,
      calendar.impuestoId,
      calendar.anio,
      calendar.periodo,
      calendar.periodicidad,
      calendar.nivel,
      calendar.pais || "COLOMBIA",
      calendar.estado,
      calendar.version || 1,
      calendar.criterioVencimiento || null,
      calendar.fechaVencimiento,
      calendar.municipioCiudad || calendar.municipio || null,
      calendar.departamento || null,
      calendar.ultimoDigitoNit || null,
      calendar.rangoUltimosDigitosNit || null,
      calendar.digitoVerificacion || null,
      calendar.tipoContribuyente || null,
      calendar.regimen || null,
      calendar.eventoFiscalClave || null,
      calendar.tipoPago || null,
      calendar.numeroCuota === "" || calendar.numeroCuota === undefined ? null : calendar.numeroCuota,
      calendar.nombreCuota || null,
      calendar
    ]
  );
}

async function countCalendarIdentities(client) {
  const { rows } = await client.query(`
    SELECT COUNT(*) AS count
    FROM (
      SELECT
        organizacion_id,
        impuesto_id,
        anio,
        LOWER(BTRIM(periodo)),
        LOWER(BTRIM(periodicidad)),
        LOWER(BTRIM(nivel)),
        LOWER(BTRIM(COALESCE(pais, 'COLOMBIA'))),
        LOWER(BTRIM(COALESCE(municipio_ciudad, ''))),
        LOWER(BTRIM(COALESCE(departamento, ''))),
        LOWER(BTRIM(COALESCE(criterio_vencimiento, ''))),
        LOWER(BTRIM(COALESCE(ultimo_digito_nit, ''))),
        LOWER(BTRIM(COALESCE(rango_ultimos_digitos_nit, ''))),
        LOWER(BTRIM(COALESCE(digito_verificacion, ''))),
        LOWER(BTRIM(COALESCE(tipo_contribuyente, ''))),
        LOWER(BTRIM(COALESCE(regimen, ''))),
        LOWER(BTRIM(COALESCE(evento_fiscal_clave, ''))),
        LOWER(BTRIM(COALESCE(tipo_pago, ''))),
        CASE
          WHEN numero_cuota IS NOT NULL THEN 'numero:' || numero_cuota::TEXT
          WHEN NULLIF(BTRIM(nombre_cuota), '') IS NOT NULL THEN 'nombre:' || LOWER(BTRIM(nombre_cuota))
          ELSE ''
        END,
        COALESCE(version, 1)
      FROM fiscal_calendars
      GROUP BY
        organizacion_id,
        impuesto_id,
        anio,
        LOWER(BTRIM(periodo)),
        LOWER(BTRIM(periodicidad)),
        LOWER(BTRIM(nivel)),
        LOWER(BTRIM(COALESCE(pais, 'COLOMBIA'))),
        LOWER(BTRIM(COALESCE(municipio_ciudad, ''))),
        LOWER(BTRIM(COALESCE(departamento, ''))),
        LOWER(BTRIM(COALESCE(criterio_vencimiento, ''))),
        LOWER(BTRIM(COALESCE(ultimo_digito_nit, ''))),
        LOWER(BTRIM(COALESCE(rango_ultimos_digitos_nit, ''))),
        LOWER(BTRIM(COALESCE(digito_verificacion, ''))),
        LOWER(BTRIM(COALESCE(tipo_contribuyente, ''))),
        LOWER(BTRIM(COALESCE(regimen, ''))),
        LOWER(BTRIM(COALESCE(evento_fiscal_clave, ''))),
        LOWER(BTRIM(COALESCE(tipo_pago, ''))),
        CASE
          WHEN numero_cuota IS NOT NULL THEN 'numero:' || numero_cuota::TEXT
          WHEN NULLIF(BTRIM(nombre_cuota), '') IS NOT NULL THEN 'nombre:' || LOWER(BTRIM(nombre_cuota))
          ELSE ''
        END,
        COALESCE(version, 1)
    ) AS identities
  `);
  return Number(rows[0].count);
}

async function main() {
  if (String(process.env.NODE_ENV || "").trim().toLowerCase() !== "test") {
    fail("Define NODE_ENV=test. Esta prueba se niega a ejecutarse fuera de un entorno de prueba.");
  }
  if (!connectionString) {
    fail("Define TEST_DATABASE_URL con una base PostgreSQL exclusiva de pruebas.");
  }
  if (safetyFlag !== "isolated-schema") {
    fail("Define GESTORCONTA_ALLOW_TEST_DATABASE=isolated-schema para confirmar el uso de una base de pruebas.");
  }

  const source = await readSourceData();
  const { data, issues } = validateMigrationData(source);
  if (issues.length > 0) {
    fail(`El origen no paso el dry-run: ${issues.join(" ")}`);
  }
  const expectedCalendarCount = source.fiscalCalendars.length;
  if (data.fiscalCalendars.length !== expectedCalendarCount) {
    fail(`El normalizador conservo ${data.fiscalCalendars.length} de ${expectedCalendarCount} calendarios.`);
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA ${quoteIdentifier(schemaName)}`);
    await client.query(`SET search_path TO ${quoteIdentifier(schemaName)}`);

    const migration001 = await fs.readFile(path.join(migrationsDir, "001_initial_schema.up.sql"), "utf8");
    const migration002 = await fs.readFile(path.join(migrationsDir, "002_fiscal_calendar_identity.up.sql"), "utf8");
    const rollback002 = await fs.readFile(path.join(migrationsDir, "002_fiscal_calendar_identity.down.sql"), "utf8");
    await client.query(migration001);
    await client.query(migration002);

    await client.query(
      `INSERT INTO organizations (id, nombre, estado, payload) VALUES ($1, $2, $3, $4)`,
      [data.organization.id, data.organization.nombre, data.organization.estado, data.organization]
    );
    for (const tax of data.taxes) {
      await client.query(
        `INSERT INTO taxes (id, codigo, nombre, nivel, estado, periodicidad_default, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tax.id, tax.codigo, tax.nombre, tax.nivel, tax.estado, tax.periodicidadDefault || null, tax]
      );
    }
    for (const calendar of data.fiscalCalendars) {
      await insertCalendar(client, calendar);
    }

    const count = Number((await client.query("SELECT COUNT(*) AS count FROM fiscal_calendars")).rows[0].count);
    if (count !== expectedCalendarCount) {
      fail(`PostgreSQL conservo ${count} calendarios; se esperaban ${expectedCalendarCount}.`);
    }
    const identityCount = await countCalendarIdentities(client);
    if (identityCount !== expectedCalendarCount) {
      fail(`PostgreSQL encontro ${identityCount} identidades; se esperaban ${expectedCalendarCount}.`);
    }

    const duplicate = {
      ...data.fiscalCalendars[0],
      id: `${data.fiscalCalendars[0].id}_duplicate_test`,
      fechaVencimiento: "2099-12-31"
    };
    await assertUniqueViolation(() => insertCalendar(client, duplicate));
    await assertPgErrorCode(
      () =>
        insertCalendar(client, {
          ...data.fiscalCalendars[0],
          id: `${data.fiscalCalendars[0].id}_fk_test`,
          impuestoId: "tax_missing_for_fk_test"
        }),
      "23503",
      "PostgreSQL acepto una clave foranea de impuesto inexistente."
    );
    await assertPgErrorCode(
      () =>
        insertCalendar(client, {
          ...data.fiscalCalendars[0],
          id: `${data.fiscalCalendars[0].id}_check_test`,
          estado: "estado_invalido"
        }),
      "23514",
      "PostgreSQL acepto un estado que viola la restriccion CHECK."
    );

    await client.query(rollback002);
    const columnsAfterRollback = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = 'fiscal_calendars' AND column_name = 'organizacion_id'`,
      [schemaName]
    );
    if (columnsAfterRollback.rowCount !== 0) {
      fail("El rollback no retiro las columnas proyectadas de identidad.");
    }
    const countAfterRollback = Number(
      (await client.query("SELECT COUNT(*) AS count FROM fiscal_calendars")).rows[0].count
    );
    if (countAfterRollback !== expectedCalendarCount) {
      fail(`El rollback altero los calendarios: quedaron ${countAfterRollback}.`);
    }

    await client.query(migration002);
    const reappliedCount = Number(
      (await client.query("SELECT COUNT(*) AS count FROM fiscal_calendars")).rows[0].count
    );
    const reappliedIdentityCount = await countCalendarIdentities(client);
    if (reappliedCount !== expectedCalendarCount || reappliedIdentityCount !== expectedCalendarCount) {
      fail(
        `La reaplicacion dejo ${reappliedCount} calendarios y ${reappliedIdentityCount} identidades; se esperaban ${expectedCalendarCount}.`
      );
    }
    console.log("[ok] Migraciones 001 y 002 aplicadas en esquema aislado.");
    console.log(`[ok] PostgreSQL conservo ${expectedCalendarCount} calendarios e identidades unicas.`);
    console.log("[ok] PostgreSQL rechazo un duplicado real con fecha distinta.");
    console.log("[ok] PostgreSQL rechazo una FK inexistente y un estado que viola CHECK.");
    console.log(`[ok] Rollback 002 preservo los ${expectedCalendarCount} calendarios y permitio reaplicar la migracion.`);
  } finally {
    await client.query("SET search_path TO public").catch(() => {});
    await client.query(`DROP SCHEMA IF EXISTS ${quoteIdentifier(schemaName)} CASCADE`).catch(() => {});
    const cleanup = await client
      .query("SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = $1) AS exists", [schemaName])
      .catch(() => ({ rows: [{ exists: true }] }));
    if (cleanup.rows[0]?.exists === false) {
      console.log("[ok] Esquema temporal eliminado.");
    } else {
      console.error("[fail] No se pudo confirmar la eliminacion del esquema temporal.");
      process.exitCode = 1;
    }
    await client.end();
  }
}

async function assertUniqueViolation(operation) {
  return assertPgErrorCode(
    operation,
    "23505",
    "PostgreSQL acepto un duplicado real que debia violar el indice unico."
  );
}

async function assertPgErrorCode(operation, expectedCode, missingErrorMessage) {
  try {
    await operation();
  } catch (error) {
    if (error?.code === expectedCode) {
      return;
    }
    throw error;
  }
  fail(missingErrorMessage);
}

main().catch((error) => {
  console.error(`[fail] ${error.message}`);
  process.exit(1);
});
