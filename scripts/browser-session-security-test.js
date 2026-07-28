import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  buildExpiredSessionCookie,
  buildSessionCookie,
  createCsrfToken,
  getBrowserSessionConfiguration,
  resolveRequestAuthentication,
  validateCookieRequestSecurity
} from "../apps/api/src/lib/browser-session-security.js";
import { getCorsConfiguration } from "../apps/api/src/lib/http-security.js";

function request({ method = "GET", origin, cookie, authorization, csrf } = {}) {
  return {
    method,
    headers: {
      ...(origin ? { origin } : {}),
      ...(cookie ? { cookie } : {}),
      ...(authorization ? { authorization } : {}),
      ...(csrf ? { "x-csrf-token": csrf } : {})
    }
  };
}

test("cookie de production exige HTTPS y secreto CSRF", () => {
  assert.throws(
    () =>
      getBrowserSessionConfiguration(
        { HTTPS_CONFIRMED: "false", AUTH_CSRF_SECRET: "x".repeat(32) },
        "production"
      ),
    /HTTPS_CONFIRMED=true/
  );
  assert.throws(
    () => getBrowserSessionConfiguration({ HTTPS_CONFIRMED: "true" }, "production"),
    /AUTH_CSRF_SECRET/
  );
});

test("cookie de navegador contiene atributos y expiracion de la sesion", () => {
  const configuration = getBrowserSessionConfiguration(
    {
      HTTPS_CONFIRMED: "true",
      AUTH_CSRF_SECRET: "s".repeat(32),
      AUTH_COOKIE_SAME_SITE: "Lax"
    },
    "production"
  );
  const expiresAt = new Date(Date.now() + 60_000).toISOString();
  const cookie = buildSessionCookie("session-secret", expiresAt, configuration);
  assert.match(cookie, /^__Host-gestorconta_session=/);
  assert.match(cookie, /; Path=\//);
  assert.match(cookie, /; HttpOnly/);
  assert.match(cookie, /; SameSite=Lax/);
  assert.match(cookie, /; Secure/);
  assert.match(cookie, /; Max-Age=(59|60)/);
  assert.match(cookie, new RegExp(`; Expires=${new Date(expiresAt).toUTCString().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
  assert.doesNotMatch(cookie, /; Domain=/i);
});

test("development local usa cookie HttpOnly sin Secure", () => {
  const configuration = getBrowserSessionConfiguration({}, "development");
  const cookie = buildSessionCookie(
    "session-secret",
    new Date(Date.now() + 60_000).toISOString(),
    configuration
  );
  assert.match(cookie, /^gestorconta_session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.doesNotMatch(cookie, /; Secure/);
  assert.match(buildExpiredSessionCookie(configuration), /Max-Age=0/);
});

test("cookie y bearer son modos separados y su mezcla se rechaza", () => {
  const configuration = getBrowserSessionConfiguration({}, "test");
  assert.equal(
    resolveRequestAuthentication(
      request({ cookie: `${configuration.cookieName}=cookie-token` }),
      configuration
    ).mode,
    "cookie"
  );
  assert.equal(
    resolveRequestAuthentication(request({ authorization: "Bearer bearer-token" }), configuration)
      .mode,
    "bearer"
  );
  const conflict = resolveRequestAuthentication(
    request({
      cookie: `${configuration.cookieName}=cookie-token`,
      authorization: "Bearer bearer-token"
    }),
    configuration
  );
  assert.equal(conflict.mode, "conflict");
  assert.doesNotMatch(conflict.error, /cookie-token|bearer-token/);
});

test("CSRF queda ligado a la sesion y exige origen permitido en metodos inseguros", () => {
  const browser = getBrowserSessionConfiguration({}, "test");
  const cors = getCorsConfiguration(
    { CORS_ALLOWED_ORIGINS: "https://app.example.test" },
    "test"
  );
  const authentication = { mode: "cookie", token: "session-a" };
  const csrf = createCsrfToken(authentication.token, browser);
  assert.equal(
    validateCookieRequestSecurity(
      request({
        method: "POST",
        origin: "https://app.example.test",
        csrf
      }),
      authentication,
      cors,
      browser
    ).allowed,
    true
  );
  for (const candidate of [
    request({ method: "POST", csrf }),
    request({ method: "POST", origin: "https://evil.example", csrf }),
    request({ method: "POST", origin: "https://app.example.test", csrf: "wrong" })
  ]) {
    assert.equal(
      validateCookieRequestSecurity(candidate, authentication, cors, browser).allowed,
      false
    );
  }
  assert.equal(
    validateCookieRequestSecurity(
      request({ method: "GET" }),
      authentication,
      cors,
      browser
    ).allowed,
    true
  );
  assert.equal(
    validateCookieRequestSecurity(
      request({ method: "POST" }),
      { mode: "bearer", token: "programmatic" },
      cors,
      browser
    ).allowed,
    true
  );
});

test("frontend no persiste ni envia bearer y usa credenciales de cookie", () => {
  const source = fs.readFileSync(new URL("../apps/web/src/app.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /localStorage\.(getItem|setItem)/);
  assert.doesNotMatch(source, /sessionStorage\.(getItem|setItem)/);
  assert.doesNotMatch(source, /Authorization|Bearer|authToken/);
  assert.match(source, /credentials:\s*"include"/);
  assert.match(source, /X-Auth-Mode["']:\s*"cookie"/);
  assert.match(source, /X-CSRF-Token/);
  assert.match(source, /localStorage\.removeItem/);
});
