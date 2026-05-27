"use client";
import { LoadingScreen, PageHeader, Text, Heading, Badge } from '@/components/ui';
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, MapPin, Package, Calendar, User, Check, Edit3 } from "lucide-react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { getTransferencia } from "@/services/apis/movimientos";

export default function DetalleTransferenciaPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: transf, loading } = useApi(getTransferencia, {
    auto: true,
    args: [id],
  });

  if (loading) {
    return <LoadingScreen message="Cargando transferencia..." />;
  }

  if (!transf) {
    return (
      <div className="p-20 text-center font-black uppercase text-slate-400 h-screen flex items-center justify-center">
        Transferencia no encontrada
      </div>
    );
  }

  const badgeVariant = transf.estado === 'APROBADO' ? 'success'
    : transf.estado === 'RECHAZADO' ? 'danger' : 'warning';

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Gestión de Movimientos", href: "/movimientos" },
          { label: "Transferencias Internas", href: "/movimientos/transferencias" },
          { label: `Transferencia #${id}` },
        ]}
        subtitle={
          <>
            <ArrowRightLeft size={12} />
            Detalle de la transferencia interna
          </>
        }
      >
        {transf.estado === 'BORRADOR' && (
          <Link
            href={`/movimientos/transferencias/${id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
          >
            <Edit3 size={14} /> Editar Borrador
          </Link>
        )}
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Cabecera de información */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <Heading level={6} className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" /> Información General
              </Heading>
              <Badge variant={badgeVariant}>{transf.estado}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Text variant="label" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Depósito Origen
                </Text>
                <Text className="font-bold text-slate-800">
                  {transf.deposito_origen_nombre || '—'}
                </Text>
              </div>
              <div>
                <Text variant="label" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Depósito Destino
                </Text>
                <Text className="font-bold text-slate-800">
                  {transf.deposito_destino_nombre || '—'}
                </Text>
              </div>
              <div>
                <Text variant="label" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Fecha
                </Text>
                <Text className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar size={12} className="text-slate-400" />
                  {new Date(transf.fecha).toLocaleDateString()}
                </Text>
              </div>
              <div>
                <Text variant="label" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Creado por
                </Text>
                <Text className="font-bold text-slate-800 flex items-center gap-1.5">
                  <User size={12} className="text-slate-400" />
                  {transf.usuario_nombre || '—'}
                </Text>
              </div>
            </div>

            {transf.aprobado_por_nombre && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Text variant="label" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Confirmado por
                </Text>
                <Text className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Check size={12} className="text-emerald-500" />
                  {transf.aprobado_por_nombre}
                </Text>
              </div>
            )}

            {transf.observaciones && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Text variant="label" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Observaciones
                </Text>
                <Text className="text-slate-700">{transf.observaciones}</Text>
              </div>
            )}
          </div>

          {/* Tabla de Items */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <Package size={18} />
              </div>
              <div>
                <Heading level={4} className="text-slate-800 font-black">
                  Productos Transferidos
                </Heading>
                <Text as="span" variant="label" className="block text-[11px] text-slate-500 uppercase tracking-widest mt-1">
                  Total de ítems:{" "}
                  <Text as="span" variant="label" className="font-black text-slate-900">
                    {transf.items?.length || 0}
                  </Text>
                </Text>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100 uppercase text-slate-400 font-black">
                  <tr>
                    <th className="p-4 text-left">Producto / Lote</th>
                    <th className="p-4 text-center w-32">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(transf.items || []).length === 0 ? (
                    <tr>
                      <td colSpan="2" className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Sin ítems registrados
                      </td>
                    </tr>
                  ) : (
                    transf.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-all">
                        <td className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              {item.variante_codigo}
                            </span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                              {item.lote_codigo}
                            </span>
                          </div>
                          <div className="font-black text-slate-800 text-sm">
                            {item.variante_nombre}
                          </div>
                          {item.nombre_variante && (
                            <Text as="span" variant="bodySm" className="text-slate-400 font-bold">
                              {item.nombre_variante}
                            </Text>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-block px-4 py-1.5 bg-blue-50 rounded-full font-black text-blue-700">
                            {item.cantidad} unid.
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
