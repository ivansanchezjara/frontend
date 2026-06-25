"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Filter, Calendar, MapPin, Users } from "lucide-react";
import {
  EmptyState, LoadingScreen, PageHeader, Pagination,
  SearchBar, Button, Badge, Text,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { getEventos } from "@/services/apis/ventas-campo";
import { cn } from "@/lib/utils";

// ─── Configuración ──────────────────────────────────────────────

const ESTADOS_EVENTO = [
  { value: "", label: "Todos" },
  { value: "preparacion", label: "En Preparación" },
  { value: "activo", label: "Activo" },
  { value: "cierre", label: "En Cierre" },
  { value: "rendido", label: "Rendido" },
  { value: "cancelado", label: "Cancelado" },
];

const ESTADO_BADGE_MAP = {
  preparacion: { variant: "warning", label: "En Preparación" },
  activo: { variant: "success", label: "Activo" },
  cierre: { variant: "info", label: "En Cierre" },
  rendido: { variant: "default", label: "Rendido" },
  cancelado: { variant: "danger", label: "Cancelado" },
};

const TIPOS_EVENTO = [
  { value: "", label: "Todos" },
  { value: "curso", label: "Curso" },
  { value: "visita", label: "Visita" },
  { value: "feria", label: "Feria" },
  { value: "otro", label: "Otro" },
];

const FILTER_SCHEMA = {
  search: "",
  estado: "",
  tipo: "",
  page: 1,
};

// ─── Helpers ────────────────────────────────────────────────────

function FilterDropdown({ value, onChange, icon: Icon, label, options }) {
  const isActive = value !== "";
  return (
    <div className="relative flex items-center gap-1.5">
      <Icon className={cn("w-3.5 h-3.5", isActive ? "text-emerald-600" : "text-slate-400")} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "appearance-none text-xs font-semibold rounded-lg px-2 py-1.5 pr-6 cursor-pointer",
          "border transition-all outline-none",
          isActive
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
        )}
        aria-label={label}
      >
        {options.map(opt => (
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

function formatFecha(fechaStr) {
  if (!fechaStr) return "—";
  return new Date(fechaStr).toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

// ─── Contenido Principal ────────────────────────────────────────

function EventosContent() {
  const router = useRouter();
  const { filters, setFilter, resetFilters, page, setPage } = useUrlFilters(FILTER_SCHEMA);

  const { data: eventosData, loading, execute: fetchEventos } = useApi(getEventos);

  const eventos = eventosData?.results || [];
  const count = eventosData?.count || 0;
  const pageSize = 24;

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
    if (filters.tipo) params.tipo = filters.tipo;
    fetchEventos(params).then(() => setHasLoadedOnce(true));
  }, [fetchEventos, filters.search, filters.page, filters.estado, filters.tipo]);

  if (loading && !hasLoadedOnce) return <LoadingScreen texto="Cargando eventos..." />;

  const hayFiltros = filters.search || filters.estado || filters.tipo;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Ventas de Campo", href: "/ventas-crm/ventas-campo" },
          { label: "Eventos" },
        ]}
        subtitle={`${count} eventos de campo`}
        subtitleClassName="text-emerald-600"
      >
        <Link href="/ventas-crm/ventas-campo/eventos/nuevo">
          <Button
            variant="success"
            size="md"
            icon={Plus}
            className="rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 cursor-pointer"
          >
            NUEVO EVENTO
          </Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Toolbar */}
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative z-20">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <SearchBar
                  value={busquedaLocal}
                  onChange={setBusquedaLocal}
                  placeholder="Buscar evento por título o ubicación..."
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <FilterDropdown
                  value={filters.estado}
                  onChange={(val) => setFilter("estado", val)}
                  icon={Filter}
                  label="Estado"
                  options={ESTADOS_EVENTO}
                />
                <FilterDropdown
                  value={filters.tipo}
                  onChange={(val) => setFilter("tipo", val)}
                  icon={Calendar}
                  label="Tipo"
                  options={TIPOS_EVENTO}
                />
              </div>
              <Text variant="label" className="flex items-center gap-2 text-slate-400 whitespace-nowrap">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  count > 0 ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-slate-300"
                )} />
                {count} evento{count !== 1 ? "s" : ""}
              </Text>
            </div>
          </div>

          {/* Tabla */}
          <div className={cn("transition-opacity duration-300", loading ? "opacity-50 pointer-events-none" : "opacity-100")}>
            {eventos.length === 0 ? (
              <EmptyState
                titulo={hayFiltros ? "Sin resultados" : "No hay eventos de campo"}
                descripcion={hayFiltros
                  ? "Probá con otros filtros."
                  : "Creá un evento para gestionar ventas en cursos, visitas o ferias."
                }
                textoBoton={hayFiltros ? "Limpiar filtros" : undefined}
                onAction={hayFiltros ? () => { setBusquedaLocal(""); resetFilters(); } : undefined}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500">
                      <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">Evento</th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Estado</th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Tipo</th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden md:table-cell">
                        <MapPin className="w-3 h-3 inline mr-1" />Ubicación
                      </th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden lg:table-cell">
                        <Users className="w-3 h-3 inline mr-1" />Vendedores
                      </th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventos.map(evento => {
                      const badge = ESTADO_BADGE_MAP[evento.estado] || { variant: "default", label: evento.estado };
                      return (
                        <tr
                          key={evento.id}
                          className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/ventas-crm/ventas-campo/eventos/${evento.id}`)}
                        >
                          <td className="py-3 pl-6 pr-4">
                            <span className="text-sm font-semibold text-slate-800">{evento.titulo}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs text-slate-500 capitalize">{evento.tipo}</span>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <span className="text-sm text-slate-600">{evento.ubicacion || "—"}</span>
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <span className="text-sm text-slate-600">{evento.cantidad_vendedores}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs text-slate-400">{formatFecha(evento.fecha_inicio)}</span>
                          </td>
                        </tr>
                      );
                    })}
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

export default function EventosCampoPage() {
  return (
    <Suspense fallback={<LoadingScreen texto="Cargando eventos..." />}>
      <EventosContent />
    </Suspense>
  );
}
