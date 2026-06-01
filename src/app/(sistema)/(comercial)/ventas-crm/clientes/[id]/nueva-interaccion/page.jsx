"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button, Input, Field, PageHeader, Section } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { createInteraccion } from "@/services/apis/ventas";
import { cn } from "@/lib/utils";

// ─── Configuración ──────────────────────────────────────────────

const TIPOS_INTERACCION = [
  { value: "llamada", label: "Llamada" },
  { value: "visita", label: "Visita" },
  { value: "correo", label: "Correo" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "nota", label: "Nota" },
];

const selectClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700";

const textareaClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400 resize-none";

// ─── Página ─────────────────────────────────────────────────────

export default function NuevaInteraccionClientePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const { execute: guardarInteraccion, loading: saving } = useApi(createInteraccion);

  const [form, setForm] = useState({
    tipo: "llamada",
    fecha: new Date().toISOString().slice(0, 16),
    resumen: "",
    proxima_accion_fecha: "",
    proxima_accion_descripcion: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.resumen.trim()) {
      newErrors.resumen = "El resumen es obligatorio.";
    }
    if (!form.fecha) {
      newErrors.fecha = "La fecha es obligatoria.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        tipo: form.tipo,
        fecha: new Date(form.fecha).toISOString(),
        resumen: form.resumen.trim(),
        cliente: parseInt(id, 10),
      };

      if (form.proxima_accion_fecha) {
        payload.proxima_accion_fecha = new Date(form.proxima_accion_fecha).toISOString();
      }
      if (form.proxima_accion_descripcion.trim()) {
        payload.proxima_accion_descripcion = form.proxima_accion_descripcion.trim();
      }

      await guardarInteraccion(payload);
      showToast("Interacción registrada correctamente", "success");
      router.push(`/ventas-crm/clientes/${id}`);
    } catch (err) {
      const detail = err?.data?.detail || err?.data?.resumen?.[0] || err?.message || "Error al registrar la interacción.";
      showToast(detail, "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Clientes", href: "/ventas-crm/clientes" },
          { label: "Perfil", href: `/ventas-crm/clientes/${id}` },
          { label: "Nueva Interacción" },
        ]}
        subtitle="CRM · Registrar contacto con el cliente"
        subtitleClassName="text-emerald-600"
      >
        <Link href={`/ventas-crm/clientes/${id}`}>
          <Button variant="secondary" size="md" icon={ArrowLeft} className="rounded-xl font-bold text-xs cursor-pointer">
            VOLVER
          </Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-3xl mx-auto">
          <Section
            title="Nueva Interacción"
            subtitle="Registrar una llamada, visita, correo u otra interacción con el cliente."
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo */}
                <Field label="Tipo de Interacción *">
                  <select
                    className={selectClass}
                    value={form.tipo}
                    onChange={handleChange("tipo")}
                  >
                    {TIPOS_INTERACCION.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Fecha */}
                <Input
                  label="Fecha y Hora *"
                  type="datetime-local"
                  value={form.fecha}
                  onChange={handleChange("fecha")}
                  error={errors.fecha}
                />
              </div>

              {/* Resumen */}
              <Field label="Resumen *">
                <textarea
                  className={cn(textareaClass, errors.resumen && "border-red-300 focus:border-red-500 focus:ring-red-500/20")}
                  rows={4}
                  value={form.resumen}
                  onChange={handleChange("resumen")}
                  placeholder="Descripción de la interacción con el cliente..."
                  maxLength={1000}
                />
                {errors.resumen && (
                  <Text variant="bodySm" className="mt-1 text-xs text-red-500">
                    {errors.resumen}
                  </Text>
                )}
              </Field>

              {/* Próxima acción */}
              <div className="border-t border-slate-100 pt-5">
                <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
                  Próxima Acción (Opcional)
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Fecha de Próxima Acción"
                    type="datetime-local"
                    value={form.proxima_accion_fecha}
                    onChange={handleChange("proxima_accion_fecha")}
                  />
                  <Input
                    label="Descripción"
                    value={form.proxima_accion_descripcion}
                    onChange={handleChange("proxima_accion_descripcion")}
                    placeholder="Ej: Llamar para seguimiento"
                    maxLength={500}
                  />
                </div>
              </div>

              {/* Botón guardar */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  icon={saving ? Loader2 : Save}
                  disabled={saving}
                  className={cn("rounded-xl font-bold text-xs", saving && "[&_svg]:animate-spin")}
                >
                  {saving ? "GUARDANDO..." : "REGISTRAR INTERACCIÓN"}
                </Button>
              </div>
            </form>
          </Section>
        </div>
      </main>
    </div>
  );
}
