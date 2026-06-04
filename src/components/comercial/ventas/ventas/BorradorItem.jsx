import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";

function formatearMonto(monto) {
  const num = Number(monto);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-PY", { maximumFractionDigits: 2 });
}

function diasDesde(fechaStr) {
  if (!fechaStr) return null;
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  return Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
}

/**
 * Fila de venta en estado borrador para listados.
 *
 * @param {Object} venta - Objeto de venta del API
 */
export default function BorradorItem({ venta }) {
  const dias = diasDesde(venta.created_at);

  return (
    <Link
      href={`/ventas-crm/ventas/${venta.id}`}
      className="flex items-center gap-3 py-2.5 px-6 hover:bg-amber-50/50 transition-colors"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 shrink-0">
        <FileText className="h-4 w-4 text-amber-500" />
      </span>
      <div className="flex-1 min-w-0">
        <Text variant="bodySmBold" className="truncate">
          {venta.cliente_nombre || "Venta mostrador"}
        </Text>
        <Text variant="mutedXs" className="mt-0.5">
          ${formatearMonto(venta.total_usd)} · Hace {dias || 0}d
        </Text>
      </div>
      <Badge variant="warning" className="text-[10px] shrink-0">Borrador</Badge>
    </Link>
  );
}
