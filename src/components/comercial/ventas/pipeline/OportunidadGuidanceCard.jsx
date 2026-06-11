"use client";
import { Lightbulb, Trophy, AlertTriangle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/basics/Typography";

const ETAPA_HINTS = {
  nueva: {
    icon: Lightbulb,
    colorClass: "bg-blue-50 border-blue-100 text-blue-800",
    iconColor: "text-blue-500",
    title: "Primer Contacto",
    description: "Registrá la información inicial y realizá el primer contacto con el cliente (llamada, correo, mensaje) para avanzar de etapa.",
    action: "Registrá la interacción en la pestaña de Actividades."
  },
  contactada: {
    icon: PlayCircle,
    colorClass: "bg-amber-50 border-amber-100 text-amber-800",
    iconColor: "text-amber-500",
    title: "Definir Intereses",
    description: "Identificá las necesidades del cliente. Podés cargar productos de interés opcionalmente antes de pasar a negociación.",
    action: "Avanzá a Negociación cuando estés listo para cotizar."
  },
  negociacion: {
    icon: Lightbulb,
    colorClass: "bg-purple-50 border-purple-100 text-purple-800",
    iconColor: "text-purple-500",
    title: "Propuesta y Presupuesto",
    description: "Generá uno o más presupuestos detallados en base a los productos seleccionados y envialos al cliente para su revisión.",
    action: "Creá un Presupuesto y marca como Ganada cuando sea aceptado."
  },
  ganada: {
    icon: Trophy,
    colorClass: "bg-emerald-50 border-emerald-100 text-emerald-800",
    iconColor: "text-emerald-500",
    title: "¡Oportunidad Ganada!",
    description: "Esta oportunidad ha finalizado con éxito. El presupuesto fue aceptado y se ha iniciado el proceso de facturación y entrega.",
    action: "Oportunidad cerrada satisfactoriamente."
  },
  perdida: {
    icon: AlertTriangle,
    colorClass: "bg-red-50 border-red-100 text-red-800",
    iconColor: "text-red-500",
    title: "Oportunidad Perdida",
    description: "Esta oportunidad se ha marcado como no concretada.",
    action: null
  }
};

export default function OportunidadGuidanceCard({ etapa, motivoPerdida }) {
  const config = ETAPA_HINTS[etapa] || ETAPA_HINTS.nueva;
  const Icon = config.icon;

  return (
    <div className={cn(
      "border rounded-2xl p-5 shadow-sm space-y-3 transition-all duration-300 animate-in fade-in",
      config.colorClass
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn("w-5 h-5 shrink-0", config.iconColor)} />
        <span className="font-black text-sm uppercase tracking-wide">
          Guía de Éxito: {config.title}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold leading-relaxed opacity-90">
          {config.description}
        </p>

        {etapa === "perdida" && motivoPerdida && (
          <div className="bg-white/60 rounded-xl p-2.5 border border-red-200/50">
            <span className="text-[10px] uppercase font-black text-red-600 block">
              Motivo de pérdida:
            </span>
            <span className="text-xs text-red-900 font-bold block mt-0.5">
              {motivoPerdida}
            </span>
          </div>
        )}

        {config.action && (
          <div className="pt-2 border-t border-current/10 flex items-start gap-1.5">
            <span className="text-xs">🎯</span>
            <span className="text-[11px] font-black tracking-tight uppercase">
              Próximo paso: {config.action}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
