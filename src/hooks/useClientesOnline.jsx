"use client";
import { useState, useCallback, useEffect } from "react";
import { useApi } from "./useApi";
import { useDebounce } from "./useDebounce";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { getClientesOnline } from "@/services/apis/ecommerce";
import { deshabilitarOnlinePersona } from "@/services/apis/ventas";

/**
 * Hook para gestionar la lista de clientes con cuenta online habilitada.
 */
export function useClientesOnline() {
  const [busquedaLocal, setBusquedaLocal] = useState("");
  const [filtroTier, setFiltroTier] = useState("");
  const busqueda = useDebounce(busquedaLocal, 400);

  const { showToast } = useToast();
  const { data, loading, execute } = useApi(getClientesOnline);

  const cargar = useCallback(() => {
    const params = {};
    if (busqueda) params.search = busqueda;
    if (filtroTier) params.tier_precio = filtroTier;
    execute(params);
  }, [execute, busqueda, filtroTier]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleDeshabilitar = useCallback(
    async (id) => {
      try {
        await deshabilitarOnlinePersona(id);
        showToast("Cuenta online deshabilitada", "success");
        cargar();
      } catch {
        showToast("No se pudo deshabilitar la cuenta", "error");
      }
    },
    [cargar, showToast],
  );

  const clientes = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  const total = data?.count ?? clientes.length;

  return {
    clientes,
    total,
    loading,
    busquedaLocal,
    setBusquedaLocal,
    filtroTier,
    setFiltroTier,
    handleDeshabilitar,
  };
}
