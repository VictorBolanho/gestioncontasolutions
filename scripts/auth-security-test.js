import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { ProgressiveLoginLimiter } from "../apps/api/src/lib/auth-login-limiter.js";
import {
  createPasswordCredential,
  hashSessionToken,
  verifyPasswordCredential
} from "../apps/api/src/lib/auth-crypto.js";
import { getAuthenticationErrorResponse } from "../apps/api/src/lib/auth-http.js";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gestorconta-auth-security-"));
const tempDataDir = path.join(tempRoot, "data");
fs.mkdirSync(tempDataDir, { recursive: true });
process.env.NODE_ENV = "test";
process.env.ALLOW_DEMO_SEEDS = "false";
process.env.STORAGE_DRIVER = "json";
process.env.GESTORCONTA_TEST_ROOT = tempRoot;
process.env.GESTORCONTA_DATA_DIR = tempDataDir;
process.env.GESTORCONTA_REQUIRE_TEMP_DATA_DIR = "1";
process.env.AUTH_LOGIN_MAX_FAILURES = "3";
process.env.AUTH_LOGIN_FAILURE_WINDOW_MS = "60000";
process.env.AUTH_LOGIN_LOCK_BASE_MS = "1000";
process.env.AUTH_LOGIN_LOCK_MAX_MS = "8000";
process.env.AUTH_SESSION_TTL_MS = "60000";

function writeJson(fileName, value) {
  fs.writeFileSync(path.join(tempDataDir, fileName), JSON.stringify(value, null, 2));
}

function legacyCredential(password, salt = "legacy-test-salt") {
  return {
    passwordSalt: salt,
    passwordHash: crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex")
  };
}

function containsProperty(value, propertyName) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(value, propertyName)) {
    return true;
  }
  return Object.values(value).some((item) => containsProperty(item, propertyName));
}

test("autenticacion y sesiones usan almacenamiento temporal aislado", async (t) => {
  const legacyPassword = "legacy-password-123";
  const nextPassword = "next-password-456";
  const user = {
    id: "usr_auth_test",
    nombre: "Auth",
    apellido: "Test",
    nombreCompleto: "Auth Test",
    email: "auth-security@example.test",
    cargo: "Owner",
    estado: "activo",
    roles: ["owner"],
    permisos: [],
    empresasAsignadas: [],
    supervisedUsers: [],
    supervisorId: "",
    ...legacyCredential(legacyPassword),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  };

  writeJson("organization.json", { id: "org_auth_test", nombre: "Auth Test", estado: "activa" });
  writeJson("companies.json", []);
  writeJson("users.json", [user]);
  writeJson("sessions.json", []);
  writeJson("audits.json", []);

  const storage = await import("../apps/api/src/lib/storage.js");
  const auth = await import("../apps/api/src/lib/auth-service.js");

  await t.test("scrypt v2 verifica credenciales nuevas y rechaza claves incorrectas", async () => {
    const credential = await createPasswordCredential("a-secure-password");
    assert.match(credential.passwordHash, /^scrypt\$v2\$/);
    assert.equal((await verifyPasswordCredential("a-secure-password", credential)).valid, true);
    assert.equal((await verifyPasswordCredential("wrong-password", credential)).valid, false);
  });

  await t.test("el primer login valido migra SHA-256 heredado a scrypt v2", async () => {
    const result = await auth.login(user.email, legacyPassword);
    assert.equal(typeof result.token, "string");
    assert.equal(result.token.length, 64);

    const savedUser = storage.getUsers().find((item) => item.id === user.id);
    assert.match(savedUser.passwordHash, /^scrypt\$v2\$/);
    assert.equal((await verifyPasswordCredential(legacyPassword, savedUser)).valid, true);

    const savedSession = storage.getSessions()[0];
    assert.equal(savedSession.token, `sha256$${hashSessionToken(result.token)}`);
    assert.notEqual(savedSession.token, result.token);

    const audits = storage.getAudits();
    assert.equal(containsProperty(audits, "token"), false);
    assert.equal(JSON.stringify(audits).includes(result.token), false);
    assert.equal(JSON.stringify(audits).includes(savedSession.token), false);
    assert.equal(auth.getSessionUser(result.token)?.id, user.id);

    auth.logout(result.token);
    assert.equal(auth.getSessionUser(result.token), null);
    assert.equal(storage.getSessions().length, 0);
  });

  await t.test("hashes de sesion heredados reciben prefijo sin perder validacion", () => {
    const legacyToken = crypto.randomBytes(24).toString("hex");
    storage.saveSessions([{
      token: hashSessionToken(legacyToken),
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60000).toISOString()
    }]);
    auth.hardenStoredSessions();
    const stored = storage.getSessions()[0];
    assert.equal(stored.token, `sha256$${hashSessionToken(legacyToken)}`);
    assert.notEqual(stored.token, legacyToken);
    assert.equal(auth.getSessionUser(legacyToken)?.id, user.id);
    auth.logout(legacyToken);
  });

  await t.test("sesiones expiradas se rechazan y eliminan", async () => {
    const result = await auth.login(user.email, legacyPassword);
    const expired = storage.getSessions().map((session) => ({
      ...session,
      expiresAt: new Date(Date.now() - 1000).toISOString()
    }));
    storage.saveSessions(expired);
    assert.equal(auth.getSessionUser(result.token), null);
    assert.equal(storage.getSessions().length, 0);
  });

  await t.test("cambiar la contrasena invalida todas las sesiones", async () => {
    const first = await auth.login(user.email, legacyPassword);
    const second = await auth.login(user.email, legacyPassword);
    const actor = auth.getSessionUser(first.token);
    assert.equal(storage.getSessions().length, 2);

    await auth.updateUser(user.id, { roles: ["owner"], password: nextPassword }, actor);
    assert.equal(storage.getSessions().length, 0);
    assert.equal(auth.getSessionUser(first.token), null);
    assert.equal(auth.getSessionUser(second.token), null);
    await assert.rejects(auth.login(user.email, legacyPassword), (error) => error.statusCode === 401);
    const replacement = await auth.login(user.email, nextPassword);
    assert.equal(auth.getSessionUser(replacement.token)?.id, user.id);
    auth.logout(replacement.token);
  });

  await t.test("intentos fallidos activan bloqueo sin revelar usuarios", async () => {
    const unknownEmail = "missing-user@example.test";
    for (let index = 0; index < 3; index += 1) {
      await assert.rejects(
        auth.login(unknownEmail, "incorrect-password"),
        (error) => error.statusCode === 401 && error.message === "Credenciales invalidas."
      );
    }
    await assert.rejects(
      auth.login(unknownEmail, "incorrect-password"),
      (error) => error.statusCode === 429 && !error.message.includes(unknownEmail)
    );
  });

  await t.test("el bloqueo aumenta progresivamente", () => {
    const limiter = new ProgressiveLoginLimiter({
      maxFailures: 2,
      windowMs: 10000,
      baseLockMs: 100,
      maxLockMs: 1000,
      maxEntries: 10
    });
    limiter.recordFailure("key", 0);
    limiter.recordFailure("key", 1);
    assert.equal(limiter.check("key", 1).retryAfterMs, 100);
    limiter.recordFailure("key", 102);
    assert.equal(limiter.check("key", 102).retryAfterMs, 200);
    limiter.reset("key");
    assert.equal(limiter.check("key", 102).allowed, true);
  });

  await t.test("errores HTTP de autenticacion no exponen detalles internos", () => {
    const internal = getAuthenticationErrorResponse(new Error("ruta/secreta users.json JSON invalido"));
    assert.deepEqual(internal, {
      statusCode: 400,
      payload: { error: "No fue posible iniciar sesion." }
    });
    assert.equal(JSON.stringify(internal).includes("users.json"), false);
  });
});

test.after(() => {
  const resolved = path.resolve(tempRoot);
  const expectedParent = path.resolve(os.tmpdir());
  if (!resolved.startsWith(`${expectedParent}${path.sep}`) || !path.basename(resolved).startsWith("gestorconta-auth-security-")) {
    throw new Error("Se rechazo limpiar una ruta temporal inesperada.");
  }
  fs.rmSync(resolved, { recursive: true, force: true });
});
