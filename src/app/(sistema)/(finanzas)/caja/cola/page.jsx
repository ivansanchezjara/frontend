"use client";
import { useState, useEffect } from "react";
import { PageHeader, Pagination, Badge, LoadingScreen, EmptyState, Input, Button } from "@/components/ui";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getColaCobro } from "@/services/apis/caja";
import CobrarPedidoModal from "@/components/caja/CobrarPedidoModal";
import { Receipt, Search, X, Wallet, Truck, Store, Building2, MapPin, Clock, Package } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-PY", {
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
  if (moneda === "PYG") return `₲ ${num.toLocaleString("es-PY")}`;
  if (moneda === "USD") return `$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  if (moneda === "BRL") return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  return String(valor);
}

function getAntiguedad(fecha) {
  if (!fecha) return null;
  const mins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (mins < 60) return { label: `${mins} min`, urgente: mins > 30 };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { label: `${hrs}h ${mins % 60}m`, urgente: hrs >= 1 };
  const dias = Math.floor(hrs / 24);
  return { label: `${dias}d`, urgente: true };
}

const ENTREGA_CONFIG = {
  mostrador: { icon: Store, label: "Mostrador", color: "text-slate-500 bg-slate-100" },
  delivery: { icon: Truck, label: "Delivery", color: "text-blue-600 bg-blue-50" },
  retiro_sucursal: { icon: Building2, label: "Retiro sucursal", color: "text-purple-600 bg-purple-50" },
};

// ─── Componente de tarjeta de pedido ────────────────────────────

function PedidoCard({ pedido, onCobrar }) {
  const antiguedad = getAntiguedad(pedido.confirmed_at);
  const entrega = ENTREGA_CONFIG[pedido.metodo_entrega] || ENTREGA_CONFIG.mostrador;
  const EntregaIcon = entrega.icon;
  const lineas = pedido.lineas || [];
  const totalItems = lineas.reduce((s, l) => s + l.cantidad, 0);

  return (
    <div className={cn(
      "bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-4 space-y-3",
      antiguedad?.urgente ? "border-amber-200" : "border-slate-200"
    )}>
      {/* Header: # + cliente + antigüedad */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400">#{pedido.id}</span>
            {antiguedad && (
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded",
                antiguedad.urgente
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : "bg-slate-50 text-slate-500 border border-slate-200"
              )}>
                <Clock size={9} />
                {antiguedad.label}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-800 mt-1 truncate">
            {pedido.cliente_nombre || "Sin cliente"}
          </p>
          <p className="text-xs text-slate-400 truncate">
            Vendedor: {pedido.vendedor_nombre || pedido.vendedor_username || "—"}
          </p>
        </div>

        {/* Total */}
        <div className="text-right shrink-0">
          <p className="text-base font-black text-slate-800">
            {formatMonto(pedido.total_moneda_negociacion, pedido.moneda_negociacion)}
          </p>
          <Badge variant="info" className="text-[9px] mt-0.5">
            {pedido.moneda_negociacion}
          </Badge>
        </div>
      </div>

      {/* Mini resumen de productos */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Package size={12} className="shrink-0" />
        <span className="font-semibold">{totalItems} ítem{totalItems !== 1 ? "s" : ""}</span>
        <span className="text-slate-300">·</span>
        <span className="truncate">
          {lineas.slice(0, 2).map((l) => l.producto_nombre || l.variante_nombre || l.variante_code).join(", ")}
          {lineas.length > 2 && ` +${lineas.length - 2} más`}
        </span>
      </div>

      {/* Método de entrega + dirección */}
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg", entrega.color)}>
          <EntregaIcon size={11} />
          {entrega.label}
        </span>
        {pedido.metodo_entrega === "delivery" && pedido.direccion_entrega && (
          <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 truncate">
            <MapPin size={9} />
            {pedido.direccion_entrega}
          </span>
        )}
      </div>

      {/* Observaciones */}
      {pedido.observaciones_entrega && (
        <p className="text-[11px] text-slate-400 italic bg-slate-50 rounded-lg px-3 py-1.5 truncate">
          &ldquo;{pedido.observaciones_entrega}&rdquo;
        </p>
      )}

      {/* Acción */}
      <div className="pt-1">
        <Button
          variant="primary"
          size="sm"
          icon={Wallet}
          onClick={() => onCobrar(pedido)}
          className="w-full justify-center"
        >
          Cobrar
        </Button>
      </div>
    </div>
  );
}

// ─── Página Principal ───────────────────────────────────────────

export default function ColaCobrosPage() {
  const { showToast } = useToast();

  const PAGE_SIZE = 24;
  const [page, setPage] = useState(1);
  const [vendedorSearch, setVendedorSearch] = useState("");
  const [clienteSearch, setClienteSearch] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  const debouncedVendedor = useDebounce(vendedorSearch, 500);
  const debouncedCliente = useDebounce(clienteSearch, 500);

  const { data: cobroData, loading, execute: fetchCola } = useApi(getColaCobro, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  useEffect(() => {
    const params = { page, page_size: PAGE_SIZE };
    if (debouncedVendedor) params.vendedor = debouncedVendedor;
    if (debouncedCliente) params.cliente = debouncedCliente;
    fetchCola(params);
  }, [page, debouncedVendedor, debouncedCliente, fetchCola]);

  const pedidos = cobroData?.results || [];
  const totalCount = cobroData?.count || 0;

  const handleCobrar = (pedido) => {
    setPedidoSeleccionado(pedido);
  };

  const handleCobroSuccess = () => {
    setPedidoSeleccionado(null);
    showToast("Cobro registrado correctamente", "success");
    const params = { page, page_size: PAGE_SIZE };
    if (debouncedVendedor) params.vendedor = debouncedVendedor;
    if (debouncedCliente) params.cliente = debouncedCliente;
    fetchCola(params);
  };

  const handleClearFilters = () => {
    setVendedorSearch("");
    setClienteSearch("");
    setPage(1);
  };

  const hasFilters = vendedorSearch || clienteSearch;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Caja y Facturación", href: "/caja" },
          { label: "Cola de Cobro" },
        ]}
        subtitle="Pedidos confirmados pendientes de cobro"
        subtitleClassName="text-purple-600"
      >
        {totalCount > 0 && !loading && (
          <Badge variant="warning" className="text-xs font-bold">
            {totalCount} pendiente{totalCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <Input
                  label="Cliente"
                  placeholder="Buscar por nombre de cliente..."
                  value={clienteSearch}
                  onChange={(e) => {
                    setClienteSearch(e.target.value);
                    setPage(1);
                  }}
                  icon={Search}
                />
              </div>
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <Input
                  label="Vendedor"
                  placeholder="Buscar por nombre de vendedor..."
                  value={vendedorSearch}
                  onChange={(e) => {
                    setVendedorSearch(e.target.value);
                    setPage(1);
                  }}
                  icon={Search}
                />
              </div>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={X}
                  onClick={handleClearFilters}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Contenido */}
          {loading ? (
            <LoadingScreen texto="Cargando pedidos pendientes de cobro..." />
          ) : pedidos.length === 0 ? (
            <EmptyState
              icon={<Receipt size={48} className="text-slate-300 mx-auto mb-4" />}
              title="No hay pedidos pendientes de cobro"
              message={hasFilters
                ? "No se encontraron pedidos con esos filtros."
                : "Todos los pedidos confirmados ya fueron cobrados."
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pedidos.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onCobrar={handleCobrar}
                />
              ))}
            </div>
          )}

          {/* Paginación */}
          {!loading && totalCount > PAGE_SIZE && (
            <Pagination
              count={totalCount}
              pageSize={PAGE_SIZE}
              currentPage={page}
              onPageChange={setPage}
            />
          )}
        </div>
      </main>

      {/* Modal de Cobro */}
      {pedidoSeleccionado && (
        <CobrarPedidoModal
          pedido={pedidoSeleccionado}
          onClose={() => setPedidoSeleccionado(null)}
          onSuccess={handleCobroSuccess}
        />
      )}
    </div>
  );
}
