"use client";

import Link from "next/link";
import { Send, Trash2, Check, X, Eye, Clock, Package, ExternalLink } from "lucide-react";
import { Button, Badge, Text } from "@/components/ui";
import { formatMonto, formatFecha, calcVigencia } from "./presupuesto-utils";

// ─── Estado badge config ────────────────────────────────────────
const ESTADO_COLORS = {
  borrador: { variant: "warning", label: "Borrador" },
  enviado: { variant: "info", label: "Enviado" },
  aceptado: { variant: "success", label: "Aceptado" },
  rechazado: { variant: "danger", label: "Rechazado" },
  vencido: { variant: "default", label: "Vencido" },
};

/**
 * Tarjeta de resumen de presupuesto para la vista de oportunidad.
 * Muestra info relevante para el vendedor: versión, estado, total, líneas,
 * vigencia y acciones rápidas según estado.
 */
export default function PresupuestoSummaryCard({
  presupuesto,
  onEnviar,
  onEliminar,
  onAceptar,
  onRechazar,
}) {
  const {
    id, estado, total, moneda, created_at,
    enviado_at, vigencia_dias, lineas, venta_id, codigo,
  } = presupuesto;

  const estadoConfig = ESTADO_COLORS[estado] || ESTADO_COLORS.borrador;
  const lineasCount = lineas?.length || 0;
  const vigencia = enviado_at ? calcVigencia(enviado_at, vigencia_dias) : null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden transition-all hover:border-slate-300 hover:shadow-sm">
      {/* Header: código + badge + fecha */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-slate-700 font-mono">
            {codigo}
          </span>
          <Badge variant={estadoConfig.variant} className="text-[10px]">
            {estadoConfig.label}
          </Badge>
        </div>
        <span className="text-xs text-slate-400">
          {formatFecha(created_at)}
        </span>
      </div>

      {/* Body: info del presupuesto */}
      <div className="px-4 py-3 space-y-2">
        {/* Total + Líneas */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-slate-800">
            {formatMonto(total, moneda)}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Package className="w-3.5 h-3.5" />
            <span>{lineasCount} ítem{lineasCount !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Info contextual según estado */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {/* Enviado: vigencia */}
          {estado === "enviado" && vigencia && (
            <span className={`flex items-center gap-1 ${vigencia.vencido ? "text-red-500" : "text-slate-500"}`}>
              <Clock className="w-3 h-3" />
              {vigencia.vencido
                ? "Vencido"
                : `${vigencia.diasRestantes} día${vigencia.diasRestantes !== 1 ? "s" : ""} restante${vigencia.diasRestantes !== 1 ? "s" : ""}`
              }
            </span>
          )}

          {/* Enviado: fecha de envío */}
          {enviado_at && (
            <span className="text-slate-400">
              Enviado {formatFecha(enviado_at)}
            </span>
          )}

          {/* Aceptado: link a venta */}
          {estado === "aceptado" && venta_id && (
            <Link
              href={`/ventas-crm/ventas/${venta_id}`}
              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              Ver venta generada
            </Link>
          )}

          {/* Moneda si no es USD */}
          {moneda !== "USD" && (
            <span className="text-slate-400">Moneda: {moneda}</span>
          )}
        </div>
      </div>

      {/* Footer: acciones */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-white">
        <Link
          href={`/ventas-crm/presupuestos/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver detalle
        </Link>

        <div className="flex items-center gap-2">
          {/* Borrador: Enviar + Eliminar */}
          {estado === "borrador" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => onEliminar?.(id)}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
              >
                Eliminar
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Send}
                onClick={() => onEnviar?.(id)}
                disabled={Number(total) === 0}
              >
                Enviar
              </Button>
            </>
          )}

          {/* Enviado: Aceptar + Rechazar */}
          {estado === "enviado" && (
            <>
              <Button
                variant="success"
                size="sm"
                icon={Check}
                onClick={() => onAceptar?.(id)}
              >
                Aceptar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                onClick={() => onRechazar?.(id)}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
              >
                Rechazar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
