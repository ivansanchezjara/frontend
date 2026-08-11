"use client";
import { useState, useCallback } from "react";
import {
  MessageSquare, Send, CheckCircle2, Clock, Filter, Search,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { getPreguntasAdmin, responderPregunta } from "@/services/apis/ecommerce";
import { PageHeader, Section, EmptyState, LoadingScreen } from "@/components/ui";

// ─── Tarjeta de pregunta ────────────────────────────────────────

function PreguntaCard({ pregunta, onResponder }) {
  const [respuesta, setRespuesta] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleEnviar = async () => {
    if (!respuesta.trim()) return;
    setEnviando(true);
    try {
      await onResponder(pregunta.id, respuesta.trim());
      setShowForm(false);
      setRespuesta("");
    } catch {
      // Error manejado por el parent
    } finally {
      setEnviando(false);
    }
  };

  const fecha = new Date(pregunta.created_at).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          {pregunta.respuesta ? (
            <CheckCircle2 size={16} className="text-green-500 shrink-0" />
          ) : (
            <Clock size={16} className="text-amber-500 shrink-0" />
          )}
          <span className="text-xs font-bold text-slate-500">
            {pregunta.cliente_nombre}
          </span>
          <span className="text-xs text-slate-400">· {fecha}</span>
        </div>
        <Link
          href={`/catalogo/${pregunta.producto_slug || ""}`}
          className="text-[10px] font-medium text-emerald-600 hover:underline shrink-0"
        >
          {pregunta.producto_nombre}
        </Link>
      </div>

      {/* Pregunta */}
      <p className="text-sm text-slate-800 font-medium mb-3">{pregunta.pregunta}</p>

      {/* Respuesta existente */}
      {pregunta.respuesta && (
        <div className="ml-4 pl-4 border-l-2 border-green-200 bg-green-50/50 rounded-r-xl p-3">
          <p className="text-sm text-slate-700">{pregunta.respuesta}</p>
          {pregunta.respondido_por_nombre && (
            <p className="text-[10px] text-slate-400 mt-1">
              — {pregunta.respondido_por_nombre}
            </p>
          )}
        </div>
      )}

      {/* Formulario de respuesta */}
      {!pregunta.respuesta && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          Responder →
        </button>
      )}

      {showForm && (
        <div className="mt-3 flex gap-2">
          <textarea
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            placeholder="Escribí la respuesta..."
            rows={2}
            maxLength={1000}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
          />
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleEnviar}
              disabled={!respuesta.trim() || enviando}
              className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={14} />
            </button>
            <button
              onClick={() => { setShowForm(false); setRespuesta(""); }}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ───────────────────────────────────────────

export default function PreguntasEcommercePage() {
  const [filtroEstado, setFiltroEstado] = useState("pendientes");
  const [busqueda, setBusqueda] = useState("");

  const { data, loading, refetch } = useApi(
    () => getPreguntasAdmin({ estado: filtroEstado, buscar: busqueda || undefined }),
    [filtroEstado, busqueda]
  );

  const handleResponder = useCallback(async (id, respuesta) => {
    await responderPregunta(id, respuesta);
    refetch();
  }, [refetch]);

  const preguntas = data?.results || data || [];

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        title="Preguntas de la Tienda"
        subtitle="Responder consultas de clientes"
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
                { id: "pendientes", label: "Pendientes", icon: Clock },
                { id: "respondidas", label: "Respondidas", icon: CheckCircle2 },
                { id: "", label: "Todas", icon: MessageSquare },
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
                placeholder="Buscar por producto o cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
              />
            </div>
          </div>

          {/* Contenido */}
          {loading ? (
            <LoadingScreen texto="Cargando preguntas..." />
          ) : preguntas.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={32} strokeWidth={1.5} />}
              titulo={filtroEstado === "pendientes" ? "Sin preguntas pendientes" : "Sin preguntas"}
              descripcion={
                filtroEstado === "pendientes"
                  ? "¡Estás al día! No hay preguntas esperando respuesta."
                  : "Las preguntas de clientes aparecerán aquí."
              }
            />
          ) : (
            <div className="space-y-4">
              {preguntas.map((p) => (
                <PreguntaCard
                  key={p.id}
                  pregunta={p}
                  onResponder={handleResponder}
                />
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
