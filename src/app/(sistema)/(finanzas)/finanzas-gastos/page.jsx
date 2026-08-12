"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Filter, FileCheck, FileX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getGastos, getCategoriasGasto } from "@/services/apis/finanzas";
import {
  PageHeader,
  SearchBar,
  Button,
  EmptyState,
  LoadingScreen,
  Pagination,
} from "@/components/ui";

const ESTADO_BADGE = {
  pendiente: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  pagado: { label: "Pagado", className: "bg-green-100 text-green-700" },
  anulado: { label: "Anulado", className: "bg-red-100 text-red-700" },
};

const PAGE_SIZE = 20;

export default function FinanzasGastosPage() {
  const router = useRouter();

  // --- Filtros ---
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [tieneFactura, setTieneFactura] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [page, setPage] = useState(1);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const busquedaDebounced = useDebounce(busqueda, 400);

  // --- API ---
  const {
    data: gastosData,
    loading,
    error,
    execute: fetchGastos,
  } = useApi(getGastos);

  const { data: categorias, execute: fetchCategorias } = useApi(getCategoriasGasto);

  const gastos = gastosData?.results || gastosData || [];
  const count = gastosData?.count || gastos.length || 0;

  // Cargar categorías al montar
  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  // Cargar gastos cuando cambian filtros o página
  useEffect(() => {
    const params = { page };
    if (busquedaDebounced) params.search = busquedaDebounced;
    if (estado) params.estado = estado;
    if (categoria) params.categoria = categoria;
    if (fechaDesde) params.fecha_desde = fechaDesde;
    if (fechaHasta) params.fecha_hasta = fechaHasta;
    if (tieneFactura) params.tiene_factura = tieneFactura;

    fetchGastos(params).then(() => setHasLoadedOnce(true));
  }, [fetchGastos, busquedaDebounced, estado, categoria, fechaDesde, fechaHasta, tieneFactura, page]);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [busquedaDebounced, estado, categoria, fechaDesde, fechaHasta, tieneFactura]);

  // --- Helpers ---
  const hayFiltrosActivos =
    busqueda !== "" || estado !== "" || categoria !== "" || fechaDesde !== "" || fechaHasta !== "" || tieneFactura !== "";

  const limpiarFiltros = useCallback(() => {
    setBusqueda("");
    setEstado("");
    setCategoria("");
    setFechaDesde("");
    setFechaHasta("");
    setTieneFactura("");
  }, []);

  const handleRowClick = useCallback(
    (id) => {
      router.push(`/finanzas-gastos/${id}`);
    },
    [router]
  );

  const handleRowKeyDown = useCallback(
    (e, id) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        router.push(`/finanzas-gastos/${id}`);
      }
    },
    [router]
  );

  // --- Loading inicial ---
  const isInitialLoading = loading && !hasLoadedOnce;
  if (isInitialLoading) return <LoadingScreen texto="Cargando Gastos..." />;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      {/* Header */}
      <PageHeader
        title="Finanzas y Gastos"
        subtitle={`Registro y control de gastos operativos · ${count} registros`}
        subtitleClassName="text-purple-600"
      >
        <Button
          variant="outline"
          icon={Filter}
          size="md"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="rounded-xl font-bold text-xs hover:text-purple-600 hover:border-purple-200 cursor-pointer"
        >
          Filtros
        </Button>
        <Link href="/finanzas-gastos/nuevo">
          <Button
            variant="success"
            icon={Plus}
            size="md"
            className="rounded-xl font-bold text-xs shadow-lg shadow-purple-100 cursor-pointer bg-purple-600 hover:bg-purple-700"
          >
            Nuevo Gasto
          </Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Barra de búsqueda + filtros */}
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative z-20">
            {/* Búsqueda */}
            <SearchBar
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por concepto, número de factura..."
            />

            {/* Filtros expandibles */}
            {mostrarFiltros && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Estado
                  </label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                    onChange={(e) => setEstado(e.target.value)}
                    value={estado}
                    aria-label="Filtrar por estado"
                  >
                    <option value="">Todos</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="anulado">Anulado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Categoría
                  </label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                    onChange={(e) => setCategoria(e.target.value)}
                    value={categoria}
                    aria-label="Filtrar por categoría"
                  >
                    <option value="">Todas</option>
                    {(categorias?.results || categorias || []).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Factura Legal
                  </label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                    onChange={(e) => setTieneFactura(e.target.value)}
                    value={tieneFactura}
                    aria-label="Filtrar por factura"
                  >
                    <option value="">Todos</option>
                    <option value="true">Con factura</option>
                    <option value="false">Sin factura</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                    onChange={(e) => setFechaDesde(e.target.value)}
                    value={fechaDesde}
                    aria-label="Fecha desde"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                    onChange={(e) => setFechaHasta(e.target.value)}
                    value={fechaHasta}
                    aria-label="Fecha hasta"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <p className="font-medium">Error al cargar gastos</p>
              <p className="text-red-600 mt-1">
                {error.message || "Ocurrió un error inesperado. Intentá de nuevo."}
              </p>
            </div>
          )}

          {/* Tabla de gastos */}
          <div
            className={`transition-opacity duration-300 ${
              loading && hasLoadedOnce ? "opacity-50 pointer-events-none" : "opacity-100"
            }`}
          >
            {gastos.length === 0 ? (
              <EmptyState
                titulo={hayFiltrosActivos ? "Sin resultados" : "No hay gastos registrados"}
                descripcion={
                  hayFiltrosActivos
                    ? "Intentá con otros términos o cambiá los filtros."
                    : "Registrá tu primer gasto con el botón \"Nuevo Gasto\"."
                }
                icon={hayFiltrosActivos ? "🔍" : "💰"}
                textoBoton={hayFiltrosActivos ? "Limpiar filtros" : undefined}
                onAction={hayFiltrosActivos ? limpiarFiltros : undefined}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
                        Concepto
                      </th>
                      <th className="text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hidden md:table-cell">
                        Categoría
                      </th>
                      <th className="text-center px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hidden sm:table-cell">
                        Factura
                      </th>
                      <th className="text-right px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
                        Monto
                      </th>
                      <th className="text-right px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hidden lg:table-cell">
                        USD
                      </th>
                      <th className="text-center px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hidden sm:table-cell">
                        Fecha
                      </th>
                      <th className="text-center px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gastos.map((gasto) => {
                      const tieneFactura = !!gasto.factura;
                      return (
                        <tr
                          key={gasto.id}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => handleRowClick(gasto.id)}
                          onKeyDown={(e) => handleRowKeyDown(e, gasto.id)}
                          tabIndex={0}
                          role="link"
                          aria-label={`Ver detalle de gasto: ${gasto.concepto}`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">
                              {gasto.concepto}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                              {gasto.categoria_nombre}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center hidden sm:table-cell">
                            {tieneFactura ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg" title={`Fact. ${gasto.factura.numero_factura || "s/n"} — ${gasto.factura.razon_social_emisor || ""}`}>
                                <FileCheck className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">
                                  {gasto.factura.numero_factura || "Con factura"}
                                </span>
                                <span className="lg:hidden">Sí</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-lg" title="Sin comprobante legal">
                                <FileX className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">Sin factura</span>
                                <span className="lg:hidden">No</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {Number(gasto.monto_original).toLocaleString("es-PY")}{" "}
                            <span className="text-slate-400 text-xs">
                              {gasto.moneda_original}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-600 hidden lg:table-cell">
                            US${" "}
                            {Number(gasto.monto_usd).toLocaleString("es-PY", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 hidden sm:table-cell">
                            {new Date(gasto.fecha_gasto).toLocaleDateString("es-PY")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                ESTADO_BADGE[gasto.estado]?.className || "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {ESTADO_BADGE[gasto.estado]?.label || gasto.estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
    </div>
  );
}
