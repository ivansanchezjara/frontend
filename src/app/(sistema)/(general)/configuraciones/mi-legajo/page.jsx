"use client";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Clock,
  CalendarDays,
  DollarSign,
  User,
  FileText,
  Plus,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { PageHeader, LoadingScreen, EmptyState } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getAsistencias,
  getAusencias,
  createAusencia,
  getLiquidaciones,
  descargarReciboSueldo,
  descargarReporteAsistencia,
} from "@/services/apis/rrhh";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import Link from "next/link";

const TABS = [
  { id: "asistencia", label: "Mi Asistencia", icon: Clock },
  { id: "ausencias", label: "Mis Ausencias", icon: CalendarDays },
  { id: "liquidaciones", label: "Mis Recibos", icon: DollarSign },
];

export default function MiLegajoPage() {
  const [activeTab, setActiveTab] = useState("asistencia");

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Mi Legajo"
        subtitle={
          <>
            <User size={12} /> Autoservicio del empleado
          </>
        }
        subtitleClassName="text-amber-600"
        breadcrumbs={[
          { label: "Configuraciones", href: "/configuraciones" },
          { label: "Mi Legajo" },
        ]}
      />

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8">
        <div className="max-w-[1200px] mx-auto flex gap-1 overflow-x-auto py-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-amber-100 text-amber-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "asistencia" && <MiAsistencia />}
        {activeTab === "ausencias" && <MisAusencias />}
        {activeTab === "liquidaciones" && <MisLiquidaciones />}
      </div>
    </div>
  );
}

// ─── Mi Asistencia ──────────────────────────────────────────────

function MiAsistencia() {
  const [mes, setMes] = useState(() => (new Date().getMonth() + 1).toString());
  const [anio, setAnio] = useState(() => new Date().getFullYear().toString());

  const {
    data: asistenciasData,
    loading,
    execute: fetchAsistencias,
  } = useApi(getAsistencias, {
    auto: false,
    initialData: { results: [] },
  });

  useEffect(() => {
    const primerDia = `${anio}-${mes.padStart(2, "0")}-01`;
    const ultimoDia = new Date(parseInt(anio), parseInt(mes), 0);
    const ultimoDiaStr = `${anio}-${mes.padStart(2, "0")}-${String(ultimoDia.getDate()).padStart(2, "0")}`;
    fetchAsistencias({ fecha_desde: primerDia, fecha_hasta: ultimoDiaStr, page_size: 50 });
  }, [mes, anio]);

  const asistencias = asistenciasData?.results || [];
  const tardanzas = asistencias.filter((a) => a.llegada_tardia).length;
  const horasTotales = asistencias.reduce((sum, a) => sum + parseFloat(a.horas_trabajadas || 0), 0);

  const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Mi Asistencia</h2>
        <div className="flex items-center gap-3">
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
          >
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white w-20"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] text-slate-400 uppercase font-medium">Días Registrados</p>
          <p className="text-xl font-bold text-slate-800">{asistencias.length}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] text-slate-400 uppercase font-medium">Tardanzas</p>
          <p className="text-xl font-bold text-red-600">{tardanzas}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] text-slate-400 uppercase font-medium">Horas Totales</p>
          <p className="text-xl font-bold text-emerald-700">{horasTotales.toFixed(1)}h</p>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <LoadingScreen message="Cargando asistencia..." />
      ) : asistencias.length === 0 ? (
        <EmptyState icon="⏰" title="Sin registros" description="No hay registros de asistencia para este período." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Fecha</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Entrada</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Salida</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Horas</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map((a) => (
                <tr key={a.id} className="border-b border-slate-50">
                  <td className="px-4 py-2.5 text-slate-700 font-medium">{a.fecha}</td>
                  <td className="px-4 py-2.5 text-center text-emerald-600">{a.hora_entrada?.slice(0, 5) || "—"}</td>
                  <td className="px-4 py-2.5 text-center text-red-500">{a.hora_salida?.slice(0, 5) || "—"}</td>
                  <td className="px-4 py-2.5 text-center text-slate-600 font-mono">{a.horas_trabajadas ? `${a.horas_trabajadas}h` : "—"}</td>
                  <td className="px-4 py-2.5 text-center">
                    {a.llegada_tardia ? (
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold">Tardía</span>
                    ) : a.hora_entrada && a.hora_salida ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">OK</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Mis Ausencias ──────────────────────────────────────────────

function MisAusencias() {
  const [showSolicitar, setShowSolicitar] = useState(false);
  const { handleError } = useErrorHandler();

  const {
    data: ausenciasData,
    loading,
    execute: fetchAusencias,
  } = useApi(getAusencias, {
    auto: true,
    initialData: { results: [] },
  });

  const ausencias = ausenciasData?.results || [];

  const ESTADO_ICONS = {
    pendiente: <AlertCircle size={14} className="text-amber-500" />,
    aprobada: <CheckCircle2 size={14} className="text-emerald-500" />,
    rechazada: <XCircle size={14} className="text-red-500" />,
  };

  const ESTADO_COLORS = {
    pendiente: "bg-amber-100 text-amber-700",
    aprobada: "bg-emerald-100 text-emerald-700",
    rechazada: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Mis Solicitudes de Ausencia</h2>
        <button
          onClick={() => setShowSolicitar(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Solicitar Ausencia
        </button>
      </div>

      {/* Info */}
      <div className="bg-amber-50 rounded-xl p-4 text-xs text-amber-700 flex items-start gap-2">
        <AlertCircle size={14} className="shrink-0 mt-0.5" />
        <p>Las solicitudes quedan en estado <strong>Pendiente</strong> hasta que RRHH las apruebe o rechace. Podés adjuntar justificativos al crear la solicitud.</p>
      </div>

      {loading ? (
        <LoadingScreen message="Cargando solicitudes..." />
      ) : ausencias.length === 0 ? (
        <EmptyState icon="🏖️" title="Sin solicitudes" description="No tenés ausencias registradas." />
      ) : (
        <div className="space-y-3">
          {ausencias.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {ESTADO_ICONS[a.estado]}
                  <span className="text-sm font-bold text-slate-800">{a.tipo_display}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ESTADO_COLORS[a.estado] || ""}`}>
                    {a.estado_display || a.estado}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{a.dias} día{a.dias !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span>Desde: {a.fecha_inicio}</span>
                <span>Hasta: {a.fecha_fin}</span>
              </div>
              {a.motivo && <p className="mt-2 text-xs text-slate-500 italic">{a.motivo}</p>}
              {a.observaciones && a.estado === "rechazada" && (
                <p className="mt-1 text-xs text-red-500">Motivo rechazo: {a.observaciones}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showSolicitar && (
        <SolicitarAusenciaModal
          onClose={() => setShowSolicitar(false)}
          onSuccess={() => { setShowSolicitar(false); fetchAusencias(); }}
        />
      )}
    </div>
  );
}

// ─── Modal solicitar ausencia ───────────────────────────────────

function SolicitarAusenciaModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    tipo: "vacaciones",
    fecha_inicio: "",
    fecha_fin: "",
    motivo: "",
  });
  const [saving, setSaving] = useState(false);
  const { handleError } = useErrorHandler();

  const TIPO_OPTIONS = [
    { value: "vacaciones", label: "Vacaciones" },
    { value: "permiso_personal", label: "Permiso Personal" },
    { value: "licencia_medica", label: "Licencia Médica" },
    { value: "maternidad", label: "Licencia por Maternidad" },
    { value: "paternidad", label: "Licencia por Paternidad" },
    { value: "duelo", label: "Licencia por Duelo" },
    { value: "capacitacion", label: "Capacitación" },
    { value: "otro", label: "Otro" },
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const dias = form.fecha_inicio && form.fecha_fin
    ? Math.max(0, Math.ceil((new Date(form.fecha_fin) - new Date(form.fecha_inicio)) / 86400000) + 1)
    : 0;

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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Solicitar Ausencia</h2>
          <p className="text-xs text-slate-500">Tu solicitud será revisada por RRHH</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Tipo de Ausencia *</label>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              {TIPO_OPTIONS.map((t) => (
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
            <p className="text-xs text-amber-600 font-medium">📅 {dias} día{dias !== 1 ? "s" : ""}</p>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Motivo / Justificación</label>
            <textarea
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
              rows={3}
              placeholder="Describí el motivo de tu solicitud..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50">
              {saving ? "Enviando..." : "Enviar Solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Mis Liquidaciones ──────────────────────────────────────────

function MisLiquidaciones() {
  const { handleError } = useErrorHandler();

  const {
    data: liquidacionesData,
    loading,
  } = useApi(getLiquidaciones, {
    auto: true,
    initialData: { results: [] },
  });

  const liquidaciones = liquidacionesData?.results || [];

  const MESES = [
    "", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];

  const ESTADO_COLORS = {
    borrador: "bg-slate-100 text-slate-600",
    aprobada: "bg-emerald-100 text-emerald-700",
    pagada: "bg-blue-100 text-blue-700",
    anulada: "bg-red-100 text-red-700",
  };

  const handleDescargar = async (id) => {
    try {
      await descargarReciboSueldo(id);
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Mis Recibos de Sueldo</h2>

      {loading ? (
        <LoadingScreen message="Cargando liquidaciones..." />
      ) : liquidaciones.length === 0 ? (
        <EmptyState icon="💰" title="Sin recibos" description="Aún no tenés liquidaciones generadas." />
      ) : (
        <div className="space-y-3">
          {liquidaciones.map((l) => (
            <div key={l.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-800">
                    {MESES[l.periodo_mes]} {l.periodo_anio}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ESTADO_COLORS[l.estado] || ""}`}>
                    {l.estado_display || l.estado}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>Base: USD {Number(l.salario_base_usd).toLocaleString("es-PY", { minimumFractionDigits: 2 })}</span>
                  <span>Neto: <strong className="text-emerald-700">USD {Number(l.neto_usd).toLocaleString("es-PY", { minimumFractionDigits: 2 })}</strong></span>
                </div>
                {l.fecha_pago && <p className="text-[10px] text-slate-400 mt-1">Pagado: {l.fecha_pago}</p>}
              </div>
              <button
                onClick={() => handleDescargar(l.id)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                <Download size={14} />
                PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
