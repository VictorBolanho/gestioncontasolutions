import { initializeDeploymentDatabase } from "../apps/api/src/db/deployment-initialization.js";
import { closePgPool } from "../apps/api/src/db/postgres-client.js";

async function main() {
  const result = await initializeDeploymentDatabase();
  console.log(
    result.organizationCreated
      ? "[ok] Organizacion tecnica creada y permisos sincronizados."
      : "[ok] Inicializacion ya aplicada; permisos sincronizados sin reemplazar organizaciones."
  );
}

main()
  .catch((error) => {
    console.error(`[fail] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePgPool();
  });
