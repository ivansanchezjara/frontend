import { FileText, Send, Check, X, AlertTriangle } from "lucide-react";

// ─── Constantes ─────────────────────────────────────────────────

export const ESTADO_BADGE = {
  borrador: { variant: "default", label: "Borrador", icon: FileText },
  enviado: { variant: "info", label: "Enviado", icon: Send },
  aceptado: { variant: "success", label: "Aceptado", icon: Check },
  rechazado: { variant: "danger", label: "Rechazado", icon: X },
  vencido: { variant: "warning", label: "Vencido", icon: AlertTriangle },
};

export const MONEDA_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "PYG", label: "PYG" },
  { value: "BRL", label: "BRL" },
];

export const TIER_LABELS = {
  publico: "Público",
  estudiante: "Estudiante",
  reventa: "Reventa",
  mayorista: "Mayorista",
  intercompany: "Intercompany",
};

/**
 * Mapea tier_precio del cliente al campo de precio en la variante.
 */
const TIER_PRECIO_FIELD = {
  publico: "precio_0_publico",
  estudiante: "precio_1_estudiante",
  reventa: "precio_2_reventa",
  mayorista: "precio_3_mayorista",
  intercompany: "precio_4_intercompany",
};

// ─── Funciones de precio ────────────────────────────────────────

export function getPrecioTier(variante, tier) {
  const campo = TIER_PRECIO_FIELD[tier] || "precio_0_publico";
  return Number(variante[campo]) || 0;
}

export function getPrecioPublico(variante) {
  return Number(variante.precio_0_publico) || 0;
}

/**
 * Retorna el precio de oferta vigente si existe, o null.
 */
export function getPrecioOferta(variante) {
  if (!variante.precio_oferta) return null;
  // Si la oferta viene validada del backend (ya filtrada por vigencia),
  // el campo precio_oferta solo existe si está vigente.
  return Number(variante.precio_oferta) || null;
}

/**
 * Determina el mejor precio unitario para una variante,
 * considerando el precio de tier y la oferta vigente.
 * Retorna { precio, tipo: 'oferta' | 'tier', precioOferta, precioTier }
 */
export function getPrecioMejor(variante, tier) {
  const precioTier = getPrecioTier(variante, tier);
  const precioOferta = getPrecioOferta(variante);

  if (precioOferta !== null && precioOferta < precioTier) {
    return {
      precio: precioOferta,
      tipo: "oferta",
      precioOferta,
      precioTier,
      ofertaVence: variante.oferta_vence || null,
    };
  }

  return {
    precio: precioTier,
    tipo: "tier",
    precioOferta,
    precioTier,
    ofertaVence: variante.oferta_vence || null,
  };
}

/**
 * Calcula el descuento implícito entre precio público y precio de tier.
 * Retorna porcentaje (0-100).
 */
export function calcDescuentoImplicito(precioPublico, precioTier) {
  if (!precioPublico || precioPublico <= 0 || precioTier >= precioPublico) return 0;
  return Math.round(((precioPublico - precioTier) / precioPublico) * 10000) / 100;
}

// ─── Formateo ───────────────────────────────────────────────────

export function formatMonto(monto, moneda = "USD") {
  if (!monto || Number(monto) === 0) return "—";
  const num = Number(monto);
  if (moneda === "PYG") return num.toLocaleString("es-PY") + " ₲";
  if (moneda === "BRL") return "R$ " + num.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  return "USD " + num.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

export function formatPrecio(valor) {
  if (!valor || Number(valor) === 0) return "—";
  return `$${Number(valor).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatFecha(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-PY", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function formatFechaCorta(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
}

// ─── Vigencia ───────────────────────────────────────────────────

export function calcVigencia(enviado_at, vigencia_dias) {
  if (!enviado_at || !vigencia_dias) return { vencido: false, diasRestantes: null };
  const envio = new Date(enviado_at);
  const vence = new Date(envio.getTime() + vigencia_dias * 86400000);
  const hoy = new Date();
  const diasRestantes = Math.ceil((vence - hoy) / 86400000);
  return { vencido: diasRestantes <= 0, diasRestantes };
}

// ─── Descuento extra ────────────────────────────────────────────

export const DESCUENTO_EXTRA_TIPOS = {
  ninguno: "Sin desc.",
  porcentaje: "%",
  monto: "$",
};

/**
 * Calcula el precio final por unidad aplicando descuento extra.
 * @param {number} precioBase - precio unitario (ya con tier)
 * @param {string} tipo - 'ninguno' | 'porcentaje' | 'monto'
 * @param {number} valor - valor del descuento extra
 * @returns {number} precio final por unidad
 */
export function calcPrecioConDescuentoExtra(precioBase, tipo, valor) {
  if (!valor || valor <= 0 || tipo === "ninguno") return precioBase;
  if (tipo === "porcentaje") return precioBase * (1 - valor / 100);
  if (tipo === "monto") return Math.max(0, precioBase - valor);
  return precioBase;
}

/**
 * Calcula subtotal de una línea incluyendo descuento extra.
 */
export function calcSubtotalLinea(linea) {
  const precioFinal = calcPrecioConDescuentoExtra(
    linea.precio_unitario,
    linea.descuento_extra_tipo || "ninguno",
    linea.descuento_extra_valor || 0
  );
  return precioFinal * linea.cantidad;
}
