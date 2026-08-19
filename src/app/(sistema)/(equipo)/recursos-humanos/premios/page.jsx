"use client";
import { useState, useEffect } from "react";
import {
  PageHeader,
  Badge,
  Button,
  LoadingScreen,
  EmptyState,
  useToast,
  useConfirm,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getPremios,
  calcularPremiosMes,
  aprobarPremio,
  ajustarPremio,
  aprobarTodosPremios,
  getResumenPremios,
} from "@/services/apis/rrhh";
import {
  Trophy, Calculator, CheckCircle2, ChevronDown, ChevronUp,
  Calendar, Percent, TrendingUp, Users, DollarSign, Edit3,
  CheckCheck, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatUSD(valor) {
  if (valor == null) return "—";
  return `US$ ${Number(valor).toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const ESTADO_BADGE = {
  calculado: { variant: "info", label: "Calculado" },
  aprobado: { variant: "success", label: "Aprobado" },
  pagado: { variant: "default", label: "Pagado" },
  ajustado: { variant: "warning", label: "Ajustado" },
  anulado: { variant: "danger", label: "Anulado" },
};

export default function PremiosPage() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [expandedId, setExpandedId] = useState(null);
  const [ajusteData, setAjusteData] = useState(null); // { id, monto, obs }

  const { data: premiosData, loading, execute: fetchPremios } = useApi(getPremios, {
    auto: false, initialData: { results: [], count: 0 },
  });
  const { data: resumen, execute: fetchResumen } = useApi(getResumenPremios, {
    auto: false, initialData: null,
  });
  const { execute: ejecutarCalculo, loading: calculando } = useApi(calcularPremiosMes, {
    auto: false, handleError: false,
  });
  const { execute: ejecutarAprobar } = useApi(aprobarPremio, {
    auto: false, handleError: false,
  });
  const { execute: ejecutarAprobarTodos, loading: aprobandoTodos } = useApi(aprobarTodosPremios, {
    auto: false, handleError: false,
  });
  const { execute: ejecutarAjuste } = useApi(ajustarPremio, {
    auto: false, handleError: false,
  });

  useEffect(() => {
    fetchPremios({ mes, anio });
    fetchResumen({ mes, anio });
  }, [mes, anio, fetchPremios, fetchResumen]);

  const premios = premiosData?.results || [];

  const handleCalcular = async () => {
    const ok = await confirm(
      `¿Calcular premios para ${MESES[mes - 1]} ${anio}? Esto sobreescribirá cálculos previos no aprobados.`,
      "Calcular Premios",
    );
    if (!ok) return;

    try {
      await ejecutarCalculo({ mes, anio });
      showToast("Premios calculados correctamente", "success");
      fetchPremios({ mes, anio });
      fetchResumen({ mes, anio });
    } catch (err) {
      showToast(err?.data?.detail || "Error al calcular premios", "error");
    }
  };

  const handleAprobarTodos = async () => {
    const ok = await confirm(
      `¿Aprobar todos los premios calculados de ${MESES[mes - 1]} ${anio}?`,
      "Aprobar Todos",
    );
    if (!ok) return;

    try {
      const result = await ejecutarAprobarTodos({ mes, anio });
      showToast(`${result?.aprobados || 0} premios aprobados`, "success");
      fetchPremios({ mes, anio });
      fetchResumen({ mes, anio });
    } catch (err) {
      showToast(err?.data?.detail || "Error al aprobar", "error");
    }
  };

  const handleAprobarIndividual = async (premioId) => {
    try {
      await ejecutarAprobar(premioId, {});
      showToast("Premio aprobado", "success");
      fetchPremios({ mes, anio });
      fetchResumen({ mes, anio });
    } catch (err) {
      showToast(err?.data?.detail || "Error al aprobar", "error");
    }
  };

  const handleGuardarAjuste = async () => {
    if (!ajusteData) return;
    try {
      await ejecutarAjuste(ajusteData.id, {
        ajuste: Number(ajusteData.monto),
        observaciones: ajusteData.obs,
      });
      showToast("Premio ajustado", "success");
      setAjusteData(null);
      fetchPremios({ mes, anio });
      fetchResumen({ mes, anio });
    } catch (err) {
      showToast(err?.data?.detail || "Error al ajustar", "error");
    }
  };

  const hayCalculados = premios.some(p => p.estado === "calculado" || p.estado === "ajustado");

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Recursos Humanos", href: "/recursos-humanos" },
          { label: "Premios y Comisiones" },
        ]}
        subtitle={
          <>
            <Trophy size={12} />
            Cálculo, revisión y aprobación de premios mensuales
          </>
        }
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
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* Resumen */}
          {resumen && resumen.total_premios > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Funcionarios</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{resumen.total_premios}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total premios</p>
                <p className="text-xl font-black text-slate-800 mt-1">{formatUSD(resumen.total_monto_usd)}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Aprobados</p>
                <p className="text-xl font-black text-emerald-600 mt-1">{formatUSD(resumen.total_aprobado_usd)}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pendientes</p>
                <p className="text-xl font-black text-amber-600 mt-1">
                  {resumen.por_estado?.calculado || 0}
                </p>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon={Calculator}
              onClick={handleCalcular}
              loading={calculando || undefined}
              className="rounded-xl"
            >
              Calcular {MESES[mes - 1]}
            </Button>
            {hayCalculados && (
              <Button
                variant="success"
                size="md"
                icon={CheckCheck}
                onClick={handleAprobarTodos}
                loading={aprobandoTodos || undefined}
                className="rounded-xl"
              >
                Aprobar Todos
              </Button>
            )}
            <Link
              href="/recursos-humanos/premios/configuracion"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-purple-300 hover:text-purple-700 transition-all"
            >
              <Settings size={14} />
              Configurar Porcentajes
            </Link>
          </div>

          {/* Lista de premios */}
          {loading ? (
            <LoadingScreen message="Cargando premios..." />
          ) : premios.length === 0 ? (
            <EmptyState
              icon="🏆"
              titulo="Sin premios calculados"
              descripcion={`No hay premios para ${MESES[mes - 1]} ${anio}. Presioná "Calcular" para generar.`}
            />
          ) : (
            <div className="space-y-3">
              {premios.map((premio) => {
                const estadoBadge = ESTADO_BADGE[premio.estado] || ESTADO_BADGE.calculado;
                const isExpanded = expandedId === premio.id;
                const isAjustando = ajusteData?.id === premio.id;

                return (
                  <div
                    key={premio.id}
                    className={cn(
                      "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all",
                      isExpanded ? "ring-2 ring-amber-200 border-amber-200" : "border-slate-200",
                    )}
                  >
                    {/* Row */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : premio.id)}
                      className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <Trophy size={16} className="text-amber-500 shrink-0" />
                      <span className="text-sm font-bold text-slate-800 flex-1 truncate">
                        {premio.funcionario_nombre}
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:block">
                        {premio.funcionario_cargo}
                      </span>
                      <Badge variant={premio.tipo_premio === "vendedor" ? "info" : "default"} className="text-[9px]">
                        {premio.tipo_display}
                      </Badge>
                      <span className="text-sm font-bold text-slate-700 shrink-0">
                        {formatUSD(premio.premio_aprobado_usd || premio.premio_final_usd)}
                      </span>
                      <Badge variant={estadoBadge.variant} className="text-[9px]">
                        {estadoBadge.label}
                      </Badge>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </button>

                    {/* Detail */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-4 space-y-4">
                        {/* Cálculo */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-slate-400 font-medium">Lucro base</p>
                            <p className="font-bold text-slate-700">{formatUSD(premio.lucro_base_usd)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">Ventas cobradas</p>
                            <p className="font-bold text-slate-700">{formatUSD(premio.ventas_cobradas_usd)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">Costo mercadería</p>
                            <p className="font-bold text-slate-700">{formatUSD(premio.costo_mercaderia_usd)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">Porcentaje</p>
                            <p className="font-bold text-slate-700">{premio.porcentaje_aplicado}%</p>
                          </div>
                          {Number(premio.ventas_pendientes_usd) > 0 && (
                            <div className="col-span-2 sm:col-span-4">
                              <p className="text-amber-500 font-medium text-[11px]">
                                ⏳ Ventas pendientes de cobro: {formatUSD(premio.ventas_pendientes_usd)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Asistencia */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-slate-400 font-medium">Días laborales</p>
                            <p className="font-bold text-slate-700">{premio.dias_laborales}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">Días trabajados</p>
                            <p className="font-bold text-slate-700">{premio.dias_trabajados}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">Ausencias</p>
                            <p className={cn("font-bold", premio.dias_ausencia > 0 ? "text-red-600" : "text-slate-700")}>
                              {premio.dias_ausencia}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">Factor asistencia</p>
                            <p className="font-bold text-slate-700">
                              {premio.dias_trabajados}/{premio.dias_laborales} = {(Number(premio.factor_asistencia) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        {/* Resultado */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-slate-200 pt-3">
                          <div>
                            <p className="text-slate-400 font-medium">Premio bruto</p>
                            <p className="font-bold text-slate-700">{formatUSD(premio.premio_bruto_usd)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">Premio (con asistencia)</p>
                            <p className="font-bold text-slate-800">{formatUSD(premio.premio_final_usd)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">Ajuste director</p>
                            <p className={cn("font-bold", Number(premio.ajuste_director_usd) !== 0 ? "text-amber-600" : "text-slate-400")}>
                              {Number(premio.ajuste_director_usd) > 0 ? "+" : ""}{formatUSD(premio.ajuste_director_usd)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">A pagar</p>
                            <p className="font-black text-lg text-emerald-700">
                              {formatUSD(premio.premio_aprobado_usd || (Number(premio.premio_final_usd) + Number(premio.ajuste_director_usd)))}
                            </p>
                          </div>
                        </div>

                        {/* Observaciones del director */}
                        {premio.observaciones_director && (
                          <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-2">
                            Nota: {premio.observaciones_director}
                          </p>
                        )}

                        {/* Ajuste inline */}
                        {isAjustando && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                            <p className="text-xs font-bold text-amber-700">Ajustar premio</p>
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <label className="text-[10px] text-amber-600 font-medium">Monto ajuste (USD, puede ser negativo)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={ajusteData.monto}
                                  onChange={(e) => setAjusteData({ ...ajusteData, monto: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm mt-1"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-amber-600 font-medium">Observación</label>
                                <input
                                  type="text"
                                  value={ajusteData.obs}
                                  onChange={(e) => setAjusteData({ ...ajusteData, obs: e.target.value })}
                                  placeholder="Motivo del ajuste..."
                                  className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm mt-1"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="warning" size="sm" onClick={handleGuardarAjuste}>
                                Guardar ajuste
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setAjusteData(null)}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Acciones individuales */}
                        {(premio.estado === "calculado" || premio.estado === "ajustado") && !isAjustando && (
                          <div className="flex items-center gap-2 border-t border-slate-200 pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Edit3}
                              onClick={() => setAjusteData({ id: premio.id, monto: "0", obs: "" })}
                            >
                              Ajustar
                            </Button>
                            <Button
                              variant="success"
                              size="sm"
                              icon={CheckCircle2}
                              onClick={() => handleAprobarIndividual(premio.id)}
                            >
                              Aprobar
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
