import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import test from "node:test";

process.env.NODE_ENV ||= "test";
const { createWebServer, resolvePublicRequestPath } = await import("../apps/web/server.js");

function request(port, requestPath, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, path: requestPath, method },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8")
          })
        );
      }
    );
    req.once("error", reject);
    req.end();
  });
}

test("la configuracion productiva usa /api y no contiene localhost", async () => {
  const server = createWebServer({
    environment: "production",
    env: {
      NODE_ENV: "production",
      HTTPS_CONFIRMED: "true",
      AUTH_CSRF_SECRET: "secreto-csrf-aislado-de-prueba-2026",
      FRONTEND_CSP_CONNECT_SOURCES: ""
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const port = server.address().port;
    const response = await request(port, "/");
    assert.equal(response.status, 200);
    assert.match(response.body, /name="api-base-url" content="\/api"/);
    assert.doesNotMatch(response.body, /(?:localhost|127\.0\.0\.1):4000/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("development permite solo un origen API explicito y confiable desde el proceso", async () => {
  const server = createWebServer({
    environment: "development",
    env: {
      NODE_ENV: "development",
      WEB_API_ORIGIN: "http://127.0.0.1:4567",
      FRONTEND_CSP_CONNECT_SOURCES: "http://127.0.0.1:4567"
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const response = await request(server.address().port, "/");
    assert.match(response.body, /content="http:\/\/127\.0\.0\.1:4567"/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  assert.throws(
    () =>
      createWebServer({
        environment: "production",
        env: { NODE_ENV: "production", WEB_API_ORIGIN: "https://api.example.com" }
      }),
    /no se admite en production/
  );
});

test("no hay estilos inline ni asignaciones de style sobre elementos", async () => {
  const [html, app] = await Promise.all([
    fs.readFile("apps/web/index.html", "utf8"),
    fs.readFile("apps/web/src/app.js", "utf8")
  ]);
  assert.doesNotMatch(html, /\sstyle\s*=/i);
  assert.doesNotMatch(app, /\sstyle\s*=/i);
  assert.doesNotMatch(app, /document\.documentElement\.style|\.cssText|setAttribute\(\s*["']style/i);
  assert.match(app, /rootRule\.style\.setProperty/);
});

test("el resolvedor rechaza traversal, codificacion doble, separadores y bytes nulos", () => {
  const attacks = [
    "/../package.json",
    "/%2e%2e/package.json",
    "/%252e%252e%252fpackage.json",
    "/..%5cpackage.json",
    "/%00package.json",
    "/src%2f..%2fserver.js",
    "/.env",
    "/server.js",
    "/package.json"
  ];
  for (const attack of attacks) {
    assert.notEqual(resolvePublicRequestPath(attack).status, 200, attack);
  }
});

test("sirve activos permitidos, rutas SPA y rechaza metodos y archivos privados", async () => {
  const server = createWebServer({
    environment: "test",
    env: { NODE_ENV: "test", WEB_API_ORIGIN: "http://127.0.0.1:4000" }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const port = server.address().port;
    assert.equal((await request(port, "/styles.css")).status, 200);
    assert.equal((await request(port, "/src/app.js")).status, 200);
    assert.match((await request(port, "/dashboard")).body, /<div id="app"><\/div>/);
    assert.equal((await request(port, "/server.js")).status, 404);
    assert.equal((await request(port, "/package.json")).status, 404);
    assert.equal((await request(port, "/%2e%2e/package.json")).status, 400);
    assert.equal((await request(port, "/%252e%252e%252fpackage.json")).status, 400);
    assert.equal((await request(port, "/src%2f..%2fserver.js")).status, 400);
    assert.equal((await request(port, "/..%5cserver.js")).status, 400);
    assert.equal((await request(port, "/%00.env")).status, 400);
    assert.equal((await request(port, "/", "POST")).status, 405);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
