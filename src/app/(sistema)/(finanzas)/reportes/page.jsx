"use client";
import { useState, useEffect } from "react";
import {
  PageHeader,
  Badge,
  LoadingScreen,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getReportePYL, getKPIsVentas } from "@/services/apis/reportes";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Users, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatUSD(valor) {
  if (valor == null) return "—";
  return `US$ ${Number(valor).toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPct(valor) {
  if (valor == null) return "—";
  return `${Number(valor).toFixed(1)}%`;
}

// ─── KPI Card ───────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, subtitle, trend, color }) {
  const isPositive = trend > 0;
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
      <div className="flex items-center gap-3 mb-2">
        <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", color)}>
          <Icon className="h-4 w-4 text-white" />
        </span>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
      </div>
      <p className="text-xl font-black text-slate-800">{value}</p>
      {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      {trend !== undefined && trend !== 0 && (
        <div className={cn("flex items-center gap-1 mt-1 text-[11px] font-bold", isPositive ? "text-emerald-600" : "text-red-600")}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {formatPct(Math.abs(trend))} vs mes anterior
        </div>
      )}
    </div>
  );
}

// ─── P&L Table ──────────────────────────────────────────────────

function PYLTable({ data }) {
  if (!data) return null;

  const rows = [
    { label: "Ingresos por Ventas", ...data.ingresos, bold: true },
    { label: "(-) Costo de Mercadería", ...data.costo_mercaderia, negative: true },
    { label: "= Margen Bruto", ...data.margen_bruto, bold: true, highlight: true },
    { label: "(-) Gastos Operativos", ...data.gastos_operativos, negative: true },
    { label: "    └ Premios/Comisiones", facturado: 0, informal: data.premios, total: data.premios, sub: true },
    { label: "= Resultado Neto", ...data.resultado_neto, bold: true, highlight: true, final: true },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">Estado de Resultados — {data.periodo}</h3>
        <p className="text-xs text-slate-400 mt-0.5">Separación fiscal (facturado) vs informal (sin factura)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Concepto</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-emerald-700 uppercase tracking-wide">Facturado</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-amber-700 uppercase tracking-wide">Informal</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-800 uppercase tracking-wide">Total Real</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-slate-50",
                  row.final && "bg-slate-50 border-t-2 border-t-slate-200",
                  row.highlight && !row.final && "bg-blue-50/30",
                )}
              >
                <td className={cn("px-6 py-3", row.bold && "font-bold", row.sub && "text-slate-400 text-xs")}>
                  {row.label}
                </td>
                <td className={cn("px-4 py-3 text-right font-mono text-xs", row.bold && "font-bold", row.negative && "text-red-600")}>
                  {formatUSD(row.facturado)}
                </td>
                <td className={cn("px-4 py-3 text-right font-mono text-xs", row.bold && "font-bold", row.negative && "text-red-600")}>
                  {formatUSD(row.informal)}
                </td>
                <td className={cn("px-6 py-3 text-right font-mono", row.bold && "font-bold text-sm", row.final && "text-lg font-black",
                  row.final && Number(row.total) >= 0 ? "text-emerald-700" : row.final ? "text-red-700" : ""
                )}>
                  {formatUSD(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Ratios */}
      <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
        <span>Margen bruto: <strong className="text-slate-700">{formatPct(data.margen_bruto_pct)}</strong></span>
        <span>Resultado neto: <strong className={cn(data.resultado_neto_pct >= 0 ? "text-emerald-700" : "text-red-700")}>{formatPct(data.resultado_neto_pct)}</strong></span>
      </div>
    </div>
  );
}

// ─── Gráfico Ventas por Día ─────────────────────────────────────

function GraficoVentasDiarias({ data }) {
  if (!data?.length) return null;

  const chartData = data.map((d) => ({
    fecha: new Date(d.fecha).toLocaleDateString("es-PY", { day: "2-digit", month: "short" }),
    total: d.total,
    pedidos: d.pedidos,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
        <BarChart3 size={12} /> Ventas diarias del mes
      </h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
              formatter={(value) => [`US$ ${Number(value).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`, "Ventas"]}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#7c3aed"
              strokeWidth={2}
              fill="url(#colorVentas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Vendedores Ranking ─────────────────────────────────────────

function VendedoresRanking({ vendedores }) {
  if (!vendedores?.length) return null;

  const maxVenta = vendedores[0]?.total_usd || 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
        <Users size={12} /> Top Vendedores
      </h3>
      <div className="space-y-3">
        {vendedores.map((v, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className={cn(
              "text-xs font-black w-6 text-center",
              i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : "text-slate-300"
            )}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700 truncate">{v.nombre}</span>
                <span className="text-xs font-bold text-slate-800 shrink-0">{formatUSD(v.total_usd)}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${(v.total_usd / maxVenta) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0">{v.pedidos} pedidos</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Ventas por Origen ──────────────────────────────────────────

function VentasPorOrigen({ porOrigen }) {
  if (!porOrigen || Object.keys(porOrigen).length === 0) return null;

  const ORIGEN_LABELS = {
    sucursal: { label: "Sucursal", color: "bg-purple-500" },
    campo: { label: "Campo", color: "bg-blue-500" },
    ecommerce: { label: "E-commerce", color: "bg-emerald-500" },
  };

  const total = Object.values(porOrigen).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
        <PieChart size={12} /> Ventas por Canal
      </h3>
      <div className="space-y-3">
        {Object.entries(porOrigen).map(([key, valor]) => {
          const conf = ORIGEN_LABELS[key] || { label: key, color: "bg-slate-400" };
          const pct = total > 0 ? (valor / total) * 100 : 0;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className={cn("w-3 h-3 rounded-full shrink-0", conf.color)} />
              <span className="text-xs text-slate-600 flex-1">{conf.label}</span>
              <span className="text-xs font-bold text-slate-800">{formatUSD(valor)}</span>
              <span className="text-[10px] text-slate-400 w-10 text-right">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Página Principal ───────────────────────────────────────────

export default function ReportesGerencialesPage() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());

  const { data: pyl, loading: loadingPYL, execute: fetchPYL } = useApi(getReportePYL, {
    auto: false, initialData: null,
  });
  const { data: kpis, loading: loadingKPIs, execute: fetchKPIs } = useApi(getKPIsVentas, {
    auto: false, initialData: null,
  });

  useEffect(() => {
    fetchPYL({ mes, anio });
    fetchKPIs({ mes, anio });
  }, [mes, anio, fetchPYL, fetchKPIs]);

  const loading = loadingPYL || loadingKPIs;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Reportes"
        subtitle="Resultados financieros y métricas de negocio"
        subtitleClassName="text-purple-600"
      >
        <div className="flex items-center gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium"
          >
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input
            type="number"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium"
          />
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-8">

          {loading ? (
            <LoadingScreen message="Generando reportes..." />
          ) : (
            <>
              {/* ─── KPIs ────────────────────────────────────── */}
              {kpis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    icon={DollarSign}
                    label="Ventas del Mes"
                    value={formatUSD(kpis.total_ventas_usd)}
                    trend={kpis.variacion_mes_anterior_pct}
                    color="bg-purple-500"
                  />
                  <KPICard
                    icon={ShoppingCart}
                    label="Pedidos Cobrados"
                    value={kpis.total_pedidos}
                    color="bg-blue-500"
                  />
                  <KPICard
                    icon={BarChart3}
                    label="Ticket Promedio"
                    value={formatUSD(kpis.ticket_promedio_usd)}
                    color="bg-emerald-500"
                  />
                  <KPICard
                    icon={pyl && pyl.resultado_neto?.total >= 0 ? TrendingUp : TrendingDown}
                    label="Resultado Neto"
                    value={pyl ? formatUSD(pyl.resultado_neto?.total) : "—"}
                    subtitle={pyl ? `Margen: ${formatPct(pyl.resultado_neto_pct)}` : undefined}
                    color={pyl && pyl.resultado_neto?.total >= 0 ? "bg-emerald-500" : "bg-red-500"}
                  />
                </div>
              )}

              {/* ─── P&L ─────────────────────────────────────── */}
              <PYLTable data={pyl} />

              {/* ─── Gráfico ventas diarias ──────────────────── */}
              {kpis?.ventas_por_dia && (
                <GraficoVentasDiarias data={kpis.ventas_por_dia} />
              )}

              {/* ─── Detalles ────────────────────────────────── */}
              {kpis && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <VendedoresRanking vendedores={kpis.top_vendedores} />
                  <VentasPorOrigen porOrigen={kpis.por_origen} />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
