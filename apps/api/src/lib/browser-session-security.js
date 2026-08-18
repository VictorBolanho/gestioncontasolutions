import crypto from "node:crypto";
import { readSecretFromEnvironment } from "./secret-file.js";

const DEVELOPMENT_CSRF_SECRET = crypto.randomBytes(32).toString("hex");
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const COOKIE_SAME_SITE_VALUES = new Map([
  ["lax", "Lax"],
  ["strict", "Strict"],
  ["none", "None"]
]);

function explicitBoolean(value, name, fallback = false) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  throw new Error(`${name} debe ser true o false.`);
}

function normalizeSameSite(value) {
  const normalized = String(value ?? "lax").trim().toLowerCase();
  const sameSite = COOKIE_SAME_SITE_VALUES.get(normalized);
  if (!sameSite) {
    throw new Error("AUTH_COOKIE_SAME_SITE debe ser Lax, Strict o None.");
  }
  return sameSite;
}

export function getBrowserSessionConfiguration(
  env = process.env,
  nodeEnvironment = env.NODE_ENV
) {
  const production = nodeEnvironment === "production";
  const httpsConfirmed = explicitBoolean(env.HTTPS_CONFIRMED, "HTTPS_CONFIRMED", false);
  if (production && !httpsConfirmed) {
    throw new Error(
      "HTTPS_CONFIRMED=true es obligatorio en production para habilitar cookies de sesion seguras."
    );
  }

  const sameSite = normalizeSameSite(env.AUTH_COOKIE_SAME_SITE);
  const secure = production;
  if (sameSite === "None" && !secure) {
    throw new Error("AUTH_COOKIE_SAME_SITE=None requiere una cookie Secure en production.");
  }

  const configuredSecret = readSecretFromEnvironment(env, "AUTH_CSRF_SECRET");
  if (production && configuredSecret.length < 32) {
    throw new Error("AUTH_CSRF_SECRET debe tener al menos 32 caracteres en production.");
  }

  return Object.freeze({
    cookieName: secure ? "__Host-gestorconta_session" : "gestorconta_session",
    csrfHeaderName: "x-csrf-token",
    csrfSecret: configuredSecret || DEVELOPMENT_CSRF_SECRET,
    sameSite,
    secure
  });
}

function cookieAttributes(configuration) {
  return [
    "Path=/",
    "HttpOnly",
    `SameSite=${configuration.sameSite}`,
    ...(configuration.secure ? ["Secure"] : [])
  ];
}

export function buildSessionCookie(token, expiresAt, configuration) {
  const expiration = new Date(expiresAt);
  const remainingSeconds = Math.max(0, Math.floor((expiration.getTime() - Date.now()) / 1000));
  if (!token || !Number.isFinite(expiration.getTime()) || remainingSeconds < 1) {
    throw new Error("No se puede emitir una cookie para una sesion invalida o vencida.");
  }
  return [
    `${configuration.cookieName}=${encodeURIComponent(token)}`,
    ...cookieAttributes(configuration),
    `Max-Age=${remainingSeconds}`,
    `Expires=${expiration.toUTCString()}`
  ].join("; ");
}

export function buildExpiredSessionCookie(configuration) {
  return [
    `${configuration.cookieName}=`,
    ...cookieAttributes(configuration),
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  ].join("; ");
}

function parseCookieToken(cookieHeader, cookieName) {
  const matches = [];
  for (const pair of String(cookieHeader ?? "").split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0) {
      continue;
    }
    const name = pair.slice(0, separator).trim();
    if (name !== cookieName) {
      continue;
    }
    try {
      matches.push(decodeURIComponent(pair.slice(separator + 1).trim()));
    } catch {
      return { token: "", malformed: true };
    }
  }
  if (matches.length > 1 || matches.some((token) => !token)) {
    return { token: "", malformed: true };
  }
  return { token: matches[0] || "", malformed: false };
}

function parseBearerToken(authorization) {
  const header = String(authorization ?? "").trim();
  if (!header) {
    return { token: "", malformed: false };
  }
  const match = /^Bearer[ \t]+([^ \t]+)$/i.exec(header);
  if (!match) {
    return { token: "", malformed: true };
  }
  return { token: match[1], malformed: false };
}

export function resolveRequestAuthentication(request, configuration) {
  const bearer = parseBearerToken(request.headers?.authorization);
  const cookie = parseCookieToken(request.headers?.cookie, configuration.cookieName);
  if (bearer.malformed || cookie.malformed) {
    return { mode: "invalid", token: "", error: "Credenciales de sesion malformadas." };
  }
  if (bearer.token && cookie.token) {
    return {
      mode: "conflict",
      token: "",
      error: "No combines cookie de sesion y Authorization Bearer."
    };
  }
  if (cookie.token) {
    return { mode: "cookie", token: cookie.token, error: "" };
  }
  if (bearer.token) {
    return { mode: "bearer", token: bearer.token, error: "" };
  }
  return { mode: "none", token: "", error: "" };
}

export function createCsrfToken(sessionToken, configuration) {
  return crypto
    .createHmac("sha256", configuration.csrfSecret)
    .update(String(sessionToken || ""))
    .digest("base64url");
}

export function csrfTokenMatches(candidate, sessionToken, configuration) {
  const expected = Buffer.from(createCsrfToken(sessionToken, configuration));
  const received = Buffer.from(String(candidate ?? ""));
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

export function isUnsafeHttpMethod(method) {
  return !SAFE_METHODS.has(String(method || "GET").toUpperCase());
}

export function isAllowedBrowserOrigin(request, corsConfiguration) {
  const origin = String(request.headers?.origin ?? "").trim();
  return Boolean(origin && corsConfiguration.allowedOriginSet.has(origin));
}

export function validateCookieRequestSecurity(
  request,
  authentication,
  corsConfiguration,
  browserSessionConfiguration
) {
  if (authentication.mode !== "cookie" || !isUnsafeHttpMethod(request.method)) {
    return { allowed: true, statusCode: 200, error: "" };
  }
  if (!isAllowedBrowserOrigin(request, corsConfiguration)) {
    return { allowed: false, statusCode: 403, error: "Origen requerido para esta operacion." };
  }
  if (
    !csrfTokenMatches(
      request.headers?.[browserSessionConfiguration.csrfHeaderName],
      authentication.token,
      browserSessionConfiguration
    )
  ) {
    return { allowed: false, statusCode: 403, error: "Validacion CSRF rechazada." };
  }
  return { allowed: true, statusCode: 200, error: "" };
}
