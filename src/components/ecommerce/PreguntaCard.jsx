"use client";
import { useState, memo } from "react";
import { Send, CheckCircle2, Clock, Trash2, User, Package } from "lucide-react";
import Link from "next/link";
import { Button, Text, Badge } from "@/components/ui";

const PreguntaCard = memo(function PreguntaCard({ pregunta, onResponder, onDelete }) {
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
      // Error manejado globalmente por useApi/useErrorHandler
    } finally {
      setEnviando(false);
    }
  };

  const fecha = new Date(pregunta.created_at).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const respondida = Boolean(pregunta.respuesta);

  return (
    <article
      className="group relative rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
      aria-label={`Pregunta de ${pregunta.cliente_nombre}`}
    >
      {/* Barra lateral de estado */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          respondida ? "bg-green-400" : "bg-amber-400"
        }`}
        aria-hidden="true"
      />

      <div className="p-5 pl-6">
        {/* Fila superior: meta + acciones */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={respondida ? "success" : "warning"} className="text-[9px] py-0.5 px-2">
              {respondida ? "Respondida" : "Pendiente"}
            </Badge>

            <div className="flex items-center gap-1.5">
              <User size={12} className="text-slate-400" aria-hidden="true" />
              <Text variant="bodyXsBold" as="span">{pregunta.cliente_nombre}</Text>
            </div>

            <time className="text-[11px] text-slate-400" dateTime={pregunta.created_at}>
              {fecha}
            </time>
          </div>

          <Button
            onClick={() => onDelete(pregunta)}
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:text-red-500 hover:bg-red-50 border-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"
            aria-label={`Eliminar pregunta de ${pregunta.cliente_nombre}`}
            icon={Trash2}
          />
        </div>

        {/* Producto vinculado */}
        <Link
          href={`/catalogo/${pregunta.producto_slug || ""}`}
          className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-colors duration-200"
        >
          <Package size={12} className="text-emerald-500" aria-hidden="true" />
          <Text variant="bodyXs" as="span" className="text-emerald-700 font-semibold">
            {pregunta.producto_nombre}
          </Text>
        </Link>

        {/* Texto de la pregunta */}
        <div className="bg-slate-50/70 rounded-xl p-3.5 mb-3 border border-slate-100">
          <Text variant="bodySm" className="text-slate-800 font-medium leading-relaxed">
            "{pregunta.pregunta}"
          </Text>
        </div>

        {/* Respuesta existente */}
        {respondida && (
          <div className="ml-3 pl-4 border-l-2 border-green-300 py-2">
            <Text variant="bodySm" className="text-slate-700 leading-relaxed">
              {pregunta.respuesta}
            </Text>
            {pregunta.respondido_por_nombre && (
              <Text variant="mutedXs" as="span" className="mt-2 inline-block">
                Respondido por {pregunta.respondido_por_nombre}
              </Text>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="mt-4 flex items-center gap-2">
          {!respondida && !showForm && (
            <Button
              onClick={() => setShowForm(true)}
              variant="success"
              size="sm"
              icon={Send}
              className="shadow-none"
            >
              Responder
            </Button>
          )}

          {respondida && !showForm && (
            <Button
              onClick={() => { setRespuesta(pregunta.respuesta); setShowForm(true); }}
              variant="outline"
              size="sm"
              className="text-slate-500"
            >
              Editar respuesta
            </Button>
          )}
        </div>

        {/* Formulario de respuesta */}
        {showForm && (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4" role="form" aria-label="Formulario de respuesta">
            <Text variant="bodyXsBold" as="label" className="text-slate-600 mb-2 block" htmlFor={`respuesta-${pregunta.id}`}>
              {respondida ? "Editar respuesta" : "Tu respuesta"}
            </Text>
            <textarea
              id={`respuesta-${pregunta.id}`}
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              placeholder="Escribí la respuesta para el cliente..."
              aria-label="Respuesta a la pregunta del cliente"
              rows={3}
              maxLength={1000}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-colors placeholder:text-slate-400"
            />
            <div className="flex items-center justify-between mt-3">
              <Text variant="mutedXs" as="span">
                {respuesta.length}/1000
              </Text>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => { setShowForm(false); setRespuesta(""); }}
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 border-0"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEnviar}
                  disabled={!respuesta.trim() || enviando}
                  variant="success"
                  size="sm"
                  icon={Send}
                  aria-label="Enviar respuesta"
                >
                  {enviando ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
});

export default PreguntaCard;
