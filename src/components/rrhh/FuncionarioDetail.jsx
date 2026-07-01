"use client";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Pencil,
  UserX,
  UserCheck,
  FileText,
  Calendar,
  Briefcase,
  Clock,
  AlertTriangle,
  Star,
  DollarSign,
} from "lucide-react";
import { LoadingScreen, EmptyState } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getFuncionario,
  getContratos,
  getAusencias,
  getAsistencias,
  getEvaluaciones,
  getSanciones,
  desactivarFuncionario,
  reactivarFuncionario,
} from "@/services/apis/rrhh";
import { useErrorHandler } from "@/hooks/useErrorHandler";

const TABS = [
  { id: "general", label: "General", icon: FileText },
  { id: "contratos", label: "Contratos", icon: Briefcase },
  { id: "ausencias", label: "Ausencias", icon: Calendar },
  { id: "asistencia", label: "Asistencia", icon: Clock },
  { id: "evaluaciones", label: "Evaluaciones", icon: Star },
  { id: "sanciones", label: "Sanciones", icon: AlertTriangle },
];

const estadoColors = {
  activo: "bg-emerald-100 text-emerald-700",
  inactivo: "bg-slate-100 text-slate-600",
  licencia: "bg-amber-100 text-amber-700",
  desvinculado: "bg-red-100 text-red-700",
};

export default function FuncionarioDetail({ funcionarioId, onBack, onRefresh }) {
  const [activeTab, setActiveTab] = useState("general");
  const { handleError } = useErrorHandler();

  const { data: funcionario, loading, execute: fetchFuncionario } = useApi(getFuncionario, {
    auto: false,
  });

  const { data: contratosData, execute: fetchContratos } = useApi(getContratos, {
    auto: false,
    initialData: { results: [] },
  });

  const { data: ausenciasData, execute: fetchAusencias } = useApi(getAusencias, {
    auto: false,
    initialData: { results: [] },
  });

  const { data: asistenciasData, execute: fetchAsistencias } = useApi(getAsistencias, {
    auto: false,
    initialData: { results: [] },
  });

  const { data: evaluacionesData, execute: fetchEvaluaciones } = useApi(getEvaluaciones, {
    auto: false,
    initialData: { results: [] },
  });

  const { data: sancionesData, execute: fetchSanciones } = useApi(getSanciones, {
    auto: false,
    initialData: { results: [] },
  });

  useEffect(() => {
    if (funcionarioId) {
      fetchFuncionario(funcionarioId);
      fetchContratos({ funcionario: funcionarioId });
      fetchAusencias({ funcionario: funcionarioId });
      fetchAsistencias({ funcionario: funcionarioId, page_size: 15 });
      fetchEvaluaciones({ funcionario: funcionarioId });
      fetchSanciones({ funcionario: funcionarioId });
    }
  }, [funcionarioId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDesactivar = async () => {
    try {
      await desactivarFuncionario(funcionarioId);
      fetchFuncionario(funcionarioId);
      onRefresh?.();
    } catch (err) {
      handleError(err);
    }
  };

  const handleReactivar = async () => {
    try {
      await reactivarFuncionario(funcionarioId);
      fetchFuncionario(funcionarioId);
      onRefresh?.();
    } catch (err) {
      handleError(err);
    }
  };

  if (loading || !funcionario) {
    return <LoadingScreen message="Cargando funcionario..." />;
  }

  const contratos = contratosData?.results || contratosData || [];
  const ausencias = ausenciasData?.results || ausenciasData || [];
  const asistencias = asistenciasData?.results || asistenciasData || [];
  const evaluaciones = evaluacionesData?.results || evaluacionesData || [];
  const sanciones = sancionesData?.results || sancionesData || [];

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-500" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800">
              {funcionario.nombre} {funcionario.apellido}
            </h1>
            <p className="text-sm text-slate-500">
              {funcionario.cargo_nombre} · {funcionario.departamento_nombre}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${estadoColors[funcionario.estado] || "bg-slate-100"}`}>
            {funcionario.estado_display || funcionario.estado}
          </span>
          <div className="flex gap-2">
            {funcionario.activo ? (
              <button
                onClick={handleDesactivar}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <UserX size={14} /> Desactivar
              </button>
            ) : (
              <button
                onClick={handleReactivar}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <UserCheck size={14} /> Reactivar
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-amber-100 text-amber-700"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {activeTab === "general" && (
            <TabGeneral funcionario={funcionario} />
          )}
          {activeTab === "contratos" && (
            <TabContratos contratos={contratos} />
          )}
          {activeTab === "ausencias" && (
            <TabAusencias ausencias={ausencias} />
          )}
          {activeTab === "asistencia" && (
            <TabAsistencia asistencias={asistencias} />
          )}
          {activeTab === "evaluaciones" && (
            <TabEvaluaciones evaluaciones={evaluaciones} />
          )}
          {activeTab === "sanciones" && (
            <TabSanciones sanciones={sanciones} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Información General ───────────────────────────────────

function TabGeneral({ funcionario }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InfoCard title="Datos Personales">
        <InfoRow label="Nombre Completo" value={`${funcionario.nombre} ${funcionario.apellido}`} />
        <InfoRow label="Cédula" value={funcionario.cedula} />
        <InfoRow label="Fecha de Nacimiento" value={funcionario.fecha_nacimiento} />
        <InfoRow label="Sexo" value={funcionario.sexo_display} />
        <InfoRow label="Estado Civil" value={funcionario.estado_civil_display} />
        <InfoRow label="Nacionalidad" value={funcionario.nacionalidad} />
      </InfoCard>

      <InfoCard title="Contacto">
        <InfoRow label="Teléfono" value={funcionario.telefono} />
        <InfoRow label="Correo Personal" value={funcionario.correo_personal} />
        <InfoRow label="Correo Corporativo" value={funcionario.correo_corporativo} />
        <InfoRow label="Ciudad" value={funcionario.ciudad} />
        <InfoRow label="Barrio" value={funcionario.barrio} />
        <InfoRow label="Dirección" value={funcionario.direccion} />
      </InfoCard>

      <InfoCard title="Datos Laborales">
        <InfoRow label="Departamento" value={funcionario.departamento_nombre} />
        <InfoRow label="Cargo" value={funcionario.cargo_nombre} />
        <InfoRow label="Fecha de Ingreso" value={funcionario.fecha_ingreso} />
        <InfoRow label="Fecha Desvinculación" value={funcionario.fecha_desvinculacion || "—"} />
        <InfoRow label="Estado" value={funcionario.estado_display} />
        <InfoRow label="Usuario Sistema" value={funcionario.usuario_nombre || "Sin vincular"} />
      </InfoCard>

      <InfoCard title="Datos Bancarios y Seguridad Social">
        <InfoRow label="Banco" value={funcionario.banco || "—"} />
        <InfoRow label="Nro. Cuenta" value={funcionario.numero_cuenta || "—"} />
        <InfoRow label="Tipo Cuenta" value={funcionario.tipo_cuenta || "—"} />
        <InfoRow label="Nro. IPS" value={funcionario.numero_ips || "—"} />
      </InfoCard>

      <InfoCard title="Contacto de Emergencia">
        <InfoRow label="Nombre" value={funcionario.emergencia_nombre || "—"} />
        <InfoRow label="Teléfono" value={funcionario.emergencia_telefono || "—"} />
        <InfoRow label="Relación" value={funcionario.emergencia_relacion || "—"} />
      </InfoCard>

      {funcionario.notas && (
        <InfoCard title="Notas">
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{funcionario.notas}</p>
        </InfoCard>
      )}
    </div>
  );
}

// ─── Tab: Contratos ─────────────────────────────────────────────

function TabContratos({ contratos }) {
  if (contratos.length === 0) {
    return <EmptyState icon="📄" title="Sin contratos" description="No hay contratos registrados para este funcionario." />;
  }
  return (
    <div className="space-y-3">
      {contratos.map((c) => (
        <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-amber-600" />
              <span className="text-sm font-semibold text-slate-800">{c.tipo_contrato_display}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.vigente ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {c.vigente ? "Vigente" : "Finalizado"}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-500">
            <div><span className="font-medium">Inicio:</span> {c.fecha_inicio}</div>
            <div><span className="font-medium">Fin:</span> {c.fecha_fin || "Indefinido"}</div>
            <div><span className="font-medium">Salario:</span> USD {Number(c.salario_mensual_usd).toLocaleString()}</div>
            <div><span className="font-medium">Horas/sem:</span> {c.horas_semanales}</div>
          </div>
          {c.descripcion && <p className="mt-2 text-xs text-slate-400">{c.descripcion}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Ausencias ─────────────────────────────────────────────

function TabAusencias({ ausencias }) {
  if (ausencias.length === 0) {
    return <EmptyState icon="🏖️" title="Sin ausencias" description="No hay registros de ausencia." />;
  }

  const estadoAusenciaColors = {
    pendiente: "bg-amber-100 text-amber-700",
    aprobada: "bg-emerald-100 text-emerald-700",
    rechazada: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-3">
      {ausencias.map((a) => (
        <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-800">{a.tipo_display}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${estadoAusenciaColors[a.estado] || "bg-slate-100"}`}>
              {a.estado_display || a.estado}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-500">
            <div><span className="font-medium">Desde:</span> {a.fecha_inicio}</div>
            <div><span className="font-medium">Hasta:</span> {a.fecha_fin}</div>
            <div><span className="font-medium">Días:</span> {a.dias}</div>
            {a.aprobado_por_nombre && <div><span className="font-medium">Aprobó:</span> {a.aprobado_por_nombre}</div>}
          </div>
          {a.motivo && <p className="mt-2 text-xs text-slate-400">{a.motivo}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Asistencia ────────────────────────────────────────────

function TabAsistencia({ asistencias }) {
  if (asistencias.length === 0) {
    return <EmptyState icon="⏰" title="Sin registros" description="No hay registros de asistencia." />;
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="text-left px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Fecha</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Entrada</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Salida</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Horas</th>
            <th className="text-center px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Tardanza</th>
          </tr>
        </thead>
        <tbody>
          {asistencias.map((a) => (
            <tr key={a.id} className="border-b border-slate-50">
              <td className="px-4 py-2.5 text-slate-700 font-medium">{a.fecha}</td>
              <td className="px-4 py-2.5 text-slate-600">{a.hora_entrada || "—"}</td>
              <td className="px-4 py-2.5 text-slate-600">{a.hora_salida || "—"}</td>
              <td className="px-4 py-2.5 text-slate-600">{a.horas_trabajadas || "—"}</td>
              <td className="px-4 py-2.5 text-center">
                {a.llegada_tardia && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold">Tardía</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab: Evaluaciones ──────────────────────────────────────────

function TabEvaluaciones({ evaluaciones }) {
  if (evaluaciones.length === 0) {
    return <EmptyState icon="⭐" title="Sin evaluaciones" description="No hay evaluaciones de desempeño registradas." />;
  }
  return (
    <div className="space-y-4">
      {evaluaciones.map((ev) => (
        <div key={ev.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Período: {ev.periodo}</h3>
              <p className="text-xs text-slate-400">Evaluado el {ev.fecha_evaluacion} por {ev.evaluador_nombre}</p>
            </div>
            <div className="bg-amber-50 px-3 py-1.5 rounded-lg">
              <span className="text-lg font-bold text-amber-700">{ev.promedio?.toFixed(1) || "—"}</span>
              <span className="text-xs text-amber-500 ml-1">/10</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <CriterioBar label="Puntualidad" value={ev.puntualidad} />
            <CriterioBar label="Calidad" value={ev.calidad_trabajo} />
            <CriterioBar label="Equipo" value={ev.trabajo_equipo} />
            <CriterioBar label="Iniciativa" value={ev.iniciativa} />
            <CriterioBar label="Comunicación" value={ev.comunicacion} />
            <CriterioBar label="Objetivos" value={ev.cumplimiento_objetivos} />
          </div>
          {(ev.fortalezas || ev.areas_mejora) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {ev.fortalezas && (
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <p className="font-semibold text-emerald-700 mb-1">Fortalezas</p>
                  <p className="text-emerald-600">{ev.fortalezas}</p>
                </div>
              )}
              {ev.areas_mejora && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="font-semibold text-amber-700 mb-1">Áreas de Mejora</p>
                  <p className="text-amber-600">{ev.areas_mejora}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Sanciones ─────────────────────────────────────────────

function TabSanciones({ sanciones }) {
  if (sanciones.length === 0) {
    return <EmptyState icon="✅" title="Sin sanciones" description="El funcionario no tiene sanciones registradas." />;
  }

  const tipoColors = {
    amonestacion_verbal: "bg-amber-100 text-amber-700",
    amonestacion_escrita: "bg-orange-100 text-orange-700",
    suspension: "bg-red-100 text-red-700",
    descuento: "bg-purple-100 text-purple-700",
    despido: "bg-red-200 text-red-800",
  };

  return (
    <div className="space-y-3">
      {sanciones.map((s) => (
        <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${tipoColors[s.tipo] || "bg-slate-100"}`}>
              {s.tipo_display}
            </span>
            <span className="text-xs text-slate-400">{s.fecha}</span>
          </div>
          <p className="text-sm text-slate-700 font-medium">{s.motivo}</p>
          {s.descripcion && <p className="mt-1 text-xs text-slate-500">{s.descripcion}</p>}
          <div className="mt-2 flex gap-4 text-xs text-slate-400">
            {s.dias_suspension && <span>Suspensión: {s.dias_suspension} días</span>}
            {s.monto_descuento_usd && <span>Descuento: USD {Number(s.monto_descuento_usd).toLocaleString()}</span>}
            <span>Aplicado por: {s.aplicado_por_nombre}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers UI ─────────────────────────────────────────────────

function InfoCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-700">{value || "—"}</span>
    </div>
  );
}

function CriterioBar({ label, value }) {
  const percentage = (value / 10) * 100;
  const color = value >= 7 ? "bg-emerald-500" : value >= 5 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium text-slate-500">{label}</span>
        <span className="text-[10px] font-bold text-slate-700">{value}/10</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
