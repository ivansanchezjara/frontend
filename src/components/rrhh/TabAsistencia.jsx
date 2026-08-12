"use client";
import { useState, useEffect } from "react";
import {
  Clock,
  LogIn,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  Users,
  Search,
  Download,
} from "lucide-react";
import { EmptyState, LoadingScreen, Pagination, SearchBar } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getAsistencias,
  createAsistencia,
  updateAsistencia,
  getFuncionarios,
  registroMasivoAsistencia,
  descargarReporteAsistencia,
} from "@/services/apis/rrhh";
import { useErrorHandler } from "@/hooks/useErrorHandler";

const PAGE_SIZE = 20;

export default function TabAsistencia() {
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split("T")[0];
  });
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRegistrar, setShowRegistrar] = useState(false);
  const [showMasivo, setShowMasivo] = useState(false);
  const [showReporte, setShowReporte] = useState(false);
  const { handleError } = useErrorHandler();

  const {
    data: asistenciasData,
    loading,
    execute: fetchAsistencias,
  } = useApi(getAsistencias, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  const asistencias = asistenciasData?.results || [];
  const count = asistenciasData?.count || 0;

  useEffect(() => {
    fetchAsistencias({
      fecha_desde: fecha,
      fecha_hasta: fecha,
      page,
      search: searchTerm || undefined,
    });
  }, [fecha, page, searchTerm]);

  // Stats del día
  const totalPresentes = asistencias.filter((a) => a.hora_entrada).length;
  const totalTardanzas = asistencias.filter((a) => a.llegada_tardia).length;
  const totalSalidaTemprana = asistencias.filter((a) => a.salida_temprana).length;
  const sinSalida = asistencias.filter((a) => a.hora_entrada && !a.hora_salida).length;

  return (
    <div className="p-4 md:p-8 min-w-0">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Control de Asistencia</h2>
            <p className="text-xs text-slate-500">Registro de entrada y salida del personal</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={fecha}
              onChange={(e) => { setFecha(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            />
            <button
              onClick={() => setShowReporte(true)}
              className="flex items-center gap-2 px-3 py-2.5 bg-slate-600 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm"
              title="Generar reporte PDF"
            >
              <Download size={14} />
              PDF
            </button>
            <button
              onClick={() => setShowMasivo(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Users size={16} />
              Registro Masivo
            </button>
            <button
              onClick={() => setShowRegistrar(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
            >
              <UserPlus size={16} />
              Individual
            </button>
          </div>
        </div>

        {/* Stats del día */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Presentes</p>
              <p className="text-lg font-bold text-slate-800">{totalPresentes}</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Tardanzas</p>
              <p className="text-lg font-bold text-slate-800">{totalTardanzas}</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <LogOut size={16} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Salida Temprana</p>
              <p className="text-lg font-bold text-slate-800">{totalSalidaTemprana}</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Sin Salida</p>
              <p className="text-lg font-bold text-slate-800">{sinSalida}</p>
            </div>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="max-w-md">
          <SearchBar
            value={searchTerm}
            onChange={(val) => { setSearchTerm(val); setPage(1); }}
            placeholder="Buscar por nombre de funcionario..."
          />
        </div>

        {/* Tabla de asistencia */}
        {loading ? (
          <LoadingScreen message="Cargando registros..." />
        ) : asistencias.length === 0 ? (
          <EmptyState
            icon="⏰"
            title="Sin registros para esta fecha"
            description="No hay registros de asistencia. Registrá la entrada del personal."
          />
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Funcionario</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Fecha</th>
                      <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Entrada</th>
                      <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Salida</th>
                      <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Horas</th>
                      <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Estado</th>
                      <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistencias.map((a) => (
                      <AsistenciaRow
                        key={a.id}
                        asistencia={a}
                        onUpdate={() => fetchAsistencias({ fecha_desde: fecha, fecha_hasta: fecha, page })}
                      />
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

      {/* Modal de registro rápido */}
      {showRegistrar && (
        <RegistrarAsistenciaModal
          fecha={fecha}
          onClose={() => setShowRegistrar(false)}
          onSuccess={() => {
            setShowRegistrar(false);
            fetchAsistencias({ fecha_desde: fecha, fecha_hasta: fecha, page });
          }}
        />
      )}

      {/* Modal de registro masivo */}
      {showMasivo && (
        <RegistroMasivoModal
          fecha={fecha}
          onClose={() => setShowMasivo(false)}
          onSuccess={() => {
            setShowMasivo(false);
            fetchAsistencias({ fecha_desde: fecha, fecha_hasta: fecha, page });
          }}
        />
      )}

      {/* Modal de reporte PDF */}
      {showReporte && (
        <ReporteAsistenciaModal
          onClose={() => setShowReporte(false)}
        />
      )}
    </div>
  );
}

// ─── Fila de asistencia con acciones inline ─────────────────────

function AsistenciaRow({ asistencia, onUpdate }) {
  const [registrandoSalida, setRegistrandoSalida] = useState(false);
  const { handleError } = useErrorHandler();

  const handleRegistrarSalida = async () => {
    setRegistrandoSalida(true);
    try {
      const ahora = new Date().toTimeString().slice(0, 5);
      await updateAsistencia(asistencia.id, { hora_salida: ahora });
      onUpdate();
    } catch (err) {
      handleError(err);
    } finally {
      setRegistrandoSalida(false);
    }
  };

  const getEstadoBadge = () => {
    if (asistencia.llegada_tardia && asistencia.salida_temprana) {
      return <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold">Tardía + Sal. Temprana</span>;
    }
    if (asistencia.llegada_tardia) {
      return <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold">Llegada Tardía</span>;
    }
    if (asistencia.salida_temprana) {
      return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold">Salida Temprana</span>;
    }
    if (asistencia.hora_entrada && asistencia.hora_salida) {
      return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">Completo</span>;
    }
    if (asistencia.hora_entrada) {
      return <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">En curso</span>;
    }
    return <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold">Sin marcar</span>;
  };

  return (
    <tr className="border-b border-slate-50 hover:bg-amber-50/20 transition-colors">
      <td className="px-4 py-3 font-medium text-slate-800">
        {asistencia.funcionario_nombre}
      </td>
      <td className="px-4 py-3 text-slate-600 text-xs">{asistencia.fecha}</td>
      <td className="px-4 py-3 text-center">
        {asistencia.hora_entrada ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
            <LogIn size={12} /> {asistencia.hora_entrada.slice(0, 5)}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {asistencia.hora_salida ? (
          <span className="inline-flex items-center gap-1 text-red-500 font-medium">
            <LogOut size={12} /> {asistencia.hora_salida.slice(0, 5)}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center text-slate-600 font-mono text-xs">
        {asistencia.horas_trabajadas ? `${asistencia.horas_trabajadas}h` : "—"}
      </td>
      <td className="px-4 py-3 text-center">{getEstadoBadge()}</td>
      <td className="px-4 py-3 text-center">
        {asistencia.hora_entrada && !asistencia.hora_salida && (
          <button
            onClick={handleRegistrarSalida}
            disabled={registrandoSalida}
            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[11px] font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <LogOut size={12} className="inline mr-1" />
            Marcar Salida
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Modal para registrar asistencia ────────────────────────────

function RegistrarAsistenciaModal({ fecha, onClose, onSuccess }) {
  const [funcionarioId, setFuncionarioId] = useState("");
  const [horaEntrada, setHoraEntrada] = useState(() => new Date().toTimeString().slice(0, 5));
  const [llegadaTardia, setLlegadaTardia] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchFunc, setSearchFunc] = useState("");
  const { handleError } = useErrorHandler();

  const { data: funcData, execute: fetchFuncs } = useApi(getFuncionarios, {
    auto: false,
    initialData: { results: [] },
  });

  useEffect(() => {
    fetchFuncs({ estado: "activo", page_size: 100 });
  }, []);

  const funcionariosDisponibles = (funcData?.results || []).filter((f) =>
    !searchFunc || f.nombre_completo?.toLowerCase().includes(searchFunc.toLowerCase())
      || `${f.nombre} ${f.apellido}`.toLowerCase().includes(searchFunc.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!funcionarioId) return;
    setSaving(true);
    try {
      await createAsistencia({
        funcionario: funcionarioId,
        fecha,
        hora_entrada: horaEntrada,
        llegada_tardia: llegadaTardia,
        observaciones,
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
          <h2 className="text-lg font-bold text-slate-800">Registrar Entrada</h2>
          <p className="text-xs text-slate-500">Fecha: {fecha}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Buscar funcionario */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Funcionario *</label>
            <input
              type="text"
              placeholder="Buscar funcionario..."
              value={searchFunc}
              onChange={(e) => setSearchFunc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 mb-2"
            />
            <select
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              size={5}
            >
              {funcionariosDisponibles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre_completo || `${f.nombre} ${f.apellido}`} — {f.cargo_nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Hora Entrada</label>
              <input
                type="time"
                value={horaEntrada}
                onChange={(e) => setHoraEntrada(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={llegadaTardia}
                  onChange={(e) => setLlegadaTardia(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-200"
                />
                <span className="text-xs text-slate-600">Llegada tardía</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
            />
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
              {saving ? "Registrando..." : "Registrar Entrada"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ─── Modal de reporte de asistencia (PDF) ───────────────────────

function ReporteAsistenciaModal({ onClose }) {
  const [funcionarioId, setFuncionarioId] = useState("");
  const [mes, setMes] = useState(() => (new Date().getMonth() + 1).toString());
  const [anio, setAnio] = useState(() => new Date().getFullYear().toString());
  const [generando, setGenerando] = useState(false);
  const { handleError } = useErrorHandler();

  const { data: funcData, execute: fetchFuncs } = useApi(getFuncionarios, {
    auto: false,
    initialData: { results: [] },
  });

  useEffect(() => {
    fetchFuncs({ estado: "activo", page_size: 200 });
  }, []);

  const funcionarios = funcData?.results || [];

  const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const handleDescargar = async () => {
    if (!funcionarioId) return;
    setGenerando(true);
    try {
      await descargarReporteAsistencia(funcionarioId, parseInt(mes), parseInt(anio));
      onClose();
    } catch (err) {
      handleError(err);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Reporte de Asistencia (PDF)</h2>
          <p className="text-xs text-slate-500">Genera un reporte mensual para un funcionario</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Funcionario *</label>
            <select
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              <option value="">Seleccionar...</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre_completo || `${f.nombre} ${f.apellido}`}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Mes</label>
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                {MESES.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Año</label>
              <input
                type="number"
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                min={2020}
                max={2030}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
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
              onClick={handleDescargar}
              disabled={generando || !funcionarioId}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {generando ? "Generando..." : "Descargar PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de registro masivo ───────────────────────────────────

function RegistroMasivoModal({ fecha, onClose, onSuccess }) {
  const [horaEntrada, setHoraEntrada] = useState(() => new Date().toTimeString().slice(0, 5));
  const [tipoRegistro, setTipoRegistro] = useState("entrada"); // "entrada" o "salida"
  const [seleccionados, setSeleccionados] = useState([]);
  const [seleccionarTodos, setSeleccionarTodos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [searchFunc, setSearchFunc] = useState("");
  const { handleError } = useErrorHandler();

  const { data: funcData, execute: fetchFuncs } = useApi(getFuncionarios, {
    auto: false,
    initialData: { results: [] },
  });

  useEffect(() => {
    fetchFuncs({ estado: "activo", page_size: 200 });
  }, []);

  const funcionarios = (funcData?.results || []).filter((f) =>
    !searchFunc || 
    (f.nombre_completo || `${f.nombre} ${f.apellido}`)
      .toLowerCase()
      .includes(searchFunc.toLowerCase())
  );

  const handleToggle = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (seleccionarTodos) {
      setSeleccionados([]);
    } else {
      setSeleccionados(funcionarios.map((f) => f.id));
    }
    setSeleccionarTodos(!seleccionarTodos);
  };

  const handleSubmit = async () => {
    if (seleccionados.length === 0) return;
    setSaving(true);
    try {
      const payload = {
        fecha,
        funcionarios: seleccionados,
      };
      if (tipoRegistro === "entrada") {
        payload.hora_entrada = horaEntrada;
      } else {
        payload.hora_salida = horaEntrada;
      }
      const res = await registroMasivoAsistencia(payload);
      setResultado(res);
      // Auto-cerrar después de 2 segundos
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Registro Masivo de Asistencia</h2>
          <p className="text-xs text-slate-500">Fecha: {fecha} — Seleccioná los funcionarios y registrá la {tipoRegistro} de todos a la vez</p>
        </div>

        {resultado ? (
          <div className="p-6 space-y-4">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-800">Registro completado</p>
              <div className="flex justify-center gap-6 mt-3 text-xs">
                <span className="text-emerald-700"><strong>{resultado.creados}</strong> creados</span>
                <span className="text-blue-700"><strong>{resultado.actualizados}</strong> actualizados</span>
                {resultado.errores?.length > 0 && (
                  <span className="text-red-700"><strong>{resultado.errores.length}</strong> errores</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Opciones */}
            <div className="px-6 pt-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setTipoRegistro("entrada")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      tipoRegistro === "entrada"
                        ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <LogIn size={12} className="inline mr-1" /> Entrada
                  </button>
                  <button
                    onClick={() => setTipoRegistro("salida")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      tipoRegistro === "salida"
                        ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <LogOut size={12} className="inline mr-1" /> Salida
                  </button>
                </div>
                <div>
                  <input
                    type="time"
                    value={horaEntrada}
                    onChange={(e) => setHoraEntrada(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div className="ml-auto text-xs text-amber-600 font-medium">
                  {seleccionados.length} seleccionados
                </div>
              </div>

              {/* Búsqueda */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Buscar funcionario..."
                  value={searchFunc}
                  onChange={(e) => setSearchFunc(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {seleccionarTodos ? "Deseleccionar todos" : "Seleccionar todos"}
                </button>
              </div>
            </div>

            {/* Lista de funcionarios con checkboxes */}
            <div className="flex-1 overflow-y-auto px-6 py-3">
              <div className="space-y-1">
                {funcionarios.map((f) => {
                  const checked = seleccionados.includes(f.id);
                  return (
                    <label
                      key={f.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                        checked ? "bg-amber-50 ring-1 ring-amber-200" : "hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggle(f.id)}
                        className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-200"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-slate-800">
                          {f.nombre_completo || `${f.nombre} ${f.apellido}`}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">
                          {f.cargo_nombre} · {f.departamento_nombre}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || seleccionados.length === 0}
                className="px-6 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {saving
                  ? "Registrando..."
                  : `Registrar ${tipoRegistro} (${seleccionados.length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
