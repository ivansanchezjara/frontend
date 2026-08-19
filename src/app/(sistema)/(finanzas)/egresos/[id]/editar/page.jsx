"use client";

import { useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader, Button, LoadingScreen } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getGasto, updateGasto } from "@/services/apis/finanzas";
import GastoForm from "@/components/finanzas/GastoForm";

export default function EditarGastoPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const handleError = useCallback(
    (err) => {
      if (err.status === 404) router.push("/egresos");
    },
    [router]
  );

  const {
    data: gasto,
    loading,
    execute: fetchGasto,
  } = useApi(getGasto, { auto: false, initialData: null, onError: handleError });

  useEffect(() => {
    if (id) fetchGasto(id);
  }, [id, fetchGasto]);

  const handleSubmit = async (payload) => {
    await updateGasto(id, payload);
    showToast("Gasto actualizado correctamente.", "success");
    router.push(`/egresos/${id}`);
  };

  if (loading || !gasto) return <LoadingScreen texto="Cargando gasto..." />;

  // No permitir editar anulados
  if (gasto.estado === "anulado") {
    router.push(`/egresos/${id}`);
    return null;
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Egresos", href: "/egresos" },
          { label: gasto.concepto, href: `/egresos/${id}` },
          { label: "Editar" },
        ]}
        subtitle="Editar gasto"
        subtitleClassName="text-purple-600"
      >
        <Link href={`/egresos/${id}`}>
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Volver al detalle
          </Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-2xl mx-auto">
          <GastoForm
            initialData={gasto}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/egresos/${id}`)}
            submitLabel="Guardar Cambios"
            submittingLabel="Guardando..."
          />
        </div>
      </main>
    </div>
  );
}
