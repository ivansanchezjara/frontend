"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Heading } from "../basics/Typography";

/**
 * Modal atómico reutilizable.
 * Proporciona overlay, animación, header con título y botón de cierre.
 *
 * Props:
 * - open: boolean — controla visibilidad
 * - onClose: () => void — callback al cerrar (overlay click o botón X)
 * - title: string — título del modal
 * - size: "sm" | "md" | "lg" | "xl" — ancho máximo (default: "md")
 * - children: contenido del modal
 * - className: clases adicionales para el contenedor
 */
export default function Modal({
  open,
  onClose,
  title,
  size = "md",
  children,
  className,
}) {
  const overlayRef = useRef(null);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden",
          "animate-in fade-in zoom-in-95 duration-200",
          sizeClasses[size] || sizeClasses.md,
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
            <Heading level={5} className="text-slate-800">
              {title}
            </Heading>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
