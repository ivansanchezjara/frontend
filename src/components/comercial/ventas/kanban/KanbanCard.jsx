"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { User, Calendar, Banknote } from "lucide-react";
import { Text, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Tarjeta individual del Kanban representando una oportunidad.
 * Todo el card es draggable. Un click (sin drag) navega al detalle.
 */
export default function KanbanCard({ oportunidad, onClick, isDragging = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: String(oportunidad.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;

  function formatMonto(monto) {
    if (!monto) return null;
    return Number(monto).toLocaleString("es-PY") + " ₲";
  }

  function formatFecha(fechaStr) {
    if (!fechaStr) return null;
    return new Date(fechaStr).toLocaleDateString("es-PY", {
      day: "2-digit",
      month: "short",
    });
  }

  // Distinguir click de drag: solo navegar si no se arrastró
  function handlePointerUp(e) {
    // Si el pointer se levanta sin haberse movido (no drag), es un click
    if (!dragging && onClick) {
      onClick();
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerUp={handlePointerUp}
      className={cn(
        "relative bg-white rounded-lg border border-slate-200 p-3",
        "transition-all duration-150 hover:shadow-md hover:border-slate-300",
        "outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:border-emerald-300",
        "cursor-grab active:cursor-grabbing",
        dragging && "shadow-xl rotate-2 scale-105 border-emerald-300 opacity-90 z-50",
        isSortableDragging && !isDragging && "opacity-30"
      )}
    >
      {/* Título */}
      <Text variant="bodySmBold" as="h4" className="leading-tight line-clamp-2 text-slate-800">
        {oportunidad.titulo}
      </Text>

      {/* Cliente */}
      {oportunidad.cliente_razon_social && (
        <div className="flex items-center gap-1.5 mt-2">
          <User className="w-3 h-3 text-slate-400 shrink-0" />
          <Text variant="mutedXs" as="span" className="truncate">
            {oportunidad.cliente_razon_social}
          </Text>
        </div>
      )}

      {/* Footer: monto y fecha */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
        {formatMonto(oportunidad.monto_estimado) ? (
          <Badge variant="success" className="text-[10px] px-1.5 py-0">
            <Banknote className="w-3 h-3 mr-1" />
            {formatMonto(oportunidad.monto_estimado)}
          </Badge>
        ) : (
          <Text variant="mutedXs" as="span">Sin monto</Text>
        )}

        {formatFecha(oportunidad.created_at) && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <Text variant="mutedXs" as="span">
              {formatFecha(oportunidad.created_at)}
            </Text>
          </div>
        )}
      </div>

      {/* Vendedor pill */}
      {oportunidad.vendedor_nombre && (
        <div className="mt-2">
          <Badge variant="default" className="text-[10px] px-1.5 py-0 normal-case tracking-normal font-medium">
            {oportunidad.vendedor_nombre}
          </Badge>
        </div>
      )}
    </div>
  );
}
