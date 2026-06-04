import { Phone, MapPin, Mail, MessageCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";

const TIPO_ICON = {
  llamada: Phone,
  visita: MapPin,
  correo: Mail,
  whatsapp: MessageCircle,
};

const TIPO_COLOR = {
  llamada: "text-blue-500 bg-blue-50",
  visita: "text-emerald-500 bg-emerald-50",
  correo: "text-purple-500 bg-purple-50",
  whatsapp: "text-green-500 bg-green-50",
};

function diasDesde(fechaStr) {
  if (!fechaStr) return null;
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  return Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
}

function formatFechaCorta(fechaStr) {
  if (!fechaStr) return "—";
  return new Date(fechaStr).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Fila de actividad/interacción pendiente.
 * Muestra icono de tipo, nombre del prospecto/cliente, descripción y fecha.
 *
 * @param {Object} interaccion - Objeto de interacción del API
 */
export default function ActivityItem({ interaccion }) {
  const Icon = TIPO_ICON[interaccion.tipo] || Clock;
  const colorClass = TIPO_COLOR[interaccion.tipo] || "text-slate-500 bg-slate-50";
  const dias = diasDesde(interaccion.proxima_accion_fecha);
  const vencida = dias !== null && dias > 0;

  return (
    <div className="flex items-start gap-3 py-2.5 px-6">
      <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0", colorClass)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <Text variant="bodySmBold" className="truncate">
          {interaccion.oportunidad_titulo || interaccion.cliente_razon_social || "—"}
        </Text>
        <Text variant="mutedXs" className="truncate mt-0.5">
          {interaccion.proxima_accion_descripcion || interaccion.resumen}
        </Text>
      </div>
      <div className="text-right shrink-0">
        <Badge variant={vencida ? "danger" : "warning"} className="text-[10px]">
          {vencida ? `Hace ${dias}d` : formatFechaCorta(interaccion.proxima_accion_fecha)}
        </Badge>
      </div>
    </div>
  );
}
