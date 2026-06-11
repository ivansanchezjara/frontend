"use client";
import { Lightbulb, Trophy, AlertTriangle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ETAPA_CONFIG = {
  nueva: {
    icon: Lightbulb,
    colors: "bg-blue-50 border-blue-100 text-blue-700",
    iconColor: "text-blue-500",
    hint: "Registrá el primer contacto con el cliente para avanzar.",
  },
  contactada: {
    icon: PlayCircle,
    colors: "bg-amber-50 border-amber-100 text-amber-700",
    iconColor: "text-amber-500",
    hint: "Identificá las necesidades del cliente y avanzá a negociación.",
  },
  negociacion: {
    icon: Lightbulb,
    colors: "bg-purple-50 border-purple-100 text-purple-700",
    iconColor: "text-purple-500",
    hint: "Armá un presupuesto y envialo al cliente. Aceptalo para cerrar como ganada.",
  },
  ganada: {
    icon: Trophy,
    colors: "bg-emerald-50 border-emerald-100 text-emerald-700",
    iconColor: "text-emerald-500",
    hint: "Oportunidad cerrada con éxito.",
  },
  perdida: {
    icon: AlertTriangle,
    colors: "bg-red-50 border-red-100 text-red-700",
    iconColor: "text-red-500",
    hint: null,
  },
};

/**
 * Banner compacto de guía — una sola línea debajo del chevron path.
 */
export default function GuidanceBanner({ etapa, motivoPerdida }) {
  const config = ETAPA_CONFIG[etapa] || ETAPA_CONFIG.nueva;
  const Icon = config.icon;

  const hint = etapa === "perdida" && motivoPerdida
    ? `Motivo: ${motivoPerdida}`
    : config.hint;

  if (!hint) return null;

  return (
    <div className={cn(
      "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all",
      config.colors
    )}>
      <Icon className={cn("w-3.5 h-3.5 shrink-0", config.iconColor)} />
      <span className="truncate">{hint}</span>
    </div>
  );
}
