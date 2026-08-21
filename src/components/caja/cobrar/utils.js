/**
 * Utilidades compartidas para el flujo de cobro.
 */

export const METODO_PAGO_OPTIONS = [
  { value: "efectivo_pyg", label: "Efectivo PYG", moneda: "PYG" },
  { value: "efectivo_usd", label: "Efectivo USD", moneda: "USD" },
  { value: "efectivo_brl", label: "Efectivo BRL", moneda: "BRL" },
  { value: "cheque_pyg", label: "Cheque PYG", moneda: "PYG" },
  { value: "cheque_usd", label: "Cheque USD", moneda: "USD" },
  { value: "transferencia_pyg", label: "Transferencia PYG", moneda: "PYG" },
  { value: "tarjeta_credito", label: "Tarjeta Crédito", moneda: "PYG" },
  { value: "tarjeta_debito", label: "Tarjeta Débito", moneda: "PYG" },
  { value: "pix", label: "PIX", moneda: "BRL" },
  { value: "cuotas", label: "Pago a Cuotas", moneda: "PYG" },
];

export const MAX_PAGOS = 10;

export const ENTREGA_CONFIG = {
  mostrador: { icon: "Store", label: "Mostrador", color: "text-slate-600 bg-slate-100" },
  delivery: { icon: "Truck", label: "Delivery", color: "text-blue-600 bg-blue-50" },
  retiro_sucursal: { icon: "Building2", label: "Retiro sucursal", color: "text-purple-600 bg-purple-50" },
};

export function getMonedaForMetodo(metodo) {
  const option = METODO_PAGO_OPTIONS.find((o) => o.value === metodo);
  return option?.moneda || null;
}

export function formatMonto(monto, moneda = "PYG") {
  if (monto == null || isNaN(monto)) return "0";
  const num = Number(monto);
  if (moneda === "PYG") {
    return num.toLocaleString("es-PY", { maximumFractionDigits: 0 });
  }
  return num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getMonedaSymbol(moneda) {
  if (moneda === "PYG") return "₲";
  if (moneda === "USD") return "$";
  if (moneda === "BRL") return "R$";
  return moneda;
}

/**
 * Convierte un monto de una moneda a otra usando tasas de cambio.
 * Las tasas están expresadas como USD/X (cuántas X por 1 USD).
 */
export function convertir(monto, monedaOrigen, monedaDestino, tasas) {
  if (!monto || monedaOrigen === monedaDestino) return monto;

  let montoUsd = monto;
  if (monedaOrigen !== "USD") {
    const tasaOrigen = tasas[`USD/${monedaOrigen}`];
    if (!tasaOrigen) return null;
    montoUsd = monto / tasaOrigen;
  }

  if (monedaDestino === "USD") return montoUsd;

  const tasaDestino = tasas[`USD/${monedaDestino}`];
  if (!tasaDestino) return null;
  return montoUsd * tasaDestino;
}
