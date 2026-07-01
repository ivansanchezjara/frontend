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
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { createOrden, getTiposServicio } from "@/services/apis/asistencia";
import { getClientes } from "@/services/apis/ventas";

export default function NuevaOrdenPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    tipo_servicio: "",
    cliente: "",
    prioridad: "media",
    descripcion_problema: "",
    direccion_servicio: "",
    latitud: "",
    longitud: "",
    venta: "",
    producto_atendido: "",
  });

  // Load tipos de servicio
  const { data: tiposData } = useApi(getTiposServicio, {
    auto: true,
    initialData: { results: [] },
    args: [{ activo: "true" }],
  });
  const tipos = tiposData?.results || tiposData || [];

  // Load clientes
  const { data: clientesData } = useApi(getClientes, {
    auto: true,
    initialData: { results: [] },
  });
  const clientes = clientesData?.results || [];

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    // Validación básica
    const newErrors = {};
    if (!form.tipo_servicio) newErrors.tipo_servicio = "Seleccione un tipo de servicio.";
    if (!form.cliente) newErrors.cliente = "Seleccione un cliente.";
    if (!form.descripcion_problema.trim()) newErrors.descripcion_problema = "Describa el problema.";
    if (!form.direccion_servicio.trim()) newErrors.direccion_servicio = "Indique la dirección.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSaving(false);
      return;
    }

    try {
      const payload = {
        tipo_servicio: Number(form.tipo_servicio),
        cliente: Number(form.cliente),
        prioridad: form.prioridad,
        descripcion_problema: form.descripcion_problema,
        direccion_servicio: form.direccion_servicio,
      };
      if (form.latitud) payload.latitud = form.latitud;
      if (form.longitud) payload.longitud = form.longitud;
      if (form.venta) payload.venta = Number(form.venta);
      if (form.producto_atendido) payload.producto_atendido = Number(form.producto_atendido);

      await createOrden(payload);
      showToast("Orden de trabajo creada exitosamente.", "success");
      router.push("/asistencia-tecnica/ordenes");
    } catch (err) {
      if (err?.data) {
        setErrors(err.data);
      } else {
        showToast(err?.message || "Error al crear la orden.", "error");
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
          { label: "Órdenes", href: "/asistencia-tecnica/ordenes" },
          { label: "Nueva Orden" },
        ]}
        subtitle="Crear orden de trabajo"
        subtitleClassName="text-blue-600"
      >
        <Link href="/asistencia-tecnica/ordenes">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>Volver</Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          <Section title="Información del Servicio" subtitle="Datos principales de la orden.">
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Tipo de Servicio *" error={errors.tipo_servicio}>
                  <select
                    value={form.tipo_servicio}
                    onChange={(e) => handleChange("tipo_servicio", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    {tipos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Prioridad">
                  <select
                    value={form.prioridad}
                    onChange={(e) => handleChange("prioridad", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </Field>
              </div>

              <Field label="Cliente *" error={errors.cliente}>
                <select
                  value={form.cliente}
                  onChange={(e) => handleChange("cliente", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.razon_social}</option>
                  ))}
                </select>
              </Field>

              <Field label="Descripción del Problema *" error={errors.descripcion_problema}>
                <textarea
                  value={form.descripcion_problema}
                  onChange={(e) => handleChange("descripcion_problema", e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Describir el problema o servicio solicitado..."
                />
              </Field>
            </div>
          </Section>

          <Section title="Ubicación del Servicio" subtitle="Dirección donde se realizará el trabajo.">
            <div className="p-6 space-y-4">
              <Field label="Dirección *" error={errors.direccion_servicio}>
                <textarea
                  value={form.direccion_servicio}
                  onChange={(e) => handleChange("direccion_servicio", e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Dirección completa del servicio..."
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitud">
                  <Input
                    type="text"
                    value={form.latitud}
                    onChange={(e) => handleChange("latitud", e.target.value)}
                    placeholder="-25.2637"
                  />
                </Field>
                <Field label="Longitud">
                  <Input
                    type="text"
                    value={form.longitud}
                    onChange={(e) => handleChange("longitud", e.target.value)}
                    placeholder="-57.5759"
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link href="/asistencia-tecnica/ordenes">
              <Button variant="ghost" type="button">Cancelar</Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              disabled={saving}
              className="shadow-lg"
            >
              {saving ? "Guardando..." : "Crear Orden"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
