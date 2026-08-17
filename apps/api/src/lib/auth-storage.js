import { getStorageDriver } from "../db/database-config.js";
import {
  getCollectionFromDatabase,
  saveCollectionToDatabase
} from "../db/database-storage.js";
import { withPgClient } from "../db/postgres-client.js";
import {
  getAuditsFromJson,
  getCompaniesFromJson,
  getOrganizationFromJson,
  getSessionsFromJson,
  getUsersFromJson,
  saveAuditsToJson,
  saveSessionsToJson,
  saveUsersToJson
} from "./storage-json-driver.js";

function usesDatabase() {
  return getStorageDriver() === "database";
}

export function authStorageUsesDatabase() {
  return usesDatabase();
}

export async function getAuthUsers() {
  return usesDatabase() ? getCollectionFromDatabase("users") : getUsersFromJson();
}

export async function getAuthCompanies() {
  return usesDatabase() ? getCollectionFromDatabase("companies") : getCompaniesFromJson();
}

export async function saveAuthUser(user, users = []) {
  if (!usesDatabase()) {
    saveUsersToJson(users);
    return;
  }
  await withPgClient((client) =>
    client.query(
      `UPDATE users
       SET password_salt = $2,
           password_hash = $3,
           ultimo_login_at = $4,
           updated_at = $5,
           payload = $6::jsonb
       WHERE id = $1`,
      [
        user.id,
        user.passwordSalt || null,
        user.passwordHash || null,
        user.ultimoLoginAt || null,
        user.updatedAt || null,
        JSON.stringify(user)
      ]
    )
  );
}

export async function getAuthOrganization() {
  return usesDatabase() ? getCollectionFromDatabase("organization") : getOrganizationFromJson();
}

export async function getAuthAudits() {
  return usesDatabase() ? getCollectionFromDatabase("audits") : getAuditsFromJson();
}

export async function replaceAuthAudits(audits) {
  if (usesDatabase()) {
    await saveCollectionToDatabase("audits", audits);
  } else {
    saveAuditsToJson(audits);
  }
}

export async function appendAuthAudit(audit) {
  if (!usesDatabase()) {
    const audits = getAuditsFromJson();
    audits.push(audit);
    saveAuditsToJson(audits);
    return;
  }
  await withPgClient((client) =>
    client.query(
      `INSERT INTO audit_logs (
         id, organizacion_id, usuario_id, modulo, accion, recurso_tipo,
         recurso_id, fecha, payload, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW())`,
      [
        audit.id,
        audit.organizacionId || null,
        audit.usuarioId || null,
        audit.modulo || null,
        audit.accion || null,
        audit.recursoTipo || null,
        audit.recursoId || null,
        audit.fecha || audit.createdAt || null,
        JSON.stringify(audit)
      ]
    )
  );
}

export async function getAuthSessions() {
  return usesDatabase() ? getCollectionFromDatabase("sessions") : getSessionsFromJson();
}

export async function replaceAuthSessions(sessions) {
  if (usesDatabase()) {
    await saveCollectionToDatabase("sessions", sessions);
  } else {
    saveSessionsToJson(sessions);
  }
}

export async function cleanupDatabaseAuthSessions() {
  if (!usesDatabase()) {
    return null;
  }
  return withPgClient(async (client) => {
    const result = await client.query(
      `DELETE FROM sessions
       WHERE expires_at IS NULL
          OR expires_at <= NOW()
          OR token !~ '^sha256\\$[0-9a-fA-F]{64}$'`
    );
    return result.rowCount;
  });
}

export async function findDatabaseAuthSession(tokenHash) {
  return withPgClient(async (client) => {
    const { rows } = await client.query(
      `SELECT payload FROM sessions
       WHERE token = $1 AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    return rows[0]?.payload || null;
  });
}

export async function createAuthSession(session) {
  if (!usesDatabase()) {
    const sessions = getSessionsFromJson();
    sessions.push(session);
    saveSessionsToJson(sessions);
    return;
  }
  await withPgClient((client) =>
    client.query(
      `INSERT INTO sessions (token, user_id, expires_at, payload, created_at)
       VALUES ($1, $2, $3, $4::jsonb, $5)`,
      [session.token, session.userId, session.expiresAt, JSON.stringify(session), session.createdAt]
    )
  );
}

export async function deleteAuthSession(tokenHash) {
  if (!usesDatabase()) {
    const sessions = getSessionsFromJson().filter((session) => session.token !== tokenHash);
    saveSessionsToJson(sessions);
    return;
  }
  await withPgClient((client) => client.query("DELETE FROM sessions WHERE token = $1", [tokenHash]));
}
