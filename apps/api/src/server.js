import http from "node:http";
import { URL } from "node:url";
import {
  getCiiuActivityByCode,
  listCiiuActivities,
  searchCiiuActivities
} from "../../../packages/domain/index.js";
import { readJsonBody, readRequestBody, sendEmpty, sendJson } from "./lib/http.js";
import { parseMultipartFormData } from "./lib/multipart.js";
import {
  approveCompanyReview,
  buildBootstrap,
  confirmExtractionAndCreateCompany,
  getCompanyDetail,
  getExtraction,
  listCompanies,
  saveRutUpload
} from "./lib/company-repository.js";
import {
  analyzeCompanyObligations,
  confirmCompanyObligation,
  listCompanyObligations,
  listTaxRules,
  listTaxes,
  markCompanyObligationNotApplicable,
  reviewCompanyObligation
} from "./lib/obligations-service.js";
import { ensureStorage } from "./lib/storage.js";

const port = Number(process.env.PORT || 4000);
ensureStorage();

function sendActionError(response, error) {
  const statusCode = Number(error?.statusCode || 500);

  if (statusCode >= 500) {
    sendJson(response, 500, {
      error: "No se pudo actualizar la obligacion.",
      details: error?.message || "Error interno."
    });
    return;
  }

  sendJson(response, statusCode, {
    error: error?.message || "No se pudo completar la operacion."
  });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    sendEmpty(response);
    return;
  }

  if (url.pathname === "/health") {
    sendJson(response, 200, {
      status: "ok",
      app: "gestorconta-api",
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (url.pathname === "/api/bootstrap") {
    sendJson(response, 200, buildBootstrap());
    return;
  }

  if (url.pathname === "/api/meta") {
    sendJson(response, 200, {
      version: "0.1.0",
      implementedPhase: "fase-2-motor-obligaciones",
      nextPhase: "fase-3-calendario-fiscal"
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/catalogs/ciiu/search") {
    sendJson(response, 200, {
      items: searchCiiuActivities(url.searchParams.get("q") || "")
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/taxes") {
    sendJson(response, 200, {
      items: listTaxes()
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/tax-rules") {
    sendJson(response, 200, {
      items: listTaxRules()
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/catalogs/ciiu") {
    sendJson(response, 200, {
      items: listCiiuActivities()
    });
    return;
  }

  if (request.method === "GET" && /^\/api\/catalogs\/ciiu\/[^/]+$/.test(url.pathname)) {
    const code = url.pathname.split("/").at(-1);
    const activity = getCiiuActivityByCode(code);

    if (!activity) {
      sendJson(response, 404, { error: "Codigo CIIU no encontrado en catalogo." });
      return;
    }

    sendJson(response, 200, activity);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/companies") {
    sendJson(response, 200, {
      items: listCompanies()
    });
    return;
  }

  if (request.method === "GET" && /^\/api\/companies\/[^/]+$/.test(url.pathname)) {
    const companyId = url.pathname.split("/").at(-1);
    const company = getCompanyDetail(companyId);

    if (!company) {
      sendJson(response, 404, { error: "Empresa no encontrada." });
      return;
    }

    sendJson(response, 200, company);
    return;
  }

  if (request.method === "GET" && /^\/api\/companies\/[^/]+\/obligations$/.test(url.pathname)) {
    const companyId = url.pathname.split("/")[3];
    sendJson(response, 200, {
      items: listCompanyObligations(companyId)
    });
    return;
  }

  if (request.method === "GET" && /^\/api\/rut-uploads\/[^/]+$/.test(url.pathname)) {
    const extractionId = url.pathname.split("/").at(-1);
    const extraction = getExtraction(extractionId);

    if (!extraction) {
      sendJson(response, 404, { error: "Extraccion no encontrada." });
      return;
    }

    sendJson(response, 200, extraction);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/rut-uploads") {
    Promise.resolve()
      .then(async () => {
        const body = await readRequestBody(request);
        const contentType = request.headers["content-type"] || "";
        const parts = parseMultipartFormData(body, contentType);
        const filePart = parts.find((part) => part.name === "rutPdf" && part.filename);

        if (!filePart) {
          throw new Error("Debes adjuntar el archivo PDF del RUT.");
        }

        const result = await saveRutUpload({
          fileName: filePart.filename,
          mimeType: filePart.contentType,
          buffer: filePart.body
        });

        sendJson(response, 201, result);
      })
      .catch((error) => {
        sendJson(response, 400, { error: error.message });
      });
    return;
  }

  if (request.method === "POST" && /^\/api\/rut-uploads\/[^/]+\/confirm$/.test(url.pathname)) {
    Promise.resolve()
      .then(async () => {
        const extractionId = url.pathname.split("/")[3];
        const payload = await readJsonBody(request);
        const company = confirmExtractionAndCreateCompany(extractionId, payload);
        sendJson(response, 201, company);
      })
      .catch((error) => {
        sendJson(response, 400, { error: error.message });
      });
    return;
  }

  if (request.method === "POST" && /^\/api\/companies\/[^/]+\/analyze-obligations$/.test(url.pathname)) {
    Promise.resolve()
      .then(() => {
        const companyId = url.pathname.split("/")[3];
        const result = analyzeCompanyObligations(companyId);
        sendJson(response, 200, result);
      })
      .catch((error) => {
        sendJson(response, 400, { error: error.message });
      });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/companies\/[^/]+\/approve-review$/.test(url.pathname)) {
    Promise.resolve()
      .then(() => {
        const companyId = url.pathname.split("/")[3];
        const result = approveCompanyReview(companyId, "usr_admin");
        sendJson(response, 200, result);
      })
      .catch((error) => {
        sendJson(response, 400, { error: error.message });
      });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/company-obligations\/[^/]+\/confirm$/.test(url.pathname)) {
    Promise.resolve()
      .then(async () => {
        const obligationId = url.pathname.split("/")[3];
        if (!String(obligationId || "").trim()) {
          sendJson(response, 400, { error: "ID de obligacion requerido." });
          return;
        }
        const payload = await readJsonBody(request);
        const result = confirmCompanyObligation(obligationId, "usr_admin", payload.observaciones || "");
        sendJson(response, 200, result);
      })
      .catch((error) => {
        console.error("[company-obligation-action] error:", error);
        sendActionError(response, error);
      });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/company-obligations\/[^/]+\/not-applicable$/.test(url.pathname)) {
    Promise.resolve()
      .then(async () => {
        const obligationId = url.pathname.split("/")[3];
        if (!String(obligationId || "").trim()) {
          sendJson(response, 400, { error: "ID de obligacion requerido." });
          return;
        }
        const payload = await readJsonBody(request);
        const result = markCompanyObligationNotApplicable(obligationId, "usr_admin", payload.observaciones || "");
        sendJson(response, 200, result);
      })
      .catch((error) => {
        console.error("[company-obligation-action] error:", error);
        sendActionError(response, error);
      });
    return;
  }

  if (request.method === "PATCH" && /^\/api\/company-obligations\/[^/]+\/review$/.test(url.pathname)) {
    Promise.resolve()
      .then(async () => {
        const obligationId = url.pathname.split("/")[3];
        if (!String(obligationId || "").trim()) {
          sendJson(response, 400, { error: "ID de obligacion requerido." });
          return;
        }
        const payload = await readJsonBody(request);
        const result = reviewCompanyObligation(obligationId, "usr_admin", payload.observaciones || "");
        sendJson(response, 200, result);
      })
      .catch((error) => {
        console.error("[company-obligation-action] error:", error);
        sendActionError(response, error);
      });
    return;
  }

  sendJson(response, 404, {
    error: "Ruta no encontrada."
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `No se pudo iniciar GestorConta API en http://localhost:${port} porque el puerto ${port} ya esta en uso.`
    );
    console.error("Cierra la instancia anterior o cambia el puerto antes de volver a intentarlo.");
    process.exit(1);
  }

  console.error("No se pudo iniciar GestorConta API.", error);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`GestorConta API disponible en http://localhost:${port}`);
});
