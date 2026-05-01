import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function resolveFile(urlPath) {
  if (urlPath === "/") {
    return path.join(__dirname, "index.html");
  }

  return path.join(__dirname, urlPath);
}

const server = http.createServer((request, response) => {
  const target = resolveFile(request.url.split("?")[0]);

  fs.readFile(target, (error, content) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Archivo no encontrado.");
      return;
    }

    const ext = path.extname(target);
    response.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream"
    });
    response.end(content);
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `No se pudo iniciar GestorConta Web en http://localhost:${port} porque el puerto ${port} ya esta en uso.`
    );
    console.error("Cierra la instancia anterior o cambia el puerto antes de volver a intentarlo.");
    process.exit(1);
  }

  console.error("No se pudo iniciar GestorConta Web.", error);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`GestorConta Web disponible en http://localhost:${port}`);
});
