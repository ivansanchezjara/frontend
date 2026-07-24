"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Input, Button, Field, Toggle, PhoneInput, validatePhone, buildPhoneValue } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";
import { DEPARTAMENTOS, CIUDADES_POR_DEPARTAMENTO } from "@/config/paraguay";

import { CATEGORIA_OPTIONS_FORM, TRATAMIENTO_OPTIONS } from "@/config/personas";

// ─── Constantes ─────────────────────────────────────────────────

const CATEGORIA_OPTIONS = CATEGORIA_OPTIONS_FORM;

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

// ─── Componente ─────────────────────────────────────────────────

/**
 * Formulario de creación/edición de Persona.
 * Adaptado al modelo Persona: solo campos relevantes.
 *
 * Flujo:
 * - Siempre visible: etapa, nombre, teléfono, correo
 * - Expandible: categoría, tratamiento, documentos, ubicación, notas
 *
 * Para prospectos: solo nombre + (teléfono o correo) es obligatorio.
 * Para activos: nombre + teléfono obligatorios.
 */
export function PersonaForm({ persona, onSave, saving = false, errors = null, isNew = false }) {
  const [form, setForm] = useState({
    etapa: persona?.etapa || "activo",
    razon_social: persona?.razon_social || "",
    telefonoPrefijo: "+595",
    telefono: persona?.telefono || "",
    correo_electronico: persona?.correo_electronico || "",
    // Opcionales
    tratamiento: persona?.tratamiento || "",
    categoria: persona?.categoria || "",
    cedula: persona?.cedula || "",
    ruc: persona?.ruc || "",
    es_extranjero: persona?.es_extranjero || false,
    documento_extranjero: persona?.documento_extranjero || "",
    departamento: persona?.departamento || "",
    ciudad: persona?.ciudad || "",
    direccion: persona?.direccion || "",
    notas: persona?.notas || "",
  });

  const [showMore, setShowMore] = useState(!isNew || persona?.etapa === "activo"); // Expandido por default en edición o cliente activo
  const [localErrors, setLocalErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const ciudades = form.departamento
    ? (CIUDADES_POR_DEPARTAMENTO[form.departamento] || [])
    : [];

  const isProspecto = form.etapa === "prospecto";

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (localErrors[field]) setLocalErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.razon_social.trim()) {
      newErrors.razon_social = "El nombre es obligatorio.";
    }

    if (isProspecto) {
      if (!form.telefono.trim() && !form.correo_electronico.trim()) {
        newErrors.telefono = "Debe proporcionar al menos teléfono o correo.";
      }
    } else {
      // Cliente activo: más campos obligatorios
      if (!form.telefono.trim()) {
        newErrors.telefono = "El teléfono es obligatorio.";
      }
      if (!form.ruc.trim() && !form.cedula.trim() && !form.es_extranjero) {
        newErrors.ruc = "RUC o Cédula es obligatorio para clientes activos.";
      }
      if (!form.categoria) {
        newErrors.categoria = "La categoría es obligatoria para clientes activos.";
      }
    }

    // Validar formato de teléfono si se proporcionó
    if (form.telefono.trim()) {
      const phoneErr = validatePhone(form.telefonoPrefijo, form.telefono);
      if (phoneErr) newErrors.telefono = phoneErr;
    }

    if (form.correo_electronico.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_electronico)) {
      newErrors.correo_electronico = "Formato de correo inválido.";
    }

    if (form.es_extranjero && !form.documento_extranjero.trim()) {
      newErrors.documento_extranjero = "Obligatorio para extranjeros.";
    }

    if (Object.keys(newErrors).length > 0) {
      setLocalErrors(newErrors);
      // Si hay errores en la sección expandible, abrirla
      if (newErrors.ruc || newErrors.cedula || newErrors.categoria || newErrors.documento_extranjero) {
        setShowMore(true);
      }
      return;
    }
    setLocalErrors({});

    // Limpiar campos vacíos y construir teléfono
    const { telefonoPrefijo, telefono, ...rest } = form;
    const payload = {
      ...rest,
      telefono: buildPhoneValue(telefonoPrefijo, telefono),
    };
    if (payload.es_extranjero) payload.ruc = "";
    if (onSave) onSave(payload);
  };

  const getError = (field) => {
    if (errors) {
      const err = errors[field];
      if (err) return Array.isArray(err) ? err.join(", ") : err;
    }
    return localErrors[field] || undefined;
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">

      {/* ─── Datos Esenciales ──────────────────────────── */}
      <div className="space-y-4">
        {/* Etapa */}
        <div className="flex gap-2">
          <button
            type="button"
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
              form.etapa === "activo"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
            )}
            onClick={() => { setForm((p) => ({ ...p, etapa: "activo" })); setIsDirty(true); setShowMore(true); }}
          >
            Cliente Activo
          </button>
          <button
            type="button"
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
              form.etapa === "prospecto"
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
            )}
            onClick={() => { setForm((p) => ({ ...p, etapa: "prospecto" })); setIsDirty(true); }}
          >
            Prospecto
          </button>
        </div>

        {isProspecto && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Text variant="mutedXs" className="text-amber-700">
              Solo requiere nombre + teléfono o correo. Los demás campos son opcionales.
            </Text>
          </div>
        )}

        {/* Nombre */}
        <div className="flex gap-3 items-start">
          <div className="flex flex-col gap-1.5 w-28 shrink-0">
            <Text as="label" variant="label">Tratamiento</Text>
            <select
              className={selectClass}
              value={form.tratamiento}
              onChange={handleChange("tratamiento")}
            >
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
              error={getError("razon_social")}
            />
          </div>
        </div>

        {/* Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PhoneInput
            label={isProspecto ? "Teléfono" : "Teléfono *"}
            prefix={form.telefonoPrefijo}
            onPrefixChange={(p) => { setForm((prev) => ({ ...prev, telefonoPrefijo: p })); setIsDirty(true); }}
            value={form.telefono}
            onChange={handleChange("telefono")}
            error={getError("telefono")}
          />
          <Input
            label={isProspecto ? "Correo Electrónico" : "Correo Electrónico"}
            type="email"
            value={form.correo_electronico}
            onChange={handleChange("correo_electronico")}
            placeholder="correo@ejemplo.com"
            maxLength={254}
            error={getError("correo_electronico")}
          />
        </div>
      </div>

      {/* ─── Sección Expandible ────────────────────────── */}
      <div>
        <button
          type="button"
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          onClick={() => setShowMore((p) => !p)}
        >
          {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showMore ? "Menos campos" : "Más campos (categoría, documentos, ubicación)"}
        </button>

        {showMore && (
          <div className="mt-4 space-y-6 pt-4 border-t border-slate-100">

            {/* Clasificación */}
            <div>
              <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3 block">
                Clasificación
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={isProspecto ? "Categoría" : "Categoría *"}>
                  <select
                    className={selectClass}
                    value={form.categoria}
                    onChange={handleChange("categoria")}
                  >
                    {CATEGORIA_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {getError("categoria") && (
                    <Text variant="bodySm" className="mt-1 text-xs text-red-500">
                      {getError("categoria")}
                    </Text>
                  )}
                </Field>
                <div className="flex items-end pb-1">
                  <Toggle
                    checked={form.es_extranjero}
                    onChange={(val) => { setForm((p) => ({ ...p, es_extranjero: val })); setIsDirty(true); }}
                    label="Extranjero"
                  />
                </div>
              </div>
            </div>

            {/* Documentos */}
            <div>
              <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3 block">
                Documentos
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!form.es_extranjero && (
                  <>
                    <Input
                      label={isProspecto ? "RUC" : "RUC *"}
                      value={form.ruc}
                      onChange={handleChange("ruc")}
                      placeholder="80000000-0"
                      maxLength={20}
                      error={getError("ruc")}
                      helperText={!isProspecto ? "RUC o Cédula es obligatorio" : undefined}
                    />
                    <Input
                      label={isProspecto ? "Cédula de Identidad" : "Cédula de Identidad *"}
                      value={form.cedula}
                      onChange={handleChange("cedula")}
                      placeholder="1.234.567"
                      maxLength={20}
                      error={getError("cedula")}
                    />
                  </>
                )}
                {form.es_extranjero && (
                  <Input
                    label="Documento Extranjero *"
                    value={form.documento_extranjero}
                    onChange={handleChange("documento_extranjero")}
                    placeholder="Pasaporte o CI extranjera"
                    maxLength={50}
                    error={getError("documento_extranjero")}
                  />
                )}
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3 block">
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
                    {DEPARTAMENTOS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Ciudad">
                  <select
                    className={selectClass}
                    value={form.ciudad}
                    onChange={handleChange("ciudad")}
                    disabled={!form.departamento}
                  >
                    <option value="">— Seleccionar —</option>
                    {ciudades.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Input
                  label="Dirección"
                  value={form.direccion}
                  onChange={handleChange("direccion")}
                  placeholder="Calle, número, barrio"
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <Field label="Notas internas">
                <textarea
                  className={cn(selectClass, "min-h-[80px] resize-y")}
                  value={form.notas}
                  onChange={handleChange("notas")}
                  placeholder="Observaciones sobre esta persona..."
                  maxLength={1000}
                />
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* ─── Errores globales ──────────────────────────── */}
      {errors?.non_field_errors && (
        <p className="text-sm text-red-600 font-medium">
          {Array.isArray(errors.non_field_errors) ? errors.non_field_errors.join(" ") : errors.non_field_errors}
        </p>
      )}

      {/* ─── Botón guardar ─────────────────────────────── */}
      <div className="flex justify-end pt-2 border-t border-slate-100">
        <Button
          type="submit"
          variant="primary"
          disabled={saving || (!isNew && !isDirty)}
        >
          {saving ? "Guardando..." : isNew ? "Crear Persona" : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
