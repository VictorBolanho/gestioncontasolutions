import { TEST_USERS } from "./test-credentials.js";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

const USERS = {
  owner: TEST_USERS.owner,
  senior: TEST_USERS.senior,
  junior: TEST_USERS.juniorAlpha,
  apprentice: TEST_USERS.apprentice
};

function pass(scope, message) {
  console.log(`[ok] ${scope}: ${message}`);
}

function fail(scope, message) {
  throw new Error(`${scope}: ${message}`);
}

function assert(condition, scope, message) {
  if (!condition) {
    fail(scope, message);
  }
}

async function request(path, { token = "", method = "GET", body } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

async function expectStatus(scope, path, token, expectedStatus) {
  const response = await request(path, { token });
  if (response.status !== expectedStatus) {
    const body = await response.text();
    fail(scope, `esperaba ${expectedStatus} y recibio ${response.status}: ${body}`);
  }
}

async function login(user) {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: user.email,
      password: user.password
    }
  });

  if (!response.ok) {
    const body = await response.text();
    fail(user.label, `login fallo: ${body}`);
  }

  const payload = await response.json();
  assert(payload?.token, user.label, "login sin token.");
  pass(user.label, "inicio de sesion correcto");
  return payload.token;
}

async function bootstrap(token) {
  const response = await request("/api/bootstrap", { token });
  if (!response.ok) {
    const body = await response.text();
    fail("Bootstrap", `fallo con ${response.status}: ${body}`);
  }
  return response.json();
}

function hasMenu(bootstrapData, key) {
  return Array.isArray(bootstrapData.currentUser?.visibleMenuItems) && bootstrapData.currentUser.visibleMenuItems.some((item) => item.key === key);
}

async function main() {
  const ownerToken = await login(USERS.owner);
  const seniorToken = await login(USERS.senior);
  const juniorToken = await login(USERS.junior);
  const apprenticeToken = await login(USERS.apprentice);

  const owner = await bootstrap(ownerToken);
  const senior = await bootstrap(seniorToken);
  const junior = await bootstrap(juniorToken);
  const apprentice = await bootstrap(apprenticeToken);

  assert(owner.currentUser.moduleAccess.dashboard, "Owner modules", "debe ver dashboard.");
  assert(owner.currentUser.moduleAccess.empresas, "Owner modules", "debe ver empresas.");
  assert(owner.currentUser.moduleAccess.tareas, "Owner modules", "debe ver tareas.");
  assert(owner.currentUser.moduleAccess.usuarios, "Owner modules", "debe ver usuarios.");
  assert(owner.currentUser.moduleAccess.reportes, "Owner modules", "debe ver reportes.");
  assert(owner.currentUser.moduleAccess.configuracion, "Owner modules", "debe ver configuracion.");
  assert(owner.currentUser.moduleAccess.auditoria, "Owner modules", "debe ver auditoria.");
  assert(hasMenu(owner, "reports-view"), "Owner modules", "debe ver menu de reportes.");
  assert(hasMenu(owner, "config-view"), "Owner modules", "debe ver menu de configuracion.");
  assert(hasMenu(owner, "audit-view"), "Owner modules", "debe ver menu de auditoria.");
  pass("Owner modules", "acceso global visible correcto");

  assert(senior.currentUser.moduleAccess.dashboard, "Senior modules", "debe ver dashboard.");
  assert(senior.currentUser.moduleAccess.empresas, "Senior modules", "debe ver empresas.");
  assert(senior.currentUser.moduleAccess.tareas, "Senior modules", "debe ver tareas.");
  assert(senior.currentUser.moduleAccess.reportes, "Senior modules", "debe ver reportes de su alcance.");
  assert(!senior.currentUser.moduleAccess.usuarios, "Senior modules", "no debe ver usuarios globales.");
  assert(!senior.currentUser.moduleAccess.configuracion, "Senior modules", "no debe ver configuracion.");
  assert(!senior.currentUser.moduleAccess.auditoria, "Senior modules", "no debe ver auditoria.");
  assert(hasMenu(senior, "reports-view"), "Senior modules", "debe ver menu de reportes.");
  assert(!hasMenu(senior, "config-view"), "Senior modules", "no debe ver menu de configuracion.");
  assert(!hasMenu(senior, "audit-view"), "Senior modules", "no debe ver menu de auditoria.");
  pass("Senior modules", "acceso intermedio visible correcto");

  assert(junior.currentUser.moduleAccess.dashboard, "Junior modules", "debe ver dashboard de usuario.");
  assert(junior.currentUser.moduleAccess.empresas, "Junior modules", "debe ver sus empresas.");
  assert(junior.currentUser.moduleAccess.tareas, "Junior modules", "debe ver tareas.");
  assert(!junior.currentUser.moduleAccess.reportes, "Junior modules", "no debe ver reportes globales.");
  assert(!junior.currentUser.moduleAccess.usuarios, "Junior modules", "no debe ver usuarios.");
  assert(!junior.currentUser.moduleAccess.configuracion, "Junior modules", "no debe ver configuracion.");
  assert(!junior.currentUser.moduleAccess.auditoria, "Junior modules", "no debe ver auditoria.");
  assert(!hasMenu(junior, "reports-view"), "Junior modules", "no debe ver menu de reportes.");
  assert(!hasMenu(junior, "users-admin"), "Junior modules", "no debe ver menu de usuarios.");
  pass("Junior modules", "acceso operativo visible correcto");

  assert(apprentice.currentUser.moduleAccess.dashboard, "Apprentice modules", "debe ver dashboard basico.");
  assert(apprentice.currentUser.moduleAccess.tareas, "Apprentice modules", "debe ver tareas.");
  assert(!apprentice.currentUser.moduleAccess.empresas, "Apprentice modules", "no debe ver empresas.");
  assert(!apprentice.currentUser.moduleAccess.reportes, "Apprentice modules", "no debe ver reportes.");
  assert(!apprentice.currentUser.moduleAccess.usuarios, "Apprentice modules", "no debe ver usuarios.");
  assert(!apprentice.currentUser.moduleAccess.configuracion, "Apprentice modules", "no debe ver configuracion.");
  assert(!apprentice.currentUser.moduleAccess.auditoria, "Apprentice modules", "no debe ver auditoria.");
  assert(!hasMenu(apprentice, "reports-view"), "Apprentice modules", "no debe ver menu de reportes.");
  assert(!hasMenu(apprentice, "audit-view"), "Apprentice modules", "no debe ver menu de auditoria.");
  pass("Apprentice modules", "acceso minimo visible correcto");

  await expectStatus("Owner audits", "/api/audits", ownerToken, 200);
  await expectStatus("Senior audits blocked", "/api/audits", seniorToken, 403);
  await expectStatus("Junior audits blocked", "/api/audits", juniorToken, 403);
  await expectStatus("Apprentice audits blocked", "/api/audits", apprenticeToken, 403);
  pass("Audit endpoint", "solo owner puede consultar auditoria");

  console.log("[done] Validacion de acceso por modulo completada.");
}

main().catch((error) => {
  console.error(`[fail] ${error.message}`);
  process.exit(1);
});
