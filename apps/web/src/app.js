const API_BASE_URL =
  document.querySelector('meta[name="api-base-url"]')?.getAttribute("content") ||
  `${window.location.protocol}//${window.location.hostname}:4000`;

const NO_TEXT_MESSAGE = "No se pudo extraer texto legible del PDF. Revisa los datos manualmente.";

const COMPANY_STATUS_OPTIONS = [
  { value: "pendiente_revision", label: "Pendiente de revision" },
  { value: "activa", label: "Activa" },
  { value: "borrador", label: "Borrador" }
];

const state = {
  bootstrap: null,
  companies: [],
  selectedCompany: null,
  currentExtraction: null,
  uploadMessage: null,
  saveMessage: null,
  showTextModal: false,
  advancedOpen: false
};

const MAIN_SECTIONS = [
  {
    title: "Datos principales",
    fields: [
      { name: "nit", label: "NIT", required: true },
      { name: "dv", label: "DV", required: true },
      { name: "razonSocial", label: "Razon social", required: true, full: true },
      { name: "nombreComercial", label: "Nombre comercial" },
      { name: "tipoContribuyente", label: "Tipo de contribuyente", required: true },
      { name: "tipoPersona", label: "Tipo de persona" },
      { name: "regimenTributario", label: "Regimen tributario" },
      { name: "estadoEmpresa", label: "Estado inicial de empresa", type: "select", required: true }
    ]
  },
  {
    title: "Ubicacion",
    fields: [
      { name: "direccionSeccional", label: "Direccion seccional" },
      { name: "pais", label: "Pais" },
      { name: "departamento", label: "Departamento" },
      { name: "municipio", label: "Municipio" },
      { name: "direccionPrincipal", label: "Direccion principal", full: true },
      { name: "correoElectronico", label: "Correo", type: "email" },
      { name: "telefono1", label: "Telefono 1" },
      { name: "telefono2", label: "Telefono 2" },
      { name: "codigoPostal", label: "Codigo postal" }
    ]
  },
  {
    title: "Actividad economica",
    fields: [
      { name: "actividadEconomicaPrincipalCodigo", label: "Codigo actividad principal" },
      { name: "actividadEconomicaPrincipalNombre", label: "Nombre actividad principal", full: true },
      { name: "fechaInicioActividadPrincipal", label: "Fecha inicio actividad principal", type: "date" },
      { name: "numeroEstablecimientos", label: "Numero de establecimientos" }
    ]
  },
  {
    title: "Representante legal",
    fields: [
      { name: "representanteLegalPrincipal.nombreCompleto", label: "Nombre completo", full: true },
      { name: "representanteLegalPrincipal.tipoDocumento", label: "Tipo de documento" },
      { name: "representanteLegalPrincipal.numeroIdentificacion", label: "Numero de identificacion" },
      { name: "representanteLegalPrincipal.fechaInicioRepresentacion", label: "Fecha inicio representacion", type: "date" }
    ]
  }
];

const ADVANCED_FIELDS = [
  { name: "numeroFormulario", label: "Numero de formulario" },
  { name: "concepto", label: "Concepto" },
  { name: "buzonElectronico", label: "Buzon electronico" },
  { name: "sigla", label: "Sigla" },
  { name: "tipoDocumento", label: "Tipo documento empresa" },
  { name: "numeroIdentificacion", label: "Numero identificacion empresa" },
  { name: "regimenTributarioFuente", label: "Fuente de regimen" }
];

const RESPONSIBILITY_FLAGS = [
  { name: "responsableIva", label: "Responsable IVA" },
  { name: "obligadoFacturar", label: "Obligado a facturar" },
  { name: "obligadoLlevarContabilidad", label: "Obligado a llevar contabilidad" },
  { name: "agenteRetencionFuente", label: "Agente de retencion en la fuente" },
  { name: "informanteExogena", label: "Informante de exogena" },
  { name: "informanteBeneficiariosFinales", label: "Informante beneficiarios finales" }
];

const REQUIRED_FIELDS = ["nit", "dv", "razonSocial", "tipoContribuyente", "estadoEmpresa"];
const SIDEBAR_FLOW_STEPS = [
  {
    id: "step-upload",
    label: "Carga PDF del RUT",
    targetId: "upload-section"
  },
  {
    id: "step-review",
    label: "Revisa lo esencial",
    targetId: "review-section"
  },
  {
    id: "step-confirm",
    label: "Confirma y crea empresa",
    targetId: "confirm-section"
  }
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatStatus(value) {
  return String(value || "").replaceAll("_", " ");
}

function statusClass(status) {
  return `status-badge status-${status}`;
}

function formatStepperStatus(status) {
  const labels = {
    active: "En curso",
    completed: "Completado",
    pending: "Pendiente",
    blocked: "Bloqueado"
  };

  return labels[status] || formatStatus(status);
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty("--color-primary", theme.colorPrimario);
  root.style.setProperty("--color-sidebar", theme.colorSidebar);
  root.style.setProperty("--color-secondary", theme.colorSecundario);
  root.style.setProperty("--color-accent", theme.colorAcento);
  root.style.setProperty("--color-bg", theme.colorFondo);
  root.style.setProperty("--color-surface", theme.colorSuperficie);
  root.style.setProperty("--color-border", theme.colorBorde);
  root.style.setProperty("--color-text", theme.colorTextoPrincipal);
  root.style.setProperty("--color-text-muted", theme.colorTextoSecundario);
}

function getValue(object, path) {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((current, key) => current?.[key], object);
}

function setValue(object, path, value) {
  const keys = String(path || "").split(".").filter(Boolean);
  let current = object;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    current[key] = current[key] || {};
    current = current[key];
  }

  current[keys.at(-1)] = value;
}

async function fetchJson(path, options) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
      throw new Error(payload?.error || "No fue posible completar la operacion.");
    }

    return payload;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Verifica que el servidor API este encendido.");
    }

    throw error;
  }
}

async function loadBootstrap() {
  state.bootstrap = await fetchJson("/api/bootstrap");
  state.companies = state.bootstrap.companies;
  applyTheme(state.bootstrap.organization.temaVisual);
}

async function refreshCompanies() {
  const response = await fetchJson("/api/companies");
  state.companies = response.items;
}

async function loadCompany(companyId) {
  state.selectedCompany = await fetchJson(`/api/companies/${companyId}`);
}

async function refreshSelectedCompany() {
  if (!state.selectedCompany?.id) {
    return;
  }

  state.selectedCompany = await fetchJson(`/api/companies/${state.selectedCompany.id}`);
}

async function refreshCompanyContext() {
  await refreshCompanies();
  await refreshSelectedCompany();
}

function getActionErrorMessage(action) {
  const messages = {
    loadCompany: "No se pudo cargar el detalle de la empresa.",
    analyzeObligations: "No se pudo analizar las obligaciones de la empresa.",
    confirmObligation: "No se pudo confirmar la obligacion.",
    notApplicableObligation: "No se pudo marcar la obligacion como no aplica.",
    reviewObligation: "No se pudo enviar la obligacion a revision.",
    approveCompany: "No se pudo activar la empresa."
  };

  return messages[action] || "No se pudo completar la operacion solicitada.";
}

function toUserMessage(error, fallbackMessage) {
  const baseMessage = String(error?.message || "").trim();
  if (!baseMessage) {
    return fallbackMessage;
  }

  if (baseMessage === "Verifica que el servidor API este encendido.") {
    return `${fallbackMessage} Verifica que el servidor API este encendido.`;
  }

  return baseMessage;
}

function getSidebarFlowState() {
  if (state.selectedCompany?.id) {
    return SIDEBAR_FLOW_STEPS.map((step) => ({
      ...step,
      status: "completed",
      clickable: true
    }));
  }

  if (!state.currentExtraction) {
    return SIDEBAR_FLOW_STEPS.map((step, index) => ({
      ...step,
      status: index === 0 ? "active" : "blocked",
      clickable: index === 0
    }));
  }

  const values = reviewFormValues();
  const summary = computeReviewSummary(values);

  if (summary.isValid) {
    return SIDEBAR_FLOW_STEPS.map((step, index) => ({
      ...step,
      status: index < 2 ? "completed" : "active",
      clickable: true
    }));
  }

  return SIDEBAR_FLOW_STEPS.map((step, index) => ({
    ...step,
    status: index === 0 ? "completed" : index === 1 ? "active" : "pending",
    clickable: index < 2
  }));
}

function renderSidebarStepper() {
  const steps = getSidebarFlowState();

  return `
    <div class="stepper-list" aria-label="Flujo empresas desde RUT">
      ${steps
        .map((step, index) => {
          const marker = step.status === "completed" ? "✓" : String(index + 1);

          return `
            <button
              class="stepper-item stepper-${step.status}"
              type="button"
              data-step-target="${step.targetId}"
              ${step.clickable ? "" : "disabled"}
            >
              <span class="stepper-marker">${escapeHtml(marker)}</span>
              <span class="stepper-copy">
                <span class="stepper-label">${escapeHtml(step.label)}</span>
                <span class="stepper-status">${escapeHtml(formatStepperStatus(step.status))}</span>
              </span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function getObligationIdOrMessage(button) {
  const obligationId = String(button.getAttribute("data-obligation-id") || "").trim();

  if (!obligationId) {
    return {
      obligationId: null,
      errorMessage: "No se pudo ejecutar la accion porque la obligacion no tiene ID."
    };
  }

  return {
    obligationId,
    errorMessage: null
  };
}

function defaultRepresentative() {
  return {
    tipoRepresentacion: "",
    fechaInicioRepresentacion: "",
    tipoDocumento: "",
    numeroIdentificacion: "",
    dv: "",
    primerApellido: "",
    segundoApellido: "",
    primerNombre: "",
    otrosNombres: "",
    nombreCompleto: ""
  };
}

function reviewFormValues() {
  const extractionData =
    state.currentExtraction?.datosConfirmadosPorUsuario ||
    state.currentExtraction?.datosExtraidosOriginales ||
    state.currentExtraction?.datosExtraidos ||
    {};

  return {
    numeroFormulario: extractionData.numeroFormulario || "",
    concepto: extractionData.concepto || "",
    nit: extractionData.nit || "",
    dv: extractionData.dv || "",
    direccionSeccional: extractionData.direccionSeccional || "",
    buzonElectronico: extractionData.buzonElectronico || "",
    tipoContribuyente: extractionData.tipoContribuyente || "",
    tipoPersona: extractionData.tipoPersona || "",
    tipoDocumento: extractionData.tipoDocumento || "",
    numeroIdentificacion: extractionData.numeroIdentificacion || "",
    razonSocial: extractionData.razonSocial || "",
    nombreComercial: extractionData.nombreComercial || "",
    sigla: extractionData.sigla || "",
    pais: extractionData.pais || "",
    departamento: extractionData.departamento || "",
    municipio: extractionData.municipio || "",
    direccionPrincipal: extractionData.direccionPrincipal || "",
    correoElectronico: extractionData.correoElectronico || extractionData.email || "",
    codigoPostal: extractionData.codigoPostal || "",
    telefono1: extractionData.telefono1 || "",
    telefono2: extractionData.telefono2 || "",
    actividadEconomicaPrincipal: extractionData.actividadEconomicaPrincipal || "",
    actividadEconomicaPrincipalCodigo:
      extractionData.actividadEconomicaPrincipalCodigo || extractionData.actividadEconomicaPrincipal || "",
    actividadEconomicaPrincipalNombre: extractionData.actividadEconomicaPrincipalNombre || "",
    actividadEconomicaPrincipalFuente: extractionData.actividadEconomicaPrincipalFuente || "",
    fechaInicioActividadPrincipal: extractionData.fechaInicioActividadPrincipal || "",
    numeroEstablecimientos: extractionData.numeroEstablecimientos || "",
    responsabilidadesTributarias: Array.isArray(extractionData.responsabilidadesTributarias)
      ? extractionData.responsabilidadesTributarias
      : [],
    responsableIva: Boolean(extractionData.responsableIva),
    obligadoLlevarContabilidad: Boolean(extractionData.obligadoLlevarContabilidad),
    obligadoFacturar: Boolean(extractionData.obligadoFacturar),
    informanteExogena: Boolean(extractionData.informanteExogena),
    agenteRetencionFuente: Boolean(extractionData.agenteRetencionFuente),
    informanteBeneficiariosFinales: Boolean(extractionData.informanteBeneficiariosFinales),
    regimenTributario: extractionData.regimenTributario || "",
    regimenTributarioFuente: extractionData.regimenTributarioFuente || "",
    representanteLegalPrincipal: {
      ...defaultRepresentative(),
      ...(extractionData.representanteLegalPrincipal || {})
    },
    fechaGeneracionRut: extractionData.fechaGeneracionRut || "",
    paginasDetectadas: extractionData.paginasDetectadas || 0,
    textoExtraidoPreview:
      extractionData.textoExtraidoPreview ||
      state.currentExtraction?.metadataExtraccion?.textoExtraidoPreview ||
      "",
    estadoEmpresa: "pendiente_revision"
  };
}

function messageCard(message, tone = "info") {
  if (!message) {
    return "";
  }

  return `<div class="message-card ${tone}">${escapeHtml(message)}</div>`;
}

function extractionMeta(path) {
  return state.currentExtraction?.metadataExtraccion?.fieldMetadata?.[path] || {};
}

function renderMetaBadges(path) {
  const meta = extractionMeta(path);
  const badges = [];

  if (meta.fuente === "deducido_sistema") {
    badges.push('<span class="field-badge derived">Deducido por sistema</span>');
  }

  if (meta.requiereRevision) {
    badges.push('<span class="field-badge review">Requiere revision</span>');
  }

  if (meta.confianza === "baja") {
    badges.push('<span class="field-badge low">Baja confianza</span>');
  }

  return badges.length ? `<div class="field-badges">${badges.join("")}</div>` : "";
}

function computeReviewSummary(values) {
  const criticalDetected = REQUIRED_FIELDS.filter((field) => {
    const value = getValue(values, field);
    return typeof value === "boolean" ? true : String(value || "").trim().length > 0;
  }).length;

  const metadataFields = state.currentExtraction?.metadataExtraccion?.fieldMetadata || {};
  const requiresReview = Object.values(metadataFields).filter((meta) => meta?.requiereRevision).length;

  return {
    criticalDetected,
    requiresReview,
    isValid: criticalDetected === REQUIRED_FIELDS.length && Boolean(state.currentExtraction?.documento?.id)
  };
}

function renderInputField(field, values) {
  const value = getValue(values, field.name);
  const requiredAttribute = field.required ? "required" : "";
  const classes = field.full ? "full" : "";
  const badges = renderMetaBadges(field.name);

  if (field.type === "select") {
    return `
      <label class="${classes}">
        <span>${escapeHtml(field.label)}</span>
        ${badges}
        <select name="${field.name}" ${requiredAttribute}>
          ${COMPANY_STATUS_OPTIONS.map(
            (option) =>
              `<option value="${option.value}" ${option.value === value ? "selected" : ""}>${escapeHtml(option.label)}</option>`
          ).join("")}
        </select>
      </label>
    `;
  }

  return `
    <label class="${classes}">
      <span>${escapeHtml(field.label)}</span>
      ${badges}
      <input name="${field.name}" type="${field.type || "text"}" value="${escapeHtml(value ?? "")}" ${requiredAttribute} />
    </label>
  `;
}

function renderMainSection(section, values) {
  const pendingCatalogNote =
    section.title === "Actividad economica" && values.actividadEconomicaPrincipalFuente === "pendiente_catalogo"
      ? `<p class="section-note">No se encontro descripcion para este codigo CIIU. Puedes continuar y actualizar el catalogo luego.</p>`
      : "";

  return `
    <section class="review-section">
      <div class="section-heading">
        <h4>${escapeHtml(section.title)}</h4>
      </div>
      ${pendingCatalogNote}
      <div class="form-grid compact">
        ${section.fields.map((field) => renderInputField(field, values)).join("")}
      </div>
    </section>
  `;
}

function renderResponsibilityRows(responsibilities) {
  if (!responsibilities.length) {
    return `<div class="muted">No se detectaron responsabilidades con seguridad.</div>`;
  }

  return responsibilities
    .map(
      (item) => `
        <div class="responsibility-row">
          <strong>${escapeHtml(item.codigo || "--")}</strong>
          <span>${escapeHtml(item.nombre || "")}</span>
        </div>
      `
    )
    .join("");
}

function renderFlag(flag, values) {
  const checked = Boolean(values[flag.name]);
  return `
    <label class="checkbox-pill">
      <input name="${flag.name}" type="checkbox" ${checked ? "checked" : ""} />
      <span>${escapeHtml(flag.label)}</span>
      ${renderMetaBadges(flag.name)}
    </label>
  `;
}

function renderAdvancedSection(values) {
  const metadataJson = JSON.stringify(state.currentExtraction?.metadataExtraccion || {}, null, 2);
  return `
    <details class="advanced-panel" ${state.advancedOpen ? "open" : ""}>
      <summary id="advanced-toggle">Datos avanzados</summary>
      <div class="advanced-content">
        <div class="form-grid compact">
          ${ADVANCED_FIELDS.map((field) => renderInputField(field, values)).join("")}
        </div>
        <div class="advanced-block">
          <strong>Metadata tecnica de extraccion</strong>
          <pre>${escapeHtml(metadataJson)}</pre>
        </div>
      </div>
    </details>
  `;
}

function renderDocumentCard(values, summary) {
  const extraction = state.currentExtraction;
  return `
    <section class="review-section document-card">
      <div class="section-heading">
        <h4>Documento RUT</h4>
      </div>
      <div class="document-grid">
        <div><strong>Archivo</strong><span>${escapeHtml(extraction.documento?.nombreArchivo || "Sin archivo")}</span></div>
        <div><strong>Estado de extraccion</strong><span class="${statusClass(extraction.estadoExtraccion)}">${escapeHtml(
          formatStatus(extraction.estadoExtraccion)
        )}</span></div>
        <div><strong>Fecha generacion RUT</strong><span>${escapeHtml(values.fechaGeneracionRut || "No detectada")}</span></div>
        <div><strong>Paginas detectadas</strong><span>${escapeHtml(String(values.paginasDetectadas || 0))}</span></div>
      </div>
      ${
        extraction.mensajeExtraccion
          ? `<p class="message-inline">${escapeHtml(extraction.mensajeExtraccion)}</p>`
          : ""
      }
      <div class="button-row compact">
        <button class="btn btn-secondary" type="button" id="toggle-text-modal">Ver texto extraido</button>
      </div>
      <input type="hidden" name="fechaGeneracionRut" value="${escapeHtml(values.fechaGeneracionRut || "")}" />
      <input type="hidden" name="paginasDetectadas" value="${escapeHtml(String(values.paginasDetectadas || 0))}" />
      <textarea class="hidden-field" name="textoExtraidoPreview">${escapeHtml(values.textoExtraidoPreview || "")}</textarea>
      ${
        !summary.isValid
          ? `<p class="validation-note">Completa los campos obligatorios y verifica que el documento RUT este asociado antes de crear la empresa.</p>`
          : ""
      }
    </section>
  `;
}

function renderTextModal() {
  if (!state.showTextModal || !state.currentExtraction) {
    return "";
  }

  const text = String(state.currentExtraction.textoExtraido || "").trim() || NO_TEXT_MESSAGE;
  return `
    <div class="modal-backdrop" id="text-modal-close">
      <div class="modal-card" role="dialog" aria-modal="true">
        <div class="panel-header modal-header">
          <div>
            <div class="eyebrow">Documento RUT</div>
            <h3 class="section-title">Texto extraido</h3>
          </div>
          <button class="btn btn-secondary" type="button" id="close-text-modal">Cerrar</button>
        </div>
        <pre class="modal-pre">${escapeHtml(text)}</pre>
      </div>
    </div>
  `;
}

function reviewForm() {
  if (!state.currentExtraction) {
    return `
      <section class="panel-card">
        <div class="eyebrow">Revision humana</div>
        <h3 class="section-title">Carga un PDF RUT para iniciar</h3>
        <p class="muted">
          La empresa no se crea automaticamente. Primero se valida el archivo, se almacena el documento,
          se intenta extraer texto y luego un usuario confirma la informacion.
        </p>
      </section>
    `;
  }

  const values = reviewFormValues();
  const summary = computeReviewSummary(values);

  return `
    <section class="panel-card" id="review-section">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Revision humana</div>
          <h3 class="section-title">Confirma los datos antes de crear la empresa</h3>
        </div>
        <div class="${statusClass(state.currentExtraction.estadoExtraccion)}">${escapeHtml(
          formatStatus(state.currentExtraction.estadoExtraccion)
        )}</div>
      </div>
      ${messageCard(state.saveMessage, state.saveMessage?.startsWith("Empresa creada") ? "success" : "error")}
      <div class="review-summary-card">
        <strong>Extraccion ${escapeHtml(formatStatus(state.currentExtraction.estadoExtraccion))}:</strong>
        <span>${escapeHtml(String(summary.criticalDetected))} campos criticos detectados, ${escapeHtml(String(summary.requiresReview))} requieren revision.</span>
      </div>
      <div class="review-layout">
        <form id="review-form" class="form-card simplified-form">
          ${MAIN_SECTIONS.map((section) => renderMainSection(section, values)).join("")}
          <input type="hidden" name="actividadEconomicaPrincipal" value="${escapeHtml(values.actividadEconomicaPrincipalCodigo || values.actividadEconomicaPrincipal || "")}" />
          <input type="hidden" name="actividadEconomicaPrincipalFuente" value="${escapeHtml(values.actividadEconomicaPrincipalFuente || "")}" />

          <section class="review-section">
            <div class="section-heading">
              <h4>Responsabilidades tributarias</h4>
            </div>
            <div class="responsibility-list simple-list">
              ${renderResponsibilityRows(values.responsabilidadesTributarias)}
            </div>
            <div class="flags-grid">
              ${RESPONSIBILITY_FLAGS.map((flag) => renderFlag(flag, values)).join("")}
            </div>
            <textarea class="hidden-field" name="responsabilidadesTributarias">${escapeHtml(
              values.responsabilidadesTributarias.map((item) => `${item.codigo || ""} - ${item.nombre || ""}`.trim()).join("\n")
            )}</textarea>
          </section>

          ${renderDocumentCard(values, summary)}
          ${renderAdvancedSection(values)}

          <div class="button-row" id="confirm-section">
            <button class="btn btn-primary" type="submit" ${summary.isValid ? "" : "disabled"}>Confirmar y crear empresa</button>
          </div>
        </form>

        <aside class="form-card helper-card">
          <div class="eyebrow">Resumen</div>
          <h3 class="section-title">Revision guiada</h3>
          <p class="muted">
            Verifica primero NIT, DV, razon social y tipo de contribuyente. Luego confirma ubicacion,
            actividad economica y responsabilidades antes de crear la empresa.
          </p>
          <div class="helper-list">
            <div class="helper-item">Datos obligatorios claros y al frente</div>
            <div class="helper-item">Campos dudosos marcados para revision</div>
            <div class="helper-item">Texto del PDF oculto hasta que lo necesites</div>
          </div>
        </aside>
      </div>
      ${renderTextModal()}
    </section>
  `;
}

function uploadSection() {
  return `
    <section class="panel-card" id="upload-section">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Fase 1</div>
          <h2 class="hero-title small">Creacion de empresa desde PDF RUT con revision humana</h2>
        </div>
      </div>
      <p class="hero-description">
        Esta pantalla cubre unicamente el flujo de carga del RUT, validacion de archivo, extraccion,
        confirmacion humana, creacion de empresa, asociacion del documento y auditoria basica.
      </p>
      ${messageCard(state.uploadMessage, state.uploadMessage?.startsWith("PDF cargado") ? "success" : "error")}
      <form id="upload-form" class="upload-row">
        <input id="rutPdf" name="rutPdf" type="file" accept="application/pdf,.pdf" required />
        <button class="btn btn-primary" type="submit">Cargar PDF RUT</button>
      </form>
    </section>
  `;
}

function companiesSection() {
  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Empresas</div>
          <h3 class="section-title">Listado de empresas creadas</h3>
        </div>
      </div>
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>NIT</th>
              <th>Estado</th>
              <th>Documento RUT</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            ${state.companies
              .map(
                (company) => `
                  <tr>
                    <td>
                      <strong>${escapeHtml(company.razonSocial)}</strong>
                      <div class="muted">${escapeHtml(company.nombreComercial || "Sin nombre comercial")}</div>
                    </td>
                    <td>${escapeHtml(company.nit)}-${escapeHtml(company.dv || "")}</td>
                    <td><span class="${statusClass(company.estadoEmpresa)}">${escapeHtml(formatStatus(company.estadoEmpresa))}</span></td>
                    <td>${company.documentoRutId ? "Asociado" : "Pendiente"}</td>
                    <td><button class="btn btn-secondary table-action" data-view-company-id="${company.id}" type="button">Ver detalle</button></td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function companyDetailSection() {
  if (!state.selectedCompany) {
    return `
      <section class="panel-card">
        <div class="eyebrow">Detalle de empresa</div>
        <h3 class="section-title">Selecciona una empresa del listado</h3>
        <p class="muted">Aqui veras el detalle basico, el estado operativo y el documento RUT asociado.</p>
      </section>
    `;
  }

  const company = state.selectedCompany;
  const obligations = Array.isArray(company.obligacionesFiscales) ? company.obligacionesFiscales : [];
  const canApproveCompany =
    company.estadoEmpresa === "pendiente_revision" || company.estadoEmpresa === "borrador";
  const companyStatusNotice =
    company.estadoEmpresa === "pendiente_revision"
      ? {
          tone: "info",
          text: "Esta empresa aun no esta activa. Aprueba la revision para habilitarla operativamente."
        }
      : company.estadoEmpresa === "activa"
        ? {
            tone: "success",
            text: "Empresa activa para operacion."
          }
        : null;
  const detailMessageTone =
    /correctamente|no aplica|revision/i.test(state.saveMessage || "") && !/no se pudo|verifica|error/i.test(state.saveMessage || "")
      ? "success"
      : /no se pudo|verifica|error/i.test(state.saveMessage || "")
        ? "error"
        : "info";

  return `
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <div class="eyebrow">Detalle de empresa</div>
          <h3 class="section-title">${escapeHtml(company.razonSocial)}</h3>
        </div>
        <div class="${statusClass(company.estadoEmpresa)}">${escapeHtml(formatStatus(company.estadoEmpresa))}</div>
      </div>
      ${messageCard(state.saveMessage, detailMessageTone)}
      ${companyStatusNotice ? messageCard(companyStatusNotice.text, companyStatusNotice.tone) : ""}
      <div class="detail-grid">
        <div class="detail-item"><strong>Estado actual</strong><span class="${statusClass(company.estadoEmpresa)}">${escapeHtml(formatStatus(company.estadoEmpresa))}</span></div>
        <div class="detail-item"><strong>NIT + DV</strong><span>${escapeHtml(company.nit)}-${escapeHtml(company.dv || "")}</span></div>
        <div class="detail-item"><strong>Tipo contribuyente</strong><span>${escapeHtml(company.tipoContribuyente || "No registrado")}</span></div>
        <div class="detail-item"><strong>Tipo persona</strong><span>${escapeHtml(company.tipoPersona || "No registrado")}</span></div>
        <div class="detail-item"><strong>Regimen</strong><span>${escapeHtml(company.regimenTributario || "No registrado")}</span></div>
        <div class="detail-item"><strong>Ubicacion</strong><span>${escapeHtml([company.pais, company.departamento, company.municipio].filter(Boolean).join(" / ") || "No registrada")}</span></div>
        <div class="detail-item"><strong>Direccion principal</strong><span>${escapeHtml(company.direccionPrincipal || "No registrada")}</span></div>
        <div class="detail-item"><strong>Correo / Telefono</strong><span>${escapeHtml([company.correoElectronico || company.email, company.telefono1].filter(Boolean).join(" / ") || "No registrado")}</span></div>
        <div class="detail-item"><strong>Actividad principal</strong><span>${escapeHtml(
          [company.actividadEconomicaPrincipalCodigo || company.actividadEconomicaPrincipal, company.actividadEconomicaPrincipalNombre]
            .filter(Boolean)
            .join(" · ") || "No registrada"
        )}</span></div>
        <div class="detail-item"><strong>Responsabilidades</strong><span>${escapeHtml((company.responsabilidadesTributarias || []).map((item) => item.codigo).join(", ") || "No registradas")}</span></div>
        <div class="detail-item"><strong>Representante legal</strong><span>${escapeHtml(company.representanteLegalPrincipal?.nombreCompleto || company.representanteLegal || "No registrado")}</span></div>
        <div class="detail-item"><strong>Documento RUT</strong><span>${escapeHtml(company.documentoRut?.nombreArchivo || "No asociado")}</span></div>
      </div>
      ${
        canApproveCompany
          ? `<div class="button-row">
              <button class="btn btn-primary" type="button" data-action="approve-company" data-company-id="${company.id}">
                Aprobar revision y activar empresa
              </button>
            </div>`
          : ""
      }
      <section class="obligations-section">
        <div class="panel-header section-top">
          <div>
            <div class="eyebrow">Obligaciones sugeridas</div>
            <h4 class="section-title">Motor de impuestos y obligaciones fiscales</h4>
          </div>
          <button class="btn btn-primary" type="button" data-action="analyze-obligations" data-company-id="${company.id}">
            Analizar obligaciones
          </button>
        </div>
        ${
          obligations.length
            ? `<div class="obligation-list">
                ${obligations
                  .map(
                    (item) => `
                      <article class="obligation-card">
                        <div class="obligation-top">
                          <div>
                            <strong>${escapeHtml(item.nombreObligacion || item.impuesto?.nombre || "Obligacion")}</strong>
                            <div class="muted">${escapeHtml(item.impuesto?.nombre || item.nombreObligacion || "")}</div>
                          </div>
                          <span class="${statusClass(item.estado)}">${escapeHtml(formatStatus(item.estado))}</span>
                        </div>
                        <div class="obligation-meta">
                          <div><strong>Nivel:</strong> ${escapeHtml(item.nivel || "-")}</div>
                          <div><strong>Fuente:</strong> ${escapeHtml(item.fuenteDeteccion || "-")}</div>
                          <div><strong>Motivo:</strong> ${escapeHtml(item.motivoAplicacion || "-")}</div>
                          <div><strong>Responsabilidad RUT:</strong> ${escapeHtml(
                            [item.codigoResponsabilidadRut, item.responsabilidadRutOrigen].filter(Boolean).join(" · ") || "-"
                          )}</div>
                        </div>
                        <div class="button-row compact">
                          <button class="btn btn-secondary" type="button" data-action="confirm-obligation" data-obligation-id="${item.id}" ${
                            company.estadoEmpresa !== "activa" ? "disabled" : ""
                          }>
                            Confirmar
                          </button>
                          <button class="btn btn-secondary" type="button" data-action="not-applicable-obligation" data-obligation-id="${item.id}">
                            Marcar no aplica
                          </button>
                          <button class="btn btn-secondary" type="button" data-action="review-obligation" data-obligation-id="${item.id}">
                            Dejar en revision
                          </button>
                        </div>
                      </article>
                    `
                  )
                  .join("")}
              </div>`
            : `<p class="muted">Todavia no hay obligaciones sugeridas para esta empresa.</p>`
        }
      </section>
    </section>
  `;
}

function render() {
  const app = document.querySelector("#app");
  const theme = state.bootstrap?.organization?.temaVisual;
  if (theme) {
    applyTheme(theme);
  }

  app.innerHTML = `
    <div class="app-shell phase-one">
      <aside class="sidebar">
        <div class="brand-block">
          <div class="brand-name">${escapeHtml(state.bootstrap?.organization?.temaVisual?.nombreComercial || "ContaSolutions")}</div>
          <div class="brand-tagline">${escapeHtml(state.bootstrap?.organization?.temaVisual?.eslogan || "")}</div>
        </div>
        <nav class="nav-list">
          <button class="nav-item active">Fase 1 · Empresas desde RUT</button>
        </nav>
        ${renderSidebarStepper()}
      </aside>
      <main class="main-panel">
        <section class="topbar">
          <div class="search-box">Fundacion tecnica + Fase 1 enfocada exclusivamente en alta de empresa desde RUT</div>
          <div class="user-chip">Laura Giraldo · Administrador</div>
        </section>
        ${uploadSection()}
        ${reviewForm()}
        <section class="two-column-grid">
          ${companiesSection()}
          ${companyDetailSection()}
        </section>
      </main>
    </div>
  `;

  bindEvents();
}

function parseResponsibilitiesInput(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d{2})\s*-\s*(.+)$/);
      return {
        codigo: match?.[1] || "",
        nombre: (match?.[2] || line).trim(),
        fuenteTexto: line
      };
    });
}

function formToObject(form) {
  const formData = new FormData(form);
  const payload = {
    representanteLegalPrincipal: {}
  };

  for (const section of MAIN_SECTIONS) {
    for (const field of section.fields) {
      if (field.type === "select") {
        setValue(payload, field.name, formData.get(field.name));
      } else {
        setValue(payload, field.name, formData.get(field.name));
      }
    }
  }

  for (const field of ADVANCED_FIELDS) {
    setValue(payload, field.name, formData.get(field.name));
  }

  for (const flag of RESPONSIBILITY_FLAGS) {
    payload[flag.name] = form.querySelector(`[name="${flag.name}"]`)?.checked || false;
  }

  payload.responsabilidadesTributarias = parseResponsibilitiesInput(formData.get("responsabilidadesTributarias"));
  payload.actividadEconomicaPrincipal = formData.get("actividadEconomicaPrincipal");
  payload.actividadEconomicaPrincipalFuente = formData.get("actividadEconomicaPrincipalFuente");
  payload.fechaGeneracionRut = formData.get("fechaGeneracionRut");
  payload.paginasDetectadas = formData.get("paginasDetectadas");
  payload.textoExtraidoPreview = formData.get("textoExtraidoPreview");

  if (!payload.tipoContribuyente) {
    payload.tipoContribuyente = "Pendiente de revision";
  }

  return payload;
}

function bindEvents() {
  document.querySelector("#upload-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.uploadMessage = null;
    state.saveMessage = null;
    state.showTextModal = false;
    const input = document.querySelector("#rutPdf");
    const file = input?.files?.[0];

    if (!file) {
      state.uploadMessage = "Debes seleccionar un archivo PDF.";
      render();
      return;
    }

    const formData = new FormData();
    formData.append("rutPdf", file);

    try {
      const extraction = await fetchJson("/api/rut-uploads", {
        method: "POST",
        body: formData
      });

      state.currentExtraction = await fetchJson(`/api/rut-uploads/${extraction.extractionId}`);
      state.uploadMessage = `PDF cargado correctamente. Estado de extraccion: ${state.currentExtraction.estadoExtraccion}.`;
    } catch (error) {
      state.uploadMessage = error.message;
    }

    render();
  });

  document.querySelector("#review-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.saveMessage = null;
    const payload = formToObject(event.currentTarget);
    const missing = REQUIRED_FIELDS.filter((field) => !String(getValue(payload, field) || "").trim());

    if (!state.currentExtraction?.documento?.id) {
      missing.push("documentoRut");
    }

    if (missing.length > 0) {
      state.saveMessage = "Completa los campos obligatorios antes de crear la empresa.";
      render();
      return;
    }

    try {
      const company = await fetchJson(`/api/rut-uploads/${state.currentExtraction.id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      state.saveMessage = "Empresa creada correctamente desde RUT con revision humana.";
      state.selectedCompany = company;
      state.currentExtraction = null;
      state.uploadMessage = null;
      const companiesResponse = await fetchJson("/api/companies");
      state.companies = companiesResponse.items;
    } catch (error) {
      state.saveMessage = error.message;
    }

    render();
  });

  document.querySelector("#toggle-text-modal")?.addEventListener("click", () => {
    state.showTextModal = true;
    render();
  });

  document.querySelector("#close-text-modal")?.addEventListener("click", () => {
    state.showTextModal = false;
    render();
  });

  document.querySelector("#text-modal-close")?.addEventListener("click", (event) => {
    if (event.target.id === "text-modal-close") {
      state.showTextModal = false;
      render();
    }
  });

  document.querySelector("#advanced-toggle")?.parentElement?.addEventListener("toggle", (event) => {
    state.advancedOpen = event.currentTarget.open;
  });

  document.querySelectorAll("[data-view-company-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.saveMessage = null;
        await loadCompany(button.getAttribute("data-view-company-id"));
      } catch (error) {
        state.saveMessage = toUserMessage(error, getActionErrorMessage("loadCompany"));
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="analyze-obligations"]').forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.saveMessage = null;
        await fetchJson(`/api/companies/${button.getAttribute("data-company-id")}/analyze-obligations`, {
          method: "POST"
        });
        await refreshCompanyContext();
        state.saveMessage = "Obligaciones analizadas correctamente.";
      } catch (error) {
        state.saveMessage = toUserMessage(error, getActionErrorMessage("analyzeObligations"));
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="approve-company"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const companyId = button.getAttribute("data-company-id");

      if (!window.confirm("Se activara la empresa y quedara habilitada para operacion. Deseas continuar?")) {
        return;
      }

      try {
        state.saveMessage = null;
        await fetchJson(`/api/companies/${companyId}/approve-review`, {
          method: "PATCH"
        });
        await refreshCompanyContext();
        state.saveMessage = "Empresa activada correctamente.";
      } catch (error) {
        state.saveMessage = toUserMessage(error, getActionErrorMessage("approveCompany"));
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="confirm-obligation"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const { obligationId, errorMessage } = getObligationIdOrMessage(button);
      if (!obligationId) {
        state.saveMessage = errorMessage;
        render();
        return;
      }

      try {
        state.saveMessage = null;
        await fetchJson(`/api/company-obligations/${obligationId}/confirm`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        });
        await refreshCompanyContext();
        state.saveMessage = "Obligacion confirmada correctamente.";
      } catch (error) {
        state.saveMessage = toUserMessage(error, getActionErrorMessage("confirmObligation"));
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="not-applicable-obligation"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const { obligationId, errorMessage } = getObligationIdOrMessage(button);
      if (!obligationId) {
        state.saveMessage = errorMessage;
        render();
        return;
      }

      try {
        state.saveMessage = null;
        await fetchJson(`/api/company-obligations/${obligationId}/not-applicable`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        });
        await refreshCompanyContext();
        state.saveMessage = "Obligacion marcada como no aplica.";
      } catch (error) {
        state.saveMessage = toUserMessage(error, getActionErrorMessage("notApplicableObligation"));
      }

      render();
    });
  });

  document.querySelectorAll('[data-action="review-obligation"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const { obligationId, errorMessage } = getObligationIdOrMessage(button);
      if (!obligationId) {
        state.saveMessage = errorMessage;
        render();
        return;
      }

      try {
        state.saveMessage = null;
        await fetchJson(`/api/company-obligations/${obligationId}/review`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        });
        await refreshCompanyContext();
        state.saveMessage = "Obligacion enviada a revision.";
      } catch (error) {
        state.saveMessage = toUserMessage(error, getActionErrorMessage("reviewObligation"));
      }

      render();
    });
  });

  document.querySelectorAll("[data-step-target]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }

      const targetId = button.getAttribute("data-step-target");
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}

async function start() {
  const app = document.querySelector("#app");
  app.innerHTML = `<section class="empty-state" style="padding: 32px;">Cargando Fase 1...</section>`;

  try {
    await loadBootstrap();
    render();
  } catch (error) {
    app.innerHTML = `
      <section class="empty-state" style="padding: 32px;">
        <h2 class="section-title">No fue posible cargar la Fase 1</h2>
        <p class="muted">${escapeHtml(error.message)}</p>
      </section>
    `;
  }
}

start();
