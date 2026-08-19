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
import { getNotasCreditoInternas } from "@/services/apis/caja";
import {
  FileText, X, Calendar, Hash, Download, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const API_URL = process.env.NEXT_PUBLIC_API_URL || `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:8000/api`;

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
  if (moneda === "USD") return `US$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  if (moneda === "BRL") return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  return String(valor);
}

const ESTADO_BADGE = {
  vigente: { variant: "success", label: "Vigente" },
  anulada: { variant: "danger", label: "Anulada" },
  aplicada: { variant: "info", label: "Aplicada" },
};

export default function NotasCreditoInternasPage() {
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const { data: listData, loading, execute: fetchList } = useApi(getNotasCreditoInternas, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  useEffect(() => {
    const params = { page };
    if (filtroEstado) params.estado = filtroEstado;
    if (fechaDesde) params.fecha_desde = fechaDesde;
    if (fechaHasta) params.fecha_hasta = fechaHasta;
    fetchList(params);
  }, [page, filtroEstado, fechaDesde, fechaHasta, fetchList]);

  const notas = listData?.results || [];
  const totalCount = listData?.count || 0;
  const hasFilters = filtroEstado || fechaDesde || fechaHasta;

  const handleClearFilters = () => {
    setFiltroEstado("");
    setFechaDesde("");
    setFechaHasta("");
    setPage(1);
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Caja", href: "/caja" },
          { label: "Notas de Crédito Internas" },
        ]}
        subtitle={
          <>
            <FileText size={12} />
            Créditos internos por faltantes en entregas (sin validez fiscal)
          </>
        }
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1100px] mx-auto space-y-6">

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[150px]">
                <label className="text-xs font-medium text-slate-500 block mb-1">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                >
                  <option value="">Todos</option>
                  <option value="vigente">Vigente</option>
                  <option value="anulada">Anulada</option>
                  <option value="aplicada">Aplicada</option>
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
            <LoadingScreen message="Cargando notas de crédito internas..." />
          ) : notas.length === 0 ? (
            <EmptyState
              icon="📄"
              titulo={hasFilters ? "Sin resultados" : "Sin notas de crédito internas"}
              descripcion={
                hasFilters
                  ? "No se encontraron NC internas con los filtros aplicados."
                  : "No se emitieron notas de crédito internas todavía."
              }
            />
          ) : (
            <div className="space-y-3">
              {notas.map((nci) => {
                const estadoBadge = ESTADO_BADGE[nci.estado] || ESTADO_BADGE.vigente;
                const isExpanded = expandedId === nci.id;

                return (
                  <div
                    key={nci.id}
                    className={cn(
                      "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all",
                      isExpanded ? "ring-2 ring-purple-200 border-purple-200" : "border-slate-200",
                    )}
                  >
                    {/* Fila resumen */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : nci.id)}
                      className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg shrink-0">
                        NCI #{nci.numero}
                      </span>
                      <span className="text-sm font-bold text-slate-800 truncate flex-1">
                        {nci.cliente_nombre || "Sin cliente"}
                      </span>
                      <Badge variant={estadoBadge.variant} className="text-[10px] shrink-0">
                        {estadoBadge.label}
                      </Badge>
                      <span className="text-sm font-bold text-slate-700 shrink-0">
                        {formatMonto(nci.total, nci.moneda)}
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:block shrink-0">
                        {formatFecha(nci.fecha_emision)}
                      </span>
                      {isExpanded
                        ? <ChevronUp size={16} className="text-slate-400 shrink-0" />
                        : <ChevronDown size={16} className="text-slate-400 shrink-0" />
                      }
                    </button>

                    {/* Detalle expandido */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/30">
                        {/* Info */}
                        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Hash size={11} className="text-slate-400" />
                            Pedido #{nci.venta_id}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText size={11} className="text-slate-400" />
                            Comprobante #{nci.comprobante_numero}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} className="text-slate-400" />
                            {formatFecha(nci.fecha_emision)}
                          </span>
                          <span className="ml-auto text-slate-400">
                            Emitido por: <strong className="text-slate-600">{nci.emitido_por_nombre}</strong>
                          </span>
                        </div>

                        {/* Motivo */}
                        <div className="px-6 py-3 border-b border-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Motivo</p>
                          <p className="text-xs text-slate-600">{nci.motivo}</p>
                        </div>

                        {/* Líneas */}
                        <div className="px-4 py-3">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                <th className="py-2 px-2 text-left">Código</th>
                                <th className="py-2 px-2 text-left">Descripción</th>
                                <th className="py-2 px-2 text-center">Cant.</th>
                                <th className="py-2 px-2 text-right">P. Unit.</th>
                                <th className="py-2 px-2 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(nci.lineas || []).map((linea) => (
                                <tr key={linea.id}>
                                  <td className="py-2 px-2">
                                    <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                      {linea.product_code}
                                    </code>
                                  </td>
                                  <td className="py-2 px-2 text-slate-700">{linea.descripcion}</td>
                                  <td className="py-2 px-2 text-center font-bold">{linea.cantidad}</td>
                                  <td className="py-2 px-2 text-right">{formatMonto(linea.precio_unitario, nci.moneda)}</td>
                                  <td className="py-2 px-2 text-right font-bold">{formatMonto(linea.subtotal, nci.moneda)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-slate-200">
                                <td colSpan={4} className="py-2.5 px-2 text-right font-bold text-slate-600">TOTAL</td>
                                <td className="py-2.5 px-2 text-right font-black text-slate-800 text-sm">
                                  {formatMonto(nci.total, nci.moneda)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Acciones */}
                        <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
                          <a
                            href={`${API_URL}/caja/notas-credito-internas/${nci.id}/pdf/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                          >
                            <Download size={12} />
                            Descargar PDF
                          </a>
                        </div>
                      </div>
                    )}
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
