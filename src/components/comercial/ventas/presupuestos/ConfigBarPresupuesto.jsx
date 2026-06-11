"use client";
import { Clock, StickyNote, Tag } from "lucide-react";
import { Badge, Input, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { MONEDA_OPTIONS, TIER_LABELS, formatMonto } from "./presupuesto-utils";

/**
 * Barra de configuración del presupuesto: moneda, vigencia, tier, notas y total.
 */
export default function ConfigBarPresupuesto({
  moneda, setMoneda, vigenciaDias, setVigenciaDias,
  tierPrecio, showNotas, setShowNotas, total,
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Moneda */}
      <div className="flex items-center gap-2">
        <Text variant="label" className="text-slate-500">Moneda:</Text>
        <div className="flex gap-1">
          {MONEDA_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMoneda(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer",
                moneda === opt.value
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm"
                  : "bg-slate-50 text-slate-400 border border-slate-200 hover:text-slate-600 hover:border-slate-300"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vigencia */}
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <Text variant="label" className="text-slate-500">Vigencia:</Text>
        <Input
          type="number"
          min="1"
          max="90"
          value={vigenciaDias}
          onChange={(e) => setVigenciaDias(Math.max(1, Math.min(90, Number(e.target.value) || 15)))}
          className="w-16 text-center text-xs font-bold !py-1 !px-2 !rounded-lg"
          fullWidth={false}
        />
        <Text variant="muted" className="text-[11px]">días</Text>
      </div>

      {/* Tier del cliente (solo si no es público) */}
      {tierPrecio !== "publico" && (
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-indigo-400" />
          <Badge variant="default" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
            Tier: {TIER_LABELS[tierPrecio] || tierPrecio}
          </Badge>
        </div>
      )}

      {/* Toggle notas */}
      <button
        onClick={() => setShowNotas(!showNotas)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
          showNotas
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-slate-50 text-slate-400 border border-slate-200 hover:text-slate-600"
        )}
      >
        <StickyNote className="w-3 h-3" />
        Notas
      </button>

      {/* Total inline */}
      {total > 0 && (
        <div className="ml-auto flex items-center gap-2">
          <Text variant="label" className="text-slate-400">Total:</Text>
          <span className="text-base font-bold text-slate-800">
            {formatMonto(total, moneda)}
          </span>
        </div>
      )}
    </div>
  );
}
