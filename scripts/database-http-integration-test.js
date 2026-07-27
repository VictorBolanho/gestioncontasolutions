import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { TEST_USERS } from "./test-credentials.js";

const API_BASE_URL = String(process.env.API_BASE_URL || "").trim();
const EXPECTED_IMPORTED_CALENDAR_COUNT = Number(process.env.EXPECTED_IMPORTED_CALENDAR_COUNT);
if (!API_BASE_URL) {
  throw new Error("Define API_BASE_URL para ejecutar la integracion HTTP.");
}
if (!Number.isSafeInteger(EXPECTED_IMPORTED_CALENDAR_COUNT) || EXPECTED_IMPORTED_CALENDAR_COUNT < 1) {
  throw new Error("Define EXPECTED_IMPORTED_CALENDAR_COUNT desde el origen JSON validado.");
}

const timings = [];

function pass(message) {
  console.log(`[ok] ${message}`);
}

async function request(pathname, { method = "GET", token = "", body, form } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const startedAt = performance.now();
  const response = await fetch(`${API_BASE_URL}${pathname}`, {
    method,
    headers,
    body: form || (body === undefined ? undefined : JSON.stringify(body))
  });
  const elapsedMs = performance.now() - startedAt;
  timings.push({ method, pathname, status: response.status, elapsedMs });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  return { response, payload, elapsedMs };
}

async function expectStatus(label, pathname, expectedStatus, options = {}) {
  const result = await request(pathname, options);
  assert.equal(result.response.status, expectedStatus, `${label}: ${JSON.stringify(result.payload)}`);
  return result.payload;
}

async function login(user) {
  const payload = await expectStatus("login", "/api/auth/login", 200, {
    method: "POST",
    body: { email: user.email, password: user.password }
  });
  assert.ok(payload.token, "El login no devolvio token.");
  return payload.token;
}

function uniqueSuffix() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

async function uploadTestRut(token, suffix) {
  const form = new FormData();
  form.append(
    "rutPdf",
    new Blob(["%PDF-1.4\n% GestorConta integration fixture\n%%EOF"], { type: "application/pdf" }),
    `rut-integracion-${suffix}.pdf`
  );
  const payload = await expectStatus("carga RUT", "/api/rut-uploads", 201, {
    method: "POST",
    token,
    form
  });
  assert.ok(payload.extractionId && payload.documentId, "La carga RUT no genero IDs.");
  return payload;
}

async function main() {
  const suffix = uniqueSuffix();
  const ownerToken = await login(TEST_USERS.owner);
  pass("Login valido de owner");

  await expectStatus("login invalido", "/api/auth/login", 401, {
    method: "POST",
    body: { email: `inexistente-${suffix}@example.test`, password: "clave-invalida-de-prueba" }
  });
  pass("Login invalido rechazado");

  const meta = await expectStatus("metadata", "/api/meta", 200);
  assert.equal(meta.version, "0.1.0");
  await expectStatus("sesion", "/api/auth/session", 200, { token: ownerToken });
  pass("Health metadata y sesion HTTP operativos");

  const companiesBefore = await expectStatus("empresas importadas", "/api/companies", 200, { token: ownerToken });
  assert.ok(companiesBefore.items.length >= 1, "No se encontro la empresa importada.");
  const importedCompanyId = companiesBefore.items[0].id;
  await expectStatus("detalle empresa importada", `/api/companies/${importedCompanyId}`, 200, { token: ownerToken });
  pass("Empresa importada consultada");

  const rut = await uploadTestRut(ownerToken, suffix);
  const nit = `91${String(suffix).slice(-7)}`;
  const companyPayload = {
    nit,
    dv: "7",
    razonSocial: `Empresa Integracion ${suffix} SAS`,
    tipoContribuyente: "Persona juridica",
    tipoPersona: "Juridica",
    pais: "COLOMBIA",
    departamento: "CUNDINAMARCA",
    municipio: "BOGOTA",
    direccionPrincipal: "Direccion ficticia de integracion",
    correoElectronico: `integracion-${suffix}@example.test`,
    responsabilidadesTributarias: [],
    obligadoLlevarContabilidad: true,
    obligadoFacturar: true
  };
  const company = await expectStatus("confirmar empresa", `/api/rut-uploads/${rut.extractionId}/confirm`, 201, {
    method: "POST",
    token: ownerToken,
    body: companyPayload
  });
  assert.equal(company.nit, nit);
  pass("Empresa temporal creada desde PDF ficticio");

  const duplicateRut = await uploadTestRut(ownerToken, `${suffix}-dup`);
  const duplicateResult = await request(`/api/rut-uploads/${duplicateRut.extractionId}/confirm`, {
    method: "POST",
    token: ownerToken,
    body: companyPayload
  });
  assert.equal(duplicateResult.response.status, 400, `Duplicado inesperado: ${JSON.stringify(duplicateResult.payload)}`);
  pass("Duplicado NIT/DV rechazado");

  const approved = await expectStatus("aprobar empresa", `/api/companies/${company.id}/approve-review`, 200, {
    method: "PATCH",
    token: ownerToken
  });
  assert.equal(approved.estadoEmpresa, "activa");
  pass("Revision aprobada y empresa activada");

  const taxes = await expectStatus("impuestos", "/api/taxes", 200, { token: ownerToken });
  const calendarTax = taxes.items.find((item) => item.nivel === "nacional") || taxes.items[0];
  assert.ok(calendarTax?.id, "No existe un impuesto para crear el calendario temporal.");
  const calendarsBefore = await expectStatus("calendarios", "/api/fiscal-calendars", 200, { token: ownerToken });
  assert.equal(calendarsBefore.items.length, EXPECTED_IMPORTED_CALENDAR_COUNT);
  const calendarPayload = {
    impuestoId: calendarTax.id,
    anio: 2099,
    periodo: `integracion-${suffix}`,
    periodicidad: "anual",
    nivel: "nacional",
    criterioVencimiento: "independiente_nit",
    tipoContribuyente: "persona_juridica",
    numeroCuota: 77,
    nombreCuota: "Cuota integracion",
    tipoPago: "cuota",
    fechaVencimiento: "2099-09-20",
    fuenteCalendario: "manual",
    estado: "borrador"
  };
  const calendar = await expectStatus("crear calendario", "/api/fiscal-calendars", 201, {
    method: "POST",
    token: ownerToken,
    body: calendarPayload
  });
  assert.ok(calendar.id);
  const duplicateCalendar = await request("/api/fiscal-calendars", {
    method: "POST",
    token: ownerToken,
    body: { ...calendarPayload, fechaVencimiento: "2099-09-21" }
  });
  assert.ok(duplicateCalendar.response.status >= 400);
  const updatedCalendar = await expectStatus("editar calendario", `/api/fiscal-calendars/${calendar.id}`, 200, {
    method: "PATCH",
    token: ownerToken,
    body: { fechaVencimiento: "2099-09-22", motivoCambio: "Integracion database" }
  });
  assert.equal(updatedCalendar.fechaVencimiento, "2099-09-22");
  await expectStatus("consultar calendario", `/api/fiscal-calendars/${calendar.id}`, 200, { token: ownerToken });
  pass("Calendario temporal creado editado consultado y duplicado rechazado");

  let obligations = await expectStatus("obligaciones empresa", `/api/companies/${company.id}/obligations`, 200, {
    token: ownerToken
  });
  let obligation = obligations.items.find((item) => item.estado !== "no_aplica");
  if (!obligation) {
    for (const tax of taxes.items) {
      const attempt = await request(`/api/companies/${company.id}/manual-obligations`, {
        method: "POST",
        token: ownerToken,
        body: {
          impuestoId: tax.id,
          nivel: tax.nivel || "nacional",
          departamentoAplicacion: "CUNDINAMARCA",
          municipioAplicacion: "BOGOTA",
          periodicidadAplicable: tax.periodicidadDefault || "anual",
          estado: "pendiente_revision",
          motivo: "Integracion database"
        }
      });
      if (attempt.response.status === 201) {
        obligation = attempt.payload.obligation;
        break;
      }
    }
  }
  assert.ok(obligation, "No fue posible obtener o crear una obligacion temporal.");
  if (obligation.estado !== "activa") {
    const confirmed = await expectStatus(
      "confirmar obligacion",
      `/api/company-obligations/${obligation.id}/confirm`,
      200,
      { method: "PATCH", token: ownerToken, body: { observaciones: "Confirmacion de integracion" } }
    );
    obligation = confirmed.obligation;
  }
  assert.equal(obligation.estado, "activa");
  pass("Obligacion analizada o creada y confirmada");

  const users = await expectStatus("usuarios", "/api/users", 200, { token: ownerToken });
  const senior = users.items.find((item) => item.email === TEST_USERS.senior.email);
  assert.ok(senior, "No se encontro senior para supervisar al usuario temporal.");
  const integrationUserEmail = `junior-integracion-${suffix}@example.test`;
  const junior = await expectStatus("crear junior temporal", "/api/users", 201, {
    method: "POST",
    token: ownerToken,
    body: {
      nombre: "Junior",
      apellido: "Integracion",
      email: integrationUserEmail,
      cargo: "Usuario temporal de integracion",
      estado: "activo",
      password: "clave-ficticia-integracion-2026",
      roles: ["junior_accountant"],
      empresasAsignadas: [company.id],
      supervisorId: senior.id,
      supervisedUsers: [],
      permisos: []
    }
  });
  assert.ok(junior.id, "No se creo el junior temporal.");
  const taskPayload = {
    empresaId: company.id,
    tipoTarea: "operativa",
    titulo: `Tarea integracion ${suffix}`,
    descripcion: "Tarea temporal database",
    fechaVencimiento: "2026-07-20",
    prioridad: "alta",
    responsableId: junior.id
  };
  const taskResult = await expectStatus("crear tarea", "/api/tasks", 201, {
    method: "POST",
    token: ownerToken,
    body: taskPayload
  });
  const task = taskResult.createdItems[0];
  assert.ok(task?.id);
  await expectStatus("estado permitido", `/api/tasks/${task.id}/status`, 200, {
    method: "PATCH",
    token: ownerToken,
    body: { estado: "en_proceso", observaciones: "Integracion" }
  });
  const invalidTransition = await request(`/api/tasks/${task.id}/status`, {
    method: "PATCH",
    token: ownerToken,
    body: { estado: "estado_imposible" }
  });
  assert.ok(invalidTransition.response.status >= 400);
  pass("Tarea creada asignada y transiciones validadas");

  const concurrentStartedAt = performance.now();
  const concurrent = await Promise.all([
    request("/api/tasks", {
      method: "POST",
      token: ownerToken,
      body: { ...taskPayload, titulo: `Concurrente A ${suffix}`, fechaVencimiento: "2099-10-01" }
    }),
    request("/api/tasks", {
      method: "POST",
      token: ownerToken,
      body: { ...taskPayload, titulo: `Concurrente B ${suffix}`, fechaVencimiento: "2099-10-02" }
    })
  ]);
  assert.ok(concurrent.every((item) => item.response.status === 201));
  const concurrentIds = concurrent.map((item) => item.payload.createdItems[0].id);
  const tasksAfterConcurrency = await expectStatus("tareas concurrentes", "/api/tasks", 200, { token: ownerToken });
  assert.ok(concurrentIds.every((id) => tasksAfterConcurrency.items.some((item) => item.id === id)));
  pass(`Dos escrituras concurrentes persistieron (${Math.round(performance.now() - concurrentStartedAt)} ms)`);

  await expectStatus("generar alertas", "/api/alerts/generate", 201, {
    method: "POST",
    token: ownerToken
  });
  const alerts = await expectStatus("listar alertas", `/api/alerts?empresaId=${company.id}`, 200, {
    token: ownerToken
  });
  assert.ok(alerts.items.length >= 1, "No se genero alerta para la tarea vencida.");
  const alert = alerts.items[0];
  await expectStatus("leer alerta", `/api/alerts/${alert.id}/status`, 200, {
    method: "PATCH",
    token: ownerToken,
    body: { estado: "leida" }
  });
  const invalidAlert = await request(`/api/alerts/${alert.id}/status`, {
    method: "PATCH",
    token: ownerToken,
    body: { estado: "no_leida" }
  });
  assert.ok(invalidAlert.response.status >= 400);
  pass("Alertas reconciliadas filtradas y transiciones validadas");

  for (const endpoint of [
    "/api/dashboard",
    "/api/dashboard/summary",
    "/api/dashboard/deadlines",
    "/api/dashboard/compliance",
    "/api/dashboard/risk",
    "/api/dashboard/workload",
    "/api/dashboard/manager-alerts"
  ]) {
    await expectStatus(`dashboard ${endpoint}`, endpoint, 200, { token: ownerToken });
  }
  const exportResult = await request("/api/reports/management/export?format=csv&type=cumplimiento", {
    token: ownerToken
  });
  assert.equal(exportResult.response.status, 200);
  assert.ok(String(exportResult.payload).length > 0);
  pass("Dashboard riesgo vencimientos carga y exportacion en memoria");

  const audits = await expectStatus("auditoria owner", "/api/audits", 200, { token: ownerToken });
  assert.ok(audits.items.some((item) => item.recursoId === company.id || item.empresaId === company.id));
  const juniorToken = await login(TEST_USERS.juniorAlpha);
  await expectStatus("auditoria junior denegada", "/api/audits", 403, { token: juniorToken });
  pass("Auditoria registrada y protegida por permisos");

  const limiterStatuses = [];
  for (let index = 0; index < 7; index += 1) {
    const attempt = await request("/api/auth/login", {
      method: "POST",
      body: { email: `limit-${suffix}@example.test`, password: "clave-invalida-de-prueba" }
    });
    limiterStatuses.push(attempt.response.status);
  }
  assert.ok(limiterStatuses.includes(429), `No se activo limitacion: ${limiterStatuses.join(",")}`);
  pass("Limitacion de intentos HTTP activada");

  await expectStatus("logout", "/api/auth/logout", 200, { method: "POST", token: juniorToken });
  await expectStatus("sesion invalidada", "/api/auth/session", 401, { token: juniorToken });
  pass("Logout invalida la sesion");

  const sorted = [...timings].sort((a, b) => a.elapsedMs - b.elapsedMs);
  const totalMs = timings.reduce((sum, item) => sum + item.elapsedMs, 0);
  const averageMs = totalMs / timings.length;
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]?.elapsedMs || 0;
  console.log(
    `BRIDGE_HTTP_TIMINGS=${JSON.stringify({
      operations: timings.length,
      averageMs: Math.round(averageMs),
      p95Ms: Math.round(p95),
      maxMs: Math.round(sorted.at(-1)?.elapsedMs || 0)
    })}`
  );
  if (process.env.INTEGRATION_STATE_FILE) {
    await fs.writeFile(
      process.env.INTEGRATION_STATE_FILE,
      JSON.stringify({
        companyId: company.id,
        calendarId: calendar.id,
        taskId: task.id,
        companyNit: nit
      }),
      { encoding: "utf8", flag: "wx" }
    );
  }
  console.log(
    `INTEGRATION_IDS=${JSON.stringify({
      companyId: company.id,
      calendarId: calendar.id,
      obligationId: obligation.id,
      taskId: task.id
    })}`
  );
  console.log("[done] Integracion HTTP con STORAGE_DRIVER=database completada.");
}

main().catch((error) => {
  console.error(`[fail] ${error.message}`);
  process.exit(1);
});
