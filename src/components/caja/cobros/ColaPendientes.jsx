"use client";
import { useState, useEffect } from "react";
import {
  Pagination, Badge, LoadingScreen, EmptyState,
  Input, Button, Text,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getColaCobro } from "@/services/apis/caja";
import { Search, X, Receipt } from "lucide-react";
import PedidoCard from "./PedidoCard";

const PAGE_SIZE = 24;

export default function ColaPendientes({ onCobrar }) {
  const [page, setPage] = useState(1);
  const [vendedorSearch, setVendedorSearch] = useState("");
  const [clienteSearch, setClienteSearch] = useState("");

  const debouncedVendedor = useDebounce(vendedorSearch, 500);
  const debouncedCliente = useDebounce(clienteSearch, 500);

  const { data, loading, execute: fetchCola } = useApi(getColaCobro, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  useEffect(() => {
    const params = { page, page_size: PAGE_SIZE };
    if (debouncedVendedor) params.vendedor = debouncedVendedor;
    if (debouncedCliente) params.cliente = debouncedCliente;
    fetchCola(params);
  }, [page, debouncedVendedor, debouncedCliente, fetchCola]);

  const pedidos = data?.results || [];
  const total = data?.count || 0;
  const hasFilters = vendedorSearch || clienteSearch;

  const handleClear = () => {
    setVendedorSearch("");
    setClienteSearch("");
    setPage(1);
  };

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <Text variant="label" className="!text-sm !text-slate-700">
          Pendientes de cobro
        </Text>
        {total > 0 && (
          <Badge variant="warning" className="text-[9px]">
            {total}
          </Badge>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px] max-w-[280px]">
            <Input
              label="Cliente"
              placeholder="Buscar cliente..."
              value={clienteSearch}
              onChange={(e) => { setClienteSearch(e.target.value); setPage(1); }}
              icon={Search}
            />
          </div>
          <div className="flex-1 min-w-[200px] max-w-[280px]">
            <Input
              label="Vendedor"
              placeholder="Buscar vendedor..."
              value={vendedorSearch}
              onChange={(e) => { setVendedorSearch(e.target.value); setPage(1); }}
              icon={Search}
            />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" icon={X} onClick={handleClear}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <LoadingScreen texto="Cargando pendientes..." />
      ) : pedidos.length === 0 ? (
        <EmptyState
          icon={<Receipt size={40} className="text-slate-300 mx-auto mb-3" />}
          title="Sin pedidos pendientes"
          message={hasFilters
            ? "No se encontraron pedidos con esos filtros."
            : "Todos los pedidos confirmados ya fueron cobrados."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pedidos.map((pedido) => (
            <PedidoCard key={pedido.id} pedido={pedido} onNavigate={onCobrar} />
          ))}
        </div>
      )}

      {!loading && total > PAGE_SIZE && (
        <div className="mt-4">
          <Pagination
            count={total}
            pageSize={PAGE_SIZE}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      )}
    </section>
  );
}
