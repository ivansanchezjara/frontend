"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

import { Text } from "./Typography";
import AddressInput from "./AddressInput";
import Field from "./Field";
import { DEPARTAMENTOS, CIUDADES_POR_DEPARTAMENTO } from "@/config/paraguay";
import { cn } from "@/lib/utils";

// Leaflet no soporta SSR
const MapaPicker = dynamic(() => import("./MapaPicker"), { ssr: false });

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

/**
 * Normaliza un string para comparación: minúsculas, sin acentos, sin espacios extra.
 */
function norm(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Intenta matchear un departamento devuelto por Nominatim con la lista oficial.
 */
function matchDepartamento(raw) {
  if (!raw) return null;
  const deptoNorm = norm(raw);
  return (
    DEPARTAMENTOS.find((d) => norm(d) === deptoNorm) ||
    DEPARTAMENTOS.find(
      (d) => deptoNorm.includes(norm(d)) || norm(d).includes(deptoNorm)
    )
  );
}

/**
 * Intenta matchear una ciudad con la lista de ciudades de un departamento.
 */
function matchCiudad(ciudadRaw, departamento) {
  if (!ciudadRaw || !departamento) return "";
  const ciudadesDepto = CIUDADES_POR_DEPARTAMENTO[departamento] || [];
  const ciudadNorm = norm(ciudadRaw);
  return (
    ciudadesDepto.find((c) => norm(c) === ciudadNorm) ||
    ciudadesDepto.find(
      (c) => ciudadNorm.includes(norm(c)) || norm(c).includes(ciudadNorm)
    ) ||
    ""
  );
}

/**
 * UbicacionPicker — Componente unificado de selección de ubicación.
 *
 * Combina: Departamento select → Ciudad select → Dirección (autocomplete) → MapaPicker.
 * Todos se sincronizan: seleccionar en el mapa llena los selects y la dirección,
 * y seleccionar una sugerencia en el AddressInput mueve el pin.
 *
 * Props:
 * - departamento: string
 * - ciudad: string
 * - direccion: string
 * - latitud: number | null
 * - longitud: number | null
 * - onChange: ({ departamento, ciudad, direccion, latitud, longitud }) => void
 * - mapHeight: string (default "350px")
 * - disabled: boolean
 * - showMap: boolean (default true) — para ocultar el mapa si no se necesita
 * - label: string (default "Ubicación") — título de la sección
 * - errors: { departamento?, ciudad?, direccion? } — errores por campo
 */
export default function UbicacionPicker({
  departamento = "",
  ciudad = "",
  direccion = "",
  latitud = null,
  longitud = null,
  onChange,
  mapHeight = "350px",
  disabled = false,
  showMap = true,
  label,
  errors = {},
}) {
  const [ciudades, setCiudades] = useState([]);

  // Actualizar lista de ciudades cuando cambia el departamento
  useEffect(() => {
    setCiudades(departamento ? CIUDADES_POR_DEPARTAMENTO[departamento] || [] : []);
  }, [departamento]);

  // ─── Ref para evitar stale closures en callbacks del mapa ───

  const stateRef = useRef({ departamento, ciudad, direccion, latitud, longitud, onChange });
  stateRef.current = { departamento, ciudad, direccion, latitud, longitud, onChange };

  // ─── Handlers ───────────────────────────────────────────────

  const emit = useCallback(
    (patch) => {
      const { onChange: cb, departamento: d, ciudad: c, direccion: dir, latitud: lat, longitud: lng } = stateRef.current;
      if (cb) {
        cb({ departamento: d, ciudad: c, direccion: dir, latitud: lat, longitud: lng, ...patch });
      }
    },
    []
  );

  const handleDepartamentoChange = (e) => {
    const value = e.target.value;
    emit({ departamento: value, ciudad: "" });
  };

  const handleCiudadChange = (e) => {
    emit({ ciudad: e.target.value });
  };

  const handleDireccionChange = (e) => {
    const value = e?.target ? e.target.value : e;
    emit({ direccion: value });
  };

  const handleAddressSelect = ({ lat, lng, departamentoRaw, ciudad: ciudadRaw }) => {
    const patch = { latitud: lat, longitud: lng };

    if (departamentoRaw) {
      const deptoMatch = matchDepartamento(departamentoRaw);
      if (deptoMatch) {
        patch.departamento = deptoMatch;
        const ciudadMatch = matchCiudad(ciudadRaw, deptoMatch);
        patch.ciudad = ciudadMatch;
      }
    }

    emit(patch);
  };

  const handleMapChange = useCallback(
    ({ lat, lng, departamentoRaw, ciudad: ciudadRaw, direccion: dirRaw }) => {
      const patch = { latitud: lat, longitud: lng };

      if (departamentoRaw) {
        const deptoMatch = matchDepartamento(departamentoRaw);
        if (deptoMatch) {
          patch.departamento = deptoMatch;
          // Intentar matchear la ciudad dentro del nuevo departamento
          const ciudadMatch = matchCiudad(ciudadRaw, deptoMatch);
          patch.ciudad = ciudadMatch;
        }
      }

      // Siempre actualizar dirección con lo que devuelve el geocoding
      if (dirRaw != null) {
        patch.direccion = dirRaw;
      }

      emit(patch);
    },
    [emit]
  );

  // ─── Render ─────────────────────────────────────────────────

  const context = [ciudad, departamento].filter(Boolean).join(", ");

  return (
    <div className="space-y-4">
      {label && (
        <Text
          variant="label"
          className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block"
        >
          {label}
        </Text>
      )}

      {/* Departamento + Ciudad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Departamento">
          <select
            className={cn(selectClass, errors.departamento && "border-red-300")}
            value={departamento}
            onChange={handleDepartamentoChange}
            disabled={disabled}
          >
            <option value="">— Seleccionar —</option>
            {DEPARTAMENTOS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.departamento && (
            <Text variant="bodySm" className="mt-1 text-xs text-red-500">
              {errors.departamento}
            </Text>
          )}
        </Field>

        <Field label="Ciudad">
          <select
            className={cn(selectClass, errors.ciudad && "border-red-300")}
            value={ciudad}
            onChange={handleCiudadChange}
            disabled={disabled || !departamento}
          >
            <option value="">— Seleccionar —</option>
            {ciudades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.ciudad && (
            <Text variant="bodySm" className="mt-1 text-xs text-red-500">
              {errors.ciudad}
            </Text>
          )}
        </Field>
      </div>

      {/* Dirección (con autocomplete) */}
      <div>
        <AddressInput
          label="Dirección"
          value={direccion}
          onChange={handleDireccionChange}
          placeholder="Calle, número, barrio..."
          maxLength={500}
          context={context}
          disabled={disabled}
          error={errors.direccion}
          onSelect={handleAddressSelect}
        />
      </div>

      {/* Mapa interactivo (sin buscador propio, ya lo tiene el AddressInput) */}
      {showMap && (
        <MapaPicker
          latitud={latitud}
          longitud={longitud}
          centerOn={context}
          onChange={handleMapChange}
          height={mapHeight}
          disabled={disabled}
          hideSearch
        />
      )}
    </div>
  );
}
