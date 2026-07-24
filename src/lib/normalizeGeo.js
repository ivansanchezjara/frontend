/**
 * Normalización de departamento/ciudad contra los valores oficiales de paraguay.js.
 * Compara sin tildes y en lowercase para tolerar errores de escritura en CSV.
 */
import { DEPARTAMENTOS, CIUDADES_POR_DEPARTAMENTO } from "@/config/paraguay";

/**
 * Elimina tildes/diacríticos y pasa a lowercase para comparación.
 */
function normalize(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Precalcular mapas normalizados para búsqueda rápida
const DEPARTAMENTOS_MAP = new Map(
  DEPARTAMENTOS.map((d) => [normalize(d), d])
);

const CIUDADES_MAP = new Map();
for (const [dep, ciudades] of Object.entries(CIUDADES_POR_DEPARTAMENTO)) {
  for (const ciudad of ciudades) {
    // Key: "dep_normalizado|ciudad_normalizada" → valor oficial
    CIUDADES_MAP.set(`${normalize(dep)}|${normalize(ciudad)}`, ciudad);
  }
}

// Mapa global de ciudades (sin importar departamento) para fallback
const CIUDADES_GLOBAL_MAP = new Map();
for (const ciudades of Object.values(CIUDADES_POR_DEPARTAMENTO)) {
  for (const ciudad of ciudades) {
    const key = normalize(ciudad);
    // Si hay duplicados (misma ciudad en varios deptos), guardar el primero
    if (!CIUDADES_GLOBAL_MAP.has(key)) {
      CIUDADES_GLOBAL_MAP.set(key, ciudad);
    }
  }
}

/**
 * Intenta matchear un departamento contra la lista oficial.
 * @param {string} input - Valor del CSV (ej: "asuncion", "Alto Parana")
 * @returns {{ value: string, error: string|null }} - value es el oficial o "" si no matchea
 */
export function matchDepartamento(input) {
  if (!input || !input.trim()) return { value: "", error: null };

  const key = normalize(input);
  const match = DEPARTAMENTOS_MAP.get(key);

  if (match) return { value: match, error: null };

  // Intento parcial: si el input está contenido en un departamento o viceversa
  for (const [normKey, oficial] of DEPARTAMENTOS_MAP) {
    if (normKey.includes(key) || key.includes(normKey)) {
      return { value: oficial, error: null };
    }
  }

  return { value: "", error: `Departamento "${input}" no encontrado en el sistema.` };
}

/**
 * Intenta matchear una ciudad contra la lista oficial.
 * Si se proporciona departamento, busca dentro de ese departamento primero.
 * @param {string} input - Valor del CSV (ej: "ciudad del este", "Asuncion")
 * @param {string} departamento - Departamento ya normalizado (opcional)
 * @returns {{ value: string, error: string|null }}
 */
export function matchCiudad(input, departamento = "") {
  if (!input || !input.trim()) return { value: "", error: null };

  const key = normalize(input);

  // Primero: buscar en el departamento específico si se proporcionó
  if (departamento) {
    const depKey = normalize(departamento);
    const exactMatch = CIUDADES_MAP.get(`${depKey}|${key}`);
    if (exactMatch) return { value: exactMatch, error: null };

    // Buscar parcial dentro del departamento
    const ciudadesDep = CIUDADES_POR_DEPARTAMENTO[departamento] || [];
    for (const ciudad of ciudadesDep) {
      const normCiudad = normalize(ciudad);
      if (normCiudad.includes(key) || key.includes(normCiudad)) {
        return { value: ciudad, error: null };
      }
    }
  }

  // Fallback: buscar en todas las ciudades
  const globalMatch = CIUDADES_GLOBAL_MAP.get(key);
  if (globalMatch) return { value: globalMatch, error: null };

  // Parcial global
  for (const [normKey, oficial] of CIUDADES_GLOBAL_MAP) {
    if (normKey.includes(key) || key.includes(normKey)) {
      return { value: oficial, error: null };
    }
  }

  return { value: "", error: `Ciudad "${input}" no encontrada en el sistema.` };
}

// Mapa inverso: ciudad normalizada → departamento oficial
// Útil para inferir departamento cuando el CSV no lo trae
const CIUDAD_A_DEPARTAMENTO_MAP = new Map();
for (const [dep, ciudades] of Object.entries(CIUDADES_POR_DEPARTAMENTO)) {
  for (const ciudad of ciudades) {
    const key = normalize(ciudad);
    if (!CIUDAD_A_DEPARTAMENTO_MAP.has(key)) {
      CIUDAD_A_DEPARTAMENTO_MAP.set(key, dep);
    }
  }
}

/**
 * Dado un nombre de ciudad (ya normalizado o no), devuelve su departamento oficial.
 * Retorna "" si no encuentra match.
 */
export function inferirDepartamento(ciudad) {
  if (!ciudad) return "";
  const key = normalize(ciudad);
  if (CIUDAD_A_DEPARTAMENTO_MAP.has(key)) return CIUDAD_A_DEPARTAMENTO_MAP.get(key);
  // Parcial
  for (const [normKey, dep] of CIUDAD_A_DEPARTAMENTO_MAP) {
    if (normKey.includes(key) || key.includes(normKey)) return dep;
  }
  return "";
}

/**
 * Normaliza departamento y ciudad de un objeto de fila CSV.
 * Modifica el objeto in-place y retorna errores si los hay.
 * Si departamento viene vacío pero ciudad tiene valor, infiere el departamento automáticamente.
 * @param {object} row - Objeto con campos departamento/ciudad
 * @returns {string[]} - Array de errores (vacío si todo OK)
 */
export function normalizeGeoRow(row) {
  const errors = [];

  if (row.departamento) {
    const depResult = matchDepartamento(row.departamento);
    if (depResult.error) {
      errors.push(depResult.error);
    } else {
      row.departamento = depResult.value;
    }
  }

  if (row.ciudad) {
    // Si no hay departamento, intentar inferirlo desde la ciudad
    if (!row.departamento) {
      const depInferido = inferirDepartamento(row.ciudad);
      if (depInferido) row.departamento = depInferido;
    }

    const cityResult = matchCiudad(row.ciudad, row.departamento);
    if (cityResult.error) {
      errors.push(cityResult.error);
    } else {
      row.ciudad = cityResult.value;
    }
  }

  return errors;
}
