"use client";

import Link from "next/link";
import { Send, Trash2, Check, X, Plus, Eye } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { formatMonto, formatFecha } from "./presupuesto-utils";

// ─── Estado badge config (colores según spec) ───────────────────
const ESTADO_COLORS = {
  borrador: { variant: "warning", label: "Borrador" },
  enviado: { variant: "info", label: "Enviado" },
  aceptado: { variant: "success", label: "Aceptado" },
  rechazado: { variant: "danger", label: "Rechazado" },
  vencido: { variant: "default", label: "Vencido" },
};

/**
 * Tarjeta compacta de resumen de presupuesto para la vista de oportunidad.
 * Muestra versión, estado, total, fecha y acciones rápidas según estado.
 * Max 200px de altura por entrada.
 *
 * Props:
 * - presupuesto: objeto con { id, version, estado, total, moneda, created_at, oportunidad }
 * - onEnviar: callback(id) — acción enviar (borrador)
 * - onEliminar: callback(id) — acción eliminar (borrador)
 * - onAceptar: callback(id) — acción aceptar (enviado)
 * - onRechazar: callback(id) — acción rechazar (enviado)
 * - empty: boolean — mostrar estado vacío con botón "Crear presupuesto"
 * - oportunidadId: id de oportunidad para el link de crear presupuesto
 */
export default function PresupuestoSummaryCard({
  presupuesto,
  onEnviar,
  onEliminar,
  onAceptar,
  onRechazar,
  empty = false,
  oportunidadId,
}) {
  // ─── Empty state ────────────────────────────────────────────────
  if (empty) {
    return (
      <div className="flex items-center justify-center border border-dashed border-slate-300 rounded-xl p-6 max-h-[200px]">
        <Link href={`/ventas-crm/presupuestos/new?oportunidad=${oportunidadId}`}>
          <Button variant="primary" size="sm" icon={Plus}>
            Crear presupuesto
          </Button>
        </Link>
      </div>
    );
  }

  // ─── Normal card ────────────────────────────────────────────────
  const { id, version, estado, total, moneda, created_at } = presupuesto;
  const estadoConfig = ESTADO_COLORS[estado] || ESTADO_COLORS.borrador;

  return (
    <div className="border border-slate-200 rounded-xl p-4 max-h-[200px] overflow-hidden flex flex-col justify-between gap-3 transition-all hover:border-slate-300">
      {/* Top row: version + badge + date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            v{version}
          </span>
          <Badge variant={estadoConfig.variant} className="text-[10px]">
            {estadoConfig.label}
          </Badge>
        </div>
        <span className="text-xs text-slate-400">
          {formatFecha(created_at)}
        </span>
      </div>

      {/* Total */}
      <div className="text-lg font-bold text-slate-800">
        {formatMonto(total, moneda)}
      </div>

      {/* Bottom row: link + actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/ventas-crm/presupuestos/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver presupuesto
        </Link>

        <div className="flex items-center gap-2">
          {/* Borrador: Enviar + Eliminar */}
          {estado === "borrador" && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={Send}
                onClick={() => onEnviar?.(id)}
              >
                Enviar
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => onEliminar?.(id)}
              >
                Eliminar
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
                variant="danger"
                size="sm"
                icon={X}
                onClick={() => onRechazar?.(id)}
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
