"use client";
import { useState, useEffect } from 'react';
import { PageHeader, Text, Heading, LoadingScreen, Input } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { getRendimientoVendedores } from '@/services/apis/comercial';
import { TrendingUp, Users, DollarSign, ShoppingCart, Trophy, Medal } from 'lucide-react';

const PERIODOS = [
  { id: 'semana', label: 'Última Semana' },
  { id: 'mes', label: 'Último Mes' },
  { id: 'trimestre', label: 'Último Trimestre' },
  { id: 'anio', label: 'Último Año' },
];

export default function RendimientoPage() {
  const [periodo, setPeriodo] = useState('mes');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const { data, loading, execute } = useApi(getRendimientoVendedores, {
    auto: false,
    initialData: { totales: {}, vendedores: [], periodo: {} },
  });

  useEffect(() => {
    const params = { periodo };
    if (fechaDesde) params.fecha_desde = fechaDesde;
    if (fechaHasta) params.fecha_hasta = fechaHasta;
    execute(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, fechaDesde, fechaHasta]);

  const totales = data?.totales || {};
  const vendedores = data?.vendedores || [];

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-400">#{index + 1}</span>;
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Rendimiento de Vendedores"
        subtitle={
          <>
            <TrendingUp size={12} /> Ranking, montos y métricas por vendedor
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Filtros de Período */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {PERIODOS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPeriodo(p.id); setFechaDesde(''); setFechaHasta(''); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    periodo === p.id && !fechaDesde
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
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
            </div>
          </div>

          {loading ? (
            <LoadingScreen message="Calculando rendimiento..." />
          ) : (
            <>
              {/* Resumen Global */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingCart size={22} />
                  </div>
                  <div>
                    <Text variant="label" className="text-slate-400">Total Pedidos</Text>
                    <Heading level={3} className="leading-none">{totales.total_ventas || 0}</Heading>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign size={22} />
                  </div>
                  <div>
                    <Text variant="label" className="text-slate-400">Monto Total</Text>
                    <Heading level={3} className="leading-none">
                      ${(totales.monto_total_usd || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Heading>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users size={22} />
                  </div>
                  <div>
                    <Text variant="label" className="text-slate-400">Ticket Promedio</Text>
                    <Heading level={3} className="leading-none">
                      ${(totales.ticket_promedio || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Heading>
                  </div>
                </div>
              </div>

              {/* Ranking de Vendedores */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <Heading level={5} className="text-slate-800">Ranking de Vendedores</Heading>
                  <Text variant="bodyXs" className="text-slate-400 mt-1">
                    Ordenado por monto total vendido en el período seleccionado
                  </Text>
                </div>

                {vendedores.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <Text className="text-slate-500">No hay ventas registradas en este período</Text>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {vendedores.map((v, idx) => {
                      const maxMonto = vendedores[0]?.monto_total_usd || 1;
                      const porcentaje = (v.monto_total_usd / maxMonto) * 100;

                      return (
                        <div key={v.vendedor_id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                          {/* Rank */}
                          <div className="w-8 shrink-0 flex justify-center">
                            {getRankIcon(idx)}
                          </div>

                          {/* Nombre */}
                          <div className="flex-1 min-w-0">
                            <Text variant="bodySm" className="font-semibold text-slate-800 truncate">
                              {v.nombre}
                            </Text>
                            <div className="mt-1.5 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                                style={{ width: `${porcentaje}%` }}
                              />
                            </div>
                          </div>

                          {/* Métricas */}
                          <div className="flex items-center gap-6 shrink-0">
                            <div className="text-right">
                              <Text variant="bodyXs" className="text-slate-400">Pedidos</Text>
                              <Text variant="bodySm" className="font-bold text-slate-700">{v.total_ventas}</Text>
                            </div>
                            <div className="text-right">
                              <Text variant="bodyXs" className="text-slate-400">Ticket Prom.</Text>
                              <Text variant="bodySm" className="font-bold text-slate-700">
                                ${v.ticket_promedio.toFixed(2)}
                              </Text>
                            </div>
                            <div className="text-right min-w-[100px]">
                              <Text variant="bodyXs" className="text-slate-400">Total USD</Text>
                              <Text variant="bodySm" className="font-black text-emerald-700">
                                ${v.monto_total_usd.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Text>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
