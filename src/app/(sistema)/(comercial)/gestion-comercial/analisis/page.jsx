"use client";
import { useState, useEffect } from 'react';
import { PageHeader, Text, Heading, LoadingScreen, Input, Badge } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { getAnalisisVentas } from '@/services/apis/comercial';
import { BarChart3, Package, TrendingUp, MapPin, Calendar } from 'lucide-react';

export default function AnalisisPage() {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const { data, loading, execute } = useApi(getAnalisisVentas, {
    auto: false,
    initialData: { productos_top: [], tendencia_diaria: [], por_origen: {} },
  });

  useEffect(() => {
    const params = {};
    if (fechaDesde) params.fecha_desde = fechaDesde;
    if (fechaHasta) params.fecha_hasta = fechaHasta;
    execute(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaDesde, fechaHasta]);

  const productos = data?.productos_top || [];
  const tendencia = data?.tendencia_diaria || [];
  const porOrigen = data?.por_origen || {};

  // Calcular máximo para barras de tendencia
  const maxMontoDia = Math.max(...tendencia.map(t => t.monto_usd), 1);
  const maxCantidad = Math.max(...productos.map(p => p.cantidad_vendida), 1);

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Análisis de Ventas"
        subtitle={
          <>
            <BarChart3 size={12} /> Productos más vendidos, tendencias y origen
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 items-end bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <Input
              type="date"
              label="Desde"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
            <Input
              type="date"
              label="Hasta"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
            {(fechaDesde || fechaHasta) && (
              <button
                onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                className="text-xs font-medium text-slate-500 hover:text-red-600 px-3 py-2 transition"
              >
                Limpiar
              </button>
            )}
          </div>

          {loading ? (
            <LoadingScreen message="Analizando ventas..." />
          ) : (
            <>
              {/* Resumen por Origen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <Text variant="label" className="text-slate-400">Ventas en Sucursal</Text>
                    <Heading level={3} className="leading-none">
                      {porOrigen.sucursal?.total || 0}
                    </Heading>
                    <Text variant="bodyXs" className="text-emerald-600 font-medium">
                      ${(porOrigen.sucursal?.monto_usd || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <Text variant="label" className="text-slate-400">Ventas en Campo</Text>
                    <Heading level={3} className="leading-none">
                      {porOrigen.campo?.total || 0}
                    </Heading>
                    <Text variant="bodyXs" className="text-blue-600 font-medium">
                      ${(porOrigen.campo?.monto_usd || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Productos más vendidos */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <Heading level={5} className="text-slate-800 flex items-center gap-2">
                    <Package className="w-5 h-5 text-slate-400" />
                    Productos Más Vendidos
                  </Heading>
                  <Text variant="bodyXs" className="text-slate-400 mt-1">
                    Top 10 por cantidad vendida en el período
                  </Text>
                </div>

                {productos.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <Text className="text-slate-500">Sin datos de ventas en este período</Text>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {productos.map((p, idx) => {
                      const barWidth = (p.cantidad_vendida / maxCantidad) * 100;
                      return (
                        <div key={p.product_code} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                          <span className="w-6 text-center text-xs font-bold text-slate-400">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Text variant="bodyXs" className="font-mono text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                                {p.product_code}
                              </Text>
                              <Text variant="bodySm" className="font-semibold text-slate-800 truncate">
                                {p.nombre_variante}
                              </Text>
                            </div>
                            <Text variant="bodyXs" className="text-slate-400 truncate mt-0.5">
                              {p.producto_nombre}
                            </Text>
                            <div className="mt-1.5 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-5 shrink-0">
                            <div className="text-right">
                              <Text variant="bodyXs" className="text-slate-400">Cantidad</Text>
                              <Text variant="bodySm" className="font-bold text-slate-700">{p.cantidad_vendida}</Text>
                            </div>
                            <div className="text-right min-w-[90px]">
                              <Text variant="bodyXs" className="text-slate-400">Monto USD</Text>
                              <Text variant="bodySm" className="font-black text-emerald-700">
                                ${p.monto_usd.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Text>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tendencia Diaria */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <Heading level={5} className="text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-400" />
                    Tendencia Diaria
                  </Heading>
                  <Text variant="bodyXs" className="text-slate-400 mt-1">
                    Ventas por día en el período seleccionado
                  </Text>
                </div>

                {tendencia.length === 0 ? (
                  <div className="p-12 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <Text className="text-slate-500">Sin datos de tendencia</Text>
                  </div>
                ) : (
                  <div className="p-5">
                    {/* Bar chart simple */}
                    <div className="flex items-end gap-1 h-40">
                      {tendencia.map((t) => {
                        const height = (t.monto_usd / maxMontoDia) * 100;
                        const fecha = new Date(t.fecha);
                        const dia = fecha.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' });
                        return (
                          <div key={t.fecha} className="flex-1 flex flex-col items-center gap-1 group">
                            <div className="relative w-full flex justify-center">
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-[9px] px-2 py-1 rounded-lg whitespace-nowrap transition-opacity z-10">
                                ${t.monto_usd.toFixed(0)} · {t.ventas} ventas
                              </div>
                            </div>
                            <div
                              className="w-full bg-emerald-200 hover:bg-emerald-400 rounded-t transition-all cursor-default min-h-[4px]"
                              style={{ height: `${Math.max(height, 3)}%` }}
                            />
                            <Text variant="bodyXs" className="text-[8px] text-slate-400 rotate-0">
                              {dia}
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
