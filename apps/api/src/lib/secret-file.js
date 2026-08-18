import fs from "node:fs";

export function readSecretFromEnvironment(env, name, { required = false } = {}) {
  const direct = String(env[name] ?? "").trim();
  const fileName = String(env[`${name}_FILE`] ?? "").trim();
  if (direct && fileName) {
    throw new Error(`${name} y ${name}_FILE no pueden definirse simultaneamente.`);
  }

  let value = direct;
  if (fileName) {
    try {
      value = fs.readFileSync(fileName, "utf8").trim();
    } catch (error) {
      throw new Error(`No se pudo leer ${name}_FILE: ${error.code || "error_desconocido"}.`);
    }
  }
  if (required && !value) {
    throw new Error(`Falta ${name} o ${name}_FILE.`);
  }
  return value;
}
