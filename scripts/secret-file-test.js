import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readSecretFromEnvironment } from "../apps/api/src/lib/secret-file.js";

test("lee secretos montados desde archivo sin alterar el entorno", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "gestorconta-secret-test-"));
  const fileName = path.join(directory, "secret");
  try {
    fs.writeFileSync(fileName, "valor-aislado\n", { mode: 0o600 });
    assert.equal(readSecretFromEnvironment({ TOKEN_FILE: fileName }, "TOKEN", { required: true }), "valor-aislado");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("rechaza ambiguedad, archivo ausente y secreto obligatorio vacio", () => {
  assert.throws(
    () => readSecretFromEnvironment({ TOKEN: "directo", TOKEN_FILE: "archivo" }, "TOKEN"),
    /no pueden definirse simultaneamente/
  );
  assert.throws(() => readSecretFromEnvironment({ TOKEN_FILE: "ruta-inexistente" }, "TOKEN"), /No se pudo leer/);
  assert.throws(() => readSecretFromEnvironment({}, "TOKEN", { required: true }), /Falta TOKEN o TOKEN_FILE/);
});
