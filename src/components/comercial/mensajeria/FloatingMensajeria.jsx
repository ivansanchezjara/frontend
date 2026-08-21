"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getMensajesSinResponder } from "@/services/apis/mensajeria";

/**
 * Floating Action Button de mensajería con efecto blur y draggable.
 * Se muestra en todas las páginas del sistema (dentro del layout).
 * Muestra un badge con la cantidad de mensajes sin responder.
 * Al clickear, navega a /ventas-crm/mensajeria.
 * Se puede arrastrar a cualquier posición de la página.
 */
export default function FloatingMensajeria() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  // Estado de posición y drag
  const [position, setPosition] = useState({ bottom: 24, right: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, bottom: 0, right: 0 });
  const hasDraggedRef = useRef(false);

  // Polling cada 30 segundos para actualizar el contador
  useEffect(() => {
    let interval;

    const fetchCount = async () => {
      try {
        const data = await getMensajesSinResponder();
        const nuevoCount = data?.count || 0;

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

  // Handlers de drag
  const handlePointerDown = useCallback((e) => {
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      bottom: position.bottom,
      right: position.right,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;

    const deltaX = dragStartRef.current.x - e.clientX;
    const deltaY = dragStartRef.current.y - e.clientY;

    // Si se movió más de 5px, considerar como drag (no click)
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasDraggedRef.current = true;
    }

    const newRight = Math.max(8, Math.min(
      window.innerWidth - 64,
      dragStartRef.current.right + deltaX
    ));
    const newBottom = Math.max(8, Math.min(
      window.innerHeight - 64,
      dragStartRef.current.bottom + deltaY
    ));

    setPosition({ bottom: newBottom, right: newRight });
  }, [isDragging]);

  const handlePointerUp = useCallback((e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const handleClick = () => {
    // Solo navegar si no fue un drag
    if (!hasDraggedRef.current) {
      router.push("/ventas-crm/mensajeria");
    }
  };

  return (
    <button
      ref={dragRef}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: "fixed",
        bottom: `${position.bottom}px`,
        right: `${position.right}px`,
      }}
      className={`
        z-50 flex items-center justify-center
        w-14 h-14 rounded-full
        bg-emerald-600/80 backdrop-blur-md
        hover:bg-emerald-700/85
        text-white shadow-lg hover:shadow-xl
        transition-colors duration-200
        ${isDragging ? "cursor-grabbing scale-110" : "cursor-grab hover:scale-105"}
        ${pulse ? "animate-bounce" : ""}
        touch-none select-none
      `}
      title="Mensajería — Arrastrar para mover"
      aria-label={`Mensajería${count > 0 ? ` — ${count} mensajes sin responder` : ""}`}
    >
      <MessageCircle size={24} />

      {/* Badge con contador */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[22px] h-[22px] px-1 text-xs font-bold text-white bg-red-500 rounded-full ring-2 ring-white/80">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
