import { Building2, Landmark, Banknote, FileCheck } from "lucide-react";

// ─── Format helpers ─────────────────────────────────────────────

export function formatMonto(valor, moneda) {
  if (valor == null) return "—";
  const num = Number(valor);
  if (moneda === "PYG") {
    return `₲ ${num.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;
  }
  if (moneda === "BRL") {
    return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  }
  return `US$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
}

export function formatUSD(v) {
  if (v == null) return "—";
  return `US$ ${Number(v).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
}

export function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

// ─── Constants ──────────────────────────────────────────────────

export const TIPO_ICONS = {
  tesoreria: Banknote,
  banco: Landmark,
  cheques_recibidos: FileCheck,
  cheques_emitidos: FileCheck,
};

export const TIPO_COLORS = {
  tesoreria: "bg-emerald-500",
  banco: "bg-blue-500",
  cheques_recibidos: "bg-amber-500",
  cheques_emitidos: "bg-purple-500",
};

export const MONEDA_CONFIG = {
  PYG: {
    label: "Guaraníes",
    symbol: "₲",
    color: "border-red-200 bg-red-50/50",
    iconColor: "bg-red-500",
    textColor: "text-red-700",
    format: (v) => `₲ ${Number(v || 0).toLocaleString("es-PY", { maximumFractionDigits: 0 })}`,
  },
  USD: {
    label: "Dólares",
    symbol: "US$",
    color: "border-emerald-200 bg-emerald-50/50",
    iconColor: "bg-emerald-500",
    textColor: "text-emerald-700",
    format: (v) => `US$ ${Number(v || 0).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`,
  },
  BRL: {
    label: "Reales",
    symbol: "R$",
    color: "border-amber-200 bg-amber-50/50",
    iconColor: "bg-amber-500",
    textColor: "text-amber-700",
    format: (v) => `R$ ${Number(v || 0).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`,
  },
};
