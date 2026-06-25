"use client";
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import KanbanCard from "./KanbanCard";
import { cn } from "@/lib/utils";

const COLLAPSED_LIMIT = 3;
const COLLAPSIBLE_COLUMNS = ["ganada", "perdida"];

/**
 * Columna individual del tablero Kanban.
 */
export default function KanbanColumn({ column, items, onClickCard, onNewCard }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const isCollapsible = COLLAPSIBLE_COLUMNS.includes(column.id) && items.length > COLLAPSED_LIMIT;
  const [expanded, setExpanded] = useState(false);

  const itemIds = items.map((item) => String(item.id));
  const visibleItems = isCollapsible && !expanded
    ? items.slice(0, COLLAPSED_LIMIT)
    : items;
  const hiddenCount = items.length - COLLAPSED_LIMIT;

  // Calcular monto total de la columna
  const montoTotal = items.reduce(
    (sum, item) => sum + Number(item.monto_estimado || 0),
    0
  );

  function formatMonto(monto) {
    if (!monto) return "0 ₲";
    return Number(monto).toLocaleString("es-PY") + " ₲";
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col flex-1 min-w-[220px] rounded-xl border bg-white/60 backdrop-blur-sm transition-all outline-none",
        isOver
          ? cn("ring-2 ring-offset-0", column.ringColor || "ring-emerald-300", "bg-white/90 shadow-lg", column.borderColor)
          : "border-slate-200/80"
      )}
    >
      {/* Header de columna */}
      <div className={cn("p-3 rounded-t-xl border-b", column.headerBg, "border-slate-100")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("w-2.5 h-2.5 rounded-full", column.color)} />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {column.label}
            </span>
          </div>
          <span
            className={cn(
              "text-[11px] font-bold px-2 py-0.5 rounded-full",
              column.lightBg,
              column.textColor
            )}
          >
            {items.length}
          </span>
        </div>
        {montoTotal > 0 && (
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {formatMonto(montoTotal)}
          </p>
        )}
      </div>

      {/* Cards area */}
      <div
        className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px] outline-none"
      >
        {/* Card de nueva oportunidad (solo en la primera columna) */}
        {onNewCard && (
          <button
            type="button"
            onClick={onNewCard}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-600 transition-colors">
              Nueva oportunidad
            </span>
          </button>
        )}

        <SortableContext
          items={itemIds}
          strategy={verticalListSortingStrategy}
        >
          {items.length === 0 && !onNewCard ? (
            <div className="flex items-center justify-center h-full min-h-[80px]">
              <p className="text-xs text-slate-300 italic">Sin oportunidades</p>
            </div>
          ) : (
            <>
              {visibleItems.map((oport) => (
                <KanbanCard
                  key={oport.id}
                  oportunidad={oport}
                  onClick={() => onClickCard?.(oport)}
                />
              ))}
              {isCollapsible && (
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      Ver {hiddenCount} más
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
