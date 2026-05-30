"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Users,
  Wallet,
  UserPlus,
  Package,
  ArrowRightLeft,
  DollarSign,
  Clock,
  FileText,
  TrendingUp,
  ChevronRight,
  Phone,
  MapPin,
  Mail,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { LoadingScreen, PageHeader, Badge, Text } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getVentas,
  getProspectos,
  getSaldoCajaChica,
  getAlmacenVirtual,
  getInteracciones,
} from "@/services/apis/ventas";
import { cn } from "@/lib/utils";

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

function diasDesde(fechaStr) {
  if (!fechaStr) return null;
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  const diff = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatFechaCorta(fechaStr) {
  if (!fechaStr) return "—";
  return new Date(fechaStr).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
  });
}

// ─── Pipeline Stage ─────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: "nuevo", label: "Nuevos", color: "bg-blue-500", lightBg: "bg-blue-50", textColor: "text-blue-700" },
  { key: "contactado", label: "Contactados", color: "bg-amber-500", lightBg: "bg-amber-50", textColor: "text-amber-700" },
  { key: "calificado", label: "Calificados", color: "bg-emerald-500", lightBg: "bg-emerald-50", textColor: "text-emerald-700" },
];

function PipelineBar({ stages }) {
  const total = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-3">
      {/* Barra visual */}
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
        {stages.map((stage) => {
          const pct = total > 0 ? (stage.count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={stage.key}
              className={cn("transition-all duration-500", stage.color)}
              style={{ width: `${pct}%` }}
              title={`${stage.label}: ${stage.count}`}
            />
          );
        })}
      </div>

      {/* Etiquetas */}
      <div className="flex items-center gap-4">
        {stages.map((stage) => (
          <Link
            key={stage.key}
            href={`/ventas-crm/prospectos?estado=${stage.key}`}
            className="group flex items-center gap-2"
          >
            <span className={cn("w-2.5 h-2.5 rounded-full", stage.color)} />
            <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
              {stage.label}
            </span>
            <span className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded-md",
              stage.lightBg, stage.textColor
            )}>
              {stage.count}
            </span>
          </Link>
        ))}
        <span className="ml-auto text-[11px] text-slate-400 font-medium">
          {total} activos
        </span>
      </div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────

function StatCard({ icon: Icon, iconBg, iconColor, label, value, subtext, href }) {
  const Wrapper = href ? Link : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        href && "hover:border-emerald-200 hover:shadow-md transition-all group cursor-pointer"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-black text-slate-800">{value}</span>
            {subtext && (
              <span className="text-xs text-slate-500 truncate">{subtext}</span>
            )}
          </div>
        </div>
        {href && (
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
        )}
      </div>
    </Wrapper>
  );
}

// ─── Activity Item ──────────────────────────────────────────────

const TIPO_ICON = {
  llamada: Phone,
  visita: MapPin,
  correo: Mail,
  whatsapp: MessageCircle,
};

const TIPO_COLOR = {
  llamada: "text-blue-500 bg-blue-50",
  visita: "text-emerald-500 bg-emerald-50",
  correo: "text-purple-500 bg-purple-50",
  whatsapp: "text-green-500 bg-green-50",
};

function ActivityItem({ interaccion }) {
  const Icon = TIPO_ICON[interaccion.tipo] || Clock;
  const colorClass = TIPO_COLOR[interaccion.tipo] || "text-slate-500 bg-slate-50";
  const dias = diasDesde(interaccion.proxima_accion_fecha);
  const vencida = dias !== null && dias > 0;

  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0", colorClass)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 font-medium truncate">
          {interaccion.prospecto_nombre || interaccion.cliente_nombre || "—"}
        </p>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          {interaccion.proxima_accion_descripcion || interaccion.resumen}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className={cn(
          "text-[11px] font-bold px-2 py-0.5 rounded-md",
          vencida ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
        )}>
          {vencida ? `Hace ${dias}d` : formatFechaCorta(interaccion.proxima_accion_fecha)}
        </span>
      </div>
    </div>
  );
}

// ─── Venta Row (compacta) ───────────────────────────────────────

function VentaRow({ venta }) {
  return (
    <Link
      href={`/ventas-crm/ventas/${venta.id}`}
      className="flex items-center gap-3 py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {venta.cliente_nombre || "Venta mostrador"}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {venta.comprobante?.numero ? `#${venta.comprobante.numero}` : `V-${venta.id}`}
          {" · "}
          {formatFechaCorta(venta.created_at)}
        </p>
      </div>
      <span className="text-sm font-bold text-slate-800 shrink-0">
        ${formatearMonto(venta.total_usd)}
      </span>
    </Link>
  );
}

// ─── Borrador Pendiente ─────────────────────────────────────────

function BorradorItem({ venta }) {
  const dias = diasDesde(venta.created_at);

  return (
    <Link
      href={`/ventas-crm/ventas/${venta.id}`}
      className="flex items-center gap-3 py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 shrink-0">
        <FileText className="h-4 w-4 text-amber-500" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {venta.cliente_nombre || "Venta mostrador"}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          ${formatearMonto(venta.total_usd)} · Hace {dias || 0}d
        </p>
      </div>
      <Badge variant="warning" className="text-[10px] shrink-0">Borrador</Badge>
    </Link>
  );
}

// ─── Quick Link ─────────────────────────────────────────────────

function QuickLink({ href, icon: Icon, label }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm transition-all group"
    >
      <Icon className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
      <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">
        {label}
      </span>
    </Link>
  );
}

// ─── Section Header ─────────────────────────────────────────────

function SectionHeader({ title, href, linkText }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
        {title}
      </h3>
      {href && (
        <Link href={href} className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
          {linkText || "Ver todo →"}
        </Link>
      )}
    </div>
  );
}

// ─── Página Principal ───────────────────────────────────────────

export default function VentasCrmPage() {
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [tieneAlmacenVirtual, setTieneAlmacenVirtual] = useState(false);

  // Fetch ventas del día (confirmadas)
  const { data: ventasHoyData, execute: fetchVentasHoy } = useApi(getVentas);

  // Fetch ventas recientes (últimas 5 confirmadas)
  const { data: ventasRecientesData, execute: fetchVentasRecientes } = useApi(getVentas);

  // Fetch borradores pendientes
  const { data: borradoresData, execute: fetchBorradores } = useApi(getVentas);

  // Fetch prospectos por estado (pipeline)
  const { data: prospectosNuevos, execute: fetchProspectosNuevos } = useApi(getProspectos);
  const { data: prospectosContactados, execute: fetchProspectosContactados } = useApi(getProspectos);
  const { data: prospectosCalificados, execute: fetchProspectosCalificados } = useApi(getProspectos);

  // Fetch interacciones con próxima acción pendiente
  const { data: actividadesData, execute: fetchActividades } = useApi(getInteracciones);

  // Fetch saldo caja chica
  const { data: saldoData, loading: saldoLoading, execute: fetchSaldo } = useApi(getSaldoCajaChica);

  // Fetch almacén virtual
  const { execute: fetchAlmacen } = useApi(getAlmacenVirtual);

  useEffect(() => {
    const hoy = getFechaHoy();

    // Ventas confirmadas del día
    fetchVentasHoy({ estado: "confirmado", fecha_desde: hoy, fecha_hasta: hoy });

    // Últimas 5 ventas confirmadas
    fetchVentasRecientes({ estado: "confirmado", page_size: 5 });

    // Borradores pendientes
    fetchBorradores({ estado: "borrador", page_size: 5 });

    // Pipeline de prospectos
    fetchProspectosNuevos({ estado: "nuevo" });
    fetchProspectosContactados({ estado: "contactado" });
    fetchProspectosCalificados({ estado: "calificado" });

    // Actividades pendientes (interacciones con próxima acción)
    fetchActividades({ ordering: "proxima_accion_fecha", page_size: 6 });

    // Almacén virtual y caja chica
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

  // Calcular datos
  const ventasDelDia = ventasHoyData?.results || [];
  const cantidadVentas = ventasHoyData?.count || ventasDelDia.length;
  const montoTotalUsd = ventasDelDia.reduce(
    (acc, v) => acc + Number(v.total_usd || 0),
    0
  );

  const ventasRecientes = (ventasRecientesData?.results || []).slice(0, 5);
  const borradores = (borradoresData?.results || []).slice(0, 5);
  const cantidadBorradores = borradoresData?.count || 0;

  const pipelineStages = PIPELINE_STAGES.map((stage) => {
    let count = 0;
    if (stage.key === "nuevo") count = prospectosNuevos?.count || 0;
    if (stage.key === "contactado") count = prospectosContactados?.count || 0;
    if (stage.key === "calificado") count = prospectosCalificados?.count || 0;
    return { ...stage, count };
  });

  // Filtrar actividades que tienen próxima acción
  const actividades = (actividadesData?.results || [])
    .filter((i) => i.proxima_accion_fecha)
    .slice(0, 5);

  if (!hasLoadedOnce) {
    return <LoadingScreen texto="Cargando panel de ventas..." />;
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      {/* HEADER */}
      <PageHeader
        title="Ventas y CRM"
        subtitle="Panel operativo"
        subtitleClassName="text-emerald-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ─── STATS ROW ───────────────────────────────────── */}
          <div className={cn(
            "grid gap-4",
            tieneAlmacenVirtual
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
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
              icon={Users}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              label="Prospectos activos"
              value={pipelineStages.reduce((s, st) => s + st.count, 0)}
              subtext="en pipeline"
              href="/ventas-crm/prospectos"
            />
            <StatCard
              icon={FileText}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              label="Borradores"
              value={cantidadBorradores}
              subtext="pendientes"
              href="/ventas-crm/ventas?estado=borrador"
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

          {/* ─── PIPELINE DE PROSPECTOS ───────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title="Pipeline de prospectos"
              href="/ventas-crm/prospectos"
            />
            <PipelineBar stages={pipelineStages} />
          </div>

          {/* ─── GRID: ACTIVIDADES + VENTAS RECIENTES ────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Actividades pendientes */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                title="Próximas acciones"
                href="/ventas-crm/prospectos"
                linkText="Ver prospectos →"
              />
              {actividades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 mb-3">
                    <Clock className="h-6 w-6 text-slate-400" />
                  </span>
                  <p className="text-sm text-slate-400">
                    No hay acciones pendientes
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Las próximas acciones de tus interacciones aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {actividades.map((interaccion) => (
                    <ActivityItem key={interaccion.id} interaccion={interaccion} />
                  ))}
                </div>
              )}
            </div>

            {/* Ventas recientes */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                title="Ventas recientes"
                href="/ventas-crm/ventas?estado=confirmado"
              />
              {ventasRecientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 mb-3">
                    <TrendingUp className="h-6 w-6 text-slate-400" />
                  </span>
                  <p className="text-sm text-slate-400">
                    Sin ventas confirmadas aún
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {ventasRecientes.map((venta) => (
                    <VentaRow key={venta.id} venta={venta} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── BORRADORES PENDIENTES (si hay) ──────────────── */}
          {borradores.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5 shadow-sm">
              <SectionHeader
                title={`Borradores pendientes (${cantidadBorradores})`}
                href="/ventas-crm/ventas?estado=borrador"
                linkText="Ver todos →"
              />
              <div className="divide-y divide-amber-100">
                {borradores.map((venta) => (
                  <BorradorItem key={venta.id} venta={venta} />
                ))}
              </div>
            </div>
          )}

          {/* ─── ACCESOS RÁPIDOS ─────────────────────────────── */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Accesos rápidos
            </h3>
            <div className="flex flex-wrap gap-2">
              <QuickLink href="/ventas-crm/ventas/nueva" icon={ShoppingCart} label="Nueva venta" />
              <QuickLink href="/ventas-crm/prospectos" icon={UserPlus} label="Prospectos" />
              <QuickLink href="/ventas-crm/clientes" icon={Users} label="Clientes" />
              <QuickLink href="/ventas-crm/almacen-virtual" icon={Package} label="Almacén virtual" />
              <QuickLink href="/ventas-crm/caja-chica" icon={Wallet} label="Caja chica" />
              <QuickLink href="/ventas-crm/conciliaciones" icon={ArrowRightLeft} label="Conciliaciones" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
