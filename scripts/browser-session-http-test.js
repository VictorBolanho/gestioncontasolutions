import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { TEST_USERS } from "./test-credentials.js";

const API_BASE_URL = String(process.env.API_BASE_URL || "").trim();
const WEB_BASE_URL = String(process.env.WEB_BASE_URL || "").trim();
const DATA_DIR = String(process.env.GESTORCONTA_DATA_DIR || "").trim();

if (!API_BASE_URL || !WEB_BASE_URL || !DATA_DIR || process.env.GESTORCONTA_REQUIRE_TEMP_DATA_DIR !== "1") {
  throw new Error("La prueba de sesion web requiere API, frontend y almacenamiento temporal aislado.");
}

function cookiePair(setCookie) {
  return String(setCookie || "").split(";", 1)[0];
}

async function request(
  pathname,
  { method = "GET", body, cookie = "", csrf = "", bearer = "", origin = "" } = {}
) {
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (cookie) {
    headers.Cookie = cookie;
  }
  if (csrf) {
    headers["X-CSRF-Token"] = csrf;
  }
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }
  if (origin) {
    headers.Origin = origin;
  }
  const response = await fetch(`${API_BASE_URL}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  return { response, payload };
}

async function programmaticLogin(user) {
  const { response, payload } = await request("/api/auth/login", {
    method: "POST",
    body: { email: user.email, password: user.password }
  });
  assert.equal(response.status, 200);
  assert.ok(payload.token);
  return payload.token;
}

async function browserLogin(user) {
  const { response, payload } = await request("/api/auth/login", {
    method: "POST",
    origin: WEB_BASE_URL,
    body: { email: user.email, password: user.password }
  });
  assert.equal(response.status, 400, "Un login con Origin sin modo cookie debe rechazarse.");

  const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Mode": "cookie",
      Origin: WEB_BASE_URL
    },
    body: JSON.stringify({ email: user.email, password: user.password })
  });
  const loginPayload = await loginResponse.json();
  assert.equal(loginResponse.status, 200, JSON.stringify(loginPayload));
  assert.equal("token" in loginPayload, false);
  assert.ok(loginPayload.user?.id);
  assert.ok(loginPayload.csrfToken);
  const setCookie = loginResponse.headers.get("set-cookie");
  assert.match(setCookie, /^gestorconta_session=/);
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Lax/);
  assert.match(setCookie, /Path=\//);
  assert.match(setCookie, /Max-Age=/);
  assert.match(setCookie, /Expires=/);
  assert.doesNotMatch(setCookie, /Secure|Domain=/);
  return {
    cookie: cookiePair(setCookie),
    csrf: loginPayload.csrfToken,
    user: loginPayload.user
  };
}

async function expireSession(cookie) {
  const rawToken = decodeURIComponent(cookie.slice(cookie.indexOf("=") + 1));
  const tokenHash = `sha256$${crypto.createHash("sha256").update(rawToken).digest("hex")}`;
  const sessionsPath = path.join(DATA_DIR, "sessions.json");
  const sessions = JSON.parse(await fs.readFile(sessionsPath, "utf8"));
  const session = sessions.find((item) => item.token === tokenHash);
  assert.ok(session, "No se encontro la sesion temporal que se iba a vencer.");
  session.expiresAt = new Date(Date.now() - 1000).toISOString();
  await fs.writeFile(sessionsPath, `${JSON.stringify(sessions, null, 2)}\n`);
}

async function main() {
  const ownerBearer = await programmaticLogin(TEST_USERS.owner);
  const junior = await browserLogin(TEST_USERS.juniorAlpha);

  const firstSession = await request("/api/auth/session", {
    cookie: junior.cookie,
    origin: WEB_BASE_URL
  });
  assert.equal(firstSession.response.status, 200);
  assert.equal(firstSession.payload.user.id, junior.user.id);
  assert.equal(firstSession.payload.csrfToken, junior.csrf);

  const reloadedSession = await request("/api/auth/session", {
    cookie: junior.cookie,
    origin: WEB_BASE_URL
  });
  assert.equal(reloadedSession.response.status, 200);

  const bootstrap = await request("/api/bootstrap", {
    cookie: junior.cookie,
    origin: WEB_BASE_URL
  });
  assert.equal(bootstrap.response.status, 200);
  assert.equal(bootstrap.payload.currentUser.id, junior.user.id);

  const missingCsrf = await request("/api/auth/logout", {
    method: "POST",
    cookie: junior.cookie,
    origin: WEB_BASE_URL
  });
  assert.equal(missingCsrf.response.status, 403);
  assert.doesNotMatch(JSON.stringify(missingCsrf.payload), new RegExp(junior.cookie.split("=")[1]));

  const missingOrigin = await request("/api/auth/logout", {
    method: "POST",
    cookie: junior.cookie,
    csrf: junior.csrf
  });
  assert.equal(missingOrigin.response.status, 403);

  const rejectedOrigin = await request("/api/auth/logout", {
    method: "POST",
    cookie: junior.cookie,
    csrf: junior.csrf,
    origin: "https://evil.example"
  });
  assert.equal(rejectedOrigin.response.status, 403);

  const conflict = await request("/api/auth/session", {
    cookie: junior.cookie,
    bearer: ownerBearer,
    origin: WEB_BASE_URL
  });
  assert.equal(conflict.response.status, 400);
  assert.doesNotMatch(JSON.stringify(conflict.payload), /gestorconta_session=|Bearer /);

  const modeSwitch = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Mode": "cookie",
      Authorization: `Bearer ${ownerBearer}`,
      Origin: WEB_BASE_URL
    },
    body: JSON.stringify(TEST_USERS.owner)
  });
  assert.equal(modeSwitch.status, 400);

  const bearerSession = await request("/api/auth/session", { bearer: ownerBearer });
  assert.equal(bearerSession.response.status, 200);
  assert.equal(bearerSession.payload.user.email, TEST_USERS.owner.email);

  const expiring = await browserLogin(TEST_USERS.apprentice);
  await expireSession(expiring.cookie);
  const expired = await request("/api/auth/session", {
    cookie: expiring.cookie,
    origin: WEB_BASE_URL
  });
  assert.equal(expired.response.status, 401);
  assert.match(expired.response.headers.get("set-cookie"), /Max-Age=0/);

  const users = await request("/api/users", { bearer: ownerBearer });
  const juniorRecord = users.payload.items.find((item) => item.id === junior.user.id);
  assert.ok(juniorRecord);
  const inactive = await request(`/api/users/${junior.user.id}`, {
    method: "PATCH",
    bearer: ownerBearer,
    body: { estado: "inactivo" }
  });
  assert.equal(inactive.response.status, 200);
  const inactiveSession = await request("/api/auth/session", {
    cookie: junior.cookie,
    origin: WEB_BASE_URL
  });
  assert.equal(inactiveSession.response.status, 401);
  assert.match(inactiveSession.response.headers.get("set-cookie"), /Max-Age=0/);
  const restored = await request(`/api/users/${junior.user.id}`, {
    method: "PATCH",
    bearer: ownerBearer,
    body: { estado: "activo" }
  });
  assert.equal(restored.response.status, 200);

  const finalSession = await browserLogin(TEST_USERS.juniorAlpha);
  const logout = await request("/api/auth/logout", {
    method: "POST",
    cookie: finalSession.cookie,
    csrf: finalSession.csrf,
    origin: WEB_BASE_URL
  });
  assert.equal(logout.response.status, 200);
  assert.match(logout.response.headers.get("set-cookie"), /Max-Age=0/);
  const afterLogout = await request("/api/auth/session", {
    cookie: finalSession.cookie,
    origin: WEB_BASE_URL
  });
  assert.equal(afterLogout.response.status, 401);

  await request("/api/auth/logout", { method: "POST", bearer: ownerBearer });
  console.log("[done] Sesion web HttpOnly, CSRF, recarga, inactividad y logout validados.");
}

await main();
