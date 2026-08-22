"use client";
import { useEffect } from "react";
import { X, MapPin, Package, AlertTriangle } from "lucide-react";
import { Button, Text } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getLotesPorVarianteId } from "@/services/apis/inventario";

/**
 * Modal de detalle de stock para el tablero de abastecimiento.
 * Muestra lotes, cantidades, vencimientos y depósitos de una variante.
 *
 * Props:
 * - item: objeto del tablero (variante_id, producto_nombre, variante_nombre, etc.) o null para cerrar
 * - onClose: callback para cerrar
 */
export default function StockDetalleModal({ item, onClose }) {
  const { data: lotesData, loading, execute: fetchLotes } = useApi(
    getLotesPorVarianteId, { auto: false, initialData: [] }
  );

  useEffect(() => {
    if (item?.variante_id) fetchLotes(item.variante_id);
  }, [item?.variante_id, fetchLotes]);

  if (!item) return null;

  const lotes = Array.isArray(lotesData) ? lotesData : (lotesData?.results || []);
  const lotesConStock = lotes.filter((l) => l.cantidad > 0);
  const stockDisponible = lotesConStock
    .filter((l) => !l.esta_vencido)
    .reduce((sum, l) => sum + l.cantidad, 0);
  const stockVencido = lotesConStock
    .filter((l) => l.esta_vencido)
    .reduce((sum, l) => sum + l.cantidad, 0);
  const stockTotal = lotesConStock.reduce((sum, l) => sum + l.cantidad, 0);

  const getSemaforo = (vencimiento) => {
    if (!vencimiento)
      return { dot: "bg-slate-200", color: "text-slate-400", label: "Sin vencimiento" };
    const days = (new Date(vencimiento) - new Date()) / (1000 * 60 * 60 * 24);
    if (days < 0)
      return { dot: "bg-red-600 animate-pulse", color: "text-red-700", label: "VENCIDO" };
    if (days < 90)
      return { dot: "bg-red-500", color: "text-red-600", label: `${Math.floor(days)}d` };
    if (days < 180)
      return { dot: "bg-amber-500", color: "text-amber-600", label: `${Math.floor(days)}d` };
    return { dot: "bg-emerald-500", color: "text-emerald-600", label: `${Math.floor(days)}d` };
  };

  const formatFecha = (f) => {
    if (!f) return "—";
    return new Date(f).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 flex justify-between items-start border-b border-slate-100 bg-slate-50">
          <div className="flex-1 min-w-0">
            <Text as="h2" className="text-lg font-bold text-slate-900">
              {item.producto_nombre}
            </Text>
            <Text variant="bodySm" className="text-slate-500">
              {item.variante_nombre}
            </Text>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                {item.variante_codigo}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">{item.marca_nombre}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border-slate-200 text-slate-400 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-10 text-center">
              <Text className="text-slate-400 animate-pulse">Cargando stock...</Text>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <Text variant="label" className="text-emerald-600 text-[10px]">Disponible</Text>
                  <Text className="text-2xl font-black text-emerald-700">{stockDisponible}</Text>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <Text variant="label" className="text-red-600 text-[10px]">Vencido</Text>
                  <Text className="text-2xl font-black text-red-700">{stockVencido}</Text>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <Text variant="label" className="text-slate-500 text-[10px]">Total en Lotes</Text>
                  <Text className="text-2xl font-black text-slate-800">{stockTotal}</Text>
                </div>
              </div>

              {/* Alerta si todo está vencido */}
              {stockTotal > 0 && stockDisponible === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <Text className="text-sm font-medium text-red-800">
                    Todo el stock existente está vencido. Stock útil real: 0
                  </Text>
                </div>
              )}

              {/* Desglose por lote */}
              {lotesConStock.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Package className="w-7 h-7 text-slate-200 mx-auto mb-2" />
                  <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Sin stock en ningún depósito
                  </Text>
                </div>
              ) : (
                <div className="space-y-2">
                  <Text variant="label" className="text-slate-400 flex items-center gap-1.5">
                    <Package size={12} /> Detalle por lote ({lotesConStock.length})
                  </Text>
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-100">
                      <tr>
                        <th className="text-left py-2 text-xs font-medium text-slate-500">Lote</th>
                        <th className="text-left py-2 text-xs font-medium text-slate-500">Depósito</th>
                        <th className="text-center py-2 text-xs font-medium text-slate-500">Cantidad</th>
                        <th className="text-center py-2 text-xs font-medium text-slate-500">Vencimiento</th>
                        <th className="text-center py-2 text-xs font-medium text-slate-500">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lotesConStock.map((lote) => {
                        const semaforo = getSemaforo(lote.vencimiento);
                        return (
                          <tr key={lote.id} className={lote.esta_vencido ? "bg-red-50/50" : ""}>
                            <td className="py-2 font-medium text-slate-800">{lote.lote_codigo}</td>
                            <td className="py-2 text-slate-600 flex items-center gap-1">
                              <MapPin size={11} className="text-slate-400" />
                              {lote.deposito_nombre || "—"}
                            </td>
                            <td className="py-2 text-center font-bold text-slate-900">{lote.cantidad}</td>
                            <td className="py-2 text-center text-slate-600">{formatFecha(lote.vencimiento)}</td>
                            <td className="py-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${semaforo.dot}`}></div>
                                <span className={`text-[11px] font-bold ${semaforo.color}`}>
                                  {semaforo.label}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Info de último ingreso */}
              {item.fecha_ultimo_ingreso && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm">
                  <Text variant="label" className="text-blue-600 text-[10px] mb-1">Último Ingreso</Text>
                  <div className="flex items-center gap-4 text-blue-800">
                    <span>Fecha: <strong>{formatFecha(item.fecha_ultimo_ingreso)}</strong></span>
                    <span>Stock post-ingreso: <strong>{item.stock_post_ingreso}</strong></span>
                    <span>Stock actual: <strong>{item.stock_actual}</strong></span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
