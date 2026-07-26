import { seedDemoData, seedTechnicalData } from "../apps/api/src/db/seed.js";
import { closePgPool } from "../apps/api/src/db/postgres-client.js";

async function main() {
  const mode = String(process.argv[2] || "technical").trim().toLowerCase();
  const summary = mode === "demo" ? await seedDemoData() : await seedTechnicalData();
  console.log(`[ok] Seed ${mode} aplicada.`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(`[fail] ${error.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await closePgPool();
  });
