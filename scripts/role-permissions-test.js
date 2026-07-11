import { TEST_FALLBACKS, TEST_USERS } from "./test-credentials.js";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

const USERS = {
  owner: TEST_USERS.owner,
  senior: TEST_USERS.senior,
  juniorPaula: TEST_USERS.juniorAlpha,
  juniorSara: TEST_USERS.juniorBeta,
  apprentice: TEST_USERS.apprentice
};

function log(message) {
  console.log(message);
}

function pass(scope, message) {
  log(`[ok] ${scope}: ${message}`);
}

function fail(scope, message) {
  throw new Error(`${scope}: ${message}`);
}

async function expectOk(scope, response) {
  if (!response.ok) {
    const body = await response.text();
    fail(scope, `esperaba OK y recibio ${response.status}: ${body}`);
  }

  return response;
}

async function expectStatus(scope, response, expectedStatus) {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    fail(scope, `esperaba ${expectedStatus} y recibio ${response.status}: ${body}`);
  }

  return response;
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

async function getJson(scope, path, token) {
  const response = await request(path, { token });
  await expectOk(scope, response);
  return response.json();
}

async function postJson(scope, path, body, token) {
  const response = await request(path, { method: "POST", body, token });
  await expectOk(scope, response);
  return response.json();
}

async function patchJson(scope, path, body, token) {
  const response = await request(path, { method: "PATCH", body, token });
  await expectOk(scope, response);
  return response.json();
}

async function loginUser(user) {
  const payload = await postJson(user.label, "/api/auth/login", {
    email: user.email,
    password: user.password
  });

  if (!payload?.token || !payload?.user) {
    fail(user.label, "login sin token o usuario.");
  }

  pass(user.label, "inicio de sesion correcto");
  return payload;
}

function assert(condition, scope, message) {
  if (!condition) {
    fail(scope, message);
  }
}

async function main() {
  const sessions = {
    owner: await loginUser(USERS.owner),
    senior: await loginUser(USERS.senior),
    juniorPaula: await loginUser(USERS.juniorPaula),
    juniorSara: await loginUser(USERS.juniorSara),
    apprentice: await loginUser(USERS.apprentice)
  };

  const ownerToken = sessions.owner.token;
  const bootstrap = await getJson("Owner bootstrap", "/api/bootstrap", ownerToken);
  const companies = await getJson("Owner companies", "/api/companies", ownerToken);
  const users = await getJson("Owner users", "/api/users", ownerToken);

  assert(bootstrap.currentUser.email === USERS.owner.email, "Owner bootstrap", "owner incorrecto en bootstrap.");
  assert(bootstrap.currentUser.primaryRole === "owner", "Owner bootstrap", "rol owner no aplicado.");
  assert(bootstrap.currentUser.moduleAccess.usuarios, "Owner bootstrap", "owner sin acceso al modulo de usuarios.");
  assert(bootstrap.currentUser.moduleAccess.dashboard, "Owner bootstrap", "owner sin acceso a dashboard.");
  assert(bootstrap.currentUser.moduleAccess.empresas, "Owner bootstrap", "owner sin acceso a empresas.");
  assert(companies.items.length >= 1, "Owner companies", "owner no ve empresas.");
  assert(users.items.length >= 5, "Owner users", `owner esperaba al menos 5 usuarios semilla y vio ${users.items.length}.`);
  pass("Owner", "ve empresas, usuarios y modulos globales");

  const companyId = companies.items[0].id;
  const userByEmail = new Map(users.items.map((user) => [user.email, user]));
  const mateo = userByEmail.get(USERS.senior.email);
  const paula = userByEmail.get(USERS.juniorPaula.email);
  const sara = userByEmail.get(USERS.juniorSara.email);
  const camila = userByEmail.get(USERS.apprentice.email);

  assert(mateo && paula && sara && camila, "Owner users", "faltan usuarios demo esperados.");

  const tempUserEmail = TEST_FALLBACKS.tempUserEmail.includes("@")
    ? TEST_FALLBACKS.tempUserEmail.replace("@", `+${Date.now()}@`)
    : `temp.roles.${Date.now()}@example.com`;
  const tempUser = await postJson("Owner create user", "/api/users", {
    nombre: "Temporal",
    apellido: "Roles",
    email: tempUserEmail,
    cargo: "Analista temporal",
    estado: "activo",
    password: TEST_FALLBACKS.tempUserPassword,
    roles: ["junior_accountant"],
    empresasAsignadas: [companyId],
    supervisorId: mateo.id,
    supervisedUsers: [],
    permisos: []
  }, ownerToken);
  assert(tempUser.primaryRole === "junior_accountant", "Owner create user", "no creo usuario junior.");

  const tempUserUpdated = await patchJson("Owner update user", `/api/users/${tempUser.id}`, {
    nombre: "Temporal",
    apellido: "Roles",
    email: tempUserEmail,
    cargo: "Analista temporal",
    estado: "inactivo",
    roles: ["junior_accountant"],
    empresasAsignadas: [companyId],
    supervisorId: mateo.id,
    supervisedUsers: [],
    permisos: []
  }, ownerToken);
  assert(tempUserUpdated.estado === "inactivo", "Owner update user", "no pudo desactivar usuario.");
  pass("Owner", "crea y desactiva usuarios con supervisor y empresa");

  const paulaTask = await postJson("Owner create Paula task", "/api/tasks", {
    empresaId: companyId,
    tipoTarea: "operativa",
    titulo: "Seguimiento Paula",
    descripcion: "Tarea de prueba para Paula",
    fechaVencimiento: "2026-12-20",
    prioridad: "media",
    responsableId: paula.id
  }, ownerToken);

  const saraTask = await postJson("Owner create Sara task", "/api/tasks", {
    empresaId: companyId,
    tipoTarea: "operativa",
    titulo: "Seguimiento Sara",
    descripcion: "Tarea de prueba para Sara",
    fechaVencimiento: "2026-12-21",
    prioridad: "media",
    responsableId: sara.id
  }, ownerToken);

  const camilaTask = await postJson("Owner create Camila task", "/api/tasks", {
    empresaId: companyId,
    tipoTarea: "cumplimiento_dian",
    titulo: "Control Camila",
    descripcion: "Tarea de prueba para Camila",
    fechaVencimiento: "2026-12-22",
    prioridad: "media",
    responsableId: camila.id
  }, ownerToken);

  const paulaTaskId = paulaTask.createdItems[0].id;
  const saraTaskId = saraTask.createdItems[0].id;
  const camilaTaskId = camilaTask.createdItems[0].id;
  pass("Owner", "crea tareas para junior y apprentice");

  const seniorToken = sessions.senior.token;
  const seniorBootstrap = await getJson("Senior bootstrap", "/api/bootstrap", seniorToken);
  const seniorCompanies = await getJson("Senior companies", "/api/companies", seniorToken);
  const seniorSupervised = await getJson("Senior supervised", "/api/users/supervised", seniorToken);
  const seniorTasks = await getJson("Senior tasks", "/api/tasks", seniorToken);
  const seniorDashboard = await getJson("Senior dashboard", "/api/dashboard", seniorToken);
  const seniorResponsibles = await getJson("Senior responsibles", "/api/task-responsibles", seniorToken);

  assert(seniorCompanies.items.some((company) => company.id === companyId), "Senior companies", "Mateo no ve su empresa asignada.");
  assert(seniorSupervised.items.some((user) => user.id === paula.id), "Senior supervised", "Mateo no ve a Paula como supervisada.");
  assert(seniorSupervised.items.some((user) => user.id === sara.id), "Senior supervised", "Mateo no ve a Sara como supervisada.");
  assert(seniorSupervised.items.some((user) => user.id === camila.id), "Senior supervised", "Mateo no ve a Camila como supervisada.");
  assert(seniorTasks.items.some((task) => task.id === paulaTaskId), "Senior tasks", "Mateo no ve tarea de Paula.");
  assert(seniorTasks.items.some((task) => task.id === saraTaskId), "Senior tasks", "Mateo no ve tarea de Sara.");
  assert(seniorTasks.items.some((task) => task.id === camilaTaskId), "Senior tasks", "Mateo no ve tarea de Camila.");
  assert(seniorDashboard.scope.visibleCompanies >= 1, "Senior dashboard", "Mateo no ve dashboard de sus empresas.");
  assert(seniorResponsibles.items.every((item) => [mateo.id, paula.id, sara.id, camila.id, tempUser.id].includes(item.id)), "Senior responsibles", "Mateo ve responsables fuera de su equipo.");
  assert(seniorBootstrap.currentUser.moduleAccess.dashboard, "Senior bootstrap", "Mateo deberia ver dashboard.");
  assert(!seniorBootstrap.currentUser.moduleAccess.usuarios, "Senior bootstrap", "Mateo no deberia ver modulo global de usuarios.");
  assert(!seniorBootstrap.currentUser.visibleMenuItems.some((item) => item.key === "users-admin"), "Senior bootstrap", "Mateo no deberia ver menu de usuarios.");
  pass("Senior", "ve empresas, dashboard y equipo supervisado");

  await expectStatus("Senior users denied", await request("/api/users", { token: seniorToken }), 403);
  await expectStatus("Senior create user denied", await request("/api/users", {
    token: seniorToken,
    method: "POST",
    body: {
      nombre: "No",
      apellido: "Autorizado",
      email: TEST_FALLBACKS.deniedUserEmail,
      cargo: "No autorizado",
      estado: "activo",
      password: TEST_FALLBACKS.deniedUserPassword,
      roles: ["junior_accountant"]
    }
  }), 403);
  await expectStatus("Senior forbidden company", await request("/api/companies/emp_inexistente", { token: seniorToken }), 403);
  pass("Senior", "no administra usuarios globales ni empresas fuera de su alcance");

  const juniorPaulaToken = sessions.juniorPaula.token;
  const juniorPaulaBootstrap = await getJson("Junior Paula bootstrap", "/api/bootstrap", juniorPaulaToken);
  const juniorPaulaCompanies = await getJson("Junior Paula companies", "/api/companies", juniorPaulaToken);
  const juniorPaulaTasks = await getJson("Junior Paula tasks", "/api/tasks", juniorPaulaToken);
  const juniorPaulaDashboard = await getJson("Junior Paula dashboard", "/api/dashboard", juniorPaulaToken);
  const juniorPaulaResponsibles = await getJson("Junior Paula responsibles", "/api/task-responsibles", juniorPaulaToken);

  assert(juniorPaulaCompanies.items.some((company) => company.id === companyId), "Junior Paula companies", "Paula no ve su empresa.");
  assert(juniorPaulaTasks.items.some((task) => task.id === paulaTaskId), "Junior Paula tasks", "Paula no ve su tarea.");
  assert(!juniorPaulaTasks.items.some((task) => task.id === saraTaskId), "Junior Paula tasks", "Paula ve tarea de Sara indebidamente.");
  assert(!juniorPaulaTasks.items.some((task) => task.id === camilaTaskId), "Junior Paula tasks", "Paula ve tarea de Camila indebidamente.");
  assert(juniorPaulaDashboard.summary.tareasPendientes + juniorPaulaDashboard.summary.tareasEnProceso + juniorPaulaDashboard.summary.tareasCompletadasPresentadas >= 1, "Junior Paula dashboard", "Paula no ve su propio trabajo en dashboard.");
  assert(juniorPaulaResponsibles.items.length === 1 && juniorPaulaResponsibles.items[0].id === paula.id, "Junior Paula responsibles", "Paula ve responsables de mas.");
  assert(juniorPaulaBootstrap.currentUser.moduleAccess.dashboard, "Junior Paula bootstrap", "Paula deberia ver dashboard de usuario.");
  assert(!juniorPaulaBootstrap.currentUser.moduleAccess.usuarios, "Junior Paula bootstrap", "Paula no deberia ver usuarios.");
  assert(!juniorPaulaBootstrap.currentUser.visibleMenuItems.some((item) => item.key === "users-admin"), "Junior Paula bootstrap", "Paula no deberia ver menu de usuarios.");
  assert(!juniorPaulaBootstrap.currentUser.visibleMenuItems.some((item) => item.key === "reports-view"), "Junior Paula bootstrap", "Paula no deberia ver menu global de reportes.");
  pass("Junior Paula", "solo ve su empresa, su dashboard y sus tareas");

  await patchJson("Junior Paula status", `/api/tasks/${paulaTaskId}/status`, {
    estado: "en_proceso",
    observaciones: "Paula inicia la tarea"
  }, juniorPaulaToken);
  pass("Junior Paula", "puede registrar avances propios");

  await expectStatus("Junior Paula close denied", await request(`/api/tasks/${paulaTaskId}/close`, {
    token: juniorPaulaToken,
    method: "PATCH",
    body: {
      estado: "completada",
      observaciones: "Paula intenta cerrar"
    }
  }), 403);
  await expectStatus("Junior Paula users denied", await request("/api/users", { token: juniorPaulaToken }), 403);
  await expectStatus("Junior Paula reassign denied", await request(`/api/tasks/${paulaTaskId}/assign`, {
    token: juniorPaulaToken,
    method: "PATCH",
    body: {
      responsableId: sara.id
    }
  }), 403);
  pass("Junior Paula", "no puede cerrar tareas finales ni administrar usuarios o asignaciones");

  const juniorSaraToken = sessions.juniorSara.token;
  const juniorSaraTasks = await getJson("Junior Sara tasks", "/api/tasks", juniorSaraToken);
  assert(juniorSaraTasks.items.some((task) => task.id === saraTaskId), "Junior Sara tasks", "Sara no ve su tarea.");
  assert(!juniorSaraTasks.items.some((task) => task.id === paulaTaskId), "Junior Sara tasks", "Sara ve tarea de Paula indebidamente.");
  pass("Junior Sara", "solo ve su tarea asignada");

  const apprenticeToken = sessions.apprentice.token;
  const apprenticeTasks = await getJson("Apprentice tasks", "/api/tasks", apprenticeToken);
  const apprenticeBootstrap = await getJson("Apprentice bootstrap", "/api/bootstrap", apprenticeToken);
  const apprenticeResponsibles = await getJson("Apprentice responsibles", "/api/task-responsibles", apprenticeToken);

  assert(apprenticeTasks.items.length === 1 && apprenticeTasks.items[0].id === camilaTaskId, "Apprentice tasks", "Camila debe ver solo su tarea.");
  assert(Array.isArray(apprenticeBootstrap.companies) && apprenticeBootstrap.companies.length === 0, "Apprentice bootstrap", "Camila no deberia ver cartera de empresas.");
  assert(apprenticeResponsibles.items.length === 1 && apprenticeResponsibles.items[0].id === camila.id, "Apprentice responsibles", "Camila ve responsables de mas.");
  assert(!apprenticeBootstrap.currentUser.moduleAccess.usuarios, "Apprentice bootstrap", "Camila no deberia ver usuarios.");
  assert(!apprenticeBootstrap.currentUser.moduleAccess.reportes, "Apprentice bootstrap", "Camila no deberia ver reportes.");
  assert(!apprenticeBootstrap.currentUser.visibleMenuItems.some((item) => item.key === "users-admin"), "Apprentice bootstrap", "Camila no deberia ver menu de usuarios.");
  assert(!apprenticeBootstrap.currentUser.visibleMenuItems.some((item) => item.key === "reports-view"), "Apprentice bootstrap", "Camila no deberia ver menu de reportes.");
  pass("Apprentice", "solo ve su tarea y no ve cartera empresarial");

  await patchJson("Apprentice status", `/api/tasks/${camilaTaskId}/status`, {
    estado: "en_proceso",
    observaciones: "Camila inicia la tarea"
  }, apprenticeToken);
  await patchJson("Apprentice workflow review", `/api/tasks/${camilaTaskId}/workflow`, {
    etapaGestion: "en_revision",
    observaciones: "Camila envia a revision"
  }, apprenticeToken);
  pass("Apprentice", "puede avanzar y enviar su tarea a revision");

  await expectStatus("Apprentice approve denied", await request(`/api/tasks/${camilaTaskId}/workflow`, {
    token: apprenticeToken,
    method: "PATCH",
    body: {
      etapaGestion: "aprobada",
      observaciones: "Camila intenta aprobar"
    }
  }), 403);
  await expectStatus("Apprentice close denied", await request(`/api/tasks/${camilaTaskId}/close`, {
    token: apprenticeToken,
    method: "PATCH",
    body: {
      estado: "completada",
      observaciones: "Camila intenta cerrar"
    }
  }), 403);
  await expectStatus("Apprentice company denied", await request(`/api/companies/${companyId}`, { token: apprenticeToken }), 403);
  await expectStatus("Apprentice sensitive denied", await request(`/api/companies/${companyId}/sensitive`, { token: apprenticeToken }), 403);
  await expectStatus("Apprentice obligations denied", await request(`/api/company-obligations`, { token: apprenticeToken }), 403);
  await expectStatus("Apprentice users denied", await request(`/api/users`, { token: apprenticeToken }), 403);
  await expectStatus("Apprentice reports denied", await request(`/api/reports/client-summary?companyId=${encodeURIComponent(companyId)}`, { token: apprenticeToken }), 403);
  pass("Apprentice", "no puede aprobar, cerrar ni acceder a empresas, obligaciones, usuarios o reportes");

  log("[done] Validacion fina de permisos por rol completada.");
}

main().catch((error) => {
  console.error(`[fail] ${error.message}`);
  process.exit(1);
});
