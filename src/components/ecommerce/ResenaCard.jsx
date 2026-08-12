"use client";
import { useState, memo } from "react";
import { Star, Eye, EyeOff, Package, User, XCircle } from "lucide-react";
import Link from "next/link";
import { Button, Text, Badge } from "@/components/ui";

// ─── Estrellas ──────────────────────────────────────────────────

function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          aria-hidden="true"
          className={
            s <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-slate-200 text-slate-200"
          }
        />
      ))}
    </div>
  );
}

// ─── Card ───────────────────────────────────────────────────────

const ResenaCard = memo(function ResenaCard({ resena, onToggleAprobada }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggleAprobada(resena.id, !resena.aprobada);
    } finally {
      setToggling(false);
    }
  };

  const fecha = new Date(resena.created_at).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const inicial = resena.cliente_nombre?.charAt(0)?.toUpperCase() || "?";

  return (
    <article
      className="group relative rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
      aria-label={`Reseña de ${resena.cliente_nombre}`}
    >
      {/* Barra lateral de estado */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          resena.aprobada ? "bg-green-400" : "bg-red-400"
        }`}
        aria-hidden="true"
      />

      <div className="p-5 pl-6">
        {/* Fila superior: meta + acción */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={resena.aprobada ? "success" : "danger"} className="text-[9px] py-0.5 px-2">
              {resena.aprobada ? "Visible" : "Oculta"}
            </Badge>

            {/* Avatar + nombre */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                {inicial}
              </div>
              <Text variant="bodyXsBold" as="span">{resena.cliente_nombre}</Text>
            </div>

            <time className="text-[11px] text-slate-400" dateTime={resena.created_at}>
              {fecha}
            </time>
          </div>

          {/* Botón aprobar/ocultar */}
          <Button
            onClick={handleToggle}
            disabled={toggling}
            variant={resena.aprobada ? "ghost" : "success"}
            size="sm"
            icon={resena.aprobada ? EyeOff : Eye}
            className={resena.aprobada
              ? "text-red-500 hover:text-red-600 hover:bg-red-50 border-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              : "shadow-none"
            }
            aria-label={resena.aprobada ? "Ocultar reseña de la tienda" : "Aprobar y mostrar reseña"}
          >
            {resena.aprobada ? "Ocultar" : "Aprobar"}
          </Button>
        </div>

        {/* Producto vinculado */}
        <Link
          href={`/catalogo/${resena.producto_slug || ""}`}
          className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-colors duration-200"
        >
          <Package size={12} className="text-emerald-500" aria-hidden="true" />
          <Text variant="bodyXs" as="span" className="text-emerald-700 font-semibold">
            {resena.producto_nombre}
          </Text>
        </Link>

        {/* Rating */}
        <div className="mb-3">
          <StarRating rating={resena.rating} />
        </div>

        {/* Contenido de la reseña */}
        <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
          {resena.titulo && (
            <Text variant="bodySmBold" className="text-slate-800 mb-1">
              {resena.titulo}
            </Text>
          )}
          {resena.comentario && (
            <Text variant="bodySm" className="text-slate-600 leading-relaxed">
              {resena.comentario}
            </Text>
          )}
          {!resena.titulo && !resena.comentario && (
            <Text variant="muted" className="italic">Sin comentario</Text>
          )}
        </div>

        {/* Advertencia de oculta */}
        {!resena.aprobada && (
          <div className="mt-3 flex items-center gap-1.5">
            <XCircle size={12} className="text-red-400" aria-hidden="true" />
            <Text variant="mutedXs" className="text-red-500">
              No visible en la tienda
            </Text>
          </div>
        )}
      </div>
    </article>
  );
});

export default ResenaCard;
