"use client";
import { useState, useCallback, useEffect } from "react";
import { useApi } from "./useApi";
import { useDebounce } from "./useDebounce";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { getResenasAdmin, moderarResena } from "@/services/apis/ecommerce";

/**
 * Hook que encapsula la lógica de la página de reseñas admin:
 * filtrado, búsqueda debounced, y moderar (aprobar/ocultar).
 */
export function useResenasAdmin() {
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busquedaLocal, setBusquedaLocal] = useState("");
  const busqueda = useDebounce(busquedaLocal, 400);

  const { showToast } = useToast();
  const { data, loading, execute } = useApi(getResenasAdmin);

  const cargarResenas = useCallback(() => {
    execute({ estado: filtroEstado || undefined, buscar: busqueda || undefined });
  }, [execute, filtroEstado, busqueda]);

  useEffect(() => {
    cargarResenas();
  }, [cargarResenas]);

  const handleToggleAprobada = useCallback(
    async (id, aprobada) => {
      await moderarResena(id, { aprobada });
      showToast(aprobada ? "Reseña aprobada" : "Reseña ocultada", "success");
      cargarResenas();
    },
    [cargarResenas, showToast],
  );

  const resenas = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

  return {
    resenas,
    loading,
    filtroEstado,
    setFiltroEstado,
    busquedaLocal,
    setBusquedaLocal,
    handleToggleAprobada,
  };
}
