import { Store, Truck, Building2 } from "lucide-react";

// ─── Formateo ───────────────────────────────────────────────────

export function formatFecha(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatMonto(valor, moneda) {
  if (valor == null) return "—";
  const num = Number(valor);
  if (moneda === "PYG") return `₲ ${num.toLocaleString("es-PY")}`;
  if (moneda === "USD") return `$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  if (moneda === "BRL") return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  return String(valor);
}

export function getAntiguedad(fecha) {
  if (!fecha) return null;
  const mins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (mins < 60) return { label: `${mins} min`, urgente: mins > 30 };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { label: `${hrs}h ${mins % 60}m`, urgente: hrs >= 1 };
  const dias = Math.floor(hrs / 24);
  return { label: `${dias}d`, urgente: true };
}

// ─── Config de métodos de entrega ───────────────────────────────

export const ENTREGA_CONFIG = {
  mostrador: { icon: Store, label: "Mostrador", color: "text-slate-500 bg-slate-100" },
  delivery: { icon: Truck, label: "Delivery", color: "text-blue-600 bg-blue-50" },
  retiro_sucursal: { icon: Building2, label: "Retiro sucursal", color: "text-purple-600 bg-purple-50" },
};
