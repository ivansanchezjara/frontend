"use client";
import { useEffect } from 'react';
import { PageHeader, Text, Heading, LoadingScreen, Badge } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { getSeguimientoPipeline } from '@/services/apis/comercial';
import {
  ClipboardList, FileEdit, CheckCircle, CreditCard, Truck, XCircle,
  ArrowRight, Calendar,
} from 'lucide-react';

const ESTADOS_CONFIG = [
  {
    key: 'borrador',
    label: 'Borradores',
    icon: FileEdit,
    color: 'bg-slate-100 text-slate-600',
    iconBg: 'bg-slate-50 text-slate-500',
    border: 'border-slate-200',
  },
  {
    key: 'confirmado',
    label: 'Confirmados',
    icon: CheckCircle,
    color: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-blue-50 text-blue-600',
    border: 'border-blue-200',
  },
  {
    key: 'cobrado',
    label: 'Cobrados',
    icon: CreditCard,
    color: 'bg-emerald-100 text-emerald-700',
    iconBg: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-200',
  },
  {
    key: 'entregado',
    label: 'Entregados',
    icon: Truck,
    color: 'bg-purple-100 text-purple-700',
    iconBg: 'bg-purple-50 text-purple-600',
    border: 'border-purple-200',
  },
  {
    key: 'cancelado',
    label: 'Cancelados',
    icon: XCircle,
    color: 'bg-red-100 text-red-700',
    iconBg: 'bg-red-50 text-red-600',
    border: 'border-red-200',
  },
];

const ESTADO_BADGE_MAP = {
  borrador: 'default',
  confirmado: 'info',
  cobrado: 'success',
  entregado: 'purple',
  cancelado: 'danger',
};

export default function SeguimientoPage() {
  const { data, loading, execute } = useApi(getSeguimientoPipeline, {
    auto: false,
    initialData: { pipeline: {}, recientes: [], hoy: {} },
  });

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pipeline = data?.pipeline || {};
  const recientes = data?.recientes || [];
  const hoy = data?.hoy || {};

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Seguimiento de Pedidos"
        subtitle={
          <>
            <ClipboardList size={12} /> Pipeline de ventas y actividad reciente
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {loading ? (
            <LoadingScreen message="Cargando pipeline..." />
          ) : (
            <>
              {/* Resumen Hoy */}
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 p-5 rounded-2xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Text variant="bodySm" className="text-emerald-100 font-medium">Actividad de Hoy</Text>
                    <Heading level={2} className="text-white leading-none mt-1">
                      {hoy.total || 0} ventas
                    </Heading>
                    <Text variant="bodySm" className="text-emerald-200 mt-1">
                      ${(hoy.monto_usd || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </Text>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-emerald-100" />
                  </div>
                </div>
              </div>

              {/* Pipeline Cards */}
              <div>
                <Heading level={5} className="text-slate-800 mb-4">Estado del Pipeline</Heading>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {ESTADOS_CONFIG.map((estado) => {
                    const Icon = estado.icon;
                    const datos = pipeline[estado.key] || { total: 0, monto_usd: 0 };
                    return (
                      <div
                        key={estado.key}
                        className={`bg-white p-4 rounded-xl border ${estado.border} shadow-sm hover:shadow-md transition-all group`}
                      >
                        <div className={`w-10 h-10 rounded-lg ${estado.iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <Text variant="bodyXs" className="text-slate-500 font-medium">
                          {estado.label}
                        </Text>
                        <Heading level={3} className="leading-none mt-1">
                          {datos.total}
                        </Heading>
                        <Text variant="bodyXs" className="text-slate-400 mt-1">
                          ${datos.monto_usd.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </Text>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Flujo Visual del Pipeline */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <Heading level={6} className="text-slate-600 mb-4 text-xs uppercase tracking-wider font-black">
                  Flujo del Ciclo de Vida
                </Heading>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {ESTADOS_CONFIG.filter(e => e.key !== 'cancelado').map((estado, idx, arr) => {
                    const datos = pipeline[estado.key] || { total: 0 };
                    return (
                      <div key={estado.key} className="flex items-center gap-2">
                        <div className={`px-4 py-2 rounded-xl ${estado.color} text-xs font-bold`}>
                          {estado.label}: {datos.total}
                        </div>
                        {idx < arr.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Últimas Ventas */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <Heading level={5} className="text-slate-800">Últimas Ventas</Heading>
                  <Text variant="bodyXs" className="text-slate-400 mt-1">
                    10 ventas más recientes
                  </Text>
                </div>

                {recientes.length === 0 ? (
                  <div className="p-12 text-center">
                    <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <Text className="text-slate-500">No hay ventas registradas</Text>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {recientes.map((v) => {
                      const fecha = new Date(v.created_at);
                      const fechaStr = fecha.toLocaleDateString('es-PY', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      });
                      const horaStr = fecha.toLocaleTimeString('es-PY', {
                        hour: '2-digit', minute: '2-digit',
                      });

                      return (
                        <div key={v.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                          <div className="w-10 text-center">
                            <Text variant="bodyXs" className="font-mono text-xs font-bold text-slate-500">
                              #{v.id}
                            </Text>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Text variant="bodySm" className="font-semibold text-slate-800 truncate">
                                {v.cliente_nombre}
                              </Text>
                              <Badge variant={ESTADO_BADGE_MAP[v.estado] || 'default'}>
                                {v.estado}
                              </Badge>
                            </div>
                            <Text variant="bodyXs" className="text-slate-400 mt-0.5">
                              Vendedor: {v.vendedor_nombre} · {v.origen}
                            </Text>
                          </div>

                          <div className="text-right shrink-0">
                            <Text variant="bodySm" className="font-bold text-slate-800">
                              ${v.total_usd.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                            <Text variant="bodyXs" className="text-slate-400">
                              {fechaStr} {horaStr}
                            </Text>
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
