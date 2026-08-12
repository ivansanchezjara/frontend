"use client";
import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  Users,
} from "lucide-react";
import { LoadingScreen } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getAsistencias, getAusencias, getFuncionarios, getFeriados } from "@/services/apis/rrhh";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function TabCalendario() {
  const [mesActual, setMesActual] = useState(() => new Date().getMonth());
  const [anioActual, setAnioActual] = useState(() => new Date().getFullYear());
  const [filtroFuncionario, setFiltroFuncionario] = useState("");
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  const { data: funcData } = useApi(getFuncionarios, {
    auto: true,
    initialData: { results: [] },
  });
  const funcionarios = funcData?.results || [];

  // Calcular rango de fechas del mes
  const primerDia = `${anioActual}-${String(mesActual + 1).padStart(2, "0")}-01`;
  const ultimoDia = new Date(anioActual, mesActual + 1, 0);
  const ultimoDiaStr = `${anioActual}-${String(mesActual + 1).padStart(2, "0")}-${String(ultimoDia.getDate()).padStart(2, "0")}`;

  const {
    data: asistenciasData,
    loading: loadingAsis,
    execute: fetchAsistencias,
  } = useApi(getAsistencias, {
    auto: false,
    initialData: { results: [] },
  });

  const {
    data: ausenciasData,
    loading: loadingAus,
    execute: fetchAusencias,
  } = useApi(getAusencias, {
    auto: false,
    initialData: { results: [] },
  });

  const {
    data: feriadosData,
    loading: loadingFer,
    execute: fetchFeriados,
  } = useApi(getFeriados, {
    auto: false,
    initialData: { results: [] },
  });

  useEffect(() => {
    const params = {
      fecha_desde: primerDia,
      fecha_hasta: ultimoDiaStr,
      page_size: 500,
    };
    if (filtroFuncionario) params.funcionario = filtroFuncionario;
    fetchAsistencias(params);
    fetchAusencias({
      page_size: 200,
      ...(filtroFuncionario ? { funcionario: filtroFuncionario } : {}),
    });
    fetchFeriados({ anio: anioActual, page_size: 50 });
  }, [mesActual, anioActual, filtroFuncionario]);

  const asistencias = asistenciasData?.results || [];
  const ausencias = (ausenciasData?.results || []).filter((a) => a.estado === "aprobada");
  const feriados = feriadosData?.results || [];

  // Mapear feriados por fecha
  const feriadosPorFecha = useMemo(() => {
    const map = {};
    feriados.forEach((f) => {
      const fechaStr = f.fecha;
      if (!map[fechaStr]) map[fechaStr] = [];
      map[fechaStr].push(f);
      // Si es recurrente, mapear también para el año actual
      if (f.recurrente) {
        const mes = fechaStr.split("-")[1];
        const dia = fechaStr.split("-")[2];
        const key = `${anioActual}-${mes}-${dia}`;
        if (!map[key]) map[key] = [];
        if (!map[key].find((x) => x.id === f.id)) {
          map[key].push(f);
        }
      }
    });
    return map;
  }, [feriados, anioActual]);

  // Mapear asistencias por fecha
  const asistenciasPorFecha = useMemo(() => {
    const map = {};
    asistencias.forEach((a) => {
      if (!map[a.fecha]) map[a.fecha] = [];
      map[a.fecha].push(a);
    });
    return map;
  }, [asistencias]);

  // Mapear ausencias por fecha (expandir rango de días)
  const ausenciasPorFecha = useMemo(() => {
    const map = {};
    ausencias.forEach((a) => {
      const inicio = new Date(a.fecha_inicio);
      const fin = new Date(a.fecha_fin);
      for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(a);
      }
    });
    return map;
  }, [ausencias]);

  // Generar días del calendario
  const diasCalendario = useMemo(() => {
    const primer = new Date(anioActual, mesActual, 1);
    const diasEnMes = ultimoDia.getDate();
    // Lunes = 0, Domingo = 6
    let diaInicio = primer.getDay() - 1;
    if (diaInicio < 0) diaInicio = 6;

    const dias = [];
    // Días vacíos antes del primer día
    for (let i = 0; i < diaInicio; i++) {
      dias.push(null);
    }
    // Días del mes
    for (let d = 1; d <= diasEnMes; d++) {
      const fechaStr = `${anioActual}-${String(mesActual + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      dias.push({
        dia: d,
        fecha: fechaStr,
        asistencias: asistenciasPorFecha[fechaStr] || [],
        ausencias: ausenciasPorFecha[fechaStr] || [],
        feriados: feriadosPorFecha[fechaStr] || [],
      });
    }
    return dias;
  }, [anioActual, mesActual, asistenciasPorFecha, ausenciasPorFecha, feriadosPorFecha]);

  const mesAnterior = () => {
    if (mesActual === 0) {
      setMesActual(11);
      setAnioActual(anioActual - 1);
    } else {
      setMesActual(mesActual - 1);
    }
    setDiaSeleccionado(null);
  };

  const mesSiguiente = () => {
    if (mesActual === 11) {
      setMesActual(0);
      setAnioActual(anioActual + 1);
    } else {
      setMesActual(mesActual + 1);
    }
    setDiaSeleccionado(null);
  };

  const loading = loadingAsis || loadingAus || loadingFer;
  const hoy = new Date().toISOString().split("T")[0];

  return (
    <div className="p-4 md:p-8 min-w-0">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Calendario de RRHH</h2>
            <p className="text-xs text-slate-500">Asistencias, ausencias y permisos en vista mensual</p>
          </div>
          <select
            value={filtroFuncionario}
            onChange={(e) => setFiltroFuncionario(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-600"
          >
            <option value="">Todos los funcionarios</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre_completo || `${f.nombre} ${f.apellido}`}
              </option>
            ))}
          </select>
        </div>

        {/* Navegación de mes */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <button
            onClick={mesAnterior}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} className="text-slate-500" />
          </button>
          <h3 className="text-base font-bold text-slate-800">
            {MESES[mesActual]} {anioActual}
          </h3>
          <button
            onClick={mesSiguiente}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight size={18} className="text-slate-500" />
          </button>
        </div>

        {loading ? (
          <LoadingScreen message="Cargando calendario..." />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header días de la semana */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DIAS_SEMANA.map((dia) => (
                <div
                  key={dia}
                  className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500"
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7">
              {diasCalendario.map((d, idx) => {
                if (!d) {
                  return <div key={`empty-${idx}`} className="min-h-[80px] border-b border-r border-slate-50" />;
                }

                const esHoy = d.fecha === hoy;
                const tieneAsistencias = d.asistencias.length > 0;
                const tieneAusencias = d.ausencias.length > 0;
                const tieneFeriados = d.feriados.length > 0;
                const tardanzas = d.asistencias.filter((a) => a.llegada_tardia).length;
                const esFinde = (idx % 7 === 5) || (idx % 7 === 6);

                return (
                  <div
                    key={d.fecha}
                    onClick={() => setDiaSeleccionado(diaSeleccionado === d.fecha ? null : d.fecha)}
                    className={`min-h-[80px] p-1.5 border-b border-r border-slate-50 cursor-pointer transition-all hover:bg-amber-50/50 ${
                      esHoy ? "bg-amber-50/80 ring-1 ring-inset ring-amber-200" : ""
                    } ${tieneFeriados ? "bg-red-50/60" : ""} ${esFinde && !tieneFeriados ? "bg-slate-50/50" : ""} ${
                      diaSeleccionado === d.fecha ? "ring-2 ring-amber-400 bg-amber-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${esHoy ? "text-amber-700" : tieneFeriados ? "text-red-600" : "text-slate-700"}`}>
                        {d.dia}
                      </span>
                      {tieneFeriados && (
                        <span className="text-[8px] font-bold text-red-500 uppercase">F</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {tieneFeriados && (
                        <div className="text-[8px] text-red-600 font-medium truncate" title={d.feriados[0].nombre}>
                          {d.feriados[0].nombre}
                        </div>
                      )}
                      {tieneAsistencias && (
                        <div className="flex items-center gap-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[9px] text-emerald-600 font-medium">
                            {d.asistencias.length}
                          </span>
                          {tardanzas > 0 && (
                            <span className="text-[9px] text-red-500 font-medium ml-1">
                              ({tardanzas} tard.)
                            </span>
                          )}
                        </div>
                      )}
                      {tieneAusencias && (
                        <div className="flex items-center gap-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="text-[9px] text-blue-600 font-medium truncate">
                            {d.ausencias.length} aus.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detalle del día seleccionado */}
        {diaSeleccionado && (
          <DetalleDelDia
            fecha={diaSeleccionado}
            asistencias={asistenciasPorFecha[diaSeleccionado] || []}
            ausencias={ausenciasPorFecha[diaSeleccionado] || []}
          />
        )}

        {/* Leyenda */}
        <div className="flex items-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Asistencias</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Ausencias aprobadas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Tardanzas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-red-100 border border-red-200" />
            <span>Feriados</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detalle del día seleccionado ───────────────────────────────

function DetalleDelDia({ fecha, asistencias, ausencias }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <CalendarDays size={14} className="text-amber-600" />
        Detalle del {fecha}
      </h3>

      {/* Asistencias del día */}
      {asistencias.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
            <Clock size={11} /> Asistencias ({asistencias.length})
          </h4>
          <div className="space-y-1.5">
            {asistencias.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
              >
                <span className="text-xs font-medium text-slate-700">{a.funcionario_nombre}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-600">
                    Entrada: {a.hora_entrada?.slice(0, 5) || "—"}
                  </span>
                  <span className="text-red-500">
                    Salida: {a.hora_salida?.slice(0, 5) || "—"}
                  </span>
                  {a.horas_trabajadas && (
                    <span className="text-slate-500 font-mono">{a.horas_trabajadas}h</span>
                  )}
                  {a.llegada_tardia && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-bold">
                      TARDÍA
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ausencias del día */}
      {ausencias.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
            <CalendarDays size={11} /> Ausencias ({ausencias.length})
          </h4>
          <div className="space-y-1.5">
            {ausencias.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between bg-blue-50/50 rounded-lg px-3 py-2"
              >
                <span className="text-xs font-medium text-slate-700">{a.funcionario_nombre}</span>
                <span className="text-xs text-blue-600 font-medium">{a.tipo_display}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {asistencias.length === 0 && ausencias.length === 0 && (
        <p className="text-xs text-slate-400 italic">No hay registros para esta fecha.</p>
      )}
    </div>
  );
}
