import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TEST_FALLBACKS, TEST_USERS } from "./test-credentials.js";
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
  audits: path.join(dataDir, "audits.json"),
  obligations: path.join(dataDir, "company-obligations.json"),
  calendars: path.join(dataDir, "fiscal-calendars.json"),
  users: path.join(dataDir, "users.json"),
  sessions: path.join(dataDir, "sessions.json")
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

async function getJson(label, pathname, token) {
  const response = await request(pathname, { token });
  await expectOk(label, response);
  return response.json();
}

async function postJson(label, pathname, body, token) {
  const response = await request(pathname, {
    method: "POST",
    token,
    body
  });
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

async function snapshotFiles() {
  const entries = await Promise.all(
    Object.entries(files).map(async ([key, filePath]) => [key, await fs.readFile(filePath, "utf8")])
  );
  return Object.fromEntries(entries);
}

async function restoreFiles(snapshot) {
  await Promise.all(Object.entries(files).map(([key, filePath]) => fs.writeFile(filePath, snapshot[key], "utf8")));
}

function createFixtureData() {
  const now = new Date().toISOString();
  const currentDate = today();
  const year = Number(currentDate.slice(0, 4));

  return {
    companies: [
      {
        id: "emp_acme",
        nit: "900123456",
        dv: "7",
        razonSocial: "Acme SAS",
        nombreComercial: "Acme",
        tipoContribuyente: "persona_juridica",
        tipoPersona: "juridica",
        regimenTributario: "ordinario",
        direccionSeccional: "Bogota",
        departamento: "Cundinamarca",
        municipio: "Bogota",
        estadoEmpresa: "activa",
        fechaGeneracionRut: now,
        permiteGenerarTareas: true,
        permiteGenerarObligaciones: true,
        visibleEnOperacion: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "emp_beta",
        nit: "900987654",
        dv: "1",
        razonSocial: "Beta SAS",
        nombreComercial: "Beta",
        tipoContribuyente: "persona_juridica",
        tipoPersona: "juridica",
        regimenTributario: "ordinario",
        direccionSeccional: "Medellin",
        departamento: "Antioquia",
        municipio: "Medellin",
        estadoEmpresa: "activa",
        fechaGeneracionRut: now,
        permiteGenerarTareas: true,
        permiteGenerarObligaciones: true,
        visibleEnOperacion: true,
        createdAt: now,
        updatedAt: now
      }
    ],
    obligations: [
      {
        id: "obl_upcoming",
        empresaId: "emp_acme",
        impuestoId: "tax_iva",
        nombreObligacion: "Impuesto sobre las ventas - IVA",
        nivel: "nacional",
        aplica: true,
        motivoAplicacion: "Fixture upcoming",
        fuenteDeteccion: "fixture_test",
        periodicidad: "bimestral",
        periodicidadAplicable: "bimestral",
        eventoFiscalClave: "",
        eventoFiscal: "",
        responsabilidadRutOrigen: "",
        codigoResponsabilidadRut: "",
        municipioAplicacion: "",
        departamentoAplicacion: "",
        fechaInicioAplicacion: currentDate,
        fechaFinAplicacion: null,
        estado: "pendiente_revision",
        requiereConfirmacion: true,
        confirmadoPorUsuario: null,
        observaciones: "",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "obl_overdue",
        empresaId: "emp_acme",
        impuestoId: "tax_retencion_fuente",
        nombreObligacion: "Retencion en la fuente",
        nivel: "nacional",
        aplica: true,
        motivoAplicacion: "Fixture overdue",
        fuenteDeteccion: "fixture_test",
        periodicidad: "mensual",
        periodicidadAplicable: "mensual",
        eventoFiscalClave: "",
        eventoFiscal: "",
        responsabilidadRutOrigen: "",
        codigoResponsabilidadRut: "",
        municipioAplicacion: "",
        departamentoAplicacion: "",
        fechaInicioAplicacion: currentDate,
        fechaFinAplicacion: null,
        estado: "pendiente_revision",
        requiereConfirmacion: true,
        confirmadoPorUsuario: null,
        observaciones: "",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "obl_beta",
        empresaId: "emp_beta",
        impuestoId: "tax_gmf",
        nombreObligacion: "Gravamen a los movimientos financieros",
        nivel: "nacional",
        aplica: true,
        motivoAplicacion: "Fixture beta",
        fuenteDeteccion: "fixture_test",
        periodicidad: "semanal",
        periodicidadAplicable: "semanal",
        eventoFiscalClave: "",
        eventoFiscal: "",
        responsabilidadRutOrigen: "",
        codigoResponsabilidadRut: "",
        municipioAplicacion: "",
        departamentoAplicacion: "",
        fechaInicioAplicacion: currentDate,
        fechaFinAplicacion: null,
        estado: "pendiente_revision",
        requiereConfirmacion: true,
        confirmadoPorUsuario: null,
        observaciones: "",
        createdAt: now,
        updatedAt: now
      }
    ],
    calendars: [
      {
        id: "cal_upcoming_active",
        impuestoId: "tax_iva",
        anio: year,
        periodo: "julio-agosto",
        periodicidad: "bimestral",
        nivel: "nacional",
        pais: "COLOMBIA",
        departamento: "",
        municipioCiudad: "",
        municipio: "",
        criterioVencimiento: "independiente_nit",
        ultimoDigitoNit: "",
        rangoUltimosDigitosNit: "",
        digitoVerificacion: "",
        tipoContribuyente: "",
        regimen: "",
        eventoFiscalClave: "",
        eventoFiscal: "",
        numeroCuota: null,
        nombreCuota: "",
        tipoPago: "solo_pago",
        requiereDeclaracion: false,
        requierePago: true,
        fechaInicioPeriodo: addDays(currentDate, -30),
        fechaFinPeriodo: addDays(currentDate, 30),
        fechaVencimiento: addDays(currentDate, 2),
        fuenteCalendario: "manual",
        version: 1,
        estado: "activo",
        createdAt: now,
        updatedAt: now,
        creadoPor: "usr_admin",
        actualizadoPor: "usr_admin"
      },
      {
        id: "cal_overdue_draft",
        impuestoId: "tax_retencion_fuente",
        anio: year,
        periodo: "julio",
        periodicidad: "mensual",
        nivel: "nacional",
        pais: "COLOMBIA",
        departamento: "",
        municipioCiudad: "",
        municipio: "",
        criterioVencimiento: "independiente_nit",
        ultimoDigitoNit: "",
        rangoUltimosDigitosNit: "",
        digitoVerificacion: "",
        tipoContribuyente: "",
        regimen: "",
        eventoFiscalClave: "",
        eventoFiscal: "",
        numeroCuota: null,
        nombreCuota: "",
        tipoPago: "solo_declaracion",
        requiereDeclaracion: true,
        requierePago: false,
        fechaInicioPeriodo: addDays(currentDate, -30),
        fechaFinPeriodo: addDays(currentDate, -1),
        fechaVencimiento: addDays(currentDate, -1),
        fuenteCalendario: "manual",
        version: 1,
        estado: "borrador",
        createdAt: now,
        updatedAt: now,
        creadoPor: "usr_admin",
        actualizadoPor: "usr_admin"
      },
      {
        id: "cal_beta_active",
        impuestoId: "tax_gmf",
        anio: year,
        periodo: "semana-cierre",
        periodicidad: "semanal",
        nivel: "nacional",
        pais: "COLOMBIA",
        departamento: "",
        municipioCiudad: "",
        municipio: "",
        criterioVencimiento: "independiente_nit",
        ultimoDigitoNit: "",
        rangoUltimosDigitosNit: "",
        digitoVerificacion: "",
        tipoContribuyente: "",
        regimen: "",
        eventoFiscalClave: "",
        eventoFiscal: "",
        numeroCuota: null,
        nombreCuota: "Semana cierre",
        tipoPago: "solo_declaracion",
        requiereDeclaracion: true,
        requierePago: false,
        fechaInicioPeriodo: addDays(currentDate, -5),
        fechaFinPeriodo: addDays(currentDate, 2),
        fechaVencimiento: addDays(currentDate, 3),
        fuenteCalendario: "manual",
        version: 1,
        estado: "activo",
        createdAt: now,
        updatedAt: now,
        creadoPor: "usr_admin",
        actualizadoPor: "usr_admin"
      }
    ],
    tasks: [],
    alerts: [],
    audits: [],
    sessions: []
  };
}

async function writeFixtureData() {
  const fixture = createFixtureData();
  await Promise.all([
    fs.writeFile(files.companies, JSON.stringify(fixture.companies, null, 2)),
    fs.writeFile(files.obligations, JSON.stringify(fixture.obligations, null, 2)),
    fs.writeFile(files.calendars, JSON.stringify(fixture.calendars, null, 2)),
    fs.writeFile(files.tasks, JSON.stringify(fixture.tasks, null, 2)),
    fs.writeFile(files.alerts, JSON.stringify(fixture.alerts, null, 2)),
    fs.writeFile(files.audits, JSON.stringify(fixture.audits, null, 2)),
    fs.writeFile(files.sessions, JSON.stringify(fixture.sessions, null, 2))
  ]);
}

async function main() {
  const snapshot = await snapshotFiles();

  try {
    await writeFixtureData();
    const clientEmail = "cliente.alertas.fase6@example.test";
    const clientPassword = TEST_FALLBACKS.tempUserPassword;

    const ownerToken = await login(TEST_USERS.owner);
    const seniorToken = await login(TEST_USERS.senior);
    const juniorPaulaToken = await login(TEST_USERS.juniorAlpha);
    const juniorSaraToken = await login(TEST_USERS.juniorBeta);
    const apprenticeToken = await login(TEST_USERS.apprentice);

    const createdClient = await postJson(
      "Crear cliente temporal",
      "/api/users",
      {
        nombre: "Cliente",
        apellido: "Alertas",
        email: clientEmail,
        cargo: "Cliente externo",
        estado: "activo",
        password: clientPassword,
        roles: ["cliente"],
        empresasAsignadas: ["emp_acme"],
        supervisorId: "",
        supervisedUsers: [],
        permisos: []
      },
      ownerToken
    );
    if (createdClient.primaryRole !== "cliente") {
      fail("No se pudo crear el usuario cliente temporal.");
    }
    const clientToken = await login({
      label: "Cliente temporal",
      email: clientEmail,
      password: clientPassword
    });

    const confirmedUpcoming = await patchJson(
      "Confirmar obligacion upcoming",
      "/api/company-obligations/obl_upcoming/confirm",
      { observaciones: "Confirmada para prueba" },
      ownerToken
    );
    if ((confirmedUpcoming.taskGeneration?.createdCount || 0) !== 1) {
      fail("La obligacion confirmada con calendario activo no genero su tarea fiscal esperada.");
    }
    pass("La obligacion confirmada con calendario activo genera tarea fiscal");

    let ownerTasks = await getJson("Tareas owner tras confirmacion upcoming", "/api/tasks", ownerToken);
    const upcomingTask = ownerTasks.items.find((item) => item.obligacionFiscalEmpresaId === "obl_upcoming");
    if (!upcomingTask) {
      fail("No se encontro la tarea fiscal generada para la obligacion upcoming.");
    }
    await patchJson("Asignar tarea upcoming a Paula", `/api/tasks/${upcomingTask.id}/assign`, { responsableId: "usr_junior_paula" }, ownerToken);

    const confirmedOverdue = await patchJson(
      "Confirmar obligacion overdue",
      "/api/company-obligations/obl_overdue/confirm",
      { observaciones: "Pendiente de activar calendario" },
      ownerToken
    );
    if ((confirmedOverdue.taskGeneration?.createdCount || 0) !== 0) {
      fail("La obligacion overdue no debia generar tarea antes de activar el calendario.");
    }

    const activatedCalendar = await patchJson(
      "Activar calendario overdue",
      "/api/fiscal-calendars/cal_overdue_draft/activate",
      {},
      ownerToken
    );
    if ((activatedCalendar.taskGeneration?.createdCount || 0) !== 1) {
      fail("La activacion del calendario no genero la tarea fiscal faltante para la obligacion confirmada.");
    }
    pass("Activar un calendario cubre obligaciones activas que aun no tenian tarea");

    ownerTasks = await getJson("Tareas owner tras activar overdue", "/api/tasks", ownerToken);
    const overdueTask = ownerTasks.items.find((item) => item.obligacionFiscalEmpresaId === "obl_overdue");
    if (!overdueTask) {
      fail("No se encontro la tarea overdue generada tras activar el calendario.");
    }
    await patchJson("Asignar tarea overdue a Sara", `/api/tasks/${overdueTask.id}/assign`, { responsableId: "usr_junior_sara" }, ownerToken);

    const activatedBetaByUpdate = await patchJson(
      "Actualizar obligacion beta a activa",
      "/api/company-obligations/obl_beta",
      { estado: "activa", observaciones: "Activada desde edicion" },
      ownerToken
    );
    if ((activatedBetaByUpdate.taskGeneration?.createdCount || 0) !== 1) {
      fail("Actualizar una obligacion a activa no genero la tarea fiscal esperada.");
    }
    pass("Actualizar una obligacion a activa tambien dispara su cobertura por tareas");

    const alertGeneration = await postJson("Generar alertas", "/api/alerts/generate", {}, ownerToken);
    if (alertGeneration.createdCount !== 3) {
      fail(`Se esperaban 3 alertas iniciales y llegaron ${alertGeneration.createdCount}.`);
    }

    const ownerAlertsInitial = await getJson("Alertas owner iniciales", "/api/alerts", ownerToken);
    const upcomingAlert = ownerAlertsInitial.items.find((item) => item.tareaId === upcomingTask.id && item.tipo === "proxima_vencer");
    const overdueAlert = ownerAlertsInitial.items.find((item) => item.tareaId === overdueTask.id && item.tipo === "vencida");
    const betaAlert = ownerAlertsInitial.items.find((item) => item.empresaId === "emp_beta");

    if (!upcomingAlert || !overdueAlert || !betaAlert) {
      fail("No se encontraron todas las alertas esperadas desde tareas fiscales.");
    }
    pass("La tarea proxima y la tarea vencida generan sus alertas correspondientes");

    const seniorAlertsInitial = await getJson("Alertas senior", "/api/alerts", seniorToken);
    if (seniorAlertsInitial.items.length !== 2 || seniorAlertsInitial.items.some((item) => item.empresaId !== "emp_acme")) {
      fail("El senior no quedo limitado a las alertas de su empresa y equipo.");
    }
    pass("El senior ve alertas por empresa asignada y supervision de equipo");

    const juniorPaulaAlerts = await getJson("Alertas Paula", "/api/alerts", juniorPaulaToken);
    if (juniorPaulaAlerts.items.length !== 1 || juniorPaulaAlerts.items[0].tareaId !== upcomingTask.id) {
      fail("Paula deberia ver solo su alerta propia.");
    }

    const juniorSaraAlerts = await getJson("Alertas Sara", "/api/alerts", juniorSaraToken);
    if (juniorSaraAlerts.items.length !== 1 || juniorSaraAlerts.items[0].tareaId !== overdueTask.id) {
      fail("Sara deberia ver solo su alerta propia.");
    }

    const apprenticeAlerts = await getJson("Alertas apprentice", "/api/alerts", apprenticeToken);
    if (apprenticeAlerts.items.length !== 0) {
      fail("El aprendiz no deberia ver alertas fuera de tareas asignadas.");
    }
    pass("Owner, senior, junior y aprendiz respetan el alcance final por rol");

    const juniorForbiddenFilter = await getJson(
      "Filtro Paula sobre empresa ajena",
      "/api/alerts?empresaId=emp_beta",
      juniorPaulaToken
    );
    if (juniorForbiddenFilter.items.length !== 0) {
      fail("Un junior pudo obtener alertas filtrando una empresa ajena.");
    }
    pass("El bloqueo por empresa ajena se mantiene incluso usando filtros");

    const clientBootstrap = await getJson("Bootstrap cliente", "/api/bootstrap", clientToken);
    if (clientBootstrap.currentUser?.moduleAccess?.alertas) {
      fail("El cliente no deberia tener acceso al modulo de alertas internas.");
    }
    if ((clientBootstrap.currentUser?.visibleMenuItems || []).some((item) => item.key === "fiscal-alerts")) {
      fail("El cliente no deberia ver el menu de alertas internas.");
    }
    const clientAlerts = await request("/api/alerts", { token: clientToken });
    await expectStatus("Cliente bloqueado en alertas", clientAlerts, 403);
    pass("El rol cliente queda explicitamente bloqueado de alertas internas");

    await patchJson(
      "Descartar alerta upcoming",
      `/api/alerts/${upcomingAlert.id}/status`,
      { estado: "descartada", motivo: "Condicion ya revisada" },
      ownerToken
    );
    const regeneratedAfterDismiss = await postJson("Regenerar tras descarte", "/api/alerts/generate", {}, ownerToken);
    if (regeneratedAfterDismiss.createdCount !== 0) {
      fail("Una alerta descartada reaparecio sin cambiar la condicion.");
    }
    pass("La alerta descartada no reaparece para la misma condicion");

    const replacedCalendar = await postJson(
      "Reemplazar calendario upcoming",
      "/api/fiscal-calendars/cal_upcoming_active/replace",
      {
        fechaVencimiento: addDays(today(), 5),
        motivoCambio: "Reprogramacion oficial"
      },
      ownerToken
    );
    if ((replacedCalendar.taskSynchronization?.reprogrammedCount || 0) !== 1) {
      fail("El reemplazo de calendario no reprogramo la tarea fiscal abierta asociada.");
    }

    ownerTasks = await getJson("Tareas owner tras reemplazo", "/api/tasks", ownerToken);
    const reprogrammedTask = ownerTasks.items.find((item) => item.id === upcomingTask.id);
    if (!reprogrammedTask || reprogrammedTask.fechaVencimiento !== addDays(today(), 5)) {
      fail("La tarea fiscal no actualizo su fecha de vencimiento tras la reprogramacion.");
    }

    const regeneratedAfterReplacement = await postJson("Regenerar tras reemplazo", "/api/alerts/generate", {}, ownerToken);
    if (regeneratedAfterReplacement.createdCount !== 1) {
      fail("Una nueva condicion de vencimiento no genero la nueva alerta esperada.");
    }

    const ownerAlertsAfterReplacement = await getJson("Alertas owner tras reemplazo", "/api/alerts", ownerToken);
    const refreshedUpcomingAlert = ownerAlertsAfterReplacement.items.find(
      (item) => item.tareaId === upcomingTask.id && item.estado === "no_leida"
    );
    if (!refreshedUpcomingAlert) {
      fail("La nueva condicion de vencimiento no produjo una alerta activa.");
    }
    if (refreshedUpcomingAlert.conditionHash === upcomingAlert.conditionHash) {
      fail("El conditionHash no cambio despues de la reprogramacion real del vencimiento.");
    }
    pass("Una reprogramacion real cambia la condicion y permite una nueva alerta sin duplicar tareas");

    await patchJson(
      "Atender alerta overdue",
      `/api/alerts/${overdueAlert.id}/status`,
      { estado: "atendida", motivo: "Gestionada por el equipo" },
      ownerToken
    );
    const regeneratedAfterAttend = await postJson("Regenerar tras atencion", "/api/alerts/generate", {}, ownerToken);
    if (regeneratedAfterAttend.createdCount !== 0) {
      fail("Una alerta atendida reaparecio sin que existiera una condicion nueva.");
    }
    pass("La alerta atendida no reaparece para la misma condicion");

    await patchJson(
      "Completar tarea reprogramada",
      `/api/tasks/${reprogrammedTask.id}/close`,
      { estado: "completada", observaciones: "Cumplida tras reprogramacion" },
      ownerToken
    );
    const alertsAfterCompletion = await getJson("Alertas owner tras completar tarea", "/api/alerts", ownerToken);
    if (alertsAfterCompletion.items.some((item) => item.tareaId === reprogrammedTask.id && ["no_leida", "leida"].includes(item.estado))) {
      fail("Una tarea completada siguio apareciendo como alerta activa.");
    }
    pass("Una tarea completada deja de aparecer como alerta activa");

    const ownerOpenAlerts = alertsAfterCompletion.items.filter((item) => ["no_leida", "leida"].includes(item.estado));
    const ownerDashboard = await getJson("Dashboard owner", "/api/dashboard", ownerToken);
    const ownerPreventive = ownerOpenAlerts.filter((item) => item.nivel === "preventiva").length;
    const ownerCritical = ownerOpenAlerts.filter((item) => item.nivel === "critica").length;
    if (ownerDashboard.summary.alertasPreventivas !== ownerPreventive || ownerDashboard.summary.alertasCriticas !== ownerCritical) {
      fail("El dashboard owner no quedo sincronizado con el listado reconciliado de alertas.");
    }

    const seniorAlertsFinal = await getJson("Alertas senior finales", "/api/alerts", seniorToken);
    const seniorOpenAlerts = seniorAlertsFinal.items.filter((item) => ["no_leida", "leida"].includes(item.estado));
    const seniorDashboard = await getJson("Dashboard senior", "/api/dashboard", seniorToken);
    const seniorPreventive = seniorOpenAlerts.filter((item) => item.nivel === "preventiva").length;
    const seniorCritical = seniorOpenAlerts.filter((item) => item.nivel === "critica").length;
    if (seniorDashboard.summary.alertasPreventivas !== seniorPreventive || seniorDashboard.summary.alertasCriticas !== seniorCritical) {
      fail("El dashboard senior no coincide con las alertas visibles para su alcance.");
    }
    pass("Listado y dashboard permanecen sincronizados despues de reprogramaciones y cierres");

    console.log("[done] Validacion de cierre tecnico de alertas Fase 6 completada.");
  } finally {
    await restoreFiles(snapshot);
  }
}

main().catch((error) => {
  console.error(`[fail] ${error.message}`);
  process.exit(1);
});
