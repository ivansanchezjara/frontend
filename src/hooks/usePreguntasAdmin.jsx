"use client";
import { useState, useCallback, useEffect } from "react";
import { useApi } from "./useApi";
import { useDebounce } from "./useDebounce";
import { useConfirm } from "@/components/ui";
import { useToast } from "@/components/ui/feedback/ToastContext";
import {
  getPreguntasAdmin,
  responderPregunta,
  eliminarPregunta,
} from "@/services/apis/ecommerce";

/**
 * Hook que encapsula toda la lógica de la página de preguntas admin:
 * filtrado, búsqueda, responder y eliminar.
 */
export function usePreguntasAdmin() {
  const [filtroEstado, setFiltroEstado] = useState("pendientes");
  const [busquedaLocal, setBusquedaLocal] = useState("");
  const busqueda = useDebounce(busquedaLocal, 400);

  const { danger } = useConfirm();
  const { showToast } = useToast();

  const { data, loading, execute } = useApi(getPreguntasAdmin);

  const cargarPreguntas = useCallback(() => {
    execute({ estado: filtroEstado, buscar: busqueda || undefined });
  }, [execute, filtroEstado, busqueda]);

  useEffect(() => {
    cargarPreguntas();
  }, [cargarPreguntas]);

  const handleResponder = useCallback(
    async (id, respuesta) => {
      await responderPregunta(id, respuesta);
      showToast("Respuesta enviada correctamente", "success");
      cargarPreguntas();
    },
    [cargarPreguntas, showToast],
  );

  const handleDelete = useCallback(
    async (pregunta) => {
      const ok = await danger(
        `¿Eliminar la pregunta "${pregunta.pregunta}" de la web? Esta acción no se puede deshacer.`,
        "Eliminar Pregunta",
        { confirmText: "Eliminar" },
      );
      if (!ok) return;
      try {
        await eliminarPregunta(pregunta.id);
        showToast("Pregunta eliminada correctamente", "success");
        cargarPreguntas();
      } catch {
        showToast("No se pudo eliminar la pregunta", "error");
      }
    },
    [cargarPreguntas, danger, showToast],
  );

  const preguntas = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

  return {
    preguntas,
    loading,
    filtroEstado,
    setFiltroEstado,
    busquedaLocal,
    setBusquedaLocal,
    handleResponder,
    handleDelete,
  };
}
