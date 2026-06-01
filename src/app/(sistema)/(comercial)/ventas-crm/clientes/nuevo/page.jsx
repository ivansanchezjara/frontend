"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import ClienteForm from "@/components/ventas/ClienteForm";
import { PageHeader, Section } from "@/components/ui";
import { useToast } from "@/components/ui";
import { createCliente } from "@/services/apis/ventas";

export default function NuevoClientePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [saveErrors, setSaveErrors] = useState(null);

  // ─── Guardar nuevo cliente ──────────────────────────────────
  const handleSave = async (formData) => {
    setSaving(true);
    setSaveErrors(null);
    try {
      const nuevoCliente = await createCliente(formData);
      showToast("Cliente creado exitosamente", "success");
      router.push(`/ventas-crm/clientes/${nuevoCliente.id}`);
    } catch (err) {
      if (err.status === 400 && err.data) {
        setSaveErrors(err.data);
      } else {
        const detail = err?.data?.detail || err?.message || "Error al crear el cliente";
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
          { label: "Nuevo Cliente" },
        ]}
        subtitle="CRM · Registrar un nuevo cliente"
        subtitleClassName="text-emerald-600"
      />

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-4xl mx-auto">
          <Section
            title="Datos del Cliente"
            subtitle="Complete los campos para registrar un nuevo cliente. Los campos con * son obligatorios."
          >
            <ClienteForm
              onSave={handleSave}
              saving={saving}
              errors={saveErrors}
              isNew
            />
          </Section>
        </div>
      </main>
    </div>
  );
}
