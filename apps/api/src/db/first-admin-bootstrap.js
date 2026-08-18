import crypto from "node:crypto";
import { createPasswordCredential } from "../lib/auth-crypto.js";
import { readSecretFromEnvironment } from "../lib/secret-file.js";
import { withPgTransaction } from "./postgres-client.js";

const BOOTSTRAP_LOCK_KEY = 347_202_607;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requiredSecret(env, name) {
  const value = String(env[name] || "").trim();
  if (!value) {
    throw new Error(`Falta la variable obligatoria ${name}.`);
  }
  return value;
}

function validateRuntime(env) {
  if (String(env.NODE_ENV || "").trim() !== "production") {
    throw new Error("El bootstrap solo puede ejecutarse con NODE_ENV=production.");
  }
  if (String(env.STORAGE_DRIVER || "").trim().toLowerCase() !== "database") {
    throw new Error("El bootstrap solo puede ejecutarse con STORAGE_DRIVER=database.");
  }
}

function validateEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL no contiene un correo valido.");
  }
  return email;
}

function validateName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (name.length < 3 || name.length > 120) {
    throw new Error("BOOTSTRAP_ADMIN_NAME debe tener entre 3 y 120 caracteres.");
  }
  return name;
}

function validatePassword(value, email) {
  const password = String(value || "");
  const localPart = email.split("@")[0].toLowerCase();
  const valid =
    password.length >= 14 &&
    password.length <= 256 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password) &&
    !/\s/.test(password) &&
    (localPart.length < 4 || !password.toLowerCase().includes(localPart));
  if (!valid) {
    throw new Error(
      "BOOTSTRAP_ADMIN_PASSWORD debe tener entre 14 y 256 caracteres e incluir mayuscula, minuscula, numero y simbolo; no puede contener espacios ni el usuario del correo."
    );
  }
  return password;
}

function buildUser({ id, email, name, organizationId, credential, now }) {
  return {
    id,
    nombre: name,
    apellido: "",
    nombreCompleto: name,
    email,
    organizacionId: organizationId,
    cargo: "Administrador principal",
    estado: "activo",
    roles: ["owner"],
    permisos: [],
    empresasAsignadas: [],
    supervisedUsers: [],
    supervisorId: "",
    passwordSalt: credential.passwordSalt,
    passwordHash: credential.passwordHash,
    ultimoLoginAt: null,
    createdAt: now,
    updatedAt: now
  };
}

export function readFirstAdminBootstrapInput(env = process.env) {
  validateRuntime(env);
  const email = validateEmail(requiredSecret(env, "BOOTSTRAP_ADMIN_EMAIL"));
  return {
    email,
    name: validateName(requiredSecret(env, "BOOTSTRAP_ADMIN_NAME")),
    password: validatePassword(readSecretFromEnvironment(env, "BOOTSTRAP_ADMIN_PASSWORD", { required: true }), email)
  };
}

export async function bootstrapFirstAdmin({ env = process.env, transaction = withPgTransaction } = {}) {
  const input = readFirstAdminBootstrapInput(env);

  return transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock($1)", [BOOTSTRAP_LOCK_KEY]);

    const existingOwner = await client.query(`
      SELECT u.id
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.estado = 'activo'
        AND u.deleted_at IS NULL
        AND (u.primary_role = 'owner' OR ur.role_id = 'owner')
      LIMIT 1
    `);
    if (existingOwner.rowCount > 0) {
      return { status: "already_exists" };
    }

    const organizations = await client.query(`
      SELECT id
      FROM organizations
      WHERE estado = 'activa' AND deleted_at IS NULL
      ORDER BY id
      FOR SHARE
    `);
    if (organizations.rowCount !== 1) {
      throw new Error("Debe existir exactamente una organizacion activa antes de crear el primer administrador.");
    }

    const ownerRole = await client.query("SELECT id FROM roles WHERE id = 'owner'");
    if (ownerRole.rowCount !== 1) {
      throw new Error("El rol owner no existe. Ejecuta primero las migraciones y la semilla tecnica.");
    }

    const credential = await createPasswordCredential(input.password);
    const now = new Date().toISOString();
    const userId = `usr_${crypto.randomUUID()}`;
    const user = buildUser({
      id: userId,
      email: input.email,
      name: input.name,
      organizationId: organizations.rows[0].id,
      credential,
      now
    });
    await client.query(
      `INSERT INTO users (
        id, email, estado, primary_role, supervisor_id, password_salt, password_hash,
        ultimo_login_at, payload, created_at, updated_at
      ) VALUES ($1, $2, 'activo', 'owner', NULL, $3, $4, NULL, $5::jsonb, $6, $6)`,
      [userId, input.email, credential.passwordSalt, credential.passwordHash, JSON.stringify(user), now]
    );
    await client.query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, 'owner')", [userId]);

    const auditId = `audit_${crypto.randomUUID()}`;
    const audit = {
      id: auditId,
      organizacionId: organizations.rows[0].id,
      usuarioId: userId,
      tipoUsuario: "interno",
      accion: "bootstrap_primer_administrador",
      modulo: "autenticacion",
      recursoTipo: "usuario",
      recursoId: userId,
      descripcion: "Se creo el primer administrador de la organizacion.",
      valorAnterior: null,
      valorNuevo: { estado: "activo", rol: "owner" },
      fecha: now
    };
    await client.query(
      `INSERT INTO audit_logs (
        id, organizacion_id, usuario_id, modulo, accion, recurso_tipo, recurso_id, fecha, payload
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
      [
        auditId,
        organizations.rows[0].id,
        userId,
        audit.modulo,
        audit.accion,
        audit.recursoTipo,
        userId,
        now,
        JSON.stringify(audit)
      ]
    );
    return { status: "created", userId };
  });
}
