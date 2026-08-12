"use client";
import { useState, useEffect } from "react";
import {
  CalendarDays,
  Plus,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { EmptyState, LoadingScreen, Pagination, SearchBar } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getAusencias,
  createAusencia,
  aprobarAusencia,
  rechazarAusencia,
  getFuncionarios,
} from "@/services/apis/rrhh";
import { useErrorHandler } from "@/hooks/useErrorHandler";

const PAGE_SIZE = 20;

const TIPO_AUSENCIA_OPTIONS = [
  { value: "vacaciones", label: "Vacaciones" },
  { value: "permiso_personal", label: "Permiso Personal" },
  { value: "licencia_medica", label: "Licencia Médica" },
  { value: "falta_injustificada", label: "Falta Injustificada" },
  { value: "maternidad", label: "Licencia por Maternidad" },
  { value: "paternidad", label: "Licencia por Paternidad" },
  { value: "duelo", label: "Licencia por Duelo" },
  { value: "capacitacion", label: "Capacitación" },
  { value: "otro", label: "Otro" },
];

const ESTADO_COLORS = {
  pendiente: "bg-amber-100 text-amber-700",
  aprobada: "bg-emerald-100 text-emerald-700",
  rechazada: "bg-red-100 text-red-700",
};

const TIPO_COLORS = {
  vacaciones: "bg-blue-50 text-blue-700",
  permiso_personal: "bg-purple-50 text-purple-700",
  licencia_medica: "bg-red-50 text-red-700",
  falta_injustificada: "bg-red-100 text-red-800",
  maternidad: "bg-pink-50 text-pink-700",
  paternidad: "bg-indigo-50 text-indigo-700",
  duelo: "bg-slate-100 text-slate-700",
  capacitacion: "bg-emerald-50 text-emerald-700",
  otro: "bg-slate-50 text-slate-600",
};

export default function TabAusencias() {
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { handleError } = useErrorHandler();

  const {
    data: ausenciasData,
    loading,
    execute: fetchAusencias,
  } = useApi(getAusencias, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  const ausencias = ausenciasData?.results || [];
  const count = ausenciasData?.count || 0;

  useEffect(() => {
    fetchAusencias({
      page,
      estado: filtroEstado || undefined,
      tipo: filtroTipo || undefined,
    });
  }, [page, filtroEstado, filtroTipo]);

  const refresh = () => fetchAusencias({ page, estado: filtroEstado || undefined, tipo: filtroTipo || undefined });

  const handleAprobar = async (id) => {
    try {
      await aprobarAusencia(id);
      refresh();
    } catch (err) {
      handleError(err);
    }
  };

  const handleRechazar = async (id) => {
    const obs = prompt("Motivo del rechazo (opcional):");
    try {
      await rechazarAusencia(id, { observaciones: obs || "" });
      refresh();
    } catch (err) {
      handleError(err);
    }
  };

  // Stats
  const pendientes = ausencias.filter((a) => a.estado === "pendiente").length;
  const aprobadas = ausencias.filter((a) => a.estado === "aprobada").length;
  const rechazadas = ausencias.filter((a) => a.estado === "rechazada").length;

  return (
    <div className="p-4 md:p-8 min-w-0">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Gestión de Ausencias</h2>
            <p className="text-xs text-slate-500">Solicitudes, permisos, vacaciones y faltas</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Nueva Ausencia
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Pendientes</p>
              <p className="text-lg font-bold text-slate-800">{pendientes}</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Aprobadas</p>
              <p className="text-lg font-bold text-slate-800">{aprobadas}</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle size={16} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Rechazadas</p>
              <p className="text-lg font-bold text-slate-800">{rechazadas}</p>
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
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
          <select
            value={filtroTipo}
            onChange={(e) => { setFiltroTipo(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-600"
          >
            <option value="">Todos los tipos</option>
            {TIPO_AUSENCIA_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Listado */}
        {loading ? (
          <LoadingScreen message="Cargando ausencias..." />
        ) : ausencias.length === 0 ? (
          <EmptyState
            icon="🏖️"
            title="Sin registros de ausencia"
            description="No hay ausencias con los filtros seleccionados."
          />
        ) : (
          <>
            <div className="space-y-3">
              {ausencias.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-slate-800">
                          {a.funcionario_nombre}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TIPO_COLORS[a.tipo] || "bg-slate-50"}`}>
                          {a.tipo_display}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ESTADO_COLORS[a.estado] || "bg-slate-50"}`}>
                          {a.estado_display || a.estado}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        <span><strong>Desde:</strong> {a.fecha_inicio}</span>
                        <span><strong>Hasta:</strong> {a.fecha_fin}</span>
                        <span><strong>Días:</strong> {a.dias}</span>
                        {a.aprobado_por_nombre && (
                          <span><strong>Aprobó:</strong> {a.aprobado_por_nombre}</span>
                        )}
                      </div>
                      {a.motivo && (
                        <p className="mt-2 text-xs text-slate-500 italic">{a.motivo}</p>
                      )}
                      {a.observaciones && (
                        <p className="mt-1 text-xs text-red-500">{a.observaciones}</p>
                      )}
                    </div>

                    {/* Acciones de aprobación */}
                    {a.estado === "pendiente" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAprobar(a.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          <Check size={14} /> Aprobar
                        </button>
                        <button
                          onClick={() => handleRechazar(a.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                        >
                          <X size={14} /> Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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

      {/* Modal nueva ausencia */}
      {showModal && (
        <NuevaAusenciaModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Modal para crear ausencia ──────────────────────────────────

function NuevaAusenciaModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    funcionario: "",
    tipo: "vacaciones",
    fecha_inicio: "",
    fecha_fin: "",
    motivo: "",
  });
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createAusencia(form);
      onSuccess();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  // Calcular días
  const dias = form.fecha_inicio && form.fecha_fin
    ? Math.max(0, Math.ceil((new Date(form.fecha_fin) - new Date(form.fecha_inicio)) / 86400000) + 1)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Nueva Ausencia</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Funcionario *</label>
            <select
              name="funcionario"
              value={form.funcionario}
              onChange={handleChange}
              required
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

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Tipo *</label>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              {TIPO_AUSENCIA_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Desde *</label>
              <input
                type="date"
                name="fecha_inicio"
                value={form.fecha_inicio}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Hasta *</label>
              <input
                type="date"
                name="fecha_fin"
                value={form.fecha_fin}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>

          {dias > 0 && (
            <p className="text-xs text-amber-600 font-medium">
              📅 {dias} día{dias !== 1 ? "s" : ""} de ausencia
            </p>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Motivo</label>
            <textarea
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
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
              disabled={saving}
              className="px-6 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Registrar Ausencia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
