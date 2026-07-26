import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TEST_USERS } from "./test-credentials.js";
import { resolveConfiguredDataDirectory } from "../apps/api/src/lib/data-directory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const dataDir = resolveConfiguredDataDirectory(path.join(projectRoot, "apps", "api", "data"));
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

const files = {
  companies: path.join(dataDir, "companies.json"),
  tasks: path.join(dataDir, "fiscal-tasks.json"),
  alerts: path.join(dataDir, "internal-alerts.json"),
  audits: path.join(dataDir, "audits.json")
};

function fail(message) {
  throw new Error(message);
}

function pass(message) {
  console.log(`[ok] ${message}`);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function expectOk(label, response) {
  if (!response.ok) {
    const body = await response.text();
    fail(`${label} fallo con ${response.status}: ${body}`);
  }

  return response;
}

async function expectStatus(label, response, expectedStatus) {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    fail(`${label} esperaba ${expectedStatus} y recibio ${response.status}: ${body}`);
  }

  return response;
}

async function request(pathname, { method = "GET", token = "", body } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${API_BASE_URL}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

async function login(user) {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: user.email,
      password: user.password
    }
  });
  await expectOk(`Login ${user.label}`, response);
  const payload = await response.json();
  if (!payload?.token) {
    fail(`Login ${user.label} no devolvio token.`);
  }
  pass(`${user.label} autenticado`);
  return payload.token;
}

function createFixtureData() {
  const now = new Date().toISOString();
  const currentDate = today();

  return {
    companies: [
      {
        id: "emp_acme",
        nit: "900100200",
        dv: "1",
        razonSocial: "Acme Alerts SAS",
        nombreComercial: "Acme Alerts",
        tipoContribuyente: "persona_juridica",
        tipoPersona: "juridica",
        regimenTributario: "ordinario",
        direccionSeccional: "Bogota",
        estadoEmpresa: "activa",
        permiteGenerarTareas: true,
        permiteGenerarObligaciones: true,
        visibleEnOperacion: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "emp_beta",
        nit: "900300400",
        dv: "2",
        razonSocial: "Beta Hidden SAS",
        nombreComercial: "Beta Hidden",
        tipoContribuyente: "persona_juridica",
        tipoPersona: "juridica",
        regimenTributario: "ordinario",
        direccionSeccional: "Medellin",
        estadoEmpresa: "activa",
        permiteGenerarTareas: true,
        permiteGenerarObligaciones: true,
        visibleEnOperacion: true,
        createdAt: now,
        updatedAt: now
      }
    ],
    tasks: [
      {
        id: "task_alert_junior_alpha",
        empresaId: "emp_acme",
        tipoTarea: "fiscal",
        origen: "fixture_test",
        titulo: "Declaracion IVA Acme",
        descripcion: "Alerta visible para junior alpha",
        periodo: "julio",
        anio: Number(currentDate.slice(0, 4)),
        fechaVencimiento: addDays(currentDate, 2),
        fechaLimiteInterna: addDays(currentDate, 1),
        estadoOperativo: "pendiente",
        estadoGeneral: "pendiente",
        estadoLiquidacion: "pendiente_liquidacion",
        estadoPresentacion: "pendiente_presentacion",
        estadoPago: "pendiente_pago",
        prioridad: "alta",
        responsableId: "usr_junior_paula",
        observaciones: "",
        evidencias: [],
        soporteFiscal: {},
        bloqueoCliente: {},
        createdAt: now,
        updatedAt: now,
        creadoPor: "usr_admin",
        actualizadoPor: "usr_admin"
      },
      {
        id: "task_alert_junior_sara",
        empresaId: "emp_acme",
        tipoTarea: "fiscal",
        origen: "fixture_test",
        titulo: "Retencion vencida Acme",
        descripcion: "Alerta vencida visible para senior",
        periodo: "julio",
        anio: Number(currentDate.slice(0, 4)),
        fechaVencimiento: addDays(currentDate, -1),
        fechaLimiteInterna: addDays(currentDate, -3),
        estadoOperativo: "pendiente",
        estadoGeneral: "pendiente",
        estadoLiquidacion: "pendiente_liquidacion",
        estadoPresentacion: "pendiente_presentacion",
        estadoPago: "pendiente_pago",
        prioridad: "critica",
        responsableId: "usr_junior_sara",
        observaciones: "",
        evidencias: [],
        soporteFiscal: {},
        bloqueoCliente: {},
        createdAt: now,
        updatedAt: now,
        creadoPor: "usr_admin",
        actualizadoPor: "usr_admin"
      },
      {
        id: "task_alert_outscope",
        empresaId: "emp_beta",
        tipoTarea: "fiscal",
        origen: "fixture_test",
        titulo: "ICA Beta",
        descripcion: "Alerta fuera del alcance de junior alpha",
        periodo: "julio",
        anio: Number(currentDate.slice(0, 4)),
        fechaVencimiento: addDays(currentDate, 3),
        fechaLimiteInterna: addDays(currentDate, 2),
        estadoOperativo: "pendiente",
        estadoGeneral: "pendiente",
        estadoLiquidacion: "pendiente_liquidacion",
        estadoPresentacion: "pendiente_presentacion",
        estadoPago: "pendiente_pago",
        prioridad: "media",
        responsableId: "usr_admin",
        observaciones: "",
        evidencias: [],
        soporteFiscal: {},
        bloqueoCliente: {},
        createdAt: now,
        updatedAt: now,
        creadoPor: "usr_admin",
        actualizadoPor: "usr_admin"
      }
    ],
    alerts: [],
    audits: []
  };
}

async function snapshotFiles() {
  const entries = await Promise.all(
    Object.entries(files).map(async ([key, filePath]) => [key, await fs.readFile(filePath, "utf8")])
  );
  return Object.fromEntries(entries);
}

async function restoreFiles(snapshot) {
  await Promise.all(Object.entries(files).map(([key, filePath]) => fs.writeFile(filePath, snapshot[key], "utf8")));
}

async function writeFixtureData() {
  const fixture = createFixtureData();
  await Promise.all([
    fs.writeFile(files.companies, JSON.stringify(fixture.companies, null, 2)),
    fs.writeFile(files.tasks, JSON.stringify(fixture.tasks, null, 2)),
    fs.writeFile(files.alerts, JSON.stringify(fixture.alerts, null, 2)),
    fs.writeFile(files.audits, JSON.stringify(fixture.audits, null, 2))
  ]);
}

async function getJson(label, pathname, token) {
  const response = await request(pathname, { token });
  await expectOk(label, response);
  return response.json();
}

async function patchJson(label, pathname, body, token) {
  const response = await request(pathname, {
    method: "PATCH",
    token,
    body
  });
  await expectOk(label, response);
  return response.json();
}

async function main() {
  const snapshot = await snapshotFiles();

  try {
    await writeFixtureData();

    const ownerToken = await login(TEST_USERS.owner);
    const seniorToken = await login(TEST_USERS.senior);
    const juniorAlphaToken = await login(TEST_USERS.juniorAlpha);

    const generation = await request("/api/alerts/generate", {
      method: "POST",
      token: ownerToken,
      body: {}
    });
    await expectOk("Generacion de alertas", generation);
    const generatedPayload = await generation.json();
    if (generatedPayload.createdCount !== 3) {
      fail(`Se esperaban 3 alertas generadas y llegaron ${generatedPayload.createdCount}.`);
    }
    pass("La generacion inicial crea alertas sin duplicados");

    const allAlerts = await getJson("Listado owner", "/api/alerts", ownerToken);
    if (!Array.isArray(allAlerts.items) || allAlerts.items.length !== 3) {
      fail("El owner debia ver 3 alertas tras la generacion inicial.");
    }

    const juniorAlphaAlert = allAlerts.items.find((item) => item.responsableId === "usr_junior_paula");
    const juniorSaraAlert = allAlerts.items.find((item) => item.responsableId === "usr_junior_sara");
    const outscopeAlert = allAlerts.items.find((item) => item.empresaId === "emp_beta");
    if (!juniorAlphaAlert || !juniorSaraAlert || !outscopeAlert) {
      fail("No se pudieron identificar todas las alertas esperadas del fixture.");
    }

    const companyFilter = await getJson("Filtro por empresa", "/api/alerts?empresaId=emp_acme", ownerToken);
    if (companyFilter.items.length !== 2 || companyFilter.items.some((item) => item.empresaId !== "emp_acme")) {
      fail("El filtro por empresa no devolvio exactamente las alertas de emp_acme.");
    }
    pass("Filtro por empresa operativo");

    const responsibleFilter = await getJson(
      "Filtro por responsable",
      "/api/alerts?responsableId=usr_junior_sara",
      ownerToken
    );
    if (responsibleFilter.items.length !== 1 || responsibleFilter.items[0].responsableId !== "usr_junior_sara") {
      fail("El filtro por responsable no devolvio la alerta esperada.");
    }
    pass("Filtro por responsable operativo");

    const combinedFilter = await getJson(
      "Combinacion de filtros",
      "/api/alerts?empresaId=emp_acme&responsableId=usr_junior_sara&tipo=vencida&nivel=critica&estado=no_leida",
      ownerToken
    );
    if (combinedFilter.items.length !== 1 || combinedFilter.items[0].id !== juniorSaraAlert.id) {
      fail("La combinacion de filtros no devolvio la alerta exacta esperada.");
    }
    pass("La combinacion de filtros se aplica correctamente");

    const deniedScopeFilter = await getJson(
      "Filtro fuera de alcance",
      "/api/alerts?empresaId=emp_beta",
      juniorAlphaToken
    );
    if (deniedScopeFilter.items.length !== 0) {
      fail("Un usuario sin acceso pudo obtener alertas filtrando una empresa ajena.");
    }
    pass("La visibilidad del usuario se aplica antes que los filtros");

    await patchJson("Junior marca leida", `/api/alerts/${juniorAlphaAlert.id}/status`, { estado: "leida" }, juniorAlphaToken);
    const juniorVisibleAlerts = await getJson("Junior consulta alerta leida", "/api/alerts?estado=leida", juniorAlphaToken);
    if (!juniorVisibleAlerts.items.some((item) => item.id === juniorAlphaAlert.id && item.estado === "leida")) {
      fail("El usuario con ver_alertas no pudo marcar su alerta como leida.");
    }
    pass("Un usuario con ver_alertas puede marcar una alerta visible como leida");

    const deniedAttend = await request(`/api/alerts/${juniorAlphaAlert.id}/status`, {
      method: "PATCH",
      token: juniorAlphaToken,
      body: { estado: "atendida", motivo: "Sin permiso de gestion" }
    });
    await expectStatus("Junior atiende sin permiso", deniedAttend, 403);

    const deniedDismiss = await request(`/api/alerts/${juniorAlphaAlert.id}/status`, {
      method: "PATCH",
      token: juniorAlphaToken,
      body: { estado: "descartada", motivo: "Sin permiso de gestion" }
    });
    await expectStatus("Junior descarta sin permiso", deniedDismiss, 403);
    pass("Un usuario sin gestionar_alertas no puede atender ni descartar");

    const attendedAlert = await patchJson(
      "Senior atiende alerta",
      `/api/alerts/${juniorSaraAlert.id}/status`,
      { estado: "atendida", motivo: "Resuelto por supervisor" },
      seniorToken
    );
    if (attendedAlert.estado !== "atendida" || attendedAlert.motivoEstado !== "Resuelto por supervisor") {
      fail("La alerta atendida no conservo el estado o motivo esperado.");
    }

    const dismissedAlert = await patchJson(
      "Senior descarta alerta",
      `/api/alerts/${juniorAlphaAlert.id}/status`,
      { estado: "descartada", motivo: "Caso revisado y descartado" },
      seniorToken
    );
    if (dismissedAlert.estado !== "descartada" || dismissedAlert.motivoEstado !== "Caso revisado y descartado") {
      fail("La alerta descartada no conservo el estado o motivo esperado.");
    }
    pass("Un usuario autorizado puede atender y descartar alertas");

    const invalidTransition = await request(`/api/alerts/${juniorAlphaAlert.id}/status`, {
      method: "PATCH",
      token: seniorToken,
      body: { estado: "leida" }
    });
    await expectStatus("Transicion invalida", invalidTransition, 400);
    pass("Las alertas en estado terminal mantienen la transicion bloqueada");

    const seniorDashboard = await getJson("Dashboard senior", "/api/dashboard", seniorToken);
    if (seniorDashboard.summary.alertasCriticas !== 0 || seniorDashboard.summary.alertasPreventivas !== 0) {
      fail("El dashboard del senior siguio contando alertas terminales como activas.");
    }
    if (Array.isArray(seniorDashboard.criticalAlerts) && seniorDashboard.criticalAlerts.length !== 0) {
      fail("El dashboard del senior siguio listando alertas terminales entre las criticas activas.");
    }
    pass("Los estados terminales no impactan los indicadores activos del dashboard");

    const audits = await getJson("Auditoria de alertas", "/api/audits", ownerToken);
    const auditActions = new Set(audits.items.map((item) => item.accion));
    for (const action of [
      "marcar_alerta_leida",
      "atender_alerta_interna",
      "descartar_alerta_interna",
      "rechazar_transicion_alerta_invalida"
    ]) {
      if (!auditActions.has(action)) {
        fail(`Falta la auditoria esperada para ${action}.`);
      }
    }
    pass("La auditoria registra lectura, atencion, descarte y rechazo de transicion invalida");

    console.log("[done] Validacion de filtros, permisos y trazabilidad de alertas completada.");
  } finally {
    await restoreFiles(snapshot);
  }
}

main().catch((error) => {
  console.error(`[fail] ${error.message}`);
  process.exit(1);
});
