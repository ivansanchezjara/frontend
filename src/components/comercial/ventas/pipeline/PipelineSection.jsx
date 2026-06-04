"use client";
import { Phone, Handshake, ChevronRight, Ban } from "lucide-react";
import { Section, Badge, Text } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─── Configuración ──────────────────────────────────────────────

const ETAPA_BADGE_MAP = {
  nueva: { variant: "info", label: "Nueva" },
  contactada: { variant: "warning", label: "Contactada" },
  negociacion: { variant: "purple", label: "Negociación" },
  ganada: { variant: "success", label: "Ganada" },
  perdida: { variant: "danger", label: "Perdida" },
};

const TRANSICIONES = {
  nueva: { avance: "contactada", perdida: true },
  contactada: { avance: "negociacion", perdida: true },
  negociacion: { avance: null, perdida: true },
  ganada: { avance: null, perdida: false },
  perdida: { avance: null, perdida: false },
};

const AVANCE_CONFIG = {
  contactada: { label: "Contactada" },
  negociacion: { label: "Negociación" },
};

const ETAPA_HINTS = {
  nueva: "Registrá la información del cliente y contactá para avanzar.",
  contactada: "Definí los productos que le interesan al cliente para pasar a negociación.",
  negociacion: "Armá el presupuesto, envialo y esperá la respuesta del cliente.",
};

/**
 * Sección de pipeline con acciones de avance y pérdida.
 */
export default function PipelineSection({ etapa, onTransicion, saving }) {
  return (
    <Section
      title="Pipeline"
      action={
        <Badge variant={ETAPA_BADGE_MAP[etapa]?.variant || "default"}>
          {ETAPA_BADGE_MAP[etapa]?.label || etapa}
        </Badge>
      }
    >
      <div className="p-6">
        {/* Hint contextual */}
        {ETAPA_HINTS[etapa] && (
          <p className="text-sm text-slate-500 mb-5 flex items-start gap-2">
            <span className="text-base leading-none">💡</span>
            {ETAPA_HINTS[etapa]}
          </p>
        )}

        {/* Acciones de avance y pérdida */}
        <div className="flex items-center justify-between">
          {/* Avance principal */}
          <div>
            {TRANSICIONES[etapa]?.avance && (
              <button
                onClick={() => onTransicion(TRANSICIONES[etapa].avance)}
                disabled={saving}
                className={cn(
                  "group flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200",
                  "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-100/50",
                  "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                )}
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  {TRANSICIONES[etapa].avance === "contactada" ? (
                    <Phone className="w-4.5 h-4.5 text-emerald-700" />
                  ) : (
                    <Handshake className="w-4.5 h-4.5 text-emerald-700" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-emerald-800">
                    Avanzar a {AVANCE_CONFIG[TRANSICIONES[etapa].avance]?.label}
                  </p>
                  <p className="text-[11px] text-emerald-600/80 font-medium">
                    Siguiente etapa del pipeline
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform ml-2" />
              </button>
            )}

            {etapa === "negociacion" && (
              <p className="text-xs text-slate-400 mt-3">
                Para marcar como ganada, aceptá el presupuesto en la sección de abajo.
              </p>
            )}
          </div>

          {/* Marcar como perdida */}
          {TRANSICIONES[etapa]?.perdida && (
            <button
              onClick={() => onTransicion("perdida")}
              disabled={saving}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200",
                "border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600",
                "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              )}
            >
              <Ban className="w-4 h-4" />
              <span className="text-xs font-semibold">Marcar perdida</span>
            </button>
          )}
        </div>
      </div>
    </Section>
  );
}
