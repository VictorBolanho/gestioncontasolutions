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
  audits: path.join(dataDir, "audits.json"),
  obligations: path.join(dataDir, "company-obligations.json"),
  calendars: path.join(dataDir, "fiscal-calendars.json"),
  sessions: path.join(dataDir, "sessions.json"),
  users: path.join(dataDir, "users.json")
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

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function updateUserAssignments(users, { ownerId, seniorId, juniorId, apprenticeId }) {
  return users.map((user) => {
    if (user.id === ownerId) {
      return {
        ...user,
        empresasAsignadas: ["emp_alpha", "emp_beta", "emp_gap"]
      };
    }

    if (user.id === seniorId) {
      return {
        ...user,
        empresasAsignadas: ["emp_alpha", "emp_beta"],
        supervisedUsers: [juniorId, apprenticeId]
      };
    }

    if (user.id === juniorId) {
      return {
        ...user,
        empresasAsignadas: ["emp_alpha"],
        supervisorId: seniorId
      };
    }

    if (user.id === apprenticeId) {
      return {
        ...user,
        empresasAsignadas: [],
        supervisorId: seniorId
      };
    }

    return user;
  });
}

function buildFixtureData(userIds) {
  const now = new Date().toISOString();
  const currentDate = today();
  const currentYear = Number(currentDate.slice(0, 4));
  const ownerId = userIds.owner;
  const juniorId = userIds.junior;
  const apprenticeId = userIds.apprentice;

  return {
    companies: [
      {
        id: "emp_alpha",
        nit: "900123456",
        dv: "7",
        razonSocial: "Compania Nandu SAS",
        nombreComercial: "Nandu",
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
        nit: "901987654",
        dv: "4",
        razonSocial: "Gestion Beta SAS",
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
      },
      {
        id: "emp_gap",
        nit: "800777333",
        dv: "2",
        razonSocial: "Seguimiento Gap SAS",
        nombreComercial: "Gap",
        tipoContribuyente: "persona_juridica",
        tipoPersona: "juridica",
        regimenTributario: "ordinario",
        direccionSeccional: "Cali",
        departamento: "Valle del Cauca",
        municipio: "Cali",
        estadoEmpresa: "pendiente_revision",
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
        id: "obl_alpha_iva",
        empresaId: "emp_alpha",
        impuestoId: "tax_iva",
        nombreObligacion: "Impuesto sobre las ventas - IVA",
        nivel: "nacional",
        aplica: true,
        motivoAplicacion: "Fixture alpha",
        fuenteDeteccion: "fixture_dashboard",
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
        estado: "activa",
        requiereConfirmacion: false,
        confirmadoPorUsuario: ownerId,
        observaciones: "",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "obl_beta_ret",
        empresaId: "emp_beta",
        impuestoId: "tax_retencion_fuente",
        nombreObligacion: "Retencion en la fuente",
        nivel: "nacional",
        aplica: true,
        motivoAplicacion: "Fixture beta",
        fuenteDeteccion: "fixture_dashboard",
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
        estado: "activa",
        requiereConfirmacion: false,
        confirmadoPorUsuario: ownerId,
        observaciones: "",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "obl_gap_ica",
        empresaId: "emp_gap",
        impuestoId: "tax_ica",
        nombreObligacion: "Industria y comercio - ICA",
        nivel: "municipal",
        aplica: true,
        motivoAplicacion: "Fixture gap",
        fuenteDeteccion: "fixture_dashboard",
        periodicidad: "bimestral",
        periodicidadAplicable: "bimestral",
        eventoFiscalClave: "",
        eventoFiscal: "",
        responsabilidadRutOrigen: "",
        codigoResponsabilidadRut: "",
        municipioAplicacion: "Cali",
        departamentoAplicacion: "Valle del Cauca",
        fechaInicioAplicacion: currentDate,
        fechaFinAplicacion: null,
        estado: "activa",
        requiereConfirmacion: false,
        confirmadoPorUsuario: ownerId,
        observaciones: "",
        createdAt: now,
        updatedAt: now
      }
    ],
    calendars: [
      {
        id: "fcal_alpha_iva",
        impuestoId: "tax_iva",
        anio: currentYear,
        periodo: "Bimestre 4",
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
        fechaInicioPeriodo: addDays(currentDate, -30),
        fechaFinPeriodo: addDays(currentDate, 30),
        fechaVencimiento: addDays(currentDate, -5),
        fuenteCalendario: "manual",
        version: 1,
        estado: "activo",
        numeroCuota: null,
        nombreCuota: "",
        tipoPago: "solo_declaracion",
        requiereDeclaracion: true,
        requierePago: false,
        createdAt: now,
        updatedAt: now,
        creadoPor: ownerId,
        actualizadoPor: ownerId
      },
      {
        id: "fcal_beta_ret",
        impuestoId: "tax_retencion_fuente",
        anio: currentYear,
        periodo: "Mes actual",
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
        fechaInicioPeriodo: currentDate,
        fechaFinPeriodo: addDays(currentDate, 30),
        fechaVencimiento: addDays(currentDate, 4),
        fuenteCalendario: "manual",
        version: 1,
        estado: "activo",
        numeroCuota: null,
        nombreCuota: "",
        tipoPago: "solo_declaracion",
        requiereDeclaracion: true,
        requierePago: false,
        createdAt: now,
        updatedAt: now,
        creadoPor: ownerId,
        actualizadoPor: ownerId
      },
      {
        id: "fcal_gap_ica",
        impuestoId: "tax_ica",
        anio: currentYear,
        periodo: "Bimestre 4",
        periodicidad: "bimestral",
        nivel: "municipal",
        pais: "COLOMBIA",
        departamento: "Valle del Cauca",
        municipioCiudad: "Cali",
        municipio: "Cali",
        criterioVencimiento: "independiente_nit",
        ultimoDigitoNit: "",
        rangoUltimosDigitosNit: "",
        digitoVerificacion: "",
        tipoContribuyente: "",
        regimen: "",
        eventoFiscalClave: "",
        eventoFiscal: "",
        fechaInicioPeriodo: currentDate,
        fechaFinPeriodo: addDays(currentDate, 60),
        fechaVencimiento: addDays(currentDate, 9),
        fuenteCalendario: "manual",
        version: 1,
        estado: "activo",
        numeroCuota: null,
        nombreCuota: "",
        tipoPago: "solo_declaracion",
        requiereDeclaracion: true,
        requierePago: false,
        createdAt: now,
        updatedAt: now,
        creadoPor: ownerId,
        actualizadoPor: ownerId
      }
    ],
    tasks: [
      {
        id: "task_alpha_overdue",
        empresaId: "emp_alpha",
        tipoTarea: "fiscal",
        origen: "calendario_fiscal",
        obligacionFiscalEmpresaId: "obl_alpha_iva",
        impuestoId: "tax_iva",
        calendarioFiscalId: "fcal_alpha_iva",
        cumplimientoFiscal: "declaracion",
        titulo: "Declaracion IVA Bimestre 4",
        descripcion: "Fixture vencida",
        anio: currentYear,
        periodo: "Bimestre 4",
        fechaInicioPeriodo: addDays(currentDate, -30),
        fechaFinPeriodo: addDays(currentDate, 30),
        fechaVencimiento: addDays(currentDate, -5),
        fechaLimiteInterna: addDays(currentDate, -8),
        estadoOperativo: "vencida",
        estadoGeneral: "vencida",
        estadoLiquidacion: "pendiente_liquidacion",
        estadoPresentacion: "pendiente_presentacion",
        estadoPago: "no_aplica",
        prioridad: "alta",
        responsableId: juniorId,
        supervisorId: userIds.senior,
        observaciones: "",
        evidencias: [],
        versionCalendario: 1,
        nombreCuota: "",
        numeroCuota: null,
        tipoPago: "solo_declaracion",
        eventoFiscalClave: "",
        eventoFiscal: "",
        createdAt: now,
        updatedAt: addDays(currentDate, -5),
        impuestoNombre: "Impuesto sobre las ventas - IVA"
      },
      {
        id: "task_beta_upcoming",
        empresaId: "emp_beta",
        tipoTarea: "fiscal",
        origen: "calendario_fiscal",
        obligacionFiscalEmpresaId: "obl_beta_ret",
        impuestoId: "tax_retencion_fuente",
        calendarioFiscalId: "fcal_beta_ret",
        cumplimientoFiscal: "declaracion",
        titulo: "Retencion en la fuente mes actual",
        descripcion: "Fixture proxima",
        anio: currentYear,
        periodo: "Mes actual",
        fechaInicioPeriodo: currentDate,
        fechaFinPeriodo: addDays(currentDate, 30),
        fechaVencimiento: addDays(currentDate, 4),
        fechaLimiteInterna: addDays(currentDate, 1),
        estadoOperativo: "pendiente",
        estadoGeneral: "pendiente",
        estadoLiquidacion: "pendiente_liquidacion",
        estadoPresentacion: "pendiente_presentacion",
        estadoPago: "no_aplica",
        prioridad: "media",
        responsableId: "",
        supervisorId: userIds.senior,
        observaciones: "",
        evidencias: [],
        versionCalendario: 1,
        nombreCuota: "",
        numeroCuota: null,
        tipoPago: "solo_declaracion",
        eventoFiscalClave: "",
        eventoFiscal: "",
        createdAt: now,
        updatedAt: now,
        impuestoNombre: "Retencion en la fuente"
      },
      {
        id: "task_beta_done",
        empresaId: "emp_beta",
        tipoTarea: "fiscal",
        origen: "calendario_fiscal",
        obligacionFiscalEmpresaId: "obl_beta_ret",
        impuestoId: "tax_retencion_fuente",
        calendarioFiscalId: "fcal_beta_ret",
        cumplimientoFiscal: "declaracion",
        titulo: "Retencion en la fuente mes anterior",
        descripcion: "Fixture completada",
        anio: currentYear,
        periodo: "Mes anterior",
        fechaInicioPeriodo: addDays(currentDate, -30),
        fechaFinPeriodo: addDays(currentDate, -1),
        fechaVencimiento: addDays(currentDate, -1),
        fechaLimiteInterna: addDays(currentDate, -4),
        estadoOperativo: "presentada",
        estadoGeneral: "presentada",
        estadoLiquidacion: "aprobada",
        estadoPresentacion: "presentada",
        estadoPago: "no_aplica",
        prioridad: "media",
        responsableId: apprenticeId,
        supervisorId: userIds.senior,
        observaciones: "",
        evidencias: [],
        versionCalendario: 1,
        nombreCuota: "",
        numeroCuota: null,
        tipoPago: "solo_declaracion",
        eventoFiscalClave: "",
        eventoFiscal: "",
        createdAt: now,
        updatedAt: now,
        etapaGestion: "presentada",
        closedAt: now,
        closedBy: apprenticeId,
        impuestoNombre: "Retencion en la fuente"
      }
    ]
  };
}

async function main() {
  const snapshot = await snapshotFiles();

  try {
    const ownerToken = await login(TEST_USERS.owner);
    const demoDashboard = await getJson("Dashboard demo seeds", "/api/dashboard", ownerToken);
    if (!demoDashboard || typeof demoDashboard.summary !== "object") {
      fail("El dashboard con semillas demo no devolvio estructura valida.");
    }
    pass("El dashboard funciona con semillas demo");

    const ownerBootstrap = await getJson("Bootstrap owner", "/api/bootstrap", ownerToken);
    const seniorToken = await login(TEST_USERS.senior);
    const seniorBootstrap = await getJson("Bootstrap senior", "/api/bootstrap", seniorToken);
    const juniorToken = await login(TEST_USERS.juniorAlpha);
    const juniorBootstrap = await getJson("Bootstrap junior", "/api/bootstrap", juniorToken);
    const apprenticeToken = await login(TEST_USERS.apprentice);
    const apprenticeBootstrap = await getJson("Bootstrap apprentice", "/api/bootstrap", apprenticeToken);

    const userIds = {
      owner: ownerBootstrap.currentUser.id,
      senior: seniorBootstrap.currentUser.id,
      junior: juniorBootstrap.currentUser.id,
      apprentice: apprenticeBootstrap.currentUser.id
    };

    const users = JSON.parse(snapshot.users);
    const fixture = buildFixtureData(userIds);
    const adjustedUsers = updateUserAssignments(users, userIds);

    await writeJson(files.sessions, []);
    await writeJson(files.audits, []);
    await writeJson(files.alerts, []);
    await writeJson(files.companies, []);
    await writeJson(files.obligations, []);
    await writeJson(files.calendars, []);
    await writeJson(files.tasks, []);

    const ownerTokenEmpty = await login(TEST_USERS.owner);
    const emptyDashboard = await getJson("Dashboard vacio", "/api/dashboard", ownerTokenEmpty);
    if (emptyDashboard.summary.empresasActivas !== 0 || emptyDashboard.summary.tareasVencidas !== 0 || emptyDashboard.compliance.porcentajeGeneralCumplimiento !== 0) {
      fail("El dashboard vacio no devolvio indicadores en cero.");
    }
    const emptyExport = await request("/api/reports/management/export?type=cumplimiento&format=csv", { token: ownerTokenEmpty });
    await expectOk("Exportacion CSV vacia", emptyExport);
    const emptyCsv = await emptyExport.text();
    if (!emptyCsv.includes("Reporte") || !emptyCsv.includes("reporte_cumplimiento")) {
      fail("La exportacion CSV vacia no incluyo metadatos esperados.");
    }
    pass("Dataset vacio cubierto sin divisiones por cero ni fallos de exportacion");

    await writeJson(files.users, adjustedUsers);
    await writeJson(files.companies, fixture.companies);
    await writeJson(files.obligations, fixture.obligations);
    await writeJson(files.calendars, fixture.calendars);
    await writeJson(files.tasks, fixture.tasks);
    await writeJson(files.alerts, []);
    await writeJson(files.sessions, []);
    await writeJson(files.audits, []);

    const ownerFixtureToken = await login(TEST_USERS.owner);
    const seniorFixtureToken = await login(TEST_USERS.senior);
    const juniorFixtureToken = await login(TEST_USERS.juniorAlpha);
    const apprenticeFixtureToken = await login(TEST_USERS.apprentice);

    await postJson("Generar alertas fixture", "/api/alerts/generate", {}, ownerFixtureToken);

    const ownerDashboard = await getJson("Dashboard owner fixture", "/api/dashboard", ownerFixtureToken);
    if (ownerDashboard.summary.empresasActivas !== 2) {
      fail(`Owner esperaba 2 empresas activas y obtuvo ${ownerDashboard.summary.empresasActivas}.`);
    }
    if (ownerDashboard.summary.empresasEnSeguimiento !== 1) {
      fail("Owner no detecto la empresa en seguimiento.");
    }
    if (ownerDashboard.summary.empresasSinResponsableAsignado < 1) {
      fail("Owner no detecto empresas sin responsable asignado.");
    }
    if (ownerDashboard.summary.alertasVencidas < 1 || ownerDashboard.summary.alertasProximas < 1) {
      fail("Owner no detecto alertas proximas y vencidas desde tareas.");
    }
    if (ownerDashboard.compliance.tareasEsperadas !== 3 || ownerDashboard.compliance.tareasCumplidas !== 1) {
      fail("El calculo de cumplimiento general no coincide con el dataset fixture.");
    }
    if (ownerDashboard.compliance.porcentajeGeneralCumplimiento !== 33) {
      fail(`Cumplimiento general esperado 33 y se obtuvo ${ownerDashboard.compliance.porcentajeGeneralCumplimiento}.`);
    }
    pass("Indicadores generales y formula de cumplimiento calculados correctamente");

    const alphaRisk = ownerDashboard.riskByCompany.find((item) => item.empresaId === "emp_alpha");
    const betaRisk = ownerDashboard.riskByCompany.find((item) => item.empresaId === "emp_beta");
    if (!alphaRisk || alphaRisk.nivelRiesgo !== "alto") {
      fail("La empresa Alpha debio quedar en riesgo alto por tarea vencida.");
    }
    if (!betaRisk || !["medio", "bajo"].includes(betaRisk.nivelRiesgo)) {
      fail("La empresa Beta debio quedar al menos en riesgo bajo o medio.");
    }
    pass("Clasificacion de riesgo calculada y visible");

    if (!ownerDashboard.managementAlerts.obligacionesActivasSinTareaFiscal.some((item) => item.empresaId === "emp_gap")) {
      fail("No se detecto la obligacion activa sin tarea fiscal para la empresa gap.");
    }
    if (!ownerDashboard.managementAlerts.tareasProximasSinResponsable.some((item) => item.empresaId === "emp_beta")) {
      fail("No se detecto la tarea proxima sin responsable.");
    }
    pass("Alertas gerenciales de inconsistencia y tareas sin responsable cubiertas");

    const dateFiltered = await getJson("Dashboard filtrado por fecha", `/api/dashboard?fechaDesde=${encodeURIComponent(addDays(today(), 1))}&fechaHasta=${encodeURIComponent(addDays(today(), 10))}`, ownerFixtureToken);
    if (dateFiltered.summary.tareasVencidas !== 0 || dateFiltered.summary.tareasPendientes < 1) {
      fail("El filtro por fechas no aplico correctamente sobre el dashboard.");
    }
    pass("Filtro por fechas aplicado");

    const companyFiltered = await getJson("Dashboard filtrado por empresa", "/api/dashboard?empresaId=emp_alpha", ownerFixtureToken);
    if (companyFiltered.summary.empresasActivas !== 1 || !companyFiltered.riskByCompany.every((item) => item.empresaId === "emp_alpha")) {
      fail("El filtro por empresa no redujo correctamente el alcance.");
    }
    pass("Filtro por empresa aplicado");

    const responsibleFiltered = await getJson("Dashboard filtrado por responsable", `/api/dashboard?responsableId=${encodeURIComponent(userIds.junior)}`, ownerFixtureToken);
    if (responsibleFiltered.summary.tareasVencidas !== 1 || responsibleFiltered.workloadByUser.some((item) => item.usuarioId !== userIds.junior)) {
      fail("El filtro por responsable no devolvio solo el trabajo del responsable indicado.");
    }
    pass("Filtro por responsable aplicado");

    const seniorDashboard = await getJson("Dashboard senior fixture", "/api/dashboard", seniorFixtureToken);
    if (!seniorDashboard.riskByCompany.some((item) => item.empresaId === "emp_alpha")) {
      fail("El senior no ve la empresa de su equipo.");
    }
    pass("El senior ve empresas y personas supervisadas");

    const juniorDashboard = await getJson("Dashboard junior fixture", "/api/dashboard", juniorFixtureToken);
    if (juniorDashboard.summary.tareasVencidas !== 1 || juniorDashboard.riskByCompany.some((item) => item.empresaId !== "emp_alpha")) {
      fail("El junior vio datos fuera de su propio alcance.");
    }
    pass("El junior queda restringido a su trabajo visible");

    const apprenticeDashboard = await getJson("Dashboard apprentice fixture", "/api/dashboard", apprenticeFixtureToken);
    if (apprenticeDashboard.summary.tareasCompletadasPresentadas < 1 || apprenticeDashboard.workloadByUser.some((item) => item.usuarioId !== userIds.apprentice)) {
      fail("El aprendiz no quedo limitado a sus tareas visibles.");
    }
    pass("El aprendiz solo ve informacion de sus tareas");

    const deniedClientReport = await request("/api/reports/management?type=cumplimiento", { token: juniorFixtureToken });
    await expectStatus("Junior reportes denegados", deniedClientReport, 403);
    pass("Los reportes gerenciales siguen protegidos por permiso");

    const riskReport = await getJson("Reporte riesgo", "/api/reports/management?type=riesgo_empresas", ownerFixtureToken);
    if (riskReport.rows.length !== ownerDashboard.riskByCompany.length) {
      fail("El reporte de riesgo no coincide con el dashboard filtrado.");
    }
    pass("Consistencia entre dashboard y reporte gerencial");

    const exportResponse = await request("/api/reports/management/export?type=empresas&format=csv&empresaId=emp_alpha", { token: ownerFixtureToken });
    await expectOk("Exportacion CSV empresas", exportResponse);
    const exportText = await exportResponse.text();
    if (!exportText.includes("Compania Nandu SAS") || !exportText.includes("reporte_empresas")) {
      fail("La exportacion CSV no incluyo el contenido esperado.");
    }
    pass("Exportacion CSV con filtros y caracteres legibles validada");

    const managerAlertsSection = await getJson("Seccion alertas gerenciales", "/api/dashboard/manager-alerts", ownerFixtureToken);
    if (!managerAlertsSection.managementAlerts || typeof managerAlertsSection.managementAlerts !== "object") {
      fail("La seccion de alertas gerenciales no devolvio estructura valida.");
    }
    pass("Endpoints seccionales del dashboard disponibles");

    console.log("[done] Validacion de Fase 7 completada.");
  } finally {
    await restoreFiles(snapshot);
  }
}

main().catch((error) => {
  console.error("[fail]", error.message);
  process.exit(1);
});
