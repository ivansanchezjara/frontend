"use client";
import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";

import {
  Button, Input, Field, Toggle, PhoneInput, validatePhone, buildPhoneValue, useConfirm,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useKeySave } from "@/hooks/useKeySave";
import { cn } from "@/lib/utils";
import { DEPARTAMENTOS, CIUDADES_POR_DEPARTAMENTO } from "@/config/paraguay";
import { CATEGORIA_OPTIONS_FORM, TRATAMIENTO_OPTIONS } from "@/config/personas";
import { updatePersona, createRegistroProfesional, updateRegistroProfesional } from "@/services/apis/ventas";

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Extrae el prefijo y número local de un teléfono guardado como "+595 981000000".
 */
function parsePhone(telefono) {
  if (!telefono) return { prefix: "+595", number: "" };
  const match = telefono.match(/^(\+\d{1,4})\s+(.*)$/);
  if (match) return { prefix: match[1], number: match[2] };
  return { prefix: "+595", number: telefono };
}

/**
 * Sugiere un tratamiento según la categoría seleccionada.
 * Solo sugiere si el tratamiento actual está vacío.
 */
function sugerirTratamiento(categoria, tratamientoActual) {
  if (tratamientoActual) return tratamientoActual;
  switch (categoria) {
    case "odontologo": return "Dr.";
    case "profesor": return "Prof.";
    default: return "";
  }
}

function formatUpdatedAt(fecha) {
  if (!fecha) return null;
  const d = new Date(fecha);
  const ahora = new Date();
  const diffMs = ahora - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "hace un momento";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `hace ${diffHrs}h`;
  return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Formulario de edición de datos de persona.
 * Incluye: clasificación, estado actual, datos personales, documentos, ubicación, notas.
 */
export function DatosPersonaForm({ persona, onSaved }) {
  const { showToast } = useToast();
  const { alert: showAlert } = useConfirm();

  const phoneParsed = parsePhone(persona.telefono);

  const [form, setForm] = useState({
    // Clasificación
    categoria: persona.categoria || "",
    es_extranjero: persona.es_extranjero || false,
    // Datos personales
    tratamiento: persona.tratamiento || "",
    razon_social: persona.razon_social || "",
    telefonoPrefijo: phoneParsed.prefix,
    telefono: phoneParsed.number,
    correo_electronico: persona.correo_electronico || "",
    // Documentos
    ruc: persona.ruc || "",
    cedula: persona.cedula || "",
    documento_extranjero: persona.documento_extranjero || "",
    registro_numero: persona.registro_profesional?.numero || "",
    // Ubicación
    departamento: persona.departamento || "",
    ciudad: persona.ciudad || "",
    direccion: persona.direccion || "",
    // Notas
    notas: persona.notas || "",
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const ciudades = form.departamento
    ? (CIUDADES_POR_DEPARTAMENTO[form.departamento] || [])
    : [];

  const isProspecto = persona.etapa === "prospecto";

  // ─── Advertencia de consistencia categoría ↔ relaciones ────
  const categoriaWarning = (() => {
    const cat = form.categoria;
    if (!cat || isProspecto) return null;

    const formaciones = persona.formaciones || [];
    const vinculosDocentes = persona.vinculos_docentes || [];
    const registroProfesional = persona.registro_profesional;

    if (cat === "estudiante") {
      const tieneGradoVigente = formaciones.some((f) => f.tipo === "grado" && f.vigente);
      if (!tieneGradoVigente) {
        return "Categoría \"Estudiante\" requiere una formación de grado vigente (dentro del período de la carrera). Agregala en la sección Relaciones.";
      }
    }

    if (cat === "odontologo") {
      if (!registroProfesional) return "Categoría \"Odontólogo\" sin registro profesional. Completá el Nro. de Registro en Documentos.";
    }

    if (cat === "profesor") {
      const tieneDocenteActivo = vinculosDocentes.some((d) => d.activo);
      if (!tieneDocenteActivo) return "Categoría \"Profesor\" sin vínculo docente activo. Agregá un vínculo docente en la sección Relaciones.";
    }

    return null;
  })();

  // ─── Protección de cambios sin guardar ─────────────────────
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // ─── Handlers ──────────────────────────────────────────────
  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleToggle = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleCategoriaChange = (e) => {
    const nuevaCategoria = e.target.value;
    setForm((prev) => ({
      ...prev,
      categoria: nuevaCategoria,
      tratamiento: sugerirTratamiento(nuevaCategoria, prev.tratamiento),
    }));
    setIsDirty(true);
    if (errors.categoria) setErrors((prev) => { const n = { ...prev }; delete n.categoria; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación local
    const newErrors = {};
    if (!form.razon_social.trim()) newErrors.razon_social = "El nombre es obligatorio.";
    if (!form.telefono.trim()) newErrors.telefono = "El teléfono es obligatorio.";

    // Validar formato de teléfono
    if (form.telefono.trim()) {
      const phoneErr = validatePhone(form.telefonoPrefijo, form.telefono);
      if (phoneErr) newErrors.telefono = phoneErr;
    }

    if (form.es_extranjero && !form.documento_extranjero.trim()) {
      newErrors.documento_extranjero = "Obligatorio para extranjeros.";
    }

    // Validación para clientes activos (no prospectos)
    if (!isProspecto) {
      if (!form.ruc.trim() && !form.cedula.trim() && !form.es_extranjero) {
        newErrors.ruc = "RUC o Cédula es obligatorio para clientes activos.";
      }
      if (!form.categoria) {
        newErrors.categoria = "La categoría es obligatoria para clientes activos.";
      }
    }

    // Validación de consistencia categoría ↔ relaciones (bloquea el guardado)
    if (categoriaWarning && !isProspecto) {
      newErrors.categoria = categoriaWarning;
    }

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSaving(true);
    setErrors({});
    try {
      const { telefonoPrefijo, telefono, registro_numero, ...rest } = form;
      const payload = {
        ...rest,
        telefono: buildPhoneValue(telefonoPrefijo, telefono),
      };
      if (payload.es_extranjero) payload.ruc = "";
      const updated = await updatePersona(persona.id, payload);

      // Gestionar registro profesional
      if (registro_numero.trim() && ["odontologo", "protesista", "profesor"].includes(form.categoria)) {
        if (persona.registro_profesional) {
          await updateRegistroProfesional(persona.registro_profesional.id, { numero: registro_numero.trim() });
        } else {
          await createRegistroProfesional({ persona: persona.id, numero: registro_numero.trim() });
        }
      }

      setIsDirty(false);
      showToast("Datos actualizados correctamente", "success");
      if (onSaved) onSaved(updated);
    } catch (err) {
      if (err?.status === 400 && err?.data) {
        const fieldErrors = {};
        for (const [key, val] of Object.entries(err.data)) {
          fieldErrors[key] = Array.isArray(val) ? val.join(" ") : val;
        }
        setErrors(fieldErrors);
      } else {
        showAlert(err?.data?.detail || err?.message || "Error al guardar.", "Error");
      }
    } finally {
      setSaving(false);
    }
  };

  // Ctrl+S para guardar
  useKeySave(() => handleSubmit({ preventDefault: () => {} }), { disabled: saving || !isDirty });

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">

      {/* ─── Datos Personales ──────────────────────────── */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Datos Personales
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3 md:col-span-2 items-start">
            <div className="flex flex-col gap-1.5 w-28 shrink-0">
              <Text as="label" variant="label">Tratamiento</Text>
              <select className={selectClass} value={form.tratamiento} onChange={handleChange("tratamiento")}>
                {TRATAMIENTO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-0">
              <Input
                label="Nombre completo *"
                value={form.razon_social}
                onChange={handleChange("razon_social")}
                placeholder="Nombre y apellido"
                maxLength={200}
                error={errors.razon_social}
              />
            </div>
          </div>
          <PhoneInput
            label="Teléfono *"
            prefix={form.telefonoPrefijo}
            onPrefixChange={(p) => { setForm((prev) => ({ ...prev, telefonoPrefijo: p })); setIsDirty(true); }}
            value={form.telefono}
            onChange={handleChange("telefono")}
            error={errors.telefono}
          />
          <Input
            label="Correo Electrónico"
            type="email"
            value={form.correo_electronico}
            onChange={handleChange("correo_electronico")}
            placeholder="correo@ejemplo.com"
            maxLength={254}
            error={errors.correo_electronico}
          />
        </div>
      </div>

      {/* ─── Clasificación + Estado actual ─────────────── */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Clasificación
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label={isProspecto ? "Categoría" : "Categoría *"}>
            <select
              className={cn(selectClass, errors.categoria && "border-red-300")}
              value={form.categoria}
              onChange={handleCategoriaChange}
            >
              {CATEGORIA_OPTIONS_FORM.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.categoria && (
              <Text variant="bodySm" className="mt-1 text-xs text-red-500">{errors.categoria}</Text>
            )}
          </Field>
          <div className="flex items-end pb-1">
            <Toggle checked={form.es_extranjero} onChange={handleToggle("es_extranjero")} label="Extranjero" />
          </div>
        </div>

        {/* Advertencias de consistencia categoría ↔ relaciones */}
        {categoriaWarning && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
            <Text variant="bodySm" className="text-amber-700 text-xs">{categoriaWarning}</Text>
          </div>
        )}
      </div>

      {/* ─── Documentos ────────────────────────────────── */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Documentos
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!form.es_extranjero && (
            <Input
              label={isProspecto ? "RUC" : "RUC *"}
              value={form.ruc}
              onChange={handleChange("ruc")}
              placeholder="80000000-0"
              maxLength={20}
              error={errors.ruc}
              helperText={!isProspecto && !form.es_extranjero ? "RUC o Cédula obligatorio" : undefined}
            />
          )}
          {!form.es_extranjero ? (
            <Input
              label={isProspecto ? "Cédula de Identidad" : "Cédula de Identidad *"}
              value={form.cedula}
              onChange={handleChange("cedula")}
              placeholder="1.234.567"
              maxLength={20}
              error={errors.cedula}
            />
          ) : (
            <Input
              label="Documento extranjero *"
              value={form.documento_extranjero}
              onChange={handleChange("documento_extranjero")}
              placeholder="Pasaporte, CI extranjera..."
              maxLength={50}
              error={errors.documento_extranjero}
            />
          )}
          {["odontologo", "protesista", "profesor"].includes(form.categoria) && (
            <Input
              label="Nro. Registro Profesional"
              value={form.registro_numero}
              onChange={handleChange("registro_numero")}
              placeholder="Nro. de matrícula o registro"
              maxLength={50}
              error={errors.registro_numero}
            />
          )}
        </div>
        {form.es_extranjero && (
          <div className="mt-2">
            <Text variant="mutedXs" className="text-amber-600">
              Los clientes extranjeros no requieren RUC paraguayo.
            </Text>
          </div>
        )}
      </div>

      {/* ─── Ubicación ─────────────────────────────────── */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Ubicación
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Departamento">
            <select
              className={selectClass}
              value={form.departamento}
              onChange={(e) => { setForm((p) => ({ ...p, departamento: e.target.value, ciudad: "" })); setIsDirty(true); }}
            >
              <option value="">— Seleccionar —</option>
              {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Ciudad">
            <select className={selectClass} value={form.ciudad} onChange={handleChange("ciudad")} disabled={!form.departamento}>
              <option value="">— Seleccionar —</option>
              {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Input
            label="Dirección"
            value={form.direccion}
            onChange={handleChange("direccion")}
            placeholder="Calle, número, barrio"
            maxLength={500}
          />
        </div>
      </div>

      {/* ─── Notas ─────────────────────────────────────── */}
      <div>
        <Field label="Notas internas">
          <textarea
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none placeholder:text-slate-400"
            rows={3}
            value={form.notas}
            onChange={handleChange("notas")}
            placeholder="Notas internas sobre esta persona..."
            maxLength={1000}
          />
        </Field>
      </div>

      {/* ─── Submit ────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex flex-col gap-0.5">
          <Text variant="mutedXs" className={cn("text-xs", isDirty ? "text-amber-600 font-medium" : "text-slate-400")}>
            {isDirty ? "Cambios sin guardar" : "Sin cambios"}
          </Text>
          {persona.updated_at && (
            <Text variant="mutedXs" className="text-slate-300 text-[10px]">
              Última edición: {formatUpdatedAt(persona.updated_at)}
            </Text>
          )}
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={saving || !isDirty}
          icon={saving ? Loader2 : Save}
          className={cn("rounded-xl font-bold text-xs", saving && "[&_svg]:animate-spin")}
        >
          {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
        </Button>
      </div>

      {errors.non_field_errors && (
        <p className="text-sm text-red-600 font-medium">{errors.non_field_errors}</p>
      )}
    </form>
  );
}
