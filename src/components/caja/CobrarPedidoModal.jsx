"use client";
import { useState, useMemo } from "react";
import { Button, Input, Section } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { cobrarPedido } from "@/services/apis/caja";
import { cn } from "@/lib/utils";
import {
  X,
  Plus,
  Trash2,
  CreditCard,
  CheckCircle,
  Receipt,
  AlertCircle,
} from "lucide-react";

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

const selectClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700";

function getMonedaForMetodo(metodo) {
  const option = METODO_PAGO_OPTIONS.find((o) => o.value === metodo);
  return option?.moneda || null;
}

function formatMonto(monto, moneda = "PYG") {
  if (!monto || isNaN(monto)) return "0";
  if (moneda === "PYG") {
    return Number(monto).toLocaleString("es-PY", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  return Number(monto).toLocaleString("es-PY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CobrarPedidoModal({ pedido, onClose, onSuccess }) {
  const { showToast } = useToast();
  const { execute: ejecutarCobro, loading: cobrando } = useApi(cobrarPedido, {
    handleError: false,
  });

  // Estado de pagos - inicializar con pagos pre-registrados del pedido
  const [pagos, setPagos] = useState(() => {
    if (pedido?.pagos?.length > 0) {
      return pedido.pagos.map((p) => ({
        metodo: p.metodo || "efectivo_pyg",
        monto: p.monto?.toString() || "",
        moneda: p.moneda || pedido.moneda_negociacion || "PYG",
        referencia: p.referencia || "",
      }));
    }
    return [{ metodo: "efectivo_pyg", monto: "", moneda: "PYG", referencia: "" }];
  });

  // Estado de resultado tras cobro exitoso
  const [resultado, setResultado] = useState(null);

  const totalPedido = pedido?.total_moneda_negociacion || 0;
  const moneda = pedido?.moneda_negociacion || "PYG";

  // Cálculos en tiempo real
  const { totalPagado, vuelto, faltante, pagosCompletos } = useMemo(() => {
    const total = pagos.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
    const diferencia = total - totalPedido;
    return {
      totalPagado: total,
      vuelto: diferencia > 0 ? diferencia : 0,
      faltante: diferencia < 0 ? Math.abs(diferencia) : 0,
      pagosCompletos: total >= totalPedido && totalPedido > 0,
    };
  }, [pagos, totalPedido]);

  // Handlers de pagos
  const handleAddPago = () => {
    if (pagos.length >= MAX_PAGOS) return;
    setPagos([
      ...pagos,
      { metodo: "efectivo_pyg", monto: "", moneda: "PYG", referencia: "" },
    ]);
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

  // Confirmar cobro
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
      const result = await ejecutarCobro(pedido.id, { pagos: pagosData });
      setResultado(result);
      showToast("Cobro registrado exitosamente", "success");
    } catch (err) {
      const mensaje =
        err?.data?.detail ||
        err?.data?.non_field_errors?.[0] ||
        err?.message ||
        "Error al procesar el cobro";
      showToast(mensaje, "error");
    }
  };

  // Si ya se cobró exitosamente, mostrar resultado
  if (resultado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header resultado */}
          <div className="px-6 py-5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
            <CheckCircle size={24} className="text-emerald-600" />
            <h2 className="text-lg font-bold text-emerald-800">
              Cobro Exitoso
            </h2>
          </div>

          {/* Contenido resultado */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <Receipt size={20} className="text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Comprobante Nº {resultado.comprobante?.numero || resultado.comprobante_numero || "—"}
                </p>
                <p className="text-xs text-slate-500">
                  Comprobante interno generado
                </p>
              </div>
            </div>

            {resultado.factura && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <Receipt size={20} className="text-blue-700" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">
                    Factura Nº {resultado.factura.numero_completo || resultado.factura.numero || "—"}
                  </p>
                  <p className="text-xs text-blue-600">
                    Factura legal emitida
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Total cobrado</p>
                <p className="text-sm font-bold text-slate-800">
                  {formatMonto(totalPedido, moneda)} {moneda}
                </p>
              </div>
              {(resultado.vuelto > 0 || vuelto > 0) && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">Vuelto entregado</p>
                  <p className="text-sm font-bold text-blue-800">
                    {formatMonto(resultado.vuelto || vuelto, moneda)} {moneda}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer resultado */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
            <Button
              variant="primary"
              onClick={() => {
                onSuccess?.(resultado);
                onClose();
              }}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Cobrar Pedido</h2>
            <p className="text-sm text-slate-500">
              Cliente: {pedido?.cliente_nombre || "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Detalle del pedido */}
          <Section title="Detalle del Pedido" subtitle={`Pedido #${pedido?.id || "—"}`}>
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                    <th className="pb-2 font-semibold">Producto</th>
                    <th className="pb-2 font-semibold text-center">Cant.</th>
                    <th className="pb-2 font-semibold text-right">Precio</th>
                    <th className="pb-2 font-semibold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pedido?.lineas?.map((linea, idx) => (
                    <tr key={idx} className="text-slate-700">
                      <td className="py-2 pr-2">
                        <span className="font-medium">
                          {linea.variante_nombre || linea.descripcion || `Línea ${idx + 1}`}
                        </span>
                      </td>
                      <td className="py-2 text-center">{linea.cantidad}</td>
                      <td className="py-2 text-right">
                        {formatMonto(linea.precio_unitario, moneda)}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatMonto(linea.subtotal || linea.cantidad * linea.precio_unitario, moneda)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600">
                  Total del Pedido
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {formatMonto(totalPedido, moneda)} {moneda}
                </span>
              </div>
            </div>
          </Section>

          {/* Métodos de pago */}
          <Section
            title="Métodos de Pago"
            subtitle={`${pagos.length}/${MAX_PAGOS} pagos registrados`}
          >
            <div className="p-4 space-y-3">
              {pagos.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                  <CreditCard size={32} strokeWidth={1.5} />
                  <p className="text-sm text-center">
                    No se han agregado pagos. Agregue al menos un pago para
                    confirmar el cobro.
                  </p>
                </div>
              )}

              {pagos.map((pago, index) => {
                const montoInvalido =
                  pago.monto !== "" &&
                  (Number(pago.monto) <= 0 || isNaN(Number(pago.monto)));
                return (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-xl border transition-all",
                      montoInvalido
                        ? "bg-red-50/50 border-red-200"
                        : "bg-slate-50 border-slate-100"
                    )}
                  >
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Método de pago
                        </label>
                        <select
                          className={selectClass}
                          value={pago.metodo}
                          onChange={(e) =>
                            handleMetodoChange(index, e.target.value)
                          }
                        >
                          {METODO_PAGO_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1">
                        <Input
                          label="Monto"
                          type="number"
                          min="0"
                          step="any"
                          value={pago.monto}
                          onChange={(e) =>
                            handleMontoChange(index, e.target.value)
                          }
                          placeholder="0"
                          error={
                            montoInvalido
                              ? "El monto debe ser mayor a cero"
                              : undefined
                          }
                        />
                      </div>

                      <div className="flex items-center gap-2 pb-0.5">
                        <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-1 rounded-lg">
                          {pago.moneda || moneda}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePago(index)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Referencia */}
                    <div className="mt-3">
                      <Input
                        label="Referencia (opcional)"
                        value={pago.referencia}
                        onChange={(e) =>
                          handleReferenciaChange(index, e.target.value)
                        }
                        placeholder="Nro. cheque, comprobante, etc."
                      />
                    </div>
                  </div>
                );
              })}

              {/* Botón agregar pago */}
              {pagos.length < MAX_PAGOS && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddPago}
                  icon={Plus}
                >
                  Agregar Pago
                </Button>
              )}
            </div>
          </Section>

          {/* Resumen de pagos y vuelto */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Total del pedido:</span>
              <span className="font-semibold text-slate-800">
                {formatMonto(totalPedido, moneda)} {moneda}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Total pagado:</span>
              <span
                className={cn(
                  "font-semibold",
                  pagosCompletos ? "text-emerald-600" : "text-amber-600"
                )}
              >
                {formatMonto(totalPagado, moneda)} {moneda}
              </span>
            </div>

            {faltante > 0 && (
              <div className="flex justify-between items-center text-sm bg-red-50 rounded-lg px-3 py-2">
                <span className="text-red-500 font-medium flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  Faltante:
                </span>
                <span className="font-semibold text-red-600">
                  {formatMonto(faltante, moneda)} {moneda}
                </span>
              </div>
            )}

            {vuelto > 0 && (
              <div className="flex justify-between items-center text-sm bg-blue-50 rounded-lg px-3 py-2">
                <span className="text-blue-500 font-medium">Vuelto:</span>
                <span className="font-semibold text-blue-600">
                  {formatMonto(vuelto, moneda)} {moneda}
                </span>
              </div>
            )}

            {pagosCompletos && (
              <p className="text-xs text-emerald-600 font-medium text-center pt-1">
                ✓ Pagos completos
              </p>
            )}
          </div>
        </div>

        {/* Footer con acciones */}
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
      </div>
    </div>
  );
}
