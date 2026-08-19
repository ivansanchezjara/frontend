"use client";
import { useState, useEffect, useRef } from "react";
import { Send, FileText, MoreVertical, User, ExternalLink } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { getMensajesContacto, enviarMensaje } from "@/services/apis/mensajeria";
import { CanalBadge } from "./CanalIcon";
import BurbujaMensaje from "./BurbujaMensaje";
import TemplateSelector from "./TemplateSelector";

export default function PanelChat({ contacto, onMensajeEnviado }) {
  const [texto, setTexto] = useState("");
  const [canalEnvio, setCanalEnvio] = useState("whatsapp");
  const [enviando, setEnviando] = useState(false);
  const [mostrarTemplates, setMostrarTemplates] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Cargar mensajes del contacto
  const {
    data: mensajesData,
    loading: cargandoMensajes,
    execute: cargarMensajes,
  } = useApi(getMensajesContacto, { auto: false });

  useEffect(() => {
    if (contacto?.cliente_id) {
      cargarMensajes(contacto.cliente_id, { tipo: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacto?.cliente_id]);

  // Polling: refrescar mensajes cada 10s mientras el chat está abierto
  useEffect(() => {
    if (!contacto?.cliente_id) return;
    const interval = setInterval(() => {
      cargarMensajes(contacto.cliente_id, { tipo: "" });
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacto?.cliente_id]);

  // Scroll al final cuando llegan mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajesData]);

  // Focus en el input al seleccionar conversación
  useEffect(() => {
    inputRef.current?.focus();
  }, [contacto?.id]);

  const mensajes = (mensajesData?.results || []).filter((m) =>
    ["whatsapp", "instagram", "messenger"].includes(m.tipo)
  );

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim() || enviando) return;

    setEnviando(true);
    try {
      await enviarMensaje({
        cuenta_id: contacto.cliente_id,
        canal: canalEnvio,
        texto: texto.trim(),
      });
      setTexto("");
      // Recargar mensajes
      cargarMensajes(contacto.cliente_id, { tipo: "" });
      onMensajeEnviado?.();
    } catch (err) {
      // El error ya se maneja por el handler global de useApi
      console.error("Error enviando mensaje:", err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header del chat */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-emerald-700">
              {contacto.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {contacto.nombre}
            </h3>
            <CanalBadge canal={contacto.ultimo_tipo || "whatsapp"} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {contacto.cliente_id && (
            <a
              href={`/ventas-crm/contactos/${contacto.cliente_id}`}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Ver ficha del contacto"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {cargandoMensajes ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <User className="h-12 w-12 mb-2" />
            <p className="text-sm">No hay mensajes con este contacto</p>
            <p className="text-xs mt-1">Enviá el primer mensaje para iniciar la conversación</p>
          </div>
        ) : (
          <>
            {mensajes.map((msg) => (
              <BurbujaMensaje key={msg.id} mensaje={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input de mensaje */}
      <div className="relative">
        {/* Template selector overlay */}
        {mostrarTemplates && contacto.cliente_id && (
          <TemplateSelector
            cuentaId={contacto.cliente_id}
            onEnviado={() => {
              cargarMensajes(contacto.cliente_id, { tipo: "" });
              onMensajeEnviado?.();
            }}
            onCerrar={() => setMostrarTemplates(false)}
          />
        )}

        <form
          onSubmit={handleEnviar}
          className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white"
        >
          {/* Selector de canal */}
          <select
            value={canalEnvio}
            onChange={(e) => setCanalEnvio(e.target.value)}
            className="text-xs border border-gray-200 rounded-md px-2 py-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="messenger">Messenger</option>
          </select>

          {/* Botón de templates */}
          <button
            type="button"
            onClick={() => setMostrarTemplates(!mostrarTemplates)}
            className={`p-2 rounded-lg transition-colors ${
              mostrarTemplates
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            title="Enviar template de WhatsApp"
          >
            <FileText size={18} />
          </button>

          {/* Input de texto */}
          <input
            ref={inputRef}
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí un mensaje..."
            className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={enviando}
          />

          {/* Botón enviar */}
          <button
            type="submit"
            disabled={!texto.trim() || enviando}
            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
