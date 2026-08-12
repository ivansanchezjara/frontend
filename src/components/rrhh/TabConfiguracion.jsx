"use client";
import { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Flag,
  Building2,
} from "lucide-react";
import { EmptyState, LoadingScreen } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getFeriados,
  createFeriado,
  updateFeriado,
  deleteFeriado,
  cargarFeriadosParaguay,
  getHorarios,
  createHorario,
  updateHorario,
  deleteHorario,
  getDepartamentos,
} from "@/services/apis/rrhh";
import { useErrorHandler } from "@/hooks/useErrorHandler";

const SUBTABS = [
  { id: "feriados", label: "Feriados", icon: Flag },
  { id: "horarios", label: "Horarios Laborales", icon: Clock },
];

export default function TabConfiguracion() {
  const [subtab, setSubtab] = useState("feriados");

  return (
    <div className="p-4 md:p-8 min-w-0">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Configuración de RRHH</h2>
          <p className="text-xs text-slate-500">Feriados, horarios laborales y parámetros del módulo</p>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2">
          {SUBTABS.map((st) => {
            const Icon = st.icon;
            return (
              <button
                key={st.id}
                onClick={() => setSubtab(st.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  subtab === st.id
                    ? "bg-amber-100 text-amber-700 shadow-sm"
                    : "bg-white text-slate-400 hover:text-slate-600 border border-slate-200"
                }`}
              >
                <Icon size={14} />
                {st.label}
              </button>
            );
          })}
        </div>

        {subtab === "feriados" && <SeccionFeriados />}
        {subtab === "horarios" && <SeccionHorarios />}
      </div>
    </div>
  );
}

// ─── Sección Feriados ───────────────────────────────────────────

function SeccionFeriados() {
  const [showModal, setShowModal] = useState(false);
  const [editingFeriado, setEditingFeriado] = useState(null);
  const [anioFiltro, setAnioFiltro] = useState(() => new Date().getFullYear().toString());
  const [cargando, setCargando] = useState(false);
  const { handleError } = useErrorHandler();

  const {
    data: feriadosData,
    loading,
    execute: fetchFeriados,
  } = useApi(getFeriados, {
    auto: false,
    initialData: { results: [] },
  });

  useEffect(() => {
    fetchFeriados({ anio: anioFiltro, page_size: 50 });
  }, [anioFiltro]);

  const feriados = feriadosData?.results || [];

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este feriado?")) return;
    try {
      await deleteFeriado(id);
      fetchFeriados({ anio: anioFiltro, page_size: 50 });
    } catch (err) {
      handleError(err);
    }
  };

  const handleSuccess = () => {
    setShowModal(false);
    setEditingFeriado(null);
    fetchFeriados({ anio: anioFiltro, page_size: 50 });
  };

  const handleCargarParaguay = async () => {
    setCargando(true);
    try {
      const res = await cargarFeriadosParaguay(parseInt(anioFiltro));
      alert(`Feriados cargados: ${res.creados} nuevos, ${res.existentes} ya existían.`);
      fetchFeriados({ anio: anioFiltro, page_size: 50 });
    } catch (err) {
      handleError(err);
    } finally {
      setCargando(false);
    }
  };

  const TIPO_COLORS = {
    nacional: "bg-red-100 text-red-700",
    empresa: "bg-amber-100 text-amber-700",
    regional: "bg-blue-100 text-blue-700",
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={anioFiltro}
            onChange={(e) => setAnioFiltro(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
          >
            {[2024, 2025, 2026, 2027, 2028].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <span className="text-xs text-slate-500">{feriados.length} feriados registrados</span>
        </div>
        <button
          onClick={() => { setEditingFeriado(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Nuevo Feriado
        </button>
      </div>

      {/* Botón cargar feriados Paraguay */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCargarParaguay}
          disabled={cargando}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <Flag size={14} />
          {cargando ? "Cargando..." : `Cargar Feriados Paraguay ${anioFiltro}`}
        </button>
        <span className="text-[10px] text-slate-400">
          Incluye feriados nacionales y Semana Santa
        </span>
      </div>

      {loading ? (
        <LoadingScreen message="Cargando feriados..." />
      ) : feriados.length === 0 ? (
        <EmptyState
          icon="🏖️"
          title="Sin feriados registrados"
          description="Agrega los feriados nacionales y de la empresa para el año."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Fecha</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Nombre</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Tipo</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Recurrente</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {feriados.map((f) => (
                <tr key={f.id} className="border-b border-slate-50 hover:bg-amber-50/20 transition-colors">
                  <td className="px-4 py-3 text-slate-700 font-mono text-xs">{f.fecha}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{f.nombre}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TIPO_COLORS[f.tipo] || "bg-slate-100"}`}>
                      {f.tipo_display}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500">
                    {f.recurrente ? "✓ Anual" : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setEditingFeriado(f); setShowModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <FeriadoModal
          feriado={editingFeriado}
          onClose={() => { setShowModal(false); setEditingFeriado(null); }}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

// ─── Sección Horarios Laborales ─────────────────────────────────

function SeccionHorarios() {
  const [showModal, setShowModal] = useState(false);
  const [editingHorario, setEditingHorario] = useState(null);
  const { handleError } = useErrorHandler();

  const {
    data: horariosData,
    loading,
    execute: fetchHorarios,
  } = useApi(getHorarios, {
    auto: true,
    initialData: { results: [] },
  });

  const { data: departamentosData } = useApi(getDepartamentos, {
    auto: true,
    initialData: { results: [] },
  });

  const horarios = horariosData?.results || horariosData || [];
  const departamentos = departamentosData?.results || departamentosData || [];

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este horario?")) return;
    try {
      await deleteHorario(id);
      fetchHorarios();
    } catch (err) {
      handleError(err);
    }
  };

  const handleSuccess = () => {
    setShowModal(false);
    setEditingHorario(null);
    fetchHorarios();
  };

  const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const DIAS_KEYS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{horarios.length} horarios configurados</span>
        <button
          onClick={() => { setEditingHorario(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Nuevo Horario
        </button>
      </div>

      {loading ? (
        <LoadingScreen message="Cargando horarios..." />
      ) : horarios.length === 0 ? (
        <EmptyState
          icon="⏰"
          title="Sin horarios configurados"
          description="Configura al menos un horario laboral global para que el sistema calcule tardanzas automáticamente."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {horarios.map((h) => (
            <div key={h.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{h.nombre}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building2 size={11} />
                    {h.departamento_nombre}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingHorario(h); setShowModal(true); }}
                    className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-emerald-600 font-bold">{h.hora_entrada?.slice(0, 5)}</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-red-500 font-bold">{h.hora_salida?.slice(0, 5)}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Tolerancia: {h.tolerancia_entrada_minutos}min entrada / {h.tolerancia_salida_minutos}min salida
                </div>
              </div>

              <div className="flex gap-1">
                {DIAS.map((dia, i) => (
                  <span
                    key={dia}
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      h[DIAS_KEYS[i]]
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {dia}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <HorarioModal
          horario={editingHorario}
          departamentos={departamentos}
          onClose={() => { setShowModal(false); setEditingHorario(null); }}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

// ─── Modal de Feriado ───────────────────────────────────────────

function FeriadoModal({ feriado, onClose, onSuccess }) {
  const isEdit = !!feriado;
  const { handleError } = useErrorHandler();

  const [form, setForm] = useState({
    nombre: feriado?.nombre || "",
    fecha: feriado?.fecha || "",
    tipo: feriado?.tipo || "nacional",
    recurrente: feriado?.recurrente || false,
    observaciones: feriado?.observaciones || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await updateFeriado(feriado.id, form);
      } else {
        await createFeriado(form);
      }
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
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? "Editar Feriado" : "Nuevo Feriado"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              placeholder="Ej: Día de la Independencia"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Fecha *</label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Tipo *</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                <option value="nacional">Feriado Nacional</option>
                <option value="empresa">Feriado de Empresa</option>
                <option value="regional">Feriado Regional</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="recurrente"
              checked={form.recurrente}
              onChange={handleChange}
              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-200"
            />
            <span className="text-xs text-slate-600">Se repite cada año (solo mes y día)</span>
          </label>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Observaciones</label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50">
              {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear Feriado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Horario Laboral ───────────────────────────────────

function HorarioModal({ horario, departamentos, onClose, onSuccess }) {
  const isEdit = !!horario;
  const { handleError } = useErrorHandler();

  const [form, setForm] = useState({
    nombre: horario?.nombre || "",
    departamento: horario?.departamento || "",
    hora_entrada: horario?.hora_entrada?.slice(0, 5) || "08:00",
    hora_salida: horario?.hora_salida?.slice(0, 5) || "17:00",
    tolerancia_entrada_minutos: horario?.tolerancia_entrada_minutos ?? 10,
    tolerancia_salida_minutos: horario?.tolerancia_salida_minutos ?? 10,
    lunes: horario?.lunes ?? true,
    martes: horario?.martes ?? true,
    miercoles: horario?.miercoles ?? true,
    jueves: horario?.jueves ?? true,
    viernes: horario?.viernes ?? true,
    sabado: horario?.sabado ?? true,
    domingo: horario?.domingo ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        departamento: form.departamento || null,
        tolerancia_entrada_minutos: parseInt(form.tolerancia_entrada_minutos),
        tolerancia_salida_minutos: parseInt(form.tolerancia_salida_minutos),
      };
      if (isEdit) {
        await updateHorario(horario.id, payload);
      } else {
        await createHorario(payload);
      }
      onSuccess();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const DIAS = [
    { key: "lunes", label: "Lunes" },
    { key: "martes", label: "Martes" },
    { key: "miercoles", label: "Miércoles" },
    { key: "jueves", label: "Jueves" },
    { key: "viernes", label: "Viernes" },
    { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? "Editar Horario" : "Nuevo Horario Laboral"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Horario Administrativo"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Departamento</label>
              <select
                name="departamento"
                value={form.departamento}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                <option value="">Global (aplica a todos)</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Hora Entrada *</label>
              <input
                type="time"
                name="hora_entrada"
                value={form.hora_entrada}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Hora Salida *</label>
              <input
                type="time"
                name="hora_salida"
                value={form.hora_salida}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Tolerancia Entrada (min)</label>
              <input
                type="number"
                name="tolerancia_entrada_minutos"
                value={form.tolerancia_entrada_minutos}
                onChange={handleChange}
                min={0}
                max={60}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Tolerancia Salida (min)</label>
              <input
                type="number"
                name="tolerancia_salida_minutos"
                value={form.tolerancia_salida_minutos}
                onChange={handleChange}
                min={0}
                max={60}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>

          {/* Días laborables */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-2">Días Laborables</label>
            <div className="flex flex-wrap gap-2">
              {DIAS.map((dia) => (
                <label
                  key={dia.key}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer transition-all border ${
                    form[dia.key]
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    name={dia.key}
                    checked={form[dia.key]}
                    onChange={handleChange}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                  />
                  <span className="text-xs font-medium">{dia.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50">
              {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear Horario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
