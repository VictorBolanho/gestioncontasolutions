import { TEST_USERS } from "./test-credentials.js";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const WEB_BASE_URL = process.env.WEB_BASE_URL || "http://localhost:3000";

const DEMO_USER = TEST_USERS.owner;

async function expectOk(label, response) {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} fallo con ${response.status}: ${body}`);
  }

  return response;
}

async function getJson(label, path, headers = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  await expectOk(label, response);
  return response.json();
}

async function postJson(label, path, payload, headers = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(payload)
  });
  await expectOk(label, response);
  return response.json();
}

function logPass(message) {
  console.log(`[ok] ${message}`);
}

async function main() {
  const webResponse = await fetch(WEB_BASE_URL);
  await expectOk("Frontend", webResponse);
  logPass(`Frontend disponible en ${WEB_BASE_URL}`);

  const health = await getJson("Health", "/health");
  if (health.status !== "ok") {
    throw new Error(`Health inesperado: ${JSON.stringify(health)}`);
  }
  logPass("API responde /health");

  const login = await postJson("Login", "/api/auth/login", DEMO_USER);
  if (!login?.token) {
    throw new Error("Login no devolvio token.");
  }
  logPass("Login administrativo correcto");

  const authHeaders = {
    Authorization: `Bearer ${login.token}`
  };

  const bootstrap = await getJson("Bootstrap", "/api/bootstrap", authHeaders);
  if (!bootstrap?.currentUser?.id) {
    throw new Error("Bootstrap no devolvio usuario autenticado.");
  }
  if (bootstrap.currentUser?.email !== DEMO_USER.email) {
    throw new Error(`Bootstrap devolvio un owner inesperado: ${bootstrap.currentUser?.email || "sin correo"}.`);
  }
  if (bootstrap.currentUser?.primaryRole !== "owner") {
    throw new Error(`El usuario principal no quedo como owner: ${bootstrap.currentUser?.primaryRole || "sin rol"}.`);
  }
  if (!bootstrap.currentUser?.moduleAccess?.empresas || !bootstrap.currentUser?.moduleAccess?.usuarios || !bootstrap.currentUser?.moduleAccess?.dashboard) {
    throw new Error("El owner no tiene acceso total a los modulos clave.");
  }
  logPass("Bootstrap operativo");

  const companies = await getJson("Empresas", "/api/companies", authHeaders);
  if (!Array.isArray(companies?.items)) {
    throw new Error("La lista de empresas no tiene el formato esperado.");
  }
  logPass(`Empresas cargadas: ${companies.items.length}`);

  const dashboard = await getJson("Dashboard", "/api/dashboard", authHeaders);
  if (!dashboard || typeof dashboard !== "object") {
    throw new Error("Dashboard vacio o invalido.");
  }
  logPass("Dashboard operativo");

  const tasks = await getJson("Tareas", "/api/tasks", authHeaders);
  if (!Array.isArray(tasks?.items)) {
    throw new Error("La lista de tareas no tiene el formato esperado.");
  }
  logPass(`Tareas cargadas: ${tasks.items.length}`);

  const users = await getJson("Usuarios", "/api/users", authHeaders);
  if (!Array.isArray(users?.items) || users.items.length === 0) {
    throw new Error("La lista de usuarios no tiene datos.");
  }
  if (!users.items.some((user) => user.email === DEMO_USER.email && user.primaryRole === "owner")) {
    throw new Error("El usuario owner demo no aparece en el modulo de usuarios.");
  }
  const isCleanOnboarding = companies.items.length === 0;
  if (!isCleanOnboarding) {
    if (!users.items.some((user) => user.primaryRole === "senior_accountant")) {
      throw new Error("Falta el rol senior_accountant en las semillas.");
    }
    if (!users.items.some((user) => user.primaryRole === "junior_accountant")) {
      throw new Error("Falta el rol junior_accountant en las semillas.");
    }
    if (!users.items.some((user) => user.primaryRole === "apprentice")) {
      throw new Error("Falta el rol apprentice en las semillas.");
    }
  }
  logPass(`Usuarios cargados: ${users.items.length}`);

  const alerts = await postJson("Generacion de alertas", "/api/alerts/generate", {}, authHeaders);
  if (typeof alerts?.createdCount !== "number") {
    throw new Error("La generacion de alertas no devolvio createdCount.");
  }
  logPass(`Alertas procesadas: ${alerts.createdCount}`);

  const firstCompanyId = companies.items[0]?.id;
  if (firstCompanyId) {
    const reportResponse = await fetch(
      `${API_BASE_URL}/api/reports/client-summary?companyId=${encodeURIComponent(firstCompanyId)}`,
      { headers: authHeaders }
    );
    await expectOk("Reporte cliente", reportResponse);
    logPass(`Reporte cliente generado para ${firstCompanyId}`);
  } else {
    logPass("Sin empresas demo: se omite la exportacion de reporte cliente");
  }

  console.log("[done] Prueba de humo completada.");
}

main().catch((error) => {
  console.error(`[fail] ${error.message}`);
  process.exit(1);
});
