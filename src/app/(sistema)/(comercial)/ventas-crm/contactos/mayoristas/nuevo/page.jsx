"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { PageHeader, Section, Input, Button, Field } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { createMayorista } from "@/services/apis/ventas";
import { DEPARTAMENTOS, CIUDADES_POR_DEPARTAMENTO } from "@/config/paraguay";

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500";

export default function NuevoMayoristaPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    razon_social: "",
    ruc: "",
    telefono: "",
    correo_electronico: "",
    zona_cobertura: "",
    transportadora_preferida: "",
    departamento: "",
    ciudad: "",
    direccion: "",
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
    if (!form.razon_social.trim()) newErrors.razon_social = "La razon social es obligatoria.";
    if (!form.ruc.trim()) newErrors.ruc = "El RUC es obligatorio.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const payload = { ...form, tier_precio: "mayorista" };
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
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Identificacion */}
              <div>
                <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
                  Identificacion
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Razon Social *"
                    value={form.razon_social}
                    onChange={handleChange("razon_social")}
                    placeholder="Nombre legal de la empresa"
                    maxLength={200}
                    error={errors.razon_social}
                  />
                  <Input
                    label="RUC *"
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
                  <Input
                    label="Telefono"
                    value={form.telefono}
                    onChange={handleChange("telefono")}
                    placeholder="021 555444"
                    maxLength={30}
                  />
                  <Input
                    label="Correo Electronico"
                    type="email"
                    value={form.correo_electronico}
                    onChange={handleChange("correo_electronico")}
                    placeholder="ventas@empresa.com"
                    maxLength={254}
                  />
                </div>
              </div>

              {/* Datos mayorista */}
              <div>
                <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
                  Datos de Distribucion
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Zona de Cobertura"
                    value={form.zona_cobertura}
                    onChange={handleChange("zona_cobertura")}
                    placeholder="Ciudad del Este, Encarnacion..."
                    maxLength={200}
                  />
                  <Input
                    label="Transportadora Preferida"
                    value={form.transportadora_preferida}
                    onChange={handleChange("transportadora_preferida")}
                    placeholder="Nombre de la transportadora"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Ubicacion */}
              <div>
                <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
                  Ubicacion
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
                    >
                      <option value="">— Seleccionar —</option>
                      {ciudades.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                  <div className="md:col-span-2">
                    <Input
                      label="Direccion"
                      value={form.direccion}
                      onChange={handleChange("direccion")}
                      placeholder="Calle, numero, barrio"
                      maxLength={500}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-2">
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
