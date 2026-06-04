"use client";
import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { Section, Button, Input, Field, Text } from "@/components/ui";
import { useToast } from "@/components/ui";
import { updateOportunidad } from "@/services/apis/ventas";

/**
 * Sección de detalle de la oportunidad con modo edición inline.
 */
export default function DetalleSection({ oportunidad, cerrada, onUpdated }) {
  const { showToast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    monto_estimado: "",
    fecha_cierre_estimada: "",
  });

  useEffect(() => {
    if (oportunidad) {
      setFormData({
        titulo: oportunidad.titulo || "",
        descripcion: oportunidad.descripcion || "",
        monto_estimado: oportunidad.monto_estimado || "",
        fecha_cierre_estimada: oportunidad.fecha_cierre_estimada || "",
      });
    }
  }, [oportunidad]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        ...(formData.monto_estimado && {
          monto_estimado: parseInt(formData.monto_estimado, 10),
        }),
        ...(formData.fecha_cierre_estimada && {
          fecha_cierre_estimada: formData.fecha_cierre_estimada,
        }),
      };
      await updateOportunidad(oportunidad.id, payload);
      showToast("Oportunidad actualizada", "success");
      setEditMode(false);
      onUpdated?.();
    } catch {
      showToast("Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      title="Detalle"
      action={
        !cerrada && !editMode ? (
          <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
            Editar
          </Button>
        ) : null
      }
    >
      <div className="p-6 space-y-4">
        {editMode && !cerrada ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Título"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, titulo: e.target.value }))
                }
              />
            </div>
            <Input
              label="Monto estimado (₲)"
              type="number"
              value={formData.monto_estimado}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, monto_estimado: e.target.value }))
              }
            />
            <Input
              label="Cierre estimado"
              type="date"
              value={formData.fecha_cierre_estimada}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fecha_cierre_estimada: e.target.value }))
              }
            />
            <div className="md:col-span-2">
              <Field label="Descripción">
                <textarea
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-700 resize-none"
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
                  }
                />
              </Field>
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                icon={saving ? Loader2 : Save}
                className={saving ? "[&_svg]:animate-spin" : ""}
              >
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text variant="label" as="p">Monto estimado</Text>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {oportunidad.monto_estimado
                    ? `${Number(oportunidad.monto_estimado).toLocaleString("es-PY")} ₲`
                    : "—"}
                </p>
              </div>
              <div>
                <Text variant="label" as="p">Cierre estimado</Text>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {oportunidad.fecha_cierre_estimada
                    ? new Date(oportunidad.fecha_cierre_estimada).toLocaleDateString("es-PY")
                    : "—"}
                </p>
              </div>
              <div>
                <Text variant="label" as="p">Vendedor</Text>
                <p className="text-sm text-slate-700 mt-0.5">
                  {oportunidad.vendedor_nombre}
                </p>
              </div>
              <div>
                <Text variant="label" as="p">Creada</Text>
                <p className="text-sm text-slate-700 mt-0.5">
                  {new Date(oportunidad.created_at).toLocaleDateString("es-PY")}
                </p>
              </div>
            </div>
            {oportunidad.descripcion && (
              <div className="pt-3 border-t border-slate-100">
                <Text variant="label" as="p" className="mb-1">Descripción</Text>
                <p className="text-sm text-slate-600 whitespace-pre-line">
                  {oportunidad.descripcion}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}
