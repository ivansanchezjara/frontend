import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea una fecha ISO a DD/MM/YY en locale es-PY.
 * Retorna "—" si el valor es nulo/undefined.
 */
export function formatFechaCorta(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

/**
 * Formatea una fecha ISO a DD/MM/YYYY en locale es-PY.
 * Retorna "—" si el valor es nulo/undefined.
 */
export function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
