"use client";
import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import { cn } from "@/lib/utils";

// ─── Configuración de columnas ──────────────────────────────────

const KANBAN_COLUMNS = [
  {
    id: "nueva",
    label: "Nueva",
    color: "bg-blue-500",
    lightBg: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
    ringColor: "ring-blue-300",
    headerBg: "bg-blue-50/80",
  },
  {
    id: "contactada",
    label: "Contactada",
    color: "bg-amber-500",
    lightBg: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-300",
    ringColor: "ring-amber-300",
    headerBg: "bg-amber-50/80",
  },
  {
    id: "negociacion",
    label: "Negociación",
    color: "bg-purple-500",
    lightBg: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-300",
    ringColor: "ring-purple-300",
    headerBg: "bg-purple-50/80",
  },
  {
    id: "ganada",
    label: "Ganada",
    color: "bg-green-500",
    lightBg: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-300",
    ringColor: "ring-green-300",
    headerBg: "bg-green-50/80",
  },
  {
    id: "perdida",
    label: "Perdida",
    color: "bg-red-500",
    lightBg: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-300",
    ringColor: "ring-red-300",
    headerBg: "bg-red-50/80",
  },
];

export { KANBAN_COLUMNS };

/**
 * Tablero Kanban para gestión visual de oportunidades CRM.
 *
 * @param {Array} oportunidades - Lista completa de oportunidades
 * @param {Function} onMoveOportunidad - Callback (id, nuevaEtapa) al mover tarjeta
 * @param {Function} onClickOportunidad - Callback (oportunidad) al hacer click en tarjeta
 * @param {Function} onNewOportunidad - Callback para abrir modal de nueva oportunidad
 * @param {boolean} loading - Indica si está cargando
 */
export default function KanbanBoard({
  oportunidades = [],
  onMoveOportunidad,
  onClickOportunidad,
  onNewOportunidad,
  loading = false,
}) {
  const [activeCard, setActiveCard] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Agrupar oportunidades por etapa
  const columnData = useMemo(() => {
    const grouped = {};
    KANBAN_COLUMNS.forEach((col) => {
      grouped[col.id] = [];
    });
    oportunidades.forEach((oport) => {
      if (grouped[oport.etapa]) {
        grouped[oport.etapa].push(oport);
      }
    });
    return grouped;
  }, [oportunidades]);

  function handleDragStart(event) {
    const { active } = event;
    const card = oportunidades.find((o) => String(o.id) === String(active.id));
    setActiveCard(card || null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const oportunidadId = active.id;
    let nuevaEtapa = null;

    // Verificar si se soltó sobre una columna
    const columnaDestino = KANBAN_COLUMNS.find(
      (col) => col.id === over.id
    );
    if (columnaDestino) {
      nuevaEtapa = columnaDestino.id;
    } else {
      // Se soltó sobre otra tarjeta: determinar en qué columna está esa tarjeta
      const targetCard = oportunidades.find(
        (o) => String(o.id) === String(over.id)
      );
      if (targetCard) {
        nuevaEtapa = targetCard.etapa;
      }
    }

    if (!nuevaEtapa) return;

    // Solo hacer update si cambió de etapa
    const cardOriginal = oportunidades.find(
      (o) => String(o.id) === String(oportunidadId)
    );
    if (cardOriginal && cardOriginal.etapa !== nuevaEtapa) {
      onMoveOportunidad?.(oportunidadId, nuevaEtapa);
    }
  }

  function handleDragCancel() {
    setActiveCard(null);
  }

  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-4 h-full min-h-0",
        loading && "opacity-50 pointer-events-none"
      )}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            items={columnData[column.id] || []}
            onClickCard={onClickOportunidad}
            onNewCard={column.id === "nueva" ? onNewOportunidad : undefined}
          />
        ))}

        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <KanbanCard oportunidad={activeCard} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
