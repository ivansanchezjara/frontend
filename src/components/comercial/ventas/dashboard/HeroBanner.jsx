"use client";
import Link from "next/link";
import { Plus, AlertCircle, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui";

/**
 * Banner hero del dashboard de ventas con saludo, métricas del día,
 * alertas urgentes, CTA principal y barra de progreso mensual.
 */
export default function HeroBanner({
  nombre,
  cantidadVentas = 0,
  montoTotalUsd = 0,
  montoMesUsd = 0,
  alertas = [],
}) {
  const saludo = getSaludo();

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 lg:p-8 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {/* Left — Greeting + alerts */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{saludo}, {nombre} 👋</h2>
          <Text as="p" variant="bodySm" className="text-slate-300">
            {cantidadVentas > 0 ? (
              <>Hoy: <span className="text-emerald-400 font-semibold">{cantidadVentas} venta{cantidadVentas !== 1 ? "s" : ""}</span> · <span className="text-emerald-400 font-semibold">USD {formatearMonto(montoTotalUsd)}</span></>
            ) : (
              "Aún no registraste ventas hoy"
            )}
          </Text>
          {alertas.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {alertas.map((a, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    a.type === "danger" && "bg-red-500/20 text-red-300",
                    a.type === "warning" && "bg-amber-500/20 text-amber-300"
                  )}
                >
                  {a.type === "danger" && <AlertCircle className="h-3 w-3" />}
                  {a.text}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right — CTA */}
        <Link
          href="/ventas-crm/ventas/nueva"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-emerald-500/25 self-start lg:self-center"
        >
          <Plus className="h-4 w-4" />
          Nueva venta
        </Link>
      </div>

      {/* Progress bar del mes */}
      {montoMesUsd > 0 && (
        <div className="relative mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Meta mensual
            </span>
            <span className="text-xs font-semibold text-slate-200">
              USD {formatearMonto(montoMesUsd)} <span className="text-slate-500">/ 12.000</span>
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-700"
              style={{ width: `${Math.min((montoMesUsd / 12000) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function getSaludo() {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 18) return "Buenas tardes";
  return "Buenas noches";
}

function formatearMonto(monto) {
  const num = Number(monto);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-PY", { maximumFractionDigits: 2 });
}
