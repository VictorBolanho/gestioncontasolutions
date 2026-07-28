import { bootstrapFirstAdmin } from "../apps/api/src/db/first-admin-bootstrap.js";
import { closePgPool } from "../apps/api/src/db/postgres-client.js";

async function main() {
  const result = await bootstrapFirstAdmin();
  if (result.status === "already_exists") {
    console.log("[ok] Ya existe un owner activo; no se realizaron cambios.");
    return;
  }
  console.log("[ok] Primer administrador creado y auditado.");
}

main()
  .catch((error) => {
    console.error(`[fail] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePgPool();
  });
