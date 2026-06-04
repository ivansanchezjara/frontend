import Link from "next/link";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";

/**
 * Barra visual de pipeline para oportunidades CRM.
 * Muestra distribución por etapa con barra de progreso y etiquetas enlazadas.
 *
 * @param {Array} stages - Array de { key, label, color, lightBg, textColor, count }
 * @param {string} [basePath="/ventas-crm/oportunidades"] - Ruta base para enlaces de etapas
 */
export default function PipelineBar({ stages, basePath = "/ventas-crm/oportunidades" }) {
  const total = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-3">
      {/* Barra visual */}
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
        {stages.map((stage) => {
          const pct = total > 0 ? (stage.count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={stage.key}
              className={cn("transition-all duration-500", stage.color)}
              style={{ width: `${pct}%` }}
              title={`${stage.label}: ${stage.count}`}
            />
          );
        })}
      </div>

      {/* Etiquetas */}
      <div className="flex items-center gap-4 flex-wrap">
        {stages.map((stage) => (
          <Link
            key={stage.key}
            href={`${basePath}?etapa=${stage.key}`}
            className="group flex items-center gap-2"
          >
            <span className={cn("w-2.5 h-2.5 rounded-full", stage.color)} />
            <Text variant="bodyXs" className="text-slate-500 group-hover:text-slate-700 transition-colors">
              {stage.label}
            </Text>
            <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-md", stage.lightBg, stage.textColor)}>
              {stage.count}
            </span>
          </Link>
        ))}
        <Text variant="mutedXs" className="ml-auto">
          {total} activos
        </Text>
      </div>
    </div>
  );
}
