"use client";
import { useState, useMemo, useEffect } from "react";
import { Modal, Button, Badge } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { cobrarPedido } from "@/services/apis/caja";
import { getTipoCambioVigente } from "@/services/apis/ventas";
import { cn } from "@/lib/utils";
import {
  Plus, Trash2, CreditCard, CheckCircle, Receipt,
  AlertCircle, Zap, Package, Truck, Store, Building2, MapPin, FileText,
} from "lucide-react";

// ─── Constantes ─────────────────────────────────────────────────

const METODO_PAGO_OPTIONS = [
  { value: "efectivo_pyg", label: "Efectivo PYG", moneda: "PYG" },
  { value: "efectivo_usd", label: "Efectivo USD", moneda: "USD" },
  { value: "efectivo_brl", label: "Efectivo BRL", moneda: "BRL" },
  { value: "cheque_pyg", label: "Cheque PYG", moneda: "PYG" },
  { value: "cheque_usd", label: "Cheque USD", moneda: "USD" },
  { value: "transferencia_pyg", label: "Transferencia PYG", moneda: "PYG" },
  { value: "tarjeta_credito", label: "Tarjeta Crédito", moneda: null },
  { value: "tarjeta_debito", label: "Tarjeta Débito", moneda: null },
  { value: "pix", label: "PIX", moneda: "BRL" },
  { value: "cuotas", label: "Pago a Cuotas", moneda: null },
];

const MAX_PAGOS = 10;

const ENTREGA_CONFIG = {
  mostrador: { icon: Store, label: "Mostrador", color: "text-slate-600 bg-slate-100" },
  delivery: { icon: Truck, label: "Delivery", color: "text-blue-600 bg-blue-50" },
  retiro_sucursal: { icon: Building2, label: "Retiro sucursal", color: "text-purple-600 bg-purple-50" },
};

// ─── Helpers ────────────────────────────────────────────────────

function getMonedaForMetodo(metodo) {
  const option = METODO_PAGO_OPTIONS.find((o) => o.value === metodo);
  return option?.moneda || null;
}

function formatMonto(monto, moneda = "PYG") {
  if (monto == null || isNaN(monto)) return "0";
  const num = Number(monto);
  if (moneda === "PYG") {
    return num.toLocaleString("es-PY", { maximumFractionDigits: 0 });
  }
  return num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getMonedaSymbol(moneda) {
  if (moneda === "PYG") return "₲";
  if (moneda === "USD") return "$";
  if (moneda === "BRL") return "R$";
  return moneda;
}

/**
 * Convierte un monto de una moneda a otra usando tasas de cambio.
 * Las tasas están expresadas como USD/X (cuántas X por 1 USD).
 * 
 * @param {number} monto - Monto en monedaOrigen
 * @param {string} monedaOrigen - Moneda del monto
 * @param {string} monedaDestino - Moneda a la que convertir
 * @param {object} tasas - { "USD/PYG": 7500, "USD/BRL": 5.2 }
 * @returns {number} Monto convertido
 */
function convertir(monto, monedaOrigen, monedaDestino, tasas) {
  if (!monto || monedaOrigen === monedaDestino) return monto;

  // Convertir origen → USD → destino
  let montoUsd = monto;
  if (monedaOrigen !== "USD") {
    const tasaOrigen = tasas[`USD/${monedaOrigen}`];
    if (!tasaOrigen) return null; // Sin tasa disponible
    montoUsd = monto / tasaOrigen;
  }

  if (monedaDestino === "USD") return montoUsd;

  const tasaDestino = tasas[`USD/${monedaDestino}`];
  if (!tasaDestino) return null;
  return montoUsd * tasaDestino;
}

// ─── Componente Principal ───────────────────────────────────────

export default function CobrarPedidoModal({ pedido, onClose, onSuccess }) {
  const { showToast } = useToast();
  const { execute: ejecutarCobro, loading: cobrando } = useApi(cobrarPedido, {
    handleError: false,
  });

  // Tasas de cambio vigentes
  const [tasas, setTasas] = useState({});
  const [cargandoTasas, setCargandoTasas] = useState(true);

  // Cargar tasas al montar
  useEffect(() => {
    async function cargarTasas() {
      const pares = ["USD/PYG", "USD/BRL"];
      const resultado = {};
      for (const par of pares) {
        try {
          const tc = await getTipoCambioVigente(par);
          if (tc?.valor) resultado[par] = parseFloat(tc.valor);
        } catch { /* sin tasa disponible para este par */ }
      }
      setTasas(resultado);
      setCargandoTasas(false);
    }
    cargarTasas();
  }, []);

  // Estado de pagos
  const [pagos, setPagos] = useState(() => {
    if (pedido?.pagos?.length > 0) {
      return pedido.pagos.map((p) => ({
        metodo: p.metodo || "efectivo_pyg",
        monto: p.monto?.toString() || "",
        moneda: p.moneda || pedido.moneda_negociacion || "PYG",
        referencia: p.referencia || "",
      }));
    }
    // Default: un pago en la moneda del pedido
    const monedaPedido = pedido?.moneda_negociacion || "PYG";
    const metodoDefault = monedaPedido === "USD" ? "efectivo_usd" : monedaPedido === "BRL" ? "efectivo_brl" : "efectivo_pyg";
    return [{ metodo: metodoDefault, monto: "", moneda: monedaPedido, referencia: "" }];
  });

  const [resultado, setResultado] = useState(null);

  // Opción de factura: por defecto usa lo que trae el pedido
  const [emitirFactura, setEmitirFactura] = useState(
    pedido?.requiere_factura_legal ?? false
  );

  const totalPedido = Number(pedido?.total_moneda_negociacion) || 0;
  const moneda = pedido?.moneda_negociacion || "PYG";
  const totalUsd = Number(pedido?.total_usd) || 0;
  const lineas = pedido?.lineas || [];
  const entrega = ENTREGA_CONFIG[pedido?.metodo_entrega] || ENTREGA_CONFIG.mostrador;
  const EntregaIcon = entrega.icon;

  // Cálculos con conversión multi-moneda
  const { totalPagadoEnMoneda, vuelto, faltante, pagosCompletos, pagosDetalle } = useMemo(() => {
    let totalEnMonedaPedido = 0;
    const detalle = pagos.map((p) => {
      const montoNum = Number(p.monto) || 0;
      if (montoNum <= 0) return { ...p, montoConvertido: 0, sinTasa: false };

      if (p.moneda === moneda) {
        totalEnMonedaPedido += montoNum;
        return { ...p, montoConvertido: montoNum, sinTasa: false };
      }

      // Convertir a la moneda del pedido
      const convertido = convertir(montoNum, p.moneda, moneda, tasas);
      if (convertido === null) {
        return { ...p, montoConvertido: 0, sinTasa: true };
      }
      totalEnMonedaPedido += convertido;
      return { ...p, montoConvertido: convertido, sinTasa: false };
    });

    const diferencia = totalEnMonedaPedido - totalPedido;
    return {
      totalPagadoEnMoneda: totalEnMonedaPedido,
      vuelto: diferencia > 0 ? diferencia : 0,
      faltante: diferencia < 0 ? Math.abs(diferencia) : 0,
      pagosCompletos: totalEnMonedaPedido >= totalPedido && totalPedido > 0,
      pagosDetalle: detalle,
    };
  }, [pagos, totalPedido, moneda, tasas]);

  // ─── Handlers de pagos ──────────────────────────────────────

  const handleAddPago = () => {
    if (pagos.length >= MAX_PAGOS) return;
    const metodoDefault = moneda === "USD" ? "efectivo_usd" : moneda === "BRL" ? "efectivo_brl" : "efectivo_pyg";
    setPagos([...pagos, { metodo: metodoDefault, monto: "", moneda: moneda, referencia: "" }]);
  };

  const handleRemovePago = (index) => {
    setPagos(pagos.filter((_, i) => i !== index));
  };

  const handleMetodoChange = (index, metodo) => {
    const nuevosPagos = [...pagos];
    const monedaAutoDetectada = getMonedaForMetodo(metodo);
    nuevosPagos[index] = {
      ...nuevosPagos[index],
      metodo,
      moneda: monedaAutoDetectada || moneda,
    };
    setPagos(nuevosPagos);
  };

  const handleMontoChange = (index, monto) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index] = { ...nuevosPagos[index], monto };
    setPagos(nuevosPagos);
  };

  const handleReferenciaChange = (index, referencia) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index] = { ...nuevosPagos[index], referencia };
    setPagos(nuevosPagos);
  };

  // Auto-completar: calcula el faltante EN la moneda del pago
  const handleAutoCompletar = (index) => {
    if (faltante <= 0) return;
    const monedaPago = pagos[index].moneda;
    let montoEnMonedaPago = faltante; // faltante está en moneda del pedido

    if (monedaPago !== moneda) {
      const convertido = convertir(faltante, moneda, monedaPago, tasas);
      if (convertido === null) {
        showToast(`No hay tipo de cambio para ${moneda}→${monedaPago}`, "error");
        return;
      }
      // Redondear: PYG sin decimales, otros con 2
      montoEnMonedaPago = monedaPago === "PYG"
        ? Math.ceil(convertido)
        : Math.ceil(convertido * 100) / 100;
    }

    const nuevosPagos = [...pagos];
    const montoActual = Number(nuevosPagos[index].monto) || 0;
    nuevosPagos[index] = {
      ...nuevosPagos[index],
      monto: String(montoActual + montoEnMonedaPago),
    };
    setPagos(nuevosPagos);
  };

  // ─── Confirmar cobro ────────────────────────────────────────

  const handleConfirmarCobro = async () => {
    if (!pagosCompletos) return;

    const pagosData = pagos
      .filter((p) => Number(p.monto) > 0)
      .map((p) => ({
        metodo: p.metodo,
        monto: Number(p.monto),
        moneda: p.moneda,
        referencia: p.referencia || "",
      }));

    try {
      const result = await ejecutarCobro(pedido.id, {
        pagos: pagosData,
        emitir_factura: emitirFactura,
      });
      setResultado(result);
    } catch (err) {
      const mensaje =
        err?.data?.detail ||
        err?.data?.non_field_errors?.[0] ||
        err?.message ||
        "Error al procesar el cobro";
      showToast(mensaje, "error");
    }
  };

  // ─── Vista de resultado exitoso ─────────────────────────────

  if (resultado) {
    return (
      <Modal open onClose={() => { onSuccess?.(resultado); onClose(); }} title="Cobro Exitoso" size="sm">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <CheckCircle size={24} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Cobro registrado correctamente</p>
              <p className="text-xs text-emerald-600">
                Comprobante Nº {resultado.comprobante?.numero_completo || resultado.comprobante?.numero || "—"}
              </p>
            </div>
          </div>

          {resultado.factura && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <Receipt size={20} className="text-blue-700 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  Factura Nº {resultado.factura.numero_completo || "—"}
                </p>
                <p className="text-xs text-blue-600">Factura legal emitida</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Total cobrado</p>
              <p className="text-sm font-bold text-slate-800">
                {getMonedaSymbol(moneda)} {formatMonto(totalPedido, moneda)}
              </p>
            </div>
            {(Number(resultado.vuelto) > 0 || vuelto > 0) && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">Vuelto</p>
                <p className="text-sm font-bold text-blue-800">
                  {getMonedaSymbol(moneda)} {formatMonto(resultado.vuelto || vuelto, moneda)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <Button variant="primary" onClick={() => { onSuccess?.(resultado); onClose(); }}>
            Cerrar
          </Button>
        </div>
      </Modal>
    );
  }

  // ─── Vista principal de cobro ───────────────────────────────

  return (
    <Modal open onClose={onClose} title="Cobrar Pedido" size="lg">
      <div className="max-h-[75vh] overflow-y-auto">
        {/* Info del pedido */}
        <div className="px-6 pt-5 pb-4 space-y-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-800">
                {pedido?.cliente_nombre || "Sin cliente"}
              </p>
              <p className="text-xs text-slate-400">
                Vendedor: {pedido?.vendedor_nombre || pedido?.vendedor_username || "—"} · Pedido #{pedido?.id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-slate-800">
                {getMonedaSymbol(moneda)} {formatMonto(totalPedido, moneda)}
              </p>
              {moneda !== "USD" && totalUsd > 0 && (
                <p className="text-[10px] text-slate-400">≈ $ {formatMonto(totalUsd, "USD")} USD</p>
              )}
            </div>
          </div>

          {/* Método de entrega */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg", entrega.color)}>
              <EntregaIcon size={12} />
              {entrega.label}
            </span>
            {pedido?.metodo_entrega === "delivery" && pedido?.direccion_entrega && (
              <span className="inline-flex items-center gap-1 text-[11px] text-blue-500">
                <MapPin size={10} />
                {pedido.direccion_entrega}
              </span>
            )}
          </div>

          {/* Líneas del pedido */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Package size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Productos ({lineas.length})
              </span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {lineas.map((linea, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-slate-400 font-mono text-[10px] shrink-0">
                      {linea.variante_code}
                    </span>
                    <span className="text-slate-700 font-medium truncate">
                      {linea.producto_nombre || linea.variante_nombre || `Variante ${linea.variante_code}`}
                    </span>
                    {linea.variante_nombre && linea.producto_nombre && linea.variante_nombre !== linea.producto_nombre && (
                      <span className="text-slate-400 text-[10px] truncate shrink-0">
                        · {linea.variante_nombre}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-slate-500">×{linea.cantidad}</span>
                    <span className="font-semibold text-slate-700 w-24 text-right">
                      {getMonedaSymbol(moneda)} {formatMonto(linea.precio_unitario_moneda, moneda)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Métodos de pago */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Pagos
            </h4>
            {/* Tasas vigentes */}
            {Object.keys(tasas).length > 0 && (
              <div className="flex items-center gap-2">
                {Object.entries(tasas).map(([par, valor]) => (
                  <span key={par} className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {par}: {formatMonto(valor, par.split("/")[1])}
                  </span>
                ))}
              </div>
            )}
          </div>

          {cargandoTasas && (
            <p className="text-xs text-slate-400 text-center py-2">Cargando tipos de cambio...</p>
          )}

          {pagos.length === 0 && !cargandoTasas && (
            <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
              <CreditCard size={28} strokeWidth={1.5} />
              <p className="text-xs text-center">Agregá al menos un pago para confirmar el cobro.</p>
            </div>
          )}

          <div className="space-y-3">
            {pagos.map((pago, index) => {
              const montoNum = Number(pago.monto) || 0;
              const montoInvalido = pago.monto !== "" && (montoNum <= 0 || isNaN(montoNum));
              const detalle = pagosDetalle[index];
              const esDiferenteMoneda = pago.moneda !== moneda;
              const sinTasa = detalle?.sinTasa;

              return (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    sinTasa ? "bg-amber-50/50 border-amber-200" :
                    montoInvalido ? "bg-red-50/50 border-red-200" :
                    "bg-slate-50 border-slate-100"
                  )}
                >
                  <div className="flex items-end gap-3">
                    {/* Método */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Método
                      </label>
                      <select
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700"
                        value={pago.metodo}
                        onChange={(e) => handleMetodoChange(index, e.target.value)}
                      >
                        {METODO_PAGO_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Monto */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Monto ({getMonedaSymbol(pago.moneda)})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step={pago.moneda === "PYG" ? "1000" : "0.01"}
                          value={pago.monto}
                          onChange={(e) => handleMontoChange(index, e.target.value)}
                          placeholder="0"
                          className={cn(
                            "w-full px-3 py-2.5 rounded-xl border bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-700",
                            faltante > 0 ? "pr-24" : "",
                            montoInvalido ? "border-red-300" : "border-slate-200"
                          )}
                        />
                        {faltante > 0 && (
                          <button
                            type="button"
                            onClick={() => handleAutoCompletar(index)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors text-[9px] font-bold"
                            title={`Completar faltante en ${pago.moneda}`}
                          >
                            <Zap size={9} />
                            Completar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Eliminar */}
                    <div className="pb-0.5">
                      <button
                        type="button"
                        onClick={() => handleRemovePago(index)}
                        className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Equivalencia en moneda del pedido */}
                  {esDiferenteMoneda && montoNum > 0 && !sinTasa && (
                    <p className="mt-2 text-[10px] text-slate-400">
                      ≈ {getMonedaSymbol(moneda)} {formatMonto(detalle?.montoConvertido, moneda)} en {moneda}
                    </p>
                  )}
                  {sinTasa && (
                    <p className="mt-2 text-[10px] text-amber-600 font-medium">
                      ⚠ Sin tipo de cambio {pago.moneda}→{moneda}. No se puede calcular equivalencia.
                    </p>
                  )}

                  {/* Referencia */}
                  <div className="mt-3">
                    <input
                      type="text"
                      value={pago.referencia}
                      onChange={(e) => handleReferenciaChange(index, e.target.value)}
                      placeholder="Referencia (nro. cheque, comprobante, etc.)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-xs text-slate-600"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Agregar pago */}
          {pagos.length < MAX_PAGOS && (
            <Button variant="outline" size="sm" onClick={handleAddPago} icon={Plus}>
              Agregar Pago
            </Button>
          )}

          {/* Tipo de comprobante */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Documento a emitir
            </h4>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEmitirFactura(false)}
                className={cn(
                  "flex-1 p-3 rounded-xl border-2 text-left transition-all",
                  !emitirFactura
                    ? "border-purple-400 bg-purple-50"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Receipt size={14} className={!emitirFactura ? "text-purple-600" : "text-slate-400"} />
                  <span className={cn("text-sm font-bold", !emitirFactura ? "text-purple-700" : "text-slate-600")}>
                    Solo Comprobante
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Comprobante interno sin validez fiscal
                </p>
              </button>
              <button
                type="button"
                onClick={() => setEmitirFactura(true)}
                className={cn(
                  "flex-1 p-3 rounded-xl border-2 text-left transition-all",
                  emitirFactura
                    ? "border-purple-400 bg-purple-50"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={14} className={emitirFactura ? "text-purple-600" : "text-slate-400"} />
                  <span className={cn("text-sm font-bold", emitirFactura ? "text-purple-700" : "text-slate-600")}>
                    Comprobante + Factura
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Emite factura legal con timbrado de la SET
                </p>
              </button>
            </div>
          </div>

          {/* Resumen de pagos */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Total del pedido:</span>
              <span className="font-bold text-slate-800">
                {getMonedaSymbol(moneda)} {formatMonto(totalPedido, moneda)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Total pagado (en {moneda}):</span>
              <span className={cn("font-bold", pagosCompletos ? "text-emerald-600" : "text-amber-600")}>
                {getMonedaSymbol(moneda)} {formatMonto(totalPagadoEnMoneda, moneda)}
              </span>
            </div>

            {faltante > 0 && (
              <div className="flex justify-between items-center text-sm bg-red-50 rounded-lg px-3 py-2">
                <span className="text-red-500 font-medium flex items-center gap-1.5">
                  <AlertCircle size={13} />
                  Faltante:
                </span>
                <span className="font-bold text-red-600">
                  {getMonedaSymbol(moneda)} {formatMonto(faltante, moneda)}
                </span>
              </div>
            )}

            {vuelto > 0 && (
              <div className="flex justify-between items-center text-sm bg-blue-50 rounded-lg px-3 py-2">
                <span className="text-blue-500 font-medium">Vuelto a entregar:</span>
                <span className="font-bold text-blue-600">
                  {getMonedaSymbol(moneda)} {formatMonto(vuelto, moneda)}
                </span>
              </div>
            )}

            {pagosCompletos && (
              <p className="text-xs text-emerald-600 font-bold text-center pt-1">✓ Pagos completos</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
        <Button variant="ghost" onClick={onClose} disabled={cobrando}>
          Cancelar
        </Button>
        <Button
          variant="success"
          onClick={handleConfirmarCobro}
          disabled={!pagosCompletos || cobrando}
          icon={CheckCircle}
        >
          {cobrando ? "Procesando..." : "Confirmar Cobro"}
        </Button>
      </div>
    </Modal>
  );
}
