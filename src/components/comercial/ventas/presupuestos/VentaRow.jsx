import Link from "next/link";
import { Text } from "@/components/ui/basics/Typography";

function formatearMonto(monto) {
  const num = Number(monto);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-PY", { maximumFractionDigits: 2 });
}

function formatFechaCorta(fechaStr) {
  if (!fechaStr) return "—";
  return new Date(fechaStr).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Fila compacta de venta confirmada para listados.
 *
 * @param {Object} venta - Objeto de venta del API
 */
export default function VentaRow({ venta }) {
  return (
    <Link
      href={`/ventas-crm/ventas/${venta.id}`}
      className="flex items-center gap-3 py-2.5 px-6 hover:bg-slate-50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <Text variant="bodySmBold" className="truncate">
          {venta.cliente_nombre || "Venta mostrador"}
        </Text>
        <Text variant="mutedXs" className="mt-0.5">
          {venta.comprobante?.numero ? `#${venta.comprobante.numero}` : `V-${venta.id}`}
          {" · "}
          {formatFechaCorta(venta.created_at)}
        </Text>
      </div>
      <Text variant="bodySmBold" as="span" className="shrink-0">
        ${formatearMonto(venta.total_usd)}
      </Text>
    </Link>
  );
}
