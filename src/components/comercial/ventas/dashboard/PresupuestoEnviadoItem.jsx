"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Text } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Item de presupuesto enviado para la lista del dashboard.
 * Muestra título de oportunidad, cliente, total y días de vigencia.
 */
export default function PresupuestoEnviadoItem({ presupuesto }) {
  const {
    oportunidad,
    oportunidad_titulo,
    cliente_razon_social,
    total,
    moneda,
    version,
    enviado_at,
    vigencia_dias,
  } = presupuesto;

  const dias = diasRestantes(enviado_at, vigencia_dias);
  const vencido = dias !== null && dias < 0;
  const urgente = dias !== null && dias >= 0 && dias <= 3;

  return (
    <Link
      href={`/ventas-crm/oportunidades/${oportunidad}`}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <Text variant="bodySm" className="font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
          {oportunidad_titulo || `Oportunidad #${oportunidad}`}
        </Text>
        <Text variant="bodyXs" className="text-slate-400 truncate mt-0.5">
          {cliente_razon_social} · v{version}
        </Text>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Text variant="bodySm" className="font-semibold text-slate-700">
          {formatMonto(total, moneda)}
        </Text>
        {dias !== null && (
          <span className={cn(
            "text-[11px] font-semibold px-2 py-0.5 rounded-full",
            vencido ? "bg-red-50 text-red-600" :
              urgente ? "bg-amber-50 text-amber-600" :
                "bg-slate-100 text-slate-500"
          )}>
            {vencido ? `Venció hace ${Math.abs(dias)}d` : `${dias}d`}
          </span>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
      </div>
    </Link>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function diasRestantes(enviado_at, vigencia_dias) {
  if (!enviado_at || !vigencia_dias) return null;
  const enviado = new Date(enviado_at);
  const vence = new Date(enviado.getTime() + vigencia_dias * 24 * 60 * 60 * 1000);
  return Math.ceil((vence - new Date()) / (1000 * 60 * 60 * 24));
}

function formatMonto(monto, moneda) {
  if (!monto || Number(monto) === 0) return "—";
  const num = Number(monto);
  if (moneda === "PYG") return num.toLocaleString("es-PY") + " ₲";
  return "USD " + num.toLocaleString("en-US", { minimumFractionDigits: 2 });
}
