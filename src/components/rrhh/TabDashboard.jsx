"use client";
import { useEffect } from "react";
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  CalendarDays,
  DollarSign,
  TrendingUp,
  FileWarning,
  LogIn,
  Timer,
  CreditCard,
  FileText,
} from "lucide-react";
import { LoadingScreen } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getDashboardRRHH } from "@/services/apis/rrhh";

export default function TabDashboard() {
  const { data, loading, execute } = useApi(getDashboardRRHH, {
    auto: false,
    initialData: null,
  });

  useEffect(() => {
    execute();
  }, []);

  if (loading || !data) {
    return <LoadingScreen message="Cargando dashboard..." />;
  }

  return (
    <div className="p-4 md:p-8 min-w-0">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-slate-800">Panel de Control</h2>
          <p className="text-xs text-slate-500">Resumen en tiempo real del módulo de Recursos Humanos</p>
        </div>

        {/* Fila 1: Personal y Asistencia de hoy */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard
            icon={Users}
            color="amber"
            label="Total Personal"
            value={data.total_funcionarios}
          />
          <StatCard
            icon={UserCheck}
            color="emerald"
            label="Activos"
            value={data.activos}
          />
          <StatCard
            icon={LogIn}
            color="blue"
            label="Presentes Hoy"
            value={data.presentes_hoy}
            subtitle={`de ${data.activos}`}
          />
          <StatCard
            icon={AlertTriangle}
            color="red"
            label="Tardanzas Hoy"
            value={data.tardanzas_hoy}
          />
          <StatCard
            icon={Timer}
            color="orange"
            label="Sin Salida"
            value={data.sin_salida_hoy}
          />
          <StatCard
            icon={CalendarDays}
            color="purple"
            label="Ausentes Hoy"
            value={data.ausencias_hoy}
          />
          <StatCard
            icon={Clock}
            color="yellow"
            label="En Licencia"
            value={data.en_licencia}
          />
        </div>

        {/* Fila 2: Alertas y Costos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Alertas pendientes */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <FileWarning size={13} className="text-amber-500" />
              Pendientes de Atención
            </h3>
            <div className="space-y-3">
              <AlertRow
                label="Ausencias por aprobar"
                value={data.ausencias_pendientes}
                color="amber"
              />
              <AlertRow
                label="Salarios en borrador"
                value={data.liquidaciones_pendientes}
                color="blue"
              />
              <AlertRow
                label="Salarios por pagar"
                value={data.liquidaciones_por_pagar}
                color="emerald"
              />
              <AlertRow
                label="Tardanzas este mes"
                value={data.tardanzas_mes}
                color="red"
              />
            </div>
          </div>

          {/* Costo salarial */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <DollarSign size={13} className="text-emerald-500" />
              Costo Salarial del Mes
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Bruto Total</p>
                <p className="text-2xl font-bold text-slate-800">
                  USD {formatNumber(data.costo_bruto_mes)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Neto a Pagar</p>
                <p className="text-xl font-bold text-emerald-700">
                  USD {formatNumber(data.costo_neto_mes)}
                </p>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <FileText size={12} className="text-slate-400" />
                  <span className="text-[10px] text-slate-500">
                    {data.liquidaciones_pendientes} pendientes
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard size={12} className="text-emerald-500" />
                  <span className="text-[10px] text-slate-500">
                    {data.liquidaciones_por_pagar} por pagar
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contratos por vencer */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <FileWarning size={13} className="text-red-500" />
              Contratos por Vencer (30 días)
            </h3>
            {data.contratos_por_vencer?.length > 0 ? (
              <div className="space-y-2.5">
                {data.contratos_por_vencer.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-red-50/50 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-800">
                        {c.funcionario__nombre} {c.funcionario__apellido}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {c.tipo_contrato}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      {c.fecha_fin}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No hay contratos próximos a vencer. ✓
              </p>
            )}
          </div>
        </div>

        {/* Fila 3: Top tardanzas */}
        {data.top_tardanzas?.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-red-500" />
              Top Tardanzas del Mes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {data.top_tardanzas.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${
                    i === 0 ? "bg-red-100 text-red-700" :
                    i === 1 ? "bg-orange-100 text-orange-700" :
                    "bg-slate-200 text-slate-600"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {t.funcionario__nombre} {t.funcionario__apellido}
                    </p>
                    <p className="text-[10px] text-red-500 font-bold">
                      {t.cantidad} tardanza{t.cantidad !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indicador de presencia del día */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Resumen del Día
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: data.activos > 0
                      ? `${Math.min(100, (data.presentes_hoy / data.activos) * 100)}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
            <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
              {data.activos > 0
                ? `${Math.round((data.presentes_hoy / data.activos) * 100)}%`
                : "0%"} presencia
            </span>
          </div>
          <div className="flex gap-6 mt-2 text-[10px] text-slate-400">
            <span>{data.presentes_hoy} presentes</span>
            <span>{data.ausencias_hoy} ausentes (aprobados)</span>
            <span>{data.activos - data.presentes_hoy - data.ausencias_hoy} sin registrar</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componentes auxiliares ─────────────────────────────────────

function StatCard({ icon: Icon, color, label, value, subtitle }) {
  const colorMap = {
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 transition-all hover:shadow-md">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color] || "bg-slate-50 text-slate-600"}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider leading-tight">{label}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-lg font-bold text-slate-800">{value}</p>
          {subtitle && <span className="text-[10px] text-slate-400">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}

function AlertRow({ label, value, color }) {
  const colorMap = {
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-600">{label}</span>
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
        value > 0 ? (colorMap[color] || "bg-slate-100 text-slate-700") : "bg-slate-100 text-slate-400"
      }`}>
        {value}
      </span>
    </div>
  );
}

function formatNumber(value) {
  if (!value || value === "0") return "0,00";
  return Number(value).toLocaleString("es-PY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
