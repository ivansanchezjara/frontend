"use client";
import CanalIcon from "./CanalIcon";

export default function BurbujaMensaje({ mensaje }) {
  const esSaliente = mensaje.direccion === "saliente";
  const fecha = formatearHora(mensaje.fecha);

  return (
    <div className={`flex ${esSaliente ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
          esSaliente
            ? "bg-emerald-600 text-white rounded-br-md"
            : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
        }`}
      >
        {/* Vendedor que envió (solo en salientes) */}
        {esSaliente && mensaje.vendedor_nombre && (
          <p className="text-xs text-emerald-100 mb-0.5 font-medium">
            {mensaje.vendedor_nombre}
          </p>
        )}

        {/* Contenido del mensaje */}
        <p className="text-sm whitespace-pre-wrap break-words">
          {mensaje.resumen}
        </p>

        {/* Footer: hora + canal */}
        <div
          className={`flex items-center gap-1.5 mt-1 ${
            esSaliente ? "justify-end" : "justify-start"
          }`}
        >
          <CanalIcon canal={mensaje.tipo} size={11} />
          <span
            className={`text-xs ${
              esSaliente ? "text-emerald-100" : "text-gray-400"
            }`}
          >
            {fecha}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatearHora(fechaStr) {
  if (!fechaStr) return "";
  const fecha = new Date(fechaStr);
  const ahora = new Date();
  const esHoy = fecha.toDateString() === ahora.toDateString();

  if (esHoy) {
    return fecha.toLocaleTimeString("es-PY", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Si es de otro día, mostrar fecha + hora
  return fecha.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
