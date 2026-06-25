"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "./useDebounce";
import { buscarProductos } from "@/services/apis/ventas";

/**
 * Hook reutilizable para búsqueda de productos (variantes).
 * Encapsula debounce, llamada a la API, manejo de resultados y estado de carga.
 * Soporta búsqueda multi-palabra en backend (código, nombre, marca, descripción).
 *
 * @param {Object} options
 * @param {number} options.debounceMs - Delay de debounce (default: 300)
 * @param {number} options.minChars - Mínimo de caracteres para buscar (default: 2)
 * @param {Object} options.extraParams - Parámetros extra para la búsqueda (ej: { categoria: 5 })
 *
 * @returns {Object}
 * - query: string actual del input
 * - setQuery: setter para el input
 * - resultados: array de variantes encontradas
 * - buscando: boolean de loading
 * - limpiar: función para resetear búsqueda y resultados
 * - debouncedQuery: query después del debounce (útil para saber si se buscó)
 */
export function useBuscarProductos(options = {}) {
  const {
    debounceMs = 300,
    minChars = 2,
    extraParams = {},
  } = options;

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const debouncedQuery = useDebounce(query, debounceMs);
  const abortRef = useRef(null);

  useEffect(() => {
    if (debouncedQuery.length < minChars) {
      setResultados([]);
      return;
    }

    let cancelled = false;
    setBuscando(true);

    buscarProductos({ q: debouncedQuery, ...extraParams })
      .then((data) => {
        if (!cancelled) {
          const items = Array.isArray(data) ? data : (data?.results || []);
          setResultados(items);
        }
      })
      .catch(() => {
        if (!cancelled) setResultados([]);
      })
      .finally(() => {
        if (!cancelled) setBuscando(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const limpiar = useCallback(() => {
    setQuery("");
    setResultados([]);
  }, []);

  return {
    query,
    setQuery,
    resultados,
    buscando,
    limpiar,
    debouncedQuery,
  };
}
