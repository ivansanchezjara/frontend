"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Users,
  Wallet,
  Package,
  ArrowRightLeft,
  FileText,
  AlertCircle,
  TrendingUp,
  Target,
  Plus,
  ChevronRight,
} from "lucide-react";
import {
  LoadingScreen,
  PageHeader,
  Section,
  EmptyState,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getVentas,
  getOportunidades,
  getPresupuestos,
  getSaldoCajaChica,
  getAlmacenVirtual,
  getInteracciones,
} from "@/services/apis/ventas";
import { getUser } from "@/services/apis/auth";
import { cn } from "@/lib/utils";

import PipelineBar from "@/components/comercial/ventas/pipeline/PipelineBar";
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
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, "0");
  const day = String(hoy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSaludo() {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 18) return "Buenas tardes";
  return "Buenas noches";
}

function diasDesde(fechaStr) {
  if (!fechaStr) return 0;
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  return Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
}

// ─── Metric Tile ─────────────────────────────────────────────

function MetricTile({ icon: Icon, label, value, subtext, href, color = "emerald" }) {
  const colorStyles = {
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-200/50",
    blue: "from-blue-500 to-blue-600 shadow-blue-200/50",
    amber: "from-amber-500 to-amber-600 shadow-amber-200/50",
    purple: "from-purple-500 to-purple-600 shadow-purple-200/50",
  };

  return (
    <Link href={href} className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg", colorStyles[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

// ─── Pipeline config ────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: "nueva", label: "Nuevas", color: "bg-blue-500", lightBg: "bg-blue-50", textColor: "text-blue-700" },
  { key: "contactada", label: "Contactadas", color: "bg-amber-500", lightBg: "bg-amber-50", textColor: "text-amber-700" },
  { key: "negociacion", label: "Negociación", color: "bg-purple-500", lightBg: "bg-purple-50", textColor: "text-purple-700" },
];

const PIPELINE_CIERRE_STAGES = [
  { key: "ganada", label: "Ganadas", color: "bg-emerald-500", textColor: "text-emerald-700" },
  { key: "perdida", label: "Perdidas", color: "bg-red-400", textColor: "text-red-700" },
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
      .then((almacenData) => {
        if (almacenData && ((Array.isArray(almacenData) && almacenData.length > 0) || almacenData?.results?.length > 0)) {
          setTieneAlmacenVirtual(true);
        }
        return fetchSaldo();
      })
      .catch(() => {
        setTieneAlmacenVirtual(false);
      })
      .finally(() => {
        setHasLoadedOnce(true);
      });
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

  const pipelineCierreStages = PIPELINE_CIERRE_STAGES.map((stage) => ({
    ...stage,
    count: stage.key === "ganada" ? (oportGanadas?.count || 0) : (oportPerdidas?.count || 0),
  }));

  const actividades = (actividadesData?.results || [])
    .filter((i) => i.proxima_accion_fecha)
    .slice(0, 5);

  const actividadesVencidas = actividades.filter(
    (i) => diasDesde(i.proxima_accion_fecha) > 0
  );

  // Alertas urgentes
  const alertas = [];
  if (actividadesVencidas.length > 0) {
    alertas.push({ text: `${actividadesVencidas.length} acción${actividadesVencidas.length > 1 ? "es" : ""} vencida${actividadesVencidas.length > 1 ? "s" : ""}`, type: "danger" });
  }
  if (cantidadPresupuestosEnviados > 0) {
    alertas.push({ text: `${cantidadPresupuestosEnviados} presupuesto${cantidadPresupuestosEnviados > 1 ? "s" : ""} esperando respuesta`, type: "warning" });
  }

  if (!hasLoadedOnce) {
    return <LoadingScreen texto="Cargando panel de ventas..." />;
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        title="Ventas y CRM"
        subtitle="Panel operativo"
        subtitleClassName="text-emerald-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ═══════════════════════════════════════════════════════
              HERO — Saludo + CTA principal + accesos rápidos
          ═══════════════════════════════════════════════════════ */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 lg:p-8 text-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              {/* Left — Greeting + alerts */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold">{getSaludo()}, {getUser()?.first_name || "vendedor"} 👋</h2>
                <p className="text-sm text-slate-300">
                  {cantidadVentas > 0 ? (
                    <>Hoy: <span className="text-emerald-400 font-semibold">{cantidadVentas} venta{cantidadVentas !== 1 ? "s" : ""}</span> · <span className="text-emerald-400 font-semibold">USD {formatearMonto(montoTotalUsd)}</span></>
                  ) : (
                    "Aún no registraste ventas hoy"
                  )}
                </p>
                {alertas.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {alertas.map((a, i) => (
                      <span
                        key={i}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                          a.type === "danger" && "bg-red-500/20 text-red-300",
                          a.type === "warning" && "bg-amber-500/20 text-amber-300"
                        )}
                      >
                        {a.type === "danger" && <AlertCircle className="h-3 w-3" />}
                        {a.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right — CTA + quick links */}
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/ventas-crm/ventas/nueva"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-emerald-500/25"
                >
                  <Plus className="h-4 w-4" />
                  Nueva venta
                </Link>
                <div className="hidden sm:flex items-center gap-1 rounded-xl bg-white/10 backdrop-blur-sm px-2 py-1">
                  {QUICK_ACTIONS.map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                      title={label}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden xl:inline">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress bar del mes */}
            {montoMesUsd > 0 && (
              <div className="relative mt-6 pt-5 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    Meta mensual
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    USD {formatearMonto(montoMesUsd)} <span className="text-slate-500">/ 12.000</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-700"
                    style={{ width: `${Math.min((montoMesUsd / 12000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════
              METRICS ROW
          ═══════════════════════════════════════════════════════ */}
          <div className={cn(
            "grid gap-4",
            tieneAlmacenVirtual
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-3"
          )}>
            <MetricTile
              icon={ShoppingCart}
              color="emerald"
              label="Ventas hoy"
              value={cantidadVentas}
              subtext={`USD ${formatearMonto(montoTotalUsd)}`}
              href="/ventas-crm/ventas?estado=confirmado"
            />
            <MetricTile
              icon={Target}
              color="blue"
              label="Oportunidades"
              value={totalOportunidades}
              subtext="en pipeline"
              href="/ventas-crm/oportunidades"
            />
            <MetricTile
              icon={FileText}
              color="amber"
              label="Presupuestos enviados"
              value={cantidadPresupuestosEnviados}
              subtext="esperando respuesta"
              href="/ventas-crm/presupuestos?estado=enviado"
            />
            {tieneAlmacenVirtual && (
              <MetricTile
                icon={Wallet}
                color="purple"
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

          {/* ═══════════════════════════════════════════════════════
              ACTIONS + DRAFTS GRID
          ═══════════════════════════════════════════════════════ */}
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

          {/* ═══════════════════════════════════════════════════════
              PIPELINE DE OPORTUNIDADES
          ═══════════════════════════════════════════════════════ */}
          <Section
            title="Pipeline de oportunidades"
            action={
              <Link href="/ventas-crm/oportunidades" className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                Ver todo →
              </Link>
            }
          >
            <div className="px-6 py-5 space-y-4">
              <PipelineBar stages={pipelineStages} />
              {pipelineStages[0].count > 0 && (
                <p className="text-xs text-blue-600 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Tenés {pipelineStages[0].count} oportunidad{pipelineStages[0].count > 1 ? "es" : ""} nueva{pipelineStages[0].count > 1 ? "s" : ""} sin contactar
                </p>
              )}
              {/* Stats de cierre */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Resultados</span>
                {pipelineCierreStages.map((stage) => (
                  <div key={stage.key} className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", stage.color)} />
                    <span className="text-xs font-semibold text-slate-600">
                      {stage.count} {stage.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════════════
              VENTAS RECIENTES
          ═══════════════════════════════════════════════════════ */}
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

// ─── PresupuestoEnviadoItem ───────────────────────────────────────

function PresupuestoEnviadoItem({ presupuesto }) {
  const { id, oportunidad, oportunidad_titulo, cliente_razon_social, total, moneda, version, enviado_at, vigencia_dias } = presupuesto;

  function formatMonto(monto, mon) {
    if (!monto || Number(monto) === 0) return "—";
    const num = Number(monto);
    if (mon === "PYG") return num.toLocaleString("es-PY") + " ₲";
    return "USD " + num.toLocaleString("en-US", { minimumFractionDigits: 2 });
  }

  function diasRestantes() {
    if (!enviado_at || !vigencia_dias) return null;
    const enviado = new Date(enviado_at);
    const vence = new Date(enviado.getTime() + vigencia_dias * 24 * 60 * 60 * 1000);
    const diff = Math.ceil((vence - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  const dias = diasRestantes();
  const vencido = dias !== null && dias < 0;
  const urgente = dias !== null && dias >= 0 && dias <= 3;

  return (
    <Link
      href={`/ventas-crm/oportunidades/${oportunidad}`}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
          {oportunidad_titulo || `Oportunidad #${oportunidad}`}
        </p>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          {cliente_razon_social} · v{version}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-slate-700">{formatMonto(total, moneda)}</span>
        {dias !== null && (
          <span className={cn(
            "text-[11px] font-semibold px-2 py-0.5 rounded-full",
            vencido ? "bg-red-50 text-red-600" :
              urgente ? "bg-amber-50 text-amber-600" :
                "bg-slate-100 text-slate-500"
          )}>
            {vencido ? `Venció hace ${Math.abs(dias)}d` : `${dias}d`}
          </span>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
      </div>
    </Link>
  );
}
