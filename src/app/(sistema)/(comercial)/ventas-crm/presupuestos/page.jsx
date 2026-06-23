"use client";
import { useEffect, useState, Suspense } from "react";
import { Send, CheckCircle, XCircle } from "lucide-react";
import {
  EmptyState,
  LoadingScreen,
  PageHeader,
  Pagination,
  StatCard,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { getPresupuestos } from "@/services/apis/ventas";
import PresupuestosToolbar from "@/components/comercial/ventas/presupuestos/PresupuestosToolbar";
import PresupuestosTable from "@/components/comercial/ventas/presupuestos/PresupuestosTable";
import ClienteSelectorModal from "@/components/comercial/ventas/presupuestos/ClienteSelectorModal";
import { cn } from "@/lib/utils";

const FILTER_SCHEMA = { search: "", estado: "", tipo: "", page: 1 };
const PAGE_SIZE = 24;

// ─── Contenido principal ─────────────────────────────────────────

function PresupuestosContent() {
  const { filters, setFilter, resetFilters, page, setPage } = useUrlFilters(FILTER_SCHEMA);

  const { data: presupuestosData, loading, execute: fetchPresupuestos } = useApi(getPresupuestos);
  const { data: statsEnviados,   execute: fetchStatsEnviados   } = useApi(getPresupuestos);
  const { data: statsAceptados,  execute: fetchStatsAceptados  } = useApi(getPresupuestos);
  const { data: statsRechazados, execute: fetchStatsRechazados } = useApi(getPresupuestos);

  const presupuestos = presupuestosData?.results || [];
  const count        = presupuestosData?.count   || 0;

  const [busquedaLocal, setBusquedaLocal] = useState(filters.search);
  const busquedaDebounced = useDebounce(busquedaLocal, 400);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);

  // Sincronizar búsqueda con URL
  useEffect(() => {
    if (busquedaDebounced !== filters.search) setFilter("search", busquedaDebounced);
  }, [busquedaDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setBusquedaLocal(filters.search);
  }, [filters.search]);

  // Cargar lista paginada
  useEffect(() => {
    const params = { page: filters.page };
    if (filters.search) params.search = filters.search;
    if (filters.estado) params.estado = filters.estado;
    if (filters.tipo) params.tipo = filters.tipo;
    fetchPresupuestos(params).then(() => setHasLoadedOnce(true));
  }, [fetchPresupuestos, filters.search, filters.page, filters.estado, filters.tipo]);

  // Stats — solo una vez al montar
  useEffect(() => {
    fetchStatsEnviados({ estado: "enviado",   page_size: 1 });
    fetchStatsAceptados({ estado: "aceptado",  page_size: 1 });
    fetchStatsRechazados({ estado: "rechazado", page_size: 1 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !hasLoadedOnce) return <LoadingScreen texto="Cargando presupuestos..." />;

  const hayFiltrosActivos = filters.search !== "" || filters.estado !== "" || filters.tipo !== "";

  const limpiarFiltros = () => {
    setBusquedaLocal("");
    resetFilters();
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Presupuestos" },
        ]}
        subtitle={`Cotizaciones · ${count} presupuesto${count !== 1 ? "s" : ""}`}
        subtitleClassName="text-emerald-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard
              icon={Send}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              label="Enviados (pendientes)"
              value={statsEnviados?.count ?? "—"}
            />
            <StatCard
              icon={CheckCircle}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              label="Aceptados"
              value={statsAceptados?.count ?? "—"}
            />
            <StatCard
              icon={XCircle}
              iconBg="bg-red-50"
              iconColor="text-red-500"
              label="Rechazados"
              value={statsRechazados?.count ?? "—"}
            />
          </div>

          {/* Toolbar */}
          <PresupuestosToolbar
            busqueda={busquedaLocal}
            onBusquedaChange={setBusquedaLocal}
            estado={filters.estado}
            onEstadoChange={(val) => setFilter("estado", val)}
            tipo={filters.tipo}
            onTipoChange={(val) => setFilter("tipo", val)}
            count={count}
            hayFiltrosActivos={hayFiltrosActivos}
            onLimpiarFiltros={limpiarFiltros}
            onNuevoPresupuesto={() => setShowClienteModal(true)}
          />

          {/* Tabla / Empty state */}
          <div className={cn(
            "transition-opacity duration-300",
            loading ? "opacity-50 pointer-events-none" : "opacity-100"
          )}>
            {presupuestos.length === 0 ? (
              <EmptyState
                titulo={hayFiltrosActivos ? "Sin resultados" : "No hay presupuestos"}
                descripcion={
                  hayFiltrosActivos
                    ? "Intentá con otros términos o cambiá los filtros."
                    : "Creá un presupuesto desde una oportunidad o usá el botón \"Nuevo Presupuesto\" para venta directa."
                }
                textoBoton={hayFiltrosActivos ? "Limpiar filtros" : "Nuevo Presupuesto"}
                onAction={
                  hayFiltrosActivos
                    ? limpiarFiltros
                    : () => setShowClienteModal(true)
                }
              />
            ) : (
              <PresupuestosTable presupuestos={presupuestos} />
            )}
          </div>

          {/* Paginación */}
          {count > PAGE_SIZE && (
            <Pagination
              count={count}
              pageSize={PAGE_SIZE}
              currentPage={page}
              onPageChange={setPage}
            />
          )}

        </div>
      </main>

      {/* Modal de selección de cliente para nuevo presupuesto directo */}
      <ClienteSelectorModal
        open={showClienteModal}
        onClose={() => setShowClienteModal(false)}
      />
    </div>
  );
}

// ─── Export con Suspense ─────────────────────────────────────────

export default function PresupuestosPage() {
  return (
    <Suspense fallback={<LoadingScreen texto="Cargando presupuestos..." />}>
      <PresupuestosContent />
    </Suspense>
  );
}
