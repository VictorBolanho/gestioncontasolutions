import os from "node:os";
import path from "node:path";

function isInside(parentPath, candidatePath) {
  const relative = path.relative(parentPath, candidatePath);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export function resolveConfiguredDataDirectory(defaultDataDir) {
  const operationalDataDir = path.resolve(defaultDataDir);
  const configuredDataDir = String(process.env.GESTORCONTA_DATA_DIR || "").trim();
  const resolvedDataDir = configuredDataDir ? path.resolve(configuredDataDir) : operationalDataDir;
  const requireTemporaryStorage = String(process.env.GESTORCONTA_REQUIRE_TEMP_DATA_DIR || "").trim() === "1";

  if (!requireTemporaryStorage) {
    return resolvedDataDir;
  }

  const configuredTestRoot = String(process.env.GESTORCONTA_TEST_ROOT || "").trim();
  if (!configuredDataDir || !configuredTestRoot) {
    throw new Error(
      "Almacenamiento de prueba rechazado: GESTORCONTA_DATA_DIR y GESTORCONTA_TEST_ROOT son obligatorios."
    );
  }

  const testRoot = path.resolve(configuredTestRoot);
  const systemTempRoot = path.resolve(os.tmpdir());
  if (!isInside(systemTempRoot, testRoot)) {
    throw new Error("Almacenamiento de prueba rechazado: el directorio raiz no pertenece al temporal del sistema.");
  }
  if (!isInside(testRoot, resolvedDataDir)) {
    throw new Error("Almacenamiento de prueba rechazado: el directorio de datos no pertenece a la prueba aislada.");
  }
  if (resolvedDataDir === operationalDataDir) {
    throw new Error("Almacenamiento de prueba rechazado: no se permite usar el directorio operativo.");
  }

  return resolvedDataDir;
}
