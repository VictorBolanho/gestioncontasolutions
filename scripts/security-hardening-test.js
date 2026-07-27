import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { PassThrough } from "node:stream";
import test from "node:test";
import { sendApiFailure } from "../apps/api/src/lib/api-errors.js";
import { HttpRequestError, readJsonBody, readRequestBody } from "../apps/api/src/lib/http.js";

function runEnvironmentProbe(env) {
  const script = `
    import {
      demoSeedMode,
      defaultCompanies,
      defaultDemoUsers,
      defaultDocuments,
      defaultExtractions
    } from "./apps/api/src/data/seed-data.js";
    console.log(JSON.stringify({
      mode: demoSeedMode,
      users: defaultDemoUsers.length,
      companies: defaultCompanies.length,
      documents: defaultDocuments.length,
      extractions: defaultExtractions.length
    }));
  `;
  return spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      ...env
    },
    encoding: "utf8",
    windowsHide: true
  });
}

function requestStream(headers = {}) {
  const request = new PassThrough();
  request.headers = headers;
  request.complete = false;
  return request;
}

function responseRecorder() {
  return {
    headersSent: false,
    writableEnded: false,
    statusCode: null,
    headers: {},
    body: "",
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
      this.headersSent = true;
    },
    end(body = "") {
      this.body += String(body);
      this.writableEnded = true;
    }
  };
}

test("NODE_ENV y semillas demo requieren configuracion explicita segura", () => {
  const missing = runEnvironmentProbe({});
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /NODE_ENV debe definirse explicitamente/);

  const invalid = runEnvironmentProbe({ NODE_ENV: "staging" });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /development, test o production/);

  const invalidFlag = runEnvironmentProbe({ NODE_ENV: "development", ALLOW_DEMO_SEEDS: "yes" });
  assert.notEqual(invalidFlag.status, 0);
  assert.match(invalidFlag.stderr, /ALLOW_DEMO_SEEDS debe ser true o false/);

  const disabled = runEnvironmentProbe({ NODE_ENV: "development", ALLOW_DEMO_SEEDS: "false" });
  assert.equal(disabled.status, 0, disabled.stderr);
  assert.deepEqual(JSON.parse(disabled.stdout.trim()), {
    mode: { enabled: false, environment: "development" },
    users: 0,
    companies: 0,
    documents: 0,
    extractions: 0
  });

  const missingPassword = runEnvironmentProbe({ NODE_ENV: "test", ALLOW_DEMO_SEEDS: "true" });
  assert.notEqual(missingPassword.status, 0);
  assert.match(missingPassword.stderr, /DEV_SEED_PASSWORD es obligatorio/);

  const production = runEnvironmentProbe({
    NODE_ENV: "production",
    ALLOW_DEMO_SEEDS: "true",
    DEV_SEED_PASSWORD: "no-se-debe-usar"
  });
  assert.notEqual(production.status, 0);
  assert.match(production.stderr, /prohibidas en production/);

  const safeProduction = runEnvironmentProbe({ NODE_ENV: "production", ALLOW_DEMO_SEEDS: "false" });
  assert.equal(safeProduction.status, 0, safeProduction.stderr);
  assert.equal(JSON.parse(safeProduction.stdout.trim()).users, 0);

  const enabled = runEnvironmentProbe({
    NODE_ENV: "test",
    ALLOW_DEMO_SEEDS: "true",
    DEV_SEED_PASSWORD: "contrasena-aislada-de-prueba-2026"
  });
  assert.equal(enabled.status, 0, enabled.stderr);
  assert.equal(JSON.parse(enabled.stdout.trim()).users, 5);
});

test("el lector HTTP acepta cuerpos dentro del limite y valida Content-Length", async () => {
  const request = requestStream({ "content-length": "12" });
  const reading = readJsonBody(request, { kind: "login" });
  request.complete = true;
  request.end('{"ok":true}\n');
  assert.deepEqual(await reading, { ok: true });
});

test("el lector HTTP rechaza temprano Content-Length excesivo", async () => {
  const request = requestStream({ "content-length": "20000" });
  await assert.rejects(
    readRequestBody(request, { kind: "login" }),
    (error) => error instanceof HttpRequestError && error.statusCode === 413
  );
});

test("el lector HTTP cuenta bytes fragmentados e impide evadir el limite", async () => {
  const previous = process.env.HTTP_LOGIN_MAX_BYTES;
  process.env.HTTP_LOGIN_MAX_BYTES = "8";
  try {
    const request = requestStream({ "transfer-encoding": "chunked" });
    const reading = readRequestBody(request, { kind: "login" });
    request.write("1234");
    request.write("5678");
    request.write("9");
    await assert.rejects(reading, (error) => error.statusCode === 413);
  } finally {
    if (previous === undefined) {
      delete process.env.HTTP_LOGIN_MAX_BYTES;
    } else {
      process.env.HTTP_LOGIN_MAX_BYTES = previous;
    }
  }
});

test("el lector HTTP termina solicitudes lentas sin dejar promesas pendientes", async () => {
  const previous = process.env.HTTP_BODY_TIMEOUT_MS;
  process.env.HTTP_BODY_TIMEOUT_MS = "25";
  try {
    const request = requestStream({ "transfer-encoding": "chunked" });
    const reading = readRequestBody(request, { kind: "json" });
    request.write("{");
    await assert.rejects(reading, (error) => error.statusCode === 408 && error.closeConnection === true);
  } finally {
    if (previous === undefined) {
      delete process.env.HTTP_BODY_TIMEOUT_MS;
    } else {
      process.env.HTTP_BODY_TIMEOUT_MS = previous;
    }
  }
});

test("el lector HTTP rechaza una lectura cerrada o incompleta", async () => {
  const request = requestStream({ "content-length": "10" });
  const reading = readRequestBody(request, { kind: "json" });
  request.complete = false;
  request.emit("close");
  await assert.rejects(reading, (error) => error.statusCode === 400);
});

test("el lector JSON no refleja contenido malformado en el error", async () => {
  const secret = "password-super-secreta";
  const request = requestStream({ "content-length": String(secret.length) });
  const reading = readJsonBody(request);
  request.complete = true;
  request.end(secret);
  await assert.rejects(
    reading,
    (error) => error.statusCode === 400 && error.message === "El JSON enviado no es valido."
  );
});

test("los errores 5xx ocultan detalles y conservan un correlation ID", () => {
  const response = responseRecorder();
  const logs = [];
  const error = new Error(
    "constraint users_email_key en ruta privada password=secreta token=abc Authorization=Bearer-privado"
  );
  error.statusCode = 500;
  error.code = "23505";
  const result = sendApiFailure(response, error, "fallback", {
    logger: (entry) => logs.push(entry)
  });
  const payload = JSON.parse(response.body);

  assert.equal(response.statusCode, 500);
  assert.equal(payload.error, "Ocurrio un error interno. Intenta nuevamente.");
  assert.match(payload.correlationId, /^[0-9a-f-]{36}$/i);
  assert.equal(response.headers["X-Correlation-ID"], payload.correlationId);
  assert.equal(JSON.stringify(payload).includes("users_email_key"), false);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].includes("secreta"), false);
  assert.equal(logs[0].includes("Bearer-privado"), false);
  assert.equal(result.correlationId, payload.correlationId);
});

test("los errores 4xx mantienen mensajes utiles y seguros", () => {
  const response = responseRecorder();
  sendApiFailure(response, new HttpRequestError("El JSON enviado no es valido.", 400));
  assert.equal(response.statusCode, 400);
  assert.deepEqual(JSON.parse(response.body), { error: "El JSON enviado no es valido." });
});
