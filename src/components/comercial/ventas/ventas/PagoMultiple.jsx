"use client";
import { Button, Input, Field, Section } from "@/components/ui";
import { Plus, Trash2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const METODO_PAGO_OPTIONS = [
  { value: "cheque_usd", label: "Cheque USD", moneda: "USD" },
  { value: "cheque_pyg", label: "Cheque PYG", moneda: "PYG" },
  { value: "efectivo_usd", label: "Efectivo USD", moneda: "USD" },
  { value: "efectivo_brl", label: "Efectivo BRL", moneda: "BRL" },
  { value: "efectivo_pyg", label: "Efectivo PYG", moneda: "PYG" },
  { value: "transferencia_pyg", label: "Transferencia PYG", moneda: "PYG" },
  { value: "cuotas", label: "Pago a Cuotas", moneda: null },
  { value: "tarjeta_credito", label: "Tarjeta Crédito", moneda: null },
  { value: "tarjeta_debito", label: "Tarjeta Débito", moneda: null },
  { value: "pix", label: "PIX", moneda: "BRL" },
];

const MAX_PAGOS = 10;

const selectClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700";

function getMonedaForMetodo(metodo) {
  const option = METODO_PAGO_OPTIONS.find((o) => o.value === metodo);
  return option?.moneda || null;
}

function formatMonto(monto) {
  if (!monto || isNaN(monto)) return "0";
  return Number(monto).toLocaleString("es-PY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function PagoMultiple({
  pagos = [],
  onChange,
  totalVenta = 0,
  monedaNegociacion = "USD",
}) {
  const totalPagado = pagos.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
  const diferencia = totalPagado - totalVenta;
  const vuelto = diferencia > 0 ? diferencia : 0;
  const faltante = diferencia < 0 ? Math.abs(diferencia) : 0;
  const pagosCompletos = totalPagado >= totalVenta && totalVenta > 0;

  const handleAddPago = () => {
    if (pagos.length >= MAX_PAGOS) return;
    const nuevoPago = { metodo: "efectivo_pyg", monto: "", moneda: "PYG", referencia: "" };
    onChange([...pagos, nuevoPago]);
  };

  const handleRemovePago = (index) => {
    const nuevosPagos = pagos.filter((_, i) => i !== index);
    onChange(nuevosPagos);
  };

  const handleMetodoChange = (index, metodo) => {
    const nuevosPagos = [...pagos];
    const monedaAutoDetectada = getMonedaForMetodo(metodo);
    nuevosPagos[index] = {
      ...nuevosPagos[index],
      metodo,
      moneda: monedaAutoDetectada || monedaNegociacion,
    };
    onChange(nuevosPagos);
  };

  const handleMontoChange = (index, monto) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index] = { ...nuevosPagos[index], monto };
    onChange(nuevosPagos);
  };

  const handleReferenciaChange = (index, referencia) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index] = { ...nuevosPagos[index], referencia };
    onChange(nuevosPagos);
  };

  return (
    <Section title="Pagos" subtitle={`${pagos.length}/${MAX_PAGOS} pagos registrados`}>
      <div className="p-6 space-y-4">
        {/* Lista de pagos */}
        {pagos.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
            <CreditCard size={32} strokeWidth={1.5} />
            <p className="text-sm text-center">
              No se han agregado pagos. Agregue al menos un pago para confirmar la venta.
            </p>
          </div>
        )}

        {pagos.map((pago, index) => {
          const montoInvalido = pago.monto !== "" && (Number(pago.monto) <= 0 || isNaN(Number(pago.monto)));
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
                <Field label="Método de pago">
                  <select
                    className={selectClass}
                    value={pago.metodo}
                    onChange={(e) => handleMetodoChange(index, e.target.value)}
                  >
                    {METODO_PAGO_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="flex-1">
                  <Input
                    label="Monto"
                    type="number"
                    min="0"
                    step="any"
                    value={pago.monto}
                    onChange={(e) => handleMontoChange(index, e.target.value)}
                    placeholder="0"
                    error={montoInvalido ? "El monto debe ser mayor a cero" : undefined}
                  />
                </div>

                <div className="flex items-center gap-2 pb-0.5">
                  <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-1 rounded-lg">
                    {pago.moneda || monedaNegociacion}
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

              {/* Referencia opcional (nro. cheque, nro. transferencia, etc.) */}
              <div className="mt-3">
                <Input
                  label="Referencia (opcional)"
                  value={pago.referencia || ""}
                  onChange={(e) => handleReferenciaChange(index, e.target.value)}
                  placeholder="Nro. cheque, comprobante, etc."
                  className="text-xs"
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

        {/* Resumen de pagos */}
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Total de la venta:</span>
            <span className="font-semibold text-slate-800">
              {formatMonto(totalVenta)} {monedaNegociacion}
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
              {formatMonto(totalPagado)} {monedaNegociacion}
            </span>
          </div>

          {faltante > 0 && (
            <div className="flex justify-between items-center text-sm bg-red-50 rounded-lg px-3 py-2">
              <span className="text-red-500 font-medium">Faltante:</span>
              <span className="font-semibold text-red-600">
                {formatMonto(faltante)} {monedaNegociacion}
              </span>
            </div>
          )}

          {vuelto > 0 && (
            <div className="flex justify-between items-center text-sm bg-blue-50 rounded-lg px-3 py-2">
              <span className="text-blue-500 font-medium">Vuelto:</span>
              <span className="font-semibold text-blue-600">
                {formatMonto(vuelto)} {monedaNegociacion}
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
    </Section>
  );
}
