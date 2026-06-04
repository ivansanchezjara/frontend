"use client";
import { useState } from "react";
import { Phone, Mail, MessageSquare, MapPin, Loader2 } from "lucide-react";
import { Section, Button, Input, Field, Text } from "@/components/ui";
import { useToast } from "@/components/ui";
import { createInteraccion } from "@/services/apis/ventas";

const TIPO_INTERACCION_OPTIONS = [
  { value: "llamada", label: "Llamada" },
  { value: "visita", label: "Visita" },
  { value: "correo", label: "Correo" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "nota", label: "Nota" },
];

const TIPO_ICON_MAP = {
  llamada: <Phone className="h-3.5 w-3.5 text-blue-600" />,
  visita: <MapPin className="h-3.5 w-3.5 text-emerald-600" />,
  correo: <Mail className="h-3.5 w-3.5 text-purple-600" />,
  whatsapp: <MessageSquare className="h-3.5 w-3.5 text-green-600" />,
  nota: <MessageSquare className="h-3.5 w-3.5 text-slate-500" />,
};

/**
 * Sección de interacciones con formulario rápido y timeline.
 */
export default function InteraccionesSection({ oportunidadId, interacciones = [], cerrada, onCreated }) {
  const { showToast } = useToast();
  const [nuevaInteraccion, setNuevaInteraccion] = useState({
    tipo: "whatsapp",
    resumen: "",
  });
  const [saving, setSaving] = useState(false);

  const handleCrear = async () => {
    if (!nuevaInteraccion.resumen.trim()) return;
    setSaving(true);
    try {
      await createInteraccion({
        tipo: nuevaInteraccion.tipo,
        fecha: new Date().toISOString(),
        resumen: nuevaInteraccion.resumen,
        oportunidad: parseInt(oportunidadId, 10),
      });
      showToast("Interacción registrada", "success");
      setNuevaInteraccion({ tipo: "whatsapp", resumen: "" });
      onCreated?.();
    } catch {
      showToast("Error al registrar interacción", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Interacciones">
      <div className="p-6 space-y-4">
        {/* Formulario rápido */}
        {!cerrada && (
          <div className="flex gap-3 items-end">
            <div className="w-32">
              <Field label="Tipo">
                <select
                  value={nuevaInteraccion.tipo}
                  onChange={(e) =>
                    setNuevaInteraccion((prev) => ({ ...prev, tipo: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-slate-700"
                >
                  {TIPO_INTERACCION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex-1">
              <Input
                label="Resumen"
                value={nuevaInteraccion.resumen}
                onChange={(e) =>
                  setNuevaInteraccion((prev) => ({ ...prev, resumen: e.target.value }))
                }
                placeholder="Ej: Le envié catálogo por WhatsApp"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCrear();
                }}
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCrear}
              disabled={saving || !nuevaInteraccion.resumen.trim()}
              icon={saving ? Loader2 : null}
              className={saving ? "[&_svg]:animate-spin" : ""}
            >
              {saving ? "..." : "Agregar"}
            </Button>
          </div>
        )}

        {/* Lista */}
        {interacciones.length === 0 ? (
          <Text variant="muted" className="text-center py-4">
            Sin interacciones registradas aún.
          </Text>
        ) : (
          <div className="divide-y divide-slate-100">
            {interacciones.map((inter) => (
              <div key={inter.id} className="py-3 flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  {TIPO_ICON_MAP[inter.tipo] || TIPO_ICON_MAP.nota}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{inter.resumen}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {inter.tipo_display} ·{" "}
                    {new Date(inter.fecha).toLocaleDateString("es-PY", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {inter.vendedor_nombre && ` · ${inter.vendedor_nombre}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
