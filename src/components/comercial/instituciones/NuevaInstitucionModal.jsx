"use client";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

import { Button, Input, Field } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { DEPARTAMENTOS, CIUDADES_POR_DEPARTAMENTO } from "@/config/paraguay";
import { createInstitucion } from "@/services/apis/ventas";

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

export function NuevaInstitucionModal({ onClose, onSaved }) {
  const { showToast } = useToast();
  const dialogRef = useRef(null);
  const firstInputRef = useRef(null);

  const [form, setForm] = useState({
    razon_social: "",
    abreviatura: "",
    departamento: "",
    ciudad: "",
    telefono: "",
  });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const ciudades = form.departamento
    ? CIUDADES_POR_DEPARTAMENTO[form.departamento] || []
    : [];

  // Focus trap y accesibilidad
  useEffect(() => {
    firstInputRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const validate = () => {
    const errors = {};
    if (!form.razon_social.trim()) {
      errors.razon_social = "El nombre es obligatorio";
    }
    if (form.telefono && !/^[\d\s\-+().]{6,30}$/.test(form.telefono)) {
      errors.telefono = "Formato de teléfono inválido";
    }
    return errors;
  };

  const handleSave = async () => {
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast("Corregí los errores antes de guardar", "error");
      return;
    }
    setSaving(true);
    try {
      await createInstitucion(form);
      showToast("Institución creada", "success");
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.data?.detail || "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-nueva-inst"
      ref={dialogRef}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <Text
            variant="bodySmBold"
            className="text-lg"
            id="modal-title-nueva-inst"
          >
            Nueva Institución
          </Text>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Input
            ref={firstInputRef}
            label="Nombre *"
            value={form.razon_social}
            onChange={(e) =>
              setForm((p) => ({ ...p, razon_social: e.target.value }))
            }
            placeholder="Universidad Nacional de Asunción — Sede San Lorenzo"
            error={fieldErrors.razon_social}
          />
          <Input
            label="Abreviatura"
            value={form.abreviatura}
            onChange={(e) =>
              setForm((p) => ({ ...p, abreviatura: e.target.value }))
            }
            placeholder="UNA"
            maxLength={20}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Departamento">
              <select
                className={selectClass}
                value={form.departamento}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    departamento: e.target.value,
                    ciudad: "",
                  }))
                }
              >
                <option value="">— Seleccionar —</option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ciudad">
              <select
                className={selectClass}
                value={form.ciudad}
                onChange={(e) =>
                  setForm((p) => ({ ...p, ciudad: e.target.value }))
                }
                disabled={!form.departamento}
              >
                <option value="">— Seleccionar —</option>
                {ciudades.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Input
            label="Teléfono"
            value={form.telefono}
            onChange={(e) =>
              setForm((p) => ({ ...p, telefono: e.target.value }))
            }
            placeholder="021 123456"
            error={fieldErrors.telefono}
          />
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Crear"}
          </Button>
        </div>
      </div>
    </div>
  );
}
