"use client";
import { useState, useEffect } from "react";
import {
  Pagination, Badge, LoadingScreen, EmptyState,
  Input, Button, Text,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getHistorialCobros } from "@/services/apis/caja";
import { Search, X, Eye, Calendar } from "lucide-react";
import { formatFecha, formatMonto } from "./helpers";

const PAGE_SIZE = 10;

export default function HistorialCobros({ onVerDetalle }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const debouncedSearch = useDebounce(search, 500);

  const { data, loading, execute: fetchHistorial } = useApi(getHistorialCobros, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  useEffect(() => {
    const params = { page, page_size: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (fechaDesde) params.fecha_desde = fechaDesde;
    if (fechaHasta) params.fecha_hasta = fechaHasta;
    fetchHistorial(params);
  }, [page, debouncedSearch, fechaDesde, fechaHasta, fetchHistorial]);

  const comprobantes = data?.results || [];
  const total = data?.count || 0;
  const hasFilters = search || fechaDesde || fechaHasta;

  const handleClear = () => {
    setSearch("");
    setFechaDesde("");
    setFechaHasta("");
    setPage(1);
  };

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <Text variant="label" className="!text-sm !text-slate-700">
          Historial de cobros
        </Text>
        {total > 0 && (
          <Badge variant="info" className="text-[9px]">
            {total}
          </Badge>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px] max-w-[280px]">
            <Input
              label="Buscar"
              placeholder="Cliente, vendedor, nro..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
              onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
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
              onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm text-slate-700"
            />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" icon={X} onClick={handleClear}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <LoadingScreen texto="Cargando historial..." />
      ) : comprobantes.length === 0 ? (
        <EmptyState
          icon={<Calendar size={40} className="text-slate-300 mx-auto mb-3" />}
          title="Sin cobros registrados"
          message={hasFilters
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
                    onClick={() => onVerDetalle(c)}
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
