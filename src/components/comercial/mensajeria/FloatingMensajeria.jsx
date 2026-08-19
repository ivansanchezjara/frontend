"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getMensajesSinResponder } from "@/services/apis/mensajeria";

/**
 * Floating Action Button de mensajería.
 * Se muestra en todas las páginas del sistema (dentro del layout).
 * Muestra un badge con la cantidad de mensajes sin responder.
 * Al clickear, navega a /ventas-crm/mensajeria.
 */
export default function FloatingMensajeria() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  // Polling cada 30 segundos para actualizar el contador
  useEffect(() => {
    let interval;

    const fetchCount = async () => {
      try {
        const data = await getMensajesSinResponder();
        const nuevoCount = data?.count || 0;

        // Si hay nuevos mensajes, activar animación de pulso
        if (nuevoCount > count && count > 0) {
          setPulse(true);
          setTimeout(() => setPulse(false), 2000);
        }

        setCount(nuevoCount);
      } catch {
        // Silenciar errores (usuario sin permisos, etc.)
      }
    };

    fetchCount();
    interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = () => {
    router.push("/ventas-crm/mensajeria");
  };

  return (
    <button
      onClick={handleClick}
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center justify-center
        w-14 h-14 rounded-full
        bg-emerald-600 hover:bg-emerald-700
        text-white shadow-lg hover:shadow-xl
        transition-all duration-200 hover:scale-105
        ${pulse ? "animate-bounce" : ""}
      `}
      title="Mensajería"
      aria-label={`Mensajería${count > 0 ? ` — ${count} mensajes sin responder` : ""}`}
    >
      <MessageCircle size={24} />

      {/* Badge con contador */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[22px] h-[22px] px-1 text-xs font-bold text-white bg-red-500 rounded-full ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
