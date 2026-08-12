"use client";
import { useState, useEffect } from "react";
import {
  DollarSign,
  Plus,
  Check,
  CreditCard,
  FileText,
  TrendingUp,
  AlertCircle,
  Download,
} from "lucide-react";
import { EmptyState, LoadingScreen, Pagination } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getLiquidaciones,
  createLiquidacion,
  aprobarLiquidacion,
  marcarPagadaLiquidacion,
  getFuncionarios,
  descargarReciboSueldo,
} from "@/services/apis/rrhh";
import { useErrorHandler } from "@/hooks/useErrorHandler";

const PAGE_SIZE = 20;

const ESTADO_COLORS = {
  borrador: "bg-slate-100 text-slate-700",
  aprobada: "bg-emerald-100 text-emerald-700",
  pagada: "bg-blue-100 text-blue-700",
  anulada: "bg-red-100 text-red-700",
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function TabLiquidaciones() {
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPeriodoMes, setFiltroPeriodoMes] = useState("");
  const [filtroPeriodoAnio, setFiltroPeriodoAnio] = useState(() => new Date().getFullYear().toString());
  const [showGenerar, setShowGenerar] = useState(false);
  const { handleError } = useErrorHandler();

  const {
    data: liquidacionesData,
    loading,
    execute: fetchLiquidaciones,
  } = useApi(getLiquidaciones, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  const liquidaciones = liquidacionesData?.results || [];
  const count = liquidacionesData?.count || 0;

  useEffect(() => {
    fetchLiquidaciones({
      page,
      estado: filtroEstado || undefined,
      periodo_mes: filtroPeriodoMes || undefined,
      periodo_anio: filtroPeriodoAnio || undefined,
    });
  }, [page, filtroEstado, filtroPeriodoMes, filtroPeriodoAnio]);

  const refresh = () => fetchLiquidaciones({
    page,
    estado: filtroEstado || undefined,
    periodo_mes: filtroPeriodoMes || undefined,
    periodo_anio: filtroPeriodoAnio || undefined,
  });

  const handleAprobar = async (id) => {
    try {
      await aprobarLiquidacion(id);
      refresh();
    } catch (err) {
      handleError(err);
    }
  };

  const handleMarcarPagada = async (id) => {
    try {
      await marcarPagadaLiquidacion(id);
      refresh();
    } catch (err) {
      handleError(err);
    }
  };

  // Totales
  const totalNeto = liquidaciones.reduce((sum, l) => sum + parseFloat(l.neto_usd || 0), 0);
  const totalBruto = liquidaciones.reduce((sum, l) => sum + parseFloat(l.total_ingresos_usd || 0), 0);
  const borradores = liquidaciones.filter((l) => l.estado === "borrador").length;
  const pagadas = liquidaciones.filter((l) => l.estado === "pagada").length;

  return (
    <div className="p-4 md:p-8 min-w-0">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Pagos de Salario</h2>
            <p className="text-xs text-slate-500">Cálculo, aprobación y pago de salarios mensuales</p>
          </div>
          <button
            onClick={() => setShowGenerar(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Generar Pago
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Bruto</p>
              <p className="text-sm font-bold text-slate-800">USD {totalBruto.toLocaleString("es-PY", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Neto</p>
              <p className="text-sm font-bold text-slate-800">USD {totalNeto.toLocaleString("es-PY", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText size={16} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Borradores</p>
              <p className="text-lg font-bold text-slate-800">{borradores}</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Pagadas</p>
              <p className="text-lg font-bold text-slate-800">{pagadas}</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-600"
          >
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="aprobada">Aprobada</option>
            <option value="pagada">Pagada</option>
            <option value="anulada">Anulada</option>
          </select>
          <select
            value={filtroPeriodoMes}
            onChange={(e) => { setFiltroPeriodoMes(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-600"
          >
            <option value="">Todos los meses</option>
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            value={filtroPeriodoAnio}
            onChange={(e) => { setFiltroPeriodoAnio(e.target.value); setPage(1); }}
            placeholder="Año"
            min={2020}
            max={2030}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-600 w-24"
          />
        </div>

        {/* Tabla de pagos de salario */}
        {loading ? (
          <LoadingScreen message="Cargando pagos..." />
        ) : liquidaciones.length === 0 ? (
          <EmptyState
            icon="💰"
            title="Sin pagos de salario"
            description="No hay pagos para los filtros seleccionados."
          />
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Funcionario</th>
                      <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Período</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Salario Base</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Bonificaciones</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Deducciones</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">IPS (9%)</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Neto</th>
                      <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Estado</th>
                      <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liquidaciones.map((l) => (
                      <tr key={l.id} className="border-b border-slate-50 hover:bg-amber-50/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {l.funcionario_nombre}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 text-xs">
                          {MESES[l.periodo_mes - 1]} {l.periodo_anio}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 font-mono text-xs">
                          {formatUSD(l.salario_base_usd)}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-mono text-xs">
                          +{formatUSD(l.bonificaciones_usd)}
                        </td>
                        <td className="px-4 py-3 text-right text-red-500 font-mono text-xs">
                          -{formatUSD(l.descuentos_usd)}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-500 font-mono text-xs">
                          -{formatUSD(l.aporte_ips_usd)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800 font-mono text-xs">
                          {formatUSD(l.neto_usd)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ESTADO_COLORS[l.estado] || "bg-slate-100"}`}>
                            {l.estado_display || l.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {l.estado === "borrador" && (
                              <button
                                onClick={() => handleAprobar(l.id)}
                                className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                                title="Aprobar"
                              >
                                <Check size={12} className="inline mr-0.5" /> Aprobar
                              </button>
                            )}
                            {l.estado === "aprobada" && (
                              <button
                                onClick={() => handleMarcarPagada(l.id)}
                                className="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors"
                                title="Marcar como pagada"
                              >
                                <CreditCard size={12} className="inline mr-0.5" /> Pagar
                              </button>
                            )}
                            <button
                              onClick={() => descargarReciboSueldo(l.id)}
                              className="px-2.5 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors"
                              title="Descargar recibo PDF"
                            >
                              <Download size={12} className="inline mr-0.5" /> PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination
              count={count}
              pageSize={PAGE_SIZE}
              currentPage={page}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Modal generar pago de salario */}
      {showGenerar && (
        <GenerarLiquidacionModal
          onClose={() => setShowGenerar(false)}
          onSuccess={() => { setShowGenerar(false); refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Modal para generar pago de salario ─────────────────────────

function GenerarLiquidacionModal({ onClose, onSuccess }) {
  const [funcionarioId, setFuncionarioId] = useState("");
  const [periodoMes, setPeriodoMes] = useState(() => (new Date().getMonth() + 1).toString());
  const [periodoAnio, setPeriodoAnio] = useState(() => new Date().getFullYear().toString());
  const [saving, setSaving] = useState(false);
  const { handleError } = useErrorHandler();

  const { data: funcData, execute: fetchFuncs } = useApi(getFuncionarios, {
    auto: false,
    initialData: { results: [] },
  });

  useEffect(() => {
    fetchFuncs({ estado: "activo", page_size: 200 });
  }, []);

  const funcionarios = funcData?.results || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!funcionarioId) return;
    setSaving(true);
    try {
      await createLiquidacion({
        funcionario: funcionarioId,
        periodo_mes: parseInt(periodoMes),
        periodo_anio: parseInt(periodoAnio),
      });
      onSuccess();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Generar Pago de Salario</h2>
          <p className="text-xs text-slate-500">Se calculará automáticamente basado en el contrato vigente</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Funcionario *</label>
            <select
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              <option value="">Seleccionar funcionario...</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre_completo || `${f.nombre} ${f.apellido}`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Mes *</label>
              <select
                value={periodoMes}
                onChange={(e) => setPeriodoMes(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                {MESES.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Año *</label>
              <input
                type="number"
                value={periodoAnio}
                onChange={(e) => setPeriodoAnio(e.target.value)}
                min={2020}
                max={2030}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Cálculo automático</p>
              <p className="mt-0.5 text-amber-600">
                Se tomará el salario del contrato vigente, se aplicarán descuentos por sanciones del período
                y se calculará el aporte IPS (9% obrero). El pago se genera en estado borrador.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !funcionarioId}
              className="px-6 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Generando..." : "Generar Pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function formatUSD(value) {
  if (!value) return "0,00";
  return Number(value).toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
