"use client";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";

import { Button, useConfirm } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";
import { TIER_OPTIONS, TIER_LABELS } from "@/config/personas";
import { updatePersona } from "@/services/apis/ventas";

/**
 * Selector visual de tier de precio para una persona.
 * Muestra un botón de guardar cuando hay cambios pendientes.
 */
export function TierPrecioSection({ personaId, tierActual, esEstudianteActivo, onUpdated }) {
  const [tier, setTier] = useState(tierActual || "publico");
  const [saving, setSaving] = useState(false);
  const { alert: showAlert } = useConfirm();

  // Sincronizar si tierActual cambia externamente (ej. después de refetch)
  useEffect(() => {
    if (tierActual && !saving) setTier(tierActual);
  }, [tierActual]);

  const hasChanges = tier !== tierActual;

  const handleSelect = (nuevoTier) => {
    if (nuevoTier === tier || saving) return;
    if (nuevoTier === "estudiante" && !esEstudianteActivo) {
      showAlert(
        "Para asignar el tier \"Estudiante\" se requiere una formación de grado vigente (dentro del período de la carrera).",
        "No permitido"
      );
      return;
    }
    setTier(nuevoTier);
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      const updated = await updatePersona(personaId, { tier_precio: tier });
      if (onUpdated) onUpdated(updated);
    } catch {
      setTier(tierActual);
      showAlert("No se pudo actualizar el tier de precio.", "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-3">
      <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 flex-wrap">
        {TIER_OPTIONS.map((opt) => {
          const isActive = tier === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              disabled={saving}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 focus:outline-none whitespace-nowrap",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                isActive
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full transition-all",
            saving
              ? "bg-amber-400 animate-pulse"
              : hasChanges
                ? "bg-amber-500"
                : "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"
          )} />
          <Text variant="label" className="text-slate-400 text-[11px]">
            {saving
              ? "Guardando..."
              : hasChanges
                ? `Cambio pendiente: ${TIER_LABELS[tierActual] || tierActual} → ${TIER_LABELS[tier] || tier}`
                : `Tier activo: ${TIER_LABELS[tier] || tier}`}
          </Text>
        </div>
        {hasChanges && (
          <Button
            size="sm"
            icon={Save}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        )}
      </div>
    </div>
  );
}
