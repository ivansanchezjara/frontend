"use client";
import { Filter } from "lucide-react";
import { SearchBar, Text } from "@/components/ui";
import { cn } from "@/lib/utils";

const ESTADOS_PRESUPUESTO = [
  { value: "", label: "Todos" },
  { value: "borrador", label: "Borrador" },
  { value: "enviado", label: "Enviado" },
  { value: "aceptado", label: "Aceptado" },
  { value: "rechazado", label: "Rechazado" },
  { value: "vencido", label: "Vencido" },
];

function FilterDropdown({ value, onChange }) {
  const isActive = value !== "";
  return (
    <div className="relative flex items-center gap-1.5">
      <Filter className={cn("w-3.5 h-3.5", isActive ? "text-emerald-600" : "text-slate-400")} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Filtrar por estado"
        className={cn(
          "appearance-none text-xs font-semibold rounded-lg px-2 py-1.5 pr-6 cursor-pointer",
          "border transition-all outline-none",
          isActive
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
        )}
      >
        {ESTADOS_PRESUPUESTO.map((opt) => (
          <option key={opt.value} value={opt.value}>
            Estado: {opt.label}
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

/**
 * Barra de búsqueda + filtros de la lista de presupuestos.
 */
export default function PresupuestosToolbar({
  busqueda,
  onBusquedaChange,
  estado,
  onEstadoChange,
  count,
  hayFiltrosActivos,
  onLimpiarFiltros,
}) {
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-20">
      <div className="flex-1 max-w-md">
        <SearchBar
          value={busqueda}
          onChange={onBusquedaChange}
          placeholder="Buscar por cliente u oportunidad..."
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <FilterDropdown value={estado} onChange={onEstadoChange} />
        {hayFiltrosActivos && (
          <button
            onClick={onLimpiarFiltros}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <Text
        variant="label"
        className="flex items-center gap-2 text-slate-400 whitespace-nowrap sm:ml-auto"
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            count > 0
              ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
              : "bg-slate-300"
          )}
        />
        {count} presupuesto{count !== 1 ? "s" : ""}
      </Text>
    </div>
  );
}
