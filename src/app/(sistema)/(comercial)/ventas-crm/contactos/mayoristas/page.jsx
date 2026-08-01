"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Target, MapPin } from "lucide-react";
import {
  EmptyState, LoadingScreen, PageHeader, Pagination, SearchBar, Button,
  FilterDropdown, SortableHeader,
} from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { getMayoristas } from "@/services/apis/ventas";
import { DEPARTAMENTOS } from "@/config/paraguay";
import { cn, formatFechaCorta } from "@/lib/utils";

// ─── Configuración ──────────────────────────────────────────────

const ETAPA_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "prospecto", label: "Prospectos" },
  { value: "activo", label: "Activos" },
  { value: "inactivo", label: "Inactivos" },
];

const DEPARTAMENTO_OPTIONS = [
  { value: "", label: "Todos" },
  ...DEPARTAMENTOS.map((d) => ({ value: d, label: d })),
];

const ETAPA_BADGE = {
  activo: { label: "Activo", className: "bg-emerald-50 text-emerald-700" },
  prospecto: { label: "Prospecto", className: "bg-amber-50 text-amber-700" },
  inactivo: { label: "Inactivo", className: "bg-red-50 text-red-600" },
};

const FILTER_SCHEMA = {
  search: "",
  etapa: "",
  departamento: "",
  ordering: "-created_at",
  page: 1,
};

const PAGE_SIZE = 24;

// ─── Helpers ────────────────────────────────────────────────────

function pluralizar(count) {
  return count === 1 ? "mayorista" : "mayoristas";
}

// ─── Página ─────────────────────────────────────────────────────

export default function MayoristasListPage() {
  const router = useRouter();
  const { filters, setFilter, resetFilters } = useUrlFilters(FILTER_SCHEMA);

  const {
    data: mayoristasData,
    loading: loadingMayoristas,
    execute: fetchMayoristas,
  } = useApi(getMayoristas);

  const mayoristas = mayoristasData?.results || (Array.isArray(mayoristasData) ? mayoristasData : []);
  const count = mayoristasData?.count ?? mayoristas.length;

  const [busquedaLocal, setBusquedaLocal] = useState(filters.search);
  const busquedaDebounced = useDebounce(busquedaLocal, 400);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (busquedaDebounced !== filters.search) {
      setFilter("search", busquedaDebounced);
    }
  }, [busquedaDebounced, filters.search, setFilter]);

  useEffect(() => {
    setBusquedaLocal(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const params = { page: filters.page, ordering: filters.ordering };
    if (filters.search) params.search = filters.search;
    if (filters.etapa) params.etapa = filters.etapa;
    if (filters.departamento) params.departamento = filters.departamento;

    fetchMayoristas(params).then(() => setHasLoadedOnce(true));
  }, [fetchMayoristas, filters.search, filters.etapa, filters.departamento, filters.ordering, filters.page]);

  const hayFiltrosActivos = filters.search !== "" || filters.etapa !== "" || filters.departamento !== "";

  const limpiarFiltros = useCallback(() => {
    setBusquedaLocal("");
    resetFilters();
  }, [resetFilters]);

  const navegarAMayorista = useCallback((id) => {
    router.push(`/ventas-crm/contactos/mayoristas/${id}`);
  }, [router]);

  const handleRowKeyDown = useCallback((e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navegarAMayorista(id);
    }
  }, [navegarAMayorista]);

  if (loadingMayoristas && !hasLoadedOnce) return <LoadingScreen texto="Cargando mayoristas..." />;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Contactos", href: "/ventas-crm/contactos" },
          { label: "Mayoristas" },
        ]}
        subtitle={`${count} ${pluralizar(count)} registrados`}
        subtitleClassName="text-purple-600"
      >
        <Button
          as={Link}
          href="/ventas-crm/contactos/mayoristas/nuevo"
          variant="primary"
          size="md"
          icon={Plus}
          className="rounded-xl font-bold text-xs shadow-lg shadow-purple-100"
        >
          NUEVO MAYORISTA
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Barra de herramientas */}
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative z-20">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <SearchBar
                  value={busquedaLocal}
                  onChange={setBusquedaLocal}
                  placeholder="Buscar por razón social, RUC o teléfono..."
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <FilterDropdown
                  value={filters.etapa}
                  onChange={(val) => setFilter("etapa", val)}
                  icon={Target}
                  label="Etapa"
                  options={ETAPA_OPTIONS}
                  color="purple"
                />
                <FilterDropdown
                  value={filters.departamento}
                  onChange={(val) => setFilter("departamento", val)}
                  icon={MapPin}
                  label="Depto"
                  options={DEPARTAMENTO_OPTIONS}
                  color="purple"
                />
                {hayFiltrosActivos && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={limpiarFiltros}
                    className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase px-2 py-1"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
              <Text
                variant="label"
                className="flex items-center gap-2 text-slate-400 whitespace-nowrap"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    count > 0 ? "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]" : "bg-slate-300"
                  )}
                />
                {count} {pluralizar(count)}
              </Text>
            </div>
          </div>

          {/* Tabla */}
          <div
            className={cn(
              "transition-opacity duration-300",
              loadingMayoristas ? "opacity-50 pointer-events-none" : "opacity-100"
            )}
            aria-busy={loadingMayoristas}
          >
            {mayoristas.length === 0 ? (
              <EmptyState
                titulo={hayFiltrosActivos ? "Sin resultados" : "Sin mayoristas"}
                descripcion={hayFiltrosActivos ? "Intentá con otros términos o cambiá los filtros." : "Registrá tu primer mayorista para empezar."}
                textoBoton={hayFiltrosActivos ? "Limpiar filtros" : undefined}
                onAction={hayFiltrosActivos ? limpiarFiltros : undefined}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500">
                      <th className="py-3 pl-6 pr-4">
                        <SortableHeader field="razon_social" label="Razón Social" currentOrdering={filters.ordering} onChange={(o) => setFilter("ordering", o)} color="purple" />
                      </th>
                      <th className="py-3 px-4 hidden md:table-cell text-[11px] font-black uppercase tracking-widest">Contacto</th>
                      <th className="py-3 px-4 hidden lg:table-cell text-[11px] font-black uppercase tracking-widest">Transportadora</th>
                      <th className="py-3 px-4 hidden sm:table-cell text-[11px] font-black uppercase tracking-widest">Etapa</th>
                      <th className="py-3 pr-6 pl-4">
                        <SortableHeader field="created_at" label="Creado" currentOrdering={filters.ordering} onChange={(o) => setFilter("ordering", o)} color="purple" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mayoristas.map((mayorista) => {
                      const etapaBadge = ETAPA_BADGE[mayorista.etapa] || ETAPA_BADGE.activo;
                      return (
                        <tr
                          key={mayorista.id}
                          role="link"
                          tabIndex={0}
                          aria-label={`Ver mayorista ${mayorista.razon_social}`}
                          className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-inset"
                          onClick={() => navegarAMayorista(mayorista.id)}
                          onKeyDown={(e) => handleRowKeyDown(e, mayorista.id)}
                        >
                          <td className="py-3 pl-6 pr-4">
                            <div>
                              <Text variant="bodySmBold" className="text-slate-800 truncate max-w-[220px]">
                                {mayorista.razon_social}
                              </Text>
                              {mayorista.ruc && (
                                <Text variant="mutedXs" className="text-slate-400">
                                  RUC: {mayorista.ruc}
                                </Text>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <div>
                              {mayorista.telefono && (
                                <Text variant="bodySm" className="text-slate-600">{mayorista.telefono}</Text>
                              )}
                              {mayorista.correo_electronico && (
                                <Text variant="mutedXs" className="text-slate-400 truncate max-w-[180px]">
                                  {mayorista.correo_electronico}
                                </Text>
                              )}
                              {!mayorista.telefono && !mayorista.correo_electronico && (
                                <Text variant="mutedXs" className="text-slate-300">—</Text>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <Text variant="bodySm" className="text-slate-500">
                              {mayorista.transportadora_preferida || "—"}
                            </Text>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            <span className={cn(
                              "inline-block px-2 py-0.5 rounded-full text-[10px] font-bold",
                              etapaBadge.className
                            )}>
                              {etapaBadge.label}
                            </span>
                          </td>
                          <td className="py-3 pr-6 pl-4">
                            <Text variant="mutedXs" className="text-slate-400">
                              {formatFechaCorta(mayorista.created_at)}
                            </Text>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {count > PAGE_SIZE && (
                  <div className="border-t border-slate-100 px-6 py-3">
                    <Pagination
                      count={count}
                      pageSize={PAGE_SIZE}
                      currentPage={filters.page}
                      onPageChange={(p) => setFilter("page", p)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
