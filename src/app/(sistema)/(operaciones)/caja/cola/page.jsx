"use client";
import { useState, useEffect } from "react";
import { PageHeader, Pagination, Badge, LoadingScreen, EmptyState, Input, Button } from "@/components/ui";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getColaCobro } from "@/services/apis/caja";
import CobrarPedidoModal from "@/components/caja/CobrarPedidoModal";
import { Receipt, Search, X, Wallet } from "lucide-react";

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
  if (moneda === "USD") return `US$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  if (moneda === "BRL") return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  return String(valor);
}

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
    const params = { page };
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
    const params = { page };
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
        subtitle={
          <>
            <Wallet size={12} />
            Pedidos confirmados pendientes de cobro.
          </>
        }
      />

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <Input
                  label="Cliente"
                  placeholder="Buscar por cliente..."
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
                  placeholder="Buscar por vendedor..."
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
              message="Todos los pedidos confirmados ya fueron cobrados."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                      <th className="py-4 px-6"># Pedido</th>
                      <th className="py-4 px-4">Cliente</th>
                      <th className="py-4 px-4">Vendedor</th>
                      <th className="py-4 px-4">Fecha Confirmación</th>
                      <th className="py-4 px-4 text-right">Total</th>
                      <th className="py-4 px-4">Moneda</th>
                      <th className="py-4 px-6 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="text-slate-400 font-bold">#{pedido.id}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-slate-700 font-bold">{pedido.cliente_nombre || "—"}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-slate-500">{pedido.vendedor_username || "—"}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-slate-500">{formatFecha(pedido.confirmed_at)}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-bold text-slate-800">
                            {formatMonto(pedido.total_moneda_negociacion, pedido.moneda_negociacion)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="info" size="sm">
                            {pedido.moneda_negociacion || "—"}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Wallet}
                            onClick={() => handleCobrar(pedido)}
                          >
                            Cobrar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
