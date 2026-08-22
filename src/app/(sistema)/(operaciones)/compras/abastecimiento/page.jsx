"use client";

import { useState, useEffect, useCallback } from "react";
import { Filter, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import {
  getTableroAbastecimiento,
  getMarcasConSolicitudes,
  desestimarSolicitud,
} from "@/services/apis/compras";
import {
  PageHeader, Button, LoadingScreen, EmptyState, useToast,
} from "@/components/ui";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import StockDetalleModal from "@/components/compras/StockDetalleModal";

const PRIORIDAD_BADGE = {
  alta: { label: "Alta", className: "bg-red-100 text-red-700" },
  media: { label: "Media", className: "bg-amber-100 text-amber-700" },
  baja: { label: "Baja", className: "bg-slate-100 text-slate-600" },
};

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function TableroAbastecimientoPage() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [marcaFiltro, setMarcaFiltro] = useState("");
  const [detalleItem, setDetalleItem] = useState(null);

  const { data: tablero, loading, execute: fetchTablero } = useApi(
    getTableroAbastecimiento, { auto: false, initialData: [] }
  );
  const { data: marcas, execute: fetchMarcas } = useApi(
    getMarcasConSolicitudes, { auto: false, initialData: [] }
  );

  const cargarDatos = useCallback(() => {
    const params = {};
    if (marcaFiltro) params.marca = marcaFiltro;
    fetchTablero(params);
  }, [marcaFiltro, fetchTablero]);

  useEffect(() => { fetchMarcas(); }, [fetchMarcas]);
  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const items = tablero || [];

  const handleDesestimar = async (solicitudIds) => {
    const ok = await confirm(
      "¿Desestimar estas solicitudes? Se marcarán como no gestionadas.",
      "Desestimar"
    );
    if (!ok) return;
    try {
      for (const id of solicitudIds) {
        await desestimarSolicitud(id);
      }
      showToast("Solicitud(es) desestimada(s)", "success");
      cargarDatos();
    } catch (e) { showToast(e.message || "Error", "error"); }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Compras", href: "/compras" },
          { label: "Solicitudes de Abastecimiento" },
        ]}
        subtitle="Productos solicitados por vendedores, agrupados por demanda"
        subtitleClassName="text-blue-600"
      >
        <Link href="/compras">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>Volver</Button>
        </Link>
      </PageHeader>

      {/* Filtro por marca */}
      <div className="px-8 py-3 bg-white border-b border-slate-200 flex items-center gap-3">
        <Filter size={16} className="text-slate-400" />
        <select
          value={marcaFiltro}
          onChange={(e) => setMarcaFiltro(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">Todas las marcas</option>
          {(marcas || []).map((m) => (
            <option key={m.marca_id} value={m.marca_id}>
              {m.marca_nombre} ({m.cantidad_solicitudes})
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400 ml-auto">
          {items.length} producto{items.length !== 1 ? "s" : ""} solicitado{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        {loading ? (
          <LoadingScreen message="Cargando tablero..." />
        ) : items.length === 0 ? (
          <EmptyState
            icon="✅"
            titulo="Sin solicitudes activas"
            descripcion="No hay productos solicitados por vendedores en este momento."
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Producto</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Prioridad</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Vendedores</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Último Ingreso</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Stock Post-Ingreso</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Stock Actual</th>
                  <th className="w-10 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const badge = PRIORIDAD_BADGE[item.prioridad_maxima] || {};

                  return (
                    <tr key={item.variante_id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setDetalleItem(item)}>
                      {/* Producto */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.producto_nombre}</div>
                        <div className="text-xs text-slate-500">{item.variante_nombre}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-blue-600">{item.variante_codigo}</span>
                          <span className="text-[11px] text-slate-400">·</span>
                          <span className="text-[11px] text-slate-500 font-medium">{item.marca_nombre}</span>
                        </div>
                      </td>

                      {/* Prioridad */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Vendedores */}
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-900">{item.cantidad_vendedores}</span>
                        <div className="text-[11px] text-slate-400 mt-0.5 max-w-[140px] mx-auto truncate" title={item.vendedores.map(v => v.nombre).join(", ")}>
                          {item.vendedores.map((v) => v.nombre).join(", ")}
                        </div>
                      </td>

                      {/* Último Ingreso */}
                      <td className="px-4 py-3 text-center text-slate-600">
                        {formatFecha(item.fecha_ultimo_ingreso)}
                      </td>

                      {/* Stock Post-Ingreso (ingresado + stock anterior) */}
                      <td className="px-4 py-3 text-center">
                        {item.stock_post_ingreso > 0 ? (
                          <span className="font-bold text-slate-800">{item.stock_post_ingreso}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Stock Actual */}
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold text-lg ${item.stock_actual === 0 ? "text-red-600" : "text-slate-900"}`}>
                          {item.stock_actual}
                        </span>
                      </td>

                      {/* Desestimar */}
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDesestimar(item.solicitud_ids); }}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Desestimar"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal de detalle de stock */}
      <StockDetalleModal item={detalleItem} onClose={() => setDetalleItem(null)} />
    </div>
  );
}
