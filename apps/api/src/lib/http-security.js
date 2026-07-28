import net from "node:net";

const DEVELOPMENT_CORS_ORIGINS = Object.freeze([
  "http://127.0.0.1:3000",
  "http://localhost:3000"
]);
const DEFAULT_HSTS_MAX_AGE = 31536000;

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

function normalizedHttpOrigin(value, name) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "null") {
    throw new Error(`${name} contiene un origen vacio o no permitido.`);
  }
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${name} contiene un origen que no es una URL valida.`);
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(`${name} solo admite origenes HTTP/HTTPS sin ruta, credenciales, consulta ni fragmento.`);
  }
  return parsed.origin;
}

function parseOriginList(value, name) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return [];
  }
  return Array.from(
    new Set(raw.split(",").map((item) => normalizedHttpOrigin(item, name)))
  );
}

export function getCorsConfiguration(env = process.env, nodeEnvironment = env.NODE_ENV) {
  const configured = parseOriginList(env.CORS_ALLOWED_ORIGINS, "CORS_ALLOWED_ORIGINS");
  const allowedOrigins =
    nodeEnvironment === "development"
      ? Array.from(new Set([...DEVELOPMENT_CORS_ORIGINS, ...configured]))
      : configured;
  if (nodeEnvironment === "production" && allowedOrigins.length === 0) {
    throw new Error("CORS_ALLOWED_ORIGINS debe incluir al menos un origen valido en production.");
  }
  return Object.freeze({
    allowedOrigins: Object.freeze(allowedOrigins),
    allowedOriginSet: new Set(allowedOrigins)
  });
}

function appendVary(response, value) {
  const existing = String(response.getHeader?.("Vary") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!existing.some((item) => item.toLowerCase() === value.toLowerCase())) {
    existing.push(value);
  }
  response.setHeader("Vary", existing.join(", "));
}

function hstsHeader(env, nodeEnvironment) {
  const httpsConfirmed = explicitBoolean(env.HTTPS_CONFIRMED, "HTTPS_CONFIRMED", false);
  if (nodeEnvironment !== "production" || !httpsConfirmed) {
    return "";
  }
  const rawMaxAge = String(env.HSTS_MAX_AGE_SECONDS ?? DEFAULT_HSTS_MAX_AGE).trim();
  if (!/^[1-9][0-9]*$/.test(rawMaxAge)) {
    throw new Error("HSTS_MAX_AGE_SECONDS debe ser un entero positivo.");
  }
  const maxAge = Number(rawMaxAge);
  if (!Number.isSafeInteger(maxAge) || maxAge > 63072000) {
    throw new Error("HSTS_MAX_AGE_SECONDS excede el maximo permitido.");
  }
  const includeSubDomains = explicitBoolean(
    env.HSTS_INCLUDE_SUBDOMAINS,
    "HSTS_INCLUDE_SUBDOMAINS",
    false
  );
  return `max-age=${maxAge}${includeSubDomains ? "; includeSubDomains" : ""}`;
}

export function getDefensiveHeaders({
  surface,
  env = process.env,
  nodeEnvironment = env.NODE_ENV
}) {
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "X-Frame-Options": "DENY"
  };
  if (surface === "frontend") {
    const configuredConnectSources = parseOriginList(
      env.FRONTEND_CSP_CONNECT_SOURCES,
      "FRONTEND_CSP_CONNECT_SOURCES"
    );
    const developmentSources =
      nodeEnvironment === "development"
        ? ["http://127.0.0.1:4000", "http://localhost:4000"]
        : [];
    const connectSources = Array.from(
      new Set(["'self'", ...developmentSources, ...configuredConnectSources])
    ).join(" ");
    headers["Content-Security-Policy"] =
      `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; ` +
      `connect-src ${connectSources}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`;
  } else {
    headers["Content-Security-Policy"] =
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
  }
  const hsts = hstsHeader(env, nodeEnvironment);
  if (hsts) {
    headers["Strict-Transport-Security"] = hsts;
  }
  return Object.freeze(headers);
}

export function applyDefensiveHeaders(response, options) {
  for (const [name, value] of Object.entries(getDefensiveHeaders(options))) {
    response.setHeader(name, value);
  }
}

export function applyCors(request, response, corsConfiguration) {
  const origin = String(request.headers?.origin ?? "").trim();
  if (!origin) {
    return { allowed: true, hasOrigin: false };
  }
  appendVary(response, "Origin");
  let normalizedOrigin = "";
  try {
    normalizedOrigin = normalizedHttpOrigin(origin, "Origin");
  } catch {
    return { allowed: false, hasOrigin: true };
  }
  if (!corsConfiguration.allowedOriginSet.has(normalizedOrigin)) {
    return { allowed: false, hasOrigin: true };
  }
  response.setHeader("Access-Control-Allow-Origin", normalizedOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Auth-Mode, X-CSRF-Token"
  );
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Max-Age", "600");
  return { allowed: true, hasOrigin: true };
}

export function normalizeIpAddress(value) {
  let address = String(value ?? "").trim();
  if (!address || address.includes("%")) {
    return "";
  }
  if (address.startsWith("[") && address.endsWith("]")) {
    address = address.slice(1, -1);
  }
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address);
  if (mapped && net.isIP(mapped[1]) === 4) {
    return mapped[1];
  }
  const version = net.isIP(address);
  if (version === 4) {
    return address;
  }
  if (version === 6) {
    const canonical = new URL(`http://[${address}]/`).hostname;
    return canonical.slice(1, -1).toLowerCase();
  }
  return "";
}

export function getTrustedProxyConfiguration(env = process.env) {
  const raw = String(env.TRUSTED_PROXY_ADDRESSES ?? "").trim();
  const addresses = raw
    ? raw.split(",").map((item) => {
        const normalized = normalizeIpAddress(item);
        if (!normalized) {
          throw new Error("TRUSTED_PROXY_ADDRESSES contiene una direccion IP invalida.");
        }
        return normalized;
      })
    : [];
  return Object.freeze({ addresses: Object.freeze(addresses), addressSet: new Set(addresses) });
}

function forwardedForValues(header) {
  const raw = String(header ?? "").trim();
  if (!raw) {
    return [];
  }
  const values = [];
  for (const element of raw.split(",")) {
    const pair = element
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.toLowerCase().startsWith("for="));
    if (!pair) {
      return null;
    }
    let value = pair.slice(4).trim().replace(/^"|"$/g, "");
    if (value.startsWith("[")) {
      const match = /^\[([^\]]+)\](?::\d+)?$/.exec(value);
      if (!match) {
        return null;
      }
      value = match[1];
    } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(value)) {
      value = value.slice(0, value.lastIndexOf(":"));
    }
    const normalized = normalizeIpAddress(value);
    if (!normalized) {
      return null;
    }
    values.push(normalized);
  }
  return values;
}

function xForwardedForValues(header) {
  const raw = String(header ?? "").trim();
  if (!raw) {
    return [];
  }
  const values = raw.split(",").map((item) => normalizeIpAddress(item));
  return values.some((item) => !item) ? null : values;
}

export function resolveClientAddress(request, trustedProxies = getTrustedProxyConfiguration()) {
  const direct = normalizeIpAddress(request.socket?.remoteAddress);
  if (!direct) {
    return "unknown";
  }
  if (!trustedProxies.addressSet.has(direct)) {
    return direct;
  }
  const forwarded = request.headers?.forwarded
    ? forwardedForValues(request.headers.forwarded)
    : xForwardedForValues(request.headers?.["x-forwarded-for"]);
  if (!forwarded || forwarded.length === 0) {
    return direct;
  }
  const chain = [...forwarded, direct];
  let index = chain.length - 1;
  while (index > 0 && trustedProxies.addressSet.has(chain[index])) {
    index -= 1;
  }
  return chain[index];
}
