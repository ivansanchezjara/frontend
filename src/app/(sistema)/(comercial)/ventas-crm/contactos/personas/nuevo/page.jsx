"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { PersonaForm } from "@/components/comercial/personas";
import { PageHeader, Section } from "@/components/ui";
import { useToast } from "@/components/ui";
import { createPersona } from "@/services/apis/ventas";

export default function NuevaPersonaPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [saveErrors, setSaveErrors] = useState(null);

  const handleSave = async (formData) => {
    setSaving(true);
    setSaveErrors(null);
    try {
      const nueva = await createPersona(formData);
      showToast("Persona creada exitosamente", "success");
      router.push(`/ventas-crm/contactos/personas/${nueva.id}`);
    } catch (err) {
      if (err.status === 400 && err.data) {
        setSaveErrors(err.data);
      } else {
        const detail = err?.data?.detail || err?.message || "Error al crear la persona";
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
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Contactos", href: "/ventas-crm/contactos" },
          { label: "Personas", href: "/ventas-crm/contactos/personas" },
          { label: "Nueva Persona" },
        ]}
        subtitle="Registrar una nueva persona"
        subtitleClassName="text-blue-600"
      />

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-3xl mx-auto">
          <Section
            title="Datos de la Persona"
            subtitle="Los campos con * son obligatorios. Podés completar los opcionales después."
          >
            <PersonaForm
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
