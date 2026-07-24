"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default marker icons in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [-25.2867, -57.647];
const DEFAULT_ZOOM = 13;

function ClickHandler({ onLocationSelect }) {
  useMapEvents({ click(e) { onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

function FlyToPoint({ lat, lng, zoom }) {
  const map = useMap();
  const prevRef = useRef(null);
  useEffect(() => {
    if (lat && lng) {
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      if (prevRef.current !== key) {
        prevRef.current = key;
        map.flyTo([lat, lng], zoom || 16, { duration: 0.5 });
      }
    }
  }, [lat, lng, zoom, map]);
  return null;
}

// ─── Nominatim API ──────────────────────────────────────────────

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=es`,
      { headers: { "User-Agent": "ERP-App/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    let departamentoRaw = (addr.state || "")
      .replace(/^Departamento\s+(de\s+)?/i, "")
      .replace(/^Distrito\s+/i, "")
      .replace(/^Dept\.\s*/i, "")
      .trim();
    const ciudad = addr.city || addr.town || addr.village || addr.municipality || "";
    if (!departamentoRaw && ciudad.toLowerCase().includes("asunci")) departamentoRaw = "Asunción";
    const calle = [addr.road, addr.house_number].filter(Boolean).join(" ");
    const barrio = addr.suburb || addr.neighbourhood || "";
    const direccion = [calle, barrio].filter(Boolean).join(", ");
    return { departamentoRaw, ciudad, direccion, displayName: data.display_name || "" };
  } catch { return null; }
}

async function searchAddress(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Paraguay")}&format=json&addressdetails=1&limit=5&accept-language=es`,
      { headers: { "User-Agent": "ERP-App/1.0" } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

// ─── Buscador de dirección ──────────────────────────────────────

function AddressSearchBar({ onSelect, disabled }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef(null);

  const handleSearch = useCallback((value) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim().length < 3) { setResults([]); setShowResults(false); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      const data = await searchAddress(value);
      setResults(data);
      setShowResults(data.length > 0);
      setSearching(false);
    }, 500);
  }, []);

  const handleSelect = (item) => {
    setQuery(item.display_name?.split(",")[0] || "");
    setShowResults(false);
    setResults([]);
    const addr = item.address || {};
    let departamentoRaw = (addr.state || "")
      .replace(/^Departamento\s+(de\s+)?/i, "")
      .replace(/^Distrito\s+/i, "")
      .replace(/^Dept\.\s*/i, "")
      .trim();
    const ciudad = addr.city || addr.town || addr.village || addr.municipality || "";
    if (!departamentoRaw && ciudad.toLowerCase().includes("asunci")) departamentoRaw = "Asunción";
    const calle = [addr.road, addr.house_number].filter(Boolean).join(" ");
    const barrio = addr.suburb || addr.neighbourhood || "";
    const direccion = [calle, barrio].filter(Boolean).join(", ");
    onSelect({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), departamentoRaw, ciudad, direccion, displayName: item.display_name || "" });
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => { if (results.length > 0) setShowResults(true); }}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        disabled={disabled}
        placeholder="Buscar dirección, ciudad o lugar..."
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
      />
      {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">Buscando...</span>}
      {showResults && results.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {results.map((item, i) => (
            <button key={i} type="button" className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0" onClick={() => handleSelect(item)}>
              <span className="text-slate-700 line-clamp-2">{item.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ───────────────────────────────────────

/**
 * MapaPicker — Mapa interactivo con buscador y geocodificación.
 *
 * Props:
 * - latitud, longitud: coordenadas actuales (o null)
 * - onChange: ({ lat, lng, departamentoRaw, ciudad, direccion }) => void
 * - height: string
 * - disabled: boolean
 * - centerOn: string — cuando cambia, centra el mapa en esa ubicación (ej: "Lambaré, Central")
 */
export default function MapaPicker({
  latitud, longitud, onChange, height = "250px", disabled = false, centerOn = "",
}) {
  const [position, setPosition] = useState(
    latitud && longitud ? { lat: latitud, lng: longitud } : null
  );
  const [flyTarget, setFlyTarget] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [addressLabel, setAddressLabel] = useState("");
  const lastCenterOnRef = useRef("");

  useEffect(() => {
    if (latitud && longitud) setPosition({ lat: latitud, lng: longitud });
  }, [latitud, longitud]);

  // Centrar mapa cuando cambia centerOn (sin poner pin)
  useEffect(() => {
    if (!centerOn || centerOn === lastCenterOnRef.current) return;
    lastCenterOnRef.current = centerOn;
    if (position) return; // no mover si ya hay pin
    (async () => {
      const results = await searchAddress(centerOn);
      if (results.length > 0) {
        setFlyTarget({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon), zoom: 13 });
      }
    })();
  }, [centerOn, position]);

  const handleLocationSelect = useCallback(async (pos) => {
    if (disabled) return;
    setPosition(pos);
    setFlyTarget(null);
    setGeocoding(true);
    setAddressLabel("");
    const geo = await reverseGeocode(pos.lat, pos.lng);
    setGeocoding(false);
    if (geo) {
      setAddressLabel(geo.displayName);
      if (onChange) onChange({ lat: pos.lat, lng: pos.lng, departamentoRaw: geo.departamentoRaw, ciudad: geo.ciudad, direccion: geo.direccion });
    } else {
      if (onChange) onChange({ lat: pos.lat, lng: pos.lng });
    }
  }, [disabled, onChange]);

  const handleSearchSelect = useCallback((data) => {
    setPosition({ lat: data.lat, lng: data.lng });
    setFlyTarget(null);
    setAddressLabel(data.displayName || "");
    if (onChange) onChange(data);
  }, [onChange]);

  const flyLat = position?.lat || flyTarget?.lat;
  const flyLng = position?.lng || flyTarget?.lng;
  const flyZoom = position ? 16 : (flyTarget?.zoom || 13);

  return (
    <div className="space-y-2">
      {!disabled && (
        <div className="relative z-40">
          <AddressSearchBar onSelect={handleSearchSelect} disabled={disabled} />
        </div>
      )}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0" style={{ height }}>
        <MapContainer center={position ? [position.lat, position.lng] : DEFAULT_CENTER} zoom={position ? 16 : DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {!disabled && <ClickHandler onLocationSelect={handleLocationSelect} />}
          {position && <Marker position={[position.lat, position.lng]} />}
          {flyLat && flyLng && <FlyToPoint lat={flyLat} lng={flyLng} zoom={flyZoom} />}
        </MapContainer>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400 truncate">
          {geocoding ? "📍 Obteniendo dirección..." : position ? (addressLabel || `📍 ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`) : "Hacé click en el mapa o buscá una dirección"}
        </span>
        {position && !disabled && (
          <button type="button" onClick={() => { setPosition(null); setFlyTarget(null); setAddressLabel(""); if (onChange) onChange({ lat: null, lng: null }); }} className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors shrink-0">
            Quitar pin
          </button>
        )}
      </div>
    </div>
  );
}
