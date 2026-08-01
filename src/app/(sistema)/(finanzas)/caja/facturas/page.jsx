"use client";
import { useState, useEffect } from "react";
import {
  Badge,
  Button,
  PageHeader,
  Pagination,
  LoadingScreen,
  EmptyState,
  useConfirm,
  useToast,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getComprobantes,
  anularComprobante,
  getFacturas,
  anularFactura,
  getNotasCredito,
} from "@/services/apis/caja";
import EmitirNotaCreditoModal from "@/components/caja/EmitirNotaCreditoModal";
import { FileText, Ban, CreditCard, Receipt, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

const TABS = [
  { id: "comprobantes", label: "Comprobantes", icon: Receipt },
  { id: "facturas", label: "Facturas", icon: FileText },
  { id: "notas", label: "Notas de Crédito", icon: CreditCard },
];

const ESTADO_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "vigente", label: "Vigente" },
  { value: "anulado", label: "Anulado" },
];

// Símbolos de moneda
const MONEDA_SIMBOLO = {
  PYG: "₲",
  USD: "$",
  BRL: "R$",
};

export default function FacturasPage() {
  const [activeTab, setActiveTab] = useState("comprobantes");
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [ncModalFactura, setNcModalFactura] = useState(null);

  const { prompt } = useConfirm();
  const { showToast } = useToast();

  // ─── Data fetching por tab ────────────────────────────────────
  const {
    data: comprobantesData,
    loading: loadingComprobantes,
    execute: fetchComprobantes,
  } = useApi(getComprobantes, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  const {
    data: facturasData,
    loading: loadingFacturas,
    execute: fetchFacturas,
  } = useApi(getFacturas, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  const {
    data: notasData,
    loading: loadingNotas,
    execute: fetchNotas,
  } = useApi(getNotasCredito, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  // Carga inicial de todos los tabs para obtener los counts
  useEffect(() => {
    fetchComprobantes({ page: 1 });
    fetchFacturas({ page: 1 });
    fetchNotas({ page: 1 });
  }, [fetchComprobantes, fetchFacturas, fetchNotas]);

  // ─── Fetch helpers ────────────────────────────────────────────
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
    if (tab === "comprobantes") fetchComprobantes(params);
    else if (tab === "facturas") fetchFacturas(params);
    else if (tab === "notas") fetchNotas(params);
  };

  const fetchCurrentTab = (overrides = {}) => {
    fetchTab(activeTab, overrides);
  };

  // ─── Event handlers ───────────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    fetchTab(tab, { page: 1 });
  };

  const handleEstadoChange = (value) => {
    setFiltroEstado(value);
    setPage(1);
    fetchCurrentTab({ page: 1, estado: value });
  };

  const handleFechaDesdeChange = (value) => {
    setFiltroFechaDesde(value);
    setPage(1);
    fetchCurrentTab({ page: 1, fecha_desde: value });
  };

  const handleFechaHastaChange = (value) => {
    setFiltroFechaHasta(value);
    setPage(1);
    fetchCurrentTab({ page: 1, fecha_hasta: value });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchCurrentTab({ page: newPage });
  };

  const handleResetFiltros = () => {
    setFiltroEstado("");
    setFiltroFechaDesde("");
    setFiltroFechaHasta("");
    setPage(1);
    fetchTab(activeTab, { page: 1, estado: "", fecha_desde: "", fecha_hasta: "" });
  };

  const hayFiltrosActivos = filtroEstado || filtroFechaDesde || filtroFechaHasta;

  // ─── Acciones ─────────────────────────────────────────────────
  const handleAnularComprobante = async (comprobante) => {
    const motivo = await prompt(
      "Ingrese el motivo de anulación del comprobante.",
      "Anular Comprobante",
      { placeholder: "Motivo de anulación..." }
    );
    if (!motivo) return;

    try {
      await anularComprobante(comprobante.id, { motivo_anulacion: motivo });
      showToast("Comprobante anulado exitosamente", "success");
      fetchCurrentTab();
    } catch (err) {
      showToast(err?.message || "Error al anular el comprobante", "error");
    }
  };

  const handleAnularFactura = async (factura) => {
    const motivo = await prompt(
      "Ingrese el motivo de anulación de la factura.",
      "Anular Factura",
      { placeholder: "Motivo de anulación..." }
    );
    if (!motivo) return;

    try {
      await anularFactura(factura.id, { motivo_anulacion: motivo });
      showToast("Factura anulada exitosamente", "success");
      fetchCurrentTab();
    } catch (err) {
      showToast(err?.message || "Error al anular la factura", "error");
    }
  };

  const handleEmitirNC = (factura) => {
    setNcModalFactura(factura);
  };

  const handleNCSuccess = () => {
    setNcModalFactura(null);
    fetchCurrentTab();
    // Refrescar notas también
    fetchNotas({ page: 1 });
  };

  // ─── Helpers ──────────────────────────────────────────────────
  const formatFecha = (fecha) => {
    if (!fecha) return "—";
    const d = new Date(fecha);
    return d.toLocaleDateString("es-PY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatMonto = (monto, moneda) => {
    const simbolo = MONEDA_SIMBOLO[moneda] || MONEDA_SIMBOLO.PYG;
    if (moneda === "PYG") {
      return `${simbolo} ${new Intl.NumberFormat("es-PY").format(monto || 0)}`;
    }
    return `${simbolo} ${new Intl.NumberFormat("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto || 0)}`;
  };

  const renderEstadoBadge = (estado) => {
    if (estado === "vigente") return <Badge variant="success">Vigente</Badge>;
    if (estado === "anulado" || estado === "anulada")
      return <Badge variant="danger">Anulado</Badge>;
    return <Badge>{estado}</Badge>;
  };

  // Counts por tab
  const tabCounts = {
    comprobantes: comprobantesData?.count || 0,
    facturas: facturasData?.count || 0,
    notas: notasData?.count || 0,
  };

  const currentLoading =
    activeTab === "comprobantes"
      ? loadingComprobantes
      : activeTab === "facturas"
        ? loadingFacturas
        : loadingNotas;

  const currentData =
    activeTab === "comprobantes"
      ? comprobantesData
      : activeTab === "facturas"
        ? facturasData
        : notasData;

  const items = currentData?.results || [];
  const count = currentData?.count || 0;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Caja y Facturación", href: "/caja" },
          { label: "Facturas y Comprobantes" },
        ]}
        subtitle={
          <>
            <FileText size={12} /> Gestión de documentos fiscales y comprobantes internos
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Tabs con contadores */}
          <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const tabCount = tabCounts[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center",
                    activeTab === tab.id
                      ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tabCount > 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                        activeTab === tab.id
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {tabCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Estado:
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => handleEstadoChange(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
              >
                {ESTADO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Desde:
              </label>
              <input
                type="date"
                value={filtroFechaDesde}
                onChange={(e) => handleFechaDesdeChange(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Hasta:
              </label>
              <input
                type="date"
                value={filtroFechaHasta}
                onChange={(e) => handleFechaHastaChange(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
              />
            </div>

            {/* Botón reset */}
            {hayFiltrosActivos && (
              <button
                onClick={handleResetFiltros}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-all"
              >
                <RotateCcw size={13} />
                Limpiar
              </button>
            )}
          </div>

          {/* Contenido */}
          {currentLoading ? (
            <LoadingScreen message="Cargando documentos..." />
          ) : items.length === 0 ? (
            <EmptyState
              icon="📄"
              title="No se encontraron documentos"
              description="No hay registros que coincidan con los filtros seleccionados."
            />
          ) : (
            <>
              {activeTab === "comprobantes" && (
                <TablaComprobantes
                  items={items}
                  onAnular={handleAnularComprobante}
                  formatFecha={formatFecha}
                  formatMonto={formatMonto}
                  renderEstadoBadge={renderEstadoBadge}
                />
              )}
              {activeTab === "facturas" && (
                <TablaFacturas
                  items={items}
                  onAnular={handleAnularFactura}
                  onEmitirNC={handleEmitirNC}
                  formatFecha={formatFecha}
                  formatMonto={formatMonto}
                  renderEstadoBadge={renderEstadoBadge}
                />
              )}
              {activeTab === "notas" && (
                <TablaNotasCredito
                  items={items}
                  formatFecha={formatFecha}
                  formatMonto={formatMonto}
                  renderEstadoBadge={renderEstadoBadge}
                />
              )}

              {count > PAGE_SIZE && (
                <Pagination
                  count={count}
                  pageSize={PAGE_SIZE}
                  currentPage={page}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Emitir Nota de Crédito */}
      {ncModalFactura && (
        <EmitirNotaCreditoModal
          factura={ncModalFactura}
          onClose={() => setNcModalFactura(null)}
          onSuccess={handleNCSuccess}
        />
      )}
    </div>
  );
}

// ─── Tabla Comprobantes Internos ──────────────────────────────────
function TablaComprobantes({
  items,
  onAnular,
  formatFecha,
  formatMonto,
  renderEstadoBadge,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Número
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Fecha
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Cliente
              </th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Total
              </th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Estado
              </th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "hover:bg-slate-50/60 transition-colors",
                  item.estado === "anulado" && "opacity-50"
                )}
              >
                <td className="px-4 py-3 font-bold text-slate-800">
                  {item.numero}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatFecha(item.fecha_emision)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {item.cliente_nombre || item.venta_cliente || "—"}
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">
                  {formatMonto(item.total, item.moneda || "PYG")}
                </td>
                <td className="px-4 py-3 text-center">
                  {renderEstadoBadge(item.estado)}
                </td>
                <td className="px-4 py-3 text-center">
                  {item.estado === "vigente" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAnular(item)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Ban size={14} className="mr-1" />
                      Anular
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
function TablaFacturas({
  items,
  onAnular,
  onEmitirNC,
  formatFecha,
  formatMonto,
  renderEstadoBadge,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Número
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Fecha
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                RUC
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Razón Social
              </th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Total
              </th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Estado
              </th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "hover:bg-slate-50/60 transition-colors",
                  (item.estado === "anulado" || item.estado === "anulada") && "opacity-50"
                )}
              >
                <td className="px-4 py-3 font-bold text-slate-800 font-mono">
                  {item.numero_completo}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatFecha(item.fecha_emision)}
                </td>
                <td className="px-4 py-3 text-slate-700 font-mono">
                  {item.ruc_destinatario}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {item.razon_social}
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">
                  {formatMonto(item.total, item.moneda || "PYG")}
                </td>
                <td className="px-4 py-3 text-center">
                  {renderEstadoBadge(item.estado)}
                </td>
                <td className="px-4 py-3 text-center">
                  {item.estado === "vigente" && (
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAnular(item)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Ban size={14} className="mr-1" />
                        Anular
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEmitirNC(item)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <CreditCard size={14} className="mr-1" />
                        NC
                      </Button>
                    </div>
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

// ─── Tabla Notas de Crédito ─────────────────────────────────────
function TablaNotasCredito({ items, formatFecha, formatMonto, renderEstadoBadge }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Número
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Factura Original
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Motivo
              </th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Total
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Fecha
              </th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "hover:bg-slate-50/60 transition-colors",
                  (item.estado === "anulado" || item.estado === "anulada") && "opacity-50"
                )}
              >
                <td className="px-4 py-3 font-bold text-slate-800 font-mono">
                  {item.numero_completo || item.numero}
                </td>
                <td className="px-4 py-3 text-slate-700 font-mono">
                  {item.factura_original_numero || item.factura_original || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                  {item.motivo}
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">
                  {formatMonto(item.total, item.moneda || "PYG")}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatFecha(item.fecha_emision)}
                </td>
                <td className="px-4 py-3 text-center">
                  {renderEstadoBadge(item.estado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
