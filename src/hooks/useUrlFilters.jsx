"use client";
import { useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

/**
 * Hook para manejar filtros persistentes en URL (query params).
 * Reemplaza useState para filtros, permitiendo deep-linking y bookmarks.
 *
 * @param {Object} schema - Definición de filtros con valores por defecto.
 *   Ejemplo: { busqueda: '', estado: '', page: 1 }
 *   IMPORTANTE: Definir el schema como constante fuera del componente para evitar re-renders.
 *
 * @returns {{ filters, setFilter, setFilters, resetFilters, page, setPage }}
 */
export function useUrlFilters(schema = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Estabilizar referencia del schema (evitar re-renders si se pasa inline)
  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  // Leer filtros actuales de la URL, con fallback al schema
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const schemaKey = useMemo(() => JSON.stringify(schema), []);

  const filters = useMemo(() => {
    const currentSchema = schemaRef.current;
    const result = {};
    for (const [key, defaultValue] of Object.entries(currentSchema)) {
      const urlValue = searchParams.get(key);
      if (urlValue === null || urlValue === undefined) {
        result[key] = defaultValue;
      } else if (typeof defaultValue === "number") {
        result[key] = Number(urlValue) || defaultValue;
      } else {
        result[key] = urlValue;
      }
    }
    return result;
  }, [searchParams, schemaKey]);

  // Actualizar la URL con nuevos params (reemplaza history entry)
  const updateUrl = useCallback(
    (newParams) => {
      const currentSchema = schemaRef.current;
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(newParams)) {
        const defaultValue = currentSchema[key];
        // Solo incluir en URL si difiere del default
        if (
          value !== defaultValue &&
          value !== "" &&
          value !== null &&
          value !== undefined
        ) {
          params.set(key, String(value));
        }
      }
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  // Setear un filtro individual (resetea page a 1 si no es el propio page)
  const setFilter = useCallback(
    (key, value) => {
      const newFilters = { ...filters, [key]: value };
      // Resetear a página 1 cuando cambia un filtro (excepto page mismo)
      if (key !== "page") {
        newFilters.page = 1;
      }
      updateUrl(newFilters);
    },
    [filters, updateUrl]
  );

  // Setear múltiples filtros a la vez
  const setFilters = useCallback(
    (updates) => {
      const newFilters = { ...filters, ...updates };
      if (!("page" in updates)) {
        newFilters.page = 1;
      }
      updateUrl(newFilters);
    },
    [filters, updateUrl]
  );

  // Resetear todos los filtros a sus valores por defecto
  const resetFilters = useCallback(() => {
    updateUrl(schemaRef.current);
  }, [updateUrl]);

  // Shortcuts para page
  const page = filters.page || 1;
  const setPage = useCallback(
    (p) => setFilter("page", p),
    [setFilter]
  );

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    page,
    setPage,
  };
}
