"use client";
import { Check, Percent, DollarSign } from "lucide-react";
import { Badge, Input, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatPrecio, TIER_LABELS } from "./presupuesto-utils";

/**
 * Fila de producto en la tabla del constructor de presupuesto.
 * Columna "Precio" unificada: muestra precio original tachado + precio actual
 * con indicador de oferta o descuento tier integrado.
 */
export default function FilaProducto({
  fila, selected, linea, subtotal,
  precioPublico, precioTier, descuento, tierPrecio,
  onToggle, onCantidad, onDescuentoExtra, onVerStock,
}) {
  const tipoExtra = linea?.descuento_extra_tipo || "ninguno";
  const valorExtra = linea?.descuento_extra_valor || 0;
  const tieneOferta = fila.tiene_oferta || (linea?.tiene_oferta) || false;

  // Precio efectivo que se usa (oferta o tier)
  const precioEfectivo = tieneOferta
    ? (fila.precio_oferta || linea?.precio_oferta || precioTier)
    : precioTier;

  // ¿Hay diferencia entre público y efectivo?
  const hayDiferencia = precioPublico > 0 && precioEfectivo > 0 && precioEfectivo < precioPublico;

  return (
    <tr
      onClick={() => onVerStock(fila)}
      className={cn(
        "transition-colors cursor-pointer group",
        selected
          ? "bg-emerald-50/60 hover:bg-emerald-100/60"
          : "hover:bg-blue-50/40"
      )}
    >
      {/* Checkbox */}
      <td className="py-2.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
        <div
          onClick={() => onToggle(fila)}
          className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer",
            selected
              ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200"
              : "border-slate-300 bg-white hover:border-emerald-300"
          )}
        >
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>
      </td>

      {/* SKU */}
      <td className="py-2.5 px-3">
        <Badge className="font-mono text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
          {fila.product_code || "—"}
        </Badge>
      </td>

      {/* Producto */}
      <td className="py-2.5 px-3">
        <Text variant="bodyXs" className="font-black text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors">
          {fila.producto_nombre}
        </Text>
        {fila.nombre_variante && (
          <Text variant="bodyXs" className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate mt-0.5">
            {fila.nombre_variante}
          </Text>
        )}
      </td>

      {/* Precio (columna unificada) */}
      <td className="py-2.5 px-3 text-right">
        <div className="space-y-0.5">
          {/* Precio público tachado si hay diferencia */}
          {hayDiferencia && (
            <div className="text-[11px] text-slate-400 tabular-nums">
              {formatPrecio(precioPublico)}
            </div>
          )}
          {/* Precio efectivo */}
          <div className={cn(
            "text-xs font-bold tabular-nums",
            tieneOferta ? "text-emerald-600" : "text-slate-700"
          )}>
            {precioEfectivo > 0 ? formatPrecio(precioEfectivo) : "—"}
            {tieneOferta && (
              <span className="ml-1 text-[8px] font-bold bg-emerald-100 text-emerald-700 px-1 py-px rounded">
                OFERTA
              </span>
            )}
          </div>
          {/* Descuento tier (si no es oferta y hay descuento) */}
          {!tieneOferta && descuento > 0 && (
            <div className="text-[10px] text-indigo-500">
              -{descuento}% {TIER_LABELS[tierPrecio] || "tier"}
            </div>
          )}
        </div>
      </td>

      {/* Descuento extra negociado */}
      <td className="py-2.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
        {selected ? (
          <DescuentoExtraInput
            tipo={tipoExtra}
            valor={valorExtra}
            precioUnitario={linea?.precio_unitario || 0}
            onChange={(tipo, valor) => onDescuentoExtra(fila.id, tipo, valor)}
          />
        ) : (
          <Text variant="muted" className="text-xs">—</Text>
        )}
      </td>

      {/* Cantidad */}
      <td className="py-2.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
        {selected ? (
          <Input
            type="number"
            min="1"
            value={linea?.cantidad || 1}
            onChange={(e) => onCantidad(fila.id, e.target.value)}
            className="w-14 text-center text-xs font-black !py-1 !px-1 !rounded-lg !border-emerald-200 !bg-emerald-50"
            fullWidth={false}
          />
        ) : (
          <Text variant="muted" className="text-xs">—</Text>
        )}
      </td>

      {/* Subtotal */}
      <td className="py-2.5 px-3 text-right">
        {selected && subtotal > 0 ? (
          <span className="text-xs font-bold text-slate-800 tabular-nums">
            {formatPrecio(subtotal)}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>
    </tr>
  );
}

// ─── Input de descuento extra ───────────────────────────────────

function DescuentoExtraInput({ tipo, valor, precioUnitario, onChange }) {
  const handleTipoToggle = () => {
    if (tipo === "ninguno") {
      onChange("porcentaje", 0);
    } else if (tipo === "porcentaje") {
      onChange("monto", 0);
    } else {
      onChange("ninguno", 0);
    }
  };

  const handleValorChange = (e) => {
    let val = Number(e.target.value) || 0;
    if (tipo === "porcentaje") {
      val = Math.min(100, Math.max(0, val));
    } else if (tipo === "monto") {
      val = Math.min(precioUnitario, Math.max(0, val));
    }
    onChange(tipo, val);
  };

  if (tipo === "ninguno") {
    return (
      <button
        onClick={handleTipoToggle}
        className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 hover:border-amber-300 hover:text-amber-600 transition-all cursor-pointer"
        title="Agregar descuento extra"
      >
        + Desc.
      </button>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={handleTipoToggle}
        className={cn(
          "shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer border",
          tipo === "porcentaje"
            ? "bg-amber-50 border-amber-200 text-amber-600"
            : "bg-orange-50 border-orange-200 text-orange-600"
        )}
        title={tipo === "porcentaje" ? "Cambiar a monto fijo" : "Cambiar a porcentaje"}
      >
        {tipo === "porcentaje"
          ? <Percent className="w-3 h-3" />
          : <DollarSign className="w-3 h-3" />}
      </button>
      <Input
        type="number"
        min="0"
        max={tipo === "porcentaje" ? 100 : precioUnitario}
        step={tipo === "porcentaje" ? 1 : 0.01}
        value={valor || ""}
        onChange={handleValorChange}
        placeholder="0"
        className="w-14 text-center text-[10px] font-black !py-1 !px-1 !rounded-lg !border-amber-200 !bg-amber-50"
        fullWidth={false}
      />
    </div>
  );
}
