"use client";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Section, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import PipelineBar from "@/components/comercial/ventas/pipeline/PipelineBar";

const CIERRE_STAGES = [
  { key: "ganada", label: "Ganadas", color: "bg-emerald-500" },
  { key: "perdida", label: "Perdidas", color: "bg-red-400" },
];

/**
 * Sección de pipeline con barra visual, alerta de nuevas sin contactar
 * y stats de cierre (ganadas/perdidas).
 */
export default function PipelineOverview({ stages = [], ganadas = 0, perdidas = 0 }) {
  const cierreData = [
    { ...CIERRE_STAGES[0], count: ganadas },
    { ...CIERRE_STAGES[1], count: perdidas },
  ];

  const nuevas = stages.find((s) => s.key === "nueva")?.count || 0;

  return (
    <Section
      title="Pipeline de oportunidades"
      action={
        <Link href="/ventas-crm/oportunidades" className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
          Ver todo →
        </Link>
      }
    >
      <div className="px-6 py-5 space-y-4">
        <PipelineBar stages={stages} />

        {nuevas > 0 && (
          <Text variant="bodyXs" className="text-blue-600 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Tenés {nuevas} oportunidad{nuevas > 1 ? "es" : ""} nueva{nuevas > 1 ? "s" : ""} sin contactar
          </Text>
        )}

        {/* Stats de cierre */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
          <Text variant="label" className="text-slate-400 uppercase tracking-wide">
            Resultados
          </Text>
          {cierreData.map((stage) => (
            <div key={stage.key} className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", stage.color)} />
              <Text variant="bodyXs" className="font-semibold text-slate-600">
                {stage.count} {stage.label}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
