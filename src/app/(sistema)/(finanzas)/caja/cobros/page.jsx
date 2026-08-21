"use client";
import { useState, useEffect } from "react";
import {
  PageHeader, Pagination, Badge, LoadingScreen, EmptyState,
  Input, Button, Text,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getColaCobro, getHistorialCobros, getComprobante } from "@/services/apis/caja";
import CobrarPedidoModal from "@/components/caja/CobrarPedidoModal";
import DetalleCobro from "@/components/caja/cobrar/DetalleCobro";
import {
  Receipt, Search, X, Wallet, Truck, Store, Building2,
  MapPin, Clock, Package, Eye, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

// ─── Tarjeta de pedido pendiente ────────────────────────────────

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
          <Text variant="bodySmBold" className="mt-1 truncate !text-slate-800">
            {pedido.cliente_nombre || "Sin cliente"}
          </Text>
          <Text variant="mutedXs" className="truncate">
            Vendedor: {pedido.vendedor_nombre || pedido.vendedor_username || "—"}
          </Text>
        </div>
        <div className="text-right shrink-0">
          <Text variant="bodyBold" className="!text-slate-800">
            {formatMonto(pedido.total_moneda_negociacion, pedido.moneda_negociacion)}
          </Text>
          <Badge variant="info" className="text-[9px] mt-0.5">
            {pedido.moneda_negociacion}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Package size={12} className="shrink-0" />
        <span className="font-semibold">{totalItems} ítem{totalItems !== 1 ? "s" : ""}</span>
        <span className="text-slate-300">·</span>
        <span className="truncate">
          {lineas.slice(0, 2).map((l) => l.producto_nombre || l.variante_nombre || l.variante_code).join(", ")}
          {lineas.length > 2 && ` +${lineas.length - 2} más`}
        </span>
      </div>

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

      {pedido.observaciones_entrega && (
        <Text variant="mutedXs" className="italic bg-slate-50 rounded-lg px-3 py-1.5 truncate !text-[11px]">
          &ldquo;{pedido.observaciones_entrega}&rdquo;
        </Text>
      )}

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

// ─── Página Principal: Cobros ───────────────────────────────────

export default function CobrosPage() {
  const { showToast } = useToast();

  // ─── Estado: Cola de pendientes ─────────────────────────────
  const COLA_PAGE_SIZE = 24;
  const [colaPage, setColaPage] = useState(1);
  const [vendedorSearch, setVendedorSearch] = useState("");
  const [clienteSearch, setClienteSearch] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  const debouncedVendedor = useDebounce(vendedorSearch, 500);
  const debouncedCliente = useDebounce(clienteSearch, 500);

  const { data: colaData, loading: loadingCola, execute: fetchCola } = useApi(getColaCobro, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  useEffect(() => {
    const params = { page: colaPage, page_size: COLA_PAGE_SIZE };
    if (debouncedVendedor) params.vendedor = debouncedVendedor;
    if (debouncedCliente) params.cliente = debouncedCliente;
    fetchCola(params);
  }, [colaPage, debouncedVendedor, debouncedCliente, fetchCola]);

  const pedidos = colaData?.results || [];
  const totalPendientes = colaData?.count || 0;

  // ─── Estado: Historial ──────────────────────────────────────
  const HIST_PAGE_SIZE = 10;
  const [histPage, setHistPage] = useState(1);
  const [histSearch, setHistSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [detalleCobro, setDetalleCobro] = useState(null);

  const debouncedHistSearch = useDebounce(histSearch, 500);

  const { data: histData, loading: loadingHist, execute: fetchHistorial } = useApi(getHistorialCobros, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  useEffect(() => {
    const params = { page: histPage, page_size: HIST_PAGE_SIZE };
    if (debouncedHistSearch) params.search = debouncedHistSearch;
    if (fechaDesde) params.fecha_desde = fechaDesde;
    if (fechaHasta) params.fecha_hasta = fechaHasta;
    fetchHistorial(params);
  }, [histPage, debouncedHistSearch, fechaDesde, fechaHasta, fetchHistorial]);

  const comprobantes = histData?.results || [];
  const totalHist = histData?.count || 0;

  // ─── Handlers ───────────────────────────────────────────────

  const handleCobrar = (pedido) => setPedidoSeleccionado(pedido);

  const handleCobroSuccess = () => {
    setPedidoSeleccionado(null);
    showToast("Cobro registrado correctamente", "success");
    // Refrescar ambas listas
    const colaParams = { page: colaPage, page_size: COLA_PAGE_SIZE };
    if (debouncedVendedor) colaParams.vendedor = debouncedVendedor;
    if (debouncedCliente) colaParams.cliente = debouncedCliente;
    fetchCola(colaParams);

    const histParams = { page: 1, page_size: HIST_PAGE_SIZE };
    setHistPage(1);
    fetchHistorial(histParams);
  };

  const handleVerDetalle = async (comprobante) => {
    try {
      const detalle = await getComprobante(comprobante.id);
      setDetalleCobro(detalle);
    } catch {
      showToast("Error al cargar detalle del cobro", "error");
    }
  };

  const handleClearColaFilters = () => {
    setVendedorSearch("");
    setClienteSearch("");
    setColaPage(1);
  };

  const handleClearHistFilters = () => {
    setHistSearch("");
    setFechaDesde("");
    setFechaHasta("");
    setHistPage(1);
  };

  const hasColaFilters = vendedorSearch || clienteSearch;
  const hasHistFilters = histSearch || fechaDesde || fechaHasta;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Caja y Facturación", href: "/caja" },
          { label: "Cobros" },
        ]}
        subtitle="Cobrar pedidos pendientes y consultar historial"
        subtitleClassName="text-purple-600"
      >
        {totalPendientes > 0 && !loadingCola && (
          <Badge variant="warning" className="text-xs font-bold">
            {totalPendientes} pendiente{totalPendientes !== 1 ? "s" : ""}
          </Badge>
        )}
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-10">

          {/* ════════════════════════════════════════════════════════
              SECCIÓN 1: PENDIENTES DE COBRO
              ════════════════════════════════════════════════════════ */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Text variant="label" className="!text-sm !text-slate-700">
                Pendientes de cobro
              </Text>
              {totalPendientes > 0 && (
                <Badge variant="warning" className="text-[9px]">
                  {totalPendientes}
                </Badge>
              )}
            </div>

            {/* Filtros cola */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px] max-w-[280px]">
                  <Input
                    label="Cliente"
                    placeholder="Buscar cliente..."
                    value={clienteSearch}
                    onChange={(e) => { setClienteSearch(e.target.value); setColaPage(1); }}
                    icon={Search}
                  />
                </div>
                <div className="flex-1 min-w-[200px] max-w-[280px]">
                  <Input
                    label="Vendedor"
                    placeholder="Buscar vendedor..."
                    value={vendedorSearch}
                    onChange={(e) => { setVendedorSearch(e.target.value); setColaPage(1); }}
                    icon={Search}
                  />
                </div>
                {hasColaFilters && (
                  <Button variant="ghost" size="sm" icon={X} onClick={handleClearColaFilters}>
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* Contenido cola */}
            {loadingCola ? (
              <LoadingScreen texto="Cargando pendientes..." />
            ) : pedidos.length === 0 ? (
              <EmptyState
                icon={<Receipt size={40} className="text-slate-300 mx-auto mb-3" />}
                title="Sin pedidos pendientes"
                message={hasColaFilters
                  ? "No se encontraron pedidos con esos filtros."
                  : "Todos los pedidos confirmados ya fueron cobrados."
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pedidos.map((pedido) => (
                  <PedidoCard key={pedido.id} pedido={pedido} onCobrar={handleCobrar} />
                ))}
              </div>
            )}

            {!loadingCola && totalPendientes > COLA_PAGE_SIZE && (
              <div className="mt-4">
                <Pagination
                  count={totalPendientes}
                  pageSize={COLA_PAGE_SIZE}
                  currentPage={colaPage}
                  onPageChange={setColaPage}
                />
              </div>
            )}
          </section>

          {/* ════════════════════════════════════════════════════════
              SECCIÓN 2: HISTORIAL DE COBROS
              ════════════════════════════════════════════════════════ */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Text variant="label" className="!text-sm !text-slate-700">
                Historial de cobros
              </Text>
              {totalHist > 0 && (
                <Badge variant="info" className="text-[9px]">
                  {totalHist}
                </Badge>
              )}
            </div>

            {/* Filtros historial */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px] max-w-[280px]">
                  <Input
                    label="Buscar"
                    placeholder="Cliente, vendedor, nro..."
                    value={histSearch}
                    onChange={(e) => { setHistSearch(e.target.value); setHistPage(1); }}
                    icon={Search}
                  />
                </div>
                <div className="min-w-[140px]">
                  <Text variant="label" as="label" className="block mb-1.5 !text-[10px] !text-slate-500">
                    Desde
                  </Text>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => { setFechaDesde(e.target.value); setHistPage(1); }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm text-slate-700"
                  />
                </div>
                <div className="min-w-[140px]">
                  <Text variant="label" as="label" className="block mb-1.5 !text-[10px] !text-slate-500">
                    Hasta
                  </Text>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => { setFechaHasta(e.target.value); setHistPage(1); }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm text-slate-700"
                  />
                </div>
                {hasHistFilters && (
                  <Button variant="ghost" size="sm" icon={X} onClick={handleClearHistFilters}>
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* Tabla historial */}
            {loadingHist ? (
              <LoadingScreen texto="Cargando historial..." />
            ) : comprobantes.length === 0 ? (
              <EmptyState
                icon={<Calendar size={40} className="text-slate-300 mx-auto mb-3" />}
                title="Sin cobros registrados"
                message={hasHistFilters
                  ? "No se encontraron cobros con esos filtros."
                  : "Aún no se han realizado cobros."
                }
              />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Comprobante</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Fecha</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Cliente</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Cajero</th>
                        <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Total</th>
                        <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Vuelto</th>
                        <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Estado</th>
                        <th className="px-4 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {comprobantes.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                          onClick={() => handleVerDetalle(c)}
                        >
                          <td className="px-4 py-3">
                            <Text variant="bodyXsBold" className="!text-slate-800">
                              {c.numero_completo || `#${c.id}`}
                            </Text>
                            <Text variant="mutedXs" className="!text-[10px]">
                              Venta #{c.venta_id || c.venta}
                            </Text>
                          </td>
                          <td className="px-4 py-3">
                            <Text variant="bodyXs" className="!text-slate-600">
                              {formatFecha(c.fecha_emision)}
                            </Text>
                          </td>
                          <td className="px-4 py-3">
                            <Text variant="bodyXs" className="!text-slate-700 truncate max-w-[160px]">
                              {c.cliente_nombre || "—"}
                            </Text>
                          </td>
                          <td className="px-4 py-3">
                            <Text variant="bodyXs" className="!text-slate-600">
                              {c.cajero_nombre || "—"}
                            </Text>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Text variant="bodyXsBold" className="!text-slate-800">
                              {formatMonto(c.total, c.moneda)}
                            </Text>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {Number(c.vuelto) > 0 ? (
                              <Text variant="bodyXs" className="!text-blue-600">
                                {formatMonto(c.vuelto, c.moneda)}
                              </Text>
                            ) : (
                              <Text variant="mutedXs">—</Text>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={c.estado === "vigente" ? "success" : "error"} className="text-[9px]">
                              {c.estado === "vigente" ? "Vigente" : "Anulado"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loadingHist && totalHist > HIST_PAGE_SIZE && (
              <div className="mt-4">
                <Pagination
                  count={totalHist}
                  pageSize={HIST_PAGE_SIZE}
                  currentPage={histPage}
                  onPageChange={setHistPage}
                />
              </div>
            )}
          </section>
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

      {/* Modal de Detalle */}
      {detalleCobro && (
        <DetalleCobro
          cobro={detalleCobro}
          onClose={() => setDetalleCobro(null)}
        />
      )}
    </div>
  );
}
