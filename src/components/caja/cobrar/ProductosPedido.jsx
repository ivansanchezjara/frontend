"use client";
import { Text } from "@/components/ui";
import { getFullImageUrl } from "@/services/apis/catalogo";
import { formatMonto, getMonedaSymbol } from "./utils";

export default function ProductosPedido({ lineas = [], moneda, totalPedido, clienteTier }) {
  const totalItems = lineas.reduce((s, l) => s + l.cantidad, 0);

  // Determinar si hay descuento (tier != publico)
  const tieneDescuento = clienteTier && clienteTier !== "publico";

  // Calcular total sin descuento (precio público × cantidad) para mostrar ahorro
  const totalSinDescuento = tieneDescuento
    ? lineas.reduce((s, l) => {
        const precioPublico = Number(l.precio_publico_unitario_usd) || 0;
        const precioUnitarioUsd = Number(l.precio_unitario_usd) || 0;
        const precioUnitarioMoneda = Number(l.precio_unitario_moneda) || 0;
        const ratio = precioUnitarioUsd > 0 ? precioUnitarioMoneda / precioUnitarioUsd : 0;
        const precioPublicoMoneda = precioPublico * ratio;
        return s + (precioPublicoMoneda * l.cantidad);
      }, 0)
    : 0;

  const descuentoTotal = totalSinDescuento - Number(totalPedido);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0 table-auto">
          <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10">
            <tr>
              <th className="px-5 py-4 border-b border-slate-100">Producto</th>
              <th className="px-3 py-4 text-center border-b border-slate-100 w-16">Cant.</th>
              {tieneDescuento && (
                <th className="px-4 py-4 text-right border-b border-slate-100 w-28 text-slate-300">P. Público</th>
              )}
              <th className="px-4 py-4 text-right border-b border-slate-100 w-28">P. Unit.</th>
              <th className="px-5 py-4 text-right border-b border-slate-100 w-28">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {lineas.map((linea, idx) => {
              const precioUnit = Number(linea.precio_unitario_moneda) || 0;
              const subtotal = precioUnit * (linea.cantidad || 0);

              // Precio público en moneda (estimado por ratio)
              const precioPublicoUsd = Number(linea.precio_publico_unitario_usd) || 0;
              const precioUnitarioUsd = Number(linea.precio_unitario_usd) || 0;
              const ratio = precioUnitarioUsd > 0 ? precioUnit / precioUnitarioUsd : 0;
              const precioPublicoMoneda = precioPublicoUsd * ratio;
              const tieneDescuentoLinea = tieneDescuento && precioPublicoMoneda > precioUnit;

              return (
                <tr key={idx} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl overflow-hidden p-0.5 shadow-sm shrink-0">
                        {linea.variante_imagen_url ? (
                          <img
                            src={getFullImageUrl(linea.variante_imagen_url)}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 rounded-lg" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Text variant="bodySmBold" className="!text-[11px] leading-tight truncate !text-slate-800">
                          {linea.producto_nombre || linea.variante_nombre || `Variante ${linea.variante_code}`}
                        </Text>
                        <Text variant="mutedXs" className="!text-[9px] mt-0.5">
                          {linea.variante_code}
                          {linea.variante_nombre && linea.producto_nombre && linea.variante_nombre !== linea.producto_nombre && (
                            <> · {linea.variante_nombre}</>
                          )}
                        </Text>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Text variant="bodyXsBold" className="inline-flex min-w-[28px] px-1.5 h-7 items-center justify-center bg-slate-900 text-white rounded-lg !text-[10px]">
                      {linea.cantidad}
                    </Text>
                  </td>
                  {tieneDescuento && (
                    <td className="px-4 py-3 text-right">
                      {tieneDescuentoLinea ? (
                        <Text variant="bodyXs" className="!text-slate-400 line-through !text-[10px]">
                          {getMonedaSymbol(moneda)} {formatMonto(precioPublicoMoneda, moneda)}
                        </Text>
                      ) : (
                        <Text variant="mutedXs" className="!text-[10px]">—</Text>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <Text variant="bodyXsBold" className="!text-slate-700 !text-[11px]">
                      {getMonedaSymbol(moneda)} {formatMonto(precioUnit, moneda)}
                    </Text>
                    {tieneDescuentoLinea && (
                      <Text variant="mutedXs" className="!text-[8px] !text-emerald-600 !font-bold">
                        -{Math.round((1 - precioUnit / precioPublicoMoneda) * 100)}%
                      </Text>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Text variant="bodyXsBold" className="!text-slate-800 !text-[11px] !font-black">
                      {getMonedaSymbol(moneda)} {formatMonto(subtotal, moneda)}
                    </Text>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer oscuro con totales */}
      <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center">
        <Text variant="bodyXs" className="!text-slate-400">
          {totalItems} ítem{totalItems !== 1 ? "s" : ""}
        </Text>

        <div className="flex items-center gap-5">
          {tieneDescuento && descuentoTotal > 0 && (
            <>
              <div className="text-right">
                <Text variant="mutedXs" className="!text-[9px] !text-slate-500 block">Descuento</Text>
                <Text variant="bodySmBold" className="!text-emerald-400">
                  -{getMonedaSymbol(moneda)} {formatMonto(descuentoTotal, moneda)}
                </Text>
              </div>
              <div className="w-px h-8 bg-slate-700" />
            </>
          )}

          <div className="text-right">
            <Text variant="mutedXs" className="!text-[9px] !text-slate-500 block">Total</Text>
            <Text variant="bodyBold" className="!text-lg !text-white">
              {getMonedaSymbol(moneda)} {formatMonto(totalPedido, moneda)}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
