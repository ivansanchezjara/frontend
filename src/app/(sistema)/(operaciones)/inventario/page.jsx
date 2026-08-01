"use client";
import { useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getColaEntrega } from "@/services/apis/caja";
import { getProductosStats } from "@/services/apis/catalogo";
import { cn } from "@/lib/utils";
import {
  Package,
  PackageCheck,
  ChevronRight,
  AlertTriangle,
  Boxes,
  ArrowRightLeft,
  CheckCircle,
} from "lucide-react";

// ─── Stat Card ──────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, href, alert }) {
  const Wrapper = href ? Link : "div";
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border bg-white transition-all",
        href && "hover:shadow-md hover:border-blue-300 cursor-pointer",
        !href && "cursor-default",
        alert ? "border-amber-200 bg-amber-50/50" : "border-slate-200"
      )}
    >
      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg shrink-0", color)}>
        <Icon className="h-4 w-4 text-white" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium truncate">{label}</p>
        <p className="text-lg font-black text-slate-800">{value ?? "—"}</p>
      </div>
      {href && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
    </Wrapper>
  );
}

// ─── Quick Link ─────────────────────────────────────────────────

function QuickLink({ href, icon: Icon, label, description, badge, badgeColor }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-5 py-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors shrink-0">
        <Icon className="h-5 w-5 text-blue-600" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
            {label}
          </p>
          {badge && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              badgeColor || "bg-amber-100 text-amber-700"
            )}>
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{description}</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
    </Link>
  );
}

// ─── Página Principal ───────────────────────────────────────────

export default function InventarioPage() {
  const { data: entregaData, execute: fetchEntregas } = useApi(getColaEntrega, {
    auto: false,
    initialData: { count: 0 },
  });

  const { data: stats, execute: fetchStats } = useApi(getProductosStats, {
    auto: false,
    initialData: null,
  });

  useEffect(() => {
    fetchEntregas({ page_size: 1 });
    fetchStats();
  }, [fetchEntregas, fetchStats]);

  const entregasPendientes = entregaData?.count ?? 0;
  const totalPiezas = stats?.total_piezas ?? null;
  const alertasVencimiento = stats?.alertas_vencimiento ?? 0;
  const skusAgotados = stats?.skus_agotados ?? 0;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Inventario"
        subtitle="Panel de gestión de stock y despacho"
        subtitleClassName="text-blue-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* ─── INDICADORES ─────────────────────────────────── */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Estado actual
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={Boxes}
                label="Piezas en Stock"
                value={totalPiezas?.toLocaleString("es-PY")}
                color="bg-blue-500"
                href="/inventario/stock"
              />
              <StatCard
                icon={AlertTriangle}
                label="Por Vencer (90d)"
                value={alertasVencimiento}
                color={alertasVencimiento > 0 ? "bg-amber-500" : "bg-slate-400"}
                href="/inventario/stock"
                alert={alertasVencimiento > 0}
              />
              <StatCard
                icon={Package}
                label="SKUs Agotados"
                value={skusAgotados}
                color={skusAgotados > 0 ? "bg-red-500" : "bg-slate-400"}
                href="/inventario/stock"
                alert={skusAgotados > 0}
              />
              <StatCard
                icon={entregasPendientes > 0 ? PackageCheck : CheckCircle}
                label="Entregas Pendientes"
                value={entregasPendientes > 0 ? entregasPendientes : "Al día"}
                color={entregasPendientes > 0 ? "bg-amber-500" : "bg-emerald-500"}
                href="/inventario/entregas"
                alert={entregasPendientes > 0}
              />
            </div>
          </div>

          {/* ─── ACCESOS ─────────────────────────────────────── */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
              Consulta y operación
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickLink
                href="/inventario/stock"
                icon={Boxes}
                label="Stock y Disponibilidad"
                description="Existencias por producto, lotes y vencimientos"
              />
              <QuickLink
                href="/inventario/entregas"
                icon={PackageCheck}
                label="Entregas de Mercadería"
                description="Pedidos cobrados pendientes de despacho"
                badge={entregasPendientes > 0 ? `${entregasPendientes}` : null}
              />
              <QuickLink
                href="/movimientos"
                icon={ArrowRightLeft}
                label="Movimientos"
                description="Ingresos, transferencias, ajustes y consignaciones"
              />
            </div>
          </div>

          {/* ─── PRÓXIMAMENTE ─────────────────────────────────── */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Próximamente
            </h3>
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 space-y-2">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                <span><strong className="text-slate-600">Auditorías de Stock</strong> — Conteo físico vs sistema, ajustes por diferencia</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                <span><strong className="text-slate-600">Alertas de Vencimiento</strong> — Notificaciones automáticas de lotes por vencer</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                <span><strong className="text-slate-600">Stock Mínimo</strong> — Alertas de productos por debajo del umbral de reposición</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                <span><strong className="text-slate-600">Historial por Depósito</strong> — Consulta de movimientos por ubicación</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
