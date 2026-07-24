"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Plus, Target, MapPin } from "lucide-react";
import {
  EmptyState, LoadingScreen, PageHeader, Pagination, SearchBar, Button, Badge,
  FilterDropdown, SortableHeader,
} from "@/components/ui";
import { useConfirm } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { getClinicas, deleteClinica } from "@/services/apis/ventas";
import { DEPARTAMENTOS } from "@/config/paraguay";
import { cn } from "@/lib/utils";

// ─── Configuracion ──────────────────────────────────────────────

const ETAPA_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "prospecto", label: "Prospectos" },
  { value: "activo", label: "Activas" },
  { value: "inactivo", label: "Inactivas" },
];

const DEPARTAMENTO_OPTIONS = [
  { value: "", label: "Todos" },
  ...DEPARTAMENTOS.map((d) => ({ value: d, label: d })),
];

const ETAPA_BADGE = {
  activo: { label: "Activa", className: "bg-emerald-50 text-emerald-700" },
  prospecto: { label: "Prospecto", className: "bg-amber-50 text-amber-700" },
  inactivo: { label: "Inactiva", className: "bg-red-50 text-red-600" },
};

const FILTER_SCHEMA = {
  search: "",
  etapa: "",
  departamento: "",
  ordering: "-created_at",
  page: 1,
};

// ─── Página ─────────────────────────────────────────────────────

export default function ClinicasListPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { danger } = useConfirm();
  const { filters, setFilter, resetFilters } = useUrlFilters(FILTER_SCHEMA);

  const {
    data: clinicasData,
    loading: loadingClinicas,
    execute: fetchClinicas_,
  } = useApi(getClinicas);

  const clinicas = clinicasData?.results || [];
  const count = clinicasData?.count || 0;
  const pageSize = 24;

  const [busquedaLocal, setBusquedaLocal] = useState(filters.search);
  const busquedaDebounced = useDebounce(busquedaLocal, 400);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (busquedaDebounced !== filters.search) setFilter("search", busquedaDebounced);
  }, [busquedaDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setBusquedaLocal(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const params = { page: filters.page, ordering: filters.ordering };
    if (filters.search) params.search = filters.search;
    if (filters.etapa) params.etapa = filters.etapa;
    if (filters.departamento) params.departamento = filters.departamento;

    fetchClinicas_(params).then(() => setHasLoadedOnce(true));
  }, [fetchClinicas_, filters.search, filters.etapa, filters.departamento, filters.ordering, filters.page]);

  const handleDesactivar = async (clinica) => {
    const nombre = clinica.nombre_comercial || clinica.razon_social;
    const confirmed = await danger(
      `Desactivar la clínica "${nombre}"?`,
      "Desactivar clínica",
      { confirmText: "Desactivar" }
    );
    if (!confirmed) return;

    try {
      await deleteClinica(clinica.id);
      showToast("Clínica desactivada correctamente", "success");
      fetchClinicas_({ page: filters.page });
    } catch {
      showToast("Error al desactivar", "error");
    }
  };

  if (loadingClinicas && !hasLoadedOnce) return <LoadingScreen texto="Cargando clínicas..." />;

  const hayFiltrosActivos = filters.search !== "" || filters.etapa !== "" || filters.departamento !== "";

  const limpiarFiltros = () => {
    setBusquedaLocal("");
    resetFilters();
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Contactos", href: "/ventas-crm/contactos" },
          { label: "Clínicas" },
        ]}
        subtitle={`${count} clínicas registradas`}
        subtitleClassName="text-emerald-600"
      >
        <Link href="/ventas-crm/contactos/clinicas/nuevo">
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            className="rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 cursor-pointer"
          >
            NUEVA CLÍNICA
          </Button>
        </Link>
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
                  placeholder="Buscar por razón social, nombre comercial, RUC, teléfono..."
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
                />
                <FilterDropdown
                  value={filters.departamento}
                  onChange={(val) => setFilter("departamento", val)}
                  icon={MapPin}
                  label="Depto"
                  options={DEPARTAMENTO_OPTIONS}
                />
                {hayFiltrosActivos && (
                  <button
                    onClick={limpiarFiltros}
                    className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <Text
                variant="label"
                className="flex items-center gap-2 text-slate-400 whitespace-nowrap"
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  count > 0 ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-slate-300"
                )} />
                {count} {count === 1 ? "clínica" : "clínicas"}
              </Text>
            </div>
          </div>

          {/* Tabla */}
          <div className={cn(
            "transition-opacity duration-300",
            loadingClinicas ? "opacity-50 pointer-events-none" : "opacity-100"
          )}>
            {clinicas.length === 0 ? (
              <EmptyState
                titulo={hayFiltrosActivos ? "Sin resultados" : "Sin clínicas"}
                descripcion={hayFiltrosActivos ? "Intentá con otros términos o cambiá los filtros." : "Registrá tu primera clínica para empezar."}
                textoBoton={hayFiltrosActivos ? "Limpiar filtros" : undefined}
                onAction={hayFiltrosActivos ? limpiarFiltros : undefined}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500">
                      <th className="py-3 pl-6 pr-4">
                        <SortableHeader field="razon_social" label="Clínica" currentOrdering={filters.ordering} onChange={(o) => setFilter("ordering", o)} />
                      </th>
                      <th className="py-3 px-4 hidden md:table-cell text-[11px] font-black uppercase tracking-widest">Contacto</th>
                      <th className="py-3 px-4 hidden lg:table-cell text-[11px] font-black uppercase tracking-widest">Ubicación</th>
                      <th className="py-3 px-4 hidden sm:table-cell text-[11px] font-black uppercase tracking-widest">Etapa</th>
                      <th className="py-3 pr-6 pl-4">
                        <SortableHeader field="created_at" label="Creada" currentOrdering={filters.ordering} onChange={(o) => setFilter("ordering", o)} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clinicas.map((clinica) => {
                      const etapaBadge = ETAPA_BADGE[clinica.etapa] || ETAPA_BADGE.activo;
                      return (
                        <tr
                          key={clinica.id}
                          className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/ventas-crm/contactos/clinicas/${clinica.id}`)}
                        >
                          <td className="py-3 pl-6 pr-4">
                            <div>
                              <Text variant="bodySmBold" className="text-slate-800 truncate max-w-[220px]">
                                {clinica.nombre_comercial || clinica.razon_social}
                              </Text>
                              {clinica.nombre_comercial && (
                                <Text variant="mutedXs" className="text-slate-400">
                                  {clinica.razon_social}
                                </Text>
                              )}
                              {clinica.ruc && (
                                <Text variant="mutedXs" className="text-slate-400">
                                  RUC: {clinica.ruc}
                                </Text>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <div>
                              {clinica.telefono && (
                                <Text variant="bodySm" className="text-slate-600">{clinica.telefono}</Text>
                              )}
                              {clinica.correo_electronico && (
                                <Text variant="mutedXs" className="text-slate-400 truncate max-w-[180px]">
                                  {clinica.correo_electronico}
                                </Text>
                              )}
                              {!clinica.telefono && !clinica.correo_electronico && (
                                <Text variant="mutedXs" className="text-slate-300">—</Text>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            {clinica.ciudad ? (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <Text variant="bodySm" className="text-slate-500">
                                  {clinica.ciudad}{clinica.departamento ? `, ${clinica.departamento}` : ""}
                                </Text>
                              </div>
                            ) : (
                              <Text variant="mutedXs" className="text-slate-300">—</Text>
                            )}
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            <span className={cn(
                              "inline-block px-2 py-0.5 rounded-full text-[10px] font-bold",
                              etapaBadge.className
                            )}>
                              {etapaBadge.label}
                            </span>
                          </td>
                          <td className="py-3 pr-6 pl-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDesactivar(clinica)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Desactivar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {count > pageSize && (
                  <div className="border-t border-slate-100 px-6 py-3">
                    <Pagination
                      count={count}
                      pageSize={pageSize}
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
