const VALID_NODE_ENVIRONMENTS = new Set(["development", "test", "production"]);

function normalizeBoolean(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  throw new Error("ALLOW_DEMO_SEEDS debe ser true o false.");
}

export function getRuntimeEnvironment(env = process.env) {
  const nodeEnv = String(env.NODE_ENV ?? "").trim().toLowerCase();
  if (!VALID_NODE_ENVIRONMENTS.has(nodeEnv)) {
    throw new Error("NODE_ENV debe definirse explicitamente como development, test o production.");
  }

  const demoSeedsRequested = normalizeBoolean(env.ALLOW_DEMO_SEEDS);
  if (nodeEnv === "production" && demoSeedsRequested) {
    throw new Error("Las semillas demo estan prohibidas en production.");
  }

  const demoSeedPassword = String(env.DEV_SEED_PASSWORD ?? "");
  if (demoSeedsRequested && !demoSeedPassword.trim()) {
    throw new Error("DEV_SEED_PASSWORD es obligatorio cuando ALLOW_DEMO_SEEDS=true.");
  }

  return Object.freeze({
    nodeEnv,
    isProduction: nodeEnv === "production",
    demoSeedsEnabled: demoSeedsRequested,
    demoSeedPassword: demoSeedsRequested ? demoSeedPassword : ""
  });
}

export const runtimeEnvironment = getRuntimeEnvironment();
