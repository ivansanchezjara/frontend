"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Calendar, ShoppingCart, Truck, Package,
  Wallet, ArrowRightLeft,
} from "lucide-react";
import {
  EmptyState, LoadingScreen, PageHeader, Button, Badge, Text, StatCard,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { getEventos } from "@/services/apis/ventas-campo";
import { getVentas, getSaldoCajaChica } from "@/services/apis/ventas";

// ─── Dashboard de Ventas de Campo ───────────────────────────────

function VentasCampoContent() {
  const router = useRouter();

  const { data: eventosData, execute: fetchEventos } = useApi(getEventos);
  const { data: ventasData, execute: fetchVentas } = useApi(getVentas);
  const { data: saldoData, execute: fetchSaldo } = useApi(getSaldoCajaChica);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchEventos({ page_size: 5, ordering: "-created_at" }),
      fetchVentas({ origen: "campo", page_size: 5, ordering: "-created_at" }),
      fetchSaldo(),
    ]).then(() => setHasLoaded(true));
  }, [fetchEventos, fetchVentas, fetchSaldo]);

  if (!hasLoaded) return <LoadingScreen texto="Cargando ventas de campo..." />;

  const eventos = eventosData?.results || [];
  const ventas = ventasData?.results || [];
  const eventosActivos = eventos.filter(e => e.estado === "activo");
  const totalVentas = ventasData?.count || 0;
  const totalEventos = eventosData?.count || 0;

  const ESTADO_BADGE = {
    preparacion: { variant: "warning", label: "Preparación" },
    activo: { variant: "success", label: "Activo" },
    cierre: { variant: "info", label: "Cierre" },
    rendido: { variant: "default", label: "Rendido" },
    cancelado: { variant: "danger", label: "Cancelado" },
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Ventas de Campo" },
        ]}
        subtitle="Gestión de eventos, stock temporal y ventas en campo"
        subtitleClassName="text-emerald-600"
      >
        <Link href="/ventas-crm/ventas-campo/eventos/nuevo">
          <Button
            variant="success"
            size="md"
            icon={Plus}
            className="rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 cursor-pointer"
          >
            NUEVO EVENTO
          </Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 min-w-0">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Stats rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{totalEventos}</p>
                <p className="text-[11px] text-slate-400 font-medium uppercase">Eventos</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{eventosActivos.length}</p>
                <p className="text-[11px] text-slate-400 font-medium uppercase">Activos Ahora</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 text-purple-600">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{totalVentas}</p>
                <p className="text-[11px] text-slate-400 font-medium uppercase">Ventas en Campo</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50 text-amber-600">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">
                  {saldoData?.saldos?.USD?.saldo != null
                    ? `$${Number(saldoData.saldos.USD.saldo).toFixed(2)}`
                    : "—"}
                </p>
                <p className="text-[11px] text-slate-400 font-medium uppercase">Caja Chica USD</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/ventas-crm/ventas-campo/eventos"
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700">Eventos</p>
                  <p className="text-xs text-slate-400">Crear, activar y cerrar</p>
                </div>
              </div>
            </Link>
            <Link
              href="/ventas-crm/almacen-virtual"
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700">Almacén Virtual</p>
                  <p className="text-xs text-slate-400">Stock consignado en campo</p>
                </div>
              </div>
            </Link>
            <Link
              href="/ventas-crm/caja-chica"
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800 group-hover:text-amber-700">Caja Chica</p>
                  <p className="text-xs text-slate-400">Movimientos de efectivo</p>
                </div>
              </div>
            </Link>
            <Link
              href="/ventas-crm/conciliaciones"
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800 group-hover:text-purple-700">Conciliaciones</p>
                  <p className="text-xs text-slate-400">Rendición de campo</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Eventos recientes */}
          {eventos.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Eventos Recientes</h3>
                <Link href="/ventas-crm/ventas-campo/eventos" className="text-xs text-emerald-600 font-semibold hover:underline">
                  Ver todos →
                </Link>
              </div>
              <table className="w-full text-left">
                <tbody>
                  {eventos.map(ev => {
                    const b = ESTADO_BADGE[ev.estado] || { variant: "default", label: ev.estado };
                    return (
                      <tr
                        key={ev.id}
                        className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/ventas-crm/ventas-campo/eventos/${ev.id}`)}
                      >
                        <td className="py-3 pl-6 pr-4 text-sm font-semibold text-slate-800">{ev.titulo}</td>
                        <td className="py-3 px-4 text-center"><Badge variant={b.variant}>{b.label}</Badge></td>
                        <td className="py-3 px-4 text-xs text-slate-500 capitalize">{ev.tipo}</td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          {ev.fecha_inicio ? new Date(ev.fecha_inicio).toLocaleDateString("es-PY") : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function VentasCampoPage() {
  return (
    <Suspense fallback={<LoadingScreen texto="Cargando..." />}>
      <VentasCampoContent />
    </Suspense>
  );
}
