// ─── Constantes centralizadas para Persona (categoría) ──────────

/**
 * Categorías base de persona. Cada archivo puede derivar su propia
 * versión de OPTIONS agregando un placeholder al inicio.
 */
export const CATEGORIAS = [
  { value: "odontologo", label: "Odontólogo/a" },
  { value: "estudiante", label: "Estudiante" },
  { value: "protesista", label: "Protesista" },
  { value: "profesor", label: "Profesor/a" },
  { value: "cliente_casual", label: "Cliente Casual" },
];

/** Labels cortos para badges y chips */
export const CATEGORIA_LABELS = {
  odontologo: "Odontólogo/a",
  estudiante: "Estudiante",
  protesista: "Protesista",
  profesor: "Profesor/a",
  cliente_casual: "Cliente Casual",
};

/** Estilos de badge por categoría */
export const CATEGORIA_BADGE_STYLES = {
  odontologo: "bg-blue-100 text-blue-700",
  estudiante: "bg-sky-100 text-sky-700",
  protesista: "bg-violet-100 text-violet-700",
  profesor: "bg-amber-100 text-amber-700",
  cliente_casual: "bg-slate-100 text-slate-700",
};

// ─── Helpers para generar OPTIONS con placeholder ────────────────

/** Para formularios: "— Sin categoría —" como primer item */
export const CATEGORIA_OPTIONS_FORM = [
  { value: "", label: "— Sin categoría —" },
  ...CATEGORIAS,
];

/** Para filtros: "Todas" como primer item */
export const CATEGORIA_OPTIONS_FILTER = [
  { value: "", label: "Todas" },
  ...CATEGORIAS,
];

/** Para selección obligatoria: "— Seleccionar —" como primer item */
export const CATEGORIA_OPTIONS_SELECT = [
  { value: "", label: "— Seleccionar —" },
  ...CATEGORIAS,
];

// ─── Tratamientos ───────────────────────────────────────────────

export const TRATAMIENTO_OPTIONS = [
  { value: "", label: "—" },
  { value: "Sr.", label: "Sr." },
  { value: "Sra.", label: "Sra." },
  { value: "Dr.", label: "Dr." },
  { value: "Dra.", label: "Dra." },
  { value: "Prof.", label: "Prof." },
  { value: "Prof. Dr.", label: "Prof. Dr." },
  { value: "Prof. Dra.", label: "Prof. Dra." },
];

// ─── Tiers de precio ────────────────────────────────────────────

export const TIER_OPTIONS = [
  { value: "publico", label: "Público" },
  { value: "estudiante", label: "Estudiante" },
  { value: "reventa", label: "Reventa" },
  { value: "mayorista", label: "Mayorista" },
  { value: "intercompany", label: "Intercompany" },
];

export const TIER_LABELS = {
  publico: "Público",
  estudiante: "Estudiante",
  reventa: "Reventa",
  mayorista: "Mayorista",
  intercompany: "Intercompany",
};
