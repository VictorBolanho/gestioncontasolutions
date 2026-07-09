import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPANY_HINT = process.argv[2] || "jamani";

const companiesPath = path.join(__dirname, "..", "apps", "api", "data", "companies.json");
const obligationsPath = path.join(__dirname, "..", "apps", "api", "data", "company-obligations.json");
const tasksPath = path.join(__dirname, "..", "apps", "api", "data", "fiscal-tasks.json");
const outputDir = path.join(__dirname, "..", "exports");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(value) {
  if (!value) return "Sin definir";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatDateTime(value) {
  if (!value) return "Sin definir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function summarizeTasks(tasks) {
  const overdue = tasks.filter((task) => task.estadoOperativo === "vencida");
  const pending = tasks.filter((task) => task.estadoOperativo === "pendiente");
  const inProgress = tasks.filter((task) => task.estadoOperativo === "en_proceso");
  const completed = tasks.filter((task) => ["completada", "presentada"].includes(task.estadoGeneral));

  const nextUpcoming = pending
    .slice()
    .sort((a, b) => String(a.fechaVencimiento || "").localeCompare(String(b.fechaVencimiento || "")))
    .slice(0, 8);

  return {
    overdueCount: overdue.length,
    pendingCount: pending.length,
    inProgressCount: inProgress.length,
    completedCount: completed.length,
    nextUpcoming
  };
}

function groupByTax(tasks) {
  const grouped = new Map();

  for (const task of tasks) {
    const key = task.impuestoNombre || task.impuestoId || "Sin clasificar";
    const item = grouped.get(key) || { taxName: key, total: 0, overdue: 0, nextDate: "" };
    item.total += 1;
    if (task.estadoOperativo === "vencida") {
      item.overdue += 1;
    }
    if (task.fechaVencimiento && (!item.nextDate || task.fechaVencimiento < item.nextDate)) {
      item.nextDate = task.fechaVencimiento;
    }
    grouped.set(key, item);
  }

  return Array.from(grouped.values()).sort((a, b) => b.total - a.total || b.overdue - a.overdue);
}

function buildHtml({ company, obligations, tasks, generatedAt }) {
  const responsibilities = company.responsabilidadesTributarias || [];
  const activeObligations = obligations.filter((item) => item.estado === "activa");
  const taskSummary = summarizeTasks(tasks);
  const tasksByTax = groupByTax(tasks);

  const outstandingCoverage = activeObligations
    .filter((obligation) => !tasks.some((task) => task.obligacionFiscalEmpresaId === obligation.id))
    .map((obligation) => obligation.nombreObligacion);

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Reporte Ejecutivo Tributario - ${escapeHtml(company.razonSocial)}</title>
    <style>
      :root {
        --bg: #f4f1ea;
        --paper: #fffdf8;
        --ink: #1f2a37;
        --muted: #6b7280;
        --line: #ddd6c8;
        --brand: #0f4c5c;
        --brand-soft: #d8ebe8;
        --warn: #b45309;
        --warn-soft: #fef3c7;
        --danger: #991b1b;
        --danger-soft: #fee2e2;
        --ok: #166534;
        --ok-soft: #dcfce7;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top right, rgba(15, 76, 92, 0.08), transparent 24rem),
          linear-gradient(180deg, #faf7f2 0%, var(--bg) 100%);
      }

      .page {
        max-width: 1120px;
        margin: 0 auto;
        padding: 32px 24px 56px;
      }

      .hero {
        background: linear-gradient(135deg, #0f4c5c 0%, #1d6b68 100%);
        color: white;
        border-radius: 28px;
        padding: 32px;
        box-shadow: 0 22px 60px rgba(15, 76, 92, 0.18);
      }

      .hero-top {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 12px;
        opacity: 0.78;
      }

      h1, h2, h3, p {
        margin: 0;
      }

      h1 {
        margin-top: 12px;
        font-size: clamp(30px, 5vw, 48px);
        line-height: 1.05;
      }

      .hero p {
        margin-top: 16px;
        max-width: 760px;
        color: rgba(255, 255, 255, 0.86);
        font-size: 16px;
      }

      .tag {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.14);
        font-size: 13px;
        white-space: nowrap;
      }

      .grid {
        display: grid;
        gap: 18px;
      }

      .kpis {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        margin-top: 24px;
      }

      .card {
        background: var(--paper);
        border: 1px solid rgba(221, 214, 200, 0.9);
        border-radius: 22px;
        padding: 22px;
        box-shadow: 0 12px 32px rgba(31, 42, 55, 0.06);
      }

      .kpi {
        background: rgba(255, 255, 255, 0.14);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 22px;
        padding: 18px;
      }

      .kpi-value {
        font-size: 36px;
        font-weight: 700;
        margin-top: 8px;
      }

      .layout {
        grid-template-columns: 1.4fr 0.9fr;
        margin-top: 24px;
      }

      .section-title {
        font-size: 20px;
        margin-bottom: 14px;
      }

      .muted {
        color: var(--muted);
      }

      .list {
        display: grid;
        gap: 12px;
      }

      .list-item {
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: #fff;
      }

      .pill-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 14px;
      }

      .pill {
        padding: 8px 12px;
        border-radius: 999px;
        background: var(--brand-soft);
        color: var(--brand);
        font-size: 13px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
        font-size: 14px;
      }

      th, td {
        text-align: left;
        padding: 12px 10px;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }

      th {
        color: var(--muted);
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .status {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
      }

      .status-danger {
        background: var(--danger-soft);
        color: var(--danger);
      }

      .status-warn {
        background: var(--warn-soft);
        color: var(--warn);
      }

      .status-ok {
        background: var(--ok-soft);
        color: var(--ok);
      }

      .footer {
        margin-top: 28px;
        font-size: 13px;
        color: var(--muted);
      }

      @media (max-width: 900px) {
        .layout {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <div class="hero-top">
          <div>
            <div class="eyebrow">Reporte ejecutivo tributario</div>
            <h1>${escapeHtml(company.razonSocial)}</h1>
            <p>
              Resumen compartible del estado tributario y operativo de la empresa con base en el RUT cargado,
              las obligaciones activas y la programación fiscal actualmente registrada en el sistema.
            </p>
          </div>
          <div class="tag">Corte del sistema: ${escapeHtml(formatDateTime(generatedAt))}</div>
        </div>

        <div class="grid kpis">
          <article class="kpi">
            <div class="eyebrow">NIT</div>
            <div class="kpi-value">${escapeHtml(`${company.nit}-${company.dv}`)}</div>
          </article>
          <article class="kpi">
            <div class="eyebrow">Obligaciones activas</div>
            <div class="kpi-value">${escapeHtml(String(activeObligations.length))}</div>
          </article>
          <article class="kpi">
            <div class="eyebrow">Tareas fiscales</div>
            <div class="kpi-value">${escapeHtml(String(tasks.length))}</div>
          </article>
          <article class="kpi">
            <div class="eyebrow">Vencidas</div>
            <div class="kpi-value">${escapeHtml(String(taskSummary.overdueCount))}</div>
          </article>
          <article class="kpi">
            <div class="eyebrow">Pendientes</div>
            <div class="kpi-value">${escapeHtml(String(taskSummary.pendingCount))}</div>
          </article>
        </div>
      </section>

      <section class="grid layout">
        <article class="card">
          <div class="eyebrow">Perfil empresarial</div>
          <h2 class="section-title">Datos de identificación y contexto</h2>
          <div class="list">
            <div class="list-item"><strong>Régimen:</strong> ${escapeHtml(company.regimenTributario || "No registrado")}</div>
            <div class="list-item"><strong>Tipo de contribuyente:</strong> ${escapeHtml(company.tipoContribuyente || "No registrado")}</div>
            <div class="list-item"><strong>Actividad principal:</strong> ${escapeHtml(`${company.actividadEconomicaPrincipalCodigo || ""} ${company.actividadEconomicaPrincipalNombre || ""}`.trim())}</div>
            <div class="list-item"><strong>Ubicación:</strong> ${escapeHtml([company.departamento, company.municipio].filter(Boolean).join(" / "))}</div>
            <div class="list-item"><strong>Representante legal:</strong> ${escapeHtml(company.representanteLegal || company.representanteLegalPrincipal?.nombreCompleto || "No registrado")}</div>
            <div class="list-item"><strong>Estado operativo:</strong> <span class="status status-ok">${escapeHtml(company.estadoEmpresa)}</span></div>
          </div>

          <div class="pill-row">
            ${responsibilities
              .map((item) => `<span class="pill">${escapeHtml(`${item.codigo} · ${item.nombre}`)}</span>`)
              .join("")}
          </div>
        </article>

        <article class="card">
          <div class="eyebrow">Lectura ejecutiva</div>
          <h2 class="section-title">Conclusiones del corte</h2>
          <div class="list">
            <div class="list-item">
              La empresa registra <strong>${escapeHtml(String(activeObligations.length))} obligaciones activas</strong> derivadas del RUT y de la revisión fiscal aplicada.
            </div>
            <div class="list-item">
              Actualmente se observan <strong>${escapeHtml(String(tasks.length))} tareas fiscales programadas</strong>, de las cuales <strong>${escapeHtml(String(taskSummary.overdueCount))}</strong> aparecen vencidas y <strong>${escapeHtml(String(taskSummary.pendingCount))}</strong> siguen pendientes.
            </div>
            <div class="list-item">
              Las próximas fechas con mayor presión operativa recaen sobre retención en la fuente, IVA, renta e ICA según el calendario fiscal cargado.
            </div>
            <div class="list-item">
              ${
                outstandingCoverage.length
                  ? `Existen obligaciones activas sin calendario aún vinculado: <strong>${escapeHtml(outstandingCoverage.join(", "))}</strong>.`
                  : "Todas las obligaciones activas cuentan con al menos una tarea programada visible en el sistema."
              }
            </div>
          </div>
        </article>
      </section>

      <section class="card" style="margin-top: 24px;">
        <div class="eyebrow">Programación tributaria</div>
        <h2 class="section-title">Próximos vencimientos visibles</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tarea</th>
              <th>Impuesto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${taskSummary.nextUpcoming
              .map((task) => {
                const statusClass = task.estadoOperativo === "vencida" ? "status-danger" : task.estadoOperativo === "pendiente" ? "status-warn" : "status-ok";
                return `<tr>
                  <td>${escapeHtml(formatDate(task.fechaVencimiento))}</td>
                  <td>${escapeHtml(task.titulo)}</td>
                  <td>${escapeHtml(task.impuestoNombre || "No definido")}</td>
                  <td><span class="status ${statusClass}">${escapeHtml(task.estadoOperativo)}</span></td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </section>

      <section class="card" style="margin-top: 24px;">
        <div class="eyebrow">Cobertura por impuesto</div>
        <h2 class="section-title">Distribución de carga operativa</h2>
        <table>
          <thead>
            <tr>
              <th>Impuesto</th>
              <th>Tareas</th>
              <th>Vencidas</th>
              <th>Próxima fecha</th>
            </tr>
          </thead>
          <tbody>
            ${tasksByTax
              .map((item) => `<tr>
                <td>${escapeHtml(item.taxName)}</td>
                <td>${escapeHtml(String(item.total))}</td>
                <td>${escapeHtml(String(item.overdue))}</td>
                <td>${escapeHtml(formatDate(item.nextDate))}</td>
              </tr>`)
              .join("")}
          </tbody>
        </table>
      </section>

      <section class="card" style="margin-top: 24px;">
        <div class="eyebrow">Obligaciones activas</div>
        <h2 class="section-title">Matriz resumida de obligaciones de la empresa</h2>
        <table>
          <thead>
            <tr>
              <th>Obligación</th>
              <th>Periodicidad</th>
              <th>Origen</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${activeObligations
              .map((item) => `<tr>
                <td>${escapeHtml(item.nombreObligacion)}</td>
                <td>${escapeHtml(item.periodicidadAplicable || "Pendiente")}</td>
                <td>${escapeHtml(item.fuenteDeteccion || "Sistema")}</td>
                <td><span class="status status-ok">${escapeHtml(item.estado)}</span></td>
              </tr>`)
              .join("")}
          </tbody>
        </table>
      </section>

      <div class="footer">
        Documento generado desde la base local de GestorConta. Este archivo puede compartirse directamente con el cliente
        o imprimirse como PDF desde el navegador para una entrega formal.
      </div>
    </main>
  </body>
</html>`;
}

function main() {
  const companies = readJson(companiesPath);
  const obligations = readJson(obligationsPath);
  const tasks = readJson(tasksPath);

  const company = companies.find((item) => normalizeText(item.razonSocial).includes(normalizeText(COMPANY_HINT)));
  if (!company) {
    throw new Error(`No se encontro una empresa que coincida con "${COMPANY_HINT}".`);
  }

  const companyObligations = obligations.filter((item) => item.empresaId === company.id);
  const companyTasks = tasks
    .filter((item) => item.empresaId === company.id && item.tipoTarea === "fiscal")
    .sort((a, b) => String(a.fechaVencimiento || "").localeCompare(String(b.fechaVencimiento || "")));

  ensureDir(outputDir);

  const generatedAt = new Date().toISOString();
  const slug = normalizeText(company.razonSocial).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const outputPath = path.join(outputDir, `reporte-cliente-${slug}.html`);
  const html = buildHtml({
    company,
    obligations: companyObligations,
    tasks: companyTasks,
    generatedAt
  });

  fs.writeFileSync(outputPath, html, "utf8");
  process.stdout.write(outputPath);
}

main();
