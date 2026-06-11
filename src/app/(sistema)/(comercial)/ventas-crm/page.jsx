"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart, Users, Wallet, Package,
  ArrowRightLeft, FileText, Target,
} from "lucide-react";
import {
  LoadingScreen, PageHeader, Section, EmptyState,
  StatCard, QuickLink,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getVentas, getOportunidades, getPresupuestos,
  getSaldoCajaChica, getAlmacenVirtual, getInteracciones,
} from "@/services/apis/ventas";
import { getUser } from "@/services/apis/auth";
import { cn } from "@/lib/utils";

import HeroBanner from "@/components/comercial/ventas/dashboard/HeroBanner";
import PipelineOverview from "@/components/comercial/ventas/dashboard/PipelineOverview";
import PresupuestoEnviadoItem from "@/components/comercial/ventas/dashboard/PresupuestoEnviadoItem";
import ActivityItem from "@/components/comercial/ventas/clientes/ActivityItem";
import VentaRow from "@/components/comercial/ventas/presupuestos/VentaRow";

// ─── Helpers ────────────────────────────────────────────────────

function formatearMonto(monto) {
  const num = Number(monto);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-PY", { maximumFractionDigits: 2 });
}

function getFechaHoy() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

function diasDesde(fechaStr) {
  if (!fechaStr) return 0;
  return Math.floor((new Date() - new Date(fechaStr)) / (1000 * 60 * 60 * 24));
}

// ─── Pipeline config ────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: "nueva", label: "Nuevas", color: "bg-blue-500", lightBg: "bg-blue-50", textColor: "text-blue-700" },
  { key: "contactada", label: "Contactadas", color: "bg-amber-500", lightBg: "bg-amber-50", textColor: "text-amber-700" },
  { key: "negociacion", label: "Negociación", color: "bg-purple-500", lightBg: "bg-purple-50", textColor: "text-purple-700" },
];

// ─── Quick Actions config ───────────────────────────────────────

const QUICK_ACTIONS = [
  { href: "/ventas-crm/oportunidades", icon: Target, label: "Oportunidades" },
  { href: "/ventas-crm/presupuestos", icon: FileText, label: "Presupuestos" },
  { href: "/ventas-crm/clientes", icon: Users, label: "Clientes" },
  { href: "/ventas-crm/almacen-virtual", icon: Package, label: "Almacén" },
  { href: "/ventas-crm/caja-chica", icon: Wallet, label: "Caja chica" },
  { href: "/ventas-crm/conciliaciones", icon: ArrowRightLeft, label: "Conciliaciones" },
];

// ─── Página Principal ───────────────────────────────────────────

export default function VentasCrmPage() {
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [tieneAlmacenVirtual, setTieneAlmacenVirtual] = useState(false);

  const { data: ventasHoyData, execute: fetchVentasHoy } = useApi(getVentas);
  const { data: ventasMesData, execute: fetchVentasMes } = useApi(getVentas);
  const { data: ventasRecientesData, execute: fetchVentasRecientes } = useApi(getVentas);
  const { data: presupuestosEnviadosData, execute: fetchPresupuestosEnviados } = useApi(getPresupuestos);
  const { data: oportNuevas, execute: fetchOportNuevas } = useApi(getOportunidades);
  const { data: oportContactadas, execute: fetchOportContactadas } = useApi(getOportunidades);
  const { data: oportNegociacion, execute: fetchOportNegociacion } = useApi(getOportunidades);
  const { data: oportGanadas, execute: fetchOportGanadas } = useApi(getOportunidades);
  const { data: oportPerdidas, execute: fetchOportPerdidas } = useApi(getOportunidades);
  const { data: actividadesData, execute: fetchActividades } = useApi(getInteracciones);
  const { data: saldoData, execute: fetchSaldo } = useApi(getSaldoCajaChica);
  const { execute: fetchAlmacen } = useApi(getAlmacenVirtual);

  useEffect(() => {
    const hoy = getFechaHoy();
    const inicioMes = hoy.slice(0, 8) + "01";

    fetchVentasHoy({ estado: "confirmado", fecha_desde: hoy, fecha_hasta: hoy });
    fetchVentasMes({ estado: "confirmado", fecha_desde: inicioMes, fecha_hasta: hoy, page_size: 1 });
    fetchVentasRecientes({ estado: "confirmado", page_size: 5 });
    fetchPresupuestosEnviados({ estado: "enviado", page_size: 5 });
    fetchOportNuevas({ etapa: "nueva" });
    fetchOportContactadas({ etapa: "contactada" });
    fetchOportNegociacion({ etapa: "negociacion" });
    fetchOportGanadas({ etapa: "ganada", page_size: 1 });
    fetchOportPerdidas({ etapa: "perdida", page_size: 1 });
    fetchActividades({ ordering: "proxima_accion_fecha", page_size: 6 });

    fetchAlmacen()
      .then((data) => {
        const hasData = data && ((Array.isArray(data) && data.length > 0) || data?.results?.length > 0);
        setTieneAlmacenVirtual(!!hasData);
        return fetchSaldo();
      })
      .catch(() => setTieneAlmacenVirtual(false))
      .finally(() => setHasLoadedOnce(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Datos calculados ───────────────────────────────────────

  const ventasDelDia = ventasHoyData?.results || [];
  const cantidadVentas = ventasHoyData?.count || ventasDelDia.length;
  const montoTotalUsd = ventasDelDia.reduce((acc, v) => acc + Number(v.total_usd || 0), 0);
  const ventasMesResults = ventasMesData?.results || [];
  const montoMesUsd = ventasMesResults.reduce((acc, v) => acc + Number(v.total_usd || 0), 0);
  const ventasRecientes = (ventasRecientesData?.results || []).slice(0, 5);

  const presupuestosEnviados = (presupuestosEnviadosData?.results || []).slice(0, 5);
  const cantidadPresupuestosEnviados = presupuestosEnviadosData?.count || 0;

  const pipelineStages = PIPELINE_STAGES.map((stage) => {
    let count = 0;
    if (stage.key === "nueva") count = oportNuevas?.count || 0;
    if (stage.key === "contactada") count = oportContactadas?.count || 0;
    if (stage.key === "negociacion") count = oportNegociacion?.count || 0;
    return { ...stage, count };
  });
  const totalOportunidades = pipelineStages.reduce((s, st) => s + st.count, 0);

  const actividades = (actividadesData?.results || [])
    .filter((i) => i.proxima_accion_fecha)
    .slice(0, 5);

  const actividadesVencidas = actividades.filter((i) => diasDesde(i.proxima_accion_fecha) > 0);

  // Alertas urgentes
  const alertas = [];
  if (actividadesVencidas.length > 0) {
    alertas.push({ text: `${actividadesVencidas.length} acción${actividadesVencidas.length > 1 ? "es" : ""} vencida${actividadesVencidas.length > 1 ? "s" : ""}`, type: "danger" });
  }
  if (cantidadPresupuestosEnviados > 0) {
    alertas.push({ text: `${cantidadPresupuestosEnviados} presupuesto${cantidadPresupuestosEnviados > 1 ? "s" : ""} esperando respuesta`, type: "warning" });
  }

  // ─── Loading ────────────────────────────────────────────────

  if (!hasLoadedOnce) {
    return <LoadingScreen texto="Cargando panel de ventas..." />;
  }

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        title="Ventas y CRM"
        subtitle="Panel operativo"
        subtitleClassName="text-emerald-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Hero Banner */}
          <HeroBanner
            nombre={getUser()?.first_name || "vendedor"}
            cantidadVentas={cantidadVentas}
            montoTotalUsd={montoTotalUsd}
            montoMesUsd={montoMesUsd}
            alertas={alertas}
          />

          {/* Accesos rápidos (mobile) */}
          <div className="flex flex-wrap gap-2 sm:hidden">
            {QUICK_ACTIONS.map((action) => (
              <QuickLink key={action.href} {...action} />
            ))}
          </div>

          {/* Metrics Row */}
          <div className={cn(
            "grid gap-4",
            tieneAlmacenVirtual
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-3"
          )}>
            <StatCard
              icon={ShoppingCart}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              label="Ventas hoy"
              value={cantidadVentas}
              subtext={`USD ${formatearMonto(montoTotalUsd)}`}
              href="/ventas-crm/ventas?estado=confirmado"
            />
            <StatCard
              icon={Target}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              label="Oportunidades"
              value={totalOportunidades}
              subtext="en pipeline"
              href="/ventas-crm/oportunidades"
            />
            <StatCard
              icon={FileText}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              label="Presupuestos enviados"
              value={cantidadPresupuestosEnviados}
              subtext="esperando respuesta"
              href="/ventas-crm/presupuestos?estado=enviado"
            />
            {tieneAlmacenVirtual && (
              <StatCard
                icon={Wallet}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                label="Caja chica"
                value={
                  saldoData?.saldos?.USD?.saldo != null
                    ? `$${formatearMonto(saldoData.saldos.USD.saldo)}`
                    : "—"
                }
                subtext="USD"
                href="/ventas-crm/caja-chica"
              />
            )}
          </div>

          {/* Actions + Presupuestos Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Próximas acciones */}
            <Section
              title="Próximas acciones"
              action={
                <Link href="/ventas-crm/oportunidades" className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Ver oportunidades →
                </Link>
              }
            >
              {actividades.length === 0 ? (
                <EmptyState
                  inline
                  icon="📋"
                  titulo="Sin acciones pendientes"
                  descripcion="¡Estás al día! Las próximas acciones aparecerán aquí."
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {actividades.map((interaccion) => (
                    <ActivityItem key={interaccion.id} interaccion={interaccion} />
                  ))}
                </div>
              )}
            </Section>

            {/* Presupuestos enviados */}
            <Section
              title={`Presupuestos enviados${cantidadPresupuestosEnviados > 0 ? ` (${cantidadPresupuestosEnviados})` : ""}`}
              action={
                <Link href="/ventas-crm/presupuestos?estado=enviado" className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Ver todos →
                </Link>
              }
            >
              {presupuestosEnviados.length === 0 ? (
                <EmptyState
                  inline
                  icon="📋"
                  titulo="Sin presupuestos enviados"
                  descripcion="Los presupuestos enviados al cliente aparecerán aquí."
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {presupuestosEnviados.map((p) => (
                    <PresupuestoEnviadoItem key={p.id} presupuesto={p} />
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Pipeline Overview */}
          <PipelineOverview
            stages={pipelineStages}
            ganadas={oportGanadas?.count || 0}
            perdidas={oportPerdidas?.count || 0}
          />

          {/* Ventas Recientes */}
          <Section
            title="Ventas recientes"
            action={
              <Link href="/ventas-crm/ventas?estado=confirmado" className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                Ver todo →
              </Link>
            }
          >
            {ventasRecientes.length === 0 ? (
              <EmptyState
                inline
                icon="📈"
                titulo="Sin ventas confirmadas"
                descripcion="Las ventas confirmadas aparecerán aquí."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {ventasRecientes.map((venta) => (
                  <VentaRow key={venta.id} venta={venta} />
                ))}
              </div>
            )}
          </Section>

        </div>
      </main>
    </div>
  );
}
