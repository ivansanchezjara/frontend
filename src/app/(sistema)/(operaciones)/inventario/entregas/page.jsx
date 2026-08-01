"use client";
import { useState, useEffect, useRef } from "react";
import {
  PageHeader,
  Pagination,
  Badge,
  LoadingScreen,
  EmptyState,
  Input,
  Button,
  useToast,
  useConfirm,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getColaEntrega,
  getEntregaDetalle,
  entregarPedido,
  registrarVerificacion,
  verificarCodigo,
} from "@/services/apis/caja";
import {
  Package, PackageCheck, Search, X, Clock, ChevronDown, ChevronUp,
  MapPin, Warehouse, Calendar, Hash, Truck, Store, CheckCircle2,
  ScanBarcode, UserCheck, ShieldCheck, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

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

function diasDesde(fecha) {
  if (!fecha) return 0;
  return Math.floor((new Date() - new Date(fecha)) / (1000 * 60 * 60 * 24));
}

function getUrgenciaBadge(dias) {
  if (dias >= 3) return <Badge variant="danger" className="flex items-center gap-1"><Clock size={10} />{dias}d</Badge>;
  if (dias >= 1) return <Badge variant="warning" className="flex items-center gap-1"><Clock size={10} />{dias}d</Badge>;
  return null;
}

const ENTREGA_CONFIG = {
  mostrador: { icon: Store, label: "Retira en mostrador" },
  delivery: { icon: Truck, label: "Delivery" },
  retiro_sucursal: { icon: Store, label: "Retiro sucursal" },
};

// ─── Componente de Detalle con Verificación ─────────────────────

function PedidoDetalle({ pedidoId, onEntregado }) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const scanInputRef = useRef(null);

  const { data: detalle, loading, execute: fetchDetalle } = useApi(getEntregaDetalle, {
    auto: false, initialData: null,
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

  // Estado local de escaneo
  const [codigoInput, setCodigoInput] = useState("");
  const [lineasChecked, setLineasChecked] = useState({});
  const [scanResult, setScanResult] = useState(null);
  const [scanTimeout, setScanTimeout] = useState(null);

  useEffect(() => {
    fetchDetalle(pedidoId);
  }, [pedidoId, fetchDetalle]);

  // ─── Verificación ──────────────────────────────────────────

  const handleVerificar = async () => {
    const lineasData = Object.entries(lineasChecked).map(([lineaId, info]) => ({
      linea_venta_id: Number(lineaId),
      cantidad_verificada: info.cantidad,
      metodo: info.metodo || "manual",
      codigo_escaneado: info.codigo || "",
    }));

    try {
      await ejecutarVerificacion(pedidoId, { lineas: lineasData });
      showToast("Verificación registrada", "success");
      fetchDetalle(pedidoId);
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

    // Limpiar timeout anterior
    if (scanTimeout) clearTimeout(scanTimeout);
    setScanResult(null);

    try {
      const result = await ejecutarScanCheck(pedidoId, codigo);
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
        // Auto-clear success después de 3s
        const t = setTimeout(() => setScanResult(null), 3000);
        setScanTimeout(t);
      }
    } catch (err) {
      const detail = err?.data?.detail || "Código no encontrado";
      setScanResult({ success: false, detail });
      showToast(detail, "error");
      // Auto-clear error después de 5s
      const t = setTimeout(() => setScanResult(null), 5000);
      setScanTimeout(t);
    }
    setCodigoInput("");
    scanInputRef.current?.focus();
  };

  // ─── Entrega ───────────────────────────────────────────────

  const handleEntrega = async () => {
    const isConfirmed = await confirm(
      `¿Confirmar que el pedido #${pedidoId} fue verificado y está listo para entregar?`,
      "Confirmar Entrega",
    );
    if (!isConfirmed) return;

    try {
      await ejecutarEntrega(pedidoId);
      showToast("Entrega registrada correctamente", "success");
      onEntregado?.();
    } catch (err) {
      showToast(err?.data?.detail || "Error al registrar la entrega", "error");
    }
  };

  // ─── Check manual de línea ─────────────────────────────────

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

  const handleDesmarcarTodos = () => {
    setLineasChecked({});
  };

  // ─── Render ────────────────────────────────────────────────

  if (loading || !detalle) {
    return <div className="p-6 text-center text-sm text-slate-400">Cargando detalle...</div>;
  }

  const lineas = detalle.lineas || [];
  const verificaciones = detalle.verificaciones || [];
  const verificacionesCount = detalle.verificaciones_count || 0;
  const entregaInfo = ENTREGA_CONFIG[detalle.metodo_entrega] || ENTREGA_CONFIG.mostrador;
  const EntregaIcon = entregaInfo.icon;
  const puedeEntregar = verificacionesCount > 0;
  const todosChecked = lineas.length > 0 && Object.keys(lineasChecked).length === lineas.length;

  return (
    <div className="border-t border-slate-100 bg-slate-50/30">
      {/* Info de entrega */}
      <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-500">
          <EntregaIcon size={13} className="text-slate-400" />
          <strong>{entregaInfo.label}</strong>
        </span>
        {detalle.direccion_entrega && (
          <span className="flex items-center gap-1 text-blue-600">
            <MapPin size={11} />{detalle.direccion_entrega}
          </span>
        )}
        {detalle.observaciones_entrega && (
          <span className="text-slate-400 italic">Obs: {detalle.observaciones_entrega}</span>
        )}
        <span className="ml-auto text-slate-400">
          {detalle.total_items} pieza{detalle.total_items !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla de picking con checkboxes */}
      <div className="px-4 py-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <th className="py-2 px-2 w-8">
                <input
                  type="checkbox"
                  checked={todosChecked}
                  onChange={() => todosChecked ? handleDesmarcarTodos() : handleMarcarTodos()}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  title={todosChecked ? "Desmarcar todos" : "Marcar todos"}
                />
              </th>
              <th className="py-2 px-2 text-left">Código</th>
              <th className="py-2 px-2 text-left">Producto</th>
              <th className="py-2 px-2 text-center">Cant.</th>
              <th className="py-2 px-2 text-left">Lote</th>
              <th className="py-2 px-2 text-left">Depósito</th>
              <th className="py-2 px-2 text-left">Vencimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lineas.map((linea) => {
              const asignaciones = linea.asignaciones || [];
              const isChecked = !!lineasChecked[linea.id];

              if (asignaciones.length === 0) {
                return (
                  <tr key={linea.id} className={cn("transition-colors", isChecked ? "bg-emerald-50/50" : "hover:bg-white/60")}>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleLineaCheck(linea.id, linea.cantidad)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        {isChecked && lineasChecked[linea.id]?.metodo === "escaneo" && (
                          <ScanBarcode size={10} className="text-blue-500" title="Verificado por escaneo" />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {linea.product_code}
                      </code>
                    </td>
                    <td className="py-2.5 px-2 text-slate-700 font-medium">
                      {linea.producto_nombre}
                      {linea.variante_nombre && linea.variante_nombre !== linea.producto_nombre && (
                        <span className="text-slate-400 ml-1">· {linea.variante_nombre}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-800">{linea.cantidad}</td>
                    <td className="py-2.5 px-2 text-slate-400">—</td>
                    <td className="py-2.5 px-2 text-slate-400">—</td>
                    <td className="py-2.5 px-2 text-slate-400">—</td>
                  </tr>
                );
              }

              return asignaciones.map((asig, idx) => (
                <tr
                  key={`${linea.id}-${idx}`}
                  className={cn("transition-colors", isChecked ? "bg-emerald-50/50" : "hover:bg-white/60")}
                >
                  {idx === 0 && (
                    <>
                      <td className="py-2.5 px-2" rowSpan={asignaciones.length}>
                        <div className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleLineaCheck(linea.id, linea.cantidad)}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          {isChecked && lineasChecked[linea.id]?.metodo === "escaneo" && (
                            <ScanBarcode size={10} className="text-blue-500" title="Verificado por escaneo" />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2" rowSpan={asignaciones.length}>
                        <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {linea.product_code}
                        </code>
                      </td>
                      <td className="py-2.5 px-2 text-slate-700 font-medium" rowSpan={asignaciones.length}>
                        {linea.producto_nombre}
                        {linea.variante_nombre && linea.variante_nombre !== linea.producto_nombre && (
                          <span className="text-slate-400 ml-1">· {linea.variante_nombre}</span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="py-2.5 px-2 text-center font-bold text-slate-800">{asig.cantidad}</td>
                  <td className="py-2.5 px-2">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Hash size={10} className="text-slate-400" />{asig.lote_codigo}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Warehouse size={10} className="text-slate-400" />{asig.deposito_nombre}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    {asig.vencimiento ? (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Calendar size={10} className="text-slate-400" />{formatFechaCorta(asig.vencimiento)}
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      {/* Escaneo de código (opcional) */}
      <div className="px-6 py-3 border-t border-slate-100">
        <form onSubmit={handleScan} className="flex items-center gap-3">
          <ScanBarcode size={16} className="text-slate-400 shrink-0" />
          <input
            ref={scanInputRef}
            type="text"
            value={codigoInput}
            onChange={(e) => setCodigoInput(e.target.value)}
            placeholder="Escaneá o ingresá un código de producto..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
          />
          <Button type="submit" variant="outline" size="sm" disabled={!codigoInput.trim()}>
            Verificar
          </Button>
        </form>
        {scanResult && !scanResult.success && (
          <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle size={12} />{scanResult.detail}
          </p>
        )}
        {scanResult && scanResult.success && (
          <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={12} />✓ {scanResult.product_code} encontrado
          </p>
        )}
      </div>

      {/* Verificaciones registradas */}
      {verificaciones.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Verificaciones registradas
          </p>
          <div className="flex flex-wrap gap-2">
            {verificaciones.map((v) => (
              <span
                key={v.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700"
              >
                <ShieldCheck size={12} />
                {v.verificador_nombre}
                <span className="text-emerald-400 text-[10px]">
                  {new Date(v.verificado_at).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer: Acciones */}
      <div className="px-6 py-4 border-t border-slate-100 bg-white rounded-b-2xl space-y-3">
        {/* Progreso */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{Object.keys(lineasChecked).length}/{lineas.length} ítems checkeados</span>
          {verificacionesCount > 0 && (
            <span className="text-emerald-600 font-medium">
              {verificacionesCount} verificación{verificacionesCount > 1 ? "es" : ""} registrada{verificacionesCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Button
            variant="outline"
            size="md"
            icon={UserCheck}
            onClick={handleVerificar}
            disabled={verificando}
            loading={verificando || undefined}
            className="rounded-xl"
          >
            Verificar Pedido
          </Button>

          <div className="flex items-center gap-3">
            {!puedeEntregar && (
              <span className="text-[11px] text-amber-600 flex items-center gap-1 hidden sm:flex">
                <AlertCircle size={12} />
                Requiere verificación
              </span>
            )}
            <Button
              variant="success"
              size="md"
              icon={CheckCircle2}
              onClick={handleEntrega}
              disabled={!puedeEntregar || entregando}
              loading={entregando || undefined}
              className="rounded-xl font-bold shadow-lg shadow-emerald-100 w-full sm:w-auto"
            >
              Confirmar Entrega
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componente de Detalle Historial (solo lectura) ─────────────

function PedidoDetalleHistorial({ pedidoId }) {
  const { data: detalle, loading, execute: fetchDetalle } = useApi(getEntregaDetalle, {
    auto: false, initialData: null,
  });

  useEffect(() => {
    fetchDetalle(pedidoId);
  }, [pedidoId, fetchDetalle]);

  if (loading || !detalle) {
    return <div className="p-6 text-center text-sm text-slate-400">Cargando detalle...</div>;
  }

  const lineas = detalle.lineas || [];
  const verificaciones = detalle.verificaciones || [];
  const entregaInfo = ENTREGA_CONFIG[detalle.metodo_entrega] || ENTREGA_CONFIG.mostrador;
  const EntregaIcon = entregaInfo.icon;

  return (
    <div className="border-t border-slate-100 bg-slate-50/30">
      {/* Info de entrega */}
      <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-500">
          <EntregaIcon size={13} className="text-slate-400" />
          <strong>{entregaInfo.label}</strong>
        </span>
        {detalle.direccion_entrega && (
          <span className="flex items-center gap-1 text-blue-600">
            <MapPin size={11} />{detalle.direccion_entrega}
          </span>
        )}
        {detalle.observaciones_entrega && (
          <span className="text-slate-400 italic">Obs: {detalle.observaciones_entrega}</span>
        )}
        <span className="ml-auto text-slate-400">
          {detalle.total_items} pieza{detalle.total_items !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla de productos (solo lectura) */}
      <div className="px-4 py-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <th className="py-2 px-2 text-left">Código</th>
              <th className="py-2 px-2 text-left">Producto</th>
              <th className="py-2 px-2 text-center">Cant.</th>
              <th className="py-2 px-2 text-left">Lote</th>
              <th className="py-2 px-2 text-left">Depósito</th>
              <th className="py-2 px-2 text-left">Vencimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lineas.map((linea) => {
              const asignaciones = linea.asignaciones || [];

              if (asignaciones.length === 0) {
                return (
                  <tr key={linea.id}>
                    <td className="py-2.5 px-2">
                      <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {linea.product_code}
                      </code>
                    </td>
                    <td className="py-2.5 px-2 text-slate-700 font-medium">
                      {linea.producto_nombre}
                      {linea.variante_nombre && linea.variante_nombre !== linea.producto_nombre && (
                        <span className="text-slate-400 ml-1">· {linea.variante_nombre}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-800">{linea.cantidad}</td>
                    <td className="py-2.5 px-2 text-slate-400">—</td>
                    <td className="py-2.5 px-2 text-slate-400">—</td>
                    <td className="py-2.5 px-2 text-slate-400">—</td>
                  </tr>
                );
              }

              return asignaciones.map((asig, idx) => (
                <tr key={`${linea.id}-${idx}`}>
                  {idx === 0 && (
                    <>
                      <td className="py-2.5 px-2" rowSpan={asignaciones.length}>
                        <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {linea.product_code}
                        </code>
                      </td>
                      <td className="py-2.5 px-2 text-slate-700 font-medium" rowSpan={asignaciones.length}>
                        {linea.producto_nombre}
                        {linea.variante_nombre && linea.variante_nombre !== linea.producto_nombre && (
                          <span className="text-slate-400 ml-1">· {linea.variante_nombre}</span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="py-2.5 px-2 text-center font-bold text-slate-800">{asig.cantidad}</td>
                  <td className="py-2.5 px-2">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Hash size={10} className="text-slate-400" />{asig.lote_codigo}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Warehouse size={10} className="text-slate-400" />{asig.deposito_nombre}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    {asig.vencimiento ? (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Calendar size={10} className="text-slate-400" />{formatFechaCorta(asig.vencimiento)}
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      {/* Verificaciones */}
      {verificaciones.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Verificado por
          </p>
          <div className="flex flex-wrap gap-2">
            {verificaciones.map((v) => (
              <span
                key={v.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700"
              >
                <ShieldCheck size={12} />
                {v.verificador_nombre}
                <span className="text-emerald-400 text-[10px]">
                  {new Date(v.verificado_at).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página Principal ───────────────────────────────────────────

export default function EntregaMercaderiaPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("pendientes");
  const [clienteSearch, setClienteSearch] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const debouncedCliente = useDebounce(clienteSearch, 500);

  const { data: entregaData, loading, execute: fetchEntrega } = useApi(getColaEntrega, {
    auto: false, initialData: { results: [], count: 0 },
  });

  useEffect(() => {
    const params = { page };
    if (activeTab === "entregados") params.estado = "entregado";
    if (debouncedCliente) params.cliente = debouncedCliente;
    if (fechaFiltro) {
      if (activeTab === "pendientes") params.fecha_cobro = fechaFiltro;
      else params.fecha_entrega = fechaFiltro;
    }
    fetchEntrega(params);
  }, [page, activeTab, debouncedCliente, fechaFiltro, fetchEntrega]);

  const pedidos = entregaData?.results || [];
  const totalCount = entregaData?.count || 0;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setExpandedId(null);
  };

  const handleToggleExpand = (pedidoId) => {
    setExpandedId(expandedId === pedidoId ? null : pedidoId);
  };

  const handleEntregado = () => {
    setExpandedId(null);
    const params = { page };
    if (activeTab === "entregados") params.estado = "entregado";
    if (debouncedCliente) params.cliente = debouncedCliente;
    if (fechaFiltro) params.fecha_cobro = fechaFiltro;
    fetchEntrega(params);
  };

  const handleClearFilters = () => {
    setClienteSearch("");
    setFechaFiltro("");
    setPage(1);
  };

  const hasFilters = clienteSearch || fechaFiltro;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Inventario", href: "/inventario" },
          { label: "Entregas de Mercadería" },
        ]}
        subtitle={
          <>
            <Package size={12} />
            Preparación, verificación y despacho de pedidos
          </>
        }
      >
        {totalCount > 0 && !loading && (
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
            {totalCount} pendiente{totalCount !== 1 ? "s" : ""}
          </span>
        )}
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm">
            <button
              onClick={() => handleTabChange("pendientes")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center",
                activeTab === "pendientes"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Package size={16} />
              Pendientes
              {activeTab !== "pendientes" && totalCount > 0 && activeTab === "pendientes" && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{totalCount}</span>
              )}
            </button>
            <button
              onClick={() => handleTabChange("entregados")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center",
                activeTab === "entregados"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <PackageCheck size={16} />
              Historial
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <Input
                  label="Cliente"
                  placeholder="Buscar por cliente..."
                  value={clienteSearch}
                  onChange={(e) => { setClienteSearch(e.target.value); setPage(1); }}
                  icon={Search}
                />
              </div>
              <div className="min-w-[180px]">
                <Input
                  label={activeTab === "pendientes" ? "Fecha de cobro" : "Fecha de entrega"}
                  type="date"
                  value={fechaFiltro}
                  onChange={(e) => { setFechaFiltro(e.target.value); setPage(1); }}
                />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" icon={X} onClick={handleClearFilters}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Contenido */}
          {loading ? (
            <LoadingScreen message="Cargando pedidos pendientes..." />
          ) : pedidos.length === 0 ? (
            <EmptyState
              icon="📦"
              titulo={
                hasFilters
                  ? "Sin resultados"
                  : activeTab === "pendientes"
                    ? "No hay pedidos pendientes"
                    : "No hay entregas registradas"
              }
              descripcion={
                hasFilters
                  ? "No se encontraron pedidos con los filtros aplicados."
                  : activeTab === "pendientes"
                    ? "Todos los pedidos cobrados ya fueron entregados. ¡Al día!"
                    : "Todavía no se registraron entregas en el sistema."
              }
            />
          ) : (
            <div className="space-y-3">
              {pedidos.map((pedido) => {
                const dias = diasDesde(pedido.cobrado_at);
                const isExpanded = expandedId === pedido.id;
                const tieneVerificaciones = (pedido.verificaciones_count || 0) > 0;
                const esHistorial = activeTab === "entregados";

                return (
                  <div
                    key={pedido.id}
                    className={cn(
                      "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all",
                      !esHistorial && dias >= 3 ? "border-red-200" : "border-slate-200",
                      isExpanded && "ring-2 ring-blue-200"
                    )}
                  >
                    {/* Fila resumen */}
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(pedido.id)}
                      className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-400 shrink-0">#{pedido.id}</span>
                        <span className="text-sm font-bold text-slate-800 truncate flex-1">
                          {pedido.cliente_nombre || "Sin cliente"}
                        </span>
                        {tieneVerificaciones && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                            <ShieldCheck size={10} />
                            {pedido.verificaciones_count}
                          </span>
                        )}
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                          {esHistorial ? (
                            <>
                              <span className="text-xs text-slate-500">
                                {formatFecha(pedido.entregado_at)}
                              </span>
                              {pedido.entregado_por_username && (
                                <Badge variant="default" className="text-[10px]">
                                  {pedido.entregado_por_username}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-slate-500">{formatFecha(pedido.cobrado_at)}</span>
                              {getUrgenciaBadge(dias)}
                            </>
                          )}
                        </div>
                        <span className="text-sm font-bold text-slate-700 shrink-0">
                          {formatMonto(pedido.total_moneda_negociacion, pedido.moneda_negociacion)}
                        </span>
                        {isExpanded
                          ? <ChevronUp size={16} className="text-slate-400 shrink-0" />
                          : <ChevronDown size={16} className="text-slate-400 shrink-0" />
                        }
                      </div>
                    </button>

                    {/* Detalle expandido (solo en pendientes) */}
                    {isExpanded && !esHistorial && (
                      <PedidoDetalle pedidoId={pedido.id} onEntregado={handleEntregado} />
                    )}
                    {/* Detalle en modo lectura (historial) */}
                    {isExpanded && esHistorial && (
                      <PedidoDetalleHistorial pedidoId={pedido.id} />
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
