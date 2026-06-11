"use client";
import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Filter,
  LayoutGrid,
  List,
  TrendingUp,
  Target,
  Banknote,
  Users,
} from "lucide-react";
import {
  EmptyState,
  LoadingScreen,
  PageHeader,
  Pagination,
  SearchBar,
  Button,
  Badge,
  Text,
  useToast,
  useConfirm,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  getOportunidades,
  updateOportunidad,
} from "@/services/apis/ventas";
import { cn } from "@/lib/utils";
import KanbanBoard, {
  KANBAN_COLUMNS,
} from "@/components/comercial/ventas/kanban/KanbanBoard";
import NuevaOportunidadModal from "@/components/comercial/ventas/pipeline/NuevaOportunidadModal";

// ─── Configuración ──────────────────────────────────────────────

const ETAPAS = [
  { value: "", label: "Todas" },
  { value: "nueva", label: "Nueva" },
  { value: "contactada", label: "Contactada" },
  { value: "negociacion", label: "Negociación" },
  { value: "ganada", label: "Ganada" },
  { value: "perdida", label: "Perdida" },
];

const ETAPA_BADGE_MAP = {
  nueva: { variant: "info", label: "Nueva" },
  contactada: { variant: "warning", label: "Contactada" },
  negociacion: { variant: "purple", label: "Negociación" },
  ganada: { variant: "success", label: "Ganada" },
  perdida: { variant: "danger", label: "Perdida" },
};

const FILTER_SCHEMA = {
  search: "",
  etapa: "",
  vista: "kanban",
  page: 1,
};

// ─── StatMini ───────────────────────────────────────────────────

function StatMini({ icon: Icon, label, value, color = "emerald" }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200/80 px-4 py-3">
      <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg", colors[color])}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

// ─── ViewToggle ─────────────────────────────────────────────────

function ViewToggle({ value, onChange }) {
  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
      <button
        onClick={() => onChange("kanban")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
          value === "kanban"
            ? "bg-white text-slate-800 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        )}
        aria-label="Vista Kanban"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Kanban
      </button>
      <button
        onClick={() => onChange("tabla")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
          value === "tabla"
            ? "bg-white text-slate-800 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        )}
        aria-label="Vista Tabla"
      >
        <List className="w-3.5 h-3.5" />
        Tabla
      </button>
    </div>
  );
}

// ─── FilterDropdown ─────────────────────────────────────────────

function FilterDropdown({ value, onChange, icon: Icon, label, options }) {
  const isActive = value !== "";
  return (
    <div className="relative flex items-center gap-1.5">
      <Icon
        className={cn(
          "w-3.5 h-3.5",
          isActive ? "text-emerald-600" : "text-slate-400"
        )}
      />
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

// ─── Contenido Principal ────────────────────────────────────────

function OportunidadesContent() {
  const router = useRouter();
  const { filters, setFilter, setFilters, resetFilters, page, setPage } =
    useUrlFilters(FILTER_SCHEMA);

  const vista = filters.vista || "kanban";

  // Para la tabla: paginado normal
  const {
    data: oportunidadesData,
    loading,
    execute: fetchOportunidades,
  } = useApi(getOportunidades);

  // Para kanban: cargar TODAS las oportunidades activas (sin paginar)
  const {
    data: kanbanData,
    loading: kanbanLoading,
    execute: fetchKanbanData,
  } = useApi(getOportunidades);

  const { execute: patchOportunidad } = useApi(updateOportunidad);

  const oportunidades = oportunidadesData?.results || [];
  const count = oportunidadesData?.count || 0;
  const pageSize = 24;

  // Kanban: todas las oportunidades sin paginar
  const kanbanOportunidades = kanbanData?.results || [];
  const kanbanCount = kanbanData?.count || 0;

  const [busquedaLocal, setBusquedaLocal] = useState(filters.search);
  const busquedaDebounced = useDebounce(busquedaLocal, 400);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Optimistic state para kanban
  const [optimisticMoves, setOptimisticMoves] = useState({});

  const { showToast } = useToast();
  const { prompt: promptDialog } = useConfirm();

  // Modal de nueva oportunidad
  const [modalNuevaOpen, setModalNuevaOpen] = useState(false);

  useEffect(() => {
    if (busquedaDebounced !== filters.search)
      setFilter("search", busquedaDebounced);
  }, [busquedaDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setBusquedaLocal(filters.search);
  }, [filters.search]);

  // Fetch data según la vista activa
  useEffect(() => {
    if (vista === "tabla") {
      const params = { page: filters.page };
      if (filters.search) params.search = filters.search;
      if (filters.etapa) params.etapa = filters.etapa;
      fetchOportunidades(params).then(() => setHasLoadedOnce(true));
    } else {
      // Kanban: cargar todo sin paginación
      const params = { page_size: 200 };
      if (filters.search) params.search = filters.search;
      fetchKanbanData(params).then(() => setHasLoadedOnce(true));
    }
  }, [fetchOportunidades, fetchKanbanData, filters.search, filters.etapa, filters.page, vista]);

  // Stats del pipeline (calculadas de kanban data)
  const pipelineStats = useMemo(() => {
    const items = kanbanOportunidades.length > 0 ? kanbanOportunidades : oportunidades;
    const activas = items.filter(
      (o) => o.etapa !== "ganada" && o.etapa !== "perdida"
    );
    const ganadas = items.filter((o) => o.etapa === "ganada");
    const montoTotal = activas.reduce(
      (sum, o) => sum + Number(o.monto_estimado || 0),
      0
    );
    const montoGanado = ganadas.reduce(
      (sum, o) => sum + Number(o.monto_estimado || 0),
      0
    );
    const clientesUnicos = new Set(items.map((o) => o.cliente).filter(Boolean)).size;

    return {
      activas: activas.length,
      ganadas: ganadas.length,
      montoTotal,
      montoGanado,
      clientesUnicos,
      total: items.length,
    };
  }, [kanbanOportunidades, oportunidades]);

  // Datos de kanban con optimistic updates aplicados
  const kanbanDataWithOptimism = useMemo(() => {
    return kanbanOportunidades.map((oport) => {
      if (optimisticMoves[oport.id]) {
        return { ...oport, etapa: optimisticMoves[oport.id] };
      }
      return oport;
    });
  }, [kanbanOportunidades, optimisticMoves]);

  // Mover oportunidad en kanban (optimistic update + API)
  const handleMoveOportunidad = useCallback(
    async (id, nuevaEtapa) => {
      // 1. Bloquear arrastre directo a "ganada"
      if (nuevaEtapa === "ganada") {
        showToast(
          "Para marcar la oportunidad como Ganada, debés hacerlo desde el detalle gestionando sus presupuestos.",
          "info"
        );
        return;
      }

      let motivo_perdida = "";
      // 2. Interceptar arrastre a "perdida" con diálogo de confirmación
      if (nuevaEtapa === "perdida") {
        const motivo = await promptDialog(
          "Indicá el motivo por el cual se pierde esta oportunidad.",
          "Marcar como perdida",
          {
            placeholder: "Ej: El cliente eligió otro proveedor",
            confirmText: "Confirmar",
            type: "danger",
          }
        );
        if (motivo === null) {
          // El usuario canceló la acción, no se mueve la tarjeta
          return;
        }
        motivo_perdida = motivo || "";
      }

      // Optimistic update
      setOptimisticMoves((prev) => ({ ...prev, [id]: nuevaEtapa }));

      try {
        await patchOportunidad(id, {
          etapa: nuevaEtapa,
          ...(nuevaEtapa === "perdida" && { motivo_perdida }),
        });
        // Refetch para sincronizar
        fetchKanbanData({
          page_size: 200,
          ...(filters.search && { search: filters.search }),
        });
      } catch (err) {
        // Revertir optimistic update en caso de error
        setOptimisticMoves((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });

        // Mostrar feedback detallado del error de la API
        const detail =
          err?.data?.etapa?.[0] || err?.data?.detail || "Error al cambiar etapa";
        showToast(detail, "error");
      }
    },
    [patchOportunidad, fetchKanbanData, filters.search, showToast, promptDialog]
  );

  const handleClickOportunidad = useCallback(
    (oport) => {
      router.push(`/ventas-crm/oportunidades/${oport.id}`);
    },
    [router]
  );

  const handleOportunidadCreated = useCallback(() => {
    // Refetch kanban data después de crear
    fetchKanbanData({ page_size: 200, ...(filters.search && { search: filters.search }) });
  }, [fetchKanbanData, filters.search]);

  if ((loading || kanbanLoading) && !hasLoadedOnce)
    return <LoadingScreen texto="Cargando oportunidades..." />;

  const hayFiltrosActivos = filters.search !== "" || filters.etapa !== "";

  const limpiarFiltros = () => {
    setBusquedaLocal("");
    resetFilters();
  };

  function formatMonto(monto) {
    if (!monto) return "—";
    return Number(monto).toLocaleString("es-PY") + " ₲";
  }

  const totalDisplay = vista === "kanban" ? kanbanCount : count;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Oportunidades" },
        ]}
        subtitle={`CRM · ${totalDisplay} oportunidades en pipeline`}
        subtitleClassName="text-emerald-600"
      >
        <div className="flex items-center gap-3">
          <ViewToggle
            value={vista}
            onChange={(v) => setFilter("vista", v)}
          />
          <Button
            variant="success"
            size="md"
            icon={Plus}
            onClick={() => setModalNuevaOpen(true)}
            className="rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 cursor-pointer"
          >
            NUEVA OPORTUNIDAD
          </Button>
        </div>
      </PageHeader>

      <main className="flex-1 overflow-hidden p-6 min-w-0">
        <div className="h-full flex flex-col gap-4 max-w-[1600px] mx-auto">
          {/* RESUMEN STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
            <StatMini
              icon={Target}
              label="Pipeline activo"
              value={pipelineStats.activas}
              color="blue"
            />
            <StatMini
              icon={TrendingUp}
              label="Ganadas"
              value={pipelineStats.ganadas}
              color="emerald"
            />
            <StatMini
              icon={Banknote}
              label="Monto en pipeline"
              value={formatMonto(pipelineStats.montoTotal)}
              color="purple"
            />
            <StatMini
              icon={Users}
              label="Clientes"
              value={pipelineStats.clientesUnicos}
              color="amber"
            />
          </div>

          {/* BARRA DE HERRAMIENTAS */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 shrink-0 relative z-20">
            <div className="flex-1 max-w-md">
              <SearchBar
                value={busquedaLocal}
                onChange={setBusquedaLocal}
                placeholder="Buscar por título o cliente..."
              />
            </div>

            {vista === "tabla" && (
              <FilterDropdown
                value={filters.etapa}
                onChange={(val) => setFilter("etapa", val)}
                icon={Filter}
                label="Etapa"
                options={ETAPAS}
              />
            )}

            <Text
              variant="label"
              className="flex items-center gap-2 text-slate-400 whitespace-nowrap ml-auto"
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  totalDisplay > 0
                    ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                    : "bg-slate-300"
                )}
              />
              {totalDisplay} oportunidad{totalDisplay !== 1 ? "es" : ""}
            </Text>
          </div>

          {/* VISTA PRINCIPAL */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {vista === "kanban" ? (
              <KanbanBoard
                oportunidades={kanbanDataWithOptimism}
                onMoveOportunidad={handleMoveOportunidad}
                onClickOportunidad={handleClickOportunidad}
                onNewOportunidad={() => setModalNuevaOpen(true)}
                loading={kanbanLoading}
              />
            ) : (
              <TableView
                oportunidades={oportunidades}
                count={count}
                pageSize={pageSize}
                page={page}
                setPage={setPage}
                loading={loading}
                hayFiltrosActivos={hayFiltrosActivos}
                limpiarFiltros={limpiarFiltros}
                formatMonto={formatMonto}
                router={router}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modal de nueva oportunidad */}
      <NuevaOportunidadModal
        open={modalNuevaOpen}
        onClose={() => setModalNuevaOpen(false)}
        onCreated={handleOportunidadCreated}
      />
    </div>
  );
}

function TableView({
  oportunidades,
  count,
  pageSize,
  page,
  setPage,
  loading,
  hayFiltrosActivos,
  limpiarFiltros,
  formatMonto,
  router,
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div
        className={cn(
          "transition-opacity duration-300",
          loading ? "opacity-50 pointer-events-none" : "opacity-100"
        )}
      >
        {oportunidades.length === 0 ? (
          <EmptyState
            titulo={hayFiltrosActivos ? "Sin resultados" : "Sin oportunidades"}
            descripcion={
              hayFiltrosActivos
                ? "Intentá con otros términos o cambiá los filtros."
                : "Creá tu primera oportunidad para empezar a gestionar el pipeline."
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
                    Oportunidad
                  </th>
                  <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">
                    Cliente
                  </th>
                  <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">
                    Etapa
                  </th>
                  <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right hidden md:table-cell">
                    Monto Est.
                  </th>
                  <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden lg:table-cell">
                    Vendedor
                  </th>
                  <th className="py-3 pr-6 pl-4 text-[11px] font-black uppercase tracking-widest">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {oportunidades.map((oport) => (
                  <tr
                    key={oport.id}
                    onClick={() =>
                      router.push(`/ventas-crm/oportunidades/${oport.id}`)
                    }
                    className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 pl-6 pr-4">
                      <span className="text-sm font-semibold text-slate-800">
                        {oport.titulo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600">
                        {oport.cliente_razon_social}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          ETAPA_BADGE_MAP[oport.etapa]?.variant || "default"
                        }
                      >
                        {ETAPA_BADGE_MAP[oport.etapa]?.label || oport.etapa}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right hidden md:table-cell">
                      <span className="text-sm font-mono text-slate-600">
                        {formatMonto(oport.monto_estimado)}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-sm text-slate-600">
                        {oport.vendedor_nombre || "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-6 pl-4">
                      <span className="text-xs text-slate-400">
                        {oport.created_at
                          ? new Date(oport.created_at).toLocaleDateString(
                            "es-PY",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )
                          : "—"}
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
        <div className="mt-4">
          <Pagination
            count={count}
            pageSize={pageSize}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

// ─── Página con Suspense ────────────────────────────────────────

export default function OportunidadesPage() {
  return (
    <Suspense fallback={<LoadingScreen texto="Cargando oportunidades..." />}>
      <OportunidadesContent />
    </Suspense>
  );
}
