"use client";
import { useState } from "react";
import { Input, Button, Field } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";

const TIER_OPTIONS = [
  { value: "publico", label: "Público" },
  { value: "estudiante", label: "Estudiante" },
  { value: "reventa", label: "Reventa" },
  { value: "mayorista", label: "Mayorista" },
  { value: "intercompany", label: "Intercompany" },
];

/**
 * Formulario de datos del cliente.
 * Campos obligatorios: razon_social, telefono, tier_precio, vendedor_responsable
 * Campos opcionales: nombre_comercial, ruc, correo_electronico, direccion_facturacion, direccion_entrega
 *
 * @param {Object} cliente - Datos actuales del cliente
 * @param {Function} onSave - Callback al guardar (recibe formData)
 * @param {boolean} saving - Estado de guardado
 * @param {Object|null} errors - Errores de validación del backend
 * @param {Array} vendedores - Lista de vendedores disponibles [{id, username, first_name, last_name}]
 */
export default function ClienteForm({ cliente, onSave, saving = false, errors = null, vendedores = [], submitLabel, hideVendedor = false, isNew = false }) {
  const [formData, setFormData] = useState({
    razon_social: cliente?.razon_social || "",
    nombre_comercial: cliente?.nombre_comercial || "",
    ruc: cliente?.ruc || "",
    telefono: cliente?.telefono || "",
    correo_electronico: cliente?.correo_electronico || "",
    direccion_facturacion: cliente?.direccion_facturacion || "",
    direccion_entrega: cliente?.direccion_entrega || "",
    tier_precio: cliente?.tier_precio || "publico",
    vendedor_responsable: cliente?.vendedor_responsable?.id || cliente?.vendedor_responsable || "",
  });

  const [isDirty, setIsDirty] = useState(false);

  const [localErrors, setLocalErrors] = useState({});

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Limpiar error local del campo al escribir
    setLocalErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validación local
    const newErrors = {};
    if (!formData.razon_social.trim()) newErrors.razon_social = "Este campo es obligatorio";
    if (!formData.telefono.trim()) newErrors.telefono = "Este campo es obligatorio";
    if (!hideVendedor && !formData.vendedor_responsable) newErrors.vendedor_responsable = "Este campo es obligatorio";

    if (Object.keys(newErrors).length > 0) {
      setLocalErrors(newErrors);
      return;
    }
    setLocalErrors({});
    if (onSave) onSave(formData);
  };

  const getError = (field) => {
    // Priorizar errores del backend, luego locales
    if (errors) {
      const err = errors[field];
      if (err) return Array.isArray(err) ? err.join(", ") : err;
    }
    return localErrors[field] || undefined;
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Campos obligatorios */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Datos Obligatorios
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Razón Social *"
            value={formData.razon_social}
            onChange={handleChange("razon_social")}
            maxLength={200}
            placeholder="Nombre legal de la empresa"
            error={getError("razon_social")}
          />
          <Input
            label="Teléfono *"
            value={formData.telefono}
            onChange={handleChange("telefono")}
            maxLength={20}
            placeholder="+595 21 123-4567"
            error={getError("telefono")}
          />
          <Field label="Tier de Precio *">
            <select
              value={formData.tier_precio}
              onChange={handleChange("tier_precio")}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {TIER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {getError("tier_precio") && (
              <Text variant="bodySm" className="mt-1 text-xs text-red-500">
                {getError("tier_precio")}
              </Text>
            )}
          </Field>
          {!hideVendedor && (
            <Field label="Vendedor Responsable *">
              <select
                value={formData.vendedor_responsable}
                onChange={handleChange("vendedor_responsable")}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Seleccionar vendedor...</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.first_name && v.last_name
                      ? `${v.first_name} ${v.last_name}`
                      : v.username}
                  </option>
                ))}
              </select>
              {getError("vendedor_responsable") && (
                <Text variant="bodySm" className="mt-1 text-xs text-red-500">
                  {getError("vendedor_responsable")}
                </Text>
              )}
            </Field>
          )}
        </div>
      </div>

      {/* Campos opcionales */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Datos Opcionales
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre Comercial"
            value={formData.nombre_comercial}
            onChange={handleChange("nombre_comercial")}
            maxLength={200}
            placeholder="Nombre de fantasía"
            error={getError("nombre_comercial")}
          />
          <Input
            label="RUC"
            value={formData.ruc}
            onChange={handleChange("ruc")}
            maxLength={20}
            placeholder="80012345-6"
            error={getError("ruc")}
          />
          <Input
            label="Correo Electrónico"
            type="email"
            value={formData.correo_electronico}
            onChange={handleChange("correo_electronico")}
            maxLength={254}
            placeholder="contacto@empresa.com"
            error={getError("correo_electronico")}
          />
        </div>
      </div>

      {/* Direcciones */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Direcciones
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <Field label="Dirección de Facturación">
              <textarea
                value={formData.direccion_facturacion}
                onChange={handleChange("direccion_facturacion")}
                rows={3}
                placeholder="Dirección completa para facturación"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
              {getError("direccion_facturacion") && (
                <Text variant="bodySm" className="mt-1 text-xs text-red-500">
                  {getError("direccion_facturacion")}
                </Text>
              )}
            </Field>
          </div>
          <div className="md:col-span-1">
            <Field label="Dirección de Entrega">
              <textarea
                value={formData.direccion_entrega}
                onChange={handleChange("direccion_entrega")}
                rows={3}
                placeholder="Dirección completa para entregas"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
              {getError("direccion_entrega") && (
                <Text variant="bodySm" className="mt-1 text-xs text-red-500">
                  {getError("direccion_entrega")}
                </Text>
              )}
            </Field>
          </div>
        </div>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={saving || (!isNew && !isDirty)}
          className={saving ? "opacity-70" : ""}
        >
          {saving ? "Guardando..." : (submitLabel || "Guardar Cambios")}
        </Button>
      </div>
    </form>
  );
}
