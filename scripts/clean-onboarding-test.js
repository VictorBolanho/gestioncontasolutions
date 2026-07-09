import { TEST_USERS } from "./test-credentials.js";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

const OWNER = TEST_USERS.owner;

function fail(message) {
  throw new Error(message);
}

function pass(message) {
  console.log(`[ok] ${message}`);
}

async function expectOk(label, response) {
  if (!response.ok) {
    const body = await response.text();
    fail(`${label} fallo con ${response.status}: ${body}`);
  }

  return response;
}

async function getJson(label, path, token = "") {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  await expectOk(label, response);
  return response.json();
}

async function postJson(label, path, payload, token = "") {
  const headers = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  await expectOk(label, response);
  return response.json();
}

async function main() {
  const login = await postJson("Login owner", "/api/auth/login", OWNER);
  if (!login?.token) {
    fail("El login owner no devolvio token.");
  }
  pass("El usuario owner demo inicia sesion correctamente");

  const token = login.token;
  const bootstrap = await getJson("Bootstrap", "/api/bootstrap", token);
  if (bootstrap.currentUser?.email !== OWNER.email || bootstrap.currentUser?.primaryRole !== "owner") {
    fail("El bootstrap no devolvio al owner demo.");
  }
  if (!Array.isArray(bootstrap.companies) || bootstrap.companies.length !== 0) {
    fail(`Se esperaba bootstrap sin empresas y llegaron ${bootstrap.companies?.length ?? "datos invalidos"}.`);
  }
  pass("Bootstrap carga sin empresas");

  const companies = await getJson("Empresas", "/api/companies", token);
  if (!Array.isArray(companies.items) || companies.items.length !== 0) {
    fail(`Se esperaban 0 empresas y llegaron ${companies.items?.length ?? "datos invalidos"}.`);
  }
  pass("Modulo de empresas inicia vacio");

  const obligations = await getJson("Obligaciones", "/api/company-obligations", token);
  if (!Array.isArray(obligations.items) || obligations.items.length !== 0) {
    fail(`Se esperaban 0 obligaciones y llegaron ${obligations.items?.length ?? "datos invalidos"}.`);
  }
  pass("Obligaciones inicia vacio");

  const tasks = await getJson("Tareas", "/api/tasks", token);
  if (!Array.isArray(tasks.items) || tasks.items.length !== 0) {
    fail(`Se esperaban 0 tareas y llegaron ${tasks.items?.length ?? "datos invalidos"}.`);
  }
  pass("Tareas inicia vacio");

  const alerts = await getJson("Alertas", "/api/alerts", token);
  if (!Array.isArray(alerts.items) || alerts.items.length !== 0) {
    fail(`Se esperaban 0 alertas y llegaron ${alerts.items?.length ?? "datos invalidos"}.`);
  }
  pass("Alertas inicia vacio");

  const dashboard = await getJson("Dashboard", "/api/dashboard", token);
  if (dashboard.summary.empresasActivas !== 0) {
    fail(`Dashboard esperaba empresas activas = 0 y obtuvo ${dashboard.summary.empresasActivas}.`);
  }
  if (dashboard.summary.obligacionesFiscalesActivas !== 0) {
    fail(`Dashboard esperaba obligaciones activas = 0 y obtuvo ${dashboard.summary.obligacionesFiscalesActivas}.`);
  }
  if (dashboard.summary.tareasPendientes !== 0 || dashboard.summary.tareasEnProceso !== 0 || dashboard.summary.tareasCompletadasPresentadas !== 0 || dashboard.summary.tareasVencidas !== 0) {
    fail("Dashboard mostro metricas de tareas no vacias en onboarding limpio.");
  }
  if (dashboard.summary.alertasPreventivas !== 0 || dashboard.summary.alertasCriticas !== 0) {
    fail("Dashboard mostro alertas no vacias en onboarding limpio.");
  }
  pass("Dashboard renderiza metricas vacias honestas");

  const reportWithoutCompany = await fetch(`${API_BASE_URL}/api/reports/client-summary`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (reportWithoutCompany.status !== 400) {
    const body = await reportWithoutCompany.text();
    fail(`Reportes sin empresa debian responder 400 y devolvieron ${reportWithoutCompany.status}: ${body}`);
  }
  pass("Reportes no exportan datos falsos sin empresa");

  const users = await getJson("Usuarios", "/api/users", token);
  if (!Array.isArray(users.items) || users.items.length !== 1) {
    fail(`Se esperaba solo 1 usuario base y llegaron ${users.items?.length ?? "datos invalidos"}.`);
  }
  pass("Solo queda el owner demo como usuario base");

  const audits = await getJson("Auditoria", "/api/audits", token);
  if (!Array.isArray(audits.items)) {
    fail("La auditoria no devolvio un arreglo valido.");
  }
  if (!audits.items.some((item) => item.accion === "login" && item.usuarioId === login.user.id)) {
    fail("La auditoria no registro el login del owner demo.");
  }
  pass("Auditoria accesible para owner con eventos reales");

  console.log("[done] Onboarding limpio validado correctamente.");
}

main().catch((error) => {
  console.error(`[fail] ${error.message}`);
  process.exit(1);
});
