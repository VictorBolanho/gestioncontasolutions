import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.join(__dirname, "data", "ciiu-catalog.json");

const UNKNOWN_ACTIVITY_NAME = "Actividad no registrada en catalogo";

let cachedCatalog = null;

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function loadCatalog() {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  try {
    const raw = fs.readFileSync(catalogPath, "utf-8");
    const parsed = JSON.parse(raw);
    cachedCatalog = Array.isArray(parsed) ? parsed : [];
  } catch {
    cachedCatalog = [];
  }

  return cachedCatalog;
}

export function normalizeCiiuCode(code) {
  return String(code || "").replace(/\D/g, "").slice(0, 4);
}

export function getCiiuActivityByCode(code) {
  const normalizedCode = normalizeCiiuCode(code);
  if (!normalizedCode) {
    return null;
  }

  return loadCatalog().find((item) => normalizeCiiuCode(item.codigo) === normalizedCode) || null;
}

export function getCiiuActivityName(code) {
  return getCiiuActivityByCode(code)?.nombre || UNKNOWN_ACTIVITY_NAME;
}

export function enrichEconomicActivity(code) {
  const normalizedCode = normalizeCiiuCode(code);
  const activity = getCiiuActivityByCode(normalizedCode);

  if (!normalizedCode) {
    return {
      codigo: "",
      nombre: UNKNOWN_ACTIVITY_NAME,
      fuente: "pendiente_catalogo",
      estado: "pendiente"
    };
  }

  if (!activity) {
    return {
      codigo: normalizedCode,
      nombre: UNKNOWN_ACTIVITY_NAME,
      fuente: "pendiente_catalogo",
      estado: "pendiente"
    };
  }

  return {
    ...activity,
    codigo: normalizedCode,
    fuente: "catalogo_ciiu"
  };
}

export function searchCiiuActivities(query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return loadCatalog();
  }

  return loadCatalog().filter((item) => {
    const code = normalizeCiiuCode(item.codigo);
    const name = normalizeText(item.nombre);
    return code.includes(normalizedQuery) || name.includes(normalizedQuery);
  });
}

export function listCiiuActivities() {
  return loadCatalog();
}

// El catalogo CIIU puede reemplazarse o ampliarse con una version oficial convertida a JSON o CSV.
// La logica del sistema no debe depender de valores quemados; si un codigo no existe en el catalogo,
// se mantiene el flujo operativo y se marca como pendiente para futura actualizacion del catalogo.
