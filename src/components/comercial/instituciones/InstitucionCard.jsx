"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, MapPin, MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";

export function InstitucionCard({ institucion, onDelete }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const cantidadOferta =
    institucion.cantidad_oferta ?? (institucion.oferta_academica || []).length;

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer relative"
      onClick={() => router.push(`/ventas-crm/instituciones/${institucion.id}`)}
    >
      <div className="p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-violet-50">
          <GraduationCap size={20} className="text-violet-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Text variant="bodySmBold" className="truncate">
              {institucion.razon_social}
            </Text>
            {institucion.abreviatura && (
              <Badge variant="default">{institucion.abreviatura}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {(institucion.ciudad || institucion.departamento) && (
              <div className="flex items-center gap-1 text-slate-400">
                <MapPin size={12} />
                <Text variant="mutedXs">
                  {[institucion.ciudad, institucion.departamento]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </div>
            )}
            {cantidadOferta > 0 && (
              <Badge
                variant="default"
                className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]"
              >
                {cantidadOferta} oferta{cantidadOferta === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
        </div>

        {/* Menú de acciones rápidas */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            aria-label="Acciones"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  router.push(`/ventas-crm/instituciones/${institucion.id}`);
                }}
              >
                <Pencil size={14} />
                Editar
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete?.(institucion);
                }}
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
