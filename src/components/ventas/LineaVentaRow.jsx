"use client";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const TIER_LABELS = {
  publico: "Público",
  estudiante: "Estudiante",
  reventa: "Reventa",
  mayorista: "Mayorista",
  intercompany: "Intercompany",
};

/**
 * Fila de línea de venta dentro del constructor de venta.
 * Muestra producto, cantidad editable, precio unitario y subtotal.
 *
 * @param {Object} linea - { variante_id, product_code, nombre, cantidad, precio_usd, subtotal_usd, precio_moneda, subtotal_moneda }
 * @param {string} moneda - Moneda de negociación (USD, PYG, BRL)
 * @param {string} tier - Tier de precio aplicado
 * @param {Function} onCantidadChange - Callback al cambiar cantidad
 * @param {Function} onRemove - Callback al eliminar línea
 * @param {number} index - Índice de la línea
 */
export default function LineaVentaRow({
  linea,
  moneda,
  tier,
  onCantidadChange,
  onRemove,
  index,
}) {
  const formatMonto = (monto, mon) => {
    if (monto == null) return "—";
    const num = Number(monto);
    if (mon === "PYG") {
      return `₲ ${num.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;
    }
    if (mon === "BRL") {
      return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors group">
      {/* Número */}
      <td className="py-3 pl-4 pr-2">
        <span className="text-xs text-slate-400 font-mono">{index + 1}</span>
      </td>

      {/* Producto */}
      <td className="py-3 px-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-800">
            {linea.nombre}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {linea.product_code}
          </span>
        </div>
      </td>

      {/* Cantidad */}
      <td className="py-3 px-3">
        <input
          type="number"
          min={1}
          value={linea.cantidad}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (val > 0) onCantidadChange(val);
          }}
          className={cn(
            "w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50",
            "focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
            "outline-none transition-all text-sm font-semibold text-center text-slate-700"
          )}
          aria-label={`Cantidad de ${linea.nombre}`}
        />
      </td>

      {/* Precio unitario */}
      <td className="py-3 px-3 text-right">
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-slate-700">
            {formatMonto(linea.precio_moneda, moneda)}
          </span>
          {moneda !== "USD" && (
            <span className="text-[10px] text-slate-400">
              $ {Number(linea.precio_usd).toFixed(2)} USD
            </span>
          )}
        </div>
      </td>

      {/* Subtotal */}
      <td className="py-3 px-3 text-right">
        <div className="flex flex-col items-end">
          <span className="text-sm font-bold text-slate-800">
            {formatMonto(linea.subtotal_moneda, moneda)}
          </span>
          {moneda !== "USD" && (
            <span className="text-[10px] text-slate-400">
              $ {Number(linea.subtotal_usd).toFixed(2)} USD
            </span>
          )}
        </div>
      </td>

      {/* Acciones */}
      <td className="py-3 pl-3 pr-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
          aria-label={`Eliminar ${linea.nombre}`}
        >
          <Trash2 size={14} />
        </Button>
      </td>
    </tr>
  );
}
