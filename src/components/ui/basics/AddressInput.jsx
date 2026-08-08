"use client";
import { useState, useRef, useCallback } from "react";
import { Text } from "./Typography";
import { cn } from "@/lib/utils";

/**
 * Busca direcciones en Nominatim acotadas a una ciudad/departamento.
 */
async function searchStreet(query, context) {
  if (!query || query.trim().length < 3) return [];
  const fullQuery = context ? `${query}, ${context}, Paraguay` : `${query}, Paraguay`;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&addressdetails=1&limit=5&countrycodes=py&accept-language=es`,
      { headers: { "User-Agent": "ERP-App/1.0" } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * AddressInput — Input de dirección con autocompletado vía Nominatim.
 *
 * Props:
 * - label: string
 * - value: string
 * - onChange: (e) => void — estándar como un input
 * - onSelect: ({ lat, lng, direccion, displayName }) => void — al elegir una sugerencia
 * - context: string — ciudad/departamento para acotar búsqueda (ej: "Lambaré, Central")
 * - placeholder: string
 * - maxLength: number
 * - error: string
 * - disabled: boolean
 */
export default function AddressInput({
  label, value, onChange, onSelect, context = "", placeholder, maxLength, error, disabled,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  const handleChange = useCallback((e) => {
    if (onChange) onChange(e);
    const val = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchStreet(val, context);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSearching(false);
    }, 600);
  }, [onChange, context]);

  const handleSelect = (item) => {
    const addr = item.address || {};
    const calle = [addr.road, addr.house_number].filter(Boolean).join(" ");
    const barrio = addr.suburb || addr.neighbourhood || "";
    const direccion = [calle, barrio].filter(Boolean).join(", ");

    // Extraer departamento y ciudad de Nominatim
    let departamentoRaw = (addr.state || "")
      .replace(/^Departamento\s+(de\s+)?/i, "")
      .replace(/^Distrito\s+/i, "")
      .replace(/^Dept\.\s*/i, "")
      .trim();
    const ciudad = addr.city || addr.town || addr.village || addr.municipality || "";
    if (!departamentoRaw && ciudad.toLowerCase().includes("asunci")) departamentoRaw = "Asunción";

    // Actualizar el input con la dirección formateada
    if (onChange) {
      const syntheticEvent = { target: { value: direccion || item.display_name?.split(",")[0] || "" } };
      onChange(syntheticEvent);
    }

    setShowSuggestions(false);
    setSuggestions([]);

    if (onSelect) {
      onSelect({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        direccion: direccion || item.display_name?.split(",")[0] || "",
        displayName: item.display_name || "",
        departamentoRaw,
        ciudad,
      });
    }
  };

  return (
    <div className="flex flex-col gap-1.5 relative">
      {label && <Text as="label" variant="label">{label}</Text>}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "block w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all",
            "focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
            "placeholder:text-slate-400",
            error ? "border-red-300" : "border-slate-200"
          )}
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">...</span>
        )}
      </div>
      {showSuggestions && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(item)}
            >
              <span className="text-slate-700 line-clamp-2">{item.display_name}</span>
            </button>
          ))}
        </div>
      )}
      {error && <Text variant="bodySm" className="text-xs text-red-500">{error}</Text>}
    </div>
  );
}
