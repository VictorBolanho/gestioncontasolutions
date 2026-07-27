import assert from "node:assert/strict";
import test from "node:test";
import {
  applyCors,
  getCorsConfiguration,
  getDefensiveHeaders,
  getTrustedProxyConfiguration,
  normalizeIpAddress,
  resolveClientAddress
} from "../apps/api/src/lib/http-security.js";
import {
  ProgressiveLoginLimiter,
  createLoginLimiters
} from "../apps/api/src/lib/auth-login-limiter.js";

function responseRecorder(initialHeaders = {}) {
  const headers = new Map(
    Object.entries(initialHeaders).map(([name, value]) => [name.toLowerCase(), value])
  );
  return {
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    getHeader(name) {
      return headers.get(name.toLowerCase());
    }
  };
}

function request({ origin, forwarded, xForwardedFor, remoteAddress = "127.0.0.1" } = {}) {
  return {
    headers: {
      ...(origin === undefined ? {} : { origin }),
      ...(forwarded === undefined ? {} : { forwarded }),
      ...(xForwardedFor === undefined ? {} : { "x-forwarded-for": xForwardedFor })
    },
    socket: { remoteAddress }
  };
}

test("CORS autoriza solo origenes concretos y conserva Vary", () => {
  const config = getCorsConfiguration(
    { CORS_ALLOWED_ORIGINS: "https://app.example.test" },
    "production"
  );
  const response = responseRecorder({ Vary: "Accept-Encoding" });
  const result = applyCors(
    request({ origin: "https://app.example.test" }),
    response,
    config
  );
  assert.equal(result.allowed, true);
  assert.equal(response.getHeader("Access-Control-Allow-Origin"), "https://app.example.test");
  assert.equal(response.getHeader("Vary"), "Accept-Encoding, Origin");
  assert.equal(response.getHeader("Access-Control-Allow-Credentials"), undefined);
});

test("CORS rechaza origenes no autorizados y null", () => {
  const config = getCorsConfiguration(
    { CORS_ALLOWED_ORIGINS: "https://app.example.test" },
    "production"
  );
  for (const origin of ["https://evil.example", "null"]) {
    const response = responseRecorder();
    assert.equal(applyCors(request({ origin }), response, config).allowed, false);
    assert.equal(response.getHeader("Access-Control-Allow-Origin"), undefined);
    assert.equal(response.getHeader("Vary"), "Origin");
  }
});

test("CORS admite clientes sin Origin y prepara OPTIONS valido", () => {
  const config = getCorsConfiguration({}, "development");
  const withoutOrigin = responseRecorder();
  assert.deepEqual(applyCors(request(), withoutOrigin, config), {
    allowed: true,
    hasOrigin: false
  });
  assert.equal(withoutOrigin.getHeader("Access-Control-Allow-Origin"), undefined);

  const preflight = responseRecorder();
  assert.equal(
    applyCors(request({ origin: "http://127.0.0.1:3000" }), preflight, config).allowed,
    true
  );
  assert.equal(preflight.getHeader("Access-Control-Allow-Methods"), "GET,POST,PATCH,DELETE,OPTIONS");
  assert.equal(preflight.getHeader("Access-Control-Allow-Headers"), "Content-Type, Authorization");
});

test("CORS valida configuracion de production y formato de origen", () => {
  assert.throws(
    () => getCorsConfiguration({}, "production"),
    /CORS_ALLOWED_ORIGINS debe incluir/
  );
  for (const invalid of [
    "null",
    "ftp://app.example.test",
    "https://app.example.test/path",
    "https://app.example.test?query=1",
    "https://user:secret@app.example.test"
  ]) {
    assert.throws(
      () => getCorsConfiguration({ CORS_ALLOWED_ORIGINS: invalid }, "production"),
      /CORS_ALLOWED_ORIGINS/
    );
  }
  assert.deepEqual(
    getCorsConfiguration(
      { CORS_ALLOWED_ORIGINS: "https://app.example.test/" },
      "production"
    ).allowedOrigins,
    ["https://app.example.test"]
  );
});

test("API y frontend reciben cabeceras defensivas sin inline ni eval", () => {
  const api = getDefensiveHeaders({ surface: "api", env: {}, nodeEnvironment: "development" });
  const frontend = getDefensiveHeaders({
    surface: "frontend",
    env: {},
    nodeEnvironment: "development"
  });
  for (const headers of [api, frontend]) {
    assert.equal(headers["X-Content-Type-Options"], "nosniff");
    assert.equal(headers["Referrer-Policy"], "no-referrer");
    assert.match(headers["Permissions-Policy"], /camera=\(\)/);
    assert.equal(headers["X-Frame-Options"], "DENY");
    assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
    assert.doesNotMatch(headers["Content-Security-Policy"], /unsafe-inline|unsafe-eval/);
    assert.equal(headers["Strict-Transport-Security"], undefined);
  }
});

test("HSTS solo se habilita con production y HTTPS confirmado", () => {
  const unsafeDevelopment = getDefensiveHeaders({
    surface: "api",
    env: { HTTPS_CONFIRMED: "true" },
    nodeEnvironment: "development"
  });
  assert.equal(unsafeDevelopment["Strict-Transport-Security"], undefined);

  const productionWithoutHttps = getDefensiveHeaders({
    surface: "api",
    env: { HTTPS_CONFIRMED: "false" },
    nodeEnvironment: "production"
  });
  assert.equal(productionWithoutHttps["Strict-Transport-Security"], undefined);

  const secureProduction = getDefensiveHeaders({
    surface: "api",
    env: {
      HTTPS_CONFIRMED: "true",
      HSTS_MAX_AGE_SECONDS: "31536000",
      HSTS_INCLUDE_SUBDOMAINS: "true"
    },
    nodeEnvironment: "production"
  });
  assert.equal(
    secureProduction["Strict-Transport-Security"],
    "max-age=31536000; includeSubDomains"
  );
});

test("normaliza IPv4, IPv6 e IPv4 mapeada dentro de IPv6", () => {
  assert.equal(normalizeIpAddress("192.0.2.10"), "192.0.2.10");
  assert.equal(normalizeIpAddress("2001:0db8:0:0::1"), "2001:db8::1");
  assert.equal(normalizeIpAddress("::ffff:192.0.2.10"), "192.0.2.10");
  assert.equal(normalizeIpAddress("unknown"), "");
});

test("ignora cabeceras reenviadas desde conexiones no confiables", () => {
  const trusted = getTrustedProxyConfiguration({ TRUSTED_PROXY_ADDRESSES: "10.0.0.2" });
  assert.equal(
    resolveClientAddress(
      request({ remoteAddress: "203.0.113.8", xForwardedFor: "198.51.100.4" }),
      trusted
    ),
    "203.0.113.8"
  );
});

test("resuelve cliente original a traves de varios proxies confiables", () => {
  const trusted = getTrustedProxyConfiguration({
    TRUSTED_PROXY_ADDRESSES: "10.0.0.2,10.0.0.3"
  });
  assert.equal(
    resolveClientAddress(
      request({
        remoteAddress: "10.0.0.3",
        xForwardedFor: "198.51.100.4, 10.0.0.2"
      }),
      trusted
    ),
    "198.51.100.4"
  );
  assert.equal(
    resolveClientAddress(
      request({
        remoteAddress: "::ffff:10.0.0.3",
        forwarded: 'for="[2001:db8::8]";proto=https, for=10.0.0.2'
      }),
      trusted
    ),
    "2001:db8::8"
  );
});

test("ignora por completo cadenas reenviadas malformadas", () => {
  const trusted = getTrustedProxyConfiguration({ TRUSTED_PROXY_ADDRESSES: "10.0.0.3" });
  assert.equal(
    resolveClientAddress(
      request({ remoteAddress: "10.0.0.3", xForwardedFor: "198.51.100.4, not-an-ip" }),
      trusted
    ),
    "10.0.0.3"
  );
});

test("correos rotatorios no crean un bloqueo global", () => {
  const limiters = createLoginLimiters({
    AUTH_LOGIN_MAX_FAILURES: "2",
    AUTH_LOGIN_FAILURE_WINDOW_MS: "1000",
    AUTH_LOGIN_LOCK_BASE_MS: "100",
    AUTH_LOGIN_LOCK_MAX_MS: "1000",
    AUTH_LOGIN_MAX_TRACKED_KEYS: "10",
    AUTH_LOGIN_REMOTE_MAX_FAILURES: "3",
    AUTH_LOGIN_REMOTE_FAILURE_WINDOW_MS: "1000",
    AUTH_LOGIN_REMOTE_LOCK_BASE_MS: "100",
    AUTH_LOGIN_REMOTE_LOCK_MAX_MS: "1000",
    AUTH_LOGIN_REMOTE_MAX_TRACKED_KEYS: "10"
  });
  for (const email of ["a", "b", "c"]) {
    limiters.email.recordFailure(email, 0);
    limiters.remote.recordFailure("red-a", 0);
  }
  assert.equal(limiters.remote.check("red-a", 1).allowed, false);
  assert.equal(limiters.remote.check("red-b", 1).allowed, true);
  assert.equal(limiters.email.check("d", 1).allowed, true);
  assert.equal("global" in limiters, false);
});

test("limites por identidad y direccion se recuperan despues de la ventana", () => {
  const limiter = new ProgressiveLoginLimiter({
    maxFailures: 2,
    windowMs: 100,
    baseLockMs: 20,
    maxLockMs: 40,
    maxEntries: 10
  });
  limiter.recordFailure("identity", 0);
  limiter.recordFailure("identity", 1);
  assert.equal(limiter.check("identity", 2).allowed, false);
  assert.equal(limiter.check("identity", 101).allowed, true);
  assert.equal(limiter.size, 0);
});

test("contadores en memoria se limpian y permanecen acotados", () => {
  const limiter = new ProgressiveLoginLimiter({
    maxFailures: 5,
    windowMs: 50,
    baseLockMs: 10,
    maxLockMs: 20,
    maxEntries: 3
  });
  for (const key of ["a", "b", "c", "d", "e"]) {
    limiter.recordFailure(key, 0);
  }
  assert.equal(limiter.size, 3);
  assert.equal(limiter.cleanup(51), 3);
  assert.equal(limiter.size, 0);
});
