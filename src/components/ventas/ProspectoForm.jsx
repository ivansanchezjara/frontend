"use client";
import { useState } from "react";
import { Button, Input, Field, Section, Badge } from "@/components/ui";
import { Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TIER_OPTIONS = [
  { value: "", label: "Sin sugerencia" },
  { value: "publico", label: "Público" },
  { value: "estudiante", label: "Estudiante" },
  { value: "reventa", label: "Reventa" },
  { value: "mayorista", label: "Mayorista" },
  { value: "intercompany", label: "Intercompany" },
];

const ESTADO_BADGE_VARIANT = {
  nuevo: "info",
  contactado: "primary",
  calificado: "warning",
  convertido: "success",
  descartado: "danger",
};

const TRANSICIONES_PERMITIDAS = {
  nuevo: ["contactado", "descartado"],
  contactado: ["calificado", "descartado"],
  calificado: ["convertido", "descartado"],
  convertido: [],
  descartado: [],
};

const TRANSICION_LABELS = {
  contactado: "Marcar Contactado",
  calificado: "Marcar Calificado",
  convertido: "Convertir a Cliente",
  descartado: "Descartar",
};

const TRANSICION_VARIANTS = {
  contactado: "primary",
  calificado: "success",
  convertido: "success",
  descartado: "danger",
};

const selectClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700";

const textareaClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400 resize-none";

export default function ProspectoForm({
  formData,
  onChange,
  onSave,
  onTransition,
  onConvertir,
  saving = false,
  errors = {},
  isNew = false,
}) {
  const estado = formData.estado || "nuevo";
  const transicionesDisponibles = TRANSICIONES_PERMITIDAS[estado] || [];

  const handleTransition = (nuevoEstado) => {
    if (nuevoEstado === "convertido") {
      if (!formData.correo_electronico) {
        return;
      }
      onConvertir?.();
    } else {
      onTransition?.(nuevoEstado);
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado actual y transiciones */}
      {!isNew && (
        <Section
          title="Estado del Prospecto"
          action={
            <Badge variant={ESTADO_BADGE_VARIANT[estado] || "default"}>
              {estado}
            </Badge>
          }
        >
          <div className="p-6">
            {transicionesDisponibles.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {transicionesDisponibles.map((destino) => {
                  const needsEmail = destino === "convertido" && !formData.correo_electronico;
                  return (
                    <div key={destino} className="flex flex-col gap-1">
                      <Button
                        variant={TRANSICION_VARIANTS[destino] || "secondary"}
                        size="sm"
                        onClick={() => handleTransition(destino)}
                        disabled={saving || needsEmail}
                      >
                        {TRANSICION_LABELS[destino]}
                      </Button>
                      {needsEmail && (
                        <span className="text-[10px] text-red-500 font-medium">
                          Requiere correo electrónico
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No hay transiciones disponibles desde este estado.
              </p>
            )}
          </div>
        </Section>
      )}

      {/* Datos del prospecto */}
      <Section title="Datos del Prospecto">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <Input
              label="Nombre *"
              value={formData.nombre || ""}
              onChange={(e) => onChange("nombre")(e.target.value)}
              placeholder="Nombre completo del prospecto"
              maxLength={150}
              error={errors.nombre}
            />
          </div>

          <Input
            label="Teléfono"
            value={formData.telefono || ""}
            onChange={(e) => onChange("telefono")(e.target.value)}
            placeholder="+595 981 123456"
            maxLength={20}
            error={errors.telefono}
            helperText="Al menos teléfono o correo es obligatorio"
          />

          <Input
            label="Correo Electrónico"
            type="email"
            value={formData.correo_electronico || ""}
            onChange={(e) => onChange("correo_electronico")(e.target.value)}
            placeholder="ejemplo@correo.com"
            maxLength={254}
            error={errors.correo_electronico}
          />

          <Input
            label="Empresa"
            value={formData.empresa || ""}
            onChange={(e) => onChange("empresa")(e.target.value)}
            placeholder="Nombre de la empresa"
            maxLength={200}
            error={errors.empresa}
          />

          <Input
            label="RUC"
            value={formData.ruc || ""}
            onChange={(e) => onChange("ruc")(e.target.value)}
            placeholder="RUC del prospecto"
            maxLength={20}
            error={errors.ruc}
          />

          <div className="md:col-span-2">
            <Input
              label="Dirección"
              value={formData.direccion || ""}
              onChange={(e) => onChange("direccion")(e.target.value)}
              placeholder="Dirección completa"
              maxLength={300}
              error={errors.direccion}
            />
          </div>

          <Field label="Tier de Precio Sugerido">
            <select
              className={selectClass}
              value={formData.tier_precio_sugerido || ""}
              onChange={(e) => onChange("tier_precio_sugerido")(e.target.value)}
            >
              {TIER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Notas">
              <textarea
                className={textareaClass}
                rows={4}
                value={formData.notas || ""}
                onChange={(e) => onChange("notas")(e.target.value)}
                placeholder="Notas adicionales sobre el prospecto..."
                maxLength={1000}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={onSave}
          disabled={saving}
          icon={saving ? Loader2 : Save}
          className={saving ? "[&_svg]:animate-spin" : ""}
        >
          {saving ? "Guardando..." : isNew ? "Crear Prospecto" : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}
