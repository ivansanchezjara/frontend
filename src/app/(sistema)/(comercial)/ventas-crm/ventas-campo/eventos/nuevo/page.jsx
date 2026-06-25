"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { PageHeader, Button, Field, Input, useToast } from "@/components/ui";
import { createEvento } from "@/services/apis/ventas-campo";

// ─── Página de creación de evento ───────────────────────────────

export default function NuevoEventoPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    titulo: "",
    tipo: "curso",
    descripcion: "",
    ubicacion: "",
    fecha_inicio: "",
    fecha_fin: "",
    deposito_origen: "",
    timbrado: "",
    fondo_pyg: 0,
    fondo_usd: 0,
    fondo_brl: 0,
    notas: "",
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const payload = { ...form };
      // Limpiar campos opcionales vacíos
      if (!payload.fecha_fin) delete payload.fecha_fin;
      if (!payload.timbrado) delete payload.timbrado;
      if (!payload.deposito_origen) {
        setErrors({ deposito_origen: "El depósito de origen es requerido." });
        setSaving(false);
        return;
      }
      payload.deposito_origen = Number(payload.deposito_origen);
      if (payload.timbrado) payload.timbrado = Number(payload.timbrado);

      const evento = await createEvento(payload);
      showToast("Evento creado correctamente.", "success");
      router.push(`/ventas-crm/ventas-campo/eventos/${evento.id}`);
    } catch (err) {
      if (err?.data && typeof err.data === "object") {
        setErrors(err.data);
      } else {
        showToast(err?.message || "Error al crear evento.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas de Campo", href: "/ventas-crm/ventas-campo/eventos" },
          { label: "Nuevo Evento" },
        ]}
      />

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">

          {/* Información básica */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Información del Evento</h2>

            <Field label="Título *" error={errors.titulo}>
              <Input
                value={form.titulo}
                onChange={(e) => handleChange("titulo", e.target.value)}
                placeholder="Ej: Curso Odontología UNA - Julio 2026"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo" error={errors.tipo}>
                <select
                  value={form.tipo}
                  onChange={(e) => handleChange("tipo", e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-300"
                >
                  <option value="curso">Curso</option>
                  <option value="visita">Visita</option>
                  <option value="feria">Feria</option>
                  <option value="otro">Otro</option>
                </select>
              </Field>

              <Field label="Ubicación" error={errors.ubicacion}>
                <Input
                  value={form.ubicacion}
                  onChange={(e) => handleChange("ubicacion", e.target.value)}
                  placeholder="Ej: Universidad Nacional, Sala 4"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Fecha Inicio *" error={errors.fecha_inicio}>
                <Input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => handleChange("fecha_inicio", e.target.value)}
                />
              </Field>
              <Field label="Fecha Fin (opcional)" error={errors.fecha_fin}>
                <Input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => handleChange("fecha_fin", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Descripción" error={errors.descripcion}>
              <textarea
                value={form.descripcion}
                onChange={(e) => handleChange("descripcion", e.target.value)}
                placeholder="Notas adicionales sobre el evento..."
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-300 resize-none"
              />
            </Field>
          </div>

          {/* Configuración operativa */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Configuración Operativa</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Depósito de Origen (ID) *" error={errors.deposito_origen}>
                <Input
                  type="number"
                  value={form.deposito_origen}
                  onChange={(e) => handleChange("deposito_origen", e.target.value)}
                  placeholder="ID del depósito"
                />
              </Field>
              <Field label="Timbrado (ID, opcional)" error={errors.timbrado}>
                <Input
                  type="number"
                  value={form.timbrado}
                  onChange={(e) => handleChange("timbrado", e.target.value)}
                  placeholder="ID del timbrado"
                />
              </Field>
            </div>

            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-2">Fondo de Caja Inicial</h3>
            <div className="grid grid-cols-3 gap-4">
              <Field label="PYG" error={errors.fondo_pyg}>
                <Input
                  type="number"
                  value={form.fondo_pyg}
                  onChange={(e) => handleChange("fondo_pyg", Number(e.target.value))}
                />
              </Field>
              <Field label="USD" error={errors.fondo_usd}>
                <Input
                  type="number"
                  step="0.01"
                  value={form.fondo_usd}
                  onChange={(e) => handleChange("fondo_usd", Number(e.target.value))}
                />
              </Field>
              <Field label="BRL" error={errors.fondo_brl}>
                <Input
                  type="number"
                  step="0.01"
                  value={form.fondo_brl}
                  onChange={(e) => handleChange("fondo_brl", Number(e.target.value))}
                />
              </Field>
            </div>
          </div>

          {/* Botón submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="success"
              size="md"
              icon={Save}
              disabled={saving}
              className="rounded-xl font-bold"
            >
              {saving ? "Guardando..." : "Crear Evento"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
