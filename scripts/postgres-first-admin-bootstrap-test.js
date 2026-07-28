import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";
import { Client } from "pg";

const databaseUrl = String(process.env.GESTORCONTA_TEMP_DATABASE_URL || "");
if (!databaseUrl || databaseUrl !== String(process.env.DATABASE_URL || "")) {
  throw new Error("La prueba de bootstrap exige la DATABASE_URL temporal creada por el orquestador.");
}

const strongPassword = "Unica!Clave#Bootstrap2026";

function bootstrapEnv(overrides = {}) {
  return {
    ...process.env,
    NODE_ENV: "production",
    STORAGE_DRIVER: "database",
    ALLOW_DEMO_SEEDS: "false",
    BOOTSTRAP_ADMIN_EMAIL: "owner.bootstrap@example.test",
    BOOTSTRAP_ADMIN_NAME: "Owner Bootstrap",
    BOOTSTRAP_ADMIN_PASSWORD: strongPassword,
    ...overrides
  };
}

function runBootstrap(env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["scripts/bootstrap-first-admin.js"], {
      cwd: process.cwd(),
      env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("exit", (code) => resolve({ code, stdout, stderr }));
  });
}

async function query(sql, params = []) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    return await client.query(sql, params);
  } finally {
    await client.end();
  }
}

async function clearBootstrapData() {
  await query("DELETE FROM audit_logs WHERE accion = 'bootstrap_primer_administrador'");
  await query("DELETE FROM users WHERE primary_role = 'owner'");
}

test.before(async () => {
  const organization = {
    id: "org_bootstrap_test",
    nombre: "Organizacion Bootstrap Test",
    estado: "activa"
  };
  await query(
    `INSERT INTO organizations (id, nombre, estado, payload, created_at, updated_at)
     VALUES ($1, $2, 'activa', $3::jsonb, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET estado = 'activa', deleted_at = NULL`,
    [organization.id, organization.nombre, JSON.stringify(organization)]
  );
  await query(
    `INSERT INTO roles (id, nombre, etiqueta)
     VALUES ('owner', 'owner', 'Owner')
     ON CONFLICT (id) DO NOTHING`
  );
});

test.beforeEach(clearBootstrapData);

test("crea un owner activo con rol, hash scrypt y auditoria no sensible", async () => {
  const result = await runBootstrap(bootstrapEnv());
  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /Unica!Clave|postgresql:\/\//);
  const owner = await query(`
    SELECT u.id, u.email, u.password_hash, ur.role_id
    FROM users u JOIN user_roles ur ON ur.user_id = u.id
    WHERE u.primary_role = 'owner' AND u.estado = 'activo'
  `);
  assert.equal(owner.rowCount, 1);
  assert.equal(owner.rows[0].role_id, "owner");
  assert.match(owner.rows[0].password_hash, /^scrypt\$v2\$/);
  const audit = await query(
    "SELECT payload::text FROM audit_logs WHERE accion = 'bootstrap_primer_administrador'"
  );
  assert.equal(audit.rowCount, 1);
  assert.doesNotMatch(audit.rows[0].payload, /password|contrasena|postgresql:\/\//i);
});

test("la repeticion es idempotente", async () => {
  assert.equal((await runBootstrap(bootstrapEnv())).code, 0);
  const repeated = await runBootstrap(bootstrapEnv());
  assert.equal(repeated.code, 0, repeated.stderr);
  assert.match(repeated.stdout, /Ya existe un owner activo/);
  assert.equal(Number((await query("SELECT COUNT(*) FROM users WHERE primary_role = 'owner'")).rows[0].count), 1);
});

test("dos ejecuciones concurrentes crean un solo owner", async () => {
  const [first, second] = await Promise.all([
    runBootstrap(bootstrapEnv({ BOOTSTRAP_ADMIN_EMAIL: "owner.one@example.test" })),
    runBootstrap(bootstrapEnv({ BOOTSTRAP_ADMIN_EMAIL: "owner.two@example.test" }))
  ]);
  assert.equal(first.code, 0, first.stderr);
  assert.equal(second.code, 0, second.stderr);
  assert.equal(Number((await query("SELECT COUNT(*) FROM users WHERE primary_role = 'owner'")).rows[0].count), 1);
  assert.equal(
    Number((await query("SELECT COUNT(*) FROM audit_logs WHERE accion = 'bootstrap_primer_administrador'")).rows[0].count),
    1
  );
});

test("rechaza contrasena debil y configuracion invalida sin tocar la base", async () => {
  const weak = await runBootstrap(bootstrapEnv({ BOOTSTRAP_ADMIN_PASSWORD: "debil" }));
  assert.notEqual(weak.code, 0);
  const wrongEnvironment = await runBootstrap(bootstrapEnv({ NODE_ENV: "test" }));
  assert.notEqual(wrongEnvironment.code, 0);
  const wrongDriver = await runBootstrap(bootstrapEnv({ STORAGE_DRIVER: "json" }));
  assert.notEqual(wrongDriver.code, 0);
  assert.equal(Number((await query("SELECT COUNT(*) FROM users WHERE primary_role = 'owner'")).rows[0].count), 0);
});

test("un fallo al auditar revierte usuario y rol por completo", async () => {
  await query(`
    CREATE OR REPLACE FUNCTION reject_bootstrap_audit() RETURNS trigger AS $$
    BEGIN
      IF NEW.accion = 'bootstrap_primer_administrador' THEN
        RAISE EXCEPTION 'fallo de auditoria inducido';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    CREATE TRIGGER reject_bootstrap_audit_trigger
    BEFORE INSERT ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION reject_bootstrap_audit()
  `);
  try {
    const result = await runBootstrap(bootstrapEnv());
    assert.notEqual(result.code, 0);
    assert.equal(Number((await query("SELECT COUNT(*) FROM users WHERE primary_role = 'owner'")).rows[0].count), 0);
    assert.equal(Number((await query("SELECT COUNT(*) FROM user_roles WHERE role_id = 'owner'")).rows[0].count), 0);
  } finally {
    await query("DROP TRIGGER IF EXISTS reject_bootstrap_audit_trigger ON audit_logs");
    await query("DROP FUNCTION IF EXISTS reject_bootstrap_audit()");
  }
});
