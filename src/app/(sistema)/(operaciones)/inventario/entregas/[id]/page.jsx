"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PageHeader,
  Badge,
  Button,
  LoadingScreen,
  useToast,
  useConfirm,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getEntregaDetalle,
  entregarPedido,
  registrarVerificacion,
  verificarCodigo,
  getLotesAlternativos,
  reasignarLote,
  reportarFaltante,
} from "@/services/apis/caja";
import {
  Package, X, MapPin, Warehouse, Calendar, Hash, Truck, Store,
  CheckCircle2, ScanBarcode, UserCheck, ShieldCheck, AlertCircle,
  AlertTriangle, RefreshCw, PackageX, TriangleAlert, ArrowLeft,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatFechaCorta(fecha) {
  if (!fecha) return "—";
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

function formatMonto(valor, moneda) {
  if (valor == null) return "—";
  const num = Number(valor);
  if (moneda === "PYG") return `₲ ${num.toLocaleString("es-PY")}`;
  if (moneda === "USD") return `US$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  if (moneda === "BRL") return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  return String(valor);
}

const ENTREGA_CONFIG = {
  mostrador: { icon: Store, label: "Retira en mostrador", color: "text-violet-600" },
  delivery: { icon: Truck, label: "Delivery", color: "text-blue-600" },
  retiro_sucursal: { icon: Store, label: "Retiro sucursal", color: "text-teal-600" },
};

const MOTIVOS_DISCREPANCIA = [
  { value: "lote_no_encontrado", label: "Lote no encontrado", icon: AlertTriangle },
  { value: "producto_no_encontrado", label: "Producto no encontrado", icon: PackageX },
  { value: "producto_danado", label: "Producto dañado", icon: TriangleAlert },
  { value: "cantidad_insuficiente", label: "Cantidad insuficiente en lote", icon: AlertCircle },
];

// ─── Modal de Reasignación de Lote ──────────────────────────────

function ModalReasignarLote({ pedidoId, linea, asignacion, onClose, onReasignado }) {
  const { showToast } = useToast();
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const fetchLotes = async () => {
      try {
        const res = await getLotesAlternativos(pedidoId, linea.id, asignacion?.lote_id);
        setLotes(res.lotes || []);
      } catch {
        showToast("Error al cargar lotes alternativos", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchLotes();
  }, [pedidoId, linea.id, asignacion?.lote_id, showToast]);

  const handleReasignar = async () => {
    if (!loteSeleccionado) return;
    setEnviando(true);
    try {
      await reasignarLote(pedidoId, {
        linea_venta_id: linea.id,
        lote_original_id: asignacion.lote_id,
        lote_nuevo_id: loteSeleccionado.id,
        cantidad: asignacion.cantidad,
        observaciones,
      });
      showToast("Lote reasignado correctamente", "success");
      onReasignado?.();
      onClose();
    } catch (err) {
      showToast(err?.data?.detail || "Error al reasignar lote", "error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Reasignar Lote</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {linea.product_code} · {linea.producto_nombre}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <p className="text-xs font-medium text-red-700 flex items-center gap-1.5">
            <AlertTriangle size={12} />
            Lote original no encontrado:
            <code className="font-mono bg-red-100 px-1.5 py-0.5 rounded">
              {asignacion?.lote_codigo}
            </code>
            <span className="text-red-500">({asignacion?.cantidad} unidades)</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-8">Buscando lotes disponibles...</p>
          ) : lotes.length === 0 ? (
            <div className="text-center py-8">
              <PackageX size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No hay lotes alternativos disponibles</p>
              <p className="text-xs text-slate-400 mt-1">
                Reportá el faltante para registrar la discrepancia.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Lotes disponibles (FEFO)
              </p>
              {lotes.map((lote) => (
                <button
                  key={lote.id}
                  type="button"
                  onClick={() => setLoteSeleccionado(lote)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border transition-all",
                    loteSeleccionado?.id === lote.id
                      ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Hash size={12} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{lote.lote_codigo}</span>
                    </div>
                    <Badge variant={lote.cantidad_disponible >= asignacion?.cantidad ? "success" : "warning"}>
                      {lote.cantidad_disponible} disp.
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Warehouse size={10} />{lote.deposito_nombre}
                    </span>
                    {lote.vencimiento && (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />{formatFechaCorta(lote.vencimiento)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            <label className="text-xs font-medium text-slate-500 block mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Lote no encontrado en estante B3..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            onClick={handleReasignar}
            disabled={!loteSeleccionado || enviando}
            loading={enviando}
          >
            Reasignar Lote
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Reportar Faltante ─────────────────────────────────

function ModalReportarFaltante({ pedidoId, linea, asignacion, onClose, onReportado }) {
  const { showToast } = useToast();
  const [motivo, setMotivo] = useState("");
  const [cantidadAfectada, setCantidadAfectada] = useState(asignacion?.cantidad || linea.cantidad);
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleReportar = async () => {
    if (!motivo) {
      showToast("Seleccioná un motivo", "error");
      return;
    }
    setEnviando(true);
    try {
      await reportarFaltante(pedidoId, {
        linea_venta_id: linea.id,
        motivo,
        cantidad_afectada: cantidadAfectada,
        lote_original_id: asignacion?.lote_id || null,
        observaciones,
      });
      showToast("Faltante reportado correctamente", "success");
      onReportado?.();
      onClose();
    } catch (err) {
      showToast(err?.data?.detail || "Error al reportar faltante", "error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Reportar Faltante</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {linea.product_code} · {linea.producto_nombre}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-2">Motivo</label>
            <div className="space-y-2">
              {MOTIVOS_DISCREPANCIA.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMotivo(m.value)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center gap-2.5",
                      motivo === m.value
                        ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <Icon size={14} className={motivo === m.value ? "text-amber-600" : "text-slate-400"} />
                    <span className={cn("text-sm", motivo === m.value ? "text-amber-700 font-medium" : "text-slate-600")}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Cantidad afectada</label>
            <input
              type="number"
              min={1}
              max={asignacion?.cantidad || linea.cantidad}
              value={cantidadAfectada}
              onChange={(e) => setCantidadAfectada(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Máximo: {asignacion?.cantidad || linea.cantidad} unidades
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Observaciones (opcional)</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalle adicional del problema..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button
            variant="warning"
            size="sm"
            icon={AlertTriangle}
            onClick={handleReportar}
            disabled={!motivo || enviando}
            loading={enviando}
          >
            Reportar Faltante
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Página de Detalle de Entrega ───────────────────────────────

export default function EntregaDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const scanInputRef = useRef(null);

  const { data: detalle, loading, execute: fetchDetalle } = useApi(getEntregaDetalle, {
    auto: true,
    args: [id],
    initialData: null,
  });

  const { execute: ejecutarEntrega, loading: entregando } = useApi(entregarPedido, {
    auto: false, handleError: false,
  });
  const { execute: ejecutarVerificacion, loading: verificando } = useApi(registrarVerificacion, {
    auto: false, handleError: false,
  });
  const { execute: ejecutarScanCheck } = useApi(verificarCodigo, {
    auto: false, handleError: false,
  });

  // Estado de escaneo y verificación
  const [codigoInput, setCodigoInput] = useState("");
  const [lineasChecked, setLineasChecked] = useState({});
  const [scanResult, setScanResult] = useState(null);
  const [scanTimeout, setScanTimeout] = useState(null);

  // Modales
  const [modalReasignar, setModalReasignar] = useState(null);
  const [modalFaltante, setModalFaltante] = useState(null);

  // Auto-focus en campo de escaneo al cargar
  useEffect(() => {
    if (!loading && detalle) {
      setTimeout(() => scanInputRef.current?.focus(), 100);
    }
  }, [loading, detalle]);

  // Redirigir a historial si la venta ya fue entregada
  useEffect(() => {
    if (!loading && detalle && detalle.estado === "entregado") {
      router.replace(`/inventario/entregas/historial/${id}`);
    }
  }, [loading, detalle, id, router]);

  // ─── Verificación ──────────────────────────────────────────

  const handleVerificar = async () => {
    const lineasData = Object.entries(lineasChecked).map(([lineaId, info]) => ({
      linea_venta_id: Number(lineaId),
      cantidad_verificada: info.cantidad,
      metodo: info.metodo || "manual",
      codigo_escaneado: info.codigo || "",
    }));

    try {
      await ejecutarVerificacion(id, { lineas: lineasData });
      showToast("Verificación registrada", "success");
      fetchDetalle(id);
      setLineasChecked({});
    } catch (err) {
      showToast(err?.data?.detail || "Error al verificar", "error");
    }
  };

  // ─── Escaneo ───────────────────────────────────────────────

  const handleScan = async (e) => {
    e.preventDefault();
    const codigo = codigoInput.trim();
    if (!codigo) return;

    if (scanTimeout) clearTimeout(scanTimeout);
    setScanResult(null);

    try {
      const result = await ejecutarScanCheck(id, codigo);
      if (result.match) {
        setScanResult({ success: true, ...result });
        setLineasChecked((prev) => ({
          ...prev,
          [result.linea_venta_id]: {
            cantidad: result.cantidad_esperada,
            metodo: "escaneo",
            codigo,
          },
        }));
        showToast(`✓ ${result.product_code} verificado`, "success");
        const t = setTimeout(() => setScanResult(null), 3000);
        setScanTimeout(t);
      }
    } catch (err) {
      const detail = err?.data?.detail || "Código no encontrado en este pedido";
      setScanResult({ success: false, detail });
      showToast(detail, "error");
      const t = setTimeout(() => setScanResult(null), 5000);
      setScanTimeout(t);
    }
    setCodigoInput("");
    scanInputRef.current?.focus();
  };

  // ─── Entrega ───────────────────────────────────────────────

  const handleEntrega = async () => {
    const tieneFaltantes = (detalle?.discrepancias || []).some(d => d.resolucion === "entrega_parcial");
    const mensajeConfirm = tieneFaltantes
      ? `El pedido #${id} tiene faltantes reportados. Al confirmar la entrega se generará automáticamente una nota de crédito por los productos no entregados. ¿Continuar?`
      : `¿Confirmar que el pedido #${id} fue verificado y está listo para entregar?`;

    const isConfirmed = await confirm(mensajeConfirm, "Confirmar Entrega");
    if (!isConfirmed) return;

    try {
      const result = await ejecutarEntrega(id);
      if (result?.nota_credito) {
        showToast(`Entrega confirmada. NC Legal #${result.nota_credito.numero} emitida por faltantes.`, "success");
      } else if (result?.nota_credito_interna) {
        showToast(`Entrega confirmada. NC Interna #${result.nota_credito_interna.numero} emitida por faltantes.`, "success");
      } else {
        showToast("Entrega registrada correctamente", "success");
      }
      router.push("/inventario/entregas");
    } catch (err) {
      showToast(err?.data?.detail || "Error al registrar la entrega", "error");
    }
  };

  // ─── Check manual ──────────────────────────────────────────

  const toggleLineaCheck = (lineaId, cantidad) => {
    setLineasChecked((prev) => {
      if (prev[lineaId]) {
        const next = { ...prev };
        delete next[lineaId];
        return next;
      }
      return { ...prev, [lineaId]: { cantidad, metodo: "manual", codigo: "" } };
    });
  };

  const handleMarcarTodos = () => {
    if (!detalle) return;
    const todas = {};
    for (const linea of detalle.lineas || []) {
      todas[linea.id] = { cantidad: linea.cantidad, metodo: "manual", codigo: "" };
    }
    setLineasChecked(todas);
  };

  const handleDesmarcarTodos = () => setLineasChecked({});

  // ─── Loading ───────────────────────────────────────────────

  if (loading || !detalle) {
    return <LoadingScreen message="Cargando pedido..." />;
  }

  const lineas = detalle.lineas || [];
  const verificaciones = detalle.verificaciones || [];
  const verificacionesCount = detalle.verificaciones_count || 0;
  const entregaInfo = ENTREGA_CONFIG[detalle.metodo_entrega] || ENTREGA_CONFIG.mostrador;
  const EntregaIcon = entregaInfo.icon;
  const todosChecked = lineas.length > 0 && Object.keys(lineasChecked).length === lineas.length;
  const esEntregado = detalle.estado === "entregado";

  // Para poder entregar: debe haber al menos 1 verificación registrada Y todos los ítems
  // deben estar checkeados en la sesión actual (garantiza que el bodeguero revisó todo)
  const puedeEntregar = verificacionesCount > 0 && todosChecked;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Inventario", href: "/inventario" },
          { label: "Entregas", href: "/inventario/entregas" },
          { label: `Pedido #${id}` },
        ]}
        subtitle={
          <>
            <Package size={12} />
            {esEntregado ? "Entrega completada" : "Verificación y despacho"}
          </>
        }
      >
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => router.push("/inventario/entregas")}
        >
          Volver
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-[1100px] mx-auto space-y-5">

          {/* ─── Cabecera del pedido ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 flex flex-wrap items-center gap-x-8 gap-y-3">
              {/* Cliente */}
              <div className="flex-1 min-w-[200px]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Cliente</p>
                <p className="text-lg font-bold text-slate-800">
                  {detalle.cliente_nombre || "Sin cliente"}
                </p>
              </div>

              {/* Método de entrega */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Entrega</p>
                <span className={cn("flex items-center gap-1.5 text-sm font-semibold", entregaInfo.color)}>
                  <EntregaIcon size={16} />
                  {entregaInfo.label}
                </span>
              </div>

              {/* Total */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total</p>
                <p className="text-lg font-bold text-slate-800">
                  {formatMonto(detalle.total_moneda_negociacion, detalle.moneda_negociacion)}
                </p>
              </div>

              {/* Piezas */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Piezas</p>
                <p className="text-lg font-bold text-slate-800">{detalle.total_items}</p>
              </div>

              {/* Estado */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Estado</p>
                {esEntregado ? (
                  <Badge variant="success">Entregado</Badge>
                ) : (
                  <Badge variant="info">Pendiente</Badge>
                )}
              </div>
            </div>

            {/* Dirección / observaciones */}
            {(detalle.direccion_entrega || detalle.observaciones_entrega) && (
              <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {detalle.direccion_entrega && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <MapPin size={12} />{detalle.direccion_entrega}
                  </span>
                )}
                {detalle.observaciones_entrega && (
                  <span className="italic">Obs: {detalle.observaciones_entrega}</span>
                )}
              </div>
            )}
          </div>

          {/* ─── Escáner (prominente, siempre visible para pendientes) */}
          {!esEntregado && (
            <div className={cn(
              "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all",
              scanResult?.success === true && "border-emerald-300 ring-2 ring-emerald-100",
              scanResult?.success === false && "border-red-300 ring-2 ring-red-100",
              !scanResult && "border-slate-200"
            )}>
              <div className="px-6 py-4">
                <form onSubmit={handleScan} className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50">
                    <ScanBarcode size={20} className="text-blue-600" />
                  </div>
                  <input
                    ref={scanInputRef}
                    type="text"
                    value={codigoInput}
                    onChange={(e) => setCodigoInput(e.target.value)}
                    placeholder="Escaneá o ingresá un código de producto..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:bg-white transition-all"
                    autoComplete="off"
                  />
                  <Button type="submit" variant="primary" size="md" disabled={!codigoInput.trim()}>
                    Verificar
                  </Button>
                </form>
                {scanResult && !scanResult.success && (
                  <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                    <AlertCircle size={14} />{scanResult.detail}
                  </p>
                )}
                {scanResult && scanResult.success && (
                  <p className="mt-3 text-sm text-emerald-600 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={14} />✓ {scanResult.product_code} encontrado y marcado
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ─── Tabla de Picking ─────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header de tabla */}
            {!esEntregado && (
              <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">
                  {Object.keys(lineasChecked).length}/{lineas.length} ítems marcados
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={todosChecked ? handleDesmarcarTodos : handleMarcarTodos}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {todosChecked ? "Desmarcar todos" : "Marcar todos"}
                  </button>
                </div>
              </div>
            )}

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-50/50">
                    {!esEntregado && <th className="py-3 px-4 w-10"></th>}
                    <th className="py-3 px-4 text-left">Código</th>
                    <th className="py-3 px-4 text-left">Producto</th>
                    <th className="py-3 px-4 text-center">Cant.</th>
                    <th className="py-3 px-4 text-left">Lote</th>
                    <th className="py-3 px-4 text-left">Depósito</th>
                    <th className="py-3 px-4 text-left">Vencimiento</th>
                    {!esEntregado && <th className="py-3 px-4 w-16"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineas.map((linea) => {
                    const asignaciones = linea.asignaciones || [];
                    const isChecked = !!lineasChecked[linea.id];

                    if (asignaciones.length === 0) {
                      return (
                        <tr
                          key={linea.id}
                          className={cn(
                            "transition-colors",
                            isChecked ? "bg-emerald-50/60" : "hover:bg-slate-50/50"
                          )}
                        >
                          {!esEntregado && (
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleLineaCheck(linea.id, linea.cantidad)}
                                  className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                {isChecked && lineasChecked[linea.id]?.metodo === "escaneo" && (
                                  <ScanBarcode size={12} className="text-blue-500" title="Verificado por escaneo" />
                                )}
                              </div>
                            </td>
                          )}
                          <td className="py-3.5 px-4">
                            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 font-semibold">
                              {linea.product_code}
                            </code>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            {linea.producto_nombre}
                            {linea.variante_nombre && linea.variante_nombre !== linea.producto_nombre && (
                              <span className="text-slate-400 ml-1 text-xs">· {linea.variante_nombre}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-bold text-slate-800">
                              {linea.cantidad}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">—</td>
                          <td className="py-3.5 px-4 text-slate-400">—</td>
                          <td className="py-3.5 px-4 text-slate-400">—</td>
                          {!esEntregado && (
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setModalFaltante({ linea, asignacion: null })}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                                title="Reportar problema"
                              >
                                <AlertTriangle size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    }

                    return asignaciones.map((asig, idx) => (
                      <tr
                        key={`${linea.id}-${idx}`}
                        className={cn(
                          "transition-colors",
                          isChecked ? "bg-emerald-50/60" : "hover:bg-slate-50/50"
                        )}
                      >
                        {idx === 0 && !esEntregado && (
                          <td className="py-3.5 px-4" rowSpan={asignaciones.length}>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleLineaCheck(linea.id, linea.cantidad)}
                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              {isChecked && lineasChecked[linea.id]?.metodo === "escaneo" && (
                                <ScanBarcode size={12} className="text-blue-500" title="Verificado por escaneo" />
                              )}
                            </div>
                          </td>
                        )}
                        {idx === 0 && (
                          <>
                            <td className="py-3.5 px-4" rowSpan={asignaciones.length}>
                              <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 font-semibold">
                                {linea.product_code}
                              </code>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium" rowSpan={asignaciones.length}>
                              {linea.producto_nombre}
                              {linea.variante_nombre && linea.variante_nombre !== linea.producto_nombre && (
                                <span className="text-slate-400 ml-1 text-xs">· {linea.variante_nombre}</span>
                              )}
                            </td>
                          </>
                        )}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-bold text-slate-800">
                            {asig.cantidad}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="flex items-center gap-1.5 text-slate-700">
                            <Hash size={11} className="text-slate-400" />{asig.lote_codigo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="flex items-center gap-1.5 text-slate-700">
                            <Warehouse size={11} className="text-slate-400" />{asig.deposito_nombre}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {asig.vencimiento ? (
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <Calendar size={11} className="text-slate-400" />{formatFechaCorta(asig.vencimiento)}
                            </span>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        {!esEntregado && (
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                type="button"
                                onClick={() => setModalReasignar({ linea, asignacion: { ...asig, lote_id: asig.lote_id } })}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Cambiar lote"
                              >
                                <RefreshCw size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setModalFaltante({ linea, asignacion: { ...asig, lote_id: asig.lote_id } })}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                                title="Reportar faltante"
                              >
                                <AlertTriangle size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Verificaciones registradas ────────────────────────── */}
          {verificaciones.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Verificaciones registradas
              </p>
              <div className="flex flex-wrap gap-2">
                {verificaciones.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700"
                  >
                    <ShieldCheck size={13} />
                    {v.verificador_nombre}
                    <span className="text-emerald-400 text-[10px]">
                      {new Date(v.verificado_at).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ─── Discrepancias ─────────────────────────────────────── */}
          {(detalle.discrepancias || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-3">
                Discrepancias reportadas
              </p>
              <div className="space-y-2">
                {detalle.discrepancias.map((d) => (
                  <div
                    key={d.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs",
                      d.resolucion === "reasignado"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    )}
                  >
                    {d.resolucion === "reasignado" ? (
                      <RefreshCw size={13} className="shrink-0" />
                    ) : (
                      <AlertTriangle size={13} className="shrink-0" />
                    )}
                    <span className="font-medium">{d.motivo_display}</span>
                    <span className="text-[10px] opacity-70">{d.cantidad_afectada} ud.</span>
                    {d.lote_original_codigo && (
                      <span className="text-[10px] opacity-70">
                        Lote: {d.lote_original_codigo}
                        {d.lote_reasignado_codigo && ` → ${d.lote_reasignado_codigo}`}
                      </span>
                    )}
                    <Badge
                      variant={d.resolucion === "reasignado" ? "info" : "warning"}
                      className="ml-auto text-[9px]"
                    >
                      {d.resolucion_display}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Acciones (sticky bottom) ──────────────────────────── */}
          {!esEntregado && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg px-6 py-5 sticky bottom-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  icon={UserCheck}
                  onClick={handleVerificar}
                  disabled={verificando || Object.keys(lineasChecked).length === 0}
                  loading={verificando}
                  className="rounded-xl"
                >
                  Registrar Verificación ({Object.keys(lineasChecked).length})
                </Button>

                <div className="flex items-center gap-4">
                  {!puedeEntregar && (
                    <span className="text-xs text-amber-600 flex items-center gap-1.5 hidden sm:flex">
                      <AlertCircle size={13} />
                      {verificacionesCount === 0
                        ? "Requiere al menos 1 verificación registrada"
                        : "Marcá todos los ítems para confirmar"}
                    </span>
                  )}
                  <Button
                    variant="success"
                    size="lg"
                    icon={CheckCircle2}
                    onClick={handleEntrega}
                    disabled={!puedeEntregar || entregando}
                    loading={entregando}
                    className="rounded-xl font-bold shadow-lg shadow-emerald-200 w-full sm:w-auto"
                  >
                    Confirmar Entrega
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modales */}
      {modalReasignar && (
        <ModalReasignarLote
          pedidoId={id}
          linea={modalReasignar.linea}
          asignacion={modalReasignar.asignacion}
          onClose={() => setModalReasignar(null)}
          onReasignado={() => fetchDetalle(id)}
        />
      )}
      {modalFaltante && (
        <ModalReportarFaltante
          pedidoId={id}
          linea={modalFaltante.linea}
          asignacion={modalFaltante.asignacion}
          onClose={() => setModalFaltante(null)}
          onReportado={() => fetchDetalle(id)}
        />
      )}
    </div>
  );
}
