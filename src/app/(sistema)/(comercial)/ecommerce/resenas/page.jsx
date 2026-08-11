"use client";
import { useState, useCallback } from "react";
import {
  Star, Eye, EyeOff, Search, ChevronLeft,
  CheckCircle2, XCircle,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { getResenasAdmin, moderarResena } from "@/services/apis/ecommerce";
import { PageHeader, EmptyState, LoadingScreen } from "@/components/ui";

// ─── Estrellas ──────────────────────────────────────────────────

function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
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

// ─── Tarjeta de reseña ──────────────────────────────────────────

function ResenaCard({ resena, onToggleAprobada }) {
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

  return (
    <div className={`p-5 rounded-2xl border bg-white transition-colors ${
      resena.aprobada ? "border-slate-200" : "border-red-200 bg-red-50/30"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
            {resena.cliente_nombre?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">{resena.cliente_nombre}</p>
            <p className="text-[10px] text-slate-400">{fecha}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StarRating rating={resena.rating} />
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
              resena.aprobada
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-green-50 text-green-600 hover:bg-green-100"
            } disabled:opacity-50`}
            title={resena.aprobada ? "Ocultar reseña" : "Aprobar reseña"}
          >
            {resena.aprobada ? (
              <>
                <EyeOff size={12} />
                Ocultar
              </>
            ) : (
              <>
                <Eye size={12} />
                Aprobar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Producto */}
      <p className="text-[10px] text-emerald-600 font-medium mb-2">
        {resena.producto_nombre}
      </p>

      {/* Contenido */}
      {resena.titulo && (
        <p className="text-sm font-bold text-slate-800 mb-1">{resena.titulo}</p>
      )}
      {resena.comentario && (
        <p className="text-sm text-slate-600 leading-relaxed">{resena.comentario}</p>
      )}

      {/* Estado */}
      {!resena.aprobada && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-red-500 font-medium">
          <XCircle size={12} />
          Oculta — no visible en la tienda
        </div>
      )}
    </div>
  );
}

// ─── Página principal ───────────────────────────────────────────

export default function ResenasEcommercePage() {
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const { data, loading, refetch } = useApi(
    () => getResenasAdmin({ estado: filtroEstado || undefined, buscar: busqueda || undefined }),
    [filtroEstado, busqueda]
  );

  const handleToggleAprobada = useCallback(async (id, aprobada) => {
    await moderarResena(id, { aprobada });
    refetch();
  }, [refetch]);

  const resenas = data?.results || data || [];

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        title="Reseñas de la Tienda"
        subtitle="Moderar evaluaciones de clientes"
        subtitleClassName="text-emerald-600"
        backHref="/ecommerce"
        backIcon={ChevronLeft}
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
              {[
                { id: "", label: "Todas", icon: Star },
                { id: "aprobadas", label: "Aprobadas", icon: CheckCircle2 },
                { id: "pendientes", label: "Ocultas", icon: EyeOff },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = filtroEstado === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFiltroEstado(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por producto o contenido..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
              />
            </div>
          </div>

          {/* Contenido */}
          {loading ? (
            <LoadingScreen texto="Cargando reseñas..." />
          ) : resenas.length === 0 ? (
            <EmptyState
              icon={<Star size={32} strokeWidth={1.5} />}
              titulo="Sin reseñas"
              descripcion="Las evaluaciones de clientes aparecerán aquí."
            />
          ) : (
            <div className="space-y-4">
              {resenas.map((r) => (
                <ResenaCard
                  key={r.id}
                  resena={r}
                  onToggleAprobada={handleToggleAprobada}
                />
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
