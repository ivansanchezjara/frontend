"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  PageHeader,
  Button,
  Input,
  Field,
  Section,
  Text,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { createTecnico, getTiposServicio } from "@/services/apis/asistencia";

export default function NuevoTecnicoPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    user: "",
    nombre_completo: "",
    telefono: "",
    email: "",
    tipo: "interno",
    especialidades: [],
    notas: "",
  });

  const { data: tiposData } = useApi(getTiposServicio, {
    auto: true,
    initialData: { results: [] },
    args: [{ activo: "true" }],
  });
  const tipos = tiposData?.results || tiposData || [];

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleEspecialidades = (e) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => Number(opt.value));
    handleChange("especialidades", selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const newErrors = {};
    if (!form.user) newErrors.user = "Indique el ID del usuario.";
    if (!form.nombre_completo.trim()) newErrors.nombre_completo = "Nombre es requerido.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSaving(false);
      return;
    }

    try {
      const payload = {
        user: Number(form.user),
        nombre_completo: form.nombre_completo,
        telefono: form.telefono,
        email: form.email,
        tipo: form.tipo,
        especialidades: form.especialidades,
        notas: form.notas,
      };
      await createTecnico(payload);
      showToast("Técnico creado exitosamente.", "success");
      router.push("/asistencia-tecnica/tecnicos");
    } catch (err) {
      if (err?.data) {
        setErrors(err.data);
      } else {
        showToast(err?.message || "Error al crear técnico.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Asistencia Técnica", href: "/asistencia-tecnica" },
          { label: "Técnicos", href: "/asistencia-tecnica/tecnicos" },
          { label: "Nuevo Técnico" },
        ]}
        subtitle="Registrar técnico"
        subtitleClassName="text-blue-600"
      >
        <Link href="/asistencia-tecnica/tecnicos">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>Volver</Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          <Section title="Datos del Técnico">
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="ID Usuario (Django) *" error={errors.user}>
                  <Input
                    type="number"
                    value={form.user}
                    onChange={(e) => handleChange("user", e.target.value)}
                    placeholder="ID del usuario del sistema"
                  />
                </Field>

                <Field label="Tipo">
                  <select
                    value={form.tipo}
                    onChange={(e) => handleChange("tipo", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="interno">Interno</option>
                    <option value="externo">Externo</option>
                  </select>
                </Field>
              </div>

              <Field label="Nombre Completo *" error={errors.nombre_completo}>
                <Input
                  value={form.nombre_completo}
                  onChange={(e) => handleChange("nombre_completo", e.target.value)}
                  placeholder="Nombre y apellido"
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Teléfono">
                  <Input
                    value={form.telefono}
                    onChange={(e) => handleChange("telefono", e.target.value)}
                    placeholder="+595 9XX XXX XXX"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="tecnico@empresa.com"
                  />
                </Field>
              </div>

              <Field label="Especialidades">
                <select
                  multiple
                  value={form.especialidades.map(String)}
                  onChange={handleEspecialidades}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                >
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
                <Text variant="bodyXs" className="text-slate-400 mt-1">
                  Mantené Ctrl presionado para selección múltiple.
                </Text>
              </Field>

              <Field label="Notas">
                <textarea
                  value={form.notas}
                  onChange={(e) => handleChange("notas", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Notas adicionales..."
                />
              </Field>
            </div>
          </Section>

          <div className="flex justify-end gap-3">
            <Link href="/asistencia-tecnica/tecnicos">
              <Button variant="ghost" type="button">Cancelar</Button>
            </Link>
            <Button type="submit" variant="primary" icon={Save} disabled={saving} className="shadow-lg">
              {saving ? "Guardando..." : "Crear Técnico"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
