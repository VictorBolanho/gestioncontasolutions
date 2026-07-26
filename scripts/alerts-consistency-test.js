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

async function loginOwner() {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: TEST_USERS.owner.email,
      password: TEST_USERS.owner.password
    }
  });
  await expectOk("Login owner", response);
  const payload = await response.json();
  if (!payload?.token) {
    fail("Login owner no devolvio token.");
  }
  pass("Owner autenticado");
  return payload.token;
}

function createFixtureData() {
  const now = new Date().toISOString();
  return {
    companies: [
      {
        id: "emp_alerts_fixture",
        nit: "900999111",
        dv: "4",
        razonSocial: "Alerts Fixture SAS",
        nombreComercial: "Alerts Fixture",
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
      }
    ],
    tasks: [
      {
        id: "task_alerts_fixture",
        empresaId: "emp_alerts_fixture",
        tipoTarea: "fiscal",
        origen: "fixture_test",
        titulo: "Declaracion fixture",
        descripcion: "Caso de prueba para reconciliacion de alertas",
        periodo: "julio",
        anio: 2026,
        fechaVencimiento: "2026-07-01",
        fechaLimiteInterna: "2026-06-28",
        estadoOperativo: "pendiente",
        estadoGeneral: "pendiente",
        estadoLiquidacion: "pendiente_liquidacion",
        estadoPresentacion: "pendiente_presentacion",
        estadoPago: "pendiente_pago",
        prioridad: "alta",
        responsableId: "",
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
  await Promise.all(
    Object.entries(files).map(([key, filePath]) => fs.writeFile(filePath, snapshot[key], "utf8"))
  );
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
    const token = await loginOwner();

    const generated = await request("/api/alerts/generate", {
      method: "POST",
      token,
      body: {}
    });
    await expectOk("Generacion inicial", generated);
    const generatedPayload = await generated.json();
    if (generatedPayload.createdCount !== 1) {
      fail(`Se esperaba 1 alerta creada y llegaron ${generatedPayload.createdCount}.`);
    }
    pass("Se genero una alerta inicial sin duplicados");

    const alertsAfterGeneration = await getJson("Listado alertas inicial", "/api/alerts", token);
    if (!Array.isArray(alertsAfterGeneration.items) || alertsAfterGeneration.items.length !== 1) {
      fail("El listado inicial de alertas no devolvio exactamente 1 alerta.");
    }

    const initialAlert = alertsAfterGeneration.items[0];
    if (initialAlert.estado !== "no_leida") {
      fail(`La alerta inicial debia quedar no_leida y llego ${initialAlert.estado}.`);
    }
    pass("La alerta inicia en estado no_leida");

    await patchJson("Marcar leida", `/api/alerts/${initialAlert.id}/status`, { estado: "leida" }, token);
    const readAlert = await getJson("Alertas leidas", "/api/alerts?estado=leida", token);
    const currentAlert = readAlert.items.find((item) => item.id === initialAlert.id && item.estado === "leida");
    if (!currentAlert) {
      fail("La alerta no quedo en estado leida.");
    }
    pass("La transicion no_leida -> leida funciona");

    await patchJson("Descartar alerta", `/api/alerts/${currentAlert.id}/status`, {
      estado: "descartada",
      motivo: "No requiere seguimiento adicional"
    }, token);

    const discardedAlerts = await getJson("Alertas descartadas", "/api/alerts?estado=descartada", token);
    const discardedAlert = discardedAlerts.items.find((item) => item.id === initialAlert.id);
    if (!discardedAlert) {
      fail("La alerta descartada no aparece al filtrar por estado.");
    }
    if (discardedAlert.motivoEstado !== "No requiere seguimiento adicional") {
      fail("La alerta descartada no guardo el motivo esperado.");
    }
    pass("La transicion leida -> descartada conserva motivo");

    const invalidTransition = await request(`/api/alerts/${initialAlert.id}/status`, {
      method: "PATCH",
      token,
      body: {
        estado: "leida"
      }
    });
    await expectStatus("Transicion descartada -> leida", invalidTransition, 400);
    pass("Las transiciones invalidas quedan bloqueadas");

    const regenerated = await request("/api/alerts/generate", {
      method: "POST",
      token,
      body: {}
    });
    await expectOk("Regeneracion", regenerated);
    const regeneratedPayload = await regenerated.json();
    if (regeneratedPayload.createdCount !== 0) {
      fail(`La regeneracion no debia crear nuevas alertas y creo ${regeneratedPayload.createdCount}.`);
    }
    pass("La alerta descartada no se reactiva automaticamente ni duplica el registro");

    const dashboard = await getJson("Dashboard reconciliado", "/api/dashboard", token);
    if (dashboard.summary.alertasCriticas !== 0 || dashboard.summary.alertasPreventivas !== 0) {
      fail("El dashboard siguio contando alertas cerradas como activas.");
    }
    if (Array.isArray(dashboard.criticalAlerts) && dashboard.criticalAlerts.some((item) => item.id === initialAlert.id)) {
      fail("El dashboard siguio listando una alerta descartada entre las criticas activas.");
    }
    pass("Dashboard y listado usan alertas reconciliadas consistentes");

    const audits = await getJson("Auditoria alertas", "/api/audits", token);
    if (!audits.items.some((item) => item.accion === "descartar_alerta_interna")) {
      fail("No se registro auditoria de descarte de alerta.");
    }
    pass("La auditoria registra el descarte de alerta");

    console.log("[done] Validacion de alertas y dashboard completada.");
  } finally {
    await restoreFiles(snapshot);
  }
}

main().catch((error) => {
  console.error(`[fail] ${error.message}`);
  process.exit(1);
});
