"use client";
import { useState, useEffect } from "react";
import {
  Badge,
  Button,
  PageHeader,
  Pagination,
  LoadingScreen,
  EmptyState,
  Modal,
  useToast,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getComprobantes,
  getFacturas,
  getNotasCredito,
  getNotasCreditoInternas,
} from "@/services/apis/caja";
import EmitirNotaCreditoModal from "@/components/caja/EmitirNotaCreditoModal";
import {
  FileText, CreditCard, Receipt, RotateCcw, Banknote,
  Download, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;
const API_URL = process.env.NEXT_PUBLIC_API_URL || `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:8000/api`;

const TABS = [
  { id: "cobros", label: "Cobros", icon: Receipt },
  { id: "facturas", label: "Facturas", icon: FileText },
  { id: "notas", label: "Notas de Crédito", icon: CreditCard },
];

const ESTADO_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "vigente", label: "Vigente" },
  { value: "anulado", label: "Anulado" },
];

const MONEDA_SIMBOLO = { PYG: "₲", USD: "$", BRL: "R$" };

const METODO_LABELS = {
  efectivo_pyg: "Efectivo PYG",
  efectivo_usd: "Efectivo USD",
  efectivo_brl: "Efectivo BRL",
  cheque_pyg: "Cheque PYG",
  cheque_usd: "Cheque USD",
  transferencia_pyg: "Transferencia",
  tarjeta_credito: "Tarjeta Crédito",
  tarjeta_debito: "Tarjeta Débito",
  pix: "PIX",
  cuotas: "Cuotas",
};

function formatMetodo(metodo) {
  return METODO_LABELS[metodo] || metodo;
}

function formatMetodosBadge(detallePagos) {
  if (!detallePagos || detallePagos.length === 0) return "—";
  const metodos = [...new Set(detallePagos.map((p) => p.metodo))];
  if (metodos.length === 1) return formatMetodo(metodos[0]);
  return `${formatMetodo(metodos[0])} +${metodos.length - 1}`;
}

export default function FacturasPage() {
  const [activeTab, setActiveTab] = useState("cobros");
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [ncModalItem, setNcModalItem] = useState(null);
  const [detalleModal, setDetalleModal] = useState(null);

  const { showToast } = useToast();

  // ─── Data fetching ────────────────────────────────────────────
  const { data: cobrosData, loading: loadingCobros, execute: fetchCobros } =
    useApi(getComprobantes, { auto: false, initialData: { results: [], count: 0 } });

  const { data: facturasData, loading: loadingFacturas, execute: fetchFacturas } =
    useApi(getFacturas, { auto: false, initialData: { results: [], count: 0 } });

  const { data: ncLegalData, loading: loadingNcLegal, execute: fetchNcLegal } =
    useApi(getNotasCredito, { auto: false, initialData: { results: [], count: 0 } });

  const { data: ncInternaData, loading: loadingNcInterna, execute: fetchNcInterna } =
    useApi(getNotasCreditoInternas, { auto: false, initialData: { results: [], count: 0 } });

  useEffect(() => {
    fetchCobros({ page: 1 });
    fetchFacturas({ page: 1 });
    fetchNcLegal({ page: 1 });
    fetchNcInterna({ page: 1 });
  }, [fetchCobros, fetchFacturas, fetchNcLegal, fetchNcInterna]);

  // ─── Helpers ──────────────────────────────────────────────────
  const buildParams = (overrides = {}) => {
    const params = { page: overrides.page ?? page };
    const estado = overrides.estado !== undefined ? overrides.estado : filtroEstado;
    const desde = overrides.fecha_desde !== undefined ? overrides.fecha_desde : filtroFechaDesde;
    const hasta = overrides.fecha_hasta !== undefined ? overrides.fecha_hasta : filtroFechaHasta;
    if (estado) params.estado = estado;
    if (desde) params.fecha_desde = desde;
    if (hasta) params.fecha_hasta = hasta;
    return params;
  };

  const fetchTab = (tab, overrides = {}) => {
    const params = buildParams(overrides);
    if (tab === "cobros") fetchCobros(params);
    else if (tab === "facturas") fetchFacturas(params);
    else if (tab === "notas") { fetchNcLegal(params); fetchNcInterna(params); }
  };

  const fetchCurrentTab = (overrides = {}) => fetchTab(activeTab, overrides);

  const handleTabChange = (tab) => { setActiveTab(tab); setPage(1); fetchTab(tab, { page: 1 }); };
  const handleEstadoChange = (v) => { setFiltroEstado(v); setPage(1); fetchCurrentTab({ page: 1, estado: v }); };
  const handleFechaDesdeChange = (v) => { setFiltroFechaDesde(v); setPage(1); fetchCurrentTab({ page: 1, fecha_desde: v }); };
  const handleFechaHastaChange = (v) => { setFiltroFechaHasta(v); setPage(1); fetchCurrentTab({ page: 1, fecha_hasta: v }); };
  const handlePageChange = (p) => { setPage(p); fetchCurrentTab({ page: p }); };
  const handleResetFiltros = () => {
    setFiltroEstado(""); setFiltroFechaDesde(""); setFiltroFechaHasta(""); setPage(1);
    fetchTab(activeTab, { page: 1, estado: "", fecha_desde: "", fecha_hasta: "" });
  };

  const hayFiltrosActivos = filtroEstado || filtroFechaDesde || filtroFechaHasta;

  const handleEmitirNC = (item) => setNcModalItem(item);
  const handleNCSuccess = () => {
    setNcModalItem(null);
    fetchCurrentTab();
    fetchNcLegal({ page: 1 });
    fetchNcInterna({ page: 1 });
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "—";
    const d = new Date(fecha);
    return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatMonto = (monto, moneda) => {
    const simbolo = MONEDA_SIMBOLO[moneda] || MONEDA_SIMBOLO.PYG;
    if (moneda === "PYG") return `${simbolo} ${new Intl.NumberFormat("es-PY").format(monto || 0)}`;
    return `${simbolo} ${new Intl.NumberFormat("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto || 0)}`;
  };

  const renderEstadoBadge = (estado) => {
    if (estado === "vigente") return <Badge variant="success">Vigente</Badge>;
    if (estado === "anulado" || estado === "anulada") return <Badge variant="danger">Anulado</Badge>;
    if (estado === "aplicada") return <Badge variant="info">Aplicada</Badge>;
    return <Badge>{estado}</Badge>;
  };

  // Counts
  const ncTotalCount = (ncLegalData?.count || 0) + (ncInternaData?.count || 0);
  const tabCounts = {
    cobros: cobrosData?.count || 0,
    facturas: facturasData?.count || 0,
    notas: ncTotalCount,
  };

  const currentLoading = activeTab === "cobros" ? loadingCobros : activeTab === "facturas" ? loadingFacturas : (loadingNcLegal || loadingNcInterna);

  // Para cobros y facturas, data directa. Para notas, merge.
  let items = [];
  let count = 0;
  if (activeTab === "cobros") { items = cobrosData?.results || []; count = cobrosData?.count || 0; }
  else if (activeTab === "facturas") { items = facturasData?.results || []; count = facturasData?.count || 0; }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[{ label: "Caja y Facturación", href: "/caja" }, { label: "Documentos" }]}
        subtitle={<><FileText size={12} /> Comprobantes, facturas y notas de crédito</>}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const tabCount = tabCounts[tab.id];
              return (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center",
                    activeTab === tab.id ? "bg-purple-600 text-white shadow-md shadow-purple-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  )}>
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tabCount > 0 && (
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                      activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>{tabCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado:</label>
              <select value={filtroEstado} onChange={(e) => handleEstadoChange(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all">
                {ESTADO_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Desde:</label>
              <input type="date" value={filtroFechaDesde} onChange={(e) => handleFechaDesdeChange(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hasta:</label>
              <input type="date" value={filtroFechaHasta} onChange={(e) => handleFechaHastaChange(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
            </div>
            {hayFiltrosActivos && (
              <button onClick={handleResetFiltros} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-all">
                <RotateCcw size={13} /> Limpiar
              </button>
            )}
          </div>

          {/* Contenido */}
          {currentLoading ? (
            <LoadingScreen message="Cargando documentos..." />
          ) : (
            <>
              {activeTab === "cobros" && (
                items.length === 0 ? <EmptyState icon="📄" title="Sin cobros" description="No hay comprobantes registrados." /> : (
                  <>
                    <TablaCobros items={items} onVerDetalle={setDetalleModal} onEmitirNC={handleEmitirNC}
                      formatFecha={formatFecha} formatMonto={formatMonto} renderEstadoBadge={renderEstadoBadge} />
                    {count > PAGE_SIZE && <Pagination count={count} pageSize={PAGE_SIZE} currentPage={page} onPageChange={handlePageChange} />}
                  </>
                )
              )}
              {activeTab === "facturas" && (
                items.length === 0 ? <EmptyState icon="📄" title="Sin facturas" description="No hay facturas legales emitidas." /> : (
                  <>
                    <TablaFacturas items={items} onVerDetalle={setDetalleModal} onEmitirNC={handleEmitirNC}
                      formatFecha={formatFecha} formatMonto={formatMonto} renderEstadoBadge={renderEstadoBadge} />
                    {count > PAGE_SIZE && <Pagination count={count} pageSize={PAGE_SIZE} currentPage={page} onPageChange={handlePageChange} />}
                  </>
                )
              )}
              {activeTab === "notas" && (
                <TabNotas ncLegal={ncLegalData?.results || []} ncInterna={ncInternaData?.results || []}
                  formatFecha={formatFecha} formatMonto={formatMonto} renderEstadoBadge={renderEstadoBadge} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Detalle */}
      {detalleModal && <DetalleModal item={detalleModal} onClose={() => setDetalleModal(null)} formatMonto={formatMonto} formatFecha={formatFecha} />}

      {/* Modal NC */}
      {ncModalItem && <EmitirNotaCreditoModal factura={ncModalItem} onClose={() => setNcModalItem(null)} onSuccess={handleNCSuccess} />}
    </div>
  );
}


// ─── Modal Detalle ──────────────────────────────────────────────
function DetalleModal({ item, onClose, formatMonto, formatFecha }) {
  const pagos = item.detalle_pagos || [];
  const moneda = item.moneda || "PYG";

  return (
    <Modal open onClose={onClose} title={`Detalle — ${item.numero_completo}`} size="md">
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Cliente</p>
            <p className="text-sm font-semibold text-slate-800">{item.cliente_nombre || item.razon_social || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Fecha</p>
            <p className="text-sm text-slate-700">{formatFecha(item.fecha_emision)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Vendedor</p>
            <p className="text-sm text-slate-700">{item.vendedor_nombre || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Estado</p>
            <Badge variant={item.estado === "vigente" ? "success" : "danger"}>
              {item.estado === "vigente" ? "Vigente" : "Anulado"}
            </Badge>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Total</p>
            <p className="text-xl font-black text-slate-800">{formatMonto(item.total, moneda)}</p>
          </div>
          {item.vuelto > 0 && (
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-slate-400">Vuelto</p>
              <p className="text-sm font-bold text-blue-600">{formatMonto(item.vuelto, moneda)}</p>
            </div>
          )}
        </div>

        {pagos.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Pagos registrados</p>
            <div className="space-y-2">
              {pagos.map((pago, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Banknote size={14} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{formatMetodo(pago.metodo)}</span>
                    {pago.referencia && <span className="text-[10px] text-slate-400">({pago.referencia})</span>}
                  </div>
                  <span className="text-sm font-bold text-slate-800">{formatMonto(pago.monto, pago.moneda || moneda)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.ruc_destinatario && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">RUC</p>
              <p className="text-sm font-mono text-slate-700">{item.ruc_destinatario}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Razón Social</p>
              <p className="text-sm text-slate-700">{item.razon_social}</p>
            </div>
          </div>
        )}

        {item.motivo_anulacion && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-[10px] font-bold uppercase text-red-500 mb-1">Motivo de anulación</p>
            <p className="text-sm text-red-700">{item.motivo_anulacion}</p>
          </div>
        )}
      </div>
      <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  );
}

// ─── Tabla Cobros (Comprobantes Internos) ─────────────────────────
function TablaCobros({ items, onVerDetalle, onEmitirNC, formatFecha, formatMonto, renderEstadoBadge }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Número</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Fecha</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Cliente</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Método</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Total</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Estado</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className={cn("hover:bg-slate-50/60 transition-colors", item.estado === "anulado" && "opacity-50")}>
                <td className="px-4 py-3">
                  <button onClick={() => onVerDetalle(item)} className="font-bold text-purple-700 hover:text-purple-900 hover:underline font-mono text-left">
                    {item.numero_completo}
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatFecha(item.fecha_emision)}</td>
                <td className="px-4 py-3 text-slate-700">{item.cliente_nombre || "—"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {formatMetodosBadge(item.detalle_pagos)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">{formatMonto(item.total, item.moneda || "PYG")}</td>
                <td className="px-4 py-3 text-center">{renderEstadoBadge(item.estado)}</td>
                <td className="px-4 py-3 text-center">
                  {item.estado === "vigente" && (
                    <Button variant="ghost" size="sm" onClick={() => onEmitirNC(item)} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                      <CreditCard size={14} className="mr-1" /> NC
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tabla Facturas Legales ───────────────────────────────────────
function TablaFacturas({ items, onVerDetalle, onEmitirNC, formatFecha, formatMonto, renderEstadoBadge }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Número</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Fecha</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">RUC</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Razón Social</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Total</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Estado</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className={cn("hover:bg-slate-50/60 transition-colors", (item.estado === "anulado" || item.estado === "anulada") && "opacity-50")}>
                <td className="px-4 py-3">
                  <button onClick={() => onVerDetalle(item)} className="font-bold text-purple-700 hover:text-purple-900 hover:underline font-mono text-left">
                    {item.numero_completo}
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatFecha(item.fecha_emision)}</td>
                <td className="px-4 py-3 text-slate-700 font-mono">{item.ruc_destinatario}</td>
                <td className="px-4 py-3 text-slate-700">{item.razon_social}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">{formatMonto(item.total, item.moneda || "PYG")}</td>
                <td className="px-4 py-3 text-center">{renderEstadoBadge(item.estado)}</td>
                <td className="px-4 py-3 text-center">
                  {item.estado === "vigente" && (
                    <Button variant="ghost" size="sm" onClick={() => onEmitirNC(item)} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                      <CreditCard size={14} className="mr-1" /> Nota de Crédito
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab Notas de Crédito (Legales + Internas unificadas) ────────
function TabNotas({ ncLegal, ncInterna, formatFecha, formatMonto, renderEstadoBadge }) {
  // Merge y ordenar por fecha más reciente
  const allNotas = [
    ...ncLegal.map((n) => ({ ...n, tipo_nc: "legal" })),
    ...ncInterna.map((n) => ({ ...n, tipo_nc: "interna", numero_completo: `NCI-${n.numero}` })),
  ].sort((a, b) => new Date(b.fecha_emision) - new Date(a.fecha_emision));

  if (allNotas.length === 0) {
    return <EmptyState icon="📄" title="Sin notas de crédito" description="No se han emitido notas de crédito todavía." />;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Número</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Tipo</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Referencia</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Motivo</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Total</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Fecha</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Estado</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allNotas.map((item) => (
              <tr key={`${item.tipo_nc}-${item.id}`} className={cn("hover:bg-slate-50/60 transition-colors", (item.estado === "anulado" || item.estado === "anulada") && "opacity-50")}>
                <td className="px-4 py-3 font-bold text-slate-800 font-mono">{item.numero_completo}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={item.tipo_nc === "legal" ? "primary" : "default"} className="text-[10px]">
                    {item.tipo_nc === "legal" ? "Legal" : "Interna"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-700 font-mono text-xs">
                  {item.tipo_nc === "legal"
                    ? (item.factura_original_numero || "—")
                    : (`Comp. #${item.comprobante_numero || item.venta_id || "—"}`)
                  }
                </td>
                <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{item.motivo}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">{formatMonto(item.total, item.moneda || "PYG")}</td>
                <td className="px-4 py-3 text-slate-600">{formatFecha(item.fecha_emision)}</td>
                <td className="px-4 py-3 text-center">{renderEstadoBadge(item.estado)}</td>
                <td className="px-4 py-3 text-center">
                  {item.tipo_nc === "interna" && (
                    <a href={`${API_URL}/caja/notas-credito-internas/${item.id}/pdf/`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-purple-600 hover:bg-purple-50 transition-colors">
                      <Download size={11} /> PDF
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
