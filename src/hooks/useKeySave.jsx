"use client";
import { useEffect, useRef } from "react";

/**
 * Hook reutilizable para capturar Ctrl+S (o Cmd+S en Mac) y ejecutar una acción.
 * Previene el comportamiento default del browser (guardar página).
 *
 * @param {Function} onSave - Callback a ejecutar cuando se presiona Ctrl+S
 * @param {Object} options
 * @param {boolean} options.disabled - Si es true, no ejecuta el callback
 */
export function useKeySave(onSave, { disabled = false } = {}) {
  const callbackRef = useRef(onSave);

  // Mantener referencia actualizada sin re-registrar el listener
  useEffect(() => {
    callbackRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!disabled) {
          callbackRef.current?.();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [disabled]);
}
