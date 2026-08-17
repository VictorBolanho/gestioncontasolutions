import { defaultOrganization } from "../data/seed-data.js";
import { syncStaticSecurityData } from "./database-storage.js";
import { withPgTransaction } from "./postgres-client.js";

const DEPLOYMENT_INITIALIZATION_LOCK_KEY = 347_202_609;

export async function initializeDeploymentDatabase({ transaction = withPgTransaction } = {}) {
  return transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock($1)", [DEPLOYMENT_INITIALIZATION_LOCK_KEY]);
    const organizations = await client.query("SELECT id FROM organizations ORDER BY id FOR SHARE");
    let organizationCreated = false;
    if (organizations.rowCount === 0) {
      await client.query(
        `INSERT INTO organizations (id, nombre, estado, payload)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [
          defaultOrganization.id,
          defaultOrganization.nombre,
          defaultOrganization.estado,
          JSON.stringify(defaultOrganization)
        ]
      );
      organizationCreated = true;
    }
    await syncStaticSecurityData(client);
    return { organizationCreated, organizationCount: Math.max(organizations.rowCount, 1) };
  });
}
