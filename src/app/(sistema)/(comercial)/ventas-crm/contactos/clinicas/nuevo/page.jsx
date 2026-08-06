"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  PageHeader, Section, Input, Button, Field, PhoneInput, validatePhone, buildPhoneValue,
  UbicacionPicker,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { createClinica } from "@/services/apis/ventas";

export default function NuevaClinicaPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    razon_social: "",
    nombre_comercial: "",
    ruc: "",
    telefonoPrefijo: "+595",
    telefono: "",
    correo_electronico: "",
    contacto_compras_nombre: "",
    contacto_compras_prefijo: "+595",
    contacto_compras_telefono: "",
    departamento: "",
    ciudad: "",
    direccion: "",
    latitud: null,
    longitud: null,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!form.razon_social.trim()) newErrors.razon_social = "La razón social es obligatoria.";

    // Validar teléfono principal si se proporcionó
    if (form.telefono.trim()) {
      const phoneErr = validatePhone(form.telefonoPrefijo, form.telefono);
      if (phoneErr) newErrors.telefono = phoneErr;
    }

    // Validar teléfono contacto compras si se proporcionó
    if (form.contacto_compras_telefono.trim()) {
      const phoneErr = validatePhone(form.contacto_compras_prefijo, form.contacto_compras_telefono);
      if (phoneErr) newErrors.contacto_compras_telefono = phoneErr;
    }

    // Validar correo
    if (form.correo_electronico.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_electronico)) {
      newErrors.correo_electronico = "Formato de correo inválido.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const { telefonoPrefijo, contacto_compras_prefijo, telefono, contacto_compras_telefono, ...rest } = form;
      const payload = {
        ...rest,
        telefono: buildPhoneValue(telefonoPrefijo, telefono),
        contacto_compras_telefono: buildPhoneValue(contacto_compras_prefijo, contacto_compras_telefono),
        tier_precio: "publico",
        latitud: form.latitud || null,
        longitud: form.longitud || null,
        google_maps_url: form.latitud && form.longitud
          ? `https://www.google.com/maps?q=${form.latitud},${form.longitud}`
          : "",
      };
      const nueva = await createClinica(payload);
      showToast("Clínica creada exitosamente", "success");
      router.push(`/ventas-crm/contactos/clinicas/${nueva.id}`);
    } catch (err) {
      if (err.status === 400 && err.data) {
        const fieldErrors = {};
        for (const [key, val] of Object.entries(err.data)) {
          fieldErrors[key] = Array.isArray(val) ? val.join(" ") : val;
        }
        setErrors(fieldErrors);
      } else {
        showToast(err?.data?.detail || "Error al crear la clínica", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Contactos", href: "/ventas-crm/contactos" },
          { label: "Clínicas", href: "/ventas-crm/contactos/clinicas" },
          { label: "Nueva Clínica" },
        ]}
        subtitle="Registrar una nueva clínica"
        subtitleClassName="text-emerald-600"
      />

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-3xl mx-auto">
          <Section
            title="Datos de la Clínica"
            subtitle="Complete los campos. * son obligatorios."
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Identificación */}
              <div>
                <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
                  Identificación
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Razón Social *"
                    value={form.razon_social}
                    onChange={handleChange("razon_social")}
                    placeholder="Nombre legal de la empresa"
                    maxLength={200}
                    error={errors.razon_social}
                  />
                  <Input
                    label="Nombre Comercial"
                    value={form.nombre_comercial}
                    onChange={handleChange("nombre_comercial")}
                    placeholder="OdontoCenter, DentalPlus..."
                    maxLength={200}
                  />
                  <Input
                    label="RUC"
                    value={form.ruc}
                    onChange={handleChange("ruc")}
                    placeholder="80000000-0"
                    maxLength={20}
                    error={errors.ruc}
                  />
                </div>
              </div>

              {/* Contacto */}
              <div>
                <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
                  Contacto
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PhoneInput
                    label="Teléfono"
                    prefix={form.telefonoPrefijo}
                    onPrefixChange={(p) => setForm((prev) => ({ ...prev, telefonoPrefijo: p }))}
                    value={form.telefono}
                    onChange={handleChange("telefono")}
                    error={errors.telefono}
                  />
                  <Input
                    label="Correo Electrónico"
                    type="email"
                    value={form.correo_electronico}
                    onChange={handleChange("correo_electronico")}
                    placeholder="admin@clinica.com"
                    maxLength={254}
                    error={errors.correo_electronico}
                  />
                  <Input
                    label="Contacto de Compras"
                    value={form.contacto_compras_nombre}
                    onChange={handleChange("contacto_compras_nombre")}
                    placeholder="Nombre de quien gestiona pedidos"
                    maxLength={100}
                  />
                  <PhoneInput
                    label="Tel. Contacto Compras"
                    prefix={form.contacto_compras_prefijo}
                    onPrefixChange={(p) => setForm((prev) => ({ ...prev, contacto_compras_prefijo: p }))}
                    value={form.contacto_compras_telefono}
                    onChange={handleChange("contacto_compras_telefono")}
                    error={errors.contacto_compras_telefono}
                  />
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <UbicacionPicker
                  label="Dirección Fiscal"
                  departamento={form.departamento}
                  ciudad={form.ciudad}
                  direccion={form.direccion}
                  latitud={form.latitud}
                  longitud={form.longitud}
                  onChange={({ departamento, ciudad, direccion, latitud, longitud }) => {
                    setForm((p) => ({ ...p, departamento, ciudad, direccion, latitud, longitud }));
                  }}
                  mapHeight="350px"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/ventas-crm/contactos/clinicas")}
                  className="rounded-xl font-bold text-xs"
                >
                  CANCELAR
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="rounded-xl font-bold text-xs"
                >
                  {saving ? "GUARDANDO..." : "CREAR CLÍNICA"}
                </Button>
              </div>
            </form>
          </Section>
        </div>
      </main>
    </div>
  );
}
