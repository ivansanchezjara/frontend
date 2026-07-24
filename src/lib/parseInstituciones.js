/**
 * Parser de CSV para instituciones y utilidades relacionadas.
 * Extraído de la página de instituciones para facilitar testing y reutilización.
 */
import { normalizeGeoRow } from "@/lib/normalizeGeo";

/**
 * Infiere el tipo de oferta académica a partir del nombre.
 */
export function inferirTipoOferta(nombre) {
  const lower = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (
    lower.startsWith("especializacion en") ||
    lower.startsWith("especialidad en")
  )
    return "especializacion";
  if (lower.startsWith("maestria") || lower.startsWith("master"))
    return "maestria";
  if (lower.startsWith("doctorado")) return "doctorado";
  if (lower.startsWith("diplomado")) return "diplomado";
  if (lower.startsWith("tecnicatura") || lower.startsWith("tecnico"))
    return "tecnicatura";
  if (lower.startsWith("curso") || lower.startsWith("taller")) return "curso";
  if (lower.startsWith("residencia") || lower.startsWith("posgrado"))
    return "posgrado";
  return "grado";
}

/**
 * Parsea un CSV/TSV/TXT de instituciones.
 * Agrupa filas con el mismo nombre para acumular oferta académica.
 * Normaliza departamento y ciudad contra la lista oficial de Paraguay.
 *
 * @param {string} text - Contenido crudo del archivo CSV
 * @returns {Array} - Lista de instituciones parseadas con _errores y _filas metadata
 */
export function parseInstitucionesCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  let sep = ";";
  if (firstLine.includes("\t")) sep = "\t";
  else if (!firstLine.includes(";") && firstLine.includes(",")) sep = ",";

  const rows = lines.map((line) =>
    line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""))
  );

  const normalizeHeader = (h) =>
    h
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s*\(.*?\)\s*/g, "")
      .replace(/[^a-z0-9/_\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const header = rows[0].map(normalizeHeader);
  const KNOWN = [
    "nombre",
    "institucion",
    "instituto",
    "universidad",
    "abreviatura",
    "sigla",
    "departamento",
    "ciudad",
    "telefono",
    "especialidad",
    "especialidades",
    "carrera",
    "carreras",
    "oferta",
  ];
  const hasHeader = header.some((h) => KNOWN.includes(h));
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const numCols = Math.max(...rows.map((r) => r.length));

  const col = (keywords, fb3, fb4, fb7) => {
    if (hasHeader) {
      const idx = header.findIndex((h) => keywords.includes(h));
      return idx >= 0 ? idx : -1;
    }
    if (numCols <= 3) return fb3 ?? -1;
    if (numCols <= 4) return fb4 ?? -1;
    return fb7 ?? -1;
  };

  const nameCol = col(
    ["nombre", "institucion", "instituto", "universidad"],
    0,
    0,
    0
  );
  const abrevCol = col(["abreviatura", "sigla"], -1, -1, 1);
  const depCol = col(["departamento"], -1, 2, 2);
  const cityCol = col(["ciudad"], 1, 1, 3);
  const telCol = col(["telefono"], -1, -1, 4);
  const espCol = col(
    ["especialidad", "especialidades", "carrera", "carreras", "oferta"],
    2,
    3,
    5
  );

  const getCell = (row, idx) =>
    (idx >= 0 && idx < row.length ? row[idx] : "") || "";

  const filasRaw = dataRows
    .map((row, idx) => ({
      nombre: getCell(row, nameCol),
      abreviatura: getCell(row, abrevCol),
      departamento: getCell(row, depCol),
      ciudad: getCell(row, cityCol),
      telefono: getCell(row, telCol),
      oferta: getCell(row, espCol),
      _fila: idx + 1,
    }))
    .filter((r) => r.nombre.trim());

  const normKey = (s) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  const grupos = new Map();

  for (const fila of filasRaw) {
    const key = normKey(fila.nombre);
    if (!grupos.has(key)) {
      grupos.set(key, {
        nombre: fila.nombre,
        abreviatura: fila.abreviatura,
        departamento: fila.departamento,
        ciudad: fila.ciudad,
        telefono: fila.telefono,
        oferta_academica: [],
        _filas: [],
        _errores: [],
      });
    }
    const grupo = grupos.get(key);
    grupo._filas.push(fila._fila);
    if (!grupo.abreviatura && fila.abreviatura)
      grupo.abreviatura = fila.abreviatura;
    if (!grupo.telefono && fila.telefono) grupo.telefono = fila.telefono;
    if (fila.oferta) {
      grupo.oferta_academica.push({
        nombre: fila.oferta,
        tipo: inferirTipoOferta(fila.oferta),
      });
    }
  }

  return [...grupos.values()].map((item) => {
    const geoErrors = normalizeGeoRow(item);
    if (geoErrors.length > 0) item._errores.push(...geoErrors);
    return item;
  });
}

/**
 * Genera el contenido CSV de la plantilla de importación.
 * @returns {string} - Contenido CSV con BOM para Excel
 */
export function generateCSVTemplate() {
  const headers = [
    "Nombre (obligatorio)",
    "Abreviatura (opcional)",
    "Departamento (opcional)",
    "Ciudad (opcional)",
    "Telefono (opcional)",
    "Oferta Académica (una por fila)",
  ];
  const data = [
    [
      "Universidad Nacional de Asunción — Sede San Lorenzo",
      "UNA",
      "Central",
      "San Lorenzo",
      "021 585000",
      "Odontología",
    ],
    [
      "Universidad Nacional de Asunción — Sede San Lorenzo",
      "",
      "",
      "",
      "",
      "Maestría en Ortodoncia",
    ],
    [
      "Universidad Nacional de Asunción — Sede San Lorenzo",
      "",
      "",
      "",
      "",
      "Especialización en Endodoncia",
    ],
    [
      "Instituto de Odontología Avanzada",
      "",
      "Asunción",
      "Asunción",
      "",
      "Diplomado en Operatoria Dental",
    ],
  ];
  const csv = [headers.join(";"), ...data.map((r) => r.join(";"))].join("\n");
  return "\uFEFF" + csv;
}
