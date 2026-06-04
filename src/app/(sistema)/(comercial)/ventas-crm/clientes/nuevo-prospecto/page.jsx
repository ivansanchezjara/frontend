"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";

import { PageHeader, Section, Button, Input, Field } from "@/components/ui";
import { useToast } from "@/components/ui";
import { createCliente } from "@/services/apis/ventas";
import { getUser } from "@/services/apis/auth";

const TIER_OPTIONS = [
  { value: "", label: "Sin sugerencia" },
  { value: "publico", label: "Público" },
  { value: "estudiante", label: "Estudiante" },
  { value: "reventa", label: "Reventa" },
  { value: "mayorista", label: "Mayorista" },
  { value: "intercompany", label: "Intercompany" },
];

export default function NuevoProspectoPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    razon_social: "",
    telefono: "",
    correo_electronico: "",
    notas: "",
    tier_precio: "publico",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSave = async () => {
    // Validación local mínima
    if (!formData.razon_social.trim()) {
      setErrors({ razon_social: "El nombre es obligatorio." });
      return;
    }
    if (!formData.telefono && !formData.correo_electronico) {
      setErrors({
        non_field_errors: "Debe proporcionar al menos un teléfono o correo electrónico.",
      });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const user = getUser();
      const payload = {
        etapa: "prospecto",
        razon_social: formData.razon_social,
        telefono: formData.telefono,
        correo_electronico: formData.correo_electronico,
        notas: formData.notas,
        tier_precio: formData.tier_precio || "publico",
        vendedor: user?.id,
      };
      const nuevo = await createCliente(payload);
      showToast("Prospecto registrado exitosamente", "success");
      router.push(`/ventas-crm/clientes/${nuevo.id}`);
    } catch (err) {
      if (err.status === 400 && err.data) {
        const fieldErrors = {};
        for (const [key, val] of Object.entries(err.data)) {
          fieldErrors[key] = Array.isArray(val) ? val.join(" ") : val;
        }
        setErrors(fieldErrors);
      } else {
        const detail =
          err?.data?.detail || err?.message || "Error al crear el prospecto";
        showToast(detail, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Clientes", href: "/ventas-crm/clientes" },
          { label: "Nuevo Prospecto" },
        ]}
        subtitle="CRM · Registro rápido de contacto potencial"
        subtitleClassName="text-emerald-600"
      />

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-2xl mx-auto space-y-6">
          <Section
            title="Datos mínimos"
            subtitle="Solo nombre y un medio de contacto. Los datos completos se solicitan al momento de facturar."
          >
            <div className="p-6 space-y-5">
              <Input
                label="Nombre / Razón Social *"
                value={formData.razon_social}
                onChange={(e) => handleChange("razon_social")(e.target.value)}
                placeholder="Nombre completo del contacto"
                maxLength={200}
                error={errors.razon_social}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Teléfono"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono")(e.target.value)}
                  placeholder="+595 981 123456"
                  maxLength={20}
                  error={errors.telefono}
                  helperText="Al menos teléfono o correo"
                />

                <Input
                  label="Correo Electrónico"
                  type="email"
                  value={formData.correo_electronico}
                  onChange={(e) =>
                    handleChange("correo_electronico")(e.target.value)
                  }
                  placeholder="ejemplo@correo.com"
                  error={errors.correo_electronico}
                />
              </div>

              <Field label="Tier de Precio Sugerido">
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-slate-700"
                  value={formData.tier_precio}
                  onChange={(e) => handleChange("tier_precio")(e.target.value)}
                >
                  {TIER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Notas">
                <textarea
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400 resize-none"
                  rows={3}
                  value={formData.notas}
                  onChange={(e) => handleChange("notas")(e.target.value)}
                  placeholder="Notas sobre el prospecto..."
                  maxLength={1000}
                />
              </Field>

              {errors.non_field_errors && (
                <p className="text-sm text-red-600 font-medium">
                  {errors.non_field_errors}
                </p>
              )}
            </div>
          </Section>

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              icon={saving ? Loader2 : Save}
              className={saving ? "[&_svg]:animate-spin" : ""}
            >
              {saving ? "Guardando..." : "Crear Prospecto"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
