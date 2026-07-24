"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import {
  PageHeader, Section, Input, Button, Field, PhoneInput, validatePhone, buildPhoneValue,
  AddressInput,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { createClinica } from "@/services/apis/ventas";
import { DEPARTAMENTOS, CIUDADES_POR_DEPARTAMENTO } from "@/config/paraguay";

// Leaflet no soporta SSR
const MapaPicker = dynamic(() => import("@/components/ui/basics/MapaPicker"), { ssr: false });

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

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
    direccion_entrega: "",
    latitud: null,
    longitud: null,
  });
  const [errors, setErrors] = useState({});

  const ciudades = form.departamento
    ? (CIUDADES_POR_DEPARTAMENTO[form.departamento] || [])
    : [];

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
                <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
                  Ubicación
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Departamento">
                    <select
                      className={selectClass}
                      value={form.departamento}
                      onChange={(e) => setForm((p) => ({ ...p, departamento: e.target.value, ciudad: "" }))}
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
                  <div className="md:col-span-2">
                    <AddressInput
                      label="Dirección"
                      value={form.direccion}
                      onChange={handleChange("direccion")}
                      placeholder="Calle, número, barrio"
                      maxLength={500}
                      context={[form.ciudad, form.departamento].filter(Boolean).join(", ")}
                      onSelect={({ lat, lng }) => {
                        setForm((p) => ({ ...p, latitud: lat, longitud: lng }));
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Dirección de Entrega (si difiere)"
                      value={form.direccion_entrega}
                      onChange={handleChange("direccion_entrega")}
                      placeholder="Dirección alternativa para entregas"
                      maxLength={500}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Ubicación en mapa">
                      <MapaPicker
                        latitud={form.latitud}
                        longitud={form.longitud}
                        centerOn={[form.ciudad, form.departamento].filter(Boolean).join(", ")}
                        onChange={({ lat, lng, departamentoRaw, ciudad, direccion }) => {
                          setForm((p) => {
                            const update = { ...p, latitud: lat, longitud: lng };
                            if (departamentoRaw) {
                              const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                              const deptoNorm = norm(departamentoRaw);
                              const match = DEPARTAMENTOS.find((d) => norm(d) === deptoNorm)
                                || DEPARTAMENTOS.find((d) => deptoNorm.includes(norm(d)) || norm(d).includes(deptoNorm));
                              if (match) {
                                update.departamento = match;
                                update.ciudad = "";
                                if (ciudad) {
                                  const ciudadesDepto = CIUDADES_POR_DEPARTAMENTO[match] || [];
                                  const ciudadNorm = norm(ciudad);
                                  const ciudadMatch = ciudadesDepto.find((c) => norm(c) === ciudadNorm)
                                    || ciudadesDepto.find((c) => ciudadNorm.includes(norm(c)) || norm(c).includes(ciudadNorm));
                                  if (ciudadMatch) update.ciudad = ciudadMatch;
                                }
                              }
                            }
                            if (direccion) update.direccion = direccion;
                            return update;
                          });
                        }}
                        height="350px"
                      />
                    </Field>
                  </div>
                </div>
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
