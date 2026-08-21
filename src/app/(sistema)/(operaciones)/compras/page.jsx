"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Ship, Filter, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getOrdenesCompra } from "@/services/apis/compras";
import {
  PageHeader,
  SearchBar,
  Button,
  EmptyState,
  LoadingScreen,
  Pagination,
} from "@/components/ui";

const ESTADO_BADGE = {
  borrador: { label: "Borrador", className: "bg-slate-100 text-slate-700" },
  confirmada: { label: "Confirmada", className: "bg-blue-100 text-blue-700" },
  pagada: { label: "Pagada (en tránsito)", className: "bg-amber-100 text-amber-700" },
  recibida_parcial: { label: "Recibida Parcial", className: "bg-purple-100 text-purple-700" },
  recibida: { label: "Recibida", className: "bg-green-100 text-green-700" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-700" },
};

const PAGE_SIZE = 20;

function formatUSD(v) {
  if (v == null) return "—";
  return `US$ ${Number(v).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
}

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ComprasPage() {
  const router = useRouter();

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [page, setPage] = useState(1);

  const busquedaDebounced = useDebounce(busqueda, 400);

  const {
    data: ordenesData,
    loading,
    execute: fetchOrdenes,
  } = useApi(getOrdenesCompra, { auto: false, initialData: { results: [], count: 0 } });

  const cargarDatos = useCallback(() => {
    fetchOrdenes({
      page,
      search: busquedaDebounced || undefined,
      estado: estado || undefined,
    });
  }, [page, busquedaDebounced, estado, fetchOrdenes]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const ordenes = ordenesData?.results || [];
  const totalCount = ordenesData?.count || 0;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[{ label: "Compras e Importaciones" }]}
        subtitle="Órdenes de compra, seguimiento de mercadería en tránsito"
        subtitleClassName="text-blue-600"
      >
        <Link href="/compras/nuevo">
          <Button variant="primary" size="sm" icon={Plus}>
            Nueva Orden
          </Button>
        </Link>
      </PageHeader>

      {/* Barra de búsqueda y filtros */}
      <div className="px-8 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por número, proveedor..."
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={mostrarFiltros ? X : Filter}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            Filtros
          </Button>
        </div>

        {mostrarFiltros && (
          <div className="mt-3 flex items-center gap-3">
            <select
              value={estado}
              onChange={(e) => { setEstado(e.target.value); setPage(1); }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="confirmada">Confirmada</option>
              <option value="pagada">Pagada (en tránsito)</option>
              <option value="recibida_parcial">Recibida Parcial</option>
              <option value="recibida">Recibida</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        )}
      </div>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        {loading ? (
          <LoadingScreen message="Cargando órdenes..." />
        ) : ordenes.length === 0 ? (
          <EmptyState
            icon="🚢"
            titulo="Sin órdenes de compra"
            descripcion="Registrá tu primera orden de compra para empezar a rastrear importaciones."
            onAction={() => router.push("/compras/nuevo")}
            textoBoton="Nueva Orden"
          />
        ) : (
          <>
            {/* Tabla de órdenes */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Número</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Proveedor</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Fecha Orden</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">ETA</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Pagado</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Ítems</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Pagos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ordenes.map((orden) => {
                    const badge = ESTADO_BADGE[orden.estado] || {};
                    return (
                      <tr
                        key={orden.id}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/compras/${orden.id}`)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {orden.numero}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {orden.proveedor}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatFecha(orden.fecha_orden)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatFecha(orden.fecha_estimada_arribo)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatUSD(orden.total_pagado_usd)}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                          {orden.cantidad_items}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                          {orden.cantidad_pagos}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalCount > PAGE_SIZE && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={page}
                  totalItems={totalCount}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
