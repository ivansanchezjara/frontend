"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Wallet, Filter, User, Calendar } from "lucide-react";
import {
  EmptyState,
  LoadingScreen,
  PageHeader,
  Pagination,
  Button,
  Badge,
  Text,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { getSesiones } from "@/services/apis/caja";
import { cn } from "@/lib/utils";
import AbrirCajaForm from "@/components/caja/AbrirCajaForm";

// ─── Configuración de estados ───────────────────────────────────

const ESTADOS_SESION = [
  { value: "", label: "Todos" },
  { value: "abierta", label: "Abierta" },
  { value: "cerrada", label: "Cerrada" },
];

const ESTADO_BADGE_MAP = {
  abierta: { variant: "success", label: "Abierta" },
  cerrada: { variant: "default", label: "Cerrada" },
};

const FILTER_SCHEMA = {
  cajero: "",
  estado: "",
  fecha_desde: "",
  fecha_hasta: "",
  page: 1,
};

// ─── Componente FilterDropdown ──────────────────────────────────

function FilterDropdown({ value, onChange, icon: Icon, label, options }) {
  const isActive = value !== "";
  return (
    <div className="relative flex items-center gap-1.5">
      <Icon
        className={cn(
          "w-3.5 h-3.5",
          isActive ? "text-blue-600" : "text-slate-400"
        )}
      />
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
        <svg
          className="w-3 h-3 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Componente EstadoBadge ─────────────────────────────────────

function EstadoBadge({ estado }) {
  const config = ESTADO_BADGE_MAP[estado] || {
    variant: "default",
    label: estado,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ─── Formateo de fechas ─────────────────────────────────────────

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

// ─── Formateo de diferencias ────────────────────────────────────

function formatDiferencia(valor, moneda) {
  if (valor == null || valor === 0) return "—";
  const num = Number(valor);
  const prefix = num > 0 ? "+" : "";
  if (moneda === "PYG") {
    return `${prefix}${num.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;
  }
  return `${prefix}${num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Contenido Principal ────────────────────────────────────────

function SesionesContent() {
  const { filters, setFilter, resetFilters, page, setPage } =
    useUrlFilters(FILTER_SCHEMA);

  const {
    data: sesionesData,
    loading,
    execute: fetchSesiones,
  } = useApi(getSesiones);

  const sesiones = sesionesData?.results || [];
  const count = sesionesData?.count || 0;
  const pageSize = 24;

  // Estado para mostrar/ocultar formulario de apertura
  const [mostrarAbrirCaja, setMostrarAbrirCaja] = useState(false);

  // Debounce para filtro de cajero (input de texto)
  const [cajeroLocal, setCajeroLocal] = useState(filters.cajero);
  const cajeroDebounced = useDebounce(cajeroLocal, 400);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Sincronizar debounced → URL
  useEffect(() => {
    if (cajeroDebounced !== filters.cajero) {
      setFilter("cajero", cajeroDebounced);
    }
  }, [cajeroDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar URL → input local
  useEffect(() => { setCajeroLocal(filters.cajero); }, [filters.cajero]); // eslint-disable-line

  // Cargar sesiones cuando cambian filtros en URL
  useEffect(() => {
    const params = { page: filters.page };
    if (filters.cajero) params.cajero = filters.cajero;
    if (filters.estado) params.estado = filters.estado;
    if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde;
    if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta;

    fetchSesiones(params).then(() => setHasLoadedOnce(true));
  }, [
    fetchSesiones,
    filters.page,
    filters.cajero,
    filters.estado,
    filters.fecha_desde,
    filters.fecha_hasta,
  ]);

  // Pantalla de carga inicial
  if (loading && !hasLoadedOnce)
    return <LoadingScreen texto="Cargando sesiones de caja..." />;

  const hayFiltrosActivos =
    filters.cajero !== "" ||
    filters.estado !== "" ||
    filters.fecha_desde !== "" ||
    filters.fecha_hasta !== "";

  const limpiarFiltros = () => {
    setCajeroLocal("");
    resetFilters();
  };

  const handleAbrirCajaSuccess = () => {
    setMostrarAbrirCaja(false);
    fetchSesiones({ page: 1 });
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      {/* HEADER */}
      <PageHeader
        title="Sesiones de Caja"
        subtitle={`Caja · ${count} sesiones registradas`}
        subtitleClassName="text-blue-600"
      >
        <Button
          variant="primary"
          size="md"
          icon={Wallet}
          className="rounded-xl font-bold text-xs shadow-lg shadow-blue-100 cursor-pointer"
          onClick={() => setMostrarAbrirCaja(!mostrarAbrirCaja)}
        >
          ABRIR CAJA
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* FORMULARIO ABRIR CAJA */}
          {mostrarAbrirCaja && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
              <h3 className="text-sm font-bold text-slate-700 mb-4">
                Abrir Nueva Sesión de Caja
              </h3>
              <AbrirCajaForm onSuccess={handleAbrirCajaSuccess} />
              <button
                type="button"
                onClick={() => setMostrarAbrirCaja(false)}
                className="mt-3 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* BARRA DE HERRAMIENTAS */}
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative z-20">
            {/* Filtros */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <FilterDropdown
                  value={filters.estado}
                  onChange={(val) => setFilter("estado", val)}
                  icon={Filter}
                  label="Estado"
                  options={ESTADOS_SESION}
                />

                {/* Filtro Cajero */}
                <div className="relative flex items-center gap-1.5">
                  <User
                    className={cn(
                      "w-3.5 h-3.5",
                      cajeroLocal ? "text-blue-600" : "text-slate-400"
                    )}
                  />
                  <input
                    type="text"
                    value={cajeroLocal}
                    onChange={(e) => setCajeroLocal(e.target.value)}
                    placeholder="Cajero..."
                    className={cn(
                      "text-xs font-semibold rounded-lg px-2 py-1.5 w-32",
                      "border transition-all outline-none",
                      cajeroLocal
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 placeholder:text-slate-400"
                    )}
                    aria-label="Filtrar por cajero"
                  />
                </div>

                {/* Filtro Fecha Desde */}
                <div className="relative flex items-center gap-1.5">
                  <Calendar
                    className={cn(
                      "w-3.5 h-3.5",
                      filters.fecha_desde ? "text-blue-600" : "text-slate-400"
                    )}
                  />
                  <input
                    type="date"
                    value={filters.fecha_desde}
                    onChange={(e) => setFilter("fecha_desde", e.target.value)}
                    className={cn(
                      "text-xs font-semibold rounded-lg px-2 py-1.5",
                      "border transition-all outline-none",
                      filters.fecha_desde
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                    aria-label="Fecha desde"
                  />
                </div>

                {/* Filtro Fecha Hasta */}
                <div className="relative flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-xs",
                      filters.fecha_hasta ? "text-blue-600" : "text-slate-400"
                    )}
                  >
                    —
                  </span>
                  <input
                    type="date"
                    value={filters.fecha_hasta}
                    onChange={(e) => setFilter("fecha_hasta", e.target.value)}
                    className={cn(
                      "text-xs font-semibold rounded-lg px-2 py-1.5",
                      "border transition-all outline-none",
                      filters.fecha_hasta
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                    aria-label="Fecha hasta"
                  />
                </div>
              </div>

              <Text
                variant="label"
                className="flex items-center gap-2 text-slate-400 whitespace-nowrap"
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    count > 0
                      ? "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]"
                      : "bg-slate-300"
                  )}
                />
                {count} {count === 1 ? "sesión" : "sesiones"}
              </Text>
            </div>
          </div>

          {/* CONTENIDO: TABLA */}
          <div
            className={cn(
              "transition-opacity duration-300",
              loading ? "opacity-50 pointer-events-none" : "opacity-100"
            )}
          >
            {sesiones.length === 0 ? (
              <EmptyState
                titulo={
                  hayFiltrosActivos ? "Sin resultados" : "No hay sesiones"
                }
                descripcion={
                  hayFiltrosActivos
                    ? "Intentá con otros términos o cambiá los filtros."
                    : "Abrí tu primera sesión de caja para empezar a operar."
                }
                textoBoton={hayFiltrosActivos ? "Limpiar filtros" : undefined}
                onAction={hayFiltrosActivos ? limpiarFiltros : undefined}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500">
                      <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">
                        Cajero
                      </th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">
                        Estado
                      </th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">
                        Apertura
                      </th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">
                        Cierre
                      </th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right">
                        Dif. PYG
                      </th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right hidden lg:table-cell">
                        Dif. USD
                      </th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right hidden lg:table-cell">
                        Dif. BRL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sesiones.map((sesion) => (
                      <tr
                        key={sesion.id}
                        className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3 pl-6 pr-4">
                          <Link
                            href={`/caja/sesiones/${sesion.id}`}
                            className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors"
                          >
                            {sesion.cajero_nombre || "—"}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <EstadoBadge estado={sesion.estado} />
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-500">
                            {formatFecha(sesion.abierta_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-500">
                            {formatFecha(sesion.cerrada_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              sesion.diferencia_pyg > 0
                                ? "text-green-600"
                                : sesion.diferencia_pyg < 0
                                  ? "text-red-600"
                                  : "text-slate-400"
                            )}
                          >
                            {formatDiferencia(sesion.diferencia_pyg, "PYG")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right hidden lg:table-cell">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              sesion.diferencia_usd > 0
                                ? "text-green-600"
                                : sesion.diferencia_usd < 0
                                  ? "text-red-600"
                                  : "text-slate-400"
                            )}
                          >
                            {formatDiferencia(sesion.diferencia_usd, "USD")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right hidden lg:table-cell">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              sesion.diferencia_brl > 0
                                ? "text-green-600"
                                : sesion.diferencia_brl < 0
                                  ? "text-red-600"
                                  : "text-slate-400"
                            )}
                          >
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

          {/* PAGINACIÓN */}
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
    </div>
  );
}

// ─── Página con Suspense (requerido por useSearchParams) ────────

export default function SesionesPage() {
  return (
    <Suspense fallback={<LoadingScreen texto="Cargando sesiones de caja..." />}>
      <SesionesContent />
    </Suspense>
  );
}
