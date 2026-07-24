"use client";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Header de tabla con ordenamiento clickeable.
 *
 * @param {string} field - Nombre del campo para ordenar
 * @param {string} label - Texto visible del header
 * @param {string} currentOrdering - Valor actual del ordering (ej: "-created_at")
 * @param {Function} onChange - Callback con el nuevo ordering
 * @param {string} color - Color del estado activo (emerald, blue, purple)
 */
export function SortableHeader({ field, label, currentOrdering, onChange, color = "emerald" }) {
  const isActive = currentOrdering === field || currentOrdering === `-${field}`;
  const isDesc = currentOrdering === `-${field}`;

  const colorClass = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    amber: "text-amber-600",
  }[color] || "text-emerald-600";

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isActive) onChange(field);
    else if (!isDesc) onChange(`-${field}`);
    else onChange(field);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest transition-colors",
        isActive ? colorClass : "text-slate-500 hover:text-slate-700"
      )}
    >
      {label}
      {isActive && (
        <ArrowUpDown size={10} className={cn("transition-transform", isDesc && "rotate-180")} />
      )}
    </button>
  );
}
