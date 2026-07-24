"use client";
import { useState } from "react";
import { X } from "lucide-react";

import { Button, Input, Field } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";
import { createOfertaAcademica, updateOfertaAcademica } from "@/services/apis/ventas";
import { TIPO_OFERTA, selectClass } from "./constants";

export function OfertaForm({ oferta, institucionId, onSaved, onCancel }) {
  const { showToast } = useToast();
  const isEdit = !!oferta;
  const [form, setForm] = useState({
    nombre: oferta?.nombre || "",
    tipo: oferta?.tipo || "grado",
    duracion_anios: oferta?.duracion_anios ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      showToast("El nombre es obligatorio", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre,
        tipo: form.tipo,
        duracion_anios: form.duracion_anios !== "" ? parseInt(form.duracion_anios) : null,
      };
      if (isEdit) {
        await updateOfertaAcademica(oferta.id, payload);
        showToast("Actualizada", "success");
      } else {
        await createOfertaAcademica({ ...payload, institucion: institucionId });
        showToast("Creada", "success");
      }
      onSaved();
    } catch (err) {
      showToast(err?.data?.detail || "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "border rounded-xl p-4 space-y-3",
        isEdit ? "bg-slate-50 border-slate-200" : "bg-emerald-50/50 border-emerald-200"
      )}
    >
      <div className="flex items-center justify-between">
        <Text
          variant="bodySmBold"
          className={isEdit ? "text-slate-700 text-sm" : "text-emerald-700"}
        >
          {isEdit ? "Editar Oferta" : "Nueva Oferta Académica"}
        </Text>
        <button
          onClick={onCancel}
          aria-label="Cerrar formulario"
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={14} />
        </button>
      </div>
      <Input
        label="Nombre *"
        value={form.nombre}
        onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
        placeholder="Odontología, Maestría en Ortodoncia..."
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo">
          <select
            className={selectClass}
            value={form.tipo}
            onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
          >
            {TIPO_OFERTA.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Input
          label="Duración (años)"
          type="number"
          value={form.duracion_anios}
          onChange={(e) => setForm((p) => ({ ...p, duracion_anios: e.target.value }))}
          placeholder="5"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : isEdit ? "Guardar" : "Crear"}
        </Button>
      </div>
    </div>
  );
}
