"use client";
import { Search, MessageCircle, AlertCircle } from "lucide-react";
import CanalIcon from "./CanalIcon";

const CANALES = [
  { value: "", label: "Todos" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "messenger", label: "Messenger" },
];

export default function ListaConversaciones({
  conversaciones,
  contactoActivo,
  onSeleccionar,
  filtroCanal,
  onFiltroCanal,
  busqueda,
  onBusqueda,
  loading,
  error,
}) {
  return (
    <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50 shrink-0">
      {/* Encabezado con búsqueda */}
      <div className="p-3 border-b border-gray-200 space-y-2">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversación..."
            value={busqueda}
            onChange={(e) => onBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Filtros de canal */}
        <div className="flex gap-1">
          {CANALES.map((canal) => (
            <button
              key={canal.value}
              onClick={() => onFiltroCanal(canal.value)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                filtroCanal === canal.value
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {canal.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400 p-4">
            <AlertCircle className="h-10 w-10 mb-2" />
            <p className="text-sm text-center">Error al cargar conversaciones</p>
          </div>
        ) : conversaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <MessageCircle className="h-10 w-10 mb-2" />
            <p className="text-sm text-center">
              {busqueda ? "Sin resultados" : "No hay conversaciones"}
            </p>
          </div>
        ) : (
          conversaciones.map((conv) => (
            <ConversacionItem
              key={conv.id}
              conversacion={conv}
              activo={contactoActivo?.id === conv.id}
              onClick={() => onSeleccionar(conv)}
            />
          ))
        )}
      </div>

      {/* Indicador de carga sutil */}
      {loading && conversaciones.length > 0 && (
        <div className="h-0.5 bg-emerald-100">
          <div className="h-full bg-emerald-500 animate-pulse w-full" />
        </div>
      )}
    </div>
  );
}

function ConversacionItem({ conversacion, activo, onClick }) {
  const fechaFormateada = formatearFechaRelativa(conversacion.ultima_fecha);
  const sinResponder = conversacion.direccion === "entrante";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b border-gray-100 transition-colors hover:bg-white ${
        activo ? "bg-white border-l-2 border-l-emerald-500" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar con inicial */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-emerald-700">
              {conversacion.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Punto verde si hay mensaje entrante sin responder */}
          {sinResponder && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-gray-50" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm truncate ${sinResponder ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
              {conversacion.nombre}
            </p>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
              {fechaFormateada}
            </span>
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <CanalIcon canal={conversacion.ultimo_tipo} size={12} />
            <p className={`text-xs truncate ${sinResponder ? "text-gray-700 font-medium" : "text-gray-500"}`}>
              {conversacion.ultimo_mensaje}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function formatearFechaRelativa(fechaStr) {
  if (!fechaStr) return "";
  const fecha = new Date(fechaStr);
  const ahora = new Date();
  const diffMs = ahora - fecha;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMs / 3600000);
  const diffDias = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHoras < 24) return `${diffHoras}h`;
  if (diffDias < 7) return `${diffDias}d`;

  return fecha.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit" });
}
