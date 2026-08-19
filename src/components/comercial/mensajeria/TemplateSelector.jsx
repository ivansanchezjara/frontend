"use client";
import { useState, useEffect } from "react";
import { FileText, Send, X } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { getTemplatesDisponibles, enviarTemplate } from "@/services/apis/mensajeria";

/**
 * Modal/panel para seleccionar y enviar un template de WhatsApp.
 * Se usa cuando el vendedor quiere iniciar una conversación fuera
 * de la ventana de 24h.
 */
export default function TemplateSelector({ cuentaId, onEnviado, onCerrar }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const { data: templatesData, execute: cargarTemplates } = useApi(
    getTemplatesDisponibles,
    { auto: false, handleError: false }
  );

  useEffect(() => {
    cargarTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const templates = templatesData?.templates || [];

  const handleEnviar = async () => {
    if (!seleccionado || !cuentaId) return;
    setEnviando(true);
    try {
      await enviarTemplate({
        cuenta_id: cuentaId,
        template_name: seleccionado.name,
        language_code: "es",
      });
      onEnviado?.();
      onCerrar?.();
    } catch (err) {
      console.error("Error enviando template:", err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="absolute bottom-16 left-0 right-0 mx-4 bg-white border border-gray-200 rounded-lg shadow-xl z-10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-emerald-600" />
          <h4 className="text-sm font-semibold text-gray-800">Enviar Template</h4>
        </div>
        <button
          onClick={onCerrar}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X size={16} />
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Usá un template aprobado para iniciar conversación fuera de la ventana de 24h.
      </p>

      {templates.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">
          No hay templates configurados
        </p>
      ) : (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {templates.map((template) => (
            <button
              key={template.name}
              onClick={() => setSeleccionado(template)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                seleccionado?.name === template.name
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-700"
              }`}
            >
              <p className="font-medium">{template.description || template.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{template.category}</p>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleEnviar}
        disabled={!seleccionado || enviando}
        className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={14} />
        {enviando ? "Enviando..." : "Enviar template"}
      </button>
    </div>
  );
}
