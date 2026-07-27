const GENERIC_TEST_PASSWORD = String(process.env.DEV_SEED_PASSWORD || "");

if (!GENERIC_TEST_PASSWORD) {
  throw new Error("DEV_SEED_PASSWORD es obligatorio para usar las credenciales demo de prueba.");
}

function readEnv(name, fallback) {
  const value = String(process.env[name] || "").trim();
  return value || fallback;
}

export const TEST_USERS = {
  owner: {
    label: "Owner / Demo Owner",
    email: readEnv("TEST_ADMIN_EMAIL", "owner.demo@example.test"),
    password: readEnv("TEST_ADMIN_PASSWORD", GENERIC_TEST_PASSWORD)
  },
  senior: {
    label: "Senior / Demo Senior",
    email: readEnv("TEST_FISCAL_EMAIL", "senior.demo@example.test"),
    password: readEnv("TEST_FISCAL_PASSWORD", GENERIC_TEST_PASSWORD)
  },
  juniorAlpha: {
    label: "Junior / Demo Alpha",
    email: readEnv("TEST_JUNIOR_EMAIL", "junior.alpha@example.test"),
    password: readEnv("TEST_JUNIOR_PASSWORD", GENERIC_TEST_PASSWORD)
  },
  juniorBeta: {
    label: "Junior / Demo Beta",
    email: readEnv("TEST_JUNIOR_BETA_EMAIL", "junior.beta@example.test"),
    password: readEnv("TEST_JUNIOR_BETA_PASSWORD", GENERIC_TEST_PASSWORD)
  },
  apprentice: {
    label: "Apprentice / Demo Apprentice",
    email: readEnv("TEST_APPRENTICE_EMAIL", "apprentice.demo@example.test"),
    password: readEnv("TEST_APPRENTICE_PASSWORD", GENERIC_TEST_PASSWORD)
  }
};

export const TEST_FALLBACKS = {
  genericPassword: GENERIC_TEST_PASSWORD,
  tempUserEmail: readEnv("TEST_TEMP_USER_EMAIL", "temp.user@example.test"),
  tempUserPassword: readEnv("TEST_TEMP_USER_PASSWORD", GENERIC_TEST_PASSWORD),
  deniedUserEmail: readEnv("TEST_DENIED_USER_EMAIL", "blocked.user@example.test"),
  deniedUserPassword: readEnv("TEST_DENIED_USER_PASSWORD", GENERIC_TEST_PASSWORD)
};
