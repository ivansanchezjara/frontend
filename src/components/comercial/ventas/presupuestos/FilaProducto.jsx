"use client";
import { Check, Percent, DollarSign } from "lucide-react";
import { Badge, Input, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatPrecio } from "./presupuesto-utils";

/**
 * Fila de producto en la tabla del constructor de presupuesto.
 * Muestra checkbox, SKU, nombre, precios, descuento tier, descuento extra, cantidad y subtotal.
 */
export default function FilaProducto({
  fila, selected, linea, subtotal,
  precioPublico, precioTier, descuento,
  showDualPrice = true,
  mostrarColumnaOferta = false,
  onToggle, onCantidad, onDescuentoExtra,
}) {
  const tipoExtra = linea?.descuento_extra_tipo || "ninguno";
  const valorExtra = linea?.descuento_extra_valor || 0;
  const tieneOferta = fila.tiene_oferta || (linea?.tiene_oferta) || false;

  return (
    <tr
      onClick={() => onToggle(fila)}
      className={cn(
        "transition-colors cursor-pointer group",
        selected
          ? "bg-emerald-50/60 hover:bg-emerald-100/60"
          : "hover:bg-blue-50/40"
      )}
    >
      {/* Checkbox */}
      <td className="py-2.5 pl-4 pr-2">
        <div className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
          selected
            ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200"
            : "border-slate-300 bg-white group-hover:border-emerald-300"
        )}>
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
        <div className="flex items-center gap-1.5">
          <Text variant="bodyXs" className="font-black text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors">
            {fila.producto_nombre}
          </Text>
          {tieneOferta && (
            <span className="shrink-0 inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[9px] font-bold text-rose-600">
              🏷️
            </span>
          )}
        </div>
        {fila.nombre_variante && (
          <Text variant="bodyXs" className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate mt-0.5">
            {fila.nombre_variante}
          </Text>
        )}
      </td>

      {/* Precio público (referencia, tachado si hay descuento) */}
      {showDualPrice ? (
        <>
          <td className="py-2.5 px-3 text-right">
            <Text variant="bodyXs" className={cn(
              "tabular-nums",
              (descuento > 0 || tieneOferta) ? "line-through text-slate-300" : "text-slate-500"
            )}>
              {formatPrecio(precioPublico)}
            </Text>
          </td>

          {/* Precio del tier del cliente */}
          <td className="py-2.5 px-3 text-right">
            <span className={cn(
              "text-xs tabular-nums",
              tieneOferta
                ? "line-through text-slate-400"
                : "font-bold text-indigo-700"
            )}>
              {precioTier > 0 ? formatPrecio(precioTier) : "—"}
            </span>
          </td>

          {/* Descuento tier implícito */}
          <td className="py-2.5 px-2 text-center">
            {descuento > 0 ? (
              <Badge variant="success" className="text-[9px] px-1.5 py-0.5">
                -{descuento}%
              </Badge>
            ) : (
              <Text variant="muted" className="text-xs">—</Text>
            )}
          </td>
        </>
      ) : (
        /* Single price column: P. Original */
        <td className="py-2.5 px-3 text-right">
          <span className={cn(
            "text-xs tabular-nums",
            tieneOferta
              ? "line-through text-slate-400"
              : "font-bold text-slate-700"
          )}>
            {precioPublico > 0 ? formatPrecio(precioPublico) : "—"}
          </span>
        </td>
      )}

      {/* P. Oferta (columna condicional) */}
      {mostrarColumnaOferta && (
        <td className="py-2.5 px-3 text-right">
          {tieneOferta ? (
            <span className="text-xs font-bold tabular-nums text-rose-600">
              {formatPrecio(fila.precio_oferta || linea?.precio_oferta)}
            </span>
          ) : (
            <span className="text-xs text-slate-300">—</span>
          )}
        </td>
      )}

      {/* Nuevo descuento negociado */}
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
    // Ciclo: ninguno → porcentaje → monto → ninguno
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
        title="Agregar nuevo descuento"
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
