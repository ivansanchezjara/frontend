"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import ClienteForm from "@/components/ventas/ClienteForm";
import { Button, PageHeader, Section } from "@/components/ui";
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
        showToast("Error al crear el cliente", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <PageHeader
        title="Nuevo Cliente"
        subtitle="Registrar un nuevo cliente en el sistema"
        subtitleClassName="text-emerald-600"
      >
        <Link href="/ventas-crm/clientes">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
      </PageHeader>

      <Section className="mt-6">
        <ClienteForm
          onSave={handleSave}
          saving={saving}
          errors={saveErrors}
          submitLabel="Crear Cliente"
          hideVendedor
          isNew
        />
      </Section>
    </div>
  );
}
