"use client";
import { useState, useEffect } from "react";
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
import { getDiscrepancias, getDiscrepanciasResumen } from "@/services/apis/inventario";
import {
  AlertTriangle, RefreshCw, PackageX, TriangleAlert,
  Calendar, Hash, TrendingUp, X, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

function formatFecha(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const MOTIVO_CONFIG = {
  lote_no_encontrado: { icon: AlertTriangle, color: "text-orange-600 bg-orange-50 border-orange-200" },
  producto_no_encontrado: { icon: PackageX, color: "text-red-600 bg-red-50 border-red-200" },
  producto_danado: { icon: TriangleAlert, color: "text-purple-600 bg-purple-50 border-purple-200" },
  cantidad_insuficiente: { icon: Hash, color: "text-amber-600 bg-amber-50 border-amber-200" },
};

const RESOLUCION_BADGE = {
  reasignado: { variant: "info", label: "Reasignado" },
  entrega_parcial: { variant: "warning", label: "Entrega parcial" },
  pendiente: { variant: "default", label: "Pendiente" },
};

export default function DiscrepanciasPage() {
  const [page, setPage] = useState(1);
  const [filtroMotivo, setFiltroMotivo] = useState("");
  const [filtroResolucion, setFiltroResolucion] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const { data: listData, loading, execute: fetchList } = useApi(getDiscrepancias, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  const { data: resumen, execute: fetchResumen } = useApi(getDiscrepanciasResumen, {
    auto: false,
    initialData: null,
  });

  useEffect(() => {
    fetchResumen();
  }, [fetchResumen]);

  useEffect(() => {
    const params = { page };
    if (filtroMotivo) params.motivo = filtroMotivo;
    if (filtroResolucion) params.resolucion = filtroResolucion;
    if (fechaDesde) params.fecha_desde = fechaDesde;
    if (fechaHasta) params.fecha_hasta = fechaHasta;
    fetchList(params);
  }, [page, filtroMotivo, filtroResolucion, fechaDesde, fechaHasta, fetchList]);

  const discrepancias = listData?.results || [];
  const totalCount = listData?.count || 0;
  const hasFilters = filtroMotivo || filtroResolucion || fechaDesde || fechaHasta;

  const handleClearFilters = () => {
    setFiltroMotivo("");
    setFiltroResolucion("");
    setFechaDesde("");
    setFechaHasta("");
    setPage(1);
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Inventario", href: "/inventario" },
          { label: "Discrepancias de Stock" },
        ]}
        subtitle={
          <>
            <TriangleAlert size={12} />
            Faltantes y reasignaciones detectados durante entregas
          </>
        }
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* Resumen cards */}
          {resumen && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Últimos 7 días</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{resumen.ultimas_7_dias}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Últimos 30 días</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{resumen.ultimas_30_dias}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pendientes</p>
                <p className={cn("text-2xl font-black mt-1", resumen.pendientes > 0 ? "text-amber-600" : "text-slate-800")}>
                  {resumen.pendientes}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total histórico</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{resumen.total}</p>
              </div>
            </div>
          )}

          {/* Top productos afectados */}
          {resumen?.productos_mas_afectados?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                <TrendingUp size={11} /> Productos más afectados (30 días)
              </p>
              <div className="flex flex-wrap gap-2">
                {resumen.productos_mas_afectados.map((p, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-xs"
                  >
                    <code className="font-mono text-[10px] text-orange-700">{p.product_code}</code>
                    <span className="text-slate-600 truncate max-w-[140px]">{p.producto_nombre}</span>
                    <Badge variant="warning" className="text-[9px]">
                      {p.total_discrepancias}×
                    </Badge>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[160px]">
                <label className="text-xs font-medium text-slate-500 block mb-1">Motivo</label>
                <select
                  value={filtroMotivo}
                  onChange={(e) => { setFiltroMotivo(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Todos</option>
                  <option value="lote_no_encontrado">Lote no encontrado</option>
                  <option value="producto_no_encontrado">Producto no encontrado</option>
                  <option value="producto_danado">Producto dañado</option>
                  <option value="cantidad_insuficiente">Cantidad insuficiente</option>
                </select>
              </div>
              <div className="min-w-[160px]">
                <label className="text-xs font-medium text-slate-500 block mb-1">Resolución</label>
                <select
                  value={filtroResolucion}
                  onChange={(e) => { setFiltroResolucion(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Todas</option>
                  <option value="reasignado">Reasignado</option>
                  <option value="entrega_parcial">Entrega parcial</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>
              <div className="min-w-[150px]">
                <Input
                  label="Desde"
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
                />
              </div>
              <div className="min-w-[150px]">
                <Input
                  label="Hasta"
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
                />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" icon={X} onClick={handleClearFilters}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Lista */}
          {loading ? (
            <LoadingScreen message="Cargando discrepancias..." />
          ) : discrepancias.length === 0 ? (
            <EmptyState
              icon="✅"
              titulo={hasFilters ? "Sin resultados" : "Sin discrepancias"}
              descripcion={
                hasFilters
                  ? "No se encontraron discrepancias con los filtros aplicados."
                  : "No se registraron discrepancias de stock. ¡Todo en orden!"
              }
            />
          ) : (
            <div className="space-y-2">
              {discrepancias.map((d) => {
                const motivoConf = MOTIVO_CONFIG[d.motivo] || MOTIVO_CONFIG.lote_no_encontrado;
                const MotivoIcon = motivoConf.icon;
                const resBadge = RESOLUCION_BADGE[d.resolucion] || RESOLUCION_BADGE.pendiente;

                return (
                  <div
                    key={d.id}
                    className={cn(
                      "bg-white rounded-xl border shadow-sm px-5 py-4 flex items-center gap-4",
                      motivoConf.color.includes("border") ? "" : "border-slate-200",
                    )}
                  >
                    <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg shrink-0", motivoConf.color)}>
                      <MotivoIcon size={16} />
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {d.product_code}
                        </code>
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {d.producto_nombre}
                        </span>
                        <Badge variant={resBadge.variant} className="text-[9px]">
                          {resBadge.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        <span>Pedido #{d.venta}</span>
                        <span>{d.motivo_display}</span>
                        <span>{d.cantidad_afectada} ud.</span>
                        {d.lote_original_codigo && (
                          <span className="flex items-center gap-0.5">
                            <Hash size={9} />{d.lote_original_codigo}
                            {d.lote_reasignado_codigo && (
                              <> → {d.lote_reasignado_codigo}</>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400">{formatFecha(d.reportado_at)}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{d.reportado_por_nombre}</p>
                    </div>
                  </div>
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
