"use client";
import { useState } from "react";
import { Input, Button, Field } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/feedback/ToastContext";
import {
  crearTimbrado,
  actualizarTimbrado,
  getPuntosExpedicion,
} from "@/services/apis/caja";

// ─── Configuración ──────────────────────────────────────────────

const TIPO_DOCUMENTO_OPTIONS = [
  { value: "factura", label: "Factura" },
  { value: "nota_credito", label: "Nota de Crédito" },
];

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

const selectErrorClass =
  "block w-full rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-900 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500";

// ─── Componente Principal ───────────────────────────────────────

/**
 * Formulario para crear/editar un timbrado.
 *
 * @param {Object|null} timbrado - Datos del timbrado existente (null para nuevo)
 * @param {Function} onClose - Callback para cerrar el formulario
 * @param {Function} onSuccess - Callback tras guardar exitosamente
 */
export default function TimbradoForm({ timbrado = null, onClose, onSuccess }) {
  const isNew = !timbrado;
  const { showToast } = useToast();

  const { data: puntosData, loading: loadingPuntos } = useApi(
    getPuntosExpedicion,
    { auto: true }
  );

  const [formData, setFormData] = useState({
    numero_timbrado: timbrado?.numero_timbrado || "",
    punto_expedicion: timbrado?.punto_expedicion?.id || timbrado?.punto_expedicion || "",
    tipo_documento: timbrado?.tipo_documento || "factura",
    fecha_inicio_vigencia: timbrado?.fecha_inicio_vigencia || "",
    fecha_fin_vigencia: timbrado?.fecha_fin_vigencia || "",
    numero_inicial: timbrado?.numero_inicial || "",
    numero_final: timbrado?.numero_final || "",
  });

  const [saving, setSaving] = useState(false);
  const [localErrors, setLocalErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  const puntosExpedicion = Array.isArray(puntosData?.results)
    ? puntosData.results
    : Array.isArray(puntosData)
      ? puntosData
      : [];

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setLocalErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setServerError(null);
  };

  const validate = () => {
    const errors = {};

    if (!formData.numero_timbrado.trim()) {
      errors.numero_timbrado = "El número de timbrado es obligatorio.";
    }

    if (!formData.punto_expedicion) {
      errors.punto_expedicion = "Debe seleccionar un punto de expedición.";
    }

    if (!formData.tipo_documento) {
      errors.tipo_documento = "Debe seleccionar un tipo de documento.";
    }

    if (!formData.fecha_inicio_vigencia) {
      errors.fecha_inicio_vigencia = "La fecha de inicio es obligatoria.";
    }

    if (!formData.fecha_fin_vigencia) {
      errors.fecha_fin_vigencia = "La fecha de fin es obligatoria.";
    }

    if (formData.fecha_inicio_vigencia && formData.fecha_fin_vigencia) {
      if (formData.fecha_fin_vigencia <= formData.fecha_inicio_vigencia) {
        errors.fecha_fin_vigencia =
          "La fecha de fin debe ser posterior a la fecha de inicio.";
      }
    }

    const numInicial = parseInt(formData.numero_inicial, 10);
    const numFinal = parseInt(formData.numero_final, 10);

    if (!formData.numero_inicial || isNaN(numInicial) || numInicial < 1) {
      errors.numero_inicial = "El número inicial es obligatorio y debe ser mayor a 0.";
    }

    if (!formData.numero_final || isNaN(numFinal) || numFinal < 1) {
      errors.numero_final = "El número final es obligatorio y debe ser mayor a 0.";
    }

    if (!errors.numero_inicial && !errors.numero_final && numFinal <= numInicial) {
      errors.numero_final =
        "El número final debe ser mayor al número inicial.";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }

    setLocalErrors({});
    setSaving(true);
    setServerError(null);

    const payload = {
      numero_timbrado: formData.numero_timbrado.trim(),
      punto_expedicion: parseInt(formData.punto_expedicion, 10),
      tipo_documento: formData.tipo_documento,
      fecha_inicio_vigencia: formData.fecha_inicio_vigencia,
      fecha_fin_vigencia: formData.fecha_fin_vigencia,
      numero_inicial: parseInt(formData.numero_inicial, 10),
      numero_final: parseInt(formData.numero_final, 10),
    };

    try {
      if (isNew) {
        await crearTimbrado(payload);
        showToast("Timbrado creado exitosamente", "success");
      } else {
        await actualizarTimbrado(timbrado.id, payload);
        showToast("Timbrado actualizado exitosamente", "success");
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      const message =
        err?.data?.detail ||
        err?.data?.non_field_errors?.[0] ||
        err?.message ||
        "Error al guardar el timbrado.";
      setServerError(message);
    } finally {
      setSaving(false);
    }
  };

  const getError = (field) => localErrors[field] || undefined;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* ─── Error del servidor ─────────────────────────────────── */}
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <Text variant="bodySm" className="text-red-700">
            {serverError}
          </Text>
        </div>
      )}

      {/* ─── Datos del Timbrado ────────────────────────────────── */}
      <div>
        <Text
          variant="label"
          className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block"
        >
          Datos del Timbrado
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Número de Timbrado *"
            value={formData.numero_timbrado}
            onChange={handleChange("numero_timbrado")}
            maxLength={20}
            placeholder="Ej: 12345678"
            error={getError("numero_timbrado")}
          />

          <Field label="Punto de Expedición *">
            <select
              className={cn(
                getError("punto_expedicion") ? selectErrorClass : selectClass
              )}
              value={formData.punto_expedicion}
              onChange={handleChange("punto_expedicion")}
              disabled={loadingPuntos}
            >
              <option value="">
                {loadingPuntos ? "Cargando..." : "Seleccionar punto de expedición"}
              </option>
              {puntosExpedicion.map((punto) => (
                <option key={punto.id} value={punto.id}>
                  {punto.codigo_establecimiento}-{punto.codigo_punto} — {punto.nombre}
                </option>
              ))}
            </select>
            {getError("punto_expedicion") && (
              <Text variant="bodySm" className="mt-1 text-xs text-red-500">
                {getError("punto_expedicion")}
              </Text>
            )}
          </Field>

          <Field label="Tipo de Documento *">
            <select
              className={cn(
                getError("tipo_documento") ? selectErrorClass : selectClass
              )}
              value={formData.tipo_documento}
              onChange={handleChange("tipo_documento")}
            >
              {TIPO_DOCUMENTO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {getError("tipo_documento") && (
              <Text variant="bodySm" className="mt-1 text-xs text-red-500">
                {getError("tipo_documento")}
              </Text>
            )}
          </Field>
        </div>
      </div>

      {/* ─── Vigencia ──────────────────────────────────────────── */}
      <div>
        <Text
          variant="label"
          className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block"
        >
          Período de Vigencia
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha de Inicio *"
            type="date"
            value={formData.fecha_inicio_vigencia}
            onChange={handleChange("fecha_inicio_vigencia")}
            error={getError("fecha_inicio_vigencia")}
          />

          <Input
            label="Fecha de Fin *"
            type="date"
            value={formData.fecha_fin_vigencia}
            onChange={handleChange("fecha_fin_vigencia")}
            error={getError("fecha_fin_vigencia")}
          />
        </div>
      </div>

      {/* ─── Rango Numérico ────────────────────────────────────── */}
      <div>
        <Text
          variant="label"
          className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block"
        >
          Rango Numérico
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Número Inicial *"
            type="number"
            min="1"
            value={formData.numero_inicial}
            onChange={handleChange("numero_inicial")}
            placeholder="Ej: 1"
            error={getError("numero_inicial")}
          />

          <Input
            label="Número Final *"
            type="number"
            min="1"
            value={formData.numero_final}
            onChange={handleChange("numero_final")}
            placeholder="Ej: 5000"
            error={getError("numero_final")}
          />
        </div>
      </div>

      {/* ─── Botones ───────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pt-2">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={saving}
          className={saving ? "opacity-70" : ""}
        >
          {saving
            ? "Guardando..."
            : isNew
              ? "Crear Timbrado"
              : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
