"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader, Button } from "@/components/ui";
import { useToast } from "@/components/ui";
import { createGasto } from "@/services/apis/finanzas";
import GastoForm from "@/components/finanzas/GastoForm";

export default function NuevoGastoPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (payload) => {
    await createGasto(payload);
    showToast("Gasto registrado exitosamente.", "success");
    router.push("/egresos");
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Egresos", href: "/egresos" },
          { label: "Nuevo Gasto" },
        ]}
        subtitle="Registrar gasto"
        subtitleClassName="text-purple-600"
      >
        <Link href="/egresos">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Volver
          </Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-2xl mx-auto">
          <GastoForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/egresos")}
            submitLabel="Registrar Gasto"
            submittingLabel="Guardando..."
          />
        </div>
      </main>
    </div>
  );
}
