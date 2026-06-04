"use client";
import { useState, useEffect } from "react";
import { PageHeader, Pagination, Badge, LoadingScreen, EmptyState, Input, Button } from "@/components/ui";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getColaEntrega, entregarPedido } from "@/services/apis/caja";
import { Package, PackageCheck, Search, X } from "lucide-react";

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

export default function EntregaMercaderiaPage() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const PAGE_SIZE = 24;
  const [page, setPage] = useState(1);
  const [clienteSearch, setClienteSearch] = useState("");
  const [fechaCobro, setFechaCobro] = useState("");
  const debouncedCliente = useDebounce(clienteSearch, 500);

  const { data: entregaData, loading, execute: fetchEntrega } = useApi(getColaEntrega, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  const { execute: ejecutarEntrega, loading: entregando } = useApi(entregarPedido, {
    auto: false,
  });

  useEffect(() => {
    const params = { page };
    if (debouncedCliente) params.cliente = debouncedCliente;
    if (fechaCobro) params.fecha_cobro = fechaCobro;
    fetchEntrega(params);
  }, [page, debouncedCliente, fechaCobro, fetchEntrega]);

  const pedidos = entregaData?.results || [];
  const totalCount = entregaData?.count || 0;

  const handleEntrega = async (pedido) => {
    const isConfirmed = await confirm(
      `¿Confirmar la entrega del pedido #${pedido.id} al cliente "${pedido.cliente_nombre}"?`,
      "Registrar Entrega",
    );
    if (!isConfirmed) return;

    try {
      await ejecutarEntrega(pedido.id);
      showToast("Entrega registrada correctamente", "success");
      const params = { page };
      if (debouncedCliente) params.cliente = debouncedCliente;
      if (fechaCobro) params.fecha_cobro = fechaCobro;
      fetchEntrega(params);
    } catch {
      showToast("Error al registrar la entrega", "error");
    }
  };

  const handleClearFilters = () => {
    setClienteSearch("");
    setFechaCobro("");
    setPage(1);
  };

  const hasFilters = clienteSearch || fechaCobro;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Caja", href: "/caja" },
          { label: "Entrega de Mercadería" },
        ]}
        subtitle={
          <>
            <Package size={12} />
            Pedidos cobrados pendientes de entrega al cliente.
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
              <div className="min-w-[180px]">
                <Input
                  label="Fecha de cobro"
                  type="date"
                  value={fechaCobro}
                  onChange={(e) => {
                    setFechaCobro(e.target.value);
                    setPage(1);
                  }}
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
            <LoadingScreen texto="Cargando pedidos pendientes de entrega..." />
          ) : pedidos.length === 0 ? (
            <EmptyState
              icon={<PackageCheck size={48} className="text-slate-300 mx-auto mb-4" />}
              title="No hay pedidos pendientes de entrega"
              message="Todos los pedidos cobrados ya fueron entregados."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                      <th className="py-4 px-6"># Pedido</th>
                      <th className="py-4 px-4">Cliente</th>
                      <th className="py-4 px-4">Fecha Cobro</th>
                      <th className="py-4 px-4 text-right">Total</th>
                      <th className="py-4 px-4">Vendedor</th>
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
                          <span className="text-slate-500">{formatFecha(pedido.cobrado_at)}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-bold text-slate-800">
                            {formatMonto(pedido.total_moneda_negociacion, pedido.moneda_negociacion)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-slate-500">{pedido.vendedor_username || "—"}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={PackageCheck}
                            onClick={() => handleEntrega(pedido)}
                            disabled={entregando}
                          >
                            Registrar Entrega
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
    </div>
  );
}
