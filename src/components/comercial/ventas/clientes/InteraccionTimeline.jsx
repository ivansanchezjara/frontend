"use client";
import { Phone, MapPin, Mail, MessageCircle, StickyNote } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";

const TIPO_CONFIG = {
  llamada: { icon: Phone, label: "Llamada", color: "text-blue-600 bg-blue-100" },
  visita: { icon: MapPin, label: "Visita", color: "text-emerald-600 bg-emerald-100" },
  correo: { icon: Mail, label: "Correo", color: "text-amber-600 bg-amber-100" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "text-green-600 bg-green-100" },
  nota: { icon: StickyNote, label: "Nota", color: "text-slate-600 bg-slate-100" },
};

function formatFecha(fechaStr) {
  if (!fechaStr) return "";
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InteraccionItem({ interaccion }) {
  const config = TIPO_CONFIG[interaccion.tipo] || TIPO_CONFIG.nota;
  const Icon = config.icon;

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Línea vertical */}
      <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-200 last:hidden" />

      {/* Icono */}
      <div
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          config.color
        )}
      >
        <Icon size={18} />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="default" className="text-[10px]">
            {config.label}
          </Badge>
          <Text variant="bodyXs" className="text-slate-400">
            {formatFecha(interaccion.fecha)}
          </Text>
          {interaccion.vendedor_nombre && (
            <Text variant="bodyXs" className="text-slate-400">
              · {interaccion.vendedor_nombre}
            </Text>
          )}
        </div>
        <Text variant="bodySm" className="mt-1 text-slate-700 leading-relaxed">
          {interaccion.resumen}
        </Text>
        {interaccion.proxima_accion_fecha && (
          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5">
            <Text variant="bodyXs" className="text-amber-700 font-medium">
              📅 Próxima acción: {formatFecha(interaccion.proxima_accion_fecha)}
              {interaccion.proxima_accion_descripcion && (
                <span className="ml-1">— {interaccion.proxima_accion_descripcion}</span>
              )}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Timeline cronológico de interacciones.
 * Muestra interacciones con tipo (icono), fecha, resumen y vendedor.
 * Ordenadas por fecha descendente (más recientes primero).
 *
 * @param {Object[]} interacciones - Lista de interacciones a mostrar
 * @param {boolean} loading - Estado de carga
 */
export default function InteraccionTimeline({ interacciones = [], loading = false }) {
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!interacciones || interacciones.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          titulo="Sin interacciones"
          descripcion="No hay interacciones registradas para este cliente."
          icon="💬"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-0">
      {interacciones.map((interaccion) => (
        <InteraccionItem key={interaccion.id} interaccion={interaccion} />
      ))}
    </div>
  );
}
