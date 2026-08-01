"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Wallet, Filter, User, Calendar, Clock, ArrowRight, CircleDot } from "lucide-react";
import {
  EmptyState,
  LoadingScreen,
  PageHeader,
  Pagination,
  Button,
  Badge,
  Text,
  Modal,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { getSesiones } from "@/services/apis/caja";
import { cn } from "@/lib/utils";
import AbrirCajaForm from "@/components/caja/AbrirCajaForm";

// ─── Configuración ──────────────────────────────────────────────

const ESTADOS_SESION = [
  { value: "", label: "Todos" },
  { value: "abierta", label: "Abierta" },
  { value: "cerrada", label: "Cerrada" },
];

const FILTER_SCHEMA = {
  cajero: "",
  estado: "",
  fecha_desde: "",
  fecha_hasta: "",
  page: 1,
};

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMonto(valor, moneda) {
  if (valor == null) return "—";
  const num = Number(valor);
  if (moneda === "PYG") return `₲ ${num.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;
  if (moneda === "USD") return `$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (moneda === "BRL") return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return String(valor);
}

function formatDiferencia(valor, moneda) {
  if (valor == null || Number(valor) === 0) return "—";
  const num = Number(valor);
  const prefix = num > 0 ? "+" : "";
  if (moneda === "PYG") return `${prefix}₲ ${num.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;
  if (moneda === "USD") return `${prefix}$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  if (moneda === "BRL") return `${prefix}R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  return `${prefix}${valor}`;
}

function getDuracion(apertura) {
  if (!apertura) return "";
  const mins = Math.floor((Date.now() - new Date(apertura).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
}

// ─── Componente: Tarjeta de sesión abierta (destacada) ──────────

function SesionAbiertaCard({ sesion }) {
  const saldos = sesion.saldos_teoricos || {};
  const duracion = getDuracion(sesion.abierta_at);

  return (
    <Link
      href={`/caja/sesiones/${sesion.id}`}
      className="block bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200 p-5 hover:shadow-md hover:border-emerald-300 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CircleDot size={14} className="text-emerald-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
            Sesión Abierta
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600">
          <Clock size={12} />
          <span className="font-semibold">{duracion}</span>
        </div>
      </div>

      <p className="text-sm font-bold text-slate-800 mb-1">{sesion.cajero_nombre}</p>
      <p className="text-xs text-slate-400 mb-3">Abierta: {formatFecha(sesion.abierta_at)}</p>

      {/* Saldos teóricos */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/80 rounded-lg p-2.5 border border-emerald-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase">PYG</p>
          <p className="text-sm font-black text-slate-800">
            {formatMonto(saldos.PYG, "PYG")}
          </p>
        </div>
        <div className="bg-white/80 rounded-lg p-2.5 border border-emerald-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase">USD</p>
          <p className="text-sm font-black text-slate-800">
            {formatMonto(saldos.USD, "USD")}
          </p>
        </div>
        <div className="bg-white/80 rounded-lg p-2.5 border border-emerald-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase">BRL</p>
          <p className="text-sm font-black text-slate-800">
            {formatMonto(saldos.BRL, "BRL")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end mt-3 text-xs text-emerald-600 font-semibold group-hover:text-emerald-700">
        Ver detalle <ArrowRight size={12} className="ml-1" />
      </div>
    </Link>
  );
}

// ─── Componente FilterDropdown ──────────────────────────────────

function FilterDropdown({ value, onChange, icon: Icon, label, options }) {
  const isActive = value !== "";
  return (
    <div className="relative flex items-center gap-1.5">
      <Icon className={cn("w-3.5 h-3.5", isActive ? "text-blue-600" : "text-slate-400")} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "appearance-none text-xs font-semibold rounded-lg px-2 py-1.5 pr-6 cursor-pointer",
          "border transition-all outline-none",
          isActive
            ? "bg-blue-50 border-blue-200 text-blue-700"
            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
        )}
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {label}: {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2">
        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

// ─── Contenido Principal ────────────────────────────────────────

function SesionesContent() {
  const { filters, setFilter, resetFilters, page, setPage } = useUrlFilters(FILTER_SCHEMA);

  const { data: sesionesData, loading, execute: fetchSesiones } = useApi(getSesiones);

  const sesiones = sesionesData?.results || [];
  const count = sesionesData?.count || 0;
  const pageSize = 24;

  const [mostrarAbrirCaja, setMostrarAbrirCaja] = useState(false);
  const [cajeroLocal, setCajeroLocal] = useState(filters.cajero);
  const cajeroDebounced = useDebounce(cajeroLocal, 400);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Sincronizar debounced → URL
  useEffect(() => {
    if (cajeroDebounced !== filters.cajero) {
      setFilter("cajero", cajeroDebounced);
    }
  }, [cajeroDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setCajeroLocal(filters.cajero); }, [filters.cajero]);

  // Cargar sesiones
  useEffect(() => {
    const params = { page: filters.page };
    if (filters.cajero) params.cajero = filters.cajero;
    if (filters.estado) params.estado = filters.estado;
    if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde;
    if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta;
    fetchSesiones(params).then(() => setHasLoadedOnce(true));
  }, [fetchSesiones, filters.page, filters.cajero, filters.estado, filters.fecha_desde, filters.fecha_hasta]);

  if (loading && !hasLoadedOnce) return <LoadingScreen texto="Cargando sesiones de caja..." />;

  const hayFiltrosActivos = filters.cajero || filters.estado || filters.fecha_desde || filters.fecha_hasta;

  const limpiarFiltros = () => {
    setCajeroLocal("");
    resetFilters();
  };

  const handleAbrirCajaSuccess = () => {
    setMostrarAbrirCaja(false);
    fetchSesiones({ page: 1 });
  };

  // Separar sesiones abiertas de cerradas
  const sesionesAbiertas = sesiones.filter((s) => s.estado === "abierta");
  const sesionesHistorial = sesiones.filter((s) => s.estado !== "abierta");

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Caja y Facturación", href: "/caja" },
          { label: "Sesiones de Caja" },
        ]}
        subtitle="Control de apertura, cierre y arqueo"
        subtitleClassName="text-purple-600"
      >
        <Button
          variant="primary"
          size="md"
          icon={Wallet}
          className="rounded-xl font-bold text-xs shadow-lg shadow-blue-100 cursor-pointer"
          onClick={() => setMostrarAbrirCaja(true)}
        >
          ABRIR CAJA
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Sesiones abiertas destacadas */}
          {sesionesAbiertas.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Cajas activas ahora
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sesionesAbiertas.map((sesion) => (
                  <SesionAbiertaCard key={sesion.id} sesion={sesion} />
                ))}
              </div>
            </div>
          )}

          {/* Barra de filtros */}
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <FilterDropdown
                  value={filters.estado}
                  onChange={(val) => setFilter("estado", val)}
                  icon={Filter}
                  label="Estado"
                  options={ESTADOS_SESION}
                />

                <div className="relative flex items-center gap-1.5">
                  <User className={cn("w-3.5 h-3.5", cajeroLocal ? "text-blue-600" : "text-slate-400")} />
                  <input
                    type="text"
                    value={cajeroLocal}
                    onChange={(e) => setCajeroLocal(e.target.value)}
                    placeholder="Cajero..."
                    className={cn(
                      "text-xs font-semibold rounded-lg px-2 py-1.5 w-36",
                      "border transition-all outline-none",
                      cajeroLocal
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 placeholder:text-slate-400"
                    )}
                    aria-label="Filtrar por cajero"
                  />
                </div>

                <div className="relative flex items-center gap-1.5">
                  <Calendar className={cn("w-3.5 h-3.5", filters.fecha_desde ? "text-blue-600" : "text-slate-400")} />
                  <input
                    type="date"
                    value={filters.fecha_desde}
                    onChange={(e) => setFilter("fecha_desde", e.target.value)}
                    className={cn(
                      "text-xs font-semibold rounded-lg px-2 py-1.5 border transition-all outline-none",
                      filters.fecha_desde ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-600"
                    )}
                    aria-label="Fecha desde"
                  />
                  <span className="text-xs text-slate-300">—</span>
                  <input
                    type="date"
                    value={filters.fecha_hasta}
                    onChange={(e) => setFilter("fecha_hasta", e.target.value)}
                    className={cn(
                      "text-xs font-semibold rounded-lg px-2 py-1.5 border transition-all outline-none",
                      filters.fecha_hasta ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-600"
                    )}
                    aria-label="Fecha hasta"
                  />
                </div>

                {hayFiltrosActivos && (
                  <button
                    onClick={limpiarFiltros}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <Text variant="label" className="flex items-center gap-2 text-slate-400 whitespace-nowrap">
                <span className={cn("w-1.5 h-1.5 rounded-full", count > 0 ? "bg-blue-500" : "bg-slate-300")} />
                {count} {count === 1 ? "sesión" : "sesiones"}
              </Text>
            </div>
          </div>

          {/* Tabla de historial */}
          <div className={cn("transition-opacity duration-300", loading ? "opacity-50 pointer-events-none" : "opacity-100")}>
            {sesionesHistorial.length === 0 && sesionesAbiertas.length === 0 ? (
              <EmptyState
                titulo={hayFiltrosActivos ? "Sin resultados" : "No hay sesiones"}
                descripcion={hayFiltrosActivos
                  ? "Intentá con otros términos o cambiá los filtros."
                  : "Abrí tu primera sesión de caja para empezar a operar."
                }
                textoBoton={hayFiltrosActivos ? "Limpiar filtros" : undefined}
                onAction={hayFiltrosActivos ? limpiarFiltros : undefined}
              />
            ) : sesionesHistorial.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Historial de sesiones cerradas
                  </h3>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500">
                      <th className="py-3 pl-5 pr-4 text-[10px] font-black uppercase tracking-widest">Cajero</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest">Apertura</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest">Cierre</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-right">Dif. PYG</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-right hidden lg:table-cell">Dif. USD</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-right hidden lg:table-cell">Dif. BRL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sesionesHistorial.map((sesion) => (
                      <tr key={sesion.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pl-5 pr-4">
                          <Link
                            href={`/caja/sesiones/${sesion.id}`}
                            className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors"
                          >
                            {sesion.cajero_nombre || "—"}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-500">{formatFecha(sesion.abierta_at)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-500">{formatFecha(sesion.cerrada_at)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn("text-xs font-semibold",
                            Number(sesion.diferencia_pyg) > 0 ? "text-green-600" :
                            Number(sesion.diferencia_pyg) < 0 ? "text-red-600" : "text-slate-400"
                          )}>
                            {formatDiferencia(sesion.diferencia_pyg, "PYG")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right hidden lg:table-cell">
                          <span className={cn("text-xs font-semibold",
                            Number(sesion.diferencia_usd) > 0 ? "text-green-600" :
                            Number(sesion.diferencia_usd) < 0 ? "text-red-600" : "text-slate-400"
                          )}>
                            {formatDiferencia(sesion.diferencia_usd, "USD")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right hidden lg:table-cell">
                          <span className={cn("text-xs font-semibold",
                            Number(sesion.diferencia_brl) > 0 ? "text-green-600" :
                            Number(sesion.diferencia_brl) < 0 ? "text-red-600" : "text-slate-400"
                          )}>
                            {formatDiferencia(sesion.diferencia_brl, "BRL")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paginación */}
          {count > pageSize && (
            <Pagination
              count={count}
              pageSize={pageSize}
              currentPage={page}
              onPageChange={setPage}
            />
          )}
        </div>
      </main>

      {/* Modal Abrir Caja */}
      <Modal
        open={mostrarAbrirCaja}
        onClose={() => setMostrarAbrirCaja(false)}
        title="Abrir Sesión de Caja"
        size="sm"
      >
        <div className="p-6">
          <AbrirCajaForm onSuccess={handleAbrirCajaSuccess} />
        </div>
      </Modal>
    </div>
  );
}

// ─── Página con Suspense ────────────────────────────────────────

export default function SesionesPage() {
  return (
    <Suspense fallback={<LoadingScreen texto="Cargando sesiones de caja..." />}>
      <SesionesContent />
    </Suspense>
  );
}
