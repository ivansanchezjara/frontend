"use client";
import { useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getDashboardCobranzas } from "@/services/apis/cobranzas";
import { cn } from "@/lib/utils";
import {
  DollarSign, AlertTriangle, Clock, CreditCard,
  ChevronRight, FileCheck, Landmark, Users, ShieldAlert,
} from "lucide-react";

function formatUSD(valor) {
  if (valor == null) return "—";
  return `US$ ${Number(valor).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
}

function StatCard({ icon: Icon, label, value, color, href, alert }) {
  const Wrapper = href ? Link : "div";
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border bg-white transition-all",
        href && "hover:shadow-md hover:border-purple-300 cursor-pointer",
        alert ? "border-red-200 bg-red-50/50" : "border-slate-200"
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

function QuickLink({ href, icon: Icon, label, description, badge, badgeColor }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-5 py-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-md transition-all"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors shrink-0">
        <Icon className="h-5 w-5 text-purple-600" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors">{label}</p>
          {badge && (
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", badgeColor || "bg-amber-100 text-amber-700")}>
              {badge}
            </span>
          )}
        </div>
        {description && <p className="text-xs text-slate-400 mt-0.5 truncate">{description}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors shrink-0" />
    </Link>
  );
}

export default function CobranzasPage() {
  const { data: dashboard, execute: fetchDashboard } = useApi(getDashboardCobranzas, {
    auto: false, initialData: null,
  });

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const d = dashboard;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Ingresos"
        subtitle="Gestión de cuentas por cobrar, cheques y verificaciones"
        subtitleClassName="text-purple-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Indicadores */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Estado actual
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={DollarSign}
                label="Total por Cobrar"
                value={d ? formatUSD(d.total_por_cobrar_usd) : null}
                color="bg-blue-500"
                href="/ingresos/cuentas"
              />
              <StatCard
                icon={AlertTriangle}
                label="Vencido"
                value={d ? formatUSD(d.total_vencido_usd) : null}
                color={d?.total_vencido_usd > 0 ? "bg-red-500" : "bg-slate-400"}
                href="/ingresos/cuentas?vencida=true"
                alert={d?.total_vencido_usd > 0}
              />
              <StatCard
                icon={ShieldAlert}
                label="Clientes en Mora"
                value={d?.cuentas_en_mora ?? null}
                color={d?.cuentas_en_mora > 0 ? "bg-red-500" : "bg-slate-400"}
                alert={d?.cuentas_en_mora > 0}
              />
              <StatCard
                icon={CreditCard}
                label="Cobrado este Mes"
                value={d ? formatUSD(d.cobrado_este_mes_usd) : null}
                color="bg-emerald-500"
              />
            </div>
          </div>

          {/* Alertas */}
          {d && (d.cuotas_vencen_esta_semana > 0 || d.cheques_por_cobrar > 0 || d.pagos_pendientes_verificacion > 0) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-700 mb-3 flex items-center gap-1.5">
                <Clock size={12} /> Requiere atención
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {d.cuotas_vencen_esta_semana > 0 && (
                  <div className="bg-white rounded-lg border border-amber-100 px-3 py-2">
                    <p className="text-[10px] text-amber-500 font-medium">Cuotas vencen esta semana</p>
                    <p className="text-xl font-black text-amber-700">{d.cuotas_vencen_esta_semana}</p>
                  </div>
                )}
                {d.cheques_por_cobrar > 0 && (
                  <div className="bg-white rounded-lg border border-amber-100 px-3 py-2">
                    <p className="text-[10px] text-amber-500 font-medium">Cheques por cobrar</p>
                    <p className="text-xl font-black text-amber-700">{d.cheques_por_cobrar}</p>
                  </div>
                )}
                {d.pagos_pendientes_verificacion > 0 && (
                  <div className="bg-white rounded-lg border border-amber-100 px-3 py-2">
                    <p className="text-[10px] text-amber-500 font-medium">Pagos sin verificar</p>
                    <p className="text-xl font-black text-amber-700">{d.pagos_pendientes_verificacion}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Accesos */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
              Gestión
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickLink
                href="/ingresos/cuentas"
                icon={DollarSign}
                label="Cuentas por Cobrar"
                description="Deuda de clientes, cuotas y estados de pago"
              />
              <QuickLink
                href="/ingresos/cheques"
                icon={Landmark}
                label="Cartera de Cheques"
                description="Cheques en cartera, calendario de cobro"
                badge={d?.cheques_por_cobrar > 0 ? `${d.cheques_por_cobrar}` : null}
              />
              <QuickLink
                href="/ingresos/verificaciones"
                icon={FileCheck}
                label="Verificaciones Bancarias"
                description="Confirmar pagos por transferencia/tarjeta"
                badge={d?.pagos_pendientes_verificacion > 0 ? `${d.pagos_pendientes_verificacion}` : null}
                badgeColor="bg-blue-100 text-blue-700"
              />
              <QuickLink
                href="/ingresos/lineas-credito"
                icon={Users}
                label="Líneas de Crédito"
                description="Aprobación y control de crédito por cliente"
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
