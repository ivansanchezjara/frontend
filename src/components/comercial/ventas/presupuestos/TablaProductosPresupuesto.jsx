"use client";
import { Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import FilaProducto from "./FilaProducto";
import {
  TIER_LABELS, getPrecioTier, getPrecioPublico,
  calcDescuentoImplicito, calcSubtotalLinea, formatMonto,
} from "./presupuesto-utils";

/**
 * Tabla de productos del constructor de presupuesto.
 * Si tierPrecio es "publico", muestra una sola columna de precio (sin duplicar).
 */
export default function TablaProductosPresupuesto({
  filasTabla, lineas, selectedIds, tierPrecio, moneda, total, isLoading,
  onToggle, onCantidad, onDescuentoExtra,
}) {
  const showDualPrice = tierPrecio !== "publico";
  const hayOfertas = lineas.some((l) => l.tiene_oferta) || filasTabla.some((f) => f.tiene_oferta || f.precio_oferta);

  return (
    <div className={cn(
      "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-opacity duration-200",
      isLoading && "opacity-50 pointer-events-none"
    )}>
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-3 pl-4 pr-2 text-[9px] font-black text-slate-400 uppercase tracking-widest w-11"></th>
              <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[100px]">SKU</th>
              <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
              {showDualPrice ? (
                <>
                  <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[80px]">P. Público</th>
                  <th className="py-3 px-3 text-[9px] font-black text-emerald-600 uppercase tracking-widest text-right w-[80px]">P. {TIER_LABELS[tierPrecio]}</th>
                  <th className="py-3 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-[55px]">Dto.</th>
                </>
              ) : (
                <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[90px]">P. Original</th>
              )}
              {hayOfertas && (
                <th className="py-3 px-3 text-[9px] font-black text-rose-600 uppercase tracking-widest text-right w-[80px]">P. Oferta</th>
              )}
              <th className="py-3 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-[95px]">Nuevo Desc.</th>
              <th className="py-3 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-[60px]">Cant.</th>
              <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[85px]">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filasTabla.map((fila) => {
              const selected = selectedIds.has(fila.id);
              const linea = lineas.find((l) => l.variante === fila.id);
              const subtotal = linea ? calcSubtotalLinea(linea) : 0;

              const filaPrecioPublico = getPrecioPublico(fila);
              const filaPrecioTier = fila.precio_tier != null ? fila.precio_tier : getPrecioTier(fila, tierPrecio);
              const filaDescuento = selected && linea
                ? linea.descuento_porcentaje
                : calcDescuentoImplicito(filaPrecioPublico, filaPrecioTier);

              return (
                <FilaProducto
                  key={fila.id}
                  fila={fila}
                  selected={selected}
                  linea={linea}
                  subtotal={subtotal}
                  precioPublico={filaPrecioPublico}
                  precioTier={filaPrecioTier}
                  descuento={filaDescuento}
                  showDualPrice={showDualPrice}
                  mostrarColumnaOferta={hayOfertas}
                  onToggle={onToggle}
                  onCantidad={onCantidad}
                  onDescuentoExtra={onDescuentoExtra}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer totalizador */}
      {lineas.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-200">
          <Text variant="label" className="text-slate-400">
            {lineas.length} línea{lineas.length !== 1 ? "s" : ""}
            {showDualPrice && lineas.some((l) => l.descuento_porcentaje > 0) && (
              <span className="ml-2 text-indigo-500">
                · Precio {TIER_LABELS[tierPrecio]}
              </span>
            )}
            {lineas.some((l) => l.tiene_oferta) && (
              <span className="ml-2 text-rose-500">
                · Con oferta vigente
              </span>
            )}
            {lineas.some((l) => l.descuento_extra_tipo !== "ninguno" && l.descuento_extra_valor > 0) && (
              <span className="ml-2 text-amber-600">
                · Con nuevo desc.
              </span>
            )}
          </Text>
          <div className="flex items-center gap-2">
            <Text variant="label" className="text-slate-500">Total:</Text>
            <span className="text-lg font-bold text-slate-900">
              {formatMonto(total, moneda)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
