"use client";
import { cn } from "@/lib/utils";

const COLORS = {
  emerald: { active: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  blue: { active: "text-blue-600", bg: "bg-blue-50 border-blue-200 text-blue-700" },
  purple: { active: "text-purple-600", bg: "bg-purple-50 border-purple-200 text-purple-700" },
  amber: { active: "text-amber-600", bg: "bg-amber-50 border-amber-200 text-amber-700" },
  slate: { active: "text-slate-600", bg: "bg-slate-100 border-slate-300 text-slate-700" },
};

/**
 * Dropdown de filtro reutilizable con ícono y estado activo visual.
 *
 * @param {string} value - Valor actual del filtro
 * @param {Function} onChange - Callback con el nuevo valor
 * @param {Component} icon - Componente de ícono (lucide-react)
 * @param {string} label - Label para accessibility y prefijo de opciones
 * @param {Array<{value: string, label: string}>} options - Opciones del dropdown
 * @param {string} color - Color del estado activo (emerald, blue, purple, amber, slate)
 */
export function FilterDropdown({ value, onChange, icon: Icon, label, options, color = "emerald" }) {
  const isActive = value !== "";
  const palette = COLORS[color] || COLORS.emerald;

  return (
    <div className="relative flex items-center gap-1.5">
      {Icon && (
        <Icon className={cn("w-3.5 h-3.5", isActive ? palette.active : "text-slate-400")} />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "appearance-none text-xs font-semibold rounded-lg px-2 py-1.5 pr-6 cursor-pointer",
          "border transition-all outline-none",
          isActive
            ? palette.bg
            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
        )}
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {label}: {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2">
        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
