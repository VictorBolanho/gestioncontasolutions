import {
  ALL_PERMISSIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  ROLES
} from "../../../../packages/domain/permissions.js";
import { COLLECTION_DEFINITIONS, COLLECTION_ORDER } from "./entity-definitions.js";
import { getDatabaseConfig } from "./database-config.js";
import { withPgClient, withPgTransaction } from "./postgres-client.js";

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function buildColumnsPayload(definition, item) {
  return Object.fromEntries(
    Object.entries(definition.columns).map(([column, mapper]) => [column, mapper(item)])
  );
}

async function ensureMigrationTable(client) {
  const migrationsTable = quoteIdentifier(getDatabaseConfig().migrationsTable);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${migrationsTable} (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function listTableNames(client) {
  const { rows } = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);
  return new Set(rows.map((row) => row.table_name));
}

export async function ensureDatabaseStorage() {
  return withPgClient(async (client) => {
    await ensureMigrationTable(client);
    const tableNames = await listTableNames(client);
    const missingTables = Object.values(COLLECTION_DEFINITIONS)
      .map((definition) => definition.table)
      .filter((tableName) => !tableNames.has(tableName));

    if (missingTables.length > 0) {
      throw new Error(
        `Faltan tablas en PostgreSQL: ${missingTables.join(", ")}. Ejecuta primero db:migrate antes de usar STORAGE_DRIVER=database.`
      );
    }
  });
}

async function upsertRows(client, definition, items) {
  const tableName = quoteIdentifier(definition.table);
  const columns = Object.keys(definition.columns);
  const quotedColumns = columns.map(quoteIdentifier);

  if (items.length === 0) {
    await client.query(`DELETE FROM ${tableName}`);
    return;
  }

  for (const item of items) {
    const valuesByColumn = buildColumnsPayload(definition, item);
    const values = columns.map((column) => valuesByColumn[column]);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const conflictColumn = definition.idField;
    const updateColumns = columns.filter((column) => column !== conflictColumn);
    const setClause = updateColumns.map((column) => `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`);

    await client.query(
      `
        INSERT INTO ${tableName} (${quotedColumns.join(", ")})
        VALUES (${placeholders.join(", ")})
        ON CONFLICT (${quoteIdentifier(conflictColumn)})
        DO UPDATE SET ${setClause.join(", ")}
      `,
      values
    );
  }

  const existingIds = items
    .map((item) => buildColumnsPayload(definition, item)[definition.idField])
    .filter(Boolean);

  await client.query(
    `DELETE FROM ${tableName} WHERE ${quoteIdentifier(definition.idField)} <> ALL($1::text[])`,
    [existingIds]
  );
}

export async function syncStaticSecurityData(client) {
  for (const role of ROLES) {
    await client.query(
      `
        INSERT INTO roles (id, nombre, etiqueta, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (id)
        DO UPDATE SET nombre = EXCLUDED.nombre, etiqueta = EXCLUDED.etiqueta, updated_at = NOW()
      `,
      [role, role, ROLE_LABELS[role] || role]
    );
  }

  for (const permission of ALL_PERMISSIONS) {
    await client.query(
      `
        INSERT INTO permissions (id, nombre, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (id)
        DO UPDATE SET nombre = EXCLUDED.nombre, updated_at = NOW()
      `,
      [permission, permission]
    );
  }

  await client.query("DELETE FROM role_permissions");
  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permission of permissions) {
      await client.query(
        `
          INSERT INTO role_permissions (role_id, permission_id, created_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `,
        [role, permission]
      );
    }
  }
}

async function syncUserRelations(client, users) {
  await client.query("DELETE FROM user_roles");
  await client.query("DELETE FROM user_permissions");
  await client.query("DELETE FROM company_assignments");
  await client.query("DELETE FROM supervisor_assignments");

  for (const user of users) {
    const userId = String(user?.id || "").trim();
    if (!userId) {
      continue;
    }

    for (const role of Array.isArray(user.roles) ? user.roles : []) {
      await client.query(
        `
          INSERT INTO user_roles (user_id, role_id, created_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id, role_id) DO NOTHING
        `,
        [userId, String(role).trim()]
      );
    }

    for (const permission of Array.isArray(user.permisos) ? user.permisos : []) {
      await client.query(
        `
          INSERT INTO user_permissions (user_id, permission_id, created_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id, permission_id) DO NOTHING
        `,
        [userId, String(permission).trim()]
      );
    }

    for (const companyId of Array.isArray(user.empresasAsignadas) ? user.empresasAsignadas : []) {
      await client.query(
        `
          INSERT INTO company_assignments (user_id, company_id, created_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id, company_id) DO NOTHING
        `,
        [userId, String(companyId).trim()]
      );
    }

    for (const supervisedUserId of Array.isArray(user.supervisedUsers) ? user.supervisedUsers : []) {
      await client.query(
        `
          INSERT INTO supervisor_assignments (supervisor_user_id, supervised_user_id, created_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (supervisor_user_id, supervised_user_id) DO NOTHING
        `,
        [userId, String(supervisedUserId).trim()]
      );
    }
  }
}

function mapRowsToPayload(rows) {
  return rows.map((row) => row.payload);
}

export async function getCollectionFromDatabase(collectionName) {
  const definition = COLLECTION_DEFINITIONS[collectionName];
  if (!definition) {
    throw new Error(`Coleccion no soportada por el driver database: ${collectionName}`);
  }

  return withPgClient(async (client) => {
    const { rows } = await client.query(
      `SELECT payload FROM ${quoteIdentifier(definition.table)} ORDER BY ${definition.orderBy}`
    );
    if (definition.mode === "singleton") {
      return rows[0]?.payload || {};
    }
    return mapRowsToPayload(rows);
  });
}

export async function saveCollectionToDatabase(collectionName, value) {
  const definition = COLLECTION_DEFINITIONS[collectionName];
  if (!definition) {
    throw new Error(`Coleccion no soportada por el driver database: ${collectionName}`);
  }

  return withPgTransaction(async (client) => {
    if (collectionName === "users") {
      await syncStaticSecurityData(client);
    }

    const items = definition.mode === "singleton" ? [value] : value;
    if (!Array.isArray(items)) {
      throw new Error(`La coleccion ${collectionName} esperaba un arreglo de registros.`);
    }

    await upsertRows(client, definition, items);

    if (collectionName === "users") {
      await syncUserRelations(client, items);
    }
  });
}

export async function exportCollectionsFromDatabase() {
  const output = {};
  for (const collectionName of COLLECTION_ORDER) {
    output[collectionName] = await getCollectionFromDatabase(collectionName);
  }
  return output;
}
