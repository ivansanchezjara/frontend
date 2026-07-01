"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Filter, Wrench, Clock, User } from "lucide-react";
import {
  PageHeader,
  Button,
  Badge,
  Text,
  SearchBar,
  Pagination,
  EmptyState,
  LoadingScreen,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { getOrdenes } from "@/services/apis/asistencia";
import { cn } from "@/lib/utils";

// ─── Constantes ─────────────────────────────────────────────────

const ESTADO_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "asignada", label: "Asignadas" },
  { value: "en_progreso", label: "En Progreso" },
  { value: "completada", label: "Completadas" },
  { value: "cancelada", label: "Canceladas" },
];

const PRIORIDAD_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const ESTADO_BADGE = {
  pendiente: "bg-amber-100 text-amber-700 border-amber-200",
  asignada: "bg-blue-100 text-blue-700 border-blue-200",
  en_progreso: "bg-indigo-100 text-indigo-700 border-indigo-200",
  completada: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelada: "bg-red-100 text-red-700 border-red-200",
};

const PRIORIDAD_BADGE = {
  baja: "bg-slate-100 text-slate-600",
  media: "bg-sky-100 text-sky-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};

const FILTER_SCHEMA = {
  search: "",
  estado: "",
  prioridad: "",
  page: 1,
};

// ─── Filter Dropdown ────────────────────────────────────────────

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
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(fechaStr) {
  if (!fechaStr) return "—";
  return new Date(fechaStr).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Contenido ──────────────────────────────────────────────────

function OrdenesContent() {
  const router = useRouter();
  const { filters, setFilter, resetFilters, page, setPage } = useUrlFilters(FILTER_SCHEMA);

  const {
    data: ordenesData,
    loading,
    execute: fetchOrdenes,
  } = useApi(getOrdenes);

  const ordenes = ordenesData?.results || [];
  const count = ordenesData?.count || 0;
  const pageSize = 20;

  const [busquedaLocal, setBusquedaLocal] = useState(filters.search);
  const busquedaDebounced = useDebounce(busquedaLocal, 400);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (busquedaDebounced !== filters.search) setFilter("search", busquedaDebounced);
  }, [busquedaDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setBusquedaLocal(filters.search); }, [filters.search]);

  useEffect(() => {
    const params = { page: filters.page };
    if (filters.search) params.search = filters.search;
    if (filters.estado) params.estado = filters.estado;
    if (filters.prioridad) params.prioridad = filters.prioridad;
    fetchOrdenes(params).then(() => setHasLoadedOnce(true));
  }, [fetchOrdenes, filters.search, filters.estado, filters.prioridad, filters.page]);

  if (loading && !hasLoadedOnce) return <LoadingScreen texto="Cargando órdenes..." />;

  const hayFiltros = filters.search || filters.estado || filters.prioridad;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Asistencia Técnica", href: "/asistencia-tecnica" },
          { label: "Órdenes de Trabajo" },
        ]}
        subtitle={`${count} órdenes registradas`}
        subtitleClassName="text-blue-600"
      >
        <Link href="/asistencia-tecnica/ordenes/nueva">
          <Button variant="primary" size="md" icon={Plus} className="rounded-xl font-bold text-xs shadow-lg">
            NUEVA ORDEN
          </Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Toolbar */}
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <SearchBar
                  value={busquedaLocal}
                  onChange={setBusquedaLocal}
                  placeholder="Buscar por número, cliente o técnico..."
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <FilterDropdown
                  value={filters.estado}
                  onChange={(val) => setFilter("estado", val)}
                  icon={Clock}
                  label="Estado"
                  options={ESTADO_OPTIONS}
                />
                <FilterDropdown
                  value={filters.prioridad}
                  onChange={(val) => setFilter("prioridad", val)}
                  icon={Filter}
                  label="Prioridad"
                  options={PRIORIDAD_OPTIONS}
                />
              </div>
              <Text variant="label" className="flex items-center gap-2 text-slate-400 whitespace-nowrap">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  count > 0 ? "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" : "bg-slate-300"
                )} />
                {count} {count === 1 ? "orden" : "órdenes"}
              </Text>
            </div>
          </div>

          {/* Table */}
          <div className={cn(
            "transition-opacity duration-300",
            loading ? "opacity-50 pointer-events-none" : "opacity-100"
          )}>
            {ordenes.length === 0 ? (
              <EmptyState
                titulo={hayFiltros ? "Sin resultados" : "Sin órdenes"}
                descripcion={hayFiltros ? "Intentá con otros filtros." : "Creá la primera orden de trabajo."}
                textoBoton={hayFiltros ? "Limpiar filtros" : undefined}
                onAction={hayFiltros ? resetFilters : undefined}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500">
                      <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">Nro</th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Cliente</th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden md:table-cell">Tipo</th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Estado</th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Prioridad</th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden lg:table-cell">Técnico</th>
                      <th className="py-3 pr-6 pl-4 text-[11px] font-black uppercase tracking-widest">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((orden) => (
                      <tr
                        key={orden.id}
                        onClick={() => router.push(`/asistencia-tecnica/ordenes/${orden.id}`)}
                        className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 pl-6 pr-4">
                          <Text variant="bodyXs" className="font-mono font-black text-slate-700">
                            OT-{orden.numero}
                          </Text>
                        </td>
                        <td className="py-3 px-4">
                          <Text variant="bodyXs" className="font-semibold text-slate-800">
                            {orden.cliente_nombre}
                          </Text>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <Text variant="bodyXs" className="text-slate-500">
                            {orden.tipo_servicio_nombre}
                          </Text>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn(
                            "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                            ESTADO_BADGE[orden.estado] || "bg-slate-100 text-slate-600"
                          )}>
                            {orden.estado_display}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn(
                            "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            PRIORIDAD_BADGE[orden.prioridad] || "bg-slate-100 text-slate-600"
                          )}>
                            {orden.prioridad_display}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-slate-400" />
                            <Text variant="bodyXs" className="text-slate-500">
                              {orden.tecnico_nombre || "Sin asignar"}
                            </Text>
                          </div>
                        </td>
                        <td className="py-3 pr-6 pl-4">
                          <Text variant="bodyXs" className="text-slate-500">
                            {formatFecha(orden.fecha_creacion)}
                          </Text>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {count > pageSize && (
            <Pagination count={count} pageSize={pageSize} currentPage={page} onPageChange={setPage} />
          )}
        </div>
      </main>
    </div>
  );
}

export default function OrdenesPage() {
  return (
    <Suspense fallback={<LoadingScreen texto="Cargando órdenes..." />}>
      <OrdenesContent />
    </Suspense>
  );
}
