import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runtimeEnvironment } from "../api/src/lib/runtime-environment.js";
import { getDefensiveHeaders } from "../api/src/lib/http-security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nodeEnvironment = runtimeEnvironment.nodeEnv;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8"
};

const publicFiles = new Map([
  ["/index.html", path.join(__dirname, "index.html")],
  ["/styles.css", path.join(__dirname, "styles.css")],
  ["/src/app.js", path.join(__dirname, "src", "app.js")]
]);

function apiRootForEnvironment(env = process.env, environment = nodeEnvironment) {
  const configured = String(env.WEB_API_ORIGIN || "").trim();
  if (environment === "production") {
    if (configured) {
      throw new Error("WEB_API_ORIGIN no se admite en production; publica la API bajo /api en el mismo origen.");
    }
    return "/api";
  }
  if (!configured) {
    return "/api";
  }
  const url = new URL(configured);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("WEB_API_ORIGIN debe ser un origen HTTP(S) sin credenciales, ruta, query ni fragmento.");
  }
  return url.origin;
}

export function resolvePublicRequestPath(rawUrl) {
  const rawPath = String(rawUrl || "").split("?")[0];
  if (
    !rawPath.startsWith("/") ||
    rawPath.includes("\0") ||
    rawPath.includes("\\") ||
    rawPath.includes("://") ||
    /%(?:00|2f|5c)/i.test(rawPath)
  ) {
    return { status: 400 };
  }

  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return { status: 400 };
  }
  if (
    decoded.includes("\0") ||
    decoded.includes("\\") ||
    /%(?:00|2e|2f|5c|25)/i.test(decoded)
  ) {
    return { status: 400 };
  }

  const segments = decoded.split("/");
  if (segments.some((segment) => segment === "." || segment === "..")) {
    return { status: 400 };
  }
  const normalized = path.posix.normalize(decoded);
  if (!normalized.startsWith("/") || normalized.startsWith("/../")) {
    return { status: 400 };
  }
  if (normalized === "/") {
    return { status: 200, file: publicFiles.get("/index.html"), index: true };
  }
  if (publicFiles.has(normalized)) {
    return {
      status: 200,
      file: publicFiles.get(normalized),
      index: normalized === "/index.html"
    };
  }
  if (!path.posix.extname(normalized) && !normalized.split("/").some((part) => part.startsWith("."))) {
    return { status: 200, file: publicFiles.get("/index.html"), index: true };
  }
  return { status: 404 };
}

export function createWebServer({ env = process.env, environment = nodeEnvironment } = {}) {
  const apiRoot = apiRootForEnvironment(env, environment);
  const defensiveHeaders = getDefensiveHeaders({
    surface: "frontend",
    env,
    nodeEnvironment: environment
  });

  return http.createServer((request, response) => {
    for (const [name, value] of Object.entries(defensiveHeaders)) {
      response.setHeader(name, value);
    }
    if (!["GET", "HEAD"].includes(String(request.method || "").toUpperCase())) {
      response.writeHead(405, {
        "Content-Type": "text/plain; charset=utf-8",
        Allow: "GET, HEAD"
      });
      response.end("Metodo no permitido.");
      return;
    }

    const resolved = resolvePublicRequestPath(request.url);
    if (resolved.status !== 200) {
      response.writeHead(resolved.status, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(resolved.status === 400 ? "Ruta no valida." : "Archivo no encontrado.");
      return;
    }

    fs.readFile(resolved.file, (error, content) => {
      if (error) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Archivo no encontrado.");
        return;
      }
      const body = resolved.index
        ? Buffer.from(
            content
              .toString("utf8")
              .replace('<meta name="api-base-url" content="/api" />', `<meta name="api-base-url" content="${apiRoot}" />`)
          )
        : content;
      response.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(resolved.file)] || "application/octet-stream",
        "Content-Length": body.length
      });
      response.end(request.method === "HEAD" ? undefined : body);
    });
  });
}

export function startWebServer({ env = process.env } = {}) {
  const port = Number(env.PORT || 3000);
  const server = createWebServer({ env });
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `No se pudo iniciar GestorConta Web en http://localhost:${port} porque el puerto ${port} ya esta en uso.`
      );
      console.error("Cierra la instancia anterior o cambia el puerto antes de volver a intentarlo.");
      process.exit(1);
    }
    console.error("No se pudo iniciar GestorConta Web.");
    process.exit(1);
  });
  server.listen(port, () => {
    console.log(`GestorConta Web disponible en http://localhost:${port} (${nodeEnvironment})`);
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  startWebServer();
}
