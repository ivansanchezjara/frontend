"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

import { PageHeader, Section, Input, Button, Field, AddressInput, PhoneInput, validatePhone, buildPhoneValue } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { createMayorista } from "@/services/apis/ventas";
import { DEPARTAMENTOS, CIUDADES_POR_DEPARTAMENTO } from "@/config/paraguay";

// Leaflet no soporta SSR
const MapaPicker = dynamic(() => import("@/components/ui/basics/MapaPicker"), { ssr: false });

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500";

export default function NuevoMayoristaPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    razon_social: "",
    ruc: "",
    telefonoPrefijo: "+595",
    telefono: "",
    correo_electronico: "",
    contacto_nombre: "",
    transportadora_preferida: "",
    departamento: "",
    ciudad: "",
    direccion: "",
    latitud: null,
    longitud: null,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const ciudades = form.departamento
    ? (CIUDADES_POR_DEPARTAMENTO[form.departamento] || [])
    : [];

  const handleChange = useCallback((field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  }, [errors]);

  const handleDepartamentoChange = useCallback((e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, departamento: value, ciudad: "" }));
    if (errors.departamento) {
      setErrors((prev) => { const n = { ...prev }; delete n.departamento; return n; });
    }
  }, [errors]);

  const validateField = useCallback((field) => {
    const validators = {
      razon_social: (v) => !v.trim() ? "La razón social es obligatoria." : null,
      ruc: (v) => !v.trim() ? "El RUC es obligatorio." : null,
      telefono: () => {
        if (form.telefono.trim()) {
          return validatePhone(form.telefonoPrefijo, form.telefono);
        }
        return null;
      },
    };
    const validate = validators[field];
    if (!validate) return;
    const error = validate(form[field]);
    setErrors((prev) => {
      if (error) return { ...prev, [field]: error };
      const n = { ...prev };
      delete n[field];
      return n;
    });
  }, [form]);

  const handleBlur = useCallback((field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  }, [validateField]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const newErrors = {};
    if (!form.razon_social.trim()) newErrors.razon_social = "La razón social es obligatoria.";
    if (!form.ruc.trim()) newErrors.ruc = "El RUC es obligatorio.";
    if (form.telefono.trim()) {
      const phoneErr = validatePhone(form.telefonoPrefijo, form.telefono);
      if (phoneErr) newErrors.telefono = phoneErr;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ razon_social: true, ruc: true, telefono: true });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const { telefonoPrefijo, telefono, ...rest } = form;
      const payload = {
        ...rest,
        telefono: buildPhoneValue(telefonoPrefijo, telefono),
        tier_precio: "mayorista",
      };
      const nuevo = await createMayorista(payload);
      showToast("Mayorista creado exitosamente", "success");
      router.push(`/ventas-crm/contactos/mayoristas/${nuevo.id}`);
    } catch (err) {
      if (err.status === 400 && err.data) {
        const fieldErrors = {};
        for (const [key, val] of Object.entries(err.data)) {
          fieldErrors[key] = Array.isArray(val) ? val.join(" ") : val;
        }
        setErrors(fieldErrors);
      } else {
        showToast(err?.data?.detail || "Error al crear el mayorista", "error");
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
          { label: "Mayoristas", href: "/ventas-crm/contactos/mayoristas" },
          { label: "Nuevo Mayorista" },
        ]}
        subtitle="Registrar un nuevo mayorista"
        subtitleClassName="text-purple-600"
      />

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-3xl mx-auto">
          <Section
            title="Datos del Mayorista"
            subtitle="Complete los campos. * son obligatorios."
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>

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
                    onBlur={handleBlur("razon_social")}
                    placeholder="Nombre legal de la empresa"
                    maxLength={200}
                    error={touched.razon_social ? errors.razon_social : undefined}
                  />
                  <Input
                    label="RUC *"
                    value={form.ruc}
                    onChange={handleChange("ruc")}
                    onBlur={handleBlur("ruc")}
                    placeholder="80000000-0"
                    maxLength={20}
                    error={touched.ruc ? errors.ruc : undefined}
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
                    error={touched.telefono ? errors.telefono : undefined}
                  />
                  <Input
                    label="Correo Electrónico"
                    type="email"
                    value={form.correo_electronico}
                    onChange={handleChange("correo_electronico")}
                    placeholder="ventas@empresa.com"
                    maxLength={254}
                  />
                  <Input
                    label="Persona de Contacto"
                    value={form.contacto_nombre}
                    onChange={handleChange("contacto_nombre")}
                    placeholder="Nombre de quien gestiona pedidos"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Datos de distribución */}
              <div>
                <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
                  Datos de Distribución
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Transportadora Preferida"
                    value={form.transportadora_preferida}
                    onChange={handleChange("transportadora_preferida")}
                    placeholder="Nombre de la transportadora"
                    maxLength={100}
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
                    {(fieldProps) => (
                      <select
                        {...fieldProps}
                        className={selectClass}
                        value={form.departamento}
                        onChange={handleDepartamentoChange}
                      >
                        <option value="">— Seleccionar —</option>
                        {DEPARTAMENTOS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <Field label="Ciudad">
                    {(fieldProps) => (
                      <select
                        {...fieldProps}
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
                    )}
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

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <Button
                  as={Link}
                  href="/ventas-crm/contactos/mayoristas"
                  variant="ghost"
                  size="md"
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
                  {saving ? "GUARDANDO..." : "CREAR MAYORISTA"}
                </Button>
              </div>
            </form>
          </Section>
        </div>
      </main>
    </div>
  );
}
