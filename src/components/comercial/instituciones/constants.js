/**
 * Constantes compartidas para el módulo de instituciones.
 */

export const TIPO_INSTITUCION = [
  { value: "universidad", label: "Universidad" },
  { value: "instituto", label: "Instituto" },
  { value: "gremio", label: "Gremio/Colegio Profesional" },
  { value: "hospital", label: "Hospital Público" },
  { value: "ministerio", label: "Ministerio/Entidad Estatal" },
  { value: "otro", label: "Otro" },
];

export const TIPO_OFERTA = [
  { value: "grado", label: "Grado" },
  { value: "posgrado", label: "Posgrado" },
  { value: "especializacion", label: "Especialización" },
  { value: "maestria", label: "Maestría" },
  { value: "doctorado", label: "Doctorado" },
  { value: "diplomado", label: "Diplomado" },
  { value: "tecnicatura", label: "Tecnicatura" },
  { value: "curso", label: "Curso" },
];

export const TIPO_DOCENTE = [
  { value: "titular", label: "Titular" },
  { value: "adjunto", label: "Adjunto" },
  { value: "asistente", label: "Asistente" },
  { value: "instructor", label: "Instructor" },
  { value: "invitado", label: "Invitado" },
];

export const ETAPA_CUENTA = [
  { value: "prospecto", label: "Prospecto" },
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
];

export const TIER_PRECIO = [
  { value: "publico", label: "Público" },
  { value: "estudiante", label: "Estudiante" },
  { value: "reventa", label: "Reventa" },
  { value: "mayorista", label: "Mayorista" },
  { value: "intercompany", label: "Intercompany" },
];

export const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";
