"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default marker icons in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Iconos personalizados
function createIcon(color, pulse = false) {
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      ${pulse ? '<circle cx="16" cy="16" r="14" fill="none" stroke="' + color + '" stroke-width="2" opacity="0.4"><animate attributeName="r" from="10" to="16" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/></circle>' : ''}
      <circle cx="16" cy="16" r="8" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="3" fill="white"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

const iconEnLinea = createIcon("#10b981", true);
const iconOffline = createIcon("#94a3b8", false);
const iconSeleccionado = createIcon("#3b82f6", true);

// Sub-componente para centrar el mapa cuando se selecciona un técnico
function FlyToSelected({ selectedTecnico }) {
  const map = useMap();
  useEffect(() => {
    if (selectedTecnico) {
      map.flyTo(
        [Number(selectedTecnico.latitud), Number(selectedTecnico.longitud)],
        15,
        { duration: 0.8 }
      );
    }
  }, [selectedTecnico, map]);
  return null;
}

function formatTimestamp(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("es-PY", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function MapaRastreo({ tecnicos, selectedTecnico, onSelectTecnico }) {
  // Centro default: Asunción, Paraguay
  const defaultCenter = [-25.2637, -57.5759];
  const defaultZoom = 12;

  // Calcular centro basado en técnicos disponibles
  const center = tecnicos.length > 0
    ? [
        tecnicos.reduce((sum, t) => sum + Number(t.latitud), 0) / tecnicos.length,
        tecnicos.reduce((sum, t) => sum + Number(t.longitud), 0) / tecnicos.length,
      ]
    : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={defaultZoom}
      className="w-full h-full z-0"
      style={{ minHeight: "400px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected selectedTecnico={selectedTecnico} />

      {tecnicos.map((t) => {
        const isSelected = selectedTecnico?.tecnico_id === t.tecnico_id;
        const icon = isSelected
          ? iconSeleccionado
          : t.en_linea
            ? iconEnLinea
            : iconOffline;

        return (
          <Marker
            key={t.tecnico_id}
            position={[Number(t.latitud), Number(t.longitud)]}
            icon={icon}
            eventHandlers={{
              click: () => onSelectTecnico(t),
            }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-bold text-sm text-slate-800 mb-1">
                  {t.tecnico_nombre}
                </p>
                <p className="text-xs text-slate-500 mb-0.5">
                  {t.tecnico_tipo} · {t.en_linea ? "🟢 En línea" : "⚫ Offline"}
                </p>
                <p className="text-xs text-slate-400">
                  Última señal: {formatTimestamp(t.timestamp)}
                </p>
                {t.velocidad != null && t.velocidad > 0 && (
                  <p className="text-xs text-slate-400">
                    Velocidad: {Math.round(t.velocidad)} km/h
                  </p>
                )}
                {t.bateria != null && (
                  <p className="text-xs text-slate-400">
                    Batería: {t.bateria}%
                  </p>
                )}
                {t.orden_activa_numero && (
                  <p className="text-xs text-blue-600 font-semibold mt-1">
                    OT-{t.orden_activa_numero}: {t.orden_activa_cliente}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
