"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Pagination,
  Badge,
  LoadingScreen,
  EmptyState,
  Input,
  Button,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getColaEntrega } from "@/services/apis/caja";
import {
  Package, PackageCheck, Search, X, Clock, ChevronRight,
  Truck, Store, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatMonto(valor, moneda) {
  if (valor == null) return "—";
  const num = Number(valor);
  if (moneda === "PYG") return `₲ ${num.toLocaleString("es-PY")}`;
  if (moneda === "USD") return `US$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  if (moneda === "BRL") return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  return String(valor);
}

function diasDesde(fecha) {
  if (!fecha) return 0;
  return Math.floor((new Date() - new Date(fecha)) / (1000 * 60 * 60 * 24));
}

function getUrgenciaBadge(dias) {
  if (dias >= 3) return <Badge variant="danger" className="flex items-center gap-1"><Clock size={10} />{dias}d</Badge>;
  if (dias >= 1) return <Badge variant="warning" className="flex items-center gap-1"><Clock size={10} />{dias}d</Badge>;
  return null;
}

const ENTREGA_ICONS = {
  mostrador: Store,
  delivery: Truck,
  retiro_sucursal: Store,
};

// ─── Página Principal (Lista) ───────────────────────────────────

export default function EntregaMercaderiaPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("pendientes");
  const [clienteSearch, setClienteSearch] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const debouncedCliente = useDebounce(clienteSearch, 500);

  const { data: entregaData, loading, execute: fetchEntrega } = useApi(getColaEntrega, {
    auto: false, initialData: { results: [], count: 0 },
  });

  useEffect(() => {
    const params = { page };
    if (activeTab === "entregados") params.estado = "entregado";
    if (debouncedCliente) params.cliente = debouncedCliente;
    if (fechaFiltro) {
      if (activeTab === "pendientes") params.fecha_cobro = fechaFiltro;
      else params.fecha_entrega = fechaFiltro;
    }
    fetchEntrega(params);
  }, [page, activeTab, debouncedCliente, fechaFiltro, fetchEntrega]);

  const pedidos = entregaData?.results || [];
  const totalCount = entregaData?.count || 0;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleClearFilters = () => {
    setClienteSearch("");
    setFechaFiltro("");
    setPage(1);
  };

  const hasFilters = clienteSearch || fechaFiltro;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Inventario", href: "/inventario" },
          { label: "Entregas de Mercadería" },
        ]}
        subtitle={
          <>
            <Package size={12} />
            Preparación, verificación y despacho de pedidos
          </>
        }
      >
        {totalCount > 0 && !loading && (
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
            {totalCount} pedido{totalCount !== 1 ? "s" : ""}
          </span>
        )}
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm">
            <button
              onClick={() => handleTabChange("pendientes")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center",
                activeTab === "pendientes"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Package size={16} />
              Pendientes
            </button>
            <button
              onClick={() => handleTabChange("entregados")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center",
                activeTab === "entregados"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <PackageCheck size={16} />
              Historial
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <Input
                  label="Cliente"
                  placeholder="Buscar por cliente..."
                  value={clienteSearch}
                  onChange={(e) => { setClienteSearch(e.target.value); setPage(1); }}
                  icon={Search}
                />
              </div>
              <div className="min-w-[180px]">
                <Input
                  label={activeTab === "pendientes" ? "Fecha de cobro" : "Fecha de entrega"}
                  type="date"
                  value={fechaFiltro}
                  onChange={(e) => { setFechaFiltro(e.target.value); setPage(1); }}
                />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" icon={X} onClick={handleClearFilters}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Contenido */}
          {loading ? (
            <LoadingScreen message="Cargando pedidos..." />
          ) : pedidos.length === 0 ? (
            <EmptyState
              icon="📦"
              titulo={
                hasFilters
                  ? "Sin resultados"
                  : activeTab === "pendientes"
                    ? "No hay pedidos pendientes"
                    : "No hay entregas registradas"
              }
              descripcion={
                hasFilters
                  ? "No se encontraron pedidos con los filtros aplicados."
                  : activeTab === "pendientes"
                    ? "Todos los pedidos cobrados ya fueron entregados. ¡Al día!"
                    : "Todavía no se registraron entregas en el sistema."
              }
            />
          ) : (
            <div className="space-y-2">
              {pedidos.map((pedido) => {
                const dias = diasDesde(pedido.cobrado_at);
                const tieneVerificaciones = (pedido.verificaciones_count || 0) > 0;
                const esHistorial = activeTab === "entregados";
                const EntregaIcon = ENTREGA_ICONS[pedido.metodo_entrega] || Store;

                return (
                  <button
                    key={pedido.id}
                    type="button"
                    onClick={() => router.push(
                      esHistorial
                        ? `/inventario/entregas/historial/${pedido.id}`
                        : `/inventario/entregas/${pedido.id}`
                    )}
                    className={cn(
                      "w-full bg-white rounded-2xl border shadow-sm overflow-hidden transition-all",
                      "flex items-center gap-4 px-6 py-4 text-left",
                      "hover:bg-slate-50 hover:shadow-md hover:border-blue-200 cursor-pointer group",
                      !esHistorial && dias >= 3 && "border-red-200",
                      !esHistorial && dias < 3 && "border-slate-200",
                      esHistorial && "border-slate-200"
                    )}
                  >
                    {/* Icono de entrega */}
                    <div className={cn(
                      "p-2.5 rounded-xl shrink-0 transition-colors",
                      esHistorial ? "bg-emerald-50" : "bg-blue-50 group-hover:bg-blue-100"
                    )}>
                      {esHistorial
                        ? <PackageCheck size={18} className="text-emerald-600" />
                        : <EntregaIcon size={18} className="text-blue-600" />
                      }
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">#{pedido.id}</span>
                        <span className="text-sm font-bold text-slate-800 truncate">
                          {pedido.cliente_nombre || "Sin cliente"}
                        </span>
                        {tieneVerificaciones && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                            <ShieldCheck size={10} />
                            {pedido.verificaciones_count}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {esHistorial ? (
                          <>
                            <span>Entregado: {formatFecha(pedido.entregado_at)}</span>
                            {pedido.entregado_por_username && (
                              <Badge variant="default" className="text-[10px]">
                                {pedido.entregado_por_username}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span>Cobrado: {formatFecha(pedido.cobrado_at)}</span>
                        )}
                      </div>
                    </div>

                    {/* Monto + urgencia */}
                    <div className="flex items-center gap-3 shrink-0">
                      {!esHistorial && getUrgenciaBadge(dias)}
                      <span className="text-sm font-bold text-slate-700">
                        {formatMonto(pedido.total_moneda_negociacion, pedido.moneda_negociacion)}
                      </span>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && totalCount > PAGE_SIZE && (
            <Pagination count={totalCount} pageSize={PAGE_SIZE} currentPage={page} onPageChange={setPage} />
          )}
        </div>
      </main>
    </div>
  );
}
